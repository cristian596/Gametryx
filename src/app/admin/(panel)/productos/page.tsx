import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { LinkButton } from "@/components/ui/Button";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { listAdminProducts } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/admin";
import { cn } from "@/lib/cn";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Productos" };

type Props = PageProps<"/admin/productos">;
const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
  { value: "poco", label: "Poco stock" },
  { value: "agotados", label: "Agotados" },
] as const;

export default function AdminProductsPage({ searchParams }: Props) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold">Productos</h1>
          <p className="mt-1 text-muted">Los cambios se ven en la tienda en cuanto guardas.</p>
        </div>
        <LinkButton href="/admin/productos/nuevo" icon={<Plus aria-hidden className="size-4" />}>
          Nuevo producto
        </LinkButton>
      </div>
      <Suspense fallback={<ListFallback />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const estadoRaw = typeof sp.estado === "string" ? sp.estado : "";
  const estado = ESTADOS.some((e) => e.value === estadoRaw) ? estadoRaw : "";
  const { supabase } = await requireAdmin(`/admin/productos`);
  const products = await listAdminProducts(supabase, { q, estado: (estado || undefined) as never });

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(estado ? { estado } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return `/admin/productos${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form role="search" className="relative w-full md:max-w-sm">
          <label htmlFor="q" className="sr-only">
            Buscar productos
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o enlace"
            className="h-11 w-full rounded-sm bg-surface-2 pr-3 pl-9 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
          />
          {estado && <input type="hidden" name="estado" value={estado} />}
        </form>
        <nav aria-label="Filtrar por estado" className="flex gap-1 overflow-x-auto">
          {ESTADOS.map((e) => (
            <Link
              key={e.value}
              href={href({ estado: e.value })}
              aria-current={estado === e.value ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap",
                estado === e.value ? "bg-primary text-on-primary" : "bg-surface text-text hover:bg-surface-2",
              )}
            >
              {e.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {products.length} {products.length === 1 ? "producto" : "productos"}
        {q && <> para “{q}”</>}
      </p>

      {products.length === 0 ? (
        <div className="mt-4 rounded-lg bg-surface p-8">
          <p className="text-lg font-semibold">No hay productos con ese criterio.</p>
          <p className="mt-1 text-muted">Prueba otra búsqueda o crea uno nuevo.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg bg-surface">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead className="text-sm text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Producto</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoría</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Precio</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Stock</th>
                <th scope="col" className="px-4 py-3 font-medium">En tienda</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = [...p.images].sort((a, b) => a.orden - b.orden)[0];
                return (
                  <tr key={p.id} className="border-t border-surface-2 hover:bg-surface-2/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-primary">
                        {img ? (
                          <Image
                            src={img.url}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized={img.url.endsWith(".svg")}
                            className="size-12 shrink-0 rounded-sm bg-surface-2 object-cover"
                          />
                        ) : (
                          <span className="size-12 shrink-0 rounded-sm bg-surface-2" />
                        )}
                        <span className="line-clamp-2">
                          {p.nombre}
                          {p.brand && <span className="block text-sm font-normal text-muted">{p.brand.nombre}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{p.category?.nombre ?? "—"}</td>
                    <td className="price px-4 py-2.5 text-right">{formatCOP(p.precio_cop)}</td>
                    <td
                      className={cn(
                        "price px-4 py-2.5 text-right",
                        p.stock === 0 ? "text-danger" : p.stock <= 5 ? "text-warning" : "",
                      )}
                    >
                      {p.stock}
                    </td>
                    <td className="px-4 py-2.5">
                      <ActiveToggle id={p.id} name={p.nombre} active={p.activo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListFallback() {
  return (
    <div className="mt-6 rounded-lg bg-surface px-4">
      {Array.from({ length: 6 }, (_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
