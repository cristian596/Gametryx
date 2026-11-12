"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { supabaseUrl } from "@/lib/supabase/env";
import { isAllowedImageUrl, productInputSchema } from "@/lib/validation/product";

export type SaveResult = { ok: true; id: string; slug: string } | { ok: false; error: string; field?: string };

const BUCKET_PREFIX = "/storage/v1/object/public/product-images/";

/**
 * Crea o actualiza un producto con sus imágenes, FPS y atributos de compatibilidad.
 * Se valida de nuevo en el servidor (nunca se confía en el formulario) y se escribe con la sesión
 * del admin: la RLS rechaza la escritura si no lo es.
 */
export async function saveProduct(payload: string): Promise<SaveResult> {
  const { supabase } = await requireAdmin();

  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return { ok: false, error: "No se pudo leer el formulario. Recarga la página e inténtalo de nuevo." };
  }
  const parsed = productInputSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Revisa los datos.", field: issue?.path.join(".") };
  }
  const p = parsed.data;

  const badImage = p.images.find((i) => !isAllowedImageUrl(i.url, supabaseUrl));
  if (badImage) return { ok: false, error: "Hay una imagen que no viene del almacenamiento de la tienda.", field: "images" };

  // Imágenes que se quitaron del producto: se borran también del almacenamiento
  const { data: previous } = await supabase.from("product_images").select("url").eq("product_id", p.id);
  const keep = new Set(p.images.map((i) => i.url));
  const orphanPaths = (previous ?? [])
    .map((r) => r.url as string)
    .filter((u) => !keep.has(u) && u.includes(BUCKET_PREFIX))
    .map((u) => decodeURIComponent(u.split(BUCKET_PREFIX)[1]));

  const row = {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    descripcion: p.descripcion,
    categoria_id: p.categoria_id,
    marca_id: p.marca_id,
    tipo: p.tipo,
    precio_cop: p.precio_cop,
    precio_anterior_cop: p.precio_anterior_cop,
    iva_pct: p.iva_pct,
    stock: p.stock,
    activo: p.activo,
    es_nuevo: p.es_nuevo,
    es_destacado: p.es_destacado,
    tags: p.tags,
    specs: Object.fromEntries(p.specs.map((s) => [s.key, s.value])),
  };

  const { error } = p.isNew
    ? await supabase.from("products").insert(row)
    : await supabase.from("products").update(row).eq("id", p.id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe un producto con ese enlace. Cambia el enlace.", field: "slug" };
    return { ok: false, error: `No se pudo guardar: ${error.message}` };
  }

  // Filas hijas: se reemplazan completas
  const steps = [
    supabase.from("product_images").delete().eq("product_id", p.id),
    supabase.from("pc_benchmarks").delete().eq("product_id", p.id),
  ];
  for (const s of await Promise.all(steps)) if (s.error) return { ok: false, error: s.error.message };

  if (p.images.length) {
    const r = await supabase
      .from("product_images")
      .insert(p.images.map((img, i) => ({ product_id: p.id, url: img.url, alt: img.alt || p.nombre, orden: i })));
    if (r.error) return { ok: false, error: r.error.message };
  }
  if (p.tipo === "pc_ensamblado" && p.fps.length) {
    const r = await supabase
      .from("pc_benchmarks")
      .insert(p.fps.map((f, i) => ({ product_id: p.id, juego: f.juego, resolucion: f.resolucion, fps_estimado: f.fps, orden: i })));
    if (r.error) return { ok: false, error: r.error.message };
  }

  const compat = p.tipo === "componente" && p.compat ? p.compat : null;
  const hasCompat = compat && Object.values(compat).some((v) => v != null && !(Array.isArray(v) && v.length === 0));
  const c = hasCompat
    ? await supabase.from("compat_attrs").upsert({ product_id: p.id, ...compat })
    : await supabase.from("compat_attrs").delete().eq("product_id", p.id);
  if (c.error) return { ok: false, error: c.error.message };

  if (orphanPaths.length) await supabase.storage.from("product-images").remove(orphanPaths);

  // La tienda ve el cambio de inmediato (caché del catálogo invalidada)
  updateTag(CATALOG_TAG);
  return { ok: true, id: p.id, slug: p.slug };
}

/** Activar / desactivar desde el listado, sin abrir el formulario. */
export async function setProductActive(id: string, activo: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update({ activo }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  updateTag(CATALOG_TAG);
  return { ok: true as const };
}
