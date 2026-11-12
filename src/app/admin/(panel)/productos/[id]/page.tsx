import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { getProductForEdit, listBrands, listCategories } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Editar producto" };

type Props = PageProps<"/admin/productos/[id]">;

export default function EditProductPage({ params }: Props) {
  return (
    <>
      <Link href="/admin/productos" className="text-sm text-muted hover:text-text">
        ← Productos
      </Link>
      <Suspense fallback={<Skeleton className="mt-10 h-[600px] w-full rounded-lg" />}>
        <EditProduct params={params} />
      </Suspense>
    </>
  );
}

async function EditProduct({ params }: { params: Props["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin(`/admin/productos/${id}`);
  const [product, categories, brands] = await Promise.all([
    getProductForEdit(supabase, id),
    listCategories(supabase),
    listBrands(supabase),
  ]);
  if (!product) notFound();

  return (
    <>
      <h1 className="mt-2 mb-6 line-clamp-2 text-[28px] font-bold">{product.nombre}</h1>
      <ProductForm key={product.id} isNew={false} initial={product} categories={categories} brands={brands} />
    </>
  );
}
