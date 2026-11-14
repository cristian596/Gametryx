"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { departamentos } from "@/data/colombia";
import { deleteAddress, saveAddress, setMainAddress } from "@/lib/account/account-actions";
import type { FormState } from "@/lib/account/form-state";
import { formatPhone } from "@/lib/format";
import { FormAlert } from "./FormAlert";
import { useFormAction } from "./useFormAction";

export type Address = {
  id: string;
  alias: string;
  destinatario: string;
  telefono: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  complemento: string | null;
  es_principal: boolean;
};

const MAX = 10;

/** Lista de direcciones con agregar, editar, elegir principal y eliminar (con confirmación). */
export function AddressManager({ addresses }: { addresses: Address[] }) {
  // null: lista · "new": agregar · id: editar esa dirección
  const [mode, setMode] = useState<string | null>(addresses.length === 0 ? "new" : null);
  const [notice, setNotice] = useState<string | null>(null);
  const editing = mode && mode !== "new" ? addresses.find((a) => a.id === mode) : undefined;

  // Al volver a la lista (guardar, cancelar, eliminar…) el foco va a la lista: el teclado y el
  // lector de pantalla no se pierden y la página no queda desplazada al footer
  const listRef = useRef<HTMLDivElement>(null);
  const focusList = useRef(false);
  useEffect(() => {
    if (mode === null && focusList.current) {
      focusList.current = false;
      listRef.current?.focus();
    }
  }, [mode, notice]);
  const backToList = (msg: string | null) => {
    focusList.current = true;
    setMode(null);
    setNotice(msg);
  };

  if (mode) {
    return (
      <AddressForm
        key={mode}
        address={editing}
        isFirst={addresses.length === 0}
        onCancel={addresses.length > 0 ? () => backToList(null) : undefined}
        onSaved={(ok) => backToList(ok === "updated" ? "Guardamos los cambios." : "Agregamos la dirección.")}
      />
    );
  }

  return (
    <div ref={listRef} tabIndex={-1} className="flex scroll-mt-28 flex-col gap-4 outline-none">
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {addresses.length === 0 && <p className="text-[15px] text-muted">No tienes direcciones guardadas.</p>}
      <ul className="grid grid-cols-1 gap-3 empty:hidden md:grid-cols-2">
        {addresses.map((a) => (
          <AddressCard key={a.id} address={a} onEdit={() => setMode(a.id)} onNotice={backToList} />
        ))}
      </ul>
      {addresses.length < MAX ? (
        <Button variant="secondary" icon={<Plus aria-hidden className="size-4" />} onClick={() => setMode("new")} className="self-start">
          Agregar dirección
        </Button>
      ) : (
        <p className="text-sm text-muted">Llegaste al máximo de {MAX} direcciones. Elimina una para agregar otra.</p>
      )}
    </div>
  );
}

function AddressCard({
  address: a,
  onEdit,
  onNotice,
}: {
  address: Address;
  onEdit: () => void;
  onNotice: (msg: string | null) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<FormState>, okMsg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else onNotice(okMsg);
    });

  return (
    <li className="flex flex-col gap-3 rounded-lg bg-surface p-5 text-[15px]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold">{a.alias}</h2>
        {a.es_principal && <Badge variant="nuevo">Principal</Badge>}
      </div>
      <address className="flex flex-col gap-0.5 not-italic">
        <span className="font-semibold">{a.destinatario}</span>
        <span className="break-words">
          {a.direccion}
          {a.complemento ? `, ${a.complemento}` : ""}
        </span>
        <span>
          {a.ciudad}, {a.departamento}
        </span>
        <span className="text-muted">{formatPhone(a.telefono)}</span>
      </address>
      {error && <FormAlert>{error}</FormAlert>}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {confirming ? (
          <div role="group" aria-label={`Confirmar eliminar ${a.alias}`} className="flex flex-wrap items-center gap-2">
            <span className="text-sm">¿Eliminar esta dirección?</span>
            <Button size="sm" variant="danger" loading={pending} onClick={() => run(() => deleteAddress(a.id), "Eliminamos la dirección.")}>
              Sí, eliminar
            </Button>
            {/* El botón "Eliminar" desaparece al confirmar: el foco pasa a la opción segura */}
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={pending} autoFocus>
              Cancelar
            </Button>
          </div>
        ) : (
          <>
            <TextButton onClick={onEdit}>Editar</TextButton>
            {!a.es_principal && (
              <TextButton disabled={pending} onClick={() => run(() => setMainAddress(a.id), `«${a.alias}» es ahora tu dirección principal.`)}>
                Usar como principal
              </TextButton>
            )}
            <TextButton onClick={() => setConfirming(true)} className="text-muted hover:text-danger">
              Eliminar
            </TextButton>
          </>
        )}
      </div>
    </li>
  );
}

function TextButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`h-11 text-sm font-semibold text-accent transition-colors disabled:opacity-50 ${className ?? ""}`}
      {...props}
    />
  );
}

function AddressForm({
  address,
  isFirst,
  onCancel,
  onSaved,
}: {
  address?: Address;
  isFirst: boolean;
  onCancel?: () => void;
  onSaved: (ok: string) => void;
}) {
  const { state, pending, formProps } = useFormAction(saveAddress);
  const [departamento, setDepartamento] = useState(address?.departamento ?? "");
  const ciudades = departamentos.find((d) => d.nombre === departamento)?.ciudades ?? [];
  const e = state.fieldErrors ?? {};
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Al abrir el formulario, el foco va a su título (lector de pantalla y teclado saben dónde están)
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Guardado: vuelve a la lista (la página se recarga desde el servidor con revalidatePath)
  const handled = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && handled.current !== state) {
      handled.current = state;
      onSaved(state.ok);
    }
  }, [state, onSaved]);

  return (
    <section aria-labelledby="dir-form" className="rounded-lg bg-surface p-5 sm:p-6">
      <h2 id="dir-form" ref={titleRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        {address ? `Editar «${address.alias}»` : "Nueva dirección"}
      </h2>
      <form {...formProps} noValidate className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {address && <input type="hidden" name="id" value={address.id} />}
        <Input
          name="alias"
          label="Nombre de la dirección"
          hint="Por ejemplo Casa, Oficina o Donde mi mamá."
          defaultValue={address?.alias ?? (isFirst ? "Casa" : "")}
          maxLength={40}
          required
          error={e.alias}
        />
        <Input
          name="destinatario"
          label="Quién recibe"
          autoComplete="name"
          defaultValue={address?.destinatario}
          maxLength={120}
          required
          error={e.destinatario}
        />
        <Input
          name="telefono"
          type="tel"
          label="Celular de quien recibe"
          autoComplete="tel-national"
          inputMode="tel"
          defaultValue={address?.telefono}
          required
          error={e.telefono}
        />
        <Select
          name="departamento"
          label="Departamento"
          placeholder="Elige el departamento"
          options={departamentos.map((d) => ({ value: d.nombre, label: d.nombre }))}
          value={departamento}
          onChange={(ev) => setDepartamento(ev.target.value)}
          required
          error={e.departamento}
        />
        <Input
          name="ciudad"
          label="Ciudad o municipio"
          autoComplete="address-level2"
          list="ciudades-sugeridas"
          defaultValue={address?.ciudad}
          maxLength={80}
          required
          error={e.ciudad}
        />
        <datalist id="ciudades-sugeridas">
          {ciudades.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input
          name="direccion"
          label="Dirección"
          autoComplete="address-line1"
          placeholder="Calle 10 # 20-30"
          defaultValue={address?.direccion}
          maxLength={160}
          required
          error={e.direccion}
        />
        <Input
          name="complemento"
          label="Apartamento, torre o barrio"
          autoComplete="address-line2"
          hint="Opcional, pero ayuda a que el envío llegue sin vueltas."
          defaultValue={address?.complemento ?? ""}
          maxLength={160}
          error={e.complemento}
          wrapperClassName="sm:col-span-2"
        />
        {!isFirst && (
          <label className="flex cursor-pointer items-center gap-3 text-[15px] sm:col-span-2">
            <input
              type="checkbox"
              name="es_principal"
              defaultChecked={address?.es_principal}
              disabled={address?.es_principal}
              className="size-5 accent-[var(--color-primary)]"
            />
            {address?.es_principal ? "Es tu dirección principal" : "Usar como dirección principal"}
          </label>
        )}
        {address?.es_principal && <input type="hidden" name="es_principal" value="on" />}
        <div className="flex flex-col gap-4 sm:col-span-2">
          {state.error && <FormAlert>{state.error}</FormAlert>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              {address ? "Guardar cambios" : "Guardar dirección"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
