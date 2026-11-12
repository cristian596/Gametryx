"use client";

import "./globals.css";

/** Último recurso: reemplaza todo el layout cuando falla la raíz. Sin dependencias del resto del sitio. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es-CO">
      <body className="flex min-h-dvh items-center bg-bg font-sans text-text">
        <main className="container-page py-20">
          <h1 className="text-[32px] leading-tight font-bold md:text-[56px]">VOLTA no está disponible en este momento</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed">
            Tuvimos un problema al cargar la tienda. Intenta de nuevo en unos segundos.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-8 inline-flex h-11 items-center rounded-sm bg-primary px-5 font-semibold text-on-primary"
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
