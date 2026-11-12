"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { filtersToSearch, parseFilters, SPEC_FACETS, type Facets, type Filters } from "@/lib/filters";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CategorySlug } from "@/types/catalog";

/** Momento del último Atrás/Adelante: permite sincronizar el precio aunque el campo tenga el foco. */
let lastPopstate = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPopstate = Date.now();
  });
}

type Props = {
  category: CategorySlug;
  filters: Filters;
  facets: Facets;
  total: number;
  activeCount: number;
};

/**
 * Panel de filtros. Es un <form method="get">: sin JS sigue funcionando con el botón "Aplicar".
 * Con JS, cada cambio actualiza la URL al instante (sin recargar ni mover el scroll) y queda en el historial: Atrás lo deshace.
 */
export function FilterForm({ category, filters, facets, total, activeCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(form: HTMLFormElement) {
    const fd = new FormData(form);
    const raw: Record<string, string[]> = {};
    for (const [k, v] of fd.entries()) (raw[k] ??= []).push(String(v));
    const next = parseFilters(raw, category);
    // Cambiar un filtro vuelve a la página 1 y conserva el orden elegido
    const search = filtersToSearch({ ...next, orden: filters.orden, pagina: 1 }, category);
    startTransition(() => router.push(`${pathname}${search}`, { scroll: false }));
  }

  const formProps = { category, filters, facets, onNavigate: navigate };

  return (
    <>
      {/* Escritorio: columna lateral */}
      <aside aria-label="Filtros" className={cn("hidden lg:block", pending && "opacity-70")}>
        <FilterFields {...formProps} idPrefix="d" />
      </aside>

      {/* Celular: botón que abre una hoja inferior */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          onClick={() => setMobileOpen(true)}
          icon={<SlidersHorizontal aria-hidden className="size-4" />}
          aria-haspopup="dialog"
        >
          Filtros{activeCount > 0 && <span className="price text-primary"> ({activeCount})</span>}
        </Button>
        <Dialog
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Filtros"
          variant="bottom"
          footer={
            <Button size="lg" className="w-full" onClick={() => setMobileOpen(false)} loading={pending}>
              Ver {total} {total === 1 ? "producto" : "productos"}
            </Button>
          }
        >
          <FilterFields {...formProps} idPrefix="m" />
        </Dialog>
      </div>
    </>
  );
}

function FilterFields({
  category,
  filters,
  facets,
  onNavigate,
  idPrefix,
}: {
  category: CategorySlug;
  filters: Filters;
  facets: Facets;
  onNavigate: (form: HTMLFormElement) => void;
  idPrefix: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseId = useId();
  const clearHref = filters.tipo ? `?tipo=${filters.tipo}` : "?";

  // Las casillas son no controladas (funcionan sin JS). Si la URL cambia desde fuera
  // (chips, Atrás), se ajustan aquí sin desmontar el formulario ni perder el foco.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const selected: Record<string, string[]> = { marca: filters.marcas, disponible: filters.disponible ? ["1"] : [] };
    for (const def of SPEC_FACETS[category]) selected[def.param] = filters.specs[def.key] ?? [];
    for (const el of Array.from(form.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))) {
      el.checked = (selected[el.name] ?? []).includes(el.value);
    }
  }, [filters, category]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNavigate(e.currentTarget);
  }

  return (
    <form
      ref={formRef}
      method="get"
      onSubmit={onSubmit}
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        // El precio espera a que la persona termine de escribir
        if (target.name === "precio_min" || target.name === "precio_max") {
          if (priceTimer.current) clearTimeout(priceTimer.current);
          priceTimer.current = setTimeout(() => formRef.current && onNavigate(formRef.current), 600);
          return;
        }
        onNavigate(e.currentTarget);
      }}
      className="flex flex-col gap-7"
    >
      {filters.tipo && <input type="hidden" name="tipo" value={filters.tipo} />}
      {filters.orden !== "relevancia" && <input type="hidden" name="orden" value={filters.orden} />}

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold">
        <input
          type="checkbox"
          name="disponible"
          value="1"
          defaultChecked={filters.disponible}
          className="size-5 accent-[var(--color-primary)]"
        />
        Solo disponibles
      </label>

      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold">Precio</legend>
        <div className="grid grid-cols-2 gap-2">
          <PriceInput
            id={`${idPrefix}${baseId}-min`}
            name="precio_min"
            label="Desde"
            placeholder={formatCOP(facets.precio.min)}
            defaultValue={filters.precioMin}
          />
          <PriceInput
            id={`${idPrefix}${baseId}-max`}
            name="precio_max"
            label="Hasta"
            placeholder={formatCOP(facets.precio.max)}
            defaultValue={filters.precioMax}
          />
        </div>
      </fieldset>

      {facets.marcas.length > 1 && (
        <CheckGroup legend="Marca" name="marca" options={facets.marcas} selected={filters.marcas} />
      )}

      {facets.specs.map(({ def, options }) => (
        <CheckGroup
          key={def.key}
          legend={def.label}
          name={def.param}
          options={options}
          selected={filters.specs[def.key] ?? []}
        />
      ))}

      <div className="flex flex-wrap gap-2">
        {/* Sin JS: aplica los cambios. Con JS ya se aplican solos, pero queda como respaldo */}
        <noscript>
          <button type="submit" className="h-11 rounded-sm bg-primary px-5 font-semibold text-on-primary">
            Aplicar
          </button>
        </noscript>
        <a href={`/${category}${clearHref === "?" ? "" : clearHref}`} className="inline-flex h-11 items-center text-[15px] font-semibold text-accent underline-offset-4 hover:underline">
          Quitar filtros
        </a>
      </div>
    </form>
  );
}

function PriceInput({
  id,
  name,
  label,
  placeholder,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // Si la URL cambia desde fuera (chip "quitar precio", Atrás), refleja el valor.
  // Mientras la persona escribe no se toca, salvo que el cambio venga del historial.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fromHistory = Date.now() - lastPopstate < 2000;
    if (document.activeElement !== el || fromHistory) el.value = defaultValue != null ? String(defaultValue) : "";
  }, [defaultValue]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        inputMode="numeric"
        pattern="[0-9.]*"
        autoComplete="off"
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="price h-11 w-full min-w-0 rounded-sm bg-surface-2 px-3 text-[15px] text-text placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
      />
    </div>
  );
}

function CheckGroup({
  legend,
  name,
  options,
  selected,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string; count: number }[];
  selected: string[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-display text-lg font-semibold">{legend}</legend>
      <ul className="flex flex-col">
        {options.map((o) => (
          <li key={o.value}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                name={name}
                value={o.value}
                defaultChecked={selected.includes(o.value)}
                className="size-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span className="flex-1">{o.label}</span>
              <span className="price text-sm text-muted">{o.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
