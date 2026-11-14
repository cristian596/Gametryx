"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { signOut } from "@/lib/account/auth-actions";
import { cn } from "@/lib/cn";

const items = [
  { href: "/cuenta", label: "Pedidos", icon: Package },
  { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta/datos", label: "Mis datos", icon: UserRound },
  { href: "/cuenta/direcciones", label: "Direcciones", icon: MapPin },
];

function isCurrent(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/cuenta") return pathname === "/cuenta" || pathname.startsWith("/cuenta/pedidos");
  return pathname.startsWith(href);
}

/** Menú de la cuenta: fila desplazable en celular, columna lateral en escritorio. */
export function AccountNav({ static: isStatic = false }: { static?: boolean }) {
  return isStatic ? <NavList pathname={null} /> : <NavWithPath />;
}

function NavWithPath() {
  return <NavList pathname={usePathname()} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Mi cuenta" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(pathname, href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-2.5 rounded-sm px-3.5 text-[15px] font-semibold whitespace-nowrap transition-colors",
                  current ? "bg-surface-2 text-primary" : "text-text hover:bg-surface",
                )}
              >
                <Icon aria-hidden className="size-[18px]" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-surface-2 lg:pt-4">
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-11 w-full items-center gap-2.5 rounded-sm px-3.5 text-[15px] font-semibold whitespace-nowrap text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <LogOut aria-hidden className="size-[18px]" />
              Cerrar sesión
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
