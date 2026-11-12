import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { AdminNav, AdminNavWithPath } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/admin";
import { adminSignOut } from "../actions";

/** Marco del panel: barra superior sobria, sin el navbar ni el WhatsApp de la tienda. */
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link href="/admin/productos" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
            <LogoMark className="size-7" />
            <span>
              VOLTA <span className="font-sans text-sm font-medium text-muted">Admin</span>
            </span>
          </Link>
          {/* usePathname en rutas dinámicas ([id]) necesita un límite de Suspense */}
          <Suspense fallback={<AdminNav pathname="" />}>
            <AdminNavWithPath />
          </Suspense>
          <div className="ml-auto flex items-center gap-1">
            <Suspense fallback={null}>
              <CurrentAdmin />
            </Suspense>
            <Link
              href="/"
              target="_blank"
              className="hidden h-10 items-center gap-2 rounded-sm px-3 text-sm text-muted hover:bg-surface-2 hover:text-text sm:inline-flex"
            >
              Ver tienda <ExternalLink aria-hidden className="size-4" />
            </Link>
            <form action={adminSignOut}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-sm px-3 text-sm text-muted hover:bg-surface-2 hover:text-text"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden sm:inline">Salir</span>
                <span className="sr-only sm:hidden">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 outline-none sm:px-6">
        {children}
      </main>
    </div>
  );
}

async function CurrentAdmin() {
  const { user } = await requireAdmin();
  return <span className="hidden max-w-48 truncate px-2 text-sm text-muted lg:block">{user.nombre || user.email}</span>;
}
