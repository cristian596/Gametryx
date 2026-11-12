import type { SpecValue } from "@/types/catalog";

/** Etiquetas legibles para las claves de specs. Lo que no esté aquí se muestra capitalizado. */
const LABELS: Record<string, string> = {
  cpu: "Procesador",
  gpu: "Tarjeta gráfica",
  ram: "Memoria RAM",
  almacenamiento: "Almacenamiento",
  fuente: "Fuente de poder",
  resolucion_objetivo: "Resolución recomendada",
  componente: "Tipo",
  vram_gb: "Memoria de video",
  tipo_memoria: "Tipo de memoria",
  tdp_w: "Consumo (TDP)",
  largo_mm: "Largo",
  nucleos: "Núcleos",
  hilos: "Hilos",
  socket: "Socket",
  tiene_igpu: "Gráficos integrados",
  tipo_ram: "Tipo de RAM",
  factor_forma: "Formato",
  slots_ram: "Ranuras de RAM",
  m2_slots: "Ranuras M.2",
  capacidad_gb: "Capacidad",
  velocidad_mhz: "Velocidad",
  interfaz: "Interfaz",
  lectura_mbs: "Lectura secuencial",
  potencia_w: "Potencia",
  certificacion: "Certificación",
  modular: "Modular",
  formatos: "Formatos de board",
  max_gpu_mm: "Gráfica máxima",
  max_cooler_mm: "Disipador máximo",
  tamano_pulgadas: "Tamaño",
  resolucion: "Resolución",
  hz: "Frecuencia",
  panel: "Panel",
  tiempo_respuesta_ms: "Tiempo de respuesta",
  formato: "Formato",
  switches: "Switches",
  conexion: "Conexión",
  rgb: "Iluminación RGB",
  peso_g: "Peso",
  dpi: "Sensor",
  bateria_h: "Batería",
  botones: "Botones",
  sonido: "Sonido",
  microfono: "Micrófono",
  patron: "Patrón polar",
  muestreo: "Muestreo",
  entrada: "Entrada",
  captura: "Captura",
  passthrough: "Passthrough",
  fps: "Cuadros por segundo",
  enfoque: "Enfoque",
  material: "Material",
  reclinacion_grados: "Reclinación",
  carga_max_kg: "Carga máxima",
  apoyabrazos: "Apoyabrazos",
  ancho_cm: "Ancho",
  fondo_cm: "Fondo",
  altura_regulable: "Altura regulable",
  motores: "Motores",
  largo_m: "Largo",
  control: "Control",
  sincronia_musica: "Sincronía con música",
  temperatura_color: "Temperatura de color",
  luz_trasera: "Luz trasera",
  alimentacion: "Alimentación",
};

const UNITS: Record<string, string> = {
  vram_gb: " GB",
  tdp_w: " W",
  largo_mm: " mm",
  capacidad_gb: " GB",
  velocidad_mhz: " MHz",
  lectura_mbs: " MB/s",
  potencia_w: " W",
  max_gpu_mm: " mm",
  max_cooler_mm: " mm",
  tamano_pulgadas: '"',
  hz: " Hz",
  tiempo_respuesta_ms: " ms",
  peso_g: " g",
  dpi: " DPI",
  bateria_h: " h",
  reclinacion_grados: "°",
  carga_max_kg: " kg",
  ancho_cm: " cm",
  fondo_cm: " cm",
  largo_m: " m",
};

export function specLabel(key: string) {
  if (LABELS[key]) return LABELS[key];
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const NUM = new Intl.NumberFormat("es-CO");

export function specValue(key: string, v: SpecValue) {
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") return `${NUM.format(v)}${UNITS[key] ?? ""}`;
  return v;
}
