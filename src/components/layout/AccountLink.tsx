"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useHasSession } from "@/store/session";

/**
 * "Iniciar sesión" o "Mi cuenta" según la cookie de sesión. El navbar sigue siendo estático
 * (no lee cookies en el servidor); esto se resuelve en el navegador tras hidratar.
 */
export function AccountLink() {
  usePathname(); // vuelve a leer la cookie al navegar (tras entrar o salir)
  const signedIn = useHasSession();
  const href = signedIn ? "/cuenta" : "/iniciar-sesion";
  const label = signedIn ? "Mi cuenta" : "Iniciar sesión";
  return (
    <>
      <Link
        href={href}
        className="hidden h-11 items-center gap-2 whitespace-nowrap rounded-sm px-3 text-[15px] font-medium text-text transition-colors hover:bg-surface-2 sm:inline-flex lg:hidden xl:inline-flex"
      >
        <User aria-hidden className="size-5" />
        <span>{label}</span>
      </Link>
      <Link
        href={href}
        aria-label={label}
        className="grid size-11 place-items-center rounded-sm text-text transition-colors hover:bg-surface-2 sm:hidden lg:grid xl:hidden"
      >
        <User aria-hidden className="size-[22px]" />
      </Link>
    </>
  );
}
