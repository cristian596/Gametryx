# Pendientes para vender de verdad

Cosas que no son código pero hay que resolver antes de abrir la tienda.

## Legal y tributario
- [ ] **Factura electrónica DIAN.** Obligatoria para vender. Preguntar al contador qué proveedor tecnológico usar. El modelo de datos guarda `iva_pct` y snapshots de precio para integrarla después.
- [ ] Revisión por abogado de términos, tratamiento de datos (Ley 1581 de 2012), cookies, garantías y retracto (Ley 1480 de 2011).
- [ ] Registro de bases de datos ante la SIC, si aplica.
- [ ] Razón social, NIT y dirección reales en `src/config/site.ts`.

## Operación
- [ ] Cómo se cobra el **efectivo** (contra entrega, punto físico o consignación).
- [ ] Confirmar cobertura de financiación **Vanti**.
- [ ] Tarifa de envío real (hoy es un valor de ejemplo en `site.ts`).
- [ ] Datos de contacto reales: WhatsApp, correo, redes.
- [ ] Fotos y datos reales de productos (cargarlos desde el panel admin).
- [ ] Configuraciones reales de PC ensamblados (hoy: niveles 1080p / 1440p / 4K con precios de ejemplo).

## Técnico
- [ ] Dominio definitivo y revisión de marca "VOLTA".
- [ ] Hosting comercial (el plan Hobby de Vercel no permite uso comercial).
- [ ] Claves de Wompi (producción) en variables de entorno del hosting.
- [ ] SMTP propio (Resend) en Supabase para correos de contraseña.
- [ ] Google Search Console: verificar dominio y enviar sitemap.
- [ ] Analítica cargada solo tras aceptar cookies.
