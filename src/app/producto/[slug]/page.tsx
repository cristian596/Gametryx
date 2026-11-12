import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockBadge } from "@/components/ui/StockBadge";
import { site, whatsappUrl } from "@/config/site";
import { getCategory } from "@/data/categories";
import { catalog } from "@/lib/catalog";
import { discountPercent, formatCOP } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { specLabel, specValue } from "@/lib/specs";

type Props = PageProps<"/producto/[slug]">;

export async function generateStaticParams() {
  const products = await catalog.getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) return {};
  const description = `${product.descripcion} ${formatCOP(product.precioCop)} IVA incluido. Envío a toda Colombia.`.slice(0, 160);
  const image = product.imagenes[0];
  return {
    title: product.nombre,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.nombre,
      description,
      url: `/producto/${product.slug}`,
      images: image && !image.url.endsWith(".svg") ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategory(product.categoria);
  const sub = category?.subcategorias.find((s) => s.slug === product.subcategoria);
  const pct = discountPercent(product.precioCop, product.precioAnteriorCop);
  const related = (await catalog.getProducts({ categoria: product.categoria, subcategoria: product.subcategoria }))
    .filter((p) => p.id !== product.id && p.stock > 0)
    .slice(0, 4);

  const crumbs = [
    { name: "Inicio", path: "/" },
    ...(category ? [{ name: category.nombre, path: `/${category.slug}` }] : []),
    ...(category && sub ? [{ name: sub.nombre, path: `/${category.slug}?tipo=${sub.slug}` }] : []),
    { name: product.nombre, path: `/producto/${product.slug}` },
  ];
  const freeShipping = product.precioCop >= site.shipping.freeFrom;

  return (
    <div className="container-page pt-6 pb-24 md:pt-10">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((c, i) => (
            <li key={c.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i === crumbs.length - 1 ? (
                <span aria-current="page" className="line-clamp-1 text-text">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="hover:text-text">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="md:sticky md:top-28 md:self-start">
          <ProductGallery images={product.imagenes} name={product.nombre} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {pct > 0 && <Badge variant="oferta">-{pct}%</Badge>}
              {product.esNuevo && <Badge variant="nuevo">Nuevo</Badge>}
            </div>
            <p className="text-muted">{product.marca}</p>
            <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.01em] md:text-[40px]">{product.nombre}</h1>
            <p className="mt-3 text-base leading-relaxed md:text-lg">{product.descripcion}</p>
          </div>

          <PriceTag price={product.precioCop} previousPrice={product.precioAnteriorCop} size="lg" showAddi />
          <StockBadge stock={product.stock} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <AddToCartButton productId={product.id} productName={product.nombre} stock={product.stock} size="lg" className="sm:flex-1" />
            <LinkButton
              href={whatsappUrl(`Hola, quiero información sobre: ${product.nombre}`)}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
            >
              Preguntar por WhatsApp
            </LinkButton>
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <li className="rounded-md bg-surface p-4">
              <p className="font-semibold">{freeShipping ? "Envío gratis" : `Envío ${formatCOP(site.shipping.flatRate)}`}</p>
              <p className="mt-1 text-sm text-muted">
                A toda Colombia.{" "}
                {!freeShipping && <>Gratis desde {formatCOP(site.shipping.freeFrom)}.</>}
              </p>
            </li>
            <li className="rounded-md bg-surface p-4">
              <p className="font-semibold">Garantía y retracto</p>
              <p className="mt-1 text-sm text-muted">
                Garantía legal y 5 días hábiles para retractarte de compras en línea.{" "}
                <Link href="/terminos#garantias" className="text-accent underline-offset-4 hover:underline">
                  Condiciones
                </Link>
              </p>
            </li>
          </ul>

          <section aria-labelledby="specs-title" className="rounded-md bg-surface p-5">
            <h2 id="specs-title" className="text-xl font-semibold">
              Especificaciones
            </h2>
            <dl className="mt-3 divide-y divide-surface-3">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-4 py-2.5 text-[15px]">
                  <dt className="text-muted">{specLabel(k)}</dt>
                  <dd className="text-text">{specValue(k, v)}</dd>
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
                Valores de referencia. Cambian según la versión del juego, los drivers y la configuración.
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

      {related.length > 0 && (
        <section aria-labelledby="relacionados-title" className="mt-20">
          <h2 id="relacionados-title" className="text-[26px] font-bold md:text-[36px]">
            También te puede interesar
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id} className="flex min-w-0">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
