"use client";

import { useSyncExternalStore } from "react";

/**
 * ¿Hay cookie de sesión de Supabase? Es solo una pista para la interfaz (mostrar "Mi cuenta",
 * cargar favoritos): no autoriza nada. El servidor siempre verifica la sesión de verdad.
 */
export function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie);
}

const noop = () => () => {};

/** false en el servidor y en la hidratación; luego refleja la cookie en cada render. */
export function useHasSession() {
  return useSyncExternalStore(noop, hasSessionCookie, () => false);
}
