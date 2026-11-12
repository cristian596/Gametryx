import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

/**
 * Cliente anónimo sin cookies, para leer el catálogo público.
 * Al no depender de la sesión, se puede usar dentro de funciones con 'use cache'.
 */
export function createPublicClient() {
  const { url, key } = requireSupabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
