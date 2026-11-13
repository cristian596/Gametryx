import { z } from "zod";

import { quoteBudgets, quoteInterests } from "./quote-options";

export { quoteBudgets, quoteInterests };

/** Esquema compartido del formulario de cotización (cliente ahora; API /api/quotes en la Fase 5). */

/** Celular colombiano (3XX) o fijo con el indicativo nuevo (60X), 10 dígitos, con o sin +57. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
}

export const quoteSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80, "Usa máximo 80 caracteres."),
  telefono: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => /^[36]\d{9}$/.test(v), "Escribe un número de 10 dígitos, por ejemplo 300 123 4567."),
  correo: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Revisa el correo, por ejemplo nombre@correo.com.")
    .optional(),
  interes: z.enum(quoteInterests.map((i) => i.value) as [string, ...string[]], {
    error: "Elige qué estás buscando.",
  }),
  presupuesto: z.enum(quoteBudgets.map((b) => b.value) as [string, ...string[]], {
    error: "Elige un rango de presupuesto.",
  }),
  mensaje: z.string().trim().max(1000, "Usa máximo 1.000 caracteres.").optional(),
  autorizacion: z.literal(true, { error: "Necesitamos tu autorización para contactarte." }),
  /** Campo trampa: los humanos lo dejan vacío. El servidor descarta en silencio si viene lleno. */
  empresa: z.string().max(200).optional(),
  /** Armado del armador ("cpu:slug,board:slug"); el servidor lo vuelve a leer del catálogo */
  armado: z.string().max(600).optional(),
});

/** Versión de la política de datos aceptada (se guarda con cada autorización). Actualizar al publicar la definitiva. */
export const PRIVACY_POLICY_VERSION = "2026-11-borrador";

export type QuoteInput = z.infer<typeof quoteSchema>;
