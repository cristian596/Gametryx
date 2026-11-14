"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { allowRequest, clientKey } from "@/lib/auth/rate-limit";
import { safeNext } from "@/lib/auth/safe-next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  codeSchema,
  emailOnlySchema,
  fieldErrors,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/account";
import { PRIVACY_POLICY_VERSION } from "@/lib/validation/quote";
import type { FormState } from "./form-state";
import { OTP_MAX_ATTEMPTS, spendOtpAttempt, startOtp, type OtpPurpose } from "./otp";

/**
 * Acciones de autenticación de la tienda. Nunca se devuelve el correo en el estado
 * (Next lo escribe en los logs de desarrollo): el formulario conserva lo escrito.
 *
 * Registro y recuperación usan un código de 6 dígitos que llega al correo (plantillas en
 * supabase/templates). Cada código admite 3 intentos; después hay que pedir otro.
 */

/** Respaldo: si la plantilla del correo aún trae el enlace en vez del código, el enlace sigue funcionando. */
const confirmUrl = (next: string) => `${site.url}/auth/confirm?next=${encodeURIComponent(next)}`;

const SEND_LIMITED: FormState = { error: "No pudimos enviar el correo en este momento. Inténtalo de nuevo en unos minutos." };
const TOO_MANY: FormState = { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };

const isSendLimit = (e: { status?: number; code?: string }) =>
  e.status === 429 || e.code === "over_email_send_rate_limit";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // 5 intentos cada 15 minutos por IP + correo
  if (!(await allowRequest(await clientKey("login", parsed.data.email), 5, 900))) return TOO_MANY;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Aún no confirmas tu correo. Escribe el código que te enviamos al registrarte; si se te perdió, crea la cuenta de nuevo con el mismo correo y te llega otro.",
      };
    }
    // Mismo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen
    return { error: "El correo o la contraseña no coinciden." };
  }

  redirect(safeNext(parsed.data.next, "/cuenta"));
}

// ───────────── Registro ─────────────

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
    if (isSendLimit(error)) return SEND_LIMITED;
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
  await startOtp("signup", d.email);
  return { ok: "code-sent" };
}

export async function resendSignupCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Vuelve a empezar el registro." };
  if (!(await allowRequest(await clientKey("resend-signup", parsed.data.email), 3, 900))) return TOO_MANY;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: confirmUrl("/cuenta") },
  });
  if (error) {
    console.error("[reenviar-registro]", error.code ?? error.status, error.message);
    if (isSendLimit(error)) return SEND_LIMITED;
  }
  await startOtp("signup", parsed.data.email);
  return { ok: "code-sent" };
}

export async function verifySignupCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await verifyCode("signup", "email", formData);
  if (result.ok !== "verified") return result;
  redirect("/cuenta");
}

// ───────────── Recuperar contraseña ─────────────

/** Envía (o reenvía) el código de recuperación. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // 3 por cada 15 minutos por IP + correo
  if (!(await allowRequest(await clientKey("reset", parsed.data.email), 3, 900))) return TOO_MANY;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/cuenta/nueva-contrasena"),
  });
  if (error) {
    console.error("[recuperar]", error.code ?? error.status, error.message);
    // El límite de envío de Supabase es de todo el proyecto: decirlo no revela si la cuenta existe
    if (isSendLimit(error)) return SEND_LIMITED;
  }
  // Siempre la misma respuesta aunque el correo no tenga cuenta: no revela qué cuentas existen
  await startOtp("recovery", parsed.data.email);
  return { ok: "code-sent" };
}

/** Código correcto → la sesión queda iniciada y el formulario pasa a la contraseña nueva. */
export async function verifyRecoveryCode(_prev: FormState, formData: FormData): Promise<FormState> {
  return verifyCode("recovery", "recovery", formData);
}

/** Nueva contraseña: tras verificar el código (o abrir el enlace de recuperación), con la sesión ya iniciada. */
export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirmar: formData.get("confirmar") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Pasó demasiado tiempo. Pide un código nuevo desde «¿Olvidaste tu contraseña?»." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: "Usa una contraseña distinta a la anterior." } };
    if (error.code === "weak_password") return { fieldErrors: { password: "Esa contraseña es fácil de adivinar. Prueba con otra." } };
    console.error("[nueva-contraseña]", error.code ?? error.status, error.message);
    return { error: "No pudimos cambiar la contraseña. Inténtalo de nuevo." };
  }
  redirect("/cuenta/datos?aviso=clave");
}

// ───────────── Verificación común del código ─────────────

async function verifyCode(purpose: OtpPurpose, type: EmailOtpType, formData: FormData): Promise<FormState> {
  const parsed = codeSchema.safeParse({ email: formData.get("email"), token: formData.get("token") });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return errors.email ? { error: "Vuelve a empezar: no sabemos a qué correo enviamos el código." } : { fieldErrors: errors };
  }
  const { email, token } = parsed.data;

  // Además del límite por código: 10 verificaciones cada 15 minutos por IP (frena probar muchos correos)
  if (!(await allowRequest(await clientKey(`verify-${purpose}`), 10, 900))) return TOO_MANY;

  const left = await spendOtpAttempt(purpose, email);
  if (left === "error") return { error: "No pudimos revisar el código en este momento. Inténtalo de nuevo en unos minutos." };
  if (left === "blocked") {
    return { ok: "blocked", error: `Ya usaste los ${OTP_MAX_ATTEMPTS} intentos de este código. Pide un código nuevo.` };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type });
  if (!error) return { ok: "verified" };

  if (error.code === "otp_expired" || error.code === "otp_disabled") {
    // Supabase usa "otp_expired" tanto para vencido como para incorrecto
    if (left === 0) {
      return { ok: "blocked", error: `El código no es correcto o venció, y ya usaste los ${OTP_MAX_ATTEMPTS} intentos. Pide un código nuevo.` };
    }
    return {
      fieldErrors: {
        token: `El código no es correcto o ya venció. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.`,
      },
    };
  }
  if (isSendLimit(error)) return TOO_MANY;
  console.error("[verificar-código]", purpose, error.code ?? error.status, error.message);
  return { error: "No pudimos revisar el código. Inténtalo de nuevo." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
