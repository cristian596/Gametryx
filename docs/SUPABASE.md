# Configurar Supabase para VOLTA

Tiempo: unos 10 minutos. Plan gratuito.

## 1. Crear el proyecto
1. Entra a https://supabase.com e inicia sesión.
2. **New project** → nombre `volta`, región **South America (São Paulo)** (la más cercana a Colombia).
3. Guarda la contraseña de la base de datos en tu gestor de contraseñas. No la pegues en el chat ni en el código.

## 2. Copiar las claves a `.env.local`
En **Project Settings → API Keys**:

| Variable en `.env.local` | Dónde está |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | API Keys → Publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | API Keys → Secret keys (`sb_secret_…`) |

La clave secreta salta todas las reglas de seguridad: solo va en `.env.local` y en las variables de Vercel. Nunca en el código ni con prefijo `NEXT_PUBLIC_`.

## 3. Crear las tablas
En **SQL Editor → New query**, pega y ejecuta **en este orden** el contenido de:
1. `supabase/migrations/20261112000100_schema.sql`
2. `supabase/migrations/20261112000200_rls.sql`
3. `supabase/migrations/20261112000300_functions.sql`
4. `supabase/migrations/20261113000100_otp_attempts.sql`
5. `supabase/seed.sql` (productos de ejemplo)

Si cambias el catálogo de ejemplo, regenera el seed con `npm run db:seed:generate`.

## 4. Comprobar
Reinicia `npm run dev`. El home debe mostrar los mismos productos, ahora leídos de Supabase.

## 5. Crear tu cuenta de administrador
1. **Authentication → Users → Add user → Create new user**: tu correo y una contraseña fuerte (guárdala en tu gestor). Marca **Auto Confirm User**.
2. En el **SQL Editor**, dale el rol de admin:

```sql
update public.profiles set es_admin = true where id = (select id from auth.users where email = 'TU_CORREO');
```

3. Entra a `/admin` (en local: http://localhost:3000/admin) con ese correo y contraseña.

Una cuenta sin `es_admin` que intente entrar a `/admin` ve una página 404.

## 6. Cuentas de clientes (registro y recuperar contraseña)
1. **Authentication → URL Configuration**
   - **Site URL**: la URL pública (en local `http://localhost:3000`; en producción el dominio).
   - **Redirect URLs**: agrega `http://localhost:3000/**` y, al publicar, `https://TU-DOMINIO/**` (y la URL de Vercel si la usas).
2. **Authentication → Sign In / Providers → Email**: deja activo **Confirm email** y **Secure email change**.
   En **Password** pon la longitud mínima en 8 (la tienda ya exige letras y números).
3. **Correo propio con Resend (SMTP)**: el correo incluido en Supabase solo envía unos pocos correos por hora,
   únicamente a los miembros del equipo y sin poder editar las plantillas. Para que lleguen los códigos:
   1. Crea una cuenta gratis en resend.com (3.000 correos al mes) y en **API Keys → Create API key** crea una
      clave con permiso **Sending access**. Cópiala directo al punto 2; no la guardes en el código.
   2. En Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
      - **Sender email**: para pruebas `onboarding@resend.dev` (solo entrega a tu propio correo de Resend);
        para lanzar, un correo de tu dominio verificado en Resend (por ejemplo `no-responder@TU-DOMINIO`).
      - **Sender name**: `VOLTA`
      - **Host** `smtp.resend.com` · **Port** `465` · **Username** `resend` · **Password**: la API key de Resend.
   3. **Authentication → Rate Limits**: sube **Rate limit for sending emails** a 30 por hora (o lo que necesites).
4. **Códigos de 6 dígitos** (registro y recuperar contraseña se hacen con código, sin enlaces):
   1. **Authentication → Sign In / Providers → Email**: **Email OTP Expiration** en `900` segundos (15 minutos)
      y **Email OTP Length** en `6`.
   2. **Authentication → Emails → Templates**, pega el HTML de cada archivo (el asunto está en el comentario de arriba):

      | Plantilla | Archivo |
      |---|---|
      | Confirm sign up | `supabase/templates/codigo-registro.html` |
      | Reset password | `supabase/templates/codigo-recuperar.html` |

   3. En el **SQL Editor** ejecuta `supabase/migrations/20261113000100_otp_attempts.sql` (cuenta los 3 intentos por código).
5. **Change email address** (cambiar correo desde Mis datos sigue con enlace): en esa plantilla usa este enlace para
   que funcione aunque se abra en otro navegador:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/cuenta/datos%3Faviso%3Dcorreo`

## Qué protege la base de datos (RLS)
- Cualquiera puede **leer** el catálogo activo y las reseñas aprobadas.
- Cada usuario solo ve **sus** pedidos, direcciones, favoritos y perfil, y no puede darse permisos de admin.
- Pedidos, cotizaciones y consentimientos los **escribe el servidor**, nunca el navegador.
- El stock se descuenta con `confirmar_pago()`, que es atómica: dos personas no pueden comprar la última unidad.
