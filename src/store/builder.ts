"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Slot } from "@/lib/compat";

/** Armado en curso: solo guarda el slug elegido por hueco. Precios y compatibilidad se recalculan con el catálogo actual. */
type BuilderState = {
  picks: Partial<Record<Slot, string>>;
  setPick: (slot: Slot, slug: string | null) => void;
  replaceAll: (picks: Partial<Record<Slot, string>>) => void;
  clear: () => void;
};

export const useBuilder = create<BuilderState>()(
  persist(
    (set) => ({
      picks: {},
      setPick: (slot, slug) =>
        set((s) => {
          const picks = { ...s.picks };
          if (slug) picks[slot] = slug;
          else delete picks[slot];
          return { picks };
        }),
      replaceAll: (picks) => set({ picks }),
      clear: () => set({ picks: {} }),
    }),
    {
      name: "volta-armado",
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          const mem = new Map<string, string>();
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
        }
      }),
    },
  ),
);

export { paramToPicks, picksToParam } from "./builder-params";
