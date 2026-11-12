import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { catalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

/** Solo URLs indexables: inicio, categorías, subcategorías (un filtro simple), productos y páginas fijas. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await catalog.getProducts();

  const fixed = ["/", "/armar-pc", "/cotizacion", "/contacto", "/terminos", "/privacidad", "/cookies"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.5,
  }));

  const cats = categories.flatMap((c) => [
    { url: absoluteUrl(`/${c.slug}`), changeFrequency: "daily" as const, priority: 0.8 },
    ...c.subcategorias.map((s) => ({
      url: absoluteUrl(`/${c.slug}?tipo=${s.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ]);

  const items = products.map((p) => ({
    url: absoluteUrl(`/producto/${p.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.6,
    images: p.imagenes.map((i) => absoluteUrl(i.url)),
  }));

  return [...fixed, ...cats, ...items];
}
