"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { saveProduct } from "@/app/admin/(panel)/productos/actions";
import type { AdminBrand, AdminCategory } from "@/lib/admin/products";
import { discountPercent, formatCOP } from "@/lib/format";
import { specLabel } from "@/lib/specs";
import {
  coerceSpecValue,
  FORM_FACTORS,
  PRODUCT_TYPES,
  RAM_TYPES,
  RESOLUTIONS,
  slugify,
  type ProductInput,
} from "@/lib/validation/product";
import { ImageManager } from "./ImageManager";

type FormValue = Omit<ProductInput, "isNew" | "specs"> & { specs: { key: string; value: string }[] };

/** Claves sugeridas según el tipo (coinciden con los filtros de la tienda). */
const SPEC_SUGGESTIONS: Record<string, string[]> = {
  pc_ensamblado: ["cpu", "gpu", "ram", "almacenamiento", "fuente", "resolucion_objetivo"],
  componente: ["componente", "socket", "tipo_ram", "tdp_w", "vram_gb", "capacidad_gb", "potencia_w", "factor_forma"],
  monitor: ["tamano_pulgadas", "resolucion", "hz", "panel", "tiempo_respuesta_ms"],
  periferico: ["conexion", "formato", "switches", "dpi", "peso_g", "bateria_h", "microfono"],
  gameroom: ["material", "ancho_cm", "fondo_cm", "carga_max_kg", "reclinacion_grados"],
};

const field =
  "h-11 w-full rounded-sm bg-surface-2 px-3 text-[15px] text-text placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary aria-invalid:outline-2 aria-invalid:outline-danger";

