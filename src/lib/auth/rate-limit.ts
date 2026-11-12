import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** IP del visitante, cifrada: el límite de frecuencia no guarda IPs en claro. */
export async function clientKey(prefix: string, extra = "") {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  const hash = createHash("sha256").update(`${ip}|${extra.toLowerCase()}`).digest("hex").slice(0, 32);
  return `${prefix}:${hash}`;
}

/**
 * true si la acción está permitida. Si la BD no responde, deja pasar (no bloquea el login por una caída)
 * pero lo registra.
 */
export async function allowRequest(key: string, max: number, windowSeconds: number) {
  try {
    const { data, error } = await createSupabaseAdminClient().rpc("rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch (e) {
    console.error("[rate-limit] no disponible:", e instanceof Error ? e.message : e);
    return true;
  }
}
