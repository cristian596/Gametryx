/**
 * Capa de repositorio del catálogo.
 * - Con NEXT_PUBLIC_SUPABASE_URL y la clave publicable → lee de Supabase.
 * - Sin ellas → usa el catálogo de ejemplo (desarrollo sin BD).
 * El catálogo completo se guarda en caché con la etiqueta "catalog"; el admin la invalida al guardar (Fase 4).
 */
import { cacheLife, cacheTag } from "next/cache";
import { mockProducts } from "@/data/catalog.mock";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Product } from "@/types/catalog";
import { applyQuery, type ProductQuery } from "./query";
import { fetchSupabaseProducts } from "./supabase";

export type { ProductQuery } from "./query";

export const CATALOG_TAG = "catalog";

let warned = false;

async function loadCatalog(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  // Respaldo si el admin no invalida: como máximo unos minutos desactualizado
  cacheLife("minutes");

  if (isSupabaseConfigured) return fetchSupabaseProducts();

  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn("[catalog] Supabase no está configurado: se muestra el catálogo de EJEMPLO.");
  }
  return mockProducts;
}

export interface CatalogRepository {
  getProducts(query?: ProductQuery): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
}

export const catalog: CatalogRepository = {
  async getProducts(query) {
    return applyQuery(await loadCatalog(), query);
  },
  async getProductBySlug(slug) {
    return (await loadCatalog()).find((p) => p.slug === slug) ?? null;
  },
};

export const catalogSource = isSupabaseConfigured ? "supabase" : "mock";
