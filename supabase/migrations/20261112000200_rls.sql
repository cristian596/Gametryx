-- VOLTA · Row Level Security
-- Regla: RLS activo en todas las tablas. Lectura pública solo de catálogo activo y reseñas aprobadas.
-- Pedidos, cotizaciones y consentimientos se escriben desde el servidor (clave secreta), nunca desde el navegador.

alter table public.profiles       enable row level security;
alter table public.addresses      enable row level security;
alter table public.categories     enable row level security;
alter table public.brands         enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.build_parts    enable row level security;
alter table public.pc_benchmarks  enable row level security;
alter table public.compat_attrs   enable row level security;
alter table public.wishlist       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.reviews        enable row level security;
alter table public.quotes         enable row level security;
alter table public.consents       enable row level security;
alter table public.rate_limits    enable row level security;

-- ¿El usuario actual es administrador? security definer para no depender de la RLS de profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select es_admin from public.profiles where id = (select auth.uid())), false);
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ───────────── Perfiles ─────────────
create policy "perfil: leer el propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "perfil: editar el propio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Nadie se puede dar permisos de admin a sí mismo: solo nombre y teléfono son editables
revoke update on public.profiles from authenticated;
grant update (nombre, telefono) on public.profiles to authenticated;

-- ───────────── Direcciones y favoritos (solo el dueño) ─────────────
create policy "direcciones: dueño" on public.addresses
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "favoritos: dueño" on public.wishlist
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ───────────── Catálogo: lectura pública, escritura admin ─────────────
create policy "categorias: lectura pública" on public.categories for select to anon, authenticated using (true);
create policy "marcas: lectura pública" on public.brands for select to anon, authenticated using (true);
create policy "productos: lectura pública de activos" on public.products
  for select to anon, authenticated using (activo or public.is_admin());

create policy "imagenes: lectura pública" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.activo or public.is_admin())));
create policy "armado: lectura pública" on public.build_parts for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.activo or public.is_admin())));
create policy "fps: lectura pública" on public.pc_benchmarks for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.activo or public.is_admin())));
create policy "compatibilidad: lectura pública" on public.compat_attrs for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.activo or public.is_admin())));

create policy "categorias: admin" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "marcas: admin" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "productos: admin" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "imagenes: admin" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "armado: admin" on public.build_parts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "fps: admin" on public.pc_benchmarks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "compatibilidad: admin" on public.compat_attrs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── Pedidos: el dueño lee, el servidor escribe, el admin gestiona ─────────────
create policy "pedidos: leer los propios" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "pedidos: admin actualiza" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "items: leer los de mis pedidos" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())));

-- ───────────── Reseñas ─────────────
create policy "reseñas: lectura pública de aprobadas" on public.reviews
  for select to anon, authenticated using (aprobada or public.is_admin());
create policy "reseñas: admin" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── Cotizaciones y consentimientos: solo admin lee ─────────────
create policy "cotizaciones: admin" on public.quotes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "consentimientos: admin lee" on public.consents
  for select to authenticated using (public.is_admin());

-- rate_limits: sin políticas → solo accesible por funciones security definer y la clave secreta.

-- ───────────── Storage: imágenes de productos ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "imagenes de producto: admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "imagenes de producto: admin edita" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "imagenes de producto: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
