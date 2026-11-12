import { describe, expect, it } from "vitest";
import { mockProducts } from "@/data/catalog.mock";
import { applyFilters, buildFacets, filtersToSearch, parseFilters, seoForFilters } from "./index";

const monitores = mockProducts.filter((p) => p.categoria === "monitores");
const perifericos = mockProducts.filter((p) => p.categoria === "perifericos");

describe("parseFilters / filtersToSearch", () => {
  it("lee y vuelve a escribir la URL de forma estable", () => {
    const f = parseFilters({ marca: "nordika,kairo", precio: "500000-2000000", hz: "240,165", orden: "precio-asc", pagina: "2" }, "monitores");
    expect(f.marcas).toEqual(["nordika", "kairo"]);
    expect(f.precioMin).toBe(500000);
    expect(f.precioMax).toBe(2000000);
    expect(f.specs.hz).toEqual(["240", "165"]);
    expect(filtersToSearch(f, "monitores")).toBe("?marca=kairo%2Cnordika&precio=500000-2000000&hz=165%2C240&orden=precio-asc&pagina=2");
  });

  it("ignora valores inválidos sin romper", () => {
    const f = parseFilters({ precio: "abc", orden: "hackeo", pagina: "-4", hz: "" }, "monitores");
    expect(f.precioMin).toBeUndefined();
    expect(f.orden).toBe("relevancia");
    expect(f.pagina).toBe(1);
    expect(f.specs).toEqual({});
    expect(filtersToSearch(f, "monitores")).toBe("");
  });

  it("entiende lo que envía un formulario sin JavaScript", () => {
    const f = parseFilters({ marca: ["kairo", "nordika"], precio_min: "500.000", precio_max: "" }, "monitores");
    expect(f.marcas).toEqual(["kairo", "nordika"]);
    expect(f.precioMin).toBe(500000);
    expect(f.precioMax).toBeUndefined();
  });

  it("acepta rangos abiertos", () => {
    const f = parseFilters({ precio: "-1000000" }, "monitores");
    expect(f.precioMin).toBeUndefined();
    expect(f.precioMax).toBe(1000000);
  });
});

describe("applyFilters", () => {
  it("filtra por spec numérica y por marca", () => {
    const r = applyFilters(monitores, parseFilters({ hz: "165" }, "monitores"));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.specs.hz === 165)).toBe(true);
    const k = applyFilters(monitores, parseFilters({ marca: "kairo" }, "monitores"));
    expect(k.every((p) => p.marca === "Kairo")).toBe(true);
  });

  it("una conexión múltiple coincide con cualquiera de sus partes", () => {
    const r = applyFilters(perifericos, parseFilters({ conexion: "bluetooth" }, "perifericos"));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => String(p.specs.conexion).includes("Bluetooth"))).toBe(true);
  });

  it("solo disponibles excluye agotados", () => {
    const r = applyFilters(monitores, parseFilters({ disponible: "1" }, "monitores"));
    expect(r.every((p) => p.stock > 0)).toBe(true);
  });
});

describe("buildFacets", () => {
  it("cuenta cada faceta sin su propio filtro", () => {
    const f = parseFilters({ marca: "kairo" }, "monitores");
    const facets = buildFacets(monitores, f, "monitores");
    // Con Kairo elegida, Nórdika sigue apareciendo para poder sumarla
    expect(facets.marcas.map((m) => m.value)).toEqual(expect.arrayContaining(["kairo", "nordika"]));
    expect(facets.precio.min).toBeLessThan(facets.precio.max);
  });
});

describe("seoForFilters", () => {
  it("indexa la categoría y un filtro simple", () => {
    expect(seoForFilters(parseFilters({}, "monitores"), "monitores")).toEqual({ indexable: true, canonical: "/monitores" });
    expect(seoForFilters(parseFilters({ marca: "kairo" }, "monitores"), "monitores")).toEqual({
      indexable: true,
      canonical: "/monitores?marca=kairo",
    });
  });

  it("no indexa combinaciones, orden ni página", () => {
    for (const p of [{ marca: "kairo", hz: "165" }, { orden: "precio-asc" }, { pagina: "2" }, { precio: "1-2" }]) {
      expect(seoForFilters(parseFilters(p, "monitores"), "monitores")).toEqual({ indexable: false, canonical: "/monitores" });
    }
  });
});
