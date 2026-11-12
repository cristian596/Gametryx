import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductRow } from "@/components/product/ProductRow";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockBadge } from "@/components/ui/StockBadge";
import type { Product } from "@/types/catalog";
import { Rail, RailItem } from "./Rail";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

/** 4. Productos nuevos: fila deslizable. */
export function NewProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <Section
      id="nuevos"
      title="Productos nuevos"
      intro={<p>Lo último que llegó a la tienda.</p>}
      link={{ href: "/pc-gaming", label: "Ver catálogo" }}
    >
      <Rail label="Productos nuevos">
        {products.map((p) => (
          <RailItem key={p.id}>
            <ProductCard product={p} />
          </RailItem>
        ))}
      </Rail>
    </Section>
  );
}

/** 5. Mejores monitores: uno protagonista grande y el resto en filas compactas. */
export function TopMonitors({ products }: { products: Product[] }) {
  const [main, ...rest] = products;
  if (!main) return null;
  const spec = (p: Product) => `${p.specs.tamano_pulgadas}" · ${p.specs.hz} Hz · ${p.specs.panel} · ${p.specs.resolucion}`;
  const mainImage = main.imagenes[0];

  return (
    <Section
      id="monitores"
      title="Mejores monitores"
      intro={<p>Los que más se llevan nuestros clientes, de 24 a 34 pulgadas.</p>}
      link={{ href: "/monitores", label: "Ver monitores" }}
    >
      <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <article data-reveal-item className="group relative grid min-w-0 overflow-hidden rounded-lg bg-surface sm:grid-cols-2 lg:col-span-7">
          {mainImage && (
            <Image
              src={mainImage.url}
              alt=""
              width={600}
              height={600}
              unoptimized={mainImage.url.endsWith(".svg")}
              className="aspect-square h-full w-full object-cover transition-transform duration-(--duration-slow) group-hover:scale-[1.03]"
            />
          )}
          <div className="flex flex-col gap-4 p-6 lg:p-8">
            <div className="flex gap-2">
              <Badge variant="neutral">Más vendido</Badge>
              {main.esNuevo && <Badge variant="nuevo">Nuevo</Badge>}
            </div>
            <h3 className="font-sans text-xl leading-snug font-semibold">
              <Link href={`/producto/${main.slug}`} className="after:absolute after:inset-0">
                {main.nombre}
              </Link>
            </h3>
            <p className="price text-[15px] text-muted">{spec(main)}</p>
            <div className="mt-auto flex flex-col gap-3">
              <PriceTag price={main.precioCop} previousPrice={main.precioAnteriorCop} size="lg" showAddi />
              <StockBadge stock={main.stock} />
              <div className="relative z-10">
                <AddToCartButton productId={main.id} productName={main.nombre} stock={main.stock} className="w-full" />
              </div>
            </div>
          </div>
        </article>

        <ul className="flex min-w-0 flex-col gap-3 lg:col-span-5">
          {rest.map((p) => (
            <li key={p.id} data-reveal-item className="flex-1">
              <ProductRow product={p} subtitle={spec(p)} />
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

/** 6. Periféricos más vendidos: rejilla de 4. */
export function TopPeripherals({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <Section
      id="perifericos"
      title="Periféricos más vendidos"
      intro={<p>Los teclados, mouse y audífonos que más se llevan nuestros clientes.</p>}
      link={{ href: "/perifericos", label: "Ver periféricos" }}
    >
      <Reveal as="ul" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id} data-reveal-item className="flex min-w-0">
            <ProductCard product={p} />
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
