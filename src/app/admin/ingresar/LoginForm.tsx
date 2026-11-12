"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminSignIn, type LoginState } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(adminSignIn, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input name="email" type="email" label="Correo" autoComplete="username" required defaultValue={state.email} />
      <Input name="password" type="password" label="Contraseña" autoComplete="current-password" required />
      {state.error && (
        <p role="alert" className="rounded-sm bg-danger/15 px-4 py-3 text-[15px] text-text">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending}>
        Entrar al panel
      </Button>
    </form>
  );
}
