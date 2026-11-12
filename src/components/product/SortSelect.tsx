"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { SORTS, type SortValue } from "@/lib/filters";

/** Orden del listado: cambia solo el parámetro "orden" y vuelve a la página 1. */
export function SortSelect({ value }: { value: SortValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="hidden text-sm text-muted sm:block">
        Ordenar por
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-busy={pending || undefined}
          onChange={(e) => {
            const sp = new URLSearchParams(params.toString());
            if (e.target.value === "relevancia") sp.delete("orden");
            else sp.set("orden", e.target.value);
            sp.delete("pagina");
            const s = sp.toString();
            startTransition(() => router.push(`${pathname}${s ? `?${s}` : ""}`, { scroll: false }));
          }}
          className="h-11 appearance-none rounded-sm bg-surface-2 pr-9 pl-3 text-[15px] font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
