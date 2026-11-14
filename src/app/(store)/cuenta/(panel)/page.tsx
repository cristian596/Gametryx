import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { AccountHeading, EmptyState } from "@/components/account/AccountHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, orderStatus } from "@/lib/account/orders";
import { requireUser } from "@/lib/auth/user";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function OrdersPage() {
  return (
    <>
      <AccountHeading title="Mis pedidos">
        <Suspense fallback={<span className="invisible">Hola</span>}>
          <Greeting />
        </Suspense>
      </AccountHeading>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
        <Orders />
      </Suspense>
    </>
  );
}

async function Greeting() {
  const { supabase, user } = await requireUser("/cuenta");
  const { data } = await supabase.from("profiles").select("nombre").eq("id", user.id).maybeSingle();
  const first = (data?.nombre as string | null)?.split(" ")[0];
  return <>{first ? `Hola, ${first}. ` : ""}Aquí ves el estado de cada compra.</>;
}

async function Orders() {
  const { supabase, user } = await requireUser("/cuenta");
  // Filtro explícito por dueño: la RLS deja a un admin leer todos los pedidos
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, numero, estado, total_cop, created_at, order_items(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[pedidos]", error.message);
    throw new Error("No pudimos cargar tus pedidos.");
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes pedidos"
        action={<LinkButton href="/pc-gaming">Ver PC gaming</LinkButton>}
      >
        Cuando compres, aquí ves el estado de cada pedido: pago, envío y entrega.
      </EmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => {
        const status = orderStatus(o.estado as string);
        const count = (o.order_items as { count: number }[] | null)?.[0]?.count ?? 0;
        return (
          <li key={o.id as string}>
            <Link
              href={`/cuenta/pedidos/${o.numero}`}
              className="flex items-center gap-4 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-2 sm:p-5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold">Pedido #{o.numero}</span>
                  <Badge variant={status.badge}>{status.label}</Badge>
                </div>
                <span className="text-sm text-muted">
                  {formatDate(o.created_at as string)} · {count} producto{count === 1 ? "" : "s"}
                </span>
              </div>
              <span className="price shrink-0 font-semibold">{formatCOP(o.total_cop as number)}</span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
