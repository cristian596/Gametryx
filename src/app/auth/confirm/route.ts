import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

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

  const supabase = await createSupabaseServerClient();
  let ok = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    if (type === "recovery") next = "/cuenta/nueva-contrasena";
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  redirect(ok ? next : "/iniciar-sesion?error=enlace");
}
