import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { PageIntro } from "@/components/layout/PageIntro";
import { site, whatsappUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Contáctenos",
  description: "Escríbenos por WhatsApp o correo. Te responde una persona del equipo de VOLTA.",
  alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro title="Contáctenos">
        <p>Te responde una persona del equipo, no un bot. {site.supportHours}.</p>
      </PageIntro>
      <div className="container-page grid grid-cols-1 gap-4 pb-24 md:grid-cols-2">
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-3 rounded-lg bg-primary p-6 text-on-primary transition-colors hover:bg-primary-hover sm:p-8"
        >
          <WhatsAppIcon className="size-8" />
          <span className="font-display text-2xl font-bold">WhatsApp</span>
          <span className="price text-lg">{site.whatsappDisplay}</span>
          <span className="text-[15px]">La forma más rápida: asesoría, pagos y seguimiento de tu pedido.</span>
        </a>
        <a
          href={`mailto:${site.email}`}
          className="flex flex-col gap-3 rounded-lg bg-surface p-6 transition-colors hover:bg-surface-2 sm:p-8"
        >
          <Mail aria-hidden className="size-8 text-primary" />
          <span className="font-display text-2xl font-bold">Correo</span>
          <span className="text-lg text-accent">{site.email}</span>
          <span className="text-[15px] text-muted">Para facturas, garantías y temas que requieran adjuntos.</span>
        </a>
        <section className="rounded-lg bg-surface p-6 sm:p-8 md:col-span-2">
          <h2 className="text-xl font-semibold">¿Quieres una cotización?</h2>
          <p className="mt-2 text-[15px]">Cuéntanos qué buscas y tu presupuesto, o arma tu PC y envíalo desde el armador.</p>
          <div className="mt-4 flex flex-wrap gap-4 font-semibold">
            <Link href="/cotizacion" className="text-accent">
              Pedir cotización
            </Link>
            <Link href="/armar-pc" className="text-accent">
              Ir al armador
            </Link>
          </div>
        </section>
        <p className="text-sm text-muted md:col-span-2">
          {site.legal.businessName} · NIT {site.legal.nit} · {site.legal.address}
        </p>
      </div>
    </>
  );
}
