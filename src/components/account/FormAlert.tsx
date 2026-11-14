import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Mensaje general de un formulario: error (rojo) o confirmación (verde). Se anuncia al lector de pantalla. */
export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-sm px-4 py-3 text-[15px] text-text", tone === "error" ? "bg-danger/15" : "bg-success/15")}
    >
      {children}
    </p>
  );
}
