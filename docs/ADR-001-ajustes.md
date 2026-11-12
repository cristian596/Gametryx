# ADR-001: Ajustes a la arquitectura base de VOLTA

**Estado:** Aceptado
**Fecha:** 2026-11-11
**Decide:** dueño de VOLTA

## Contexto
`ARQUITECTURA.md` v0.1 propone Next.js (App Router) + TypeScript + Tailwind v4 + Supabase + Zustand + Wompi + Vercel. Se mantiene esa base. Al revisarla se encontraron puntos que fallarían o costarían retrabajo. Este documento registra los cambios.

El proyecto se creó con **Next.js 16.4.6**, React 19.3 y Tailwind 4.3. `create-next-app` activa por defecto **Cache Components** (`cacheComponents: true`) y **Partial Prefetching**. Eso reemplaza el modelo ISR (`revalidate = 300`) que asume `ARQUITECTURA.md`.

## Decisiones

| # | Problema | Decisión |
|---|---|---|
| 1 | ISR en `/[categoria]` con filtros en la URL no funciona: leer `searchParams` vuelve la página dinámica. Además, con Cache Components el modelo ISR ya no aplica. | Datos de catálogo cacheados con `'use cache'` + `cacheLife` + `cacheTag` (`catalog`, `product:<slug>`). La parte que depende de los filtros se renderiza por petición dentro de `<Suspense>`; el resto de la página es estática. |
| 2 | Revalidar cada 5 min deja precios y stock viejos después de editar. | Revalidación bajo demanda (`revalidateTag` / `updateTag`) al guardar en el admin. `cacheLife` de minutos solo como respaldo. |
| 3 | `/[categoria]` en la raíz atrapa URLs mal escritas. | Solo slugs conocidos (`generateStaticParams`); cualquier otro → `notFound()`. Verificar en Fase 3b la forma compatible con Cache Components. |
| 4 | Canonical a "sin filtros" para todo pierde páginas útiles. | Canonical propio para un filtro simple (marca o subcategoría); `noindex,follow` para combinaciones, orden y paginación. |
| 5 | CSP con nonce obliga a renderizar todo por petición. | CSP sin nonce, primero en `Report-Only`, se endurece en la Fase 7. |
| 6 | Límite de frecuencia en memoria no sirve en serverless. | Limitador en Postgres (tabla `rate_limits` + función SQL) + campo trampa. Cloudflare Turnstile solo si llega spam. |
| 7 | `compat_attrs` incompleto. | Añadir `max_gpu_mm`, `max_cooler_mm`, `formatos_soportados[]` (gabinete), `tiene_igpu` (CPU), `tdp_w` (GPU). Esquemas Zod por tipo para `specs`. |
| 8 | Sincronizar carrito con la BD al iniciar sesión agrega alcance y conflictos. | v1: carrito solo local (Zustand + localStorage); el contador se pinta tras montar. El servidor siempre recalcula precios. |
| 9 | Usar datos mock hasta la Fase 5 obliga a rehacer filtros. | Capa de repositorio `src/lib/catalog/` con una interfaz. Mock en Fases 1-2; Supabase desde la Fase 3a. |
| 10 | Next 16 renombró `middleware.ts` → `proxy.ts`. | Usar `src/proxy.ts`. |
| 11 | "Vanti/Codensa": Codensa es energía, no gas. | Mostrar solo "Vanti"; confirmar cobertura antes de lanzar. |
| 12 | Cuota Addi fija = riesgo de publicidad engañosa. | Solo el sello "Paga a cuotas con Addi". |
| 13 | Faltan rol admin, autorizaciones de datos y retracto. | `profiles.es_admin`, tabla `consents`, `orders.retracto_solicitado_at`. |
| 14 | Dos personas pueden comprar la última unidad. | Función SQL `confirmar_pago(order_id)` en una transacción: `UPDATE products SET stock = stock - n WHERE id = … AND stock >= n`; si un ítem falla, se revierte todo y el pedido pasa a `requiere_revision`. La llama el webhook (o el admin al marcar "pagado"). El checkout valida disponibilidad antes de crear el pedido. |
| 15 | Impuestos. | Precios guardados con IVA incluido; `PriceTag` muestra "IVA incluido". Campo `iva_pct` (19 % por defecto) para la facturación. |
| 16 | Correos de pedido. | `src/lib/email/` con interfaz `EmailProvider`; Resend vía `fetch` (sin dependencia). Sin clave → se registran en consola. SMTP propio en Supabase antes de lanzar. |
| 17 | Imágenes. | Fotos de Unsplash/Pexels (licencia libre) en `public/images/`, en WebP, con `public/images/CREDITOS.md`. Placeholder SVG propio donde no haya foto adecuada. |
| 18 | `.gitignore` de la plantilla ignora `.env*`, incluido `.env.example`. | Añadir `!.env.example` cuando se cree (Fase 6b). |

## Consecuencias
- Más fácil: páginas de catálogo rápidas aunque se filtren; cambiar de mock a Supabase toca un solo archivo; el stock no se vende dos veces.
- Más difícil: hay que etiquetar bien cada consulta cacheada para revalidarla.
- A revisar: CSP definitiva (Fase 7), proveedor de factura electrónica DIAN, hosting comercial.
