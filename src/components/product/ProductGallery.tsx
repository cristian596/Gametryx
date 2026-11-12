"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ProductImage } from "@/types/catalog";

/** Imagen principal + miniaturas (solo si hay más de una). La primera se carga con prioridad (LCP). */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="aspect-square w-full rounded-md bg-surface-2" />;
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-md bg-surface-2">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || name}
          fill
          priority={active === 0}
          unoptimized={current.url.endsWith(".svg")}
          sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
          className="animate-fade-in object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Imágenes del producto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                aria-label={`Ver imagen ${i + 1} de ${images.length}`}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-sm bg-surface-2 transition-opacity",
                  i === active ? "outline-2 outline-primary" : "opacity-60 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" unoptimized={img.url.endsWith(".svg")} className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
