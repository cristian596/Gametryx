import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { categories } from "@/data/categories";
import { catalog } from "@/lib/catalog";

/**
 * Inicio provisional de la Fase 1: comprueba layout, tarjetas y navegación.
 * El home completo (slider y las 11 secciones) se construye en la Fase 2.
 */
export default async function HomePage() {
  const featured = await catalog.getProducts({ soloDestacados: true, limite: 8 });

  return (
    <>
      <section className="container-page pt-12 pb-16 md:pt-20 md:pb-24">
        <h1 className="max-w-4xl text-[40px] leading-[0.95] font-bold tracking-[-0.03em] md:text-[80px]">
          Tu PC gamer, armado y probado
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">
          PC ensamblados, componentes, monitores, periféricos y gameroom, con envío a toda Colombia y un asesor
          que te acompaña de verdad.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/pc-gaming" size="lg">
            Ver PC gamer
          </LinkButton>
          <LinkButton href="/armar-pc" size="lg" variant="secondary">
            Armar mi PC
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="destacados" className="container-page pb-20 md:pb-28">
        <h2 id="destacados" className="text-[26px] font-semibold md:text-[44px]">
          Destacados
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {featured.map((p, i) => (
            <li key={p.id} className="flex min-w-0">
              <ProductCard product={p} priority={i < 2} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categorias" className="container-page pb-24 md:pb-32">
        <h2 id="categorias" className="text-[26px] font-semibold md:text-[44px]">
          Compra por categoría
        </h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/${c.slug}`}
                className="group flex h-full items-center justify-between gap-6 rounded-md bg-surface p-6 transition-colors hover:bg-surface-2"
              >
                <span>
                  <span className="block font-display text-2xl font-semibold">{c.nombre}</span>
                  <span className="mt-1 block text-[15px] text-muted">{c.descripcion}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-6 shrink-0 text-primary transition-transform duration-(--duration-fast) group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
