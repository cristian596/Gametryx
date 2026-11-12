/**
 * Ayudantes de SEO: URLs absolutas y datos estructurados (JSON-LD).
 * Regla: el JSON-LD solo declara lo que la página muestra. Por eso Organization no incluye
 * teléfono ni dirección mientras sean de EJEMPLO (ver src/config/site.ts).
 */
import { site } from "@/config/site";
import { stockState } from "@/components/ui/StockBadge";
import type { Product } from "@/types/catalog";

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

/** ¿Es el sitio de producción? En previews de Vercel y en local no se indexa. */
export function isProductionSite() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production" && !site.url.includes("localhost");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/volta-icon.svg"),
    description: site.description,
    areaServed: { "@type": "Country", name: "Colombia" },
    currenciesAccepted: "COP",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: absoluteUrl("/"),
    inLanguage: "es-CO",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function productJsonLd(p: Product) {
  const state = stockState(p.stock);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.descripcion,
    sku: p.id,
    url: absoluteUrl(`/producto/${p.slug}`),
    image: p.imagenes.map((i) => absoluteUrl(i.url)),
    ...(p.marca ? { brand: { "@type": "Brand", name: p.marca } } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/producto/${p.slug}`),
      priceCurrency: "COP",
      price: p.precioCop,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        state === "agotado"
          ? "https://schema.org/OutOfStock"
          : state === "poco"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: site.name },
    },
  };
}
