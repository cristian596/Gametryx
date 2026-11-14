"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { site } from "@/config/site";
import { allowRequest } from "@/lib/auth/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addressSchema,
  changeEmailSchema,
  changePasswordSchema,
  fieldErrors,
  profileSchema,
} from "@/lib/validation/account";
import type { FormState } from "./form-state";

/**
 * Acciones de /cuenta. Cada una vuelve a comprobar la sesión con Supabase (getUser)
 * y escribe con el cliente del usuario: la RLS solo deja tocar sus propias filas.
 */

const SESSION_EXPIRED: FormState = { error: "Tu sesión terminó. Vuelve a iniciar sesión." };
const MAX_ADDRESSES = 10;

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Reautenticación: confirma la contraseña actual antes de cambiar correo o contraseña. */
async function checkCurrentPassword(email: string, password: string, userId: string) {
  if (!(await allowRequest(`reauth:${userId}`, 5, 900))) return "limit" as const;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? ("wrong" as const) : ("ok" as const);
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({ nombre: formData.get("nombre"), telefono: formData.get("telefono") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await currentUser();
  if (!user) return SESSION_EXPIRED;

  const { error } = await supabase
    .from("profiles")
    .update({ nombre: parsed.data.nombre, telefono: parsed.data.telefono || null })
    .eq("id", user.id);
  if (error) {
    console.error("[perfil]", error.message);
    return { error: "No pudimos guardar tus datos. Inténtalo de nuevo." };
  }
  revalidatePath("/cuenta/datos");
  return { ok: "saved" };
}

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = changeEmailSchema.safeParse({ email: formData.get("email"), actual: formData.get("actual") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await currentUser();
  if (!user?.email) return SESSION_EXPIRED;
  if (parsed.data.email === user.email.toLowerCase()) {
    return { fieldErrors: { email: "Ese ya es tu correo actual." } };
  }

  const check = await checkCurrentPassword(user.email, parsed.data.actual, user.id);
  if (check === "limit") return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  if (check === "wrong") return { fieldErrors: { actual: "La contraseña actual no coincide." } };

  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${site.url}/auth/confirm?next=${encodeURIComponent("/cuenta/datos?aviso=correo")}` },
  );
  if (error) {
    if (error.code === "email_exists") return { fieldErrors: { email: "No puedes usar ese correo. Prueba con otro." } };
    if (error.status === 429) return { error: "Enviamos demasiados correos en poco tiempo. Inténtalo en unos minutos." };
    console.error("[correo]", error.code ?? error.status, error.message);
    return { error: "No pudimos cambiar el correo. Inténtalo de nuevo." };
  }
  return { ok: "email-sent" };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = changePasswordSchema.safeParse({
    actual: formData.get("actual"),
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await currentUser();
  if (!user?.email) return SESSION_EXPIRED;

  const check = await checkCurrentPassword(user.email, parsed.data.actual, user.id);
  if (check === "limit") return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  if (check === "wrong") return { fieldErrors: { actual: "La contraseña actual no coincide." } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { password: "Esa contraseña es fácil de adivinar. Prueba con otra." } };
    console.error("[contraseña]", error.code ?? error.status, error.message);
    return { error: "No pudimos cambiar la contraseña. Inténtalo de nuevo." };
  }
  return { ok: "password-saved" };
}

// ───────────── Direcciones ─────────────

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = addressSchema.safeParse({
    id: formData.get("id") || undefined,
    alias: formData.get("alias"),
    destinatario: formData.get("destinatario"),
    telefono: formData.get("telefono"),
    departamento: formData.get("departamento"),
    ciudad: formData.get("ciudad"),
    direccion: formData.get("direccion"),
    complemento: formData.get("complemento") || undefined,
    es_principal: formData.get("es_principal") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await currentUser();
  if (!user) return SESSION_EXPIRED;

  const { id, es_principal, ...fields } = parsed.data;
  const { data: existing } = await supabase.from("addresses").select("id, es_principal").eq("user_id", user.id);
  const list = existing ?? [];
  if (!id && list.length >= MAX_ADDRESSES) {
    return { error: `Puedes guardar hasta ${MAX_ADDRESSES} direcciones. Elimina una para agregar otra.` };
  }
  if (id && !list.some((a) => a.id === id)) return { error: "Esa dirección ya no existe. Recarga la página." };

  // La primera dirección siempre es la principal
  const makeMain = Boolean(es_principal) || list.length === 0 || (list.length === 1 && list[0].id === id);
  if (makeMain) {
    // Solo una principal por usuario (índice único): primero se quita la anterior
    await supabase.from("addresses").update({ es_principal: false }).eq("user_id", user.id).eq("es_principal", true);
  }

  const row = { ...fields, complemento: fields.complemento || null, ...(makeMain ? { es_principal: true } : {}) };
  const { error } = id
    ? await supabase.from("addresses").update(row).eq("id", id)
    : await supabase.from("addresses").insert({ ...row, user_id: user.id });
  if (error) {
    console.error("[direccion]", error.message);
    return { error: "No pudimos guardar la dirección. Inténtalo de nuevo." };
  }
  revalidatePath("/cuenta/direcciones");
  return { ok: id ? "updated" : "created" };
}

const idSchema = z.uuid();

export async function deleteAddress(id: string): Promise<FormState> {
  if (!idSchema.safeParse(id).success) return { error: "Dirección no válida." };
  const { supabase, user } = await currentUser();
  if (!user) return SESSION_EXPIRED;

  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { error: "No pudimos eliminar la dirección. Inténtalo de nuevo." };

  // Si se borró la principal, la más antigua pasa a serlo
  const { data: rest } = await supabase
    .from("addresses")
    .select("id, es_principal")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (rest && rest.length > 0 && !rest.some((a) => a.es_principal)) {
    await supabase.from("addresses").update({ es_principal: true }).eq("id", rest[0].id);
  }
  revalidatePath("/cuenta/direcciones");
  return { ok: "deleted" };
}

export async function setMainAddress(id: string): Promise<FormState> {
  if (!idSchema.safeParse(id).success) return { error: "Dirección no válida." };
  const { supabase, user } = await currentUser();
  if (!user) return SESSION_EXPIRED;

  const { data: target } = await supabase.from("addresses").select("id").eq("id", id).maybeSingle();
  if (!target) return { error: "Esa dirección ya no existe. Recarga la página." };

  await supabase.from("addresses").update({ es_principal: false }).eq("user_id", user.id).eq("es_principal", true);
  const { error } = await supabase.from("addresses").update({ es_principal: true }).eq("id", id);
  if (error) return { error: "No pudimos cambiar la dirección principal. Inténtalo de nuevo." };
  revalidatePath("/cuenta/direcciones");
  return { ok: "main" };
}

// ───────────── Favoritos ─────────────

export type FavoriteResult = { status: "ok"; favorito: boolean } | { status: "login" } | { status: "error" };

export async function toggleFavorite(productId: string, favorito: boolean): Promise<FavoriteResult> {
  if (!idSchema.safeParse(productId).success) return { status: "error" };
  const { supabase, user } = await currentUser();
  if (!user) return { status: "login" };

  const { error } = favorito
    ? await supabase.from("wishlist").upsert({ user_id: user.id, product_id: productId }, { ignoreDuplicates: true })
    : await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
  if (error) {
    console.error("[favoritos]", error.message);
    return { status: "error" };
  }
  revalidatePath("/cuenta/favoritos");
  return { status: "ok", favorito };
}
