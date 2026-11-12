# VOLTA — Arquitectura y sistema de diseño (v0.1)

Tienda online en Colombia de PC ensamblados gamer, componentes, monitores, periféricos y gameroom.
Nombre y logo provisionales. Moneda COP. Idioma de la interfaz: español (Colombia).

---

## 1. Decisiones de arquitectura (ADR resumido)

| Decisión | Elección | Por qué | Alternativa descartada |
|---|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | HTML ya renderizado, ISR para catálogo, SEO, buen manejo de imágenes | Vite SPA: peor SEO y primera carga más lenta |
| Estilos | **Tailwind CSS v4** (tokens en `@theme`) | Requisito del proyecto; tokens como variables CSS | CSS propio o CSS-in-JS |
| Base de datos y login | **Supabase (Postgres + Auth + Storage)** | Cuentas, pedidos, favoritos y direcciones sin montar servidor propio; RLS | API Express propia (más trabajo, mismo resultado) |
| Estado del carrito | **Zustand + localStorage** (se sincroniza con la BD al iniciar sesión) | Carrito instantáneo sin ir al servidor | Carrito solo en servidor (lento) |
| Validación | **Zod** en cliente y servidor | Un solo esquema para formularios y API | Validación manual |
| Slider | **Embla Carousel** | ~5 KB, accesible, táctil | Swiper (más pesado) |
| Íconos | **lucide-react** (importación por ícono) | Árbol sacudible, ligero | Font icons |
| Pagos | **Wompi** detrás de una interfaz `PaymentProvider` | Se construye ahora, se configura después | Acoplar el checkout a Wompi |
| Despliegue | **Vercel** | Integración nativa con Next.js | — |

### Presupuesto de rendimiento
- LCP < 2,5 s en 4G móvil · CLS < 0,1 · INP < 200 ms.
- JS inicial del home < 170 KB (gzip). Todo lo no crítico se carga bajo demanda.
- Solo la primera diapositiva del hero lleva `priority`. El resto, `loading="lazy"`.
- Imágenes siempre con `next/image`, con `width/height` o `fill` + `sizes`.
- Fuentes con `next/font` (sin parpadeo, sin petición externa a Google).
- Sin video en el hero. Sin librerías de animación pesadas: CSS primero; `motion` solo donde haga falta.

---

## 2. Estructura de carpetas

```
volta/
├─ docs/                      # ARQUITECTURA.md y decisiones
├─ public/
│  ├─ brand/                  # volta-logo.svg, volta-icon.svg
│  └─ placeholders/
├─ supabase/
│  ├─ migrations/             # SQL versionado
│  └─ seed.sql                # datos de ejemplo
└─ src/
   ├─ app/
   │  ├─ layout.tsx           # fuentes, metadata base, Navbar, Footer, WhatsAppButton
   │  ├─ page.tsx             # Home (todas las secciones)
   │  ├─ [categoria]/page.tsx # pc-gaming, gameroom, monitores, perifericos (con filtros)
   │  ├─ producto/[slug]/page.tsx
   │  ├─ armar-pc/page.tsx
   │  ├─ cotizacion/page.tsx
   │  ├─ contacto/page.tsx
   │  ├─ carrito/page.tsx
   │  ├─ checkout/page.tsx
   │  ├─ (auth)/iniciar-sesion/ · registro/
   │  ├─ cuenta/              # pedidos · favoritos · datos · direcciones (protegido)
   │  ├─ (legal)/terminos · privacidad · cookies
   │  ├─ api/
   │  │  ├─ quotes/route.ts          # recibe cotizaciones
   │  │  └─ wompi/webhook/route.ts   # stub, sin credenciales
   │  ├─ sitemap.ts · robots.ts
   │  └─ admin/               # Fase 6
   ├─ components/
   │  ├─ ui/                  # Button, Input, Badge, Card, Dialog, Tabs, Skeleton…
   │  ├─ layout/              # Navbar, MobileNav, Footer, WhatsAppButton, CookieBanner
   │  ├─ home/                # HeroSlider, PaymentMethods, FeaturedPCs, NewProducts, TopMonitors,
   │  │                       # TopPeripherals, BuilderCTA, TrendingGaming, QuoteSection, Reviews, InfoStrip
   │  ├─ product/             # ProductCard, ProductGrid, FilterPanel, SpecTable, PriceTag, StockBadge
   │  ├─ builder/             # PartPicker, CompatibilityAlerts, BuildSummary
   │  ├─ cart/
   │  └─ account/
   ├─ lib/
   │  ├─ supabase/            # client.ts, server.ts, middleware.ts
   │  ├─ payments/            # types.ts (PaymentProvider), wompi.ts (stub), index.ts
   │  ├─ compat/              # motor de compatibilidad del armador
   │  ├─ filters/             # parseo de filtros desde la URL
   │  ├─ format.ts            # formatCOP(), formatInstallment()
   │  └─ seo.ts               # helpers de metadata y JSON-LD
   ├─ store/                  # cart.ts, wishlist.ts, builder.ts (Zustand)
   ├─ data/                   # catalog.mock.ts (fallback sin BD)
   └─ types/
```

