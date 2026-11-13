"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CircleAlert, Link2, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { StockBadge } from "@/components/ui/StockBadge";
import { whatsappUrl } from "@/config/site";
import { buildSummaryText, checkBuild, issuesIfChosen, SLOTS, type Build, type BuildPart, type Slot } from "@/lib/compat";
import { cn } from "@/lib/cn";
import { formatCOP } from "@/lib/format";
import { paramToPicks, picksToParam, useBuilder } from "@/store/builder";
import { useCart, useHydrated } from "@/store/cart";

export function Builder({ parts, budget, sharedPicks }: { parts: BuildPart[]; budget?: number; sharedPicks?: string }) {
  const hydrated = useHydrated();
  const picks = useBuilder((s) => s.picks);
  const setPick = useBuilder((s) => s.setPick);
  const replaceAll = useBuilder((s) => s.replaceAll);
  const clear = useBuilder((s) => s.clear);
  const addToCart = useCart((s) => s.add);
  const [picking, setPicking] = useState<Slot | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Avisa al CSS que hay barra inferior (sube el botón de WhatsApp en celular)
  useEffect(() => {
    document.documentElement.dataset.bottomBar = "";
    return () => {
      delete document.documentElement.dataset.bottomBar;
    };
  }, []);

  // Un enlace compartido (?piezas=) reemplaza el armado guardado
  useEffect(() => {
    if (!sharedPicks) return;
    const valid = new Set(parts.map((p) => `${p.slot}:${p.slug}`));
    const fromUrl = paramToPicks(sharedPicks, valid);
    if (Object.keys(fromUrl).length) replaceAll(fromUrl);
  }, [sharedPicks, parts, replaceAll]);

  // Antes de hidratar se muestra el armado vacío: evita desajustes con lo guardado en el navegador
  const build: Build = useMemo(() => {
    if (!hydrated) return {};
    const b: Build = {};
    for (const s of SLOTS) {
      const slug = picks[s.slot];
      const part = slug ? parts.find((p) => p.slot === s.slot && p.slug === slug) : undefined;
      if (part) b[s.slot] = part;
    }
    return b;
  }, [picks, parts, hydrated]);

  const result = useMemo(() => checkBuild(build), [build]);
  const chosen = Object.values(build).filter(Boolean) as BuildPart[];
  const slotHasError = (slot: Slot) => result.errores.some((e) => e.slots.includes(slot));
  const sharePath = `/armar-pc?piezas=${encodeURIComponent(picksToParam(Object.fromEntries(chosen.map((p) => [p.slot, p.slug]))))}`;
  const quotePath = `/cotizacion?armado=${encodeURIComponent(picksToParam(Object.fromEntries(chosen.map((p) => [p.slot, p.slug]))))}`;

  function flash(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(null), 2500);
  }

  function addAll() {
    for (const p of chosen) if (p.stock > 0) addToCart(p.id, 1, p.stock);
    const skipped = chosen.filter((p) => p.stock <= 0).length;
    flash(skipped ? `Agregamos ${chosen.length - skipped} piezas. ${skipped} agotada(s) quedaron fuera.` : "Agregamos todas las piezas al carrito.");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(sharePath, location.origin).toString());
      flash("Enlace copiado. Compártelo para que vean tu armado.");
    } catch {
      flash("No pudimos copiar el enlace. Cópialo de la barra de direcciones.");
    }
  }

  const summary = (
    <Summary
      result={result}
      budget={budget}
      count={chosen.length}
      onAddAll={addAll}
      onCopy={copyLink}
      quotePath={quotePath}
      whatsappHref={whatsappUrl(buildSummaryText(build, result, formatCOP))}
      onClear={() => {
        clear();
        flash("Armado vacío. Empieza por el procesador.");
      }}
      notice={notice}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-8 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0">
      <ol className="flex flex-col gap-3">
        {SLOTS.map(({ slot, label, required }) => {
          const part = build[slot];
          const err = slotHasError(slot);
          const options = parts.filter((p) => p.slot === slot);
          return (
            <li
              key={slot}
              className={cn(
                "flex flex-col gap-3 rounded-lg bg-surface p-4 sm:flex-row sm:items-center sm:gap-4",
                err && "outline-2 -outline-offset-2 outline-danger",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    err ? "bg-danger text-on-primary" : part ? "bg-success text-on-primary" : "bg-surface-2 text-muted",
                  )}
                >
                  {err ? <X className="size-5" /> : part ? <Check className="size-5" strokeWidth={3} /> : <Plus className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted">
                    {label}
                    {!required && " · opcional"}
                  </p>
                  {part ? (
                    <p className="line-clamp-2 font-semibold">
                      {part.nombre} <span className="price ml-1 font-medium text-muted">{formatCOP(part.precio)}</span>
                    </p>
                  ) : (
                    <p className="font-semibold text-muted">{options.length ? "Sin elegir" : "Sin opciones por ahora"}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {part && (
                  <Button variant="ghost" size="sm" onClick={() => setPick(slot, null)} aria-label={`Quitar ${label.toLowerCase()}`}>
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                )}
                <Button
                  variant={part ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => setPicking(slot)}
                  disabled={options.length === 0}
                  className="flex-1 sm:flex-none"
                >
                  {part ? "Cambiar" : `Elegir ${label.toLowerCase()}`}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Escritorio: resumen fijo a la derecha */}
      <aside aria-label="Resumen del armado" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
        {summary}
      </aside>

      {/* Celular: barra inferior con el total y acceso al resumen */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-surface-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-float lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="price text-xl font-medium">{formatCOP(result.total)}</p>
            <p className={cn("text-sm", result.errores.length ? "text-danger" : "text-muted")}>
              {result.errores.length
                ? `${result.errores.length} incompatibilidad${result.errores.length > 1 ? "es" : ""}`
                : `${chosen.length} de ${SLOTS.length} piezas`}
            </p>
          </div>
          <Button onClick={() => setSummaryOpen(true)}>Ver resumen</Button>
        </div>
      </div>
      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Tu armado" variant="bottom">
        {summary}
      </Dialog>

      {picking && (
        <PartPicker
          slot={picking}
          parts={parts.filter((p) => p.slot === picking)}
          build={build}
          onClose={() => setPicking(null)}
          onPick={(p) => {
            setPick(p.slot, p.slug);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}

function Summary({
  result,
  budget,
  count,
  onAddAll,
  onCopy,
  onClear,
  quotePath,
  whatsappHref,
  notice,
}: {
  result: ReturnType<typeof checkBuild>;
  budget?: number;
  count: number;
  onAddAll: () => void;
  onCopy: () => void;
  onClear: () => void;
  quotePath: string;
  whatsappHref: string;
  notice: string | null;
}) {
  const overBudget = budget ? result.total - budget : 0;
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface p-5">
      <div>
        <p className="text-sm text-muted">Total del armado</p>
        <p className="price text-[32px] leading-tight font-medium">{formatCOP(result.total)}</p>
        <p className="text-xs text-muted">IVA incluido</p>
        {budget ? (
          <p className={cn("mt-2 text-sm", overBudget > 0 ? "text-warning" : "text-success")}>
            {overBudget > 0
              ? `${formatCOP(overBudget)} por encima de tu presupuesto de ${formatCOP(budget)}`
              : `Dentro de tu presupuesto de ${formatCOP(budget)}`}
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-2 p-3 text-sm">
        <div>
          <dt className="text-muted">Consumo estimado</dt>
          <dd className="price text-base">{result.potenciaEstimadaW} W</dd>
        </div>
        <div>
          <dt className="text-muted">Fuente recomendada</dt>
          <dd className="price text-base">{result.fuenteRecomendadaW} W o más</dd>
        </div>
      </dl>

      <div aria-live="polite" className="flex flex-col gap-2">
        {count > 0 && result.errores.length === 0 && result.completo && (
          <p className="flex items-start gap-2 rounded-md bg-success/15 p-3 text-[15px]">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={3} />
            Todo es compatible.
          </p>
        )}
        {result.errores.map((e) => (
          <p key={e.code} className="flex items-start gap-2 rounded-md bg-danger/15 p-3 text-[15px]">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
            {e.message}
          </p>
        ))}
        {result.avisos.map((a) => (
          <p key={a.code} className="flex items-start gap-2 rounded-md bg-warning/12 p-3 text-[15px]">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            {a.message}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          onClick={onAddAll}
          disabled={count === 0 || result.errores.length > 0}
          icon={<ShoppingCart aria-hidden className="size-4" />}
        >
          Agregar todo al carrito
        </Button>
        {result.errores.length > 0 && count > 0 && (
          <p className="text-center text-sm text-muted">Resuelve las incompatibilidades para comprar, o cotízalo y te ayudamos.</p>
        )}
        <LinkButton href={quotePath} variant="secondary" size="lg" aria-disabled={count === 0 || undefined}>
          Cotizar este PC
        </LinkButton>
        <div className="grid grid-cols-2 gap-2">
          <LinkButton
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            icon={<WhatsAppIcon className="size-4" />}
            aria-disabled={count === 0 || undefined}
          >
            WhatsApp
          </LinkButton>
          <Button variant="ghost" onClick={onCopy} disabled={count === 0} icon={<Link2 aria-hidden className="size-4" />}>
            Copiar enlace
          </Button>
        </div>
        {count > 0 && (
          <button type="button" onClick={onClear} className="h-10 text-sm text-muted underline-offset-4 hover:text-text hover:underline">
            Vaciar armado
          </button>
        )}
      </div>
      <p role="status" className="min-h-5 text-center text-sm text-success">
        {notice}
      </p>
    </div>
  );
}

function PartPicker({
  slot,
  parts,
  build,
  onClose,
  onPick,
}: {
  slot: Slot;
  parts: BuildPart[];
  build: Build;
  onClose: () => void;
  onPick: (p: BuildPart) => void;
}) {
  const label = SLOTS.find((s) => s.slot === slot)!.label;
  // Compatibles primero, luego por precio
  const ranked = parts
    .map((p) => ({ part: p, issues: issuesIfChosen(build, p) }))
    .sort((a, b) => a.issues.length - b.issues.length || a.part.precio - b.part.precio);

  return (
    <Dialog open onClose={onClose} title={`Elige ${label.toLowerCase()}`} variant="right">
      <ul className="flex flex-col gap-2">
        {ranked.map(({ part, issues }) => {
          const selected = build[slot]?.slug === part.slug;
          return (
            <li key={part.slug}>
              <button
                type="button"
                onClick={() => onPick(part)}
                aria-describedby={issues.length ? `issue-${part.slug}` : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors",
                  selected ? "bg-surface-3 outline-2 outline-primary" : "bg-surface-2 hover:bg-surface-3",
                )}
              >
                {part.imagen && (
                  <Image
                    src={part.imagen}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized={part.imagen.endsWith(".svg")}
                    className={cn("size-16 shrink-0 rounded-sm", issues.length && "opacity-60")}
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="line-clamp-2 text-[15px] font-semibold">{part.nombre}</span>
                  <span className="price text-base">{formatCOP(part.precio)}</span>
                  <StockBadge stock={part.stock} className="text-xs" />
                  {issues.length > 0 && (
                    <span id={`issue-${part.slug}`} className="text-sm text-danger">
                      No compatible: {issues[0].message}
                    </span>
                  )}
                </span>
                {selected && <Check aria-label="Elegido" className="size-5 shrink-0 text-primary" strokeWidth={3} />}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">
        ¿No ves lo que buscas?{" "}
        <Link href="/cotizacion" className="font-semibold text-accent">
          Pídelo en la cotización
        </Link>
        .
      </p>
    </Dialog>
  );
}
