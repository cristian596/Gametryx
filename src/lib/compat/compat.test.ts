import { describe, expect, it } from "vitest";
import { checkBuild, estimatePower, issuesIfChosen, slotFromComponente, type Build, type BuildPart } from "./index";

const part = (slot: BuildPart["slot"], compat: BuildPart["compat"], precio = 100, stock = 5): BuildPart => ({
  id: `${slot}-${Math.random()}`,
  slug: slot,
  nombre: `Pieza ${slot}`,
  precio,
  stock,
  slot,
  compat,
});

const ok: Build = {
  cpu: part("cpu", { socket: "AM5", tdp_w: 120, tiene_igpu: true }, 1_890_000),
  board: part("board", { socket: "AM5", tipo_ram: "DDR5", factor_forma: "ATX" }, 899_000),
  ram: part("ram", { tipo_ram: "DDR5" }, 529_000),
  gpu: part("gpu", { tdp_w: 250, largo_mm: 300 }, 3_390_000),
  almacenamiento: part("almacenamiento", {}, 619_000),
  fuente: part("fuente", { potencia_w: 850 }, 589_000),
  gabinete: part("gabinete", { max_gpu_mm: 380, max_cooler_mm: 165, formatos_soportados: ["ATX", "mATX", "ITX"] }, 379_000),
};

describe("checkBuild", () => {
  it("un armado compatible no tiene errores ni avisos y suma el total", () => {
    const r = checkBuild(ok);
    expect(r.errores).toEqual([]);
    expect(r.avisos).toEqual([]);
    expect(r.completo).toBe(true);
    expect(r.total).toBe(1_890_000 + 899_000 + 529_000 + 3_390_000 + 619_000 + 589_000 + 379_000);
  });

  it("socket distinto → error", () => {
    const r = checkBuild({ ...ok, cpu: part("cpu", { socket: "LGA1700", tdp_w: 65 }) });
    expect(r.errores.map((e) => e.code)).toContain("socket");
  });

  it("el socket se compara sin importar mayúsculas ni espacios", () => {
    const r = checkBuild({ ...ok, cpu: part("cpu", { socket: "am5 ", tdp_w: 65 }) });
    expect(r.errores.map((e) => e.code)).not.toContain("socket");
  });

  it("RAM DDR4 en board DDR5 → error", () => {
    expect(checkBuild({ ...ok, ram: part("ram", { tipo_ram: "DDR4" }) }).errores.map((e) => e.code)).toContain("ram");
  });

  it("fuente insuficiente → error; justa → aviso", () => {
    // consumo = 120 + 250 + 150 = 520 W → recomendada 650 W (520 × 1,2 = 624 → redondeo a 50)
    expect(estimatePower(ok)).toEqual({ consumo: 520, recomendada: 650 });
    expect(checkBuild({ ...ok, fuente: part("fuente", { potencia_w: 550 }) }).errores.map((e) => e.code)).toContain("fuente");
    const justa = checkBuild({ ...ok, fuente: part("fuente", { potencia_w: 650 }) });
    expect(justa.errores).toEqual([]);
    expect(justa.avisos.map((a) => a.code)).toContain("fuente-justa");
  });

  it("gráfica más larga que el gabinete → error", () => {
    const r = checkBuild({ ...ok, gpu: part("gpu", { tdp_w: 250, largo_mm: 400 }) });
    expect(r.errores.map((e) => e.code)).toContain("gpu-largo");
  });

  it("disipador más alto que el gabinete → error", () => {
    const r = checkBuild({ ...ok, cooler: part("cooler", { alto_cooler_mm: 170 }) });
    expect(r.errores.map((e) => e.code)).toContain("cooler-alto");
  });

  it("board ATX en gabinete solo ITX → error", () => {
    const r = checkBuild({ ...ok, gabinete: part("gabinete", { formatos_soportados: ["ITX"], max_gpu_mm: 380 }) });
    expect(r.errores.map((e) => e.code)).toContain("formato");
  });

  it("CPU sin gráficos integrados y sin GPU → aviso", () => {
    const { gpu: _gpu, ...sinGpu } = ok;
    void _gpu;
    const r = checkBuild({ ...sinGpu, cpu: part("cpu", { socket: "AM5", tdp_w: 65, tiene_igpu: false }) });
    expect(r.avisos.map((a) => a.code)).toContain("sin-video");
    expect(r.completo).toBe(true); // la gráfica no es obligatoria
  });

  it("faltan piezas obligatorias → aviso con la lista", () => {
    const r = checkBuild({ cpu: ok.cpu });
    const falta = r.avisos.find((a) => a.code === "incompleto");
    expect(falta?.slots).toEqual(["board", "ram", "almacenamiento", "fuente", "gabinete"]);
    expect(r.completo).toBe(false);
  });

  it("pieza agotada → aviso", () => {
    const r = checkBuild({ ...ok, gpu: part("gpu", { tdp_w: 250, largo_mm: 300 }, 1, 0) });
    expect(r.avisos.some((a) => a.code === "agotado-gpu")).toBe(true);
  });

  it("sin datos de compatibilidad no inventa errores", () => {
    const r = checkBuild({ cpu: part("cpu", {}), board: part("board", {}), fuente: part("fuente", {}) });
    expect(r.errores).toEqual([]);
  });
});

describe("issuesIfChosen", () => {
  it("anticipa el error de una pieza antes de elegirla", () => {
    const intel = part("cpu", { socket: "LGA1700", tdp_w: 65 });
    expect(issuesIfChosen({ board: ok.board }, intel).map((i) => i.code)).toEqual(["socket"]);
    expect(issuesIfChosen({ board: ok.board }, ok.cpu!)).toEqual([]);
  });
});

describe("slotFromComponente", () => {
  it("reconoce los nombres del catálogo", () => {
    expect(slotFromComponente("Procesador")).toBe("cpu");
    expect(slotFromComponente("Tarjeta gráfica")).toBe("gpu");
    expect(slotFromComponente("Memoria RAM")).toBe("ram");
    expect(slotFromComponente("Fuente de poder")).toBe("fuente");
    expect(slotFromComponente("Gabinete")).toBe("gabinete");
    expect(slotFromComponente("Almacenamiento")).toBe("almacenamiento");
    expect(slotFromComponente("Board")).toBe("board");
    expect(slotFromComponente("Silla")).toBeNull();
  });
});
