"use client";

import { useOptimistic, useTransition } from "react";
import { setProductActive } from "@/app/admin/(panel)/productos/actions";
import { cn } from "@/lib/cn";

/** Interruptor "en tienda": cambia al instante y se revierte solo si el servidor falla. */
export function ActiveToggle({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={`Mostrar ${name} en la tienda`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          const r = await setProductActive(id, !optimistic);
          if (!r.ok) alert(`No se pudo cambiar: ${r.error}`);
        })
      }
      className="inline-flex h-10 items-center gap-2 rounded-sm px-1 text-sm"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors duration-(--duration-fast)",
          optimistic ? "bg-primary" : "bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-4 rounded-full bg-on-primary transition-transform duration-(--duration-fast)",
            optimistic ? "translate-x-4" : "bg-muted",
          )}
        />
      </span>
      <span className={optimistic ? "text-text" : "text-muted"}>{optimistic ? "Visible" : "Oculto"}</span>
    </button>
  );
}
