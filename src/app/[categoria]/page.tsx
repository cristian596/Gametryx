import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { X } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageIntro } from "@/components/layout/PageIntro";
import { FilterForm } from "@/components/product/FilterForm";
import { ProductCard } from "@/components/product/ProductCard";
import { SortSelect } from "@/components/product/SortSelect";
import { LinkButton } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { categories, getCategory } from "@/data/categories";
import { catalog } from "@/lib/catalog";
import { applyQuery } from "@/lib/catalog/query";
import {
  activeFilterCount,
  applyFilters,
  buildFacets,
  filtersToSearch,
  PAGE_SIZE,
  parseFilters,
  seoForFilters,
  SPEC_FACETS,
  type Filters,
} from "@/lib/filters";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/cn";
import { formatCOP } from "@/lib/format";
import type { Category } from "@/types/catalog";

type Props = PageProps<"/[categoria]">;

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const category = getCategory(categoria);
  if (!category) return {};
  const f = parseFilters(await searchParams, category.slug);
  const sub = category.subcategorias.find((s) => s.slug === f.tipo);
  const seo = seoForFilters(f, category.slug);
  const title = sub ? `${sub.nombre} · ${category.nombre}` : category.nombre;
  return {
    title,
    description: category.descripcion,
    alternates: { canonical: seo.canonical },
    robots: seo.indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description: category.descripcion, url: seo.canonical },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const category = getCategory(categoria);
  // Cache Components no admite dynamicParams=false: los slugs desconocidos se cortan aquí
  if (!category) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: category.nombre, path: `/${category.slug}` },
        ])}
      />
      <PageIntro title={category.nombre}>
        <p>{category.descripcion}</p>
      </PageIntro>
      <div className="container-page pb-24">
        <Suspense fallback={<GridFallback category={category} />}>
          <Listing category={category} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Listing({ category, searchParams }: { category: Category; searchParams: Props["searchParams"] }) {
  const f = parseFilters(await searchParams, category.slug);
  // Una subcategoría que no existe se ignora en vez de dejar la lista vacía
  if (f.tipo && !category.subcategorias.some((s) => s.slug === f.tipo)) f.tipo = undefined;

  const all = await catalog.getProducts({ categoria: category.slug });
  const facets = buildFacets(all, f, category.slug);
  const filtered = applyQuery(applyFilters(all, f), { orden: f.orden });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(f.pagina, pages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = activeFilterCount(f);

  return (
    <>
      <SubcategoryChips category={category} active={f.tipo} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <FilterForm category={category.slug} filters={f} facets={facets} total={filtered.length} activeCount={active} />

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-muted" aria-live="polite">
              <span className="price text-text">{filtered.length}</span> {filtered.length === 1 ? "producto" : "productos"}
            </p>
            <SortSelect value={f.orden} />
          </div>

          <ActiveChips category={category} filters={f} facets={buildFacets(all, parseFilters({}, category.slug), category.slug)} />

          {visible.length === 0 ? (
            <div className="rounded-lg bg-surface p-8">
              <h2 className="text-2xl font-semibold">No hay productos con esos filtros</h2>
              <p className="mt-2">Quita alguno o escríbenos: si no lo tenemos, te lo conseguimos.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <LinkButton href={`/${category.slug}`}>Quitar filtros</LinkButton>
                <LinkButton href="/contacto" variant="secondary">
                  Contáctanos
                </LinkButton>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {visible.map((p, i) => (
                <li key={p.id} className="flex min-w-0">
                  <ProductCard product={p} priority={i < 2} />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && <Pagination category={category} filters={f} page={page} pages={pages} />}
        </div>
      </div>
    </>
  );
}

function ActiveChips({ category, filters: f, facets }: { category: Category; filters: Filters; facets: ReturnType<typeof buildFacets> }) {
  const chips: { label: string; href: string }[] = [];
  const href = (patch: Partial<Filters>) => `/${category.slug}${filtersToSearch({ ...f, ...patch, pagina: 1 }, category.slug)}`;

  for (const m of f.marcas) {
    const label = facets.marcas.find((o) => o.value === m)?.label ?? m;
    chips.push({ label, href: href({ marcas: f.marcas.filter((x) => x !== m) }) });
  }
  if (f.precioMin != null || f.precioMax != null) {
    const label =
      f.precioMin != null && f.precioMax != null
        ? `${formatCOP(f.precioMin)} a ${formatCOP(f.precioMax)}`
        : f.precioMin != null
          ? `Desde ${formatCOP(f.precioMin)}`
          : `Hasta ${formatCOP(f.precioMax!)}`;
    chips.push({ label, href: href({ precioMin: undefined, precioMax: undefined }) });
  }
  for (const def of SPEC_FACETS[category.slug]) {
    for (const v of f.specs[def.key] ?? []) {
      const opt = facets.specs.find((s) => s.def.key === def.key)?.options.find((o) => o.value === v);
      chips.push({
        label: opt?.label ?? v,
        href: href({ specs: { ...f.specs, [def.key]: f.specs[def.key].filter((x) => x !== v) } }),
      });
    }
  }
  if (f.disponible) chips.push({ label: "Solo disponibles", href: href({ disponible: false }) });
  if (chips.length === 0) return null;

  return (
    <ul aria-label="Filtros activos" className="mb-5 flex flex-wrap gap-2">
      {chips.map((c) => (
        <li key={c.label}>
          <Link
            href={c.href}
            scroll={false}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 pr-2.5 pl-3.5 text-sm font-medium transition-colors hover:bg-surface-3"
          >
            {c.label}
            <X aria-hidden className="size-4 text-muted" />
            <span className="sr-only">(quitar filtro)</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pagination({ category, filters, page, pages }: { category: Category; filters: Filters; page: number; pages: number }) {
  const href = (n: number) => `/${category.slug}${filtersToSearch({ ...filters, pagina: n }, category.slug)}`;
  const item = "grid h-11 min-w-11 place-items-center rounded-sm px-3 text-[15px] font-semibold transition-colors";
  return (
    <nav aria-label="Páginas" className="mt-10 flex justify-center">
      <ul className="flex flex-wrap gap-2">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={href(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Página ${n}`}
              className={cn(item, n === page ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-2")}
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SubcategoryChips({ category, active }: { category: Category; active?: string }) {
  if (category.subcategorias.length === 0) return null;
  const chip = "inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors";
  const items = [{ slug: undefined as string | undefined, nombre: "Todo" }, ...category.subcategorias];
  return (
    <nav aria-label={`Secciones de ${category.nombre}`} className="mb-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {items.map((s) => {
          const isActive = active === s.slug;
          return (
            <li key={s.slug ?? "todo"}>
              <Link
                href={s.slug ? `/${category.slug}?tipo=${s.slug}` : `/${category.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(chip, isActive ? "bg-primary text-on-primary" : "bg-surface text-text hover:bg-surface-2")}
              >
                {s.nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GridFallback({ category }: { category: Category }) {
  return (
    <>
      {category.subcategorias.length > 0 && <div className="mb-6 h-11" />}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
