import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Intentos permitidos por código enviado. */
export const OTP_MAX_ATTEMPTS = 3;

export type OtpPurpose = "signup" | "recovery";

/** El correo no se guarda en claro: solo su hash. */
const keyFor = (purpose: OtpPurpose, email: string) =>
  `otp:${purpose}:${createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32)}`;

/** Reinicia el contador al enviar un código nuevo. */
export async function startOtp(purpose: OtpPurpose, email: string) {
  const { error } = await createSupabaseAdminClient().rpc("otp_start", { p_key: keyFor(purpose, email) });
  if (error) console.error("[otp] no se pudo iniciar el contador:", error.message);
}

/**
 * Gasta un intento antes de verificar el código (atómico en la BD).
 * - número: intentos que quedan después de este
 * - "blocked": ya no quedan o no hay código vigente → pedir uno nuevo
 * - "error": la BD no responde → no se verifica (sin contador no se puede garantizar el límite)
 */
export async function spendOtpAttempt(purpose: OtpPurpose, email: string): Promise<number | "blocked" | "error"> {
  const { data, error } = await createSupabaseAdminClient().rpc("otp_attempt", {
    p_key: keyFor(purpose, email),
    p_max: OTP_MAX_ATTEMPTS,
  });
  if (error) {
    console.error("[otp] contador no disponible:", error.message);
    return "error";
  }
  return typeof data === "number" ? OTP_MAX_ATTEMPTS - data : "blocked";
}
