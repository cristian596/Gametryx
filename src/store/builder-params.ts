import type { Slot } from "@/lib/compat";

/** "cpu:ryzen-7,board:b650" ↔ { cpu: "ryzen-7", board: "b650" } para compartir el armado por enlace. */
export function picksToParam(picks: Partial<Record<Slot, string>>) {
  return Object.entries(picks)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
}

export function paramToPicks(param: string | undefined, valid: Set<string>): Partial<Record<Slot, string>> {
  const out: Partial<Record<Slot, string>> = {};
  for (const pair of (param ?? "").split(",").slice(0, 12)) {
    const [slot, slug] = pair.split(":");
    if (slot && slug && valid.has(`${slot}:${slug}`)) out[slot as Slot] = slug;
  }
  return out;
}
