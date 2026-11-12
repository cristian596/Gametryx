"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Carrito local (Zustand + localStorage).
 * Solo guarda ids y cantidades: los precios se leen del catálogo y el servidor los recalcula al pagar.
 * La Fase 6b completa el carrito lateral y el checkout.
 */
export type CartLine = { productId: string; quantity: number };

type CartState = {
  lines: CartLine[];
  add: (productId: string, quantity?: number, max?: number) => void;
  setQuantity: (productId: string, quantity: number, max?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const MAX_PER_LINE = 99;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId, quantity = 1, max = MAX_PER_LINE) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === productId ? { ...l, quantity: Math.min(l.quantity + quantity, max) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { productId, quantity: Math.min(quantity, max) }] };
        }),
      setQuantity: (productId, quantity, max = MAX_PER_LINE) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.productId !== productId)
              : s.lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(quantity, max) } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "volta-cart",
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          // Navegación privada o almacenamiento bloqueado: carrito solo en memoria
          const mem = new Map<string, string>();
          return {
            getItem: (k) => mem.get(k) ?? null,
            setItem: (k, v) => void mem.set(k, v),
            removeItem: (k) => void mem.delete(k),
          };
        }
      }),
    },
  ),
);

const noopSubscribe = () => () => {};

/** true solo en el cliente, después de hidratar. Evita desajustes de hidratación con datos de localStorage. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useCartCount() {
  const count = useCart((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));
  const hydrated = useHydrated();
  return hydrated ? count : 0;
}
