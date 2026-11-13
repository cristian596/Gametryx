/**
 * Motor de compatibilidad del armador de PC. Funciones puras, sin dependencias: se prueban en Vitest
 * y corren igual en el navegador (respuesta en vivo) y en el servidor (cotizaciones).
 */

export type Slot = "cpu" | "board" | "ram" | "gpu" | "almacenamiento" | "fuente" | "gabinete" | "cooler";

export const SLOTS: { slot: Slot; label: string; required: boolean }[] = [
  { slot: "cpu", label: "Procesador", required: true },
  { slot: "board", label: "Board", required: true },
  { slot: "ram", label: "Memoria RAM", required: true },
  { slot: "gpu", label: "Tarjeta gráfica", required: false },
  { slot: "almacenamiento", label: "Almacenamiento", required: true },
  { slot: "fuente", label: "Fuente de poder", required: true },
  { slot: "gabinete", label: "Gabinete", required: true },
  { slot: "cooler", label: "Disipador", required: false },
];

export type FormFactor = "ATX" | "mATX" | "ITX" | "E-ATX";

export type CompatAttrs = {
  socket?: string | null;
  tipo_ram?: "DDR4" | "DDR5" | null;
  tdp_w?: number | null;
  potencia_w?: number | null;
  factor_forma?: FormFactor | null;
  formatos_soportados?: FormFactor[] | null;
  largo_mm?: number | null;
  alto_cooler_mm?: number | null;
  max_gpu_mm?: number | null;
  max_cooler_mm?: number | null;
  tiene_igpu?: boolean | null;
};

export type BuildPart = {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  stock: number;
  slot: Slot;
  compat: CompatAttrs;
  imagen?: string;
};

export type Build = Partial<Record<Slot, BuildPart>>;

export type Issue = { code: string; slots: Slot[]; message: string };

export type CompatResult = {
  errores: Issue[];
  avisos: Issue[];
  /** Consumo estimado del equipo completo (W) */
  potenciaEstimadaW: number;
  /** Fuente mínima recomendada (W): consumo × 1,2 de margen */
  fuenteRecomendadaW: number;
  total: number;
  completo: boolean;
};

/** Consumo de la board, RAM, discos y ventiladores, sumado a CPU + GPU. */
export const BASE_SYSTEM_W = 150;
export const PSU_MARGIN = 1.2;
/** Una fuente con menos de 10 % de holgura sobre lo recomendado se marca como "justa". */
export const TIGHT_PSU_RATIO = 1.1;

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase().replace(/\s+/g, "");

export function estimatePower(build: Build) {
  const cpu = build.cpu?.compat.tdp_w ?? 0;
  const gpu = build.gpu?.compat.tdp_w ?? 0;
  const consumo = cpu + gpu + BASE_SYSTEM_W;
  return { consumo, recomendada: Math.ceil((consumo * PSU_MARGIN) / 50) * 50 };
}

export function checkBuild(build: Build): CompatResult {
  const errores: Issue[] = [];
  const avisos: Issue[] = [];
  const { cpu, board, ram, gpu, fuente, gabinete, cooler } = build;

  // Socket CPU ↔ board
  if (cpu && board && cpu.compat.socket && board.compat.socket && norm(cpu.compat.socket) !== norm(board.compat.socket)) {
    errores.push({
      code: "socket",
      slots: ["cpu", "board"],
      message: `El procesador usa socket ${cpu.compat.socket} y la board es ${board.compat.socket}. Elige una board ${cpu.compat.socket}.`,
    });
  }

  // Tipo de RAM ↔ board
  if (ram && board && ram.compat.tipo_ram && board.compat.tipo_ram && ram.compat.tipo_ram !== board.compat.tipo_ram) {
    errores.push({
      code: "ram",
      slots: ["ram", "board"],
      message: `La memoria es ${ram.compat.tipo_ram} y la board acepta ${board.compat.tipo_ram}. Elige memoria ${board.compat.tipo_ram}.`,
    });
  }

  // Fuente suficiente
  const { consumo, recomendada } = estimatePower(build);
  const potencia = fuente?.compat.potencia_w;
  if (fuente && potencia && (cpu || gpu)) {
    if (potencia < recomendada) {
      errores.push({
        code: "fuente",
        slots: ["fuente"],
        message: `La fuente de ${potencia} W se queda corta: este equipo necesita al menos ${recomendada} W.`,
      });
    } else if (potencia < recomendada * TIGHT_PSU_RATIO) {
      avisos.push({
        code: "fuente-justa",
        slots: ["fuente"],
        message: `La fuente de ${potencia} W alcanza, pero justa. Con ${Math.ceil((recomendada * TIGHT_PSU_RATIO) / 50) * 50} W o más tendrás margen para mejorar la gráfica.`,
      });
    }
  }

  // Largo de la gráfica ↔ gabinete
  if (gpu?.compat.largo_mm && gabinete?.compat.max_gpu_mm && gpu.compat.largo_mm > gabinete.compat.max_gpu_mm) {
    errores.push({
      code: "gpu-largo",
      slots: ["gpu", "gabinete"],
      message: `La gráfica mide ${gpu.compat.largo_mm} mm y el gabinete admite hasta ${gabinete.compat.max_gpu_mm} mm.`,
    });
  }

  // Alto del disipador ↔ gabinete
  if (cooler?.compat.alto_cooler_mm && gabinete?.compat.max_cooler_mm && cooler.compat.alto_cooler_mm > gabinete.compat.max_cooler_mm) {
    errores.push({
      code: "cooler-alto",
      slots: ["cooler", "gabinete"],
      message: `El disipador mide ${cooler.compat.alto_cooler_mm} mm de alto y el gabinete admite hasta ${gabinete.compat.max_cooler_mm} mm.`,
    });
  }

  // Formato de board ↔ gabinete
  const formatos = gabinete?.compat.formatos_soportados;
  if (board?.compat.factor_forma && formatos?.length && !formatos.includes(board.compat.factor_forma)) {
    errores.push({
      code: "formato",
      slots: ["board", "gabinete"],
      message: `La board es ${board.compat.factor_forma} y el gabinete solo admite ${formatos.join(", ")}.`,
    });
  }

  // Sin video: CPU sin gráficos integrados y sin tarjeta gráfica
  if (cpu && !gpu && cpu.compat.tiene_igpu === false) {
    avisos.push({
      code: "sin-video",
      slots: ["cpu", "gpu"],
      message: "Este procesador no tiene gráficos integrados: necesitas una tarjeta gráfica para tener imagen.",
    });
  }

  // Piezas agotadas
  for (const part of Object.values(build)) {
    if (part && part.stock <= 0) {
      avisos.push({
        code: `agotado-${part.slot}`,
        slots: [part.slot],
        message: `${part.nombre} está agotado. Podemos conseguirlo por encargo: pídelo en la cotización.`,
      });
    }
  }

  // Faltan piezas obligatorias
  const faltan = SLOTS.filter((s) => s.required && !build[s.slot]);
  if (faltan.length) {
    avisos.push({
      code: "incompleto",
      slots: faltan.map((f) => f.slot),
      message: `Te falta elegir: ${faltan.map((f) => f.label.toLowerCase()).join(", ")}.`,
    });
  }

  const total = Object.values(build).reduce((sum, p) => sum + (p?.precio ?? 0), 0);
  return {
    errores,
    avisos,
    potenciaEstimadaW: consumo,
    fuenteRecomendadaW: recomendada,
    total,
    completo: faltan.length === 0,
  };
}

