/**
 * Configuración central de la tienda.
 *
 * ⚠️ Todos los datos de contacto y legales son de EJEMPLO.
 * Reemplázalos por los reales antes de lanzar (ver docs/PENDIENTES-LANZAMIENTO.md).
 */
export const site = {
  name: "VOLTA",
  tagline: "PC gamer, componentes y setup en Colombia",
  description:
    "PC gamer ensamblados, componentes, monitores, periféricos y todo para tu gameroom. Envío a toda Colombia y asesoría personal.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "es-CO",
  currency: "COP",

  /** EJEMPLO: número en formato internacional sin "+" ni espacios, para wa.me */
  whatsappNumber: "573000000000",
  /** EJEMPLO */
  whatsappDisplay: "+57 300 000 0000",
  whatsappDefaultMessage: "Hola, quiero asesoría para comprar en VOLTA.",
  /** EJEMPLO: dominio reservado .example */
  email: "hola@volta.example",
  /** EJEMPLO */
  supportHours: "Lunes a sábado, 9:00 a. m. a 7:00 p. m.",

  legal: {
    /** EJEMPLO */
    businessName: "VOLTA S.A.S. (ejemplo)",
    /** EJEMPLO */
    nit: "000.000.000-0",
    /** EJEMPLO */
    address: "Dirección de ejemplo, Bogotá, Colombia",
  },

  social: {
    /** EJEMPLO */
    tiktok: "https://www.tiktok.com/@volta.ejemplo",
    /** EJEMPLO */
    instagram: "https://www.instagram.com/volta.ejemplo",
    /** EJEMPLO */
    kick: "https://kick.com/volta-ejemplo",
  },

  shipping: {
    /** Compras desde este valor (COP, IVA incluido) tienen envío gratis */
    freeFrom: 500_000,
    /** EJEMPLO: tarifa fija para compras por debajo del umbral */
    flatRate: 18_000,
  },

  tax: {
    /** Los precios se guardan y muestran con IVA incluido */
    pricesIncludeVat: true,
    defaultVatPct: 19,
  },

  /** Métodos que se muestran en la web. Mientras no estén integrados, son informativos. */
  paymentMethods: [
    { id: "addi", name: "Addi", description: "Paga a cuotas con Addi" },
    { id: "bre-b", name: "Bre-B", description: "Transferencia inmediata desde tu banco" },
    { id: "efectivo", name: "Efectivo", description: "Te contamos cómo pagar con tu asesor" },
    { id: "vanti", name: "Vanti", description: "Financia con tu factura de gas" },
  ],
} as const;

export function whatsappUrl(message: string = site.whatsappDefaultMessage) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
