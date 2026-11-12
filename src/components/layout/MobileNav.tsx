"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { LinkButton } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { mainNav } from "@/config/navigation";
import { site, whatsappUrl } from "@/config/site";
import { cn } from "@/lib/cn";
import { isActive } from "./NavLinks";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el panel al navegar
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        className="grid size-11 place-items-center rounded-sm text-text transition-colors hover:bg-surface-2 lg:hidden"
      >
        <Menu aria-hidden className="size-6" />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Menú"
        variant="right"
        footer={
          <div className="flex flex-col gap-3">
            <LinkButton href="/iniciar-sesion" size="lg" className="w-full">
              Iniciar sesión
            </LinkButton>
            <p className="text-center text-sm text-muted">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="font-semibold text-accent underline-offset-4 hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        }
      >
        <nav aria-label="Principal (móvil)">
          <ul className="flex flex-col">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-13 items-center gap-3 font-display text-xl font-semibold",
                      active ? "text-primary" : "text-text",
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className="mb-3 flex flex-col pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="flex h-11 items-center text-[15px] text-muted transition-colors hover:text-text"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-3 rounded-md bg-surface-2 p-4 transition-colors hover:bg-surface-3"
        >
          <WhatsAppIcon className="size-6 text-primary" />
          <span className="flex flex-col">
            <span className="font-semibold">Asesoría por WhatsApp</span>
            <span className="text-sm text-muted">{site.whatsappDisplay}</span>
          </span>
        </a>
      </Dialog>
    </>
  );
}
