/**
 * Solo rutas internas que empiecen por `prefix`: evita redirecciones abiertas a otros sitios
 * (`//otro.com`, `/\otro.com`, `https://…`).
 */
export function safeNext(next: unknown, fallback: string, prefix = "/") {
  if (typeof next !== "string" || next.length > 300) return fallback;
  if (!next.startsWith(prefix) || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
