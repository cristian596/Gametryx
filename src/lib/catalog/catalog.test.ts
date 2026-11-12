import { describe, expect, it } from "vitest";
import { mockProducts } from "@/data/catalog.mock";
import { applyQuery } from "./query";
import { mapProductRow } from "./supabase";

describe("applyQuery", () => {
  it("filtra por categoría y subcategoría", () => {
    const sillas = applyQuery(mockProducts, { categoria: "gameroom", subcategoria: "sillas" });
    expect(sillas.length).toBeGreaterThan(0);
    expect(sillas.every((p) => p.categoria === "gameroom" && p.subcategoria === "sillas")).toBe(true);
  });

  it("ordena por precio y respeta el límite", () => {
    const list = applyQuery(mockProducts, { orden: "precio-asc", limite: 5 });
    expect(list).toHaveLength(5);
    for (let i = 1; i < list.length; i++) expect(list[i].precioCop).toBeGreaterThanOrEqual(list[i - 1].precioCop);
  });

  it("en relevancia pone los agotados al final", () => {
    const list = applyQuery(mockProducts, { categoria: "monitores" });
    const firstOut = list.findIndex((p) => p.stock === 0);
    expect(firstOut === -1 || list.slice(firstOut).every((p) => p.stock === 0)).toBe(true);
  });

  it("no modifica la lista original", () => {
    const before = mockProducts.map((p) => p.id).join();
    applyQuery(mockProducts, { orden: "precio-desc" });
    expect(mockProducts.map((p) => p.id).join()).toBe(before);
  });
});

describe("mapProductRow", () => {
  const base = {
    id: "1",
    slug: "silla",
    nombre: "Silla",
    descripcion: "",
    tipo: "gameroom" as const,
    precio_cop: 100,
    precio_anterior_cop: null,
    stock: 2,
    specs: {},
    tags: [],
    es_nuevo: false,
    es_destacado: false,
    mas_vendido: 0,
    brand: { nombre: "Marca" },
    images: [
      { url: "/b.jpg", alt: "b", orden: 1 },
      { url: "/a.jpg", alt: "a", orden: 0 },
    ],
    benchmarks: [],
  };

  it("usa la categoría padre como raíz y la propia como subcategoría", () => {
    const p = mapProductRow({ ...base, category: { slug: "sillas", parent: { slug: "gameroom" } } });
    expect(p?.categoria).toBe("gameroom");
    expect(p?.subcategoria).toBe("sillas");
    expect(p?.imagenes.map((i) => i.url)).toEqual(["/a.jpg", "/b.jpg"]);
    expect(p?.fps).toBeUndefined();
  });

  it("acepta productos en una categoría raíz", () => {
    const p = mapProductRow({ ...base, category: { slug: "monitores", parent: null } });
    expect(p?.categoria).toBe("monitores");
  });

  it("descarta categorías desconocidas", () => {
    expect(mapProductRow({ ...base, category: { slug: "otra", parent: null } })).toBeNull();
    expect(mapProductRow({ ...base, category: null })).toBeNull();
  });
});
