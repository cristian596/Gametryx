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
      >
        {/* El nombre accesible empieza con el texto visible (WCAG 2.5.3) y suma el producto en texto oculto */}
        {added ? (
          "Agregado"
        ) : compact ? (
          <span>
            {/* En tarjetas angostas (2 columnas en celular) solo cabe "Agregar" */}
            Agregar<span className="hidden sm:inline"> al carrito</span>
            <span className="sr-only">: {productName}</span>
          </span>
        ) : (
          <span>
            Agregar al carrito<span className="sr-only">: {productName}</span>
          </span>
        )}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {added ? `${productName} se agregó al carrito` : ""}
      </span>
    </>
  );
}
