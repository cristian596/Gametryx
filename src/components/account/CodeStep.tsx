"use client";

import { useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "./FormAlert";
import { useFormAction } from "./useFormAction";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const RESEND_SECONDS = 60;

/**
 * Paso "escribe el código que te enviamos": verificar (3 intentos por código, lo controla el servidor)
 * y reenviar tras 60 s. `onVerified` se llama si la acción devuelve ok "verified" (recuperación);
 * en el registro la acción redirige sola.
 */
export function CodeStep({
  email,
  intro,
  verifyAction,
  resendAction,
  onVerified,
  onChangeEmail,
}: {
  email: string;
  intro: string;
  verifyAction: Action;
  resendAction: Action;
  onVerified?: () => void;
  onChangeEmail: () => void;
}) {
  const verify = useFormAction(verifyAction);
  const resend = useFormAction(resendAction);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Cada código nuevo (round) reinicia los intentos: se desbloquea el campo, se vacía
  // y los mensajes del código anterior dejan de mostrarse
  const [round, setRound] = useState(0);
  const [resendSeen, setResendSeen] = useState(resend.state);
  const [staleVerify, setStaleVerify] = useState<FormState | null>(null);
  if (resend.state !== resendSeen) {
    setResendSeen(resend.state);
    if (resend.state.ok) {
      setRound((r) => r + 1);
      setSeconds(RESEND_SECONDS);
      setStaleVerify(verify.state);
    }
  }
  const [verifySeen, setVerifySeen] = useState(verify.state);
  const [blockedRound, setBlockedRound] = useState<number | null>(null);
  if (verify.state !== verifySeen) {
    setVerifySeen(verify.state);
    if (verify.state.ok === "blocked") setBlockedRound(round);
  }

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (verify.state.ok === "verified") onVerified?.();
  }, [verify.state, onVerified]);

  const blocked = blockedRound === round;
  const fresh = verify.state !== staleVerify;
  const tokenError = fresh ? verify.state.fieldErrors?.token : undefined;
  const verifyError = fresh && !tokenError ? verify.state.error : undefined;
  const justResent = round > 0 && !fresh && !resend.pending;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-3">
        <MailCheck aria-hidden className="size-10 text-primary" />
        <h2 ref={titleRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          Revisa tu correo
        </h2>
        <p className="text-[15px]">
          {intro} <strong className="break-all">{email}</strong>.
        </p>
        <p className="text-sm text-muted">Vence en 15 minutos. ¿No llega? Revisa spam o promociones.</p>
      </div>

      <form key={round} {...verify.formProps} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <Input
          name="token"
          label="Código"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={12}
          required
          disabled={blocked}
          error={tokenError}
          className="price text-center text-2xl tracking-[0.4em]"
        />
        {verifyError && <FormAlert>{verifyError}</FormAlert>}
        <Button type="submit" size="lg" loading={verify.pending} disabled={blocked}>
          Verificar código
        </Button>
      </form>

      <form {...resend.formProps} className="flex flex-col items-start gap-2">
        <input type="hidden" name="email" value={email} />
        {resend.state.error && <FormAlert>{resend.state.error}</FormAlert>}
        {justResent && (
          <p role="status" className="text-sm text-success">
            Te enviamos un código nuevo.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <button
            type="submit"
            disabled={(seconds > 0 && !blocked) || resend.pending}
            className="h-11 text-[15px] font-semibold text-accent disabled:text-muted"
          >
            {resend.pending ? "Enviando…" : seconds > 0 && !blocked ? `Reenviar código en ${seconds} s` : "Enviar un código nuevo"}
          </button>
          <button type="button" onClick={onChangeEmail} className="h-11 text-[15px] font-semibold text-muted hover:text-text">
            Usar otro correo
          </button>
        </div>
      </form>
    </div>
  );
}
