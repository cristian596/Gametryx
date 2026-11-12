import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/PageIntro";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { categories, getCategory } from "@/data/categories";
import { catalog } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { Category } from "@/types/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const category = getCategory(categoria);
  if (!category) return {};
  return {
    title: category.nombre,
    description: category.descripcion,
    alternates: { canonical: `/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[categoria]">) {
  const { categoria } = await params;
  const category = getCategory(categoria);
  // Cache Components no admite dynamicParams=false: los slugs desconocidos se cortan aquí
  if (!category) notFound();

  return (
    <>
      <PageIntro title={category.nombre}>
        <p>{category.descripcion}</p>
      </PageIntro>
      <div className="container-page pb-24">
        <Suspense fallback={<GridFallback category={category} />}>
          <FilteredGrid category={category} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function FilteredGrid({
  category,
  searchParams,
}: {
  category: Category;
  searchParams: PageProps<"/[categoria]">["searchParams"];
}) {
  const sp = await searchParams;
  const tipoParam = typeof sp.tipo === "string" ? sp.tipo : undefined;
  const sub = category.subcategorias.find((s) => s.slug === tipoParam)?.slug;
  const products = await catalog.getProducts({ categoria: category.slug, subcategoria: sub });

  return (
    <>
      <SubcategoryChips category={category} active={sub} />
      <p className="mb-5 text-sm text-muted" aria-live="polite">
        {products.length} {products.length === 1 ? "producto" : "productos"}
      </p>
      {products.length === 0 ? (
        <div className="rounded-lg bg-surface p-8">
          <h2 className="text-2xl font-semibold">Aún no hay productos aquí</h2>
          <p className="mt-2 text-text">Escríbenos y te conseguimos lo que buscas.</p>
          <LinkButton href="/contacto" className="mt-5">
            Contáctanos
          </LinkButton>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {products.map((p) => (
            <li key={p.id} className="flex min-w-0">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SubcategoryChips({ category, active }: { category: Category; active?: string }) {
  if (category.subcategorias.length === 0) return null;
  const chip = "inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors";
  return (
    <nav aria-label={`Filtrar ${category.nombre}`} className="mb-4 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        <li>
          <Link
            href={`/${category.slug}`}
            aria-current={!active ? "page" : undefined}
            className={cn(chip, !active ? "bg-primary text-on-primary" : "bg-surface text-text hover:bg-surface-2")}
          >
            Todo
          </Link>
        </li>
        {category.subcategorias.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/${category.slug}?tipo=${s.slug}`}
              aria-current={active === s.slug ? "page" : undefined}
              className={cn(
                chip,
                "whitespace-nowrap",
                active === s.slug ? "bg-primary text-on-primary" : "bg-surface text-text hover:bg-surface-2",
              )}
            >
              {s.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function GridFallback({ category }: { category: Category }) {
  return (
    <>
      {category.subcategorias.length > 0 && <div className="mb-4 h-11" />}
      <div className="mb-5 h-5" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
