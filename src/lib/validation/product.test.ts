import { describe, expect, it } from "vitest";
import { coerceSpecValue, isAllowedImageUrl, productInputSchema, slugify } from "./product";

const base = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  isNew: true,
  nombre: "Monitor 27 pulgadas",
  slug: "monitor-27",
  descripcion: "",
  categoria_id: "2c9e6679-7425-40de-944b-e07fc1f90ae7",
  marca_id: null,
  tipo: "monitor",
  precio_cop: 1_000_000,
  precio_anterior_cop: null,
  iva_pct: 19,
  stock: 3,
  activo: true,
  es_nuevo: false,
  es_destacado: false,
  tags: [],
  specs: [{ key: "hz", value: 165 }],
  fps: [],
  compat: null,
  images: [],
};

describe("productInputSchema", () => {
  it("acepta un producto válido", () => {
    expect(productInputSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza un precio anterior menor o igual al actual", () => {
    const r = productInputSchema.safeParse({ ...base, precio_anterior_cop: 900_000 });
    expect(r.success).toBe(false);
  });

  it("rechaza enlaces con tildes o espacios", () => {
    expect(productInputSchema.safeParse({ ...base, slug: "Monitor Gamer" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, slug: "monitor-ñ" }).success).toBe(false);
  });

  it("rechaza specs repetidas y precios negativos o con decimales", () => {
    expect(productInputSchema.safeParse({ ...base, specs: [{ key: "hz", value: 1 }, { key: "hz", value: 2 }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, precio_cop: -1 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, precio_cop: 10.5 }).success).toBe(false);
  });
});

describe("ayudantes", () => {
  it("slugify quita tildes, ñ y símbolos", () => {
    expect(slugify('Silla gamer ergonómica 27" ñandú')).toBe("silla-gamer-ergonomica-27-nandu");
  });
  it("coerceSpecValue convierte números y sí/no", () => {
    expect(coerceSpecValue("250")).toBe(250);
    expect(coerceSpecValue("0.03")).toBe(0.03);
    expect(coerceSpecValue("Sí")).toBe(true);
    expect(coerceSpecValue("IPS")).toBe("IPS");
  });
  it("solo permite imágenes del bucket o locales", () => {
    const sb = "https://abc.supabase.co";
    expect(isAllowedImageUrl(`${sb}/storage/v1/object/public/product-images/x/a.webp`, sb)).toBe(true);
    expect(isAllowedImageUrl("/placeholders/pc.svg", sb)).toBe(true);
    expect(isAllowedImageUrl("https://otro.com/a.jpg", sb)).toBe(false);
    expect(isAllowedImageUrl(`${sb}/storage/v1/object/public/otro-bucket/a.jpg`, sb)).toBe(false);
  });
});
