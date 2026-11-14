"use client";

import { create } from "zustand";
import { hasSessionCookie } from "./session";

/**
 * Favoritos del usuario en memoria (los corazones de las tarjetas). La fuente de verdad es la tabla
 * `wishlist` en Supabase; aquí solo se cargan una vez por sesión y se actualizan de forma optimista.
 */
type FavoritesState = {
  ids: Set<string>;
  /** Para qué estado de sesión se cargaron (null = nunca) */
  loadedFor: boolean | null;
  loading: boolean;
  ensureLoaded: () => void;
  set: (productId: string, on: boolean) => void;
};

export const useFavorites = create<FavoritesState>()((set, get) => ({
  ids: new Set(),
  loadedFor: null,
  loading: false,
  ensureLoaded: () => {
    const signedIn = hasSessionCookie();
    const { loadedFor, loading } = get();
    if (loading || loadedFor === signedIn) return;
    if (!signedIn) {
      set({ ids: new Set(), loadedFor: false });
      return;
    }
    set({ loading: true });
    fetch("/api/favoritos", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d: { ids: string[] }) => set({ ids: new Set(d.ids), loadedFor: true, loading: false }))
      .catch(() => set({ loading: false, loadedFor: true }));
  },
  set: (productId, on) =>
    set((s) => {
      const ids = new Set(s.ids);
      if (on) ids.add(productId);
      else ids.delete(productId);
      return { ids };
    }),
}));
