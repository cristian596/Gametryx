"use server";

import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { allowRequest, clientKey } from "@/lib/auth/rate-limit";
import { safeNext } from "@/lib/auth/safe-next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  emailOnlySchema,
  fieldErrors,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/account";
import { PRIVACY_POLICY_VERSION } from "@/lib/validation/quote";
import type { FormState } from "./form-state";

/**
 * Acciones de autenticación de la tienda. Nunca se devuelve el correo en el estado
 * (Next lo escribe en los logs de desarrollo): el formulario conserva lo escrito.
 */

const confirmUrl = (next: string) => `${site.url}/auth/confirm?next=${encodeURIComponent(next)}`;

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // 5 intentos cada 15 minutos por IP + correo
  if (!(await allowRequest(await clientKey("login", parsed.data.email), 5, 900))) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Aún no confirmas tu correo. Abre el enlace que te enviamos al registrarte." };
    }
    // Mismo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen
    return { error: "El correo o la contraseña no coinciden." };
  }

  redirect(safeNext(parsed.data.next, "/cuenta"));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono") ?? "",
    password: formData.get("password"),
    autorizacion: formData.get("autorizacion") ?? undefined,
    marketing: formData.get("marketing") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;

  // 5 registros por hora por IP
  if (!(await allowRequest(await clientKey("signup"), 5, 3600))) {
    return { error: "Demasiados intentos. Espera una hora e inténtalo de nuevo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: { emailRedirectTo: confirmUrl("/cuenta"), data: { nombre: d.nombre, telefono: d.telefono || null } },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "Esa contraseña es fácil de adivinar. Prueba con una más larga o distinta." } };
    }
    if (error.code === "user_already_exists") {
      return { error: "No pudimos crear la cuenta con ese correo. Si ya tienes cuenta, inicia sesión o recupera tu contraseña." };
    }
    if (error.status === 429) {
      return { error: "Enviamos demasiados correos en poco tiempo. Inténtalo de nuevo en unos minutos." };
    }
    console.error("[registro]", error.code ?? error.status, error.message);
    return { error: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos." };
  }

  // Si el correo ya existía, Supabase responde igual pero sin identidades (no revela la cuenta): no se guarda nada
  const user = data.user;
  if (user && (user.identities?.length ?? 0) > 0) {
    const rows = [{ user_id: user.id, finalidad: "registro", version_politica: PRIVACY_POLICY_VERSION, origen: "registro" }];
    if (d.marketing) rows.push({ user_id: user.id, finalidad: "marketing", version_politica: PRIVACY_POLICY_VERSION, origen: "registro" });
    const { error: consentError } = await createSupabaseAdminClient().from("consents").insert(rows);
    if (consentError) console.error("[registro] no se guardó la autorización:", consentError.message);
  }

  // Con la confirmación de correo desactivada, Supabase ya devuelve la sesión
  if (data.session) redirect("/cuenta");
  return { ok: "check-email" };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // 3 por cada 15 minutos por IP + correo
  if (!(await allowRequest(await clientKey("reset", parsed.data.email), 3, 900))) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/cuenta/nueva-contrasena"),
  });
  if (error) {
    console.error("[recuperar]", error.code ?? error.status, error.message);
    // El límite de envío de Supabase es de todo el proyecto: decirlo no revela si la cuenta existe
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { error: "No pudimos enviar el correo en este momento. Inténtalo de nuevo en unos minutos." };
    }
  }
  // Sin error de envío, siempre la misma respuesta: no revela si el correo tiene cuenta
  return { ok: "sent" };
}

/** Nueva contraseña tras abrir el enlace de recuperación (el enlace ya inició la sesión). */
export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirmar: formData.get("confirmar") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace venció. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: "Usa una contraseña distinta a la anterior." } };
    if (error.code === "weak_password") return { fieldErrors: { password: "Esa contraseña es fácil de adivinar. Prueba con otra." } };
    console.error("[nueva-contraseña]", error.code ?? error.status, error.message);
    return { error: "No pudimos cambiar la contraseña. Inténtalo de nuevo." };
  }
  redirect("/cuenta/datos?aviso=clave");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
