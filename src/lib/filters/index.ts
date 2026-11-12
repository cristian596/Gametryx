/**
 * Filtros del catálogo en la URL: se comparten, funcionan con Atrás y son indexables.
 * Ejemplo: /monitores?marca=kairo,nordika&precio=500000-2000000&hz=165,240&orden=precio-asc&pagina=2
 */
import type { CategorySlug, Product, SpecValue } from "@/types/catalog";

export const PAGE_SIZE = 24;

export const SORTS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "mas-vendidos", label: "Más vendidos" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
  { value: "nuevos", label: "Nuevos primero" },
] as const;
export type SortValue = (typeof SORTS)[number]["value"];

/** Especificaciones filtrables por categoría (clave en specs → etiqueta y formato). */
export type SpecFacetDef = { key: string; param: string; label: string; unit?: string };

export const SPEC_FACETS: Record<CategorySlug, SpecFacetDef[]> = {
  "pc-gaming": [
    { key: "resolucion_objetivo", param: "resolucion", label: "Resolución" },
    { key: "componente", param: "componente", label: "Tipo de componente" },
  ],
  monitores: [
    { key: "tamano_pulgadas", param: "tamano", label: "Tamaño", unit: '"' },
    { key: "hz", param: "hz", label: "Frecuencia", unit: " Hz" },
    { key: "panel", param: "panel", label: "Panel" },
  ],
  perifericos: [{ key: "conexion", param: "conexion", label: "Conexión" }],
  gameroom: [],
};

export type Filters = {
  tipo?: string;
  marcas: string[];
  precioMin?: number;
  precioMax?: number;
  specs: Record<string, string[]>;
  disponible: boolean;
  orden: SortValue;
  pagina: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
/** Acepta "a,b" (URL canónica) y también a=1&a=2 (lo que envía un <form method="get"> sin JS). */
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? ""))
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);

