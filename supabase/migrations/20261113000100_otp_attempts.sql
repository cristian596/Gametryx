-- VOLTA · Intentos por código de verificación (confirmar registro, recuperar contraseña)
-- Cada código enviado tiene su propio contador; al llegar al máximo se bloquea hasta pedir uno nuevo.
-- Se reutiliza la tabla rate_limits: key = 'otp:<finalidad>:<hash del correo>', window_start = cuándo se envió.

-- Al enviar un código: reinicia el contador de ese correo y finalidad
create or replace function public.otp_start(p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rate_limits where key = p_key;
  insert into public.rate_limits (key, window_start, hits) values (p_key, now(), 0);
end;
$$;

-- Al verificar: gasta un intento de forma atómica. Devuelve el número de intento (1..p_max)
-- o null si ya no quedan (o si no hay código vigente: más de 1 hora desde el envío).
create or replace function public.otp_attempt(p_key text, p_max integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  update public.rate_limits
     set hits = hits + 1
   where key = p_key
     and hits < p_max
     and window_start > now() - interval '1 hour'
  returning hits into v_hits;
  return v_hits;
end;
$$;

revoke execute on function public.otp_start(text) from public, anon, authenticated;
revoke execute on function public.otp_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.otp_start(text) to service_role;
grant execute on function public.otp_attempt(text, integer) to service_role;
