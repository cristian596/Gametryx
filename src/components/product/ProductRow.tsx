import Image from "next/image";
import Link from "next/link";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Product } from "@/types/catalog";

/** Tarjeta horizontal compacta: miniatura, nombre, una línea de specs y precio. */
export function ProductRow({ product, subtitle }: { product: Product; subtitle?: string }) {
  const img = product.imagenes[0];
  return (
    <article className="group relative flex h-full items-center gap-4 rounded-md bg-surface p-3 pr-5 transition-colors hover:bg-surface-2">
      {img && (
        <Image
          src={img.url}
          alt=""
          width={120}
          height={120}
          unoptimized={img.url.endsWith(".svg")}
          className="size-24 shrink-0 rounded-sm sm:size-28"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="font-sans text-[15px] leading-snug font-semibold">
          <Link href={`/producto/${product.slug}`} className="line-clamp-2 after:absolute after:inset-0">
            {product.nombre}
          </Link>
        </h3>
        {subtitle && <p className="price truncate text-sm text-muted">{subtitle}</p>}
        <PriceTag price={product.precioCop} previousPrice={product.precioAnteriorCop} showVat={false} />
      </div>
    </article>
  );
}
