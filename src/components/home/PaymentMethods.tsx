import { site } from "@/config/site";
import { Reveal } from "./Reveal";

/** Franja de métodos de pago: informativa mientras no estén integrados (el asesor ayuda a pagar). */
export function PaymentMethods() {
  return (
    <section aria-labelledby="pagos-title" className="pt-16 md:pt-24">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-8 rounded-xl bg-surface p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:p-12">
          <Reveal className="lg:col-span-4">
            <h2 id="pagos-title" className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]">
              Paga como prefieras
            </h2>
            <p className="mt-3 text-base leading-relaxed">
              A cuotas, por transferencia, en efectivo o con tu factura de gas.
            </p>
          </Reveal>
          <Reveal as="ul" className="grid grid-cols-2 gap-2 sm:gap-3 lg:col-span-8 lg:grid-cols-4">
            {site.paymentMethods.map((m) => (
              <li key={m.id} data-reveal-item className="flex flex-col gap-2 rounded-md bg-surface-2 p-4 sm:p-5">
                <span className="font-display text-2xl font-bold sm:text-[28px]">{m.name}</span>
                <span className="text-sm leading-snug text-muted sm:text-[15px]">{m.description}</span>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
