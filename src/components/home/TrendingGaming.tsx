import Image from "next/image";
import Link from "next/link";
import { ProductRow } from "@/components/product/ProductRow";
import { popularSearches } from "@/lib/home";
import type { Product } from "@/types/catalog";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

/** 8. Lo más buscado para gaming y streaming: búsquedas populares + productos de streaming. */
export function TrendingGaming({ products }: { products: Product[] }) {
  return (
    <Section
      id="lo-mas-buscado"
      title="Lo más buscado para gaming y streaming"
      intro={<p>Lo que más nos preguntan quienes juegan y transmiten.</p>}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <h3 className="font-sans text-base font-semibold">Búsquedas populares</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {popularSearches.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="inline-flex h-11 items-center rounded-full bg-surface px-4 text-[15px] font-medium transition-colors hover:bg-primary hover:text-on-primary"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Foto de ambiente (no es un producto VOLTA). Ver public/images/CREDITOS.md */}
          <Image
            src="/images/streaming.jpg"
            alt="Micrófono de streaming frente a un monitor encendido"
            width={1600}
            height={1068}
            sizes="(min-width: 1024px) 400px, 100vw"
            className="mt-6 aspect-[4/3] w-full rounded-lg object-cover object-[55%_60%]"
          />
        </Reveal>
        {products.length > 0 && (
          <Reveal as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-8">
            {products.map((p) => (
              <li key={p.id} data-reveal-item className="min-w-0">
                <ProductRow product={p} subtitle={p.marca} />
              </li>
            ))}
          </Reveal>
        )}
      </div>
    </Section>
  );
}
