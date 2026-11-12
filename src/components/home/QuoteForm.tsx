"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { whatsappUrl } from "@/config/site";
import { quoteBudgets, quoteInterests } from "@/lib/validation/quote-options";

type Errors = Partial<Record<string, string>>;
type QuoteModule = typeof import("@/lib/validation/quote");

/** zod no va en el JS inicial: se descarga cuando la persona empieza a llenar el formulario. */
let quoteModule: Promise<QuoteModule> | null = null;
function loadQuoteModule() {
  quoteModule ??= import("@/lib/validation/quote");
  return quoteModule;
}

/**
 * Formulario de cotización. Hasta la Fase 5 (API /api/quotes) envía la solicitud por WhatsApp
 * con el mensaje ya escrito, así funciona desde hoy.
 */
export function QuoteForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const consentId = useId();

  const loaded = useRef<QuoteModule | null>(null);
  function preload() {
    if (!loaded.current) loadQuoteModule().then((m) => (loaded.current = m));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    // Si zod ya estaba cargado, todo ocurre en el mismo clic y WhatsApp se abre directo
    const sync = loaded.current !== null;
    const { quoteSchema } = loaded.current ?? (loaded.current = await loadQuoteModule());
    const fd = new FormData(form);
    const raw = {
      nombre: String(fd.get("nombre") ?? ""),
      telefono: String(fd.get("telefono") ?? ""),
      correo: String(fd.get("correo") ?? ""),
      interes: String(fd.get("interes") ?? ""),
      presupuesto: String(fd.get("presupuesto") ?? ""),
      mensaje: String(fd.get("mensaje") ?? ""),
      autorizacion: fd.get("autorizacion") === "on",
      empresa: String(fd.get("empresa") ?? ""),
    };
    const parsed = quoteSchema.safeParse(raw);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      // Lleva el foco al primer campo con error
      const first = Object.keys(next)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    const d = parsed.data;
    const interes = quoteInterests.find((i) => i.value === d.interes)?.label;
    const presupuesto = quoteBudgets.find((b) => b.value === d.presupuesto)?.label;
    const text = [
      `Hola, soy ${d.nombre} y quiero una cotización.`,
      `Busco: ${interes}.`,
      `Presupuesto: ${presupuesto}.`,
      d.mensaje ? `Detalles: ${d.mensaje}` : null,
      `Mi número: ${d.telefono}${d.correo ? ` · Correo: ${d.correo}` : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
    const url = whatsappUrl(text);
    // Fuera del gesto del usuario el navegador bloquearía la ventana: entonces queda el botón "Abrir WhatsApp"
    if (sync) window.open(url, "_blank", "noopener,noreferrer");
    setSentUrl(url);
  }

  if (sentUrl) {
    return (
      <div role="status" className="flex animate-rise-in flex-col items-start gap-4 rounded-lg bg-surface p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="size-10 text-success" />
        <h3 className="text-2xl font-semibold">Tu cotización está lista para enviar</h3>
        <p className="text-base leading-relaxed">
          Dejamos tu mensaje escrito en WhatsApp. Si no se abrió solo, toca el botón y luego enviar.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={sentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-sm bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover"
          >
            Abrir WhatsApp
          </a>
          <Button variant="secondary" onClick={() => setSentUrl(null)}>
            Hacer otra cotización
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onFocus={preload} onPointerEnter={preload} noValidate className="flex flex-col gap-5 rounded-lg bg-surface p-5 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input name="nombre" label="Nombre" autoComplete="name" required error={errors.nombre} />
        <Input
          name="telefono"
          label="Celular (WhatsApp)"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="300 123 4567"
          required
          error={errors.telefono}
        />
      </div>
      <Input
        name="correo"
        label="Correo"
        type="email"
        autoComplete="email"
        hint="Opcional. Para enviarte la cotización por escrito."
        error={errors.correo}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          name="interes"
          label="¿Qué buscas?"
          placeholder="Elige una opción"
          options={[...quoteInterests]}
          required
          error={errors.interes}
          defaultValue=""
        />
        <Select
          name="presupuesto"
          label="Presupuesto"
          placeholder="Elige un rango"
          options={[...quoteBudgets]}
          required
          error={errors.presupuesto}
          defaultValue=""
        />
      </div>
      <Textarea
        name="mensaje"
        label="Cuéntanos más"
        placeholder="Por ejemplo: quiero jugar Warzone en 2K y transmitir en Kick."
        hint="Opcional."
        rows={3}
        error={errors.mensaje}
      />
      {/* Campo trampa para bots: oculto para personas y lectores de pantalla */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Empresa
          <input name="empresa" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
          <input
            id={consentId}
            name="autorizacion"
            type="checkbox"
            aria-invalid={errors.autorizacion ? true : undefined}
            aria-describedby={errors.autorizacion ? `${consentId}-error` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-primary)]"
          />
          <span>
            Autorizo a VOLTA a usar mis datos para responder esta cotización, según la{" "}
            <Link href="/privacidad" className="font-semibold text-accent underline underline-offset-4">
              política de tratamiento de datos
            </Link>
            .
          </span>
        </label>
        {errors.autorizacion && (
          <p id={`${consentId}-error`} role="alert" className="text-sm text-danger">
            {errors.autorizacion}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="self-start">
        Enviar cotización por WhatsApp
      </Button>
    </form>
  );
}
