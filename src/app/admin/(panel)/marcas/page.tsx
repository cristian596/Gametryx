import type { Metadata } from "next";
import { Suspense } from "react";
import { NewBrandForm, RenameBrandForm } from "@/components/admin/BrandForms";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { listBrands } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Marcas" };

export default function BrandsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-[28px] font-bold">Marcas</h1>
      <p className="mt-1 text-muted">Aparecen en los filtros de cada categoría.</p>
      <Suspense fallback={<div className="mt-6">{Array.from({ length: 4 }, (_, i) => <RowSkeleton key={i} />)}</div>}>
        <Brands />
      </Suspense>
    </div>
  );
}

async function Brands() {
  const { supabase } = await requireAdmin("/admin/marcas");
  const [brands, { data: counts }] = await Promise.all([
    listBrands(supabase),
    supabase.from("products").select("marca_id"),
  ]);
  const count = (id: string) => (counts ?? []).filter((c) => c.marca_id === id).length;

  return (
    <>
      <div className="mt-6 rounded-lg bg-surface p-5">
        <NewBrandForm />
      </div>
      <ul className="mt-4 flex flex-col gap-3 rounded-lg bg-surface p-5">
        {brands.length === 0 && <li className="text-muted">Aún no hay marcas.</li>}
        {brands.map((b) => (
          <li key={b.id}>
            <RenameBrandForm id={b.id} nombre={b.nombre} count={count(b.id)} />
          </li>
        ))}
      </ul>
    </>
  );
}
