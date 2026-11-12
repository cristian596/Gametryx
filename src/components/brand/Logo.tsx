import { cn } from "@/lib/cn";

/** Ícono del rayo (mismo trazo que public/brand/volta-icon.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
      <path d="M37 7 L14 37 H29 L25 57 L50 26 H35 Z" fill="var(--color-on-primary)" />
    </svg>
  );
}

/** Marca completa: rayo + "VOLTA" con la tipografía del sitio. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("size-8", markClassName)} />
      <span className="font-display text-[22px] leading-none font-bold tracking-[0.12em]">
        VOLT<span className="text-primary">A</span>
      </span>
    </span>
  );
}
