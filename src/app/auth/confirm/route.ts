import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];
const RECOVERY_PATH = "/cuenta/nueva-contrasena";

/**
 * Destino de los enlaces de los correos de Supabase (confirmar registro, recuperar contraseña, cambiar correo).
 * Acepta las dos formas:
 *  - `?token_hash=…&type=…` (plantilla recomendada en docs/SUPABASE.md: funciona aunque se abra en otro navegador)
 *  - `?code=…` (plantilla por defecto, PKCE: solo funciona en el mismo navegador donde se pidió)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  let next = safeNext(params.get("next"), "/cuenta");

  // Supabase ya rechazó el enlace (vencido o usado) antes de redirigir aquí
  if (params.get("error")) {
    console.warn("[auth/confirm]", params.get("error_code") ?? params.get("error"));
    redirect("/iniciar-sesion?error=enlace");
  }

  const supabase = await createSupabaseServerClient();
  let errorCode: string | undefined = "sin_parametros";
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    errorCode = error ? (error.code ?? error.message) : undefined;
    if (type === "recovery") next = RECOVERY_PATH;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorCode = error ? (error.code ?? error.message) : undefined;
  }

  if (!errorCode) redirect(next);
  console.warn("[auth/confirm]", errorCode);

  // Enlace por defecto (PKCE) abierto en otro navegador: Supabase ya lo validó, pero aquí falta la cookie
  // que se guardó donde se pidió. En un registro el correo igual queda confirmado.
  if (errorCode === "pkce_code_verifier_not_found") {
    redirect(next.startsWith(RECOVERY_PATH) ? "/iniciar-sesion?error=navegador" : "/iniciar-sesion?aviso=confirmado");
  }
  redirect("/iniciar-sesion?error=enlace");
}
