"use client";

import Link from "next/link";
import { useId, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { formatCOP } from "@/lib/format";

export type BudgetPc = {
  slug: string;
  nombre: string;
  precio: number;
  resolucion: string;
  gpu: string;
  cpu: string;
  stock: number;
};

const MIN = 2_500_000;
const MAX = 15_000_000;
const STEP = 250_000;

const playsCopy: Record<string, string> = {
  "1080p": "Full HD a alta tasa de refresco en juegos competitivos.",
  "1440p": "2K con calidad alta y margen para transmitir.",
  "4K": "4K con todo en ultra.",
};

/**
 * Lo único "vivo" del home: mueves tu presupuesto y ves qué PC te alcanza y para qué resolución.
 * Sin JS, el formulario envía el presupuesto al armador.
 */
export function BudgetPicker({ pcs }: { pcs: BudgetPc[] }) {
  const [budget, setBudget] = useState(6_000_000);
  const id = useId();

  const match = useMemo(() => {
    const inStock = pcs.filter((p) => p.stock > 0).sort((a, b) => b.precio - a.precio);
    return inStock.find((p) => p.precio <= budget) ?? null;
  }, [pcs, budget]);

  const pct = ((budget - MIN) / (MAX - MIN)) * 100;

  return (
    <form action="/armar-pc" className="flex flex-col gap-6 rounded-lg bg-on-primary p-5 text-text sm:p-8">
      <div>
        <label htmlFor={id} className="text-[15px] text-muted">
          ¿Cuánto quieres invertir?
        </label>
        <output htmlFor={id} className="price mt-1 block text-[40px] leading-none font-medium sm:text-[52px]">
          {formatCOP(budget)}
        </output>
      </div>
      <input
        id={id}
        name="presupuesto"
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        aria-valuetext={formatCOP(budget)}
        className="budget-range h-11 w-full cursor-pointer"
        style={{ "--fill": `${pct}%` } as CSSProperties}
      />
      <div aria-live="polite" className="min-h-28 rounded-md bg-surface p-4 sm:p-5">
        {match ? (
          <>
            <p className="text-sm text-muted">Con ese presupuesto te alcanza para</p>
            <p className="mt-1 text-lg leading-snug font-semibold">
              <Link href={`/producto/${match.slug}`} className="underline-offset-4 hover:underline">
                {match.nombre}
              </Link>
            </p>
            <p className="mt-1 text-[15px]">
              <span className="price text-primary">{match.resolucion}</span> · {playsCopy[match.resolucion] ?? ""}{" "}
              <span className="price text-muted">{formatCOP(match.precio)}</span>
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">Con menos de {formatCOP(pcs.length ? Math.min(...pcs.map((p) => p.precio)) : MIN)} te armamos uno a la medida.</p>
            <p className="mt-1 text-[15px] text-muted">Elige pieza por pieza en el armador o pide una cotización.</p>
          </>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex h-13 items-center justify-center gap-2 rounded-sm bg-primary px-7 font-semibold text-on-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-primary-hover active:scale-[0.97]"
      >
        Armar con este presupuesto
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </form>
  );
}
