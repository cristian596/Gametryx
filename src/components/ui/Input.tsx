import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full h-12 rounded-sm bg-surface-2 px-3.5 text-base text-text placeholder:text-muted/70 " +
  "transition-colors duration-(--duration-fast) hover:bg-surface-3 " +
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-invalid:outline-2 aria-invalid:outline-offset-0 aria-invalid:outline-danger";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldShell({ id, label, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {label}
        {required && <span className="text-muted font-normal"> (obligatorio)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  id?: string;
  wrapperClassName?: string;
};

export function Input({ label, hint, error, icon, id, className, wrapperClassName, required, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative">
        {icon && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldBase, icon && "pl-10", className)}
          {...props}
        />
      </div>
    </FieldShell>
  );
}

type TextareaProps = Omit<ComponentProps<"textarea">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  wrapperClassName?: string;
};

export function Textarea({ label, hint, error, id, className, wrapperClassName, required, ...props }: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <textarea
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(fieldBase, "h-auto min-h-28 py-3 leading-relaxed", className)}
        {...props}
      />
    </FieldShell>
  );
}

export { fieldBase };