export function ProductForm({
  initial,
  isNew,
  categories,
  brands,
}: {
  initial: Omit<ProductInput, "isNew">;
  isNew: boolean;
  categories: AdminCategory[];
  brands: AdminBrand[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState<FormValue>({
    ...initial,
    specs: initial.specs.map((s) => ({ key: s.key, value: String(typeof s.value === "boolean" ? (s.value ? "sí" : "no") : s.value) })),
  });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string; field?: string } | null>(null);
  const [saved, setSaved] = useState(!isNew);
  const ids = useId();

  const set = <K extends keyof FormValue>(k: K, value: FormValue[K]) => setV((s) => ({ ...s, [k]: value }));
  const roots = categories.filter((c) => !c.parent_id);
  const pct = discountPercent(v.precio_cop, v.precio_anterior_cop);
  const fieldErr = (name: string) => (status?.kind === "error" && status.field?.startsWith(name) ? true : undefined);

  function submit() {
    setStatus(null);
    const payload: ProductInput = {
      ...v,
      isNew: isNew && !saved,
      specs: v.specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => ({ key: s.key.trim(), value: coerceSpecValue(s.value) })),
    };
    startTransition(async () => {
      const r = await saveProduct(JSON.stringify(payload));
      if (!r.ok) {
        setStatus({ kind: "error", text: r.error, field: r.field });
        return;
      }
      setSaved(true);
      setStatus({ kind: "ok", text: "Guardado. La tienda ya muestra los cambios." });
      if (isNew) router.replace(`/admin/productos/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
      noValidate
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Panel title="Datos básicos">
          <Field label="Nombre" htmlFor={`${ids}-nombre`}>
            <input
              id={`${ids}-nombre`}
              required
              value={v.nombre}
              aria-invalid={fieldErr("nombre")}
              onChange={(e) => {
                set("nombre", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              className={field}
            />
          </Field>
          <Field label="Enlace" htmlFor={`${ids}-slug`} hint={`Dirección: /producto/${v.slug || "…"}`}>
            <input
              id={`${ids}-slug`}
              required
              value={v.slug}
              aria-invalid={fieldErr("slug")}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              className={field}
            />
          </Field>
          <Field label="Descripción" htmlFor={`${ids}-desc`} hint="Una o dos frases: para qué sirve y por qué elegirlo.">
            <textarea
              id={`${ids}-desc`}
              rows={3}
              maxLength={2000}
              value={v.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              className={`${field} h-auto py-2.5 leading-relaxed`}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tipo" htmlFor={`${ids}-tipo`}>
              <select id={`${ids}-tipo`} value={v.tipo} onChange={(e) => set("tipo", e.target.value)} className={field}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoría" htmlFor={`${ids}-cat`}>
              <select
                id={`${ids}-cat`}
                value={v.categoria_id}
                aria-invalid={fieldErr("categoria_id")}
                onChange={(e) => set("categoria_id", e.target.value)}
                className={field}
              >
                <option value="">Elige…</option>
                {roots.map((r) => {
                  const subs = categories.filter((c) => c.parent_id === r.id);
                  return subs.length ? (
                    <optgroup key={r.id} label={r.nombre}>
                      {subs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Marca" htmlFor={`${ids}-marca`} hint={<Link href="/admin/marcas" className="text-accent">Crear marca</Link>}>
              <select
                id={`${ids}-marca`}
                value={v.marca_id ?? ""}
                onChange={(e) => set("marca_id", e.target.value || null)}
                className={field}
              >
                <option value="">Sin marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Etiquetas" htmlFor={`${ids}-tags`} hint="Separadas por coma. Ej.: streaming, 1440p. “streaming” lo muestra en el home.">
            <input
              id={`${ids}-tags`}
              defaultValue={v.tags.join(", ")}
              onChange={(e) =>
                set(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean),
                )
              }
              className={field}
            />
          </Field>
        </Panel>

        <Panel title="Especificaciones" description="Se muestran en la ficha y alimentan los filtros de la tienda.">
          <datalist id={`${ids}-keys`}>
            {(SPEC_SUGGESTIONS[v.tipo] ?? []).map((k) => (
              <option key={k} value={k}>
                {specLabel(k)}
              </option>
            ))}
          </datalist>
          <ul className="flex flex-col gap-2">
            {v.specs.map((s, i) => (
              <li key={i} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
                <input
                  aria-label={`Clave ${i + 1}`}
                  list={`${ids}-keys`}
                  value={s.key}
                  placeholder="clave (ej. hz)"
                  onChange={(e) =>
                    set("specs", v.specs.map((x, j) => (j === i ? { ...x, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") } : x)))
                  }
                  className={field}
                />
                <input
                  aria-label={`Valor de ${specLabel(s.key) || "la especificación"}`}
                  value={s.value}
                  placeholder="valor (ej. 165)"
                  onChange={(e) => set("specs", v.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                  className={field}
                />
                <RemoveBtn label="Quitar especificación" onClick={() => set("specs", v.specs.filter((_, j) => j !== i))} />
              </li>
            ))}
          </ul>
          <AddBtn onClick={() => set("specs", [...v.specs, { key: "", value: "" }])}>Agregar especificación</AddBtn>
          <p className="text-sm text-muted">Números sin unidad (165, no “165 Hz”): la tienda agrega la unidad. “sí” / “no” para sí o no.</p>
        </Panel>

        {v.tipo === "pc_ensamblado" && (
          <Panel title="FPS estimados" description="Se muestran como “estimado” en la ficha y en el home.">
            <ul className="flex flex-col gap-2">
              {v.fps.map((f, i) => (
                <li key={i} className="grid grid-cols-[1.6fr_1fr_0.8fr_auto] items-center gap-2">
                  <input aria-label={`Juego ${i + 1}`} value={f.juego} placeholder="Juego" onChange={(e) => set("fps", v.fps.map((x, j) => (j === i ? { ...x, juego: e.target.value } : x)))} className={field} />
                  <select aria-label={`Resolución ${i + 1}`} value={f.resolucion} onChange={(e) => set("fps", v.fps.map((x, j) => (j === i ? { ...x, resolucion: e.target.value as (typeof RESOLUTIONS)[number] } : x)))} className={field}>
                    {RESOLUTIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <input aria-label={`FPS ${i + 1}`} inputMode="numeric" value={f.fps || ""} placeholder="FPS" onChange={(e) => set("fps", v.fps.map((x, j) => (j === i ? { ...x, fps: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} className={`${field} price`} />
                  <RemoveBtn label="Quitar fila" onClick={() => set("fps", v.fps.filter((_, j) => j !== i))} />
                </li>
              ))}
            </ul>
            <AddBtn onClick={() => set("fps", [...v.fps, { juego: "", resolucion: "1080p", fps: 0 }])}>Agregar juego</AddBtn>
          </Panel>
        )}

        {v.tipo === "componente" && (
          <Panel title="Compatibilidad" description="La usa el armador de PC (Fase 5). Llena solo lo que aplique a esta pieza.">
            <CompatFields value={v.compat ?? {}} onChange={(c) => set("compat", c)} ids={ids} />
          </Panel>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <Panel title="Precio y stock">
          <Field label="Precio (IVA incluido)" htmlFor={`${ids}-precio`}>
            <MoneyInput id={`${ids}-precio`} value={v.precio_cop} onChange={(n) => set("precio_cop", n ?? 0)} invalid={fieldErr("precio_cop")} />
          </Field>
          <Field label="Precio anterior" htmlFor={`${ids}-antes`} hint={pct > 0 ? `Se muestra -${pct}% de descuento` : "Déjalo vacío si no hay descuento."}>
            <MoneyInput id={`${ids}-antes`} value={v.precio_anterior_cop} onChange={(n) => set("precio_anterior_cop", n)} invalid={fieldErr("precio_anterior_cop")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock" htmlFor={`${ids}-stock`}>
              <input id={`${ids}-stock`} inputMode="numeric" value={v.stock} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} className={`${field} price`} />
            </Field>
            <Field label="IVA %" htmlFor={`${ids}-iva`}>
              <input id={`${ids}-iva`} inputMode="numeric" value={v.iva_pct} onChange={(e) => set("iva_pct", Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0))} className={`${field} price`} />
            </Field>
          </div>
        </Panel>

        <Panel title="Visibilidad">
          <Check label="Visible en la tienda" checked={v.activo} onChange={(c) => set("activo", c)} />
          <Check label="Marcar como nuevo" checked={v.es_nuevo} onChange={(c) => set("es_nuevo", c)} />
          <Check label="Destacado en el home" checked={v.es_destacado} onChange={(c) => set("es_destacado", c)} />
        </Panel>

        <Panel title="Imágenes">
          <ImageManager productId={v.id} images={v.images} onChange={(imgs) => set("images", imgs)} />
        </Panel>

        <div className="flex flex-col gap-3 rounded-lg bg-surface p-4">
          <div aria-live="polite">
            {status && (
              <p role={status.kind === "error" ? "alert" : "status"} className={status.kind === "error" ? "text-[15px] text-danger" : "text-[15px] text-success"}>
                {status.text}
              </p>
            )}
          </div>
          <Button type="submit" size="lg" loading={pending}>
            {isNew && !saved ? "Crear producto" : "Guardar cambios"}
          </Button>
          {saved && (
            <Link href={`/producto/${v.slug}`} target="_blank" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-accent">
              Ver en la tienda <ExternalLink aria-hidden className="size-4" />
            </Link>
          )}
          <p className="text-center text-xs text-muted">
            Precio de venta: <span className="price">{formatCOP(v.precio_cop)}</span>
          </p>
        </div>
      </div>
    </form>
  );
}

function CompatFields({
  value,
  onChange,
  ids,
}: {
  value: NonNullable<ProductInput["compat"]>;
  onChange: (v: NonNullable<ProductInput["compat"]>) => void;
  ids: string;
}) {
  const num = (k: keyof typeof value, label: string, unit: string) => (
    <Field label={`${label} (${unit})`} htmlFor={`${ids}-c-${k}`}>
      <input
        id={`${ids}-c-${k}`}
        inputMode="numeric"
        value={(value[k] as number | null | undefined) ?? ""}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ""));
          onChange({ ...value, [k]: e.target.value === "" ? null : n });
        }}
        className={`${field} price`}
      />
    </Field>
  );
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Field label="Socket" htmlFor={`${ids}-c-socket`}>
        <input id={`${ids}-c-socket`} value={value.socket ?? ""} placeholder="AM5, LGA1700…" onChange={(e) => onChange({ ...value, socket: e.target.value || null })} className={field} />
      </Field>
      <Field label="Tipo de RAM" htmlFor={`${ids}-c-ram`}>
        <select id={`${ids}-c-ram`} value={value.tipo_ram ?? ""} onChange={(e) => onChange({ ...value, tipo_ram: (e.target.value || null) as never })} className={field}>
          <option value="">—</option>
          {RAM_TYPES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field label="Formato de board" htmlFor={`${ids}-c-ff`}>
        <select id={`${ids}-c-ff`} value={value.factor_forma ?? ""} onChange={(e) => onChange({ ...value, factor_forma: (e.target.value || null) as never })} className={field}>
          <option value="">—</option>
          {FORM_FACTORS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      {num("tdp_w", "Consumo", "W")}
      {num("potencia_w", "Potencia de fuente", "W")}
      {num("largo_mm", "Largo de la gráfica", "mm")}
      {num("alto_cooler_mm", "Alto del disipador", "mm")}
      {num("max_gpu_mm", "Gabinete: gráfica máx.", "mm")}
      {num("max_cooler_mm", "Gabinete: disipador máx.", "mm")}
      {num("slots_ram", "Ranuras de RAM", "#")}
      {num("m2_slots", "Ranuras M.2", "#")}
      <fieldset className="sm:col-span-3">
        <legend className="mb-1 text-sm font-semibold">Gabinete: formatos de board que admite</legend>
        <div className="flex flex-wrap gap-4">
          {FORM_FACTORS.map((f) => (
            <Check
              key={f}
              label={f}
              checked={value.formatos_soportados?.includes(f) ?? false}
              onChange={(c) =>
                onChange({
                  ...value,
                  formatos_soportados: c ? [...(value.formatos_soportados ?? []), f] : (value.formatos_soportados ?? []).filter((x) => x !== f),
                })
              }
            />
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-3">
        <Check label="El procesador tiene gráficos integrados" checked={value.tiene_igpu ?? false} onChange={(c) => onChange({ ...value, tiene_igpu: c })} />
      </div>
    </div>
  );
}

function MoneyInput({ id, value, onChange, invalid }: { id: string; value: number | null; onChange: (n: number | null) => void; invalid?: boolean }) {
  return (
    <div className="relative">
      <span aria-hidden className="price pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
        $
      </span>
      <input
        id={id}
        inputMode="numeric"
        aria-invalid={invalid}
        value={value == null ? "" : value.toLocaleString("es-CO")}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          onChange(digits ? Number(digits) : null);
        }}
        className={`${field} price pl-7`}
      />
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--color-primary)]" />
      {label}
    </label>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 self-start rounded-sm px-3 text-sm font-semibold text-accent hover:bg-surface-2">
      <Plus aria-hidden className="size-4" />
      {children}
    </button>
  );
}

function RemoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-11 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-danger">
      <Trash2 aria-hidden className="size-4" />
    </button>
  );
}
