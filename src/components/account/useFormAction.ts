"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { FormState } from "@/lib/account/form-state";

/**
 * Envía un formulario a una Server Action sin que React lo vacíe tras un error
 * (React reinicia los formularios con `action` al terminar). Sin JS, el `action` sigue funcionando.
 * Tras un error lleva el foco al primer campo inválido.
 */
export function useFormAction(fn: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState<FormState, FormData>(fn, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.fieldErrors) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  return { state, pending, formProps: { ref: formRef, action, onSubmit } };
}
