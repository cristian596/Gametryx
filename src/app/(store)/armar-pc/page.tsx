import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/builder/Builder";
import { PageIntro } from "@/components/layout/PageIntro";
import { Skeleton } from "@/components/ui/Skeleton";
import { getBuilderParts } from "@/lib/builder-parts";

export const metadata: Metadata = {
  title: "Arma tu PC gamer",
  description: "Elige procesador, board, memoria, gráfica, fuente y gabinete. Te avisamos al instante si algo no es compatible.",
  alternates: { canonical: "/armar-pc" },
};

type Props = PageProps<"/armar-pc">;

export default function BuilderPage({ searchParams }: Props) {
  return (
    <>
      <PageIntro title="Arma tu PC gamer">
        <p>
          Elige cada pieza y revisamos la compatibilidad mientras armas: socket, tipo de memoria, vatios de la fuente y medidas
          del gabinete.
        </p>
      </PageIntro>
      <div className="container-page pb-24">
        <Suspense fallback={<BuilderFallback />}>
          <BuilderWithData searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function BuilderWithData({ searchParams }: { searchParams: Props["searchParams"] }) {
  const [sp, parts] = await Promise.all([searchParams, getBuilderParts()]);
  const rawBudget = typeof sp.presupuesto === "string" ? Number(sp.presupuesto.replace(/\D/g, "")) : NaN;
  const budget = Number.isFinite(rawBudget) && rawBudget >= 500_000 && rawBudget <= 100_000_000 ? rawBudget : undefined;
  const shared = typeof sp.piezas === "string" ? sp.piezas : undefined;
  return <Builder parts={parts} budget={budget} sharedPicks={shared} />;
}

function BuilderFallback() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="hidden h-96 rounded-lg lg:block" />
    </div>
  );
}
