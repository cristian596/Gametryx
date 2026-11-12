import type { MetadataRoute } from "next";
import { absoluteUrl, isProductionSite } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Previews de Vercel y local: no se indexan para no competir con el sitio real
  if (!isProductionSite()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Solo rutas privadas o técnicas
      disallow: ["/api/", "/admin", "/cuenta", "/carrito", "/checkout", "/iniciar-sesion", "/registro"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
