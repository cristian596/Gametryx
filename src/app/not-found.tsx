import type { Metadata } from "next";
import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { LinkButton } from "@/components/ui/Button";
import { mainNav } from "@/config/navigation";
import { whatsappUrl } from "@/config/site";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

export default function NotFound() {
  // Se muestra fuera del grupo (store): incluye el marco de la tienda
  return (
    <StoreShell>
    <div className="container-page flex flex-1 flex-col justify-center py-20 md:py-32">
      <p aria-hidden className="price text-[clamp(5rem,20vw,12rem)] leading-none font-medium text-surface-3">
        404
      </p>
      <h1 className="mt-4 text-[32px] leading-tight font-bold md:text-[56px]">No encontramos esta página</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed">
        Puede que el enlace esté mal escrito o que el producto ya no esté disponible. Prueba con una de estas
        secciones o pregúntale a un asesor.
      </p>
      <ul className="mt-8 flex flex-wrap gap-2">
        {mainNav
          .filter((i) => i.href !== "/")
          .map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex h-11 items-center rounded-full bg-surface px-4 text-sm font-semibold transition-colors hover:bg-surface-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/">Volver al inicio</LinkButton>
        <LinkButton
          href={whatsappUrl("Hola, no encontré una página en VOLTA y necesito ayuda.")}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
        >
          Hablar con un asesor
        </LinkButton>
      </div>
    </div>
    </StoreShell>
  );
}
