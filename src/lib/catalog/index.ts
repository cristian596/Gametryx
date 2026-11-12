/**
 * Capa de repositorio del catálogo.
 * Hoy lee del catálogo de ejemplo; en la Fase 3a se añade la implementación con Supabase
 * y este archivo elige cuál usar según las variables de entorno.
 */
import { mockProducts } from "@/data/catalog.mock";
import type { CategorySlug, Product } from "@/types/catalog";

export type ProductQuery = {
  categoria?: CategorySlug;
  subcategoria?: string;
  soloDestacados?: boolean;
  soloNuevos?: boolean;
  orden?: "relevancia" | "mas-vendidos" | "precio-asc" | "precio-desc" | "nuevos";
  limite?: number;
};

export interface CatalogRepository {
  getProducts(query?: ProductQuery): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
}

const mockRepository: CatalogRepository = {
  async getProducts(query = {}) {
    let list = mockProducts.slice();
    if (query.categoria) list = list.filter((p) => p.categoria === query.categoria);
    if (query.subcategoria) list = list.filter((p) => p.subcategoria === query.subcategoria);
    if (query.soloDestacados) list = list.filter((p) => p.esDestacado);
    if (query.soloNuevos) list = list.filter((p) => p.esNuevo);

    switch (query.orden) {
      case "mas-vendidos":
        list.sort((a, b) => b.masVendido - a.masVendido);
        break;
      case "precio-asc":
        list.sort((a, b) => a.precioCop - b.precioCop);
        break;
      case "precio-desc":
        list.sort((a, b) => b.precioCop - a.precioCop);
        break;
      case "nuevos":
        list.sort((a, b) => Number(b.esNuevo) - Number(a.esNuevo));
        break;
      default:
        // relevancia: con stock primero, luego destacados
        list.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(b.esDestacado) - Number(a.esDestacado));
    }
    return query.limite ? list.slice(0, query.limite) : list;
  },
  async getProductBySlug(slug) {
    return mockProducts.find((p) => p.slug === slug) ?? null;
  },
};

export const catalog: CatalogRepository = mockRepository;
