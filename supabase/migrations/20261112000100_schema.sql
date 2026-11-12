-- VOLTA · Esquema base
-- Precios en pesos colombianos enteros, IVA incluido. Ver docs/ARQUITECTURA.md §4 y docs/ADR-001-ajustes.md.

-- ───────────── Utilidades ─────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────── Usuarios ─────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text check (char_length(nombre) <= 120),
  telefono    text check (char_length(telefono) <= 20),
  es_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, telefono)
  values (
    new.id,
    left(new.raw_user_meta_data ->> 'nombre', 120),
    left(new.raw_user_meta_data ->> 'telefono', 20)
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  alias         text not null default 'Casa' check (char_length(alias) <= 40),
  destinatario  text not null check (char_length(destinatario) between 2 and 120),
  telefono      text not null check (char_length(telefono) <= 20),
  departamento  text not null check (char_length(departamento) <= 60),
  ciudad        text not null check (char_length(ciudad) <= 80),
  direccion     text not null check (char_length(direccion) between 5 and 160),
  complemento   text check (char_length(complemento) <= 160),
  es_principal  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
-- Solo una dirección principal por usuario
create unique index addresses_one_main_idx on public.addresses (user_id) where es_principal;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ───────────── Catálogo ─────────────
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre       text not null,
  descripcion  text,
  parent_id    uuid references public.categories (id) on delete restrict,
  orden        int not null default 0
);
create index categories_parent_idx on public.categories (parent_id);

create table public.brands (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre    text not null,
  logo_url  text
);

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre               text not null check (char_length(nombre) between 3 and 200),
  descripcion          text not null default '',
  categoria_id         uuid not null references public.categories (id) on delete restrict,
  marca_id             uuid references public.brands (id) on delete set null,
  tipo                 text not null check (tipo in ('pc_ensamblado', 'componente', 'monitor', 'periferico', 'gameroom')),
  precio_cop           integer not null check (precio_cop >= 0),
  precio_anterior_cop  integer check (precio_anterior_cop is null or precio_anterior_cop > 0),
  iva_pct              smallint not null default 19 check (iva_pct between 0 and 100),
  stock                integer not null default 0 check (stock >= 0),
  specs                jsonb not null default '{}'::jsonb,
  tags                 text[] not null default '{}',
  es_nuevo             boolean not null default false,
  es_destacado         boolean not null default false,
  mas_vendido          integer not null default 0 check (mas_vendido >= 0),
  activo               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index products_categoria_idx on public.products (categoria_id) where activo;
create index products_marca_idx on public.products (marca_id) where activo;
create index products_tags_idx on public.products using gin (tags);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text not null default '',
  orden       int not null default 0
);
create index product_images_product_idx on public.product_images (product_id, orden);

-- Composición de cada PC ensamblado
create table public.build_parts (
  product_id  uuid not null references public.products (id) on delete cascade,
  part_id     uuid not null references public.products (id) on delete restrict,
  cantidad    smallint not null default 1 check (cantidad > 0),
  primary key (product_id, part_id)
);

create table public.pc_benchmarks (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  juego         text not null,
  resolucion    text not null check (resolucion in ('1080p', '1440p', '4K')),
  fps_estimado  integer not null check (fps_estimado > 0),
  orden         int not null default 0
);
create index pc_benchmarks_product_idx on public.pc_benchmarks (product_id, orden);

-- Atributos del motor de compatibilidad del armador (Fase 5)
create table public.compat_attrs (
  product_id           uuid primary key references public.products (id) on delete cascade,
  socket               text,
  tipo_ram             text check (tipo_ram in ('DDR4', 'DDR5')),
  tdp_w                integer check (tdp_w > 0),
  potencia_w           integer check (potencia_w > 0),
  factor_forma         text check (factor_forma in ('ATX', 'mATX', 'ITX', 'E-ATX')),
  formatos_soportados  text[],
  largo_mm             integer check (largo_mm > 0),
  alto_cooler_mm       integer check (alto_cooler_mm > 0),
  max_gpu_mm           integer check (max_gpu_mm > 0),
  max_cooler_mm        integer check (max_cooler_mm > 0),
  slots_ram            smallint check (slots_ram > 0),
  m2_slots             smallint check (m2_slots >= 0),
  tiene_igpu           boolean
);

-- Una sola lista: favoritos = lista de deseos
create table public.wishlist (
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ───────────── Pedidos ─────────────
create table public.orders (
  id                      uuid primary key default gen_random_uuid(),
  numero                  bigint generated always as identity unique,
  user_id                 uuid references auth.users (id) on delete set null,
  estado                  text not null default 'pendiente'
                            check (estado in ('pendiente', 'pagado', 'requiere_revision', 'enviado', 'entregado', 'cancelado')),
  subtotal_cop            integer not null check (subtotal_cop >= 0),
  envio_cop               integer not null default 0 check (envio_cop >= 0),
  total_cop               integer not null check (total_cop >= 0),
  address_snapshot        jsonb not null,
  metodo_pago             text,
  wompi_ref               text unique,
  pagado_at               timestamptz,
  retracto_solicitado_at  timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Snapshot de nombre y precio: si el precio cambia mañana, el pedido no cambia
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  nombre_snapshot  text not null,
  precio_snapshot  integer not null check (precio_snapshot >= 0),
  iva_pct_snapshot smallint not null default 19,
  cantidad         integer not null check (cantidad between 1 and 99)
);
create index order_items_order_idx on public.order_items (order_id);

-- ───────────── Reseñas, cotizaciones, consentimientos ─────────────
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  order_id    uuid references public.orders (id) on delete set null,
  autor       text not null check (char_length(autor) between 2 and 80),
  ciudad      text check (char_length(ciudad) <= 80),
  rating      smallint not null check (rating between 1 and 5),
  texto       text not null check (char_length(texto) between 10 and 2000),
  verificada  boolean not null default false,
  aprobada    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id) where aprobada;

create table public.quotes (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null check (char_length(nombre) between 2 and 80),
  telefono     text not null check (char_length(telefono) <= 20),
  email        text check (char_length(email) <= 120),
  interes      text not null,
  presupuesto  text not null,
  mensaje      text check (char_length(mensaje) <= 1000),
  build        jsonb,
  estado       text not null default 'nueva' check (estado in ('nueva', 'en_proceso', 'respondida', 'cerrada')),
  created_at   timestamptz not null default now()
);
create index quotes_created_idx on public.quotes (created_at desc);

-- Autorizaciones de tratamiento de datos (Ley 1581 de 2012)
create table public.consents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users (id) on delete set null,
  quote_id         uuid references public.quotes (id) on delete set null,
  finalidad        text not null check (finalidad in ('registro', 'cotizacion', 'pedido', 'marketing')),
  version_politica text not null,
  origen           text not null,
  created_at       timestamptz not null default now()
);

-- Límite de frecuencia por clave (ip, correo…) en ventanas fijas
create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (key, window_start)
);
