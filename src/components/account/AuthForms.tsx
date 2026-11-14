"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  requestPasswordReset,
  resendSignupCode,
  setNewPassword,
  signIn,
  signUp,
  verifyRecoveryCode,
  verifySignupCode,
} from "@/lib/account/auth-actions";
import type { FormState } from "@/lib/account/form-state";
import { CodeStep } from "./CodeStep";
import { FormAlert } from "./FormAlert";
import { useFormAction } from "./useFormAction";

const linkCls = "font-semibold text-accent underline-offset-4 hover:underline";

export function SignInForm({ next }: { next?: string }) {
  const { state, pending, formProps } = useFormAction(signIn);
  const e = state.fieldErrors ?? {};
  return (
    <form {...formProps} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input
        name="email"
        type="email"
        label="Correo"
        autoComplete="email"
        inputMode="email"
        required
        error={e.email}
      />
      <div className="flex flex-col gap-2">
        <PasswordInput
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          error={e.password}
        />
        <Link
          href="/recuperar-contrasena"
          className={`self-start text-sm ${linkCls}`}
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Button type="submit" size="lg" loading={pending}>
        Iniciar sesión
      </Button>
      <p className="text-center text-[15px] text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className={linkCls}>
          Crea una
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const { state, pending, formProps } = useFormAction(signUp);
  // El servidor no devuelve el correo: se guarda aquí para el paso del código
  const [email, setEmail] = useState("");
  // "Usar otro correo" vuelve al formulario sin perder lo escrito (el formulario sigue montado)
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const e = state.fieldErrors ?? {};
  const codeStep = state.ok === "code-sent" && dismissed !== state;

  return (
    <>
      {codeStep && (
        <CodeStep
          email={email}
          intro="Para activar tu cuenta, escribe el código de 6 dígitos que enviamos a"
          verifyAction={verifySignupCode}
          resendAction={resendSignupCode}
          onChangeEmail={() => setDismissed(state)}
        />
      )}
      <form
        {...formProps}
        noValidate
        hidden={codeStep}
        className="flex flex-col gap-5"
      >
        <Input
          name="nombre"
          label="Nombre"
          autoComplete="name"
          required
          maxLength={120}
          error={e.nombre}
        />
        <Input
          name="email"
          type="email"
          label="Correo"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          error={e.email}
        />
        <Input
          name="telefono"
          type="tel"
          label="Celular"
          autoComplete="tel-national"
          inputMode="tel"
          hint="Opcional. Lo usamos para avisarte del estado de tus pedidos."
          error={e.telefono}
        />
        <PasswordInput
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          required
          hint="Mínimo 8 caracteres, con letras y números."
          error={e.password}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Autorizaciones</legend>
          <Check name="autorizacion" error={e.autorizacion}>
            Autorizo a VOLTA a tratar mis datos para crear y gestionar mi
            cuenta, según la{" "}
            <Link
              href="/privacidad"
              className="font-semibold text-accent underline underline-offset-4"
            >
              política de tratamiento de datos
            </Link>
            . <span className="text-muted">(obligatorio)</span>
          </Check>
          <Check name="marketing">
            Quiero recibir ofertas y lanzamientos por correo o WhatsApp. Puedes
            cancelarlo cuando quieras.
          </Check>
        </fieldset>
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <Button type="submit" size="lg" loading={pending}>
          Crear cuenta
        </Button>
        <p className="text-center text-[15px] text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/iniciar-sesion" className={linkCls}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </>
  );
}

function Check({
  name,
  error,
  children,
}: {
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = `chk-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug"
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-primary)]"
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="pl-8 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Recuperar contraseña en 3 pasos en la misma pantalla: correo → código → contraseña nueva. */
export function ResetPasswordForm() {
  const { state, pending, formProps } = useFormAction(requestPasswordReset);
  const [email, setEmail] = useState("");
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const [verified, setVerified] = useState(false);
  const onVerified = useCallback(() => setVerified(true), []);
  const e = state.fieldErrors ?? {};

  if (verified) return <NewPasswordStep />;

  if (state.ok === "code-sent" && dismissed !== state) {
    return (
      <CodeStep
        email={email}
        intro="Si ese correo tiene una cuenta en VOLTA, te llega un código de 6 dígitos. Lo enviamos a"
        verifyAction={verifyRecoveryCode}
        resendAction={requestPasswordReset}
        onVerified={onVerified}
        onChangeEmail={() => setDismissed(state)}
      />
    );
  }

  return (
    <form {...formProps} noValidate className="flex flex-col gap-5">
      <Input
        name="email"
        type="email"
        label="Correo de tu cuenta"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        error={e.email}
      />
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Button type="submit" size="lg" loading={pending}>
        Enviar código
      </Button>
      <Link
        href="/iniciar-sesion"
        className={`self-center text-[15px] ${linkCls}`}
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}

function NewPasswordStep() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-bold outline-none"
        >
          Código correcto
        </h2>
        <p className="text-[15px] text-muted">
          Ahora elige tu contraseña nueva. No uses una que tengas en otros
          sitios.
        </p>
      </div>
      <NewPasswordForm />
    </div>
  );
}

export function NewPasswordForm() {
  const { state, pending, formProps } = useFormAction(setNewPassword);
  const e = state.fieldErrors ?? {};
  return (
    <form {...formProps} noValidate className="flex flex-col gap-5">
      <PasswordInput
        name="password"
        label="Contraseña nueva"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres, con letras y números."
        error={e.password}
      />
      <PasswordInput
        name="confirmar"
        label="Repite la contraseña"
        autoComplete="new-password"
        required
        error={e.confirmar}
      />
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Button type="submit" size="lg" loading={pending}>
        Guardar contraseña
      </Button>
    </form>
  );
}
