import { createPublicClient } from "@/lib/supabase/public";
import { compatFromSpecs, type CompatAttrs } from "@/lib/compat";
import type { CategorySlug, FpsEstimate, Product, SpecValue } from "@/types/catalog";

const ROOT_SLUGS: CategorySlug[] = ["pc-gaming", "gameroom", "monitores", "perifericos"];

type CategoryRow = { slug: string; parent: { slug: string } | null };
type ProductRow = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  tipo: Product["tipo"];
  precio_cop: number;
  precio_anterior_cop: number | null;
  stock: number;
  specs: Record<string, SpecValue>;
  tags: string[];
  es_nuevo: boolean;
  es_destacado: boolean;
  mas_vendido: number;
  category: CategoryRow | null;
  brand: { nombre: string } | null;
  images: { url: string; alt: string; orden: number }[];
  benchmarks: { juego: string; resolucion: FpsEstimate["resolucion"]; fps_estimado: number; orden: number }[];
  compat?: (CompatAttrs & { product_id?: string }) | (CompatAttrs & { product_id?: string })[] | null;
};

/**
 * Los embebidos se nombran por la columna de la llave foránea (categoria_id, parent_id):
 * en una relación consigo misma, `parent:categories(...)` devuelve los HIJOS (un arreglo), no el padre.
 */
const SELECT = `
  id, slug, nombre, descripcion, tipo, precio_cop, precio_anterior_cop, stock, specs, tags,
  es_nuevo, es_destacado, mas_vendido,
  category:categoria_id ( slug, parent:parent_id ( slug ) ),
  brand:marca_id ( nombre ),
  images:product_images ( url, alt, orden ),
  benchmarks:pc_benchmarks ( juego, resolucion, fps_estimado, orden ),
  compat:compat_attrs ( socket, tipo_ram, tdp_w, potencia_w, factor_forma, formatos_soportados, largo_mm, alto_cooler_mm, max_gpu_mm, max_cooler_mm, tiene_igpu )
`;

/** Convierte una fila de Supabase al tipo Product que usa la interfaz. */
export function mapProductRow(row: ProductRow): Product | null {
  const cat = row.category;
  if (!cat) return null;
  // Producto en subcategoría (sillas) → categoría = padre (gameroom); en raíz (monitores) → ella misma.
  // Si llegara un arreglo (relación inversa), se descarta en vez de tomarlo por padre.
  const parent = Array.isArray(cat.parent) ? null : cat.parent;
  const root = (parent?.slug ?? cat.slug) as CategorySlug;
  if (!ROOT_SLUGS.includes(root)) return null;

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipo: row.tipo,
    categoria: root,
    subcategoria: cat.slug,
    marca: row.brand?.nombre ?? "",
    precioCop: row.precio_cop,
    precioAnteriorCop: row.precio_anterior_cop,
    stock: row.stock,
    specs: row.specs ?? {},
    tags: row.tags ?? [],
    esNuevo: row.es_nuevo,
    esDestacado: row.es_destacado,
    masVendido: row.mas_vendido,
    imagenes: [...(row.images ?? [])].sort((a, b) => a.orden - b.orden).map(({ url, alt }) => ({ url, alt })),
    fps: row.benchmarks?.length
      ? [...row.benchmarks]
          .sort((a, b) => a.orden - b.orden)
          .map((b) => ({ juego: b.juego, resolucion: b.resolucion, fps: b.fps_estimado }))
      : undefined,
    compat: row.tipo === "componente" ? mergeCompat(row) : undefined,
  };
}

/** Todos los productos activos (la RLS ya oculta los inactivos para el cliente anónimo). */
export async function fetchSupabaseProducts(): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select(SELECT).eq("activo", true).limit(2000);
  if (error) throw new Error(`No se pudo leer el catálogo de Supabase: ${error.message}`);
  return (data as unknown as ProductRow[]).map(mapProductRow).filter((p): p is Product => p !== null);
}

/** compat_attrs (lo que edita el admin) manda; lo que falte se toma de las specs. */
function mergeCompat(row: ProductRow): CompatAttrs {
  const fromSpecs = compatFromSpecs(row.specs ?? {});
  const attrs = Array.isArray(row.compat) ? row.compat[0] : row.compat;
  if (!attrs) return fromSpecs;
  const merged: CompatAttrs = { ...fromSpecs };
  for (const [k, v] of Object.entries(attrs)) {
    if (k !== "product_id" && v != null) (merged as Record<string, unknown>)[k] = v;
  }
  return merged;
}
