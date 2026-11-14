import type { ReactNode } from "react";

/** Marco de las páginas de acceso (ingreso, registro, recuperar): un h1, una frase y la tarjeta del formulario. */
export function AuthShell({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page flex justify-center pt-10 pb-24 md:pt-16">
      <div className="w-full max-w-md">
        <h1 className="text-[32px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[44px]">{title}</h1>
        {intro && <div className="mt-3 text-base leading-relaxed text-muted">{intro}</div>}
        <div className="mt-8 rounded-lg bg-surface p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
}
