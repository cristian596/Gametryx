import type { ReactNode } from "react";

/** Título de cada sección de la cuenta (el único h1 de la página). */
export function AccountHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]">{title}</h1>
      {children && <div className="mt-2 text-[15px] text-muted md:text-base">{children}</div>}
    </div>
  );
}

/** Estado vacío con una acción clara. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <div className="max-w-prose text-[15px] text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
