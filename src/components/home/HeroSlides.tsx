import Image from "next/image";
import { Check } from "lucide-react";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { LinkButton } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { discountPercent, formatCOP } from "@/lib/format";
import type { Product } from "@/types/catalog";
import { HeroSlider, type HeroSlide } from "./HeroSlider";

const slideGrid = "grid min-h-[560px] md:min-h-[540px] md:grid-cols-12 lg:min-h-[600px]";
const textCol = "flex flex-col justify-center gap-6 p-6 sm:p-10 md:col-span-6 lg:col-span-5 lg:p-14";
const headline = "text-[36px] leading-[0.95] font-bold tracking-[-0.03em] sm:text-[48px] lg:text-[64px]";

function PcSlide({ pc, priority }: { pc: Product; priority: boolean }) {
  const specs = [
    { k: "Procesador", v: String(pc.specs.cpu) },
    { k: "Gráfica", v: String(pc.specs.gpu) },
    { k: "Memoria", v: String(pc.specs.ram) },
    { k: "Almacenamiento", v: String(pc.specs.almacenamiento) },
  ];
  const image = pc.imagenes[0];
  return (
    <div className={slideGrid}>
      <div className={textCol}>
        <div>
          <h2 className={headline}>PC VOLTA Surge</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed">
            Para jugar en 2K a alta tasa de refresco y transmitir al mismo tiempo.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {specs.map((s) => (
            <div key={s.k}>
              <dt className="text-sm text-muted">{s.k}</dt>
              <dd className="text-[15px] font-semibold">{s.v}</dd>
            </div>
          ))}
        </dl>
        <PriceTag price={pc.precioCop} previousPrice={pc.precioAnteriorCop} size="lg" showAddi />
        <div className="flex flex-wrap gap-3">
          <AddToCartButton productId={pc.id} productName={pc.nombre} stock={pc.stock} size="lg" />
          <LinkButton href={`/producto/${pc.slug}`} variant="secondary" size="lg">
            Ver detalles
          </LinkButton>
        </div>
      </div>
      {image && (
        <div className="relative order-first aspect-[4/3] bg-surface-2 md:order-none md:col-span-6 md:aspect-auto lg:col-span-7">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            unoptimized={image.url.endsWith(".svg")}
            sizes="(min-width: 1024px) 720px, (min-width: 768px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}

function GpuSlide({ gpu }: { gpu: Product }) {
  const pct = discountPercent(gpu.precioCop, gpu.precioAnteriorCop);
  const image = gpu.imagenes[0];
  return (
    <div className={slideGrid}>
      <div className={textCol}>
        <div>
          <h2 className={headline}>
            RTX 5070 con <span className="whitespace-nowrap">{pct} %</span> menos
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed">
            12 GB GDDR7 y DLSS 4 para jugar en 2K. Oferta hasta agotar las {gpu.stock} unidades.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <p className="price text-[44px] leading-none font-medium sm:text-[56px]">{formatCOP(gpu.precioCop)}</p>
        </div>
        <p className="-mt-3 text-[15px] text-muted">
          Antes <span className="price line-through">{formatCOP(gpu.precioAnteriorCop ?? 0)}</span> · IVA incluido · Paga a
          cuotas con Addi
        </p>
        <div className="flex flex-wrap gap-3">
          <AddToCartButton productId={gpu.id} productName={gpu.nombre} stock={gpu.stock} size="lg" />
          <LinkButton href={`/producto/${gpu.slug}`} variant="secondary" size="lg">
            Ver detalles
          </LinkButton>
        </div>
      </div>
      {image && (
        <div className="relative order-first aspect-[4/3] bg-surface-2 md:order-none md:col-span-6 md:aspect-auto lg:col-span-7">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            loading="lazy"
            unoptimized={image.url.endsWith(".svg")}
            sizes="(min-width: 1024px) 720px, (min-width: 768px) 50vw, 100vw"
            className="object-contain"
          />
          <span className="price absolute top-5 left-5 rounded-sm bg-danger px-3 py-1.5 text-lg font-medium text-on-primary">
            -{pct}%
          </span>
        </div>
      )}
    </div>
  );
}

/** La hoja de compatibilidad del armador es la imagen de esta diapositiva. */
function BuilderSlide() {
  const parts = [
    { k: "Procesador", v: "Ryzen 7 7700 · AM5" },
    { k: "Board", v: "B650 · AM5 · DDR5" },
    { k: "Memoria", v: "32 GB DDR5 6000" },
    { k: "Gráfica", v: "RTX 5070 · 300 mm" },
    { k: "Gabinete", v: "Admite hasta 380 mm" },
    { k: "Fuente", v: "850 W · necesitas 600 W" },
  ];
  return (
    <div className={slideGrid}>
      <div className={textCol}>
        <div>
          <h2 className={headline}>Arma tu PC pieza por pieza</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed">
            Elige cada componente y te avisamos al instante si algo no es compatible. El total se actualiza mientras
            armas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/armar-pc" size="lg" variant="inverse">
            Armar mi PC
          </LinkButton>
          <LinkButton href="/cotizacion" size="lg" variant="inverse-ghost">
            Prefiero que me coticen
          </LinkButton>
        </div>
      </div>
      <div className="flex items-center p-6 pt-0 sm:p-10 md:col-span-6 md:pt-10 lg:col-span-7 lg:p-14">
        <ul aria-label="Ejemplo de armado compatible" className="w-full rounded-lg bg-on-primary p-3 text-text sm:p-4">
          {parts.map((p) => (
            <li
              key={p.k}
              className="flex items-center gap-4 rounded-sm px-3 py-3 odd:bg-surface sm:px-4 sm:py-3.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-on-primary">
                <Check aria-hidden className="size-4" strokeWidth={3} />
              </span>
              <span className="w-28 shrink-0 text-sm text-muted sm:w-36 sm:text-[15px]">{p.k}</span>
              <span className="truncate text-[15px] font-semibold sm:text-base">{p.v}</span>
            </li>
          ))}
          <li className="mt-2 flex items-center justify-between gap-4 rounded-sm bg-surface-2 px-4 py-4">
            <span className="font-semibold">Todo compatible</span>
            <span className="price text-lg text-primary">{formatCOP(7_490_000)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Diapositiva de reserva con contenido estático: se usa si el catálogo no devuelve el producto
 * (cambió el slug, está inactivo o la BD falló), para que el hero nunca quede vacío.
 */
function FallbackSlide({
  title,
  text,
  href,
  cta,
  image,
  priority,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  image: string;
  priority?: boolean;
}) {
  return (
    <div className={slideGrid}>
      <div className={textCol}>
        <div>
          <h2 className={headline}>{title}</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={href} size="lg">
            {cta}
          </LinkButton>
          <LinkButton href="/cotizacion" variant="secondary" size="lg">
            Cotizar con un asesor
          </LinkButton>
        </div>
      </div>
      <div className="relative order-first aspect-[4/3] bg-surface-2 md:order-none md:col-span-6 md:aspect-auto lg:col-span-7">
        <Image
          src={image}
          alt=""
          fill
          priority={priority}
          unoptimized
          sizes="(min-width: 1024px) 720px, (min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}

export function HeroSlides({ pc, gpu }: { pc: Product | null; gpu: Product | null }) {
  const slides: HeroSlide[] = [];

  slides.push(
    pc
      ? { id: "pc", label: "PC Surge 1440p", title: "PC VOLTA Surge", tone: "dark", content: <PcSlide pc={pc} priority /> }
      : {
          id: "pc",
          label: "PC armados",
          title: "PC gamer armados",
          tone: "dark",
          content: (
            <FallbackSlide
              title="PC gamer armados"
              text="Equipos para 1080p, 2K y 4K, listos para conectar y jugar."
              href="/pc-gaming?tipo=pc-armados"
              cta="Ver PC armados"
              image="/placeholders/pc.svg"
              priority
            />
          ),
        },
  );

  // La diapositiva de la GPU solo tiene sentido si existe y tiene descuento real
  const gpuOnSale = gpu && discountPercent(gpu.precioCop, gpu.precioAnteriorCop) > 0;
  slides.push(
    gpuOnSale
      ? { id: "gpu", label: "RTX 5070 en oferta", title: "Tarjeta gráfica RTX 5070 en descuento", tone: "dark", content: <GpuSlide gpu={gpu} /> }
      : {
          id: "gpu",
          label: "Componentes",
          title: "Componentes para tu PC",
          tone: "dark",
          content: (
            <FallbackSlide
              title="Mejora tu PC"
              text="Tarjetas gráficas, procesadores, memoria y almacenamiento con asesoría para elegir."
              href="/pc-gaming?tipo=componentes"
              cta="Ver componentes"
              image="/placeholders/gpu.svg"
            />
          ),
        },
  );

  slides.push({ id: "armar", label: "Arma tu PC", title: "Arma tu PC pieza por pieza", tone: "primary", content: <BuilderSlide /> });
  return <HeroSlider slides={slides} />;
}
