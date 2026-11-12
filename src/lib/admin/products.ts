import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductInput } from "@/lib/validation/product";

export type AdminCategory = { id: string; slug: string; nombre: string; parent_id: string | null; orden: number };
export type AdminBrand = { id: string; slug: string; nombre: string };

export type AdminProductRow = {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  precio_cop: number;
  precio_anterior_cop: number | null;
  stock: number;
  activo: boolean;
  es_destacado: boolean;
  updated_at: string;
  category: { nombre: string } | null;
  brand: { nombre: string } | null;
  images: { url: string; orden: number }[];
};

export async function listCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("categories").select("id, slug, nombre, parent_id, orden").order("orden");
  if (error) throw new Error(error.message);
  return data as AdminCategory[];
}

export async function listBrands(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("brands").select("id, slug, nombre").order("nombre");
  if (error) throw new Error(error.message);
  return data as AdminBrand[];
}

/** Listado del admin: incluye inactivos (la RLS los muestra solo a admins). */
export async function listAdminProducts(
  supabase: SupabaseClient,
  { q, estado }: { q?: string; estado?: "activos" | "inactivos" | "agotados" | "poco" },
) {
  let query = supabase
    .from("products")
    .select(
      "id, slug, nombre, tipo, precio_cop, precio_anterior_cop, stock, activo, es_destacado, updated_at, category:categoria_id ( nombre ), brand:marca_id ( nombre ), images:product_images ( url, orden )",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (q) {
    // Busca por nombre o enlace; se escapan los comodines de LIKE y las comas del filtro OR
    const term = q.replace(/[%_,()]/g, " ").trim().slice(0, 80);
    if (term) query = query.or(`nombre.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (estado === "activos") query = query.eq("activo", true);
  if (estado === "inactivos") query = query.eq("activo", false);
  if (estado === "agotados") query = query.eq("stock", 0);
  if (estado === "poco") query = query.gt("stock", 0).lte("stock", 5);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as unknown as AdminProductRow[];
}

export type EditableProduct = Omit<ProductInput, "isNew">;

export async function getProductForEdit(supabase: SupabaseClient, id: string): Promise<EditableProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, nombre, descripcion, categoria_id, marca_id, tipo, precio_cop, precio_anterior_cop, iva_pct, stock, activo, es_nuevo, es_destacado, tags, specs, images:product_images ( url, alt, orden ), fps:pc_benchmarks ( juego, resolucion, fps_estimado, orden ), compat:compat_attrs ( * )",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  type Row = typeof data & {
    images: { url: string; alt: string; orden: number }[];
    fps: { juego: string; resolucion: "1080p" | "1440p" | "4K"; fps_estimado: number; orden: number }[];
    compat: (Record<string, unknown> & { product_id?: string }) | Record<string, unknown>[] | null;
    specs: Record<string, string | number | boolean>;
  };
  const row = data as Row;
  const compatRaw = Array.isArray(row.compat) ? row.compat[0] : row.compat;
  let compat: EditableProduct["compat"] = null;
  if (compatRaw) {
    const { product_id: _ignored, ...rest } = compatRaw as Record<string, unknown>;
    void _ignored;
    compat = rest as EditableProduct["compat"];
  }

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion ?? "",
    categoria_id: row.categoria_id,
    marca_id: row.marca_id,
    tipo: row.tipo,
    precio_cop: row.precio_cop,
    precio_anterior_cop: row.precio_anterior_cop,
    iva_pct: row.iva_pct,
    stock: row.stock,
    activo: row.activo,
    es_nuevo: row.es_nuevo,
    es_destacado: row.es_destacado,
    tags: row.tags ?? [],
    specs: Object.entries((row.specs ?? {}) as Record<string, string | number | boolean>).map(([key, value]) => ({ key, value })),
    fps: [...(row.fps ?? [])].sort((a, b) => a.orden - b.orden).map((f) => ({ juego: f.juego, resolucion: f.resolucion, fps: f.fps_estimado })),
    compat,
    images: [...(row.images ?? [])].sort((a, b) => a.orden - b.orden).map(({ url, alt }) => ({ url, alt })),
  };
}
