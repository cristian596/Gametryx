import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { LinkButton } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockBadge } from "@/components/ui/StockBadge";
import { whatsappUrl } from "@/config/site";
import { getCategory } from "@/data/categories";
import { mockProducts } from "@/data/catalog.mock";
import { catalog } from "@/lib/catalog";

/** Versión mínima de la página de producto. La completa (galería, JSON-LD, relacionados) llega en la Fase 3b. */
export function generateStaticParams() {
  return mockProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) return {};
  return { title: product.nombre, description: product.descripcion };
}

function specLabel(key: string) {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function specValue(v: string | number | boolean) {
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

export default async function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategory(product.categoria);
  const image = product.imagenes[0];

  return (
    <div className="container-page pt-6 pb-24 md:pt-10">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-text">
              Inicio
            </Link>
          </li>
          <li aria-hidden>/</li>
          {category && (
            <>
              <li>
                <Link href={`/${category.slug}`} className="hover:text-text">
                  {category.nombre}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          )}
          <li aria-current="page" className="line-clamp-1 text-text">
            {product.nombre}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {image && (
          <Image
            src={image.url}
            alt={image.alt}
            width={800}
            height={800}
            priority
            unoptimized={image.url.endsWith(".svg")}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-square w-full rounded-md object-cover"
          />
        )}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-muted">{product.marca}</p>
            <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.01em] md:text-[40px]">
              {product.nombre}
            </h1>
            <p className="mt-3 text-base leading-relaxed md:text-lg">{product.descripcion}</p>
          </div>
          <PriceTag price={product.precioCop} previousPrice={product.precioAnteriorCop} size="lg" showAddi />
          <StockBadge stock={product.stock} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <AddToCartButton productId={product.id} productName={product.nombre} stock={product.stock} size="lg" className="sm:flex-1" />
            <LinkButton
              href={whatsappUrl(`Hola, quiero cotizar: ${product.nombre}`)}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
            >
              Cotizar por WhatsApp
            </LinkButton>
          </div>

          <section aria-labelledby="specs-title" className="rounded-md bg-surface p-5">
            <h2 id="specs-title" className="text-xl font-semibold">
              Especificaciones
            </h2>
            <dl className="mt-3 divide-y divide-surface-3">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-4 py-2.5 text-[15px]">
                  <dt className="text-muted">{specLabel(k)}</dt>
                  <dd className="price text-text">{specValue(v)}</dd>
                </div>
              ))}
            </dl>
          </section>

          {product.fps && product.fps.length > 0 && (
            <section aria-labelledby="fps-title" className="rounded-md bg-surface p-5">
              <h2 id="fps-title" className="text-xl font-semibold">
                FPS estimados
              </h2>
              <p className="mt-1 text-sm text-muted">
                Valores de referencia. Varían según la versión del juego, los drivers y la configuración.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {product.fps.map((f) => (
                  <li key={f.juego} className="flex items-baseline justify-between gap-4 text-[15px]">
                    <span>
                      {f.juego} <span className="text-muted">· {f.resolucion}</span>
                    </span>
                    <span className="price font-medium text-primary">~{f.fps} FPS</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
