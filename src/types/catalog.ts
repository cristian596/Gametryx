export type ProductType = "pc_ensamblado" | "componente" | "monitor" | "periferico" | "gameroom";

/** Las cuatro categorías del navbar (cada una tiene su página /[categoria]). */
export type CategorySlug = "pc-gaming" | "gameroom" | "monitores" | "perifericos";

export type SpecValue = string | number | boolean;

export type ProductImage = { url: string; alt: string };

export type FpsEstimate = { juego: string; resolucion: "1080p" | "1440p" | "4K"; fps: number };

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  tipo: ProductType;
  categoria: CategorySlug;
  /** Subcategoría usada en filtros (?tipo=…): pc-armados, componentes, sillas, teclados… */
  subcategoria: string;
  marca: string;
  /** COP enteros, IVA incluido */
  precioCop: number;
  precioAnteriorCop?: number | null;
  stock: number;
  specs: Record<string, SpecValue>;
  tags: string[];
  esNuevo: boolean;
  esDestacado: boolean;
  /** Unidades vendidas (para ordenar "más vendidos") */
  masVendido: number;
  imagenes: ProductImage[];
  fps?: FpsEstimate[];
  /** Atributos del armador (solo componentes) */
  compat?: CompatAttrs;
};

export type { CompatAttrs } from "@/lib/compat";
import type { CompatAttrs } from "@/lib/compat";

export type Category = {
  slug: CategorySlug;
  nombre: string;
  descripcion: string;
  subcategorias: { slug: string; nombre: string }[];
};
