"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/categorias", label: "Categorías" },
];

/** Lee la ruta actual para marcar la sección activa. Va dentro de <Suspense>. */
export function AdminNavWithPath() {
  return <AdminNav pathname={usePathname()} />;
}

export function AdminNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Panel" className="ml-2 flex gap-1 overflow-x-auto">
      {items.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-sm px-3 text-sm font-semibold whitespace-nowrap transition-colors",
              active ? "bg-surface-2 text-text" : "text-muted hover:text-text",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
