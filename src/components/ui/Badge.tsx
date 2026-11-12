import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "nuevo" | "oferta" | "poco-stock" | "agotado" | "neutral";

const variants: Record<BadgeVariant, string> = {
  nuevo: "bg-accent text-on-primary",
  oferta: "bg-danger text-on-primary",
  "poco-stock": "bg-warning text-on-primary",
  agotado: "bg-surface-3 text-muted",
  neutral: "bg-surface-2 text-text",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm px-2 text-xs font-bold leading-none whitespace-nowrap",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
