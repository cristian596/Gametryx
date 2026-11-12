"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button, type ButtonSize } from "@/components/ui/Button";
import { useCart } from "@/store/cart";

export function AddToCartButton({
  productId,
  productName,
  stock,
  size = "md",
  compact = false,
  className,
}: {
  productId: string;
  productName: string;
  stock: number;
  size?: ButtonSize;
  compact?: boolean;
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  if (stock <= 0) {
    return (
      <Button variant="secondary" size={size} disabled className={className}>
        Agotado
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        className={className}
        icon={added ? <Check aria-hidden className="size-4" /> : <ShoppingCart aria-hidden className="size-4" />}
        onClick={() => {
          add(productId, 1, stock);
          setAdded(true);
        }}
        aria-label={`Agregar ${productName} al carrito`}
      >
        {added ? (
          "Agregado"
        ) : compact ? (
          <>
            {/* En tarjetas angostas (2 columnas en celular) solo cabe "Agregar" */}
            <span className="sm:hidden">Agregar</span>
            <span className="hidden sm:inline">Agregar al carrito</span>
          </>
        ) : (
          "Agregar al carrito"
        )}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {added ? `${productName} se agregó al carrito` : ""}
      </span>
    </>
  );
}
