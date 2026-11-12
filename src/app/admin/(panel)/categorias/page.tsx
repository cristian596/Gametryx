import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { listCategories } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Categorías" };

/**
 * Solo lectura: las categorías también forman el menú de la tienda y sus direcciones (/gameroom?tipo=sillas),
 * definidos en src/data/categories.ts. Crear una nueva requiere actualizar ambos a la vez.
 */
export default function CategoriesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-[28px] font-bold">Categorías</h1>
      <p className="mt-1 text-muted">
        Son las secciones del menú de la tienda. Para agregar o renombrar una, pídelo al desarrollador: cambia también el menú y
        las direcciones.
      </p>
      <Suspense fallback={<div className="mt-6">{Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)}</div>}>
        <Categories />
      </Suspense>
    </div>
  );
}

async function Categories() {
  const { supabase } = await requireAdmin("/admin/categorias");
  const [categories, { data: counts }] = await Promise.all([
    listCategories(supabase),
    supabase.from("products").select("categoria_id"),
  ]);
  const count = (id: string) => (counts ?? []).filter((c) => c.categoria_id === id).length;
  const roots = categories.filter((c) => !c.parent_id);

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {roots.map((r) => {
        const subs = categories.filter((c) => c.parent_id === r.id);
        return (
          <li key={r.id} className="rounded-lg bg-surface p-5">
            <div className="flex items-baseline justify-between gap-4">
              <Link href={`/${r.slug}`} target="_blank" className="font-display text-lg font-semibold hover:text-primary">
                {r.nombre}
              </Link>
              {subs.length === 0 && <span className="price text-sm text-muted">{count(r.id)} productos</span>}
            </div>
            {subs.length > 0 && (
              <ul className="mt-3 flex flex-col">
                {subs.map((s) => (
                  <li key={s.id} className="flex justify-between gap-4 border-t border-surface-2 py-2 text-[15px]">
                    <Link href={`/${r.slug}?tipo=${s.slug}`} target="_blank" className="hover:text-primary">
                      {s.nombre}
                    </Link>
                    <span className="price text-sm text-muted">{count(s.id)} productos</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
