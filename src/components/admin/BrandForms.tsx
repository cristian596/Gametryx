"use client";

import { useActionState } from "react";
import { createBrand, renameBrand, type BrandState } from "@/app/admin/(panel)/marcas/actions";
import { Button } from "@/components/ui/Button";

const field =
  "h-11 w-full min-w-0 rounded-sm bg-surface-2 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

export function NewBrandForm() {
  const [state, action, pending] = useActionState<BrandState, FormData>(createBrand, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="nueva-marca" className="text-sm font-semibold">
        Nueva marca
      </label>
      <div className="flex gap-2">
        <input id="nueva-marca" name="nombre" required maxLength={60} placeholder="Ej.: Kairo" className={field} />
        <Button type="submit" loading={pending}>
          Crear
        </Button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function RenameBrandForm({ id, nombre, count }: { id: string; nombre: string; count: number }) {
  const [state, action, pending] = useActionState<BrandState, FormData>(renameBrand, {});
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-2">
        <label htmlFor={`m-${id}`} className="sr-only">
          Nombre de la marca
        </label>
        <input id={`m-${id}`} name="nombre" defaultValue={nombre} required maxLength={60} className={field} />
        <span className="price w-24 shrink-0 text-right text-sm text-muted">
          {count} {count === 1 ? "producto" : "productos"}
        </span>
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          Guardar
        </Button>
      </div>
      <Message state={state} />
    </form>
  );
}

function Message({ state }: { state: BrandState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="text-sm text-success">
        {state.message}
      </p>
    );
  return null;
}
