"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { changeEmail, changePassword, updateProfile } from "@/lib/account/account-actions";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "./FormAlert";
import { useFormAction } from "./useFormAction";

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg bg-surface p-5 sm:p-6">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {intro && <p className="mt-1 text-[15px] text-muted">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ProfileForm({ nombre, telefono }: { nombre: string; telefono: string }) {
  const { state, pending, formProps } = useFormAction(updateProfile);
  const e = state.fieldErrors ?? {};
  return (
    <Section id="datos-personales" title="Datos personales" intro="Los usamos en tus pedidos y para avisarte del envío.">
      <form {...formProps} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input name="nombre" label="Nombre" autoComplete="name" required defaultValue={nombre} maxLength={120} error={e.nombre} />
        <Input
          name="telefono"
          type="tel"
          label="Celular"
          autoComplete="tel-national"
          inputMode="tel"
          defaultValue={telefono}
          error={e.telefono}
        />
        <div className="flex flex-col gap-4 sm:col-span-2">
          {state.error && <FormAlert>{state.error}</FormAlert>}
          {state.ok === "saved" && <FormAlert tone="success">Guardamos tus datos.</FormAlert>}
          <Button type="submit" variant="secondary" loading={pending} className="self-start">
            Guardar datos
          </Button>
        </div>
      </form>
    </Section>
  );
}

export function EmailForm({ email }: { email: string }) {
  const { state, pending, formProps } = useFormAction(changeEmail);
  const [value, setValue] = useState("");
  const e = state.fieldErrors ?? {};
  return (
    <Section id="correo" title="Correo" intro={`Entras con ${email}. Para cambiarlo te pedimos tu contraseña actual.`}>
      {state.ok === "email-sent" ? (
        <FormAlert tone="success">
          Te enviamos un enlace de confirmación. El cambio se aplica cuando lo abras; hasta entonces sigues entrando con tu
          correo actual.
        </FormAlert>
      ) : (
        <form {...formProps} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            name="email"
            type="email"
            label="Correo nuevo"
            autoComplete="email"
            inputMode="email"
            required
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            error={e.email}
          />
          <PasswordInput name="actual" label="Contraseña actual" autoComplete="current-password" required error={e.actual} />
          <div className="flex flex-col gap-4 sm:col-span-2">
            {state.error && <FormAlert>{state.error}</FormAlert>}
            <Button type="submit" variant="secondary" loading={pending} className="self-start">
              Cambiar correo
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}

export function PasswordForm() {
  const { state, pending, formProps } = useFormAction(changePassword);
  const e = state.fieldErrors ?? {};
  // Tras un cambio exitoso se vacía el formulario (nueva clave = nuevo key)
  const [round, setRound] = useState(0);
  const [lastOk, setLastOk] = useState<FormState | null>(null);
  if (state.ok === "password-saved" && lastOk !== state) {
    setLastOk(state);
    setRound((r) => r + 1);
  }
  return (
    <Section id="contrasena" title="Contraseña" intro="Mínimo 8 caracteres, con letras y números.">
      <form key={round} {...formProps} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <PasswordInput
          name="actual"
          label="Contraseña actual"
          autoComplete="current-password"
          required
          error={e.actual}
          wrapperClassName="sm:col-span-2 sm:max-w-[calc(50%-10px)]"
        />
        <PasswordInput name="password" label="Contraseña nueva" autoComplete="new-password" required error={e.password} />
        <PasswordInput name="confirmar" label="Repite la contraseña nueva" autoComplete="new-password" required error={e.confirmar} />
        <div className="flex flex-col gap-4 sm:col-span-2">
          {state.error && <FormAlert>{state.error}</FormAlert>}
          {state.ok === "password-saved" && <FormAlert tone="success">Listo: cambiamos tu contraseña.</FormAlert>}
          <Button type="submit" variant="secondary" loading={pending} className="self-start">
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Section>
  );
}
