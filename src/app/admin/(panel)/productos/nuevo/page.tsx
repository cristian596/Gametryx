import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { listBrands, listCategories } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/productos" className="text-sm text-muted hover:text-text">
        ← Productos
      </Link>
      <h1 className="mt-2 mb-6 text-[28px] font-bold">Nuevo producto</h1>
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  await connection();
  const { supabase } = await requireAdmin("/admin/productos/nuevo");
  const [categories, brands] = await Promise.all([listCategories(supabase), listBrands(supabase)]);
  return (
    <ProductForm
      isNew
      categories={categories}
      brands={brands}
      initial={{
        // El id se crea aquí para poder subir imágenes antes de guardar el producto
        id: crypto.randomUUID(),
        nombre: "",
        slug: "",
        descripcion: "",
        categoria_id: "",
        marca_id: null,
        tipo: "componente",
        precio_cop: 0,
        precio_anterior_cop: null,
        iva_pct: 19,
        stock: 0,
        activo: false,
        es_nuevo: true,
        es_destacado: false,
        tags: [],
        specs: [],
        fps: [],
        compat: null,
        images: [],
      }}
    />
  );
}
