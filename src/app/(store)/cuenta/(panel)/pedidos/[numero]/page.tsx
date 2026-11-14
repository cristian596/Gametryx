import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { whatsappUrl } from "@/config/site";
import { formatDate, orderStatus } from "@/lib/account/orders";
import { requireUser } from "@/lib/auth/user";
import { formatCOP } from "@/lib/format";

type Props = PageProps<"/cuenta/pedidos/[numero]">;

/**
 * Página privada con número de pedido desconocido de antemano: no hay versión estática que prerenderizar,
 * así que espera al servidor (los hooks de ruta del navbar no pueden resolverse en el build).
 */
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Pedido #${numero.replace(/\D/g, "").slice(0, 12)}` };
}

export default function OrderPage({ params }: Props) {
  return (
    <>
      <Link href="/cuenta" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        <ArrowLeft aria-hidden className="size-4" />
        Mis pedidos
      </Link>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <OrderDetail params={params} />
      </Suspense>
    </>
  );
}

type AddressSnapshot = {
  destinatario?: string;
  telefono?: string;
  direccion?: string;
  complemento?: string | null;
  ciudad?: string;
  departamento?: string;
};

async function OrderDetail({ params }: { params: Props["params"] }) {
  const { numero } = await params;
  if (!/^\d{1,12}$/.test(numero)) notFound();
  const { supabase, user } = await requireUser(`/cuenta/pedidos/${numero}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "numero, estado, subtotal_cop, envio_cop, total_cop, address_snapshot, metodo_pago, created_at, order_items(id, nombre_snapshot, precio_snapshot, cantidad)",
    )
    .eq("numero", Number(numero))
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) notFound();

  const status = orderStatus(order.estado as string);
  const items = (order.order_items ?? []) as { id: string; nombre_snapshot: string; precio_snapshot: number; cantidad: number }[];
  const addr = (order.address_snapshot ?? {}) as AddressSnapshot;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]">Pedido #{order.numero}</h1>
          <Badge variant={status.badge}>{status.label}</Badge>
        </div>
        <p className="text-[15px] text-muted">
          {formatDate(order.created_at as string)}
          {status.hint && ` · ${status.hint}`}
        </p>
      </header>

      <section aria-labelledby="productos" className="rounded-lg bg-surface p-5">
        <h2 id="productos" className="text-xl font-semibold">
          Productos
        </h2>
        <ul className="mt-3 flex flex-col divide-y divide-surface-2">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between gap-4 py-3 text-[15px]">
              <span className="min-w-0">
                {it.nombre_snapshot}
                <span className="block text-sm text-muted">
                  {it.cantidad} × <span className="price">{formatCOP(it.precio_snapshot)}</span>
                </span>
              </span>
              <span className="price shrink-0">{formatCOP(it.precio_snapshot * it.cantidad)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 flex flex-col gap-2 border-t border-surface-3 pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="price">{formatCOP(order.subtotal_cop as number)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd className="price">{order.envio_cop ? formatCOP(order.envio_cop as number) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <dt>Total</dt>
            <dd className="price">{formatCOP(order.total_cop as number)}</dd>
          </div>
          <p className="text-right text-sm text-muted">IVA incluido</p>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section aria-labelledby="envio" className="rounded-lg bg-surface p-5 text-[15px]">
          <h2 id="envio" className="text-xl font-semibold">
            Envío
          </h2>
          <address className="mt-3 flex flex-col gap-0.5 not-italic">
            <span className="font-semibold">{addr.destinatario}</span>
            <span>
              {addr.direccion}
              {addr.complemento ? `, ${addr.complemento}` : ""}
            </span>
            <span>
              {addr.ciudad}
              {addr.departamento ? `, ${addr.departamento}` : ""}
            </span>
            {addr.telefono && <span className="text-muted">{addr.telefono}</span>}
          </address>
        </section>
        <section aria-labelledby="ayuda" className="rounded-lg bg-surface p-5 text-[15px]">
          <h2 id="ayuda" className="text-xl font-semibold">
            ¿Necesitas ayuda?
          </h2>
          <p className="mt-3">
            Para cambios, garantías o retracto (5 días hábiles desde la entrega), escríbenos con el número de tu pedido.
          </p>
          <a
            href={whatsappUrl(`Hola, tengo una consulta sobre mi pedido #${order.numero}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-semibold text-accent"
          >
            Escribir por WhatsApp
          </a>
        </section>
      </div>
    </article>
  );
}
