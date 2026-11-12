-- VOLTA · Funciones del servidor
-- Ambas se ejecutan solo con la clave secreta (service_role) desde rutas del servidor.

-- ───────────── Límite de frecuencia ─────────────
-- Devuelve true si la petición está permitida. Ventanas fijas de p_window_seconds.
create or replace function public.rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Limpieza oportunista de ventanas viejas
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_hits <= p_max;
end;
$$;
revoke execute on function public.rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit(text, integer, integer) to service_role;

-- ───────────── Confirmar pago y descontar stock ─────────────
-- Atómico: descuenta el stock de todos los ítems o de ninguno.
-- Si falta stock de algún ítem (dos personas compraron la última unidad), el pedido queda en
-- 'requiere_revision' para que el admin reembolse o consiga la unidad. Idempotente: llamarla
-- dos veces con el mismo pedido no descuenta dos veces.
create or replace function public.confirmar_pago(p_order_id uuid, p_ref text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado text;
  v_item record;
begin
  -- Bloquea el pedido: dos webhooks simultáneos del mismo pago se procesan en fila
  select estado into v_estado from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'pedido % no existe', p_order_id using errcode = 'P0002';
  end if;
  if v_estado <> 'pendiente' then
    return v_estado;
  end if;

  begin
    -- Orden fijo por product_id para evitar interbloqueos entre pedidos que comparten productos
    for v_item in
      select product_id, sum(cantidad)::integer as cantidad
      from public.order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
      order by product_id
    loop
      update public.products
        set stock = stock - v_item.cantidad,
            mas_vendido = mas_vendido + v_item.cantidad
        where id = v_item.product_id and stock >= v_item.cantidad;
      if not found then
        raise exception 'sin stock' using errcode = 'P0001';
      end if;
    end loop;

    update public.orders
      set estado = 'pagado', pagado_at = now(), wompi_ref = coalesce(p_ref, wompi_ref)
      where id = p_order_id;
    return 'pagado';
  exception when sqlstate 'P0001' then
    -- El bloque se revierte (incluidos los descuentos ya hechos); se marca para revisión
    update public.orders
      set estado = 'requiere_revision', wompi_ref = coalesce(p_ref, wompi_ref)
      where id = p_order_id;
    return 'requiere_revision';
  end;
end;
$$;
revoke execute on function public.confirmar_pago(uuid, text) from public, anon, authenticated;
grant execute on function public.confirmar_pago(uuid, text) to service_role;
