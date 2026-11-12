import { catalog } from "@/lib/catalog";
import type { Product } from "@/types/catalog";

/** Productos que protagonizan el hero. Se cambian aquí (más adelante, desde el admin). */
export const HERO_PC_SLUG = "pc-volta-surge-1440p";
export const HERO_GPU_SLUG = "rtx-5070-12gb";

/** Los tres niveles de "Mejores PC armados", en orden de resolución. */
export const TIER_SLUGS = ["pc-volta-pulse-1080p", "pc-volta-surge-1440p", "pc-volta-storm-4k"];

export async function getHomeData() {
  const [heroPc, heroGpu, pcs, nuevos, monitores, perifericos, todos] = await Promise.all([
    catalog.getProductBySlug(HERO_PC_SLUG),
    catalog.getProductBySlug(HERO_GPU_SLUG),
    catalog.getProducts({ categoria: "pc-gaming", subcategoria: "pc-armados" }),
    catalog.getProducts({ soloNuevos: true, limite: 10 }),
    catalog.getProducts({ categoria: "monitores", orden: "mas-vendidos", limite: 4 }),
    catalog.getProducts({ categoria: "perifericos", orden: "mas-vendidos", limite: 4 }),
    catalog.getProducts({ orden: "mas-vendidos" }),
  ]);

  const tiers = TIER_SLUGS.map((s) => pcs.find((p) => p.slug === s)).filter(Boolean) as Product[];
  const streaming = todos.filter((p) => p.tags.includes("streaming") && p.stock > 0).slice(0, 4);

  return { heroPc, heroGpu, pcs, tiers, nuevos, monitores, perifericos, streaming };
}

/** Búsquedas populares (enlaces a categorías con filtro). Editables a mano hasta tener analítica. */
export const popularSearches = [
  { label: "RTX 5070", href: "/pc-gaming?tipo=componentes" },
  { label: "Monitor 240 Hz", href: "/monitores" },
  { label: "PC para streaming", href: "/pc-gaming?tipo=pc-armados" },
  { label: "Micrófono USB", href: "/perifericos?tipo=streaming" },
  { label: "Capturadora", href: "/perifericos?tipo=streaming" },
  { label: "Silla ergonómica", href: "/gameroom?tipo=sillas" },
  { label: "Mouse inalámbrico", href: "/perifericos?tipo=mouse" },
  { label: "Luces LED", href: "/gameroom?tipo=iluminacion" },
];