---

## 3. Mapa de rutas y estrategia de renderizado

| Ruta | Render | Notas |
|---|---|---|
| `/` | ISR (revalida 5 min) | Secciones con datos del catálogo |
| `/[categoria]` | ISR + filtros por URL | `?marca=asus&precio=1000000-3000000&orden=precio-asc` |
| `/producto/[slug]` | ISR + `generateStaticParams` | JSON-LD `Product` + `Offer` |
| `/armar-pc` | Cliente (isla interactiva) | Carga las piezas por categoría, bajo demanda |
| `/cotizacion`, `/contacto` | Estática + formulario | Server Action o `/api/quotes` |
| `/carrito`, `/checkout` | Dinámica | Lee carrito local y sesión |
| `/cuenta/*` | Dinámica, protegida por middleware | RLS en BD |
| Legales | Estática | |

Los filtros viven en la URL: se pueden compartir, funcionan con el botón Atrás y Google los puede indexar (con `canonical` a la versión sin filtros).

---

## 4. Modelo de datos (Supabase / Postgres)

```
profiles        id (= auth.users.id), nombre, telefono, created_at
addresses       id, user_id, alias, departamento, ciudad, direccion, complemento, es_principal
categories      id, slug, nombre, parent_id, orden
brands          id, slug, nombre, logo_url
products        id, slug, nombre, descripcion, categoria_id, marca_id,
                tipo  ('pc_ensamblado'|'componente'|'monitor'|'periferico'|'gameroom'),
                precio_cop (int), precio_anterior_cop (int null), stock (int),
                specs (jsonb), tags (text[]), es_nuevo, es_destacado, mas_vendido (int), activo
product_images  id, product_id, url, alt, orden
build_parts     product_id (pc_ensamblado), part_id (componente), cantidad
                -- composición de cada PC ensamblado
pc_benchmarks   product_id, juego, resolucion, fps_estimado
compat_attrs    product_id, socket, tipo_ram ('DDR4'|'DDR5'), tdp_w, potencia_w, factor_forma,
                largo_mm, alto_cooler_mm, slots_ram, m2_slots
wishlist        user_id, product_id          -- una sola lista (favoritos = lista de deseos)
orders          id, user_id, estado ('pendiente'|'pagado'|'enviado'|'entregado'|'cancelado'),
                total_cop, envio_cop, address_snapshot (jsonb), metodo_pago, wompi_ref, created_at
order_items     id, order_id, product_id, nombre_snapshot, precio_snapshot, cantidad
reviews         id, product_id null, user_id null, autor, rating, texto, verificada, aprobada
quotes          id, nombre, telefono, email, mensaje, build (jsonb null), estado, created_at
```

Reglas:
- **Precios en pesos enteros** (`int`), nunca decimales.
- `order_items` guarda un **snapshot** del nombre y el precio: si cambias el precio mañana, el pedido antiguo no cambia.
- **RLS activado en todas las tablas.** Lectura pública solo de catálogo activo y reseñas aprobadas. `orders`, `addresses`, `wishlist` y `profiles`: solo el dueño (`auth.uid() = user_id`). `quotes`: inserción pública con límite de frecuencia, lectura solo admin.
- `specs` es `jsonb` con claves **normalizadas por tipo** (por ejemplo, monitor: `tamano_pulgadas`, `hz`, `panel`, `resolucion`). De ahí salen los filtros automáticamente.

---

## 5. Motor de compatibilidad del armador (`lib/compat`)

Funciones puras y testeables. Entrada: la selección actual. Salida: `{ errores[], avisos[], potenciaEstimadaW, total }`.

