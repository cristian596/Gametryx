import { z } from "zod";
import { departamentos } from "@/data/colombia";
import { normalizePhone } from "./quote";

/** Esquemas de la cuenta de usuario: se usan en las Server Actions (el servidor siempre valida). */

const email = z.string().trim().toLowerCase().max(120).pipe(z.email("Escribe un correo válido, por ejemplo nombre@correo.com."));

/** 72 es el límite de bcrypt (Supabase): más caracteres se ignorarían en silencio. */
export const passwordSchema = z
  .string()
  .min(8, "Usa mínimo 8 caracteres.")
  .max(72, "Usa máximo 72 caracteres.")
  .refine((v) => /[a-zA-ZÀ-ÿ]/.test(v) && /\d/.test(v), "Combina letras y números.");

const nombre = z.string().trim().min(2, "Escribe tu nombre.").max(120, "Usa máximo 120 caracteres.");

const phone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^[36]\d{9}$/.test(v), "Escribe un número de 10 dígitos, por ejemplo 300 123 4567.");

const optionalPhone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => v === "" || /^[36]\d{9}$/.test(v), "Escribe un número de 10 dígitos, por ejemplo 300 123 4567.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  nombre,
  email,
  telefono: optionalPhone,
  password: passwordSchema,
  autorizacion: z.literal("on", { error: "Necesitamos tu autorización para crear la cuenta." }),
  marketing: z.literal("on").optional(),
});

export const emailOnlySchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmar: z.string() })
  .refine((v) => v.password === v.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden." });

export const profileSchema = z.object({ nombre, telefono: optionalPhone });

export const changeEmailSchema = z.object({
  email,
  actual: z.string().min(1, "Escribe tu contraseña actual.").max(200),
});

export const changePasswordSchema = z
  .object({
    actual: z.string().min(1, "Escribe tu contraseña actual.").max(200),
    password: passwordSchema,
    confirmar: z.string(),
  })
  .refine((v) => v.password === v.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden." })
  .refine((v) => v.password !== v.actual, { path: ["password"], message: "Usa una contraseña distinta a la actual." });

export const addressSchema = z.object({
  id: z.uuid().optional(),
  alias: z.string().trim().min(1, "Ponle un nombre, por ejemplo Casa.").max(40, "Usa máximo 40 caracteres."),
  destinatario: z.string().trim().min(2, "Escribe quién recibe.").max(120, "Usa máximo 120 caracteres."),
  telefono: phone,
  departamento: z.enum(departamentos.map((d) => d.nombre) as [string, ...string[]], { error: "Elige el departamento." }),
  ciudad: z.string().trim().min(2, "Escribe la ciudad o municipio.").max(80, "Usa máximo 80 caracteres."),
  direccion: z.string().trim().min(5, "Escribe la dirección, por ejemplo Calle 10 # 20-30.").max(160, "Usa máximo 160 caracteres."),
  complemento: z.string().trim().max(160, "Usa máximo 160 caracteres.").optional(),
  es_principal: z.literal("on").optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/** Errores de Zod como { campo: mensaje } (el primero de cada campo). */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Código del correo (Supabase envía 6 dígitos por defecto; se aceptan hasta 10 por si se cambia la longitud). */
export const codeSchema = z.object({
  email,
  token: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6,10}$/, "Escribe el código de 6 dígitos que te enviamos.")),
});