export function slugifyValue(v: SpecValue) {
  return String(v)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Lee la URL de forma tolerante: los valores inválidos se ignoran, nunca rompen la página. */
export function parseFilters(params: RawParams, category: CategorySlug): Filters {
  // precio=min-max (canónico) o precio_min / precio_max (formulario sin JS)
  const rawPrecio =
    first(params.precio) ??
    (first(params.precio_min) || first(params.precio_max)
      ? `${(first(params.precio_min) ?? "").replace(/\D/g, "")}-${(first(params.precio_max) ?? "").replace(/\D/g, "")}`
      : undefined);
  const precio = rawPrecio?.match(/^(\d{0,10})-(\d{0,10})$/);
  const orden = SORTS.some((s) => s.value === first(params.orden)) ? (first(params.orden) as SortValue) : "relevancia";
  const pagina = Math.min(Math.max(1, Number.parseInt(first(params.pagina) ?? "1", 10) || 1), 500);
  const specs: Record<string, string[]> = {};
  for (const f of SPEC_FACETS[category]) {
    const vals = list(params[f.param]);
    if (vals.length) specs[f.key] = vals;
  }
  return {
    tipo: first(params.tipo)?.toLowerCase() || undefined,
    marcas: list(params.marca),
    precioMin: precio?.[1] ? Number(precio[1]) : undefined,
    precioMax: precio?.[2] ? Number(precio[2]) : undefined,
    specs,
    disponible: first(params.disponible) === "1",
    orden,
    pagina,
  };
}

/** Serializa a query string estable (mismo orden siempre: mejores URLs y caché). */
export function filtersToSearch(f: Filters, category: CategorySlug, patch: Partial<Filters> = {}) {
  const next = { ...f, ...patch };
  const sp = new URLSearchParams();
  if (next.tipo) sp.set("tipo", next.tipo);
  if (next.marcas.length) sp.set("marca", [...next.marcas].sort().join(","));
  if (next.precioMin != null || next.precioMax != null) sp.set("precio", `${next.precioMin ?? ""}-${next.precioMax ?? ""}`);
  for (const def of SPEC_FACETS[category]) {
    const vals = next.specs[def.key];
    if (vals?.length) sp.set(def.param, [...vals].sort().join(","));
  }
  if (next.disponible) sp.set("disponible", "1");
  if (next.orden !== "relevancia") sp.set("orden", next.orden);
  if (next.pagina > 1) sp.set("pagina", String(next.pagina));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function brandSlug(marca: string) {
  return slugifyValue(marca);
}

/** Filtra (sin paginar) según los filtros. La categoría ya viene aplicada. */
export function applyFilters(products: Product[], f: Filters): Product[] {
  return products.filter((p) => {
    if (f.tipo && p.subcategoria !== f.tipo) return false;
    if (f.marcas.length && !f.marcas.includes(brandSlug(p.marca))) return false;
    if (f.precioMin != null && p.precioCop < f.precioMin) return false;
    if (f.precioMax != null && p.precioCop > f.precioMax) return false;
    if (f.disponible && p.stock <= 0) return false;
    for (const [key, vals] of Object.entries(f.specs)) {
      const v = p.specs[key];
      if (v == null) return false;
      const pv = slugifyValue(v);
      // "2.4 GHz, Bluetooth" coincide con cualquiera de sus partes
      const parts = typeof v === "string" ? String(v).split(",").map((x) => slugifyValue(x)) : [pv];
      if (!vals.some((val) => val === pv || parts.includes(val))) return false;
    }
    return true;
  });
}

export type FacetOption = { value: string; label: string; count: number };
export type Facets = {
  marcas: FacetOption[];
  precio: { min: number; max: number };
  specs: { def: SpecFacetDef; options: FacetOption[] }[];
};

/**
 * Opciones disponibles con su conteo. Cada faceta se cuenta con los demás filtros aplicados
 * (sin el suyo), así nunca se ofrece una opción que deje la lista vacía.
 */
export function buildFacets(products: Product[], f: Filters, category: CategorySlug): Facets {
  const count = (items: Product[], getValues: (p: Product) => { value: string; label: string }[]) => {
    const map = new Map<string, FacetOption>();
    for (const p of items)
      for (const v of getValues(p)) {
        const cur = map.get(v.value) ?? { ...v, count: 0 };
        cur.count++;
        map.set(v.value, cur);
      }
    return [...map.values()];
  };

  const marcas = count(applyFilters(products, { ...f, marcas: [] }), (p) =>
    p.marca ? [{ value: brandSlug(p.marca), label: p.marca }] : [],
  ).sort((a, b) => a.label.localeCompare(b.label, "es"));

  const specs = SPEC_FACETS[category].map((def) => {
    const others = { ...f, specs: { ...f.specs } };
    delete others.specs[def.key];
    const options = count(applyFilters(products, others), (p) => {
      const v = p.specs[def.key];
      if (v == null || typeof v === "boolean") return [];
      const parts = typeof v === "string" && def.key === "conexion" ? v.split(",").map((s) => s.trim()) : [String(v)];
      return parts.map((x) => ({ value: slugifyValue(x), label: `${x}${def.unit ?? ""}` }));
    }).sort((a, b) => {
      const na = Number.parseFloat(a.label);
      const nb = Number.parseFloat(b.label);
      return Number.isNaN(na) || Number.isNaN(nb) ? a.label.localeCompare(b.label, "es") : na - nb;
    });
    return { def, options };
  }).filter((s) => s.options.length > 1 || (f.specs[s.def.key]?.length ?? 0) > 0);

  const prices = products.map((p) => p.precioCop);
  return {
    marcas,
    precio: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    specs,
  };
}

/** Cuántos filtros "de refinamiento" hay activos (sin contar orden ni página). */
export function activeFilterCount(f: Filters) {
  return (
    (f.tipo ? 1 : 0) +
    f.marcas.length +
    (f.precioMin != null || f.precioMax != null ? 1 : 0) +
    Object.values(f.specs).reduce((n, v) => n + v.length, 0) +
    (f.disponible ? 1 : 0)
  );
}

/**
 * SEO: una URL con un solo filtro simple (subcategoría o una marca) es una página útil → canonical propio.
 * Combinaciones, rangos, orden y paginación → canonical a la categoría y noindex,follow.
 */
export function seoForFilters(f: Filters, category: CategorySlug) {
  const refinements = activeFilterCount(f);
  const plainView = f.orden === "relevancia" && f.pagina === 1;
  const simple = plainView && (refinements === 0 || (refinements === 1 && (f.tipo || f.marcas.length === 1)));
  return {
    indexable: Boolean(simple),
    canonical: simple ? `/${category}${filtersToSearch({ ...f, orden: "relevancia", pagina: 1 }, category)}` : `/${category}`,
  };
}
