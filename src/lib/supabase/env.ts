/**
 * Variables públicas de Supabase. La clave publicable (sb_publishable_…) es segura en el navegador:
 * la protección real es la RLS. Se acepta también el nombre antiguo ANON_KEY.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export function requireSupabaseEnv() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Cópialas de Supabase → Project Settings → API Keys en .env.local (ver .env.example).",
    );
  }
  return { url: supabaseUrl, key: supabasePublishableKey };
}
