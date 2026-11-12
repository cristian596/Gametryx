"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { slugify } from "@/lib/validation/product";

export type BrandState = { ok?: boolean; error?: string; message?: string };

const nameSchema = z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(60);

export async function createBrand(_prev: BrandState, formData: FormData): Promise<BrandState> {
  const { supabase } = await requireAdmin("/admin/marcas");
  const parsed = nameSchema.safeParse(formData.get("nombre"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const slug = slugify(parsed.data);
  const { error } = await supabase.from("brands").insert({ nombre: parsed.data, slug });
  if (error) return { error: error.code === "23505" ? "Esa marca ya existe." : error.message };
  updateTag(CATALOG_TAG);
  return { ok: true, message: `Marca “${parsed.data}” creada.` };
}

export async function renameBrand(_prev: BrandState, formData: FormData): Promise<BrandState> {
  const { supabase } = await requireAdmin("/admin/marcas");
  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = nameSchema.safeParse(formData.get("nombre"));
  if (!id.success) return { error: "Marca no válida." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // El enlace (slug) no cambia: así no se rompen URLs con ?marca= ya compartidas
  const { error } = await supabase.from("brands").update({ nombre: parsed.data }).eq("id", id.data);
  if (error) return { error: error.message };
  updateTag(CATALOG_TAG);
  return { ok: true, message: "Guardado." };
}
