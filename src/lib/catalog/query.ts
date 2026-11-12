import type { CategorySlug, Product } from "@/types/catalog";

export type ProductQuery = {
  categoria?: CategorySlug;
  subcategoria?: string;
  soloDestacados?: boolean;
  soloNuevos?: boolean;
  orden?: "relevancia" | "mas-vendidos" | "precio-asc" | "precio-desc" | "nuevos";
  limite?: number;
};

/**
 * Filtra y ordena en memoria. El catálogo de una tienda pequeña (cientos de productos) cabe en caché
 * y filtrarlo aquí es más rápido que ir a la BD en cada combinación de filtros.
 */
export function applyQuery(all: Product[], query: ProductQuery = {}): Product[] {
  let list = all.slice();
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
      // Relevancia: con stock primero, luego destacados
      list.sort(
        (a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(b.esDestacado) - Number(a.esDestacado),
      );
  }
  return query.limite ? list.slice(0, query.limite) : list;
}
