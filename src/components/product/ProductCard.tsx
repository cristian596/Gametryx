import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { StockBadge } from "@/components/ui/StockBadge";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/catalog";
import { AddToCartButton } from "./AddToCartButton";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.imagenes[0];
  const pct = discountPercent(product.precioCop, product.precioAnteriorCop);
  const soldOut = product.stock <= 0;
  const href = `/producto/${product.slug}`;

  return (
    <article className="group relative flex w-full min-w-0 flex-col rounded-md bg-surface p-3 transition-colors duration-(--duration-base) hover:bg-surface-2">
      <Link href={href} className="relative block overflow-hidden rounded-sm" tabIndex={-1} aria-hidden>
        {image && (
          <Image
            src={image.url}
            alt=""
            width={400}
            height={400}
            priority={priority}
            unoptimized={image.url.endsWith(".svg")}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className={cn(
              "aspect-square w-full object-cover transition-transform duration-(--duration-slow) ease-(--ease-out-quart) group-hover:scale-[1.03]",
              soldOut && "opacity-50 grayscale",
            )}
          />
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {soldOut ? (
            <Badge variant="agotado">Agotado</Badge>
          ) : (
            <>
              {pct > 0 && <Badge variant="oferta">-{pct}%</Badge>}
              {product.esNuevo && <Badge variant="nuevo">Nuevo</Badge>}
            </>
          )}
        </div>
      </Link>
      {/* z-10: por encima del enlace que cubre la tarjeta */}
      <FavoriteButton productId={product.id} productName={product.nombre} className="absolute top-5 right-5 z-10" />

      <div className="flex flex-1 flex-col gap-3 px-1 pt-3">
        <p className="text-sm text-muted">{product.marca}</p>
        <h3 className="-mt-2 font-sans text-[15px] leading-snug font-semibold text-text">
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-['']">
            {product.nombre}
          </Link>
        </h3>
        <div className="mt-auto flex flex-col gap-2">
          <PriceTag price={product.precioCop} previousPrice={product.precioAnteriorCop} showVat={false} />
          <StockBadge stock={product.stock} />
        </div>
        {/* z-10: el botón queda por encima del enlace que cubre la tarjeta */}
        <div className="relative z-10">
          <AddToCartButton
            productId={product.id}
            productName={product.nombre}
            stock={product.stock}
            compact
            className="w-full px-3"
          />
        </div>
      </div>
    </article>
  );
}
