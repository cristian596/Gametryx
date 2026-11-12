import { cn } from "@/lib/cn";

export const LOW_STOCK_THRESHOLD = 5;

export function stockState(stock: number) {
  if (stock <= 0) return "agotado" as const;
  if (stock <= LOW_STOCK_THRESHOLD) return "poco" as const;
  return "disponible" as const;
}

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const state = stockState(stock);
  const label =
    state === "agotado"
      ? "Agotado"
      : state === "poco"
        ? stock === 1
          ? "Última unidad"
          : `Últimas ${stock} unidades`
        : "Disponible";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          state === "agotado" ? "bg-muted" : state === "poco" ? "bg-warning" : "bg-success",
        )}
      />
      <span className={state === "agotado" ? "text-muted" : "text-text"}>{label}</span>
    </span>
  );
}
