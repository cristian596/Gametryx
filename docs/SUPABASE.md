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
4. `supabase/seed.sql` (productos de ejemplo)

Si cambias el catálogo de ejemplo, regenera el seed con `npm run db:seed:generate`.

## 4. Comprobar
Reinicia `npm run dev`. El home debe mostrar los mismos productos, ahora leídos de Supabase.

## 5. Volverte administrador (para la Fase 4)
Después de registrarte en la tienda (Fase 6a) o creando el usuario en **Authentication → Users**, ejecuta en el SQL Editor:

```sql
update public.profiles set es_admin = true where id = (select id from auth.users where email = 'TU_CORREO');
```

## Qué protege la base de datos (RLS)
- Cualquiera puede **leer** el catálogo activo y las reseñas aprobadas.
- Cada usuario solo ve **sus** pedidos, direcciones, favoritos y perfil, y no puede darse permisos de admin.
- Pedidos, cotizaciones y consentimientos los **escribe el servidor**, nunca el navegador.
- El stock se descuenta con `confirmar_pago()`, que es atómica: dos personas no pueden comprar la última unidad.