| Regla | Tipo |
|---|---|
| `cpu.socket === board.socket` | error |
| `ram.tipo_ram === board.tipo_ram` | error |
| `fuente.potencia_w >= (cpu.tdp + gpu.tdp + 150) * 1.2` | error si menor; aviso si está justa |
| `gpu.largo_mm <= gabinete.max_gpu_mm` | error |
| `cooler.alto_mm <= gabinete.max_cooler_mm` | error |
| `board.factor_forma` cabe en el gabinete (ATX/mATX/ITX) | error |
| Falta un componente obligatorio (CPU, board, RAM, almacenamiento, fuente, gabinete) | aviso |
| CPU sin gráficos integrados y sin GPU | aviso |

Salidas del armador: guardar el armado, **enviarlo como cotización** (`/api/quotes`) y compartirlo por WhatsApp con el resumen en texto.

---

## 6. Pagos (Wompi, sin configurar)

```ts
// lib/payments/types.ts
export interface PaymentProvider {
  createCheckout(order: OrderInput): Promise<{ redirectUrl: string; reference: string }>;
  verifyWebhook(req: Request): Promise<{ reference: string; status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR' }>;
}
```

- `wompi.ts` implementa la interfaz pero **lanza un error claro si faltan las variables** (`WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`).
- Todas van en `.env.local` (vacías) y en `.env.example` (documentadas). **Nunca** en el código ni en el repositorio.
- El precio final se calcula **en el servidor**; el cliente nunca decide cuánto se cobra.
- El webhook valida la firma del evento antes de cambiar el estado del pedido.
- Métodos mostrados en la web: Addi, Bre-B, Vanti (financiación en factura de gas), efectivo. Mientras no estén integrados, aparecen como informativos y el checkout deriva a un asesor por WhatsApp.

---

