import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { QuoteForm } from "@/components/home/QuoteForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { Skeleton } from "@/components/ui/Skeleton";
import { site } from "@/config/site";
import { getBuilderParts } from "@/lib/builder-parts";
import { checkBuild, SLOTS, type Build } from "@/lib/compat";
import { formatCOP } from "@/lib/format";
import { paramToPicks } from "@/store/builder-params";

export const metadata: Metadata = {
  title: "Cotiza tu PC",
  description: "Cuéntanos qué quieres jugar y tu presupuesto. Un asesor te responde por WhatsApp con opciones, sin compromiso.",
  alternates: { canonical: "/cotizacion" },
};

type Props = PageProps<"/cotizacion">;

export default function QuotePage({ searchParams }: Props) {
  return (
    <>
      <PageIntro title="Cotiza tu PC">
        <p>Cuéntanos qué quieres jugar y cuánto quieres invertir. Un asesor te responde por WhatsApp con opciones, sin compromiso.</p>
      </PageIntro>
      <div className="container-page grid grid-cols-1 gap-10 pb-24 lg:grid-cols-12">
        <Suspense fallback={<Skeleton className="h-[640px] w-full rounded-lg lg:col-span-12" />}>
          <QuoteWithBuild searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function QuoteWithBuild({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const param = typeof sp.armado === "string" ? sp.armado : undefined;

  const build: Build = {};
  if (param) {
    const parts = await getBuilderParts();
    const picks = paramToPicks(param, new Set(parts.map((p) => `${p.slot}:${p.slug}`)));
    for (const s of SLOTS) {
      const part = parts.find((p) => p.slot === s.slot && p.slug === picks[s.slot]);
      if (part) build[s.slot] = part;
    }
  }
  const hasBuild = Object.keys(build).length > 0;
  const result = hasBuild ? checkBuild(build) : null;

  return (
    <>
      <aside className="flex flex-col gap-6 lg:col-span-5">
        {hasBuild && result ? (
          <section aria-labelledby="armado-title" className="rounded-lg bg-surface p-5">
            <h2 id="armado-title" className="text-xl font-semibold">
              Tu armado
            </h2>
            <ul className="mt-3 flex flex-col divide-y divide-surface-2 text-[15px]">
              {SLOTS.filter((s) => build[s.slot]).map((s) => (
                <li key={s.slot} className="flex justify-between gap-4 py-2.5">
                  <span>
                    <span className="block text-sm text-muted">{s.label}</span>
                    {build[s.slot]!.nombre}
                  </span>
                  <span className="price shrink-0">{formatCOP(build[s.slot]!.precio)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-surface-3 pt-3 font-semibold">
              Total <span className="price">{formatCOP(result.total)}</span>
            </p>
            {result.errores.length > 0 && (
              <p className="mt-3 rounded-md bg-danger/15 p-3 text-sm">
                Tiene {result.errores.length} incompatibilidad{result.errores.length > 1 ? "es" : ""}: el asesor te propone cómo
                resolverla{result.errores.length > 1 ? "s" : ""}.
              </p>
            )}
            <Link href={`/armar-pc?piezas=${encodeURIComponent(param ?? "")}`} className="mt-4 inline-block text-sm font-semibold text-accent">
              Volver al armador
            </Link>
          </section>
        ) : (
          <section className="rounded-lg bg-surface p-5">
            <h2 className="text-xl font-semibold">¿Ya sabes qué piezas quieres?</h2>
            <p className="mt-2 text-[15px]">Ármalo en el armador y envíalo desde ahí: revisamos la compatibilidad por ti.</p>
            <Link href="/armar-pc" className="mt-3 inline-block font-semibold text-accent">
              Ir al armador
            </Link>
          </section>
        )}
        <dl className="flex flex-col gap-5 px-1">
          {[
            { k: "Sin compromiso", v: "Te damos opciones; tú decides si compras." },
            { k: "A tu medida", v: "Ajustamos cada pieza a lo que juegas y a tu presupuesto." },
            { k: "Atención", v: site.supportHours },
          ].map((i) => (
            <div key={i.k}>
              <dt className="font-display text-lg font-semibold">{i.k}</dt>
              <dd className="mt-1 text-[15px] text-muted">{i.v}</dd>
            </div>
          ))}
        </dl>
      </aside>
      <div className="lg:col-span-7">
        <QuoteForm armado={hasBuild ? param : undefined} defaultInteres={hasBuild ? "armar-pc" : undefined} />
      </div>
    </>
  );
}
