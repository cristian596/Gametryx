import { useId, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { FieldShell, fieldBase } from "./Input";

type SelectProps = Omit<ComponentProps<"select">, "id"> & {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  error?: string;
  id?: string;
  wrapperClassName?: string;
};

export function Select({
  label,
  options,
  placeholder,
  hint,
  error,
  id,
  className,
  wrapperClassName,
  required,
  ...props
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FieldShell id={selectId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          className={cn(fieldBase, "appearance-none pr-10", className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}
