import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Usuario actual (o null), consultado a Supabase una vez por petición. */
export const getCurrentUser = cache(async () => {
  // El cliente de Supabase usa Date.now(): siempre por petición
  await connection();
  const supabase = await createSupabaseServerClient();
  // getUser valida la sesión con Supabase: no confía solo en la cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/**
 * Autorización de las páginas de /cuenta. El proxy ya redirige sin sesión (comprobación optimista);
 * esta es la comprobación real, junto a los datos. La RLS limita cada consulta al dueño.
 */
export async function requireUser(nextPath = "/cuenta") {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect(`/iniciar-sesion?next=${encodeURIComponent(nextPath)}`);
  return { supabase, user };
}
