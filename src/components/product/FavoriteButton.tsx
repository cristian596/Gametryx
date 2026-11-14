"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { toggleFavorite } from "@/lib/account/account-actions";
import { cn } from "@/lib/cn";
import { useFavorites } from "@/store/favorites";
import { hasSessionCookie } from "@/store/session";

type Props = {
  productId: string;
  productName: string;
  /** icon: corazón flotante en la tarjeta · full: botón con texto en la página de producto */
  variant?: "icon" | "full";
  className?: string;
};

/** Guardar en favoritos. Sin sesión lleva a iniciar sesión y vuelve a esta página. */
export function FavoriteButton({ productId, productName, variant = "icon", className }: Props) {
  const router = useRouter();
  const on = useFavorites((s) => s.ids.has(productId));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  useEffect(() => {
    useFavorites.getState().ensureLoaded();
  }, []);

  const goToLogin = () => router.push(`/iniciar-sesion?next=${encodeURIComponent(location.pathname + location.search)}`);

  const onClick = () => {
    if (!hasSessionCookie()) return goToLogin();
    const next = !on;
    useFavorites.getState().set(productId, next); // optimista
    startTransition(async () => {
      const res = await toggleFavorite(productId, next);
      if (res.status === "ok") {
        setMessage(next ? `${productName} guardado en favoritos` : `${productName} quitado de favoritos`);
        return;
      }
      useFavorites.getState().set(productId, !next);
      if (res.status === "login") goToLogin();
      else setMessage("No pudimos guardar el favorito. Inténtalo de nuevo.");
    });
  };

  const label = on ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`;

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        aria-label={variant === "icon" ? label : undefined}
        disabled={pending}
        className={cn(
          variant === "icon"
            ? "grid size-10 place-items-center rounded-full bg-bg/75 backdrop-blur-sm transition-colors hover:bg-bg"
            : buttonStyles({ variant: "secondary", size: "lg" }),
          className,
        )}
      >
        <Heart
          aria-hidden
          className={cn(
            "size-5 transition-[color,fill,transform] duration-(--duration-fast)",
            on ? "fill-danger text-danger" : "text-text",
            pending && "scale-90",
          )}
        />
        {variant === "full" && <span>{on ? "En favoritos" : "Guardar"}</span>}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
