const NBSP = " ";

/** Agrupa miles con punto, sin depender del ICU del entorno (mismo resultado en servidor y cliente). */
function groupThousands(value: number) {
  return String(Math.abs(Math.round(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 1250000 → "$ 1.250.000" (espacio de no separación entre el signo y el número). */
export function formatCOP(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${NBSP}${groupThousands(value)}`;
}

/** Porcentaje de descuento redondeado. Devuelve 0 si no hay descuento real. */
export function discountPercent(price: number, previousPrice?: number | null) {
  if (!previousPrice || previousPrice <= price || previousPrice <= 0) return 0;
  return Math.round((1 - price / previousPrice) * 100);
}

/** Cuánto falta para el envío gratis (0 si ya se alcanzó). */
export function remainingForFreeShipping(subtotal: number, threshold: number) {
  return Math.max(0, threshold - subtotal);
}

/** Celular o fijo colombiano de 10 dígitos para leer: "3001234567" → "300 123 4567". */
export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : phone;
}
