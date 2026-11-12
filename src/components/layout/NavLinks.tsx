"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { mainNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

const linkBase =
  "relative inline-flex h-11 items-center gap-1 rounded-sm px-3 text-[15px] font-medium transition-colors duration-(--duration-fast) hover:text-text";

/** Enlaces del navbar en escritorio, con submenús de Gameroom y PC Gaming. */
export function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-0.5 lg:flex">
      {mainNav.map((item) => (
        <li key={item.href} className="relative">
          {item.children ? (
            <NavDropdown item={item} active={isActive(pathname, item.href)} />
          ) : (
            <Link
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(linkBase, isActive(pathname, item.href) ? "text-text" : "text-muted")}
            >
              {item.label}
              {isActive(pathname, item.href) && <ActiveBar />}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function ActiveBar() {
  return <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />;
}

function NavDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverOpenedAt = useRef(0);
  const pathname = usePathname();

  // Cierra al cambiar de ruta, con clic fuera y con Esc
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        wrapRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const menuId = `menu-${item.href.slice(1)}`;

  return (
    <div
      ref={wrapRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        hoverOpenedAt.current = Date.now();
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="flex items-center">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(linkBase, "pr-1", active ? "text-text" : "text-muted")}
        >
          {item.label}
          {active && <ActiveBar />}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={`Ver opciones de ${item.label}`}
          onClick={() => {
            // Si el hover acaba de abrirlo, el clic no lo cierra
            if (Date.now() - hoverOpenedAt.current < 400) return;
            setOpen((v) => !v);
          }}
          className="grid h-11 w-7 place-items-center rounded-sm text-muted transition-colors hover:text-text"
        >
          <ChevronDown
            aria-hidden
            className={cn("size-4 transition-transform duration-(--duration-fast)", open && "rotate-180")}
          />
        </button>
      </div>
      <div
        id={menuId}
        hidden={!open}
        className="absolute top-full left-0 z-50 pt-2"
      >
        <ul className="w-72 animate-rise-in rounded-md bg-surface-2 p-2 shadow-float">
          {item.children!.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className="flex flex-col rounded-sm px-3 py-2.5 transition-colors hover:bg-surface-3"
              >
                <span className="font-semibold text-text">{child.label}</span>
                {child.description && <span className="text-sm text-muted">{child.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { isActive };
