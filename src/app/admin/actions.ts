"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { allowRequest, clientKey } from "@/lib/auth/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

const loginSchema = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
  next: z.string().optional(),
});

/** Solo rutas internas del admin: evita redirecciones abiertas a otros sitios. */
function safeNext(next?: string) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/productos";
}

export async function adminSignIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  // 5 intentos cada 15 minutos por IP + correo
  if (!(await allowRequest(await clientKey("login", parsed.data.email), 5, 900))) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.", email };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Mismo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen
  if (error) return { error: "El correo o la contraseña no coinciden.", email };

  redirect(safeNext(parsed.data.next));
}

export async function adminSignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/ingresar");
}
