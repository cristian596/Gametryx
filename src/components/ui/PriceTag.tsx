import { discountPercent, formatCOP } from "@/lib/format";
import { cn } from "@/lib/cn";

type PriceTagProps = {
  price: number;
  previousPrice?: number | null;
  size?: "md" | "lg";
  showVat?: boolean;
  showAddi?: boolean;
  className?: string;
};

export function PriceTag({
  price,
  previousPrice,
  size = "md",
  showVat = true,
  showAddi = false,
  className,
}: PriceTagProps) {
  const pct = discountPercent(price, previousPrice);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {pct > 0 && previousPrice ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="price text-muted line-through">
            <span className="sr-only">Antes </span>
            {formatCOP(previousPrice)}
          </span>
          <span className="price font-bold text-danger">-{pct}%</span>
        </div>
      ) : null}
      <p
        className={cn(
          "price font-medium text-text",
          size === "lg" ? "text-2xl md:text-[32px]" : "text-lg md:text-xl",
        )}
      >
        {pct > 0 && <span className="sr-only">Ahora </span>}
        {formatCOP(price)}
      </p>
      {(showVat || showAddi) && (
        <p className="text-xs text-muted">
          {showVat && "IVA incluido"}
          {showVat && showAddi && " · "}
          {showAddi && "Paga a cuotas con Addi"}
        </p>
      )}
    </div>
  );
}
