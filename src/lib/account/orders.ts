import type { BadgeVariant } from "@/components/ui/Badge";

/** Estados de pedido (columna orders.estado) en lenguaje del cliente. */
export const ORDER_STATUS: Record<string, { label: string; badge: BadgeVariant; hint: string }> = {
  pendiente: { label: "Pendiente de pago", badge: "poco-stock", hint: "Apartamos tu pedido; falta confirmar el pago." },
  pagado: { label: "Pagado", badge: "nuevo", hint: "Recibimos el pago y estamos preparando tu pedido." },
  requiere_revision: { label: "En revisión", badge: "poco-stock", hint: "Un asesor revisa tu pedido y te escribe pronto." },
  enviado: { label: "Enviado", badge: "nuevo", hint: "Tu pedido va en camino." },
  entregado: { label: "Entregado", badge: "neutral", hint: "Tu pedido fue entregado." },
  cancelado: { label: "Cancelado", badge: "agotado", hint: "Este pedido fue cancelado." },
};

export function orderStatus(estado: string) {
  return ORDER_STATUS[estado] ?? { label: estado, badge: "neutral" as const, hint: "" };
}

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" });
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
