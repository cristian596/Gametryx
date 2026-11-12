"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/store/cart";

export function CartButton() {
  const count = useCartCount();
  const label = count === 0 ? "Carrito vacío" : `Carrito, ${count} ${count === 1 ? "producto" : "productos"}`;

  return (
    <Link
      href="/carrito"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-sm text-text transition-colors hover:bg-surface-2"
    >
      <ShoppingCart aria-hidden className="size-[22px]" />
      {count > 0 && (
        <span
          key={count}
          aria-hidden
          className="price absolute animate-badge-pop top-0.5 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
