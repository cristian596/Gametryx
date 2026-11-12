"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OPEN_COOKIE_SETTINGS_EVENT, readConsent, saveConsent } from "@/lib/consent";
import { cn } from "@/lib/cn";

/**
 * Aviso de cookies. "Solo necesarias" tiene el mismo peso visual que "Aceptar todas".
 * Se vuelve a abrir desde el footer ("Configurar cookies").
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [analitica, setAnalitica] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const current = readConsent();
    // Se lee localStorage solo en el cliente, después de montar
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!current) setOpen(true);

    function onOpen() {
      const saved = readConsent();
      setAnalitica(saved?.analitica ?? false);
      setMarketing(saved?.marketing ?? false);
      setDetailed(true);
      setOpen(true);
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.cookieBanner = "open";
    else delete root.dataset.cookieBanner;
  }, [open]);

  if (!open) return null;

  function decide(choice: { analitica: boolean; marketing: boolean }) {
    saveConsent(choice);
    setOpen(false);
    setDetailed(false);
  }

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 animate-rise-in p-3 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-md sm:p-0"
    >
      <div className="rounded-lg bg-surface-2 p-5 shadow-float pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h2 id={titleId} className="text-lg font-semibold">
          Tu privacidad, tus reglas
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-text">
          Usamos cookies necesarias para que la tienda funcione (carrito y sesión). Con tu permiso, también
          usamos cookies para medir visitas y mejorar la tienda.{" "}
          <Link href="/cookies" className="font-semibold text-accent underline underline-offset-4">
            Más información
          </Link>
        </p>

        {detailed && (
          <fieldset className="mt-4 flex flex-col gap-1">
            <legend className="sr-only">Tipos de cookies</legend>
            <CookieToggle
              label="Necesarias"
              description="Carrito, sesión y seguridad. Siempre activas."
              checked
              disabled
            />
            <CookieToggle
              label="Analítica"
              description="Nos dicen qué páginas se visitan para mejorarlas."
              checked={analitica}
              onChange={setAnalitica}
            />
            <CookieToggle
              label="Marketing"
              description="Permiten mostrarte anuncios de VOLTA en otras páginas."
              checked={marketing}
              onChange={setMarketing}
            />
          </fieldset>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {detailed ? (
            <>
              <Button variant="secondary" onClick={() => decide({ analitica: false, marketing: false })}>
                Solo necesarias
              </Button>
              <Button onClick={() => decide({ analitica, marketing })}>Guardar selección</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => decide({ analitica: false, marketing: false })}>
                Solo necesarias
              </Button>
              <Button onClick={() => decide({ analitica: true, marketing: true })}>Aceptar todas</Button>
              <Button variant="ghost" className="col-span-2" onClick={() => setDetailed(true)}>
                Elegir qué cookies acepto
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CookieToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-sm px-2 py-2.5 transition-colors hover:bg-surface-3",
        disabled && "cursor-default hover:bg-transparent",
      )}
    >
      <span className="flex flex-col">
        <span className="font-semibold">{label}</span>
        <span className="text-sm text-muted">{description}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-[var(--color-primary)] disabled:opacity-60"
      />
    </label>
  );
}
