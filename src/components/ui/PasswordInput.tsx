"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";

type Props = Omit<ComponentProps<typeof Input>, "type">;

/** Campo de contraseña con botón para mostrarla (evita errores al escribir en el celular). */
export function PasswordInput({ className, wrapperClassName, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={wrapperClassName ? `relative ${wrapperClassName}` : "relative"}>
      <Input {...props} type={visible ? "text" : "password"} className={className ? `${className} pr-14` : "pr-14"} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute top-[28px] right-1 grid size-11 place-items-center rounded-sm text-muted transition-colors hover:text-text"
      >
        {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  );
}
