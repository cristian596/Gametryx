import Image from "next/image";
import Link from "next/link";
import { site, whatsappUrl } from "@/config/site";
import { formatCOP } from "@/lib/format";
import { QuoteForm } from "./QuoteForm";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

/** 9. Cotización */
export function QuoteSection() {
  return (
    <section id="cotizacion" aria-labelledby="cotizacion-title" className="py-16 md:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <h2 id="cotizacion-title" className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[44px]">
            Cotiza tu PC
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed">
            Cuéntanos qué quieres jugar y cuánto quieres invertir. Un asesor te responde por WhatsApp con opciones.
          </p>
          <dl className="mt-8 flex flex-col gap-5">
            {[
              { k: "Sin compromiso", v: "Te damos opciones; tú decides si compras." },
              { k: "A tu medida", v: "Ajustamos cada pieza a lo que juegas y a tu presupuesto." },
              { k: "Con armado incluido", v: "Si compras el PC con nosotros, te lo entregamos armado." },
            ].map((i) => (
              <div key={i.k}>
                <dt className="font-display text-xl font-semibold">{i.k}</dt>
                <dd className="mt-1 text-[15px] text-muted">{i.v}</dd>
              </div>
            ))}
          </dl>
          {/* Foto de ambiente (no es un producto VOLTA). Ver public/images/CREDITOS.md */}
          <Image
            src="/images/armado.jpg"
            alt="Manos abriendo el panel de vidrio de un PC de escritorio"
            width={1600}
            height={1201}
            sizes="(min-width: 1024px) 480px, 100vw"
            className="mt-8 aspect-[4/3] w-full rounded-lg object-cover object-[35%_45%]"
          />
        </Reveal>
        <Reveal className="lg:col-span-7">
          <QuoteForm />
        </Reveal>
      </div>
    </section>
  );
}

/**
 * 10. Reseñas. En producción se muestra el estado vacío hasta tener reseñas reales y aprobadas (Fase 7).
 * En desarrollo se ven ejemplos marcados como tales, solo para revisar el diseño.
 */
const exampleReviews = [
  { autor: "Cliente de ejemplo", ciudad: "Medellín", texto: "Texto de ejemplo para ver cómo se ve una reseña larga en la tarjeta, con dos o tres líneas de contenido." },
  { autor: "Cliente de ejemplo", ciudad: "Cali", texto: "Reseña corta de ejemplo." },
  { autor: "Cliente de ejemplo", ciudad: "Barranquilla", texto: "Otra reseña de ejemplo con una longitud intermedia para probar el diseño." },
];

export function Reviews() {
  const showExamples = process.env.NODE_ENV !== "production";

  return (
    <Section id="resenas" title="Reseñas de clientes">
      {showExamples ? (
        <Reveal as="ul" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {exampleReviews.map((r, i) => (
            <li key={i} data-reveal-item className="flex flex-col gap-4 rounded-lg bg-surface p-6">
              <p className="self-start rounded-sm bg-warning px-2 py-1 text-xs font-bold text-on-primary">
                Ejemplo · solo en desarrollo
              </p>
              <blockquote className="text-base leading-relaxed">{r.texto}</blockquote>
              <p className="mt-auto text-sm text-muted">
                {r.autor} · {r.ciudad}
              </p>
            </li>
          ))}
        </Reveal>
      ) : (
        <Reveal className="flex flex-col gap-4 rounded-lg bg-surface p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="font-display text-2xl font-semibold">Aún no tenemos reseñas publicadas</p>
            <p className="mt-2 text-base leading-relaxed">
              Publicamos solo opiniones de compras verificadas. ¿Ya compraste en VOLTA? Cuéntanos cómo te fue.
            </p>
          </div>
          <a
            href={whatsappUrl("Hola, quiero dejar mi reseña de VOLTA.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center self-start rounded-sm bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover md:self-center"
          >
            Dejar mi reseña
          </a>
        </Reveal>
      )}
    </Section>
  );
}

/** 11. Información: envío gratis y asesoría personal. */
export function InfoStrip() {
  return (
    <section aria-labelledby="info-title" className="pb-20 md:pb-28">
      <h2 id="info-title" className="sr-only">
        Envíos y asesoría
      </h2>
      <Reveal className="container-page grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Foto de ambiente (no es un producto VOLTA). Ver public/images/CREDITOS.md */}
        <div data-reveal-item className="relative min-h-72 overflow-hidden rounded-lg lg:col-span-5">
          <Image
            src="/images/hero-pc.jpg"
            alt="PC gamer con iluminación azul sobre un escritorio"
            fill
            sizes="(min-width: 1024px) 500px, 100vw"
            className="object-cover object-[80%_62%]"
          />
        </div>
        <ul className="grid grid-cols-1 gap-4 lg:col-span-7">
        <li data-reveal-item className="flex flex-col gap-4 rounded-lg bg-surface p-6 sm:p-10">
          <h3 className="text-[26px] leading-tight font-bold md:text-[32px]">Envío gratis a toda Colombia</h3>
          <p className="text-base leading-relaxed">
            En compras desde <span className="price font-medium">{formatCOP(site.shipping.freeFrom)}</span>. Por debajo,
            el envío cuesta <span className="price font-medium">{formatCOP(site.shipping.flatRate)}</span>.
          </p>
          <Link href="/terminos#envios" className="mt-auto self-start font-semibold text-accent underline-offset-4 hover:underline">
            Ver condiciones de envío
          </Link>
        </li>
        <li data-reveal-item className="flex flex-col gap-4 rounded-lg bg-surface p-6 sm:p-10">
          <h3 className="text-[26px] leading-tight font-bold md:text-[32px]">Asesoría personal</h3>
          <p className="text-base leading-relaxed">
            Una persona del equipo te ayuda a elegir, antes y después de comprar. {site.supportHours}.
          </p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto self-start font-semibold text-accent underline-offset-4 hover:underline"
          >
            Escribir al {site.whatsappDisplay}
          </a>
        </li>
        </ul>
      </Reveal>
    </section>
  );
}