/**
 * ¿Esta pieza es compatible con lo que ya está elegido? Se usa para ordenar y marcar opciones en el selector.
 * Devuelve los errores que aparecerían si se elige.
 */
export function issuesIfChosen(build: Build, part: BuildPart): Issue[] {
  const before = new Set(checkBuild(build).errores.map((e) => e.code));
  return checkBuild({ ...build, [part.slot]: part }).errores.filter((e) => !before.has(e.code) && e.slots.includes(part.slot));
}

/**
 * Atributos de compatibilidad a partir de las specs (catálogo de ejemplo o productos sin compat_attrs).
 * Las mismas claves que la tabla compat_attrs.
 */
export function compatFromSpecs(specs: Record<string, string | number | boolean>): CompatAttrs {
  const num = (k: string) => (typeof specs[k] === "number" ? (specs[k] as number) : null);
  const str = (k: string) => (typeof specs[k] === "string" ? (specs[k] as string) : null);
  const formatos = str("formatos")
    ?.split(",")
    .map((f) => f.trim())
    .filter((f): f is FormFactor => ["ATX", "mATX", "ITX", "E-ATX"].includes(f));
  return {
    socket: str("socket"),
    tipo_ram: (str("tipo_ram") as CompatAttrs["tipo_ram"]) ?? null,
    tdp_w: num("tdp_w"),
    potencia_w: num("potencia_w"),
    factor_forma: (str("factor_forma") as FormFactor | null) ?? null,
    formatos_soportados: formatos?.length ? formatos : null,
    largo_mm: num("largo_mm"),
    alto_cooler_mm: num("alto_cooler_mm"),
    max_gpu_mm: num("max_gpu_mm"),
    max_cooler_mm: num("max_cooler_mm"),
    tiene_igpu: typeof specs.tiene_igpu === "boolean" ? specs.tiene_igpu : null,
  };
}

/** Detecta el hueco del armador desde la spec "componente" del producto. */
export function slotFromComponente(componente: unknown): Slot | null {
  const c = String(componente ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (c.includes("procesador") || c === "cpu") return "cpu";
  if (c.includes("board") || c.includes("placa")) return "board";
  if (c.includes("ram") || c.includes("memoria")) return "ram";
  if (c.includes("grafica") || c === "gpu") return "gpu";
  if (c.includes("almacenamiento") || c.includes("ssd") || c.includes("disco")) return "almacenamiento";
  if (c.includes("fuente")) return "fuente";
  if (c.includes("gabinete") || c.includes("caja")) return "gabinete";
  if (c.includes("disipador") || c.includes("refrigeracion") || c.includes("cooler")) return "cooler";
  return null;
}

/** Texto del armado para WhatsApp o la cotización. */
export function buildSummaryText(build: Build, result: CompatResult, formatCOP: (n: number) => string) {
  const lines = SLOTS.filter((s) => build[s.slot]).map((s) => `• ${s.label}: ${build[s.slot]!.nombre} (${formatCOP(build[s.slot]!.precio)})`);
  return [
    "Hola, armé este PC en VOLTA y quiero cotizarlo:",
    ...lines,
    `Total: ${formatCOP(result.total)}`,
    result.errores.length ? `⚠️ Tiene ${result.errores.length} incompatibilidad(es) por revisar.` : "Compatibilidad: todo en orden.",
  ].join("\n");
}
