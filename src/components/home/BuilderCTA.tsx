import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import type { Product } from "@/types/catalog";
import { BudgetPicker, type BudgetPc } from "./BudgetPicker";
import { Reveal } from "./Reveal";

const checks = [
  "El procesador y la board usan el mismo socket",
  "La memoria RAM es del tipo que acepta la board",
  "La fuente tiene los vatios que pide tu armado",
  "La gráfica y el disipador caben en el gabinete",
];

/** 7. Arma tu PC gamer online: campo verde completo, con el selector de presupuesto como elemento vivo. */
export function BuilderCTA({ pcs }: { pcs: Product[] }) {
  const budgetPcs: BudgetPc[] = pcs.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    precio: p.precioCop,
    resolucion: String(p.specs.resolucion_objetivo),
    gpu: String(p.specs.gpu),
    cpu: String(p.specs.cpu),
    stock: p.stock,
  }));

  return (
    <section aria-labelledby="armar-title" className="bg-primary py-16 text-on-primary md:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-6">
          <h2 id="armar-title" className="text-[32px] leading-[1] font-bold tracking-[-0.03em] md:text-[56px]">
            Arma tu PC gamer online
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed">
            Elige cada pieza y nuestro armador revisa la compatibilidad por ti antes de que pagues.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {checks.map((c) => (
              <li key={c} className="flex items-start gap-3 text-base font-medium">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-on-primary text-primary">
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                </span>
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/armar-pc" size="lg" variant="inverse">
              Armar mi PC
            </LinkButton>
            <LinkButton href="/cotizacion" size="lg" variant="inverse-ghost">
              Cotizar con un asesor
            </LinkButton>
          </div>
        </Reveal>
        <Reveal className="lg:col-span-6">
          <BudgetPicker pcs={budgetPcs} />
        </Reveal>
      </div>
    </section>
  );
}
