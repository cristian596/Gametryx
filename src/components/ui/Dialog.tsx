"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Oculta visualmente el título (sigue disponible para lectores de pantalla). */
  hideTitle?: boolean;
  /** center: modal centrado · right: panel lateral · bottom: hoja inferior (móvil) */
  variant?: "center" | "right" | "bottom";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Diálogo accesible sobre <dialog> nativo: atrapa el foco, cierra con Esc,
 * devuelve el foco al disparador y bloquea el scroll del fondo (ver globals.css).
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle,
  variant = "center",
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) cierra
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-0 max-h-none max-w-none bg-surface p-0 text-text shadow-float backdrop:animate-fade-in",
        variant === "center" &&
          "m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg open:animate-rise-in",
        variant === "right" &&
          "ml-auto h-dvh w-[min(100%,26rem)] open:animate-sheet-in-right",
        variant === "bottom" &&
          "mt-auto max-h-[85dvh] w-full rounded-t-xl open:animate-sheet-in-bottom",
        className,
      )}
    >
      <div className={cn("flex h-full flex-col", variant === "bottom" && "max-h-[85dvh]")}>
        <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-2">
          <h2 id={titleId} className={cn("text-xl font-semibold", hideTitle && "sr-only")}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 ml-auto grid size-11 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
            aria-label="Cerrar"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="bg-surface-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </dialog>
  );
}
