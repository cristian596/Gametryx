import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Autorización real del panel admin. Se llama en cada página y en cada Server Action del admin.
 * - Sin sesión → página de ingreso.
 * - Con sesión pero sin rol admin → 404 (no revela que el panel existe).
 * Devuelve un cliente con la sesión del admin: la RLS permite escribir el catálogo solo a admins.
 */
export async function requireAdmin(nextPath = "/admin/productos") {
  // Siempre por petición: el cliente de Supabase usa Date.now() y no puede prerenderizarse
  await connection();
  const supabase = await createSupabaseServerClient();
  // getUser consulta a Supabase: no confía solo en la cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/admin/ingresar?next=${encodeURIComponent(nextPath)}`);

  const { data: profile } = await supabase.from("profiles").select("es_admin, nombre").eq("id", user.id).single();
  if (!profile?.es_admin) notFound();

  return { supabase, user: { id: user.id, email: user.email ?? "", nombre: profile.nombre as string | null } };
}
