import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountHeading, EmptyState } from "@/components/account/AccountHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireUser } from "@/lib/auth/user";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Favoritos" };

export default function FavoritesPage() {
  return (
    <>
      <AccountHeading title="Favoritos">Lo que guardaste para después. Los precios y el stock están al día.</AccountHeading>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
        <Favorites />
      </Suspense>
    </>
  );
}

async function Favorites() {
  const { supabase, user } = await requireUser("/cuenta/favoritos");
  const [{ data: rows }, products] = await Promise.all([
    supabase.from("wishlist").select("product_id").eq("user_id", user.id).order("created_at", { ascending: false }),
    catalog.getProducts(),
  ]);

  // Solo productos activos del catálogo, en el orden en que se guardaron
  const byId = new Map(products.map((p) => [p.id, p]));
  const favorites = (rows ?? []).map((r) => byId.get(r.product_id as string)).filter((p) => p !== undefined);

  if (favorites.length === 0) {
    return (
      <EmptyState title="Aún no tienes favoritos" action={<LinkButton href="/pc-gaming">Explorar productos</LinkButton>}>
        Toca el corazón de cualquier producto para guardarlo aquí y comparar con calma.
      </EmptyState>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      {favorites.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
