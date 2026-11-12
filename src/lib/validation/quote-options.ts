/** Opciones del formulario de cotización. Sin zod, para no cargarlo en el JS inicial. */
export const quoteInterests = [
  { value: "pc-armado", label: "Un PC armado" },
  { value: "armar-pc", label: "Armar un PC a mi medida" },
  { value: "componentes", label: "Componentes para mejorar mi PC" },
  { value: "monitor", label: "Monitor" },
  { value: "perifericos", label: "Periféricos o streaming" },
  { value: "gameroom", label: "Silla, escritorio o luces" },
] as const;

export const quoteBudgets = [
  { value: "menos-3m", label: "Menos de $ 3.000.000" },
  { value: "3m-6m", label: "$ 3.000.000 a $ 6.000.000" },
  { value: "6m-10m", label: "$ 6.000.000 a $ 10.000.000" },
  { value: "mas-10m", label: "Más de $ 10.000.000" },
  { value: "no-se", label: "Aún no lo sé" },
] as const;
