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
 * Formulario de cotización: se guarda en la base de datos (/api/quotes) y un asesor responde por WhatsApp.
 * Si la API no está disponible (sin Supabase o sin conexión), deja el mensaje listo en WhatsApp.
 * Con `armado` se adjunta el PC del armador; el servidor relee piezas y precios del catálogo.
 */
export function QuoteForm({ armado, defaultInteres }: { armado?: string; defaultInteres?: string } = {}) {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ kind: "saved"; phone: string; url: string } | { kind: "whatsapp"; url: string } | null>(null);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const consentId = useId();

  const loaded = useRef<QuoteModule | null>(null);
  function preload() {
    if (!loaded.current) loadQuoteModule().then((m) => (loaded.current = m));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setFormError(null);
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
      armado: armado || undefined,
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
      armado ? "Te envié mi armado desde el armador de VOLTA." : null,
      d.mensaje ? `Detalles: ${d.mensaje}` : null,
      `Mi número: ${d.telefono}${d.correo ? ` · Correo: ${d.correo}` : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
    const url = whatsappUrl(text);

    setSending(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string };
      if (res.ok && json.ok) {
        setDone({ kind: "saved", phone: d.telefono, url });
      } else if (res.status === 503) {
        setDone({ kind: "whatsapp", url });
      } else {
        if (json.field) setErrors({ [json.field]: json.error });
        setFormError(json.error ?? "No pudimos enviar tu cotización. Intenta de nuevo.");
      }
    } catch {
      // Sin conexión con el servidor: el mensaje queda listo para WhatsApp
      setDone({ kind: "whatsapp", url });
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex animate-rise-in flex-col items-start gap-4 rounded-lg bg-surface p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="size-10 text-success" />
        {done.kind === "saved" ? (
          <>
            <h3 className="text-2xl font-semibold">Recibimos tu cotización</h3>
            <p className="text-base leading-relaxed">
              Un asesor te escribe por WhatsApp al <span className="price">{done.phone}</span> en horario de atención. Si
              prefieres, escríbenos tú ahora.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-semibold">Tu cotización está lista para enviar</h3>
            <p className="text-base leading-relaxed">Toca el botón y luego enviar: el mensaje ya está escrito en WhatsApp.</p>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <a
            href={done.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-sm bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover"
          >
            {done.kind === "saved" ? "Escribir por WhatsApp" : "Abrir WhatsApp"}
          </a>
          <Button variant="secondary" onClick={() => setDone(null)}>
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
          defaultValue={defaultInteres ?? ""}
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
      {formError && (
        <p role="alert" className="rounded-sm bg-danger/15 px-4 py-3 text-[15px]">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" className="self-start" loading={sending}>
        Enviar cotización
      </Button>
    </form>
  );
}
