import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Superficie elevada: se separa del fondo por un paso de tono, sin borde ni sombra. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-md bg-surface", className)} {...props} />;
}
