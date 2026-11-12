import { z } from "zod";

export const PRODUCT_TYPES = [
  { value: "pc_ensamblado", label: "PC armado" },
  { value: "componente", label: "Componente" },
  { value: "monitor", label: "Monitor" },
  { value: "periferico", label: "Periférico" },
  { value: "gameroom", label: "Gameroom" },
] as const;

export const RESOLUTIONS = ["1080p", "1440p", "4K"] as const;
export const RAM_TYPES = ["DDR4", "DDR5"] as const;
export const FORM_FACTORS = ["ATX", "mATX", "ITX", "E-ATX"] as const;

const int = (min: number, max: number) => z.number().int().min(min).max(max);
const optInt = (min: number, max: number) => int(min, max).nullable().optional();

export const slugSchema = z
  .string()
  .trim()
  .min(3, "El enlace debe tener al menos 3 caracteres.")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (sin tildes ni espacios).");

/** Imágenes permitidas: las subidas al bucket del proyecto o las locales de /public. */
export function isAllowedImageUrl(url: string, supabaseUrl: string) {
  if (url.startsWith("/placeholders/") || url.startsWith("/images/")) return true;
  return Boolean(supabaseUrl) && url.startsWith(`${supabaseUrl}/storage/v1/object/public/product-images/`);
}

export const compatSchema = z.object({
  socket: z.string().trim().max(20).nullable().optional(),
  tipo_ram: z.enum(RAM_TYPES).nullable().optional(),
  tdp_w: optInt(1, 2000),
  potencia_w: optInt(1, 3000),
  factor_forma: z.enum(FORM_FACTORS).nullable().optional(),
  formatos_soportados: z.array(z.enum(FORM_FACTORS)).max(4).optional(),
  largo_mm: optInt(1, 1000),
  alto_cooler_mm: optInt(1, 500),
  max_gpu_mm: optInt(1, 1000),
  max_cooler_mm: optInt(1, 500),
  slots_ram: optInt(1, 16),
  m2_slots: optInt(0, 16),
  tiene_igpu: z.boolean().nullable().optional(),
});

export const productInputSchema = z
  .object({
    id: z.uuid(),
    isNew: z.boolean(),
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(200),
    slug: slugSchema,
    descripcion: z.string().trim().max(2000, "Usa máximo 2.000 caracteres."),
    categoria_id: z.uuid("Elige una categoría."),
    marca_id: z.uuid().nullable(),
    tipo: z.enum(PRODUCT_TYPES.map((t) => t.value) as [string, ...string[]], { error: "Elige el tipo de producto." }),
    precio_cop: int(0, 1_000_000_000),
    precio_anterior_cop: int(1, 1_000_000_000).nullable(),
    iva_pct: int(0, 100),
    stock: int(0, 100_000),
    activo: z.boolean(),
    es_nuevo: z.boolean(),
    es_destacado: z.boolean(),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20),
    specs: z
      .array(
        z.object({
          key: z
            .string()
            .trim()
            .regex(/^[a-z0-9_]{1,40}$/, "Las claves de especificación usan minúsculas, números y _ (ej. vram_gb)."),
          value: z.union([z.string().trim().min(1).max(200), z.number(), z.boolean()]),
        }),
      )
      .max(40),
    fps: z
      .array(z.object({ juego: z.string().trim().min(1).max(80), resolucion: z.enum(RESOLUTIONS), fps: int(1, 2000) }))
      .max(12),
    compat: compatSchema.nullable(),
    images: z
      .array(z.object({ url: z.string().trim().min(1).max(500), alt: z.string().trim().max(200) }))
      .max(12, "Máximo 12 imágenes por producto."),
  })
  .refine((p) => p.precio_anterior_cop == null || p.precio_anterior_cop > p.precio_cop, {
    message: "El precio anterior debe ser mayor que el precio actual (o déjalo vacío).",
    path: ["precio_anterior_cop"],
  })
  .refine((p) => new Set(p.specs.map((s) => s.key)).size === p.specs.length, {
    message: "Hay especificaciones repetidas.",
    path: ["specs"],
  });

export type ProductInput = z.infer<typeof productInputSchema>;

/** "250" → 250, "sí"/"no" → booleano, el resto texto. Así las specs numéricas se pueden filtrar y ordenar. */
export function coerceSpecValue(raw: string): string | number | boolean {
  const v = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^(si|sí|true)$/i.test(v)) return true;
  if (/^(no|false)$/i.test(v)) return false;
  return v;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}
