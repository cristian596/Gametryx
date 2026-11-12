import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/** inverse / inverse-ghost: para usar sobre campos verdes (bg-primary). */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse" | "inverse-ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-sm font-semibold whitespace-nowrap " +
  "transition-[background-color,color,transform] duration-(--duration-fast) ease-(--ease-out-quart) " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-press",
  secondary: "bg-surface-2 text-text hover:bg-surface-3",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  danger: "bg-danger text-on-primary hover:brightness-110",
  inverse: "bg-on-primary text-primary hover:bg-surface active:bg-surface-2",
  "inverse-ghost": "bg-transparent text-on-primary hover:bg-on-primary/10 active:bg-on-primary/15",
};

const sizes: Record<ButtonSize, string> = {
  // sm queda en 40 px de alto con área táctil ampliada a 44 px
  sm: "h-10 px-3.5 text-sm relative after:absolute after:-inset-y-0.5 after:inset-x-0",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant,
  size,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function LinkButton({ variant, size, icon, className, children, ...props }: LinkButtonProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