## 7. Seguridad (mínimos)
- RLS en todas las tablas. La clave `service_role` solo en el servidor.
- Validar todo con Zod en servidor, aunque ya se valide en cliente.
- Cabeceras de seguridad en `next.config` (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`).
- Límite de frecuencia en `/api/quotes` y en login.
- Contraseñas gestionadas por Supabase Auth (nunca guardadas por nosotros).
- Cambio de correo y contraseña exige sesión reciente.

## 8. SEO
- `generateMetadata` por página: title, description, Open Graph, `canonical`.
- JSON-LD: `Organization`, `WebSite` con buscador, `Product`/`Offer`, `BreadcrumbList`.
- `sitemap.ts` y `robots.ts` dinámicos. Un solo `h1` por página, `alt` descriptivo en imágenes.

---

## 9. Sistema de diseño — tokens

### 9.1 Color (paleta A "Voltaje")

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#0A0B0F` | Fondo de página |
| `surface` | `#14161D` | Tarjetas, navbar |
| `surface-2` | `#1B1E27` | Elementos elevados, inputs |
| `border` | `#232733` | Bordes y divisores |
| `text` | `#F2F4F8` | Texto principal |
| `muted` | `#9AA3B2` | Texto secundario |
| `primary` | `#C6FF3D` | Botones de compra, precios, foco |
| `primary-hover` | `#D6FF6B` | Hover |
| `primary-press` | `#A8E022` | Presionado |
| `on-primary` | `#0A0B0F` | Texto sobre verde (siempre negro) |
| `accent` | `#22D3EE` | Enlaces, información |
| `danger` | `#FF4D2E` | Descuentos, errores |
| `warning` | `#FFB020` | Poco stock |
| `success` | `#3DDC84` | Confirmaciones |

Reglas: texto sobre `primary` siempre `on-primary`. El verde no se usa como color de texto largo. El descuento va en `danger`, nunca en verde.

### 9.2 `src/app/globals.css` (Tailwind v4)

```css
@import "tailwindcss";

@theme {
  /* Color */
  --color-bg: #0a0b0f;
  --color-surface: #14161d;
  --color-surface-2: #1b1e27;
  --color-border: #232733;
  --color-text: #f2f4f8;
  --color-muted: #9aa3b2;
  --color-primary: #c6ff3d;
  --color-primary-hover: #d6ff6b;
  --color-primary-press: #a8e022;
  --color-on-primary: #0a0b0f;
  --color-accent: #22d3ee;
  --color-danger: #ff4d2e;
  --color-warning: #ffb020;
  --color-success: #3ddc84;

  /* Tipografía (las variables las define next/font) */
  --font-display: var(--font-chakra), "Barlow Condensed", system-ui, sans-serif;
  --font-sans: var(--font-manrope), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  /* Radios */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Sombras y brillo (sobrio: el brillo es la excepción, no la regla) */
  --shadow-card: 0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 8px 24px -12px rgb(0 0 0 / 0.6);
  --shadow-glow: 0 0 0 1px rgb(198 255 61 / 0.35), 0 8px 32px -8px rgb(198 255 61 / 0.35);

  /* Movimiento */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 500ms;
}

@layer base {
  html { background: var(--color-bg); color: var(--color-text); color-scheme: dark; }
  body { font-family: var(--font-sans); -webkit-tap-highlight-color: transparent; }
  :focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 9.3 Tipografía

| Rol | Fuente | Tamaños (móvil → escritorio) |
|---|---|---|
| Títulos (`h1`–`h3`) | Chakra Petch 600/700 | h1 32→64, h2 26→44, h3 20→28 |
| Cuerpo | Manrope 400/500/600 | 15→16 |
| Precios y especificaciones | JetBrains Mono con `tabular-nums` | 14→18 (precio principal 24→32) |
| Etiquetas / overlines | Manrope 700, mayúsculas, tracking amplio | 11→12 |

### 9.4 Espaciado, rejilla y puntos de quiebre
- Escala base de 4 px (Tailwind por defecto).
- Contenedor máximo `1280px`, relleno lateral 16 → 24 → 32.
- Separación vertical entre secciones: `py-16` móvil, `py-24` escritorio.
- Puntos de quiebre: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- Objetivos táctiles mínimos de 44×44 px.

### 9.5 Componentes base (variantes y estados)

| Componente | Variantes | Estados obligatorios |
|---|---|---|
| `Button` | `primary` · `secondary` (borde) · `ghost` · `danger` · tamaños `sm/md/lg` | hover, active, focus, disabled, loading |
| `Input` / `Select` | normal, con ícono, con error | focus, error, disabled |
| `Badge` | `nuevo` · `oferta` · `poco-stock` · `agotado` | — |
| `ProductCard` | pc / componente / periférico | hover, agotado, en favoritos |
| `PriceTag` | normal, con tachado y % de descuento, con cuota Addi | — |
| `Dialog` / `Sheet` | filtros móvil, carrito lateral | abrir/cerrar con animación, `Esc`, foco atrapado |
| `Skeleton` | tarjeta, fila, hero | — |

### 9.6 Movimiento
- Solo `transform` y `opacity`. Duraciones: 150 / 250 / 500 ms con `--ease-out-quart`.
- **Botón de WhatsApp:** salto con keyframes CSS (3 rebotes cada ~6 s, pausa al hover). Respeta `prefers-reduced-motion`.
- Aparición de secciones al entrar en pantalla: fade + 12 px de desplazamiento, una sola vez.
- Slider del hero: transición de 500 ms, autoplay 6 s, pausa al hover y al enfocar.

### 9.7 Tono de los textos (español de Colombia)
- Directo y cercano, con "tú". Evitar jerga excesiva y signos de exclamación en cadena.
- Botones con verbo claro: "Agregar al carrito", "Cotizar este PC", "Armar mi PC".
- Errores que dicen qué pasó y cómo arreglarlo. Estados vacíos con una acción siguiente.

---

## 10. Hoja de ruta por fases

| Fase | Entrega | Criterio de "hecha" |
|---|---|---|
| **1. Base** | Proyecto Next + Tailwind + tokens + fuentes, layout con Navbar fijo, Footer, WhatsApp, componentes `ui/`, datos mock | `npm run build` sin errores; navbar y footer completos en móvil y escritorio |
| **2. Home** | Hero slider (3 slides) + todas las secciones del archivo de requisitos | Home completo con datos mock; LCP en rango |
| **3. Catálogo** | Páginas de categoría con filtros por URL, página de producto, comparador | Filtros funcionan, se comparten por URL |
| **4. Armador y cotización** | `armar-pc`, motor de compatibilidad con tests, formulario de cotización | Tests de reglas en verde |
| **5. Cuenta y compra** | Supabase (auth + RLS), carrito, checkout con `PaymentProvider`, área de cuenta | Flujo registro → carrito → pedido (sin cobrar) |
| **6. Admin y pulido** | Panel de productos, SEO completo, accesibilidad, `break-ui`, animaciones, pasada móvil | Lighthouse ≥ 90 en móvil |

---

## 11. Pendientes por definir (no bloquean la Fase 1)
- Nombre y logo definitivos (revisar marca y dominio).
- Cómo se cobra Vanti y el efectivo (contra entrega o en punto).
- Fotos y datos reales de productos.
- Textos legales revisados por un abogado.
