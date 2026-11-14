import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountHeading } from "@/components/account/AccountHeading";
import { AddressManager, type Address } from "@/components/account/AddressManager";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Direcciones" };

export default function AddressesPage() {
  return (
    <>
      <AccountHeading title="Direcciones">La principal se elige sola al pagar; puedes cambiarla en el checkout.</AccountHeading>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <Addresses />
      </Suspense>
    </>
  );
}

async function Addresses() {
  const { supabase, user } = await requireUser("/cuenta/direcciones");
  const { data, error } = await supabase
    .from("addresses")
    .select("id, alias, destinatario, telefono, departamento, ciudad, direccion, complemento, es_principal")
    .eq("user_id", user.id)
    .order("es_principal", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[direcciones]", error.message);
    throw new Error("No pudimos cargar tus direcciones.");
  }
  return <AddressManager addresses={(data ?? []) as Address[]} />;
}
