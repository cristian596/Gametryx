import type { ReactNode } from "react";

/** Encabezado estándar de página interna: un solo h1 y una frase que dice qué hay aquí. */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="container-page pt-10 pb-8 md:pt-16 md:pb-12">
      <h1 className="text-[32px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[56px]">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-base leading-relaxed text-text md:text-lg">{children}</div>}
    </div>
  );
}
