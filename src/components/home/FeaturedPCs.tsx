import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockBadge } from "@/components/ui/StockBadge";
import type { Product } from "@/types/catalog";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

const tierCopy: Record<string, string> = {
  "1080p": "Full HD competitivo",
  "1440p": "2K a alta tasa de refresco",
  "4K": "4K con todo en ultra",
};

/** Tres niveles por resolución: cada tarjeta es una hoja de especificaciones con FPS estimados. */
export function FeaturedPCs({ tiers }: { tiers: Product[] }) {
  if (tiers.length === 0) return null;
  const maxFps = Math.max(...tiers.flatMap((t) => t.fps?.map((f) => f.fps) ?? [0]));

  return (
    <Section
      id="mejores-pc"
      title="Mejores PC armados"
      intro={<p>Elige según la resolución de tu monitor. Todos llegan armados y listos para conectar.</p>}
      link={{ href: "/pc-gaming?tipo=pc-armados", label: "Ver todos los PC" }}
    >
      <Reveal as="ul" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tiers.map((pc) => {
          const res = String(pc.specs.resolucion_objetivo);
          const image = pc.imagenes[0];
          return (
            <li key={pc.id} data-reveal-item className="relative flex flex-col rounded-lg bg-surface">
              <div className="flex items-start justify-between gap-4 p-6 pb-0">
                <div>
                  <p className="price text-[56px] leading-none font-medium text-primary md:text-[64px]">{res}</p>
                  <p className="mt-2 text-[15px] text-muted">{tierCopy[res] ?? ""}</p>
                </div>
                {image && (
                  <Image
                    src={image.url}
                    alt=""
                    width={112}
                    height={112}
                    unoptimized={image.url.endsWith(".svg")}
                    className="size-24 shrink-0 rounded-sm md:size-28"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-5 p-6">
                <h3 className="font-sans text-lg leading-snug font-semibold">
                  <Link href={`/producto/${pc.slug}`} className="after:absolute after:inset-0 hover:text-primary">
                    {pc.nombre}
                  </Link>
                </h3>
                <dl className="flex flex-col gap-2 text-[15px]">
                  {(["cpu", "gpu", "ram", "almacenamiento"] as const).map((k) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted">{{ cpu: "CPU", gpu: "Gráfica", ram: "RAM", almacenamiento: "Disco" }[k]}</dt>
                      <dd className="text-right font-medium">{String(pc.specs[k])}</dd>
                    </div>
                  ))}
                </dl>
                {pc.fps && (
                  <div>
                    <p className="text-sm text-muted">FPS estimados en {res}</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {pc.fps.map((f) => (
                        <li key={f.juego} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
                          <span className="truncate">{f.juego}</span>
                          <span className="price font-medium">~{f.fps}</span>
                          <span aria-hidden className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                            <span
                              className="block h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(6, Math.round((f.fps / maxFps) * 100))}%` }}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-auto flex flex-col gap-3 pt-2">
                  <PriceTag price={pc.precioCop} previousPrice={pc.precioAnteriorCop} showAddi />
                  <StockBadge stock={pc.stock} />
                  <div className="relative z-10">
                    <AddToCartButton productId={pc.id} productName={pc.nombre} stock={pc.stock} className="w-full" />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </Reveal>
      <p className="mt-4 text-sm text-muted">
        Los FPS son estimados de referencia: cambian según la versión del juego, los drivers y la configuración.
      </p>
    </Section>
  );
}
