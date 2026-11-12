import type { Category, CategorySlug } from "@/types/catalog";

export const categories: Category[] = [
  {
    slug: "pc-gaming",
    nombre: "PC Gaming",
    descripcion: "PC armados y probados para jugar, y los componentes para armar o mejorar el tuyo.",
    subcategorias: [
      { slug: "pc-armados", nombre: "PC armados" },
      { slug: "componentes", nombre: "Componentes" },
    ],
  },
  {
    slug: "gameroom",
    nombre: "Gameroom",
    descripcion: "Sillas gamer, escritorios, luces y todo lo que necesita tu cuarto para jugar cómodo.",
    subcategorias: [
      { slug: "sillas", nombre: "Sillas gamer" },
      { slug: "escritorios", nombre: "Escritorios" },
      { slug: "iluminacion", nombre: "Luces y ambientación" },
    ],
  },
  {
    slug: "monitores",
    nombre: "Monitores",
    descripcion: "Monitores gamer de 24 a 34 pulgadas, de 144 Hz en adelante.",
    subcategorias: [],
  },
  {
    slug: "perifericos",
    nombre: "Periféricos",
    descripcion: "Teclados, mouse, audífonos y equipo para hacer streaming.",
    subcategorias: [
      { slug: "teclados", nombre: "Teclados" },
      { slug: "mouse", nombre: "Mouse" },
      { slug: "audifonos", nombre: "Audífonos" },
      { slug: "streaming", nombre: "Streaming" },
    ],
  },
];

export const categorySlugs = categories.map((c) => c.slug);

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug) as Category | undefined;
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return (categorySlugs as string[]).includes(slug);
}
