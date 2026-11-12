import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

/**
 * Cliente con la clave secreta (sb_secret_…): salta la RLS.
 * Solo en el servidor y solo para lo que el usuario no puede hacer por sí mismo:
 * crear pedidos, guardar cotizaciones, confirmar pagos, límite de frecuencia.
 * `server-only` hace fallar el build si alguien lo importa desde el navegador.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY. Cópiala de Supabase → Project Settings → API Keys → Secret keys en .env.local. Nunca la expongas con NEXT_PUBLIC_.",
    );
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
