import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/** Sección del home: un h2 que la nombra, una frase opcional y un enlace "ver todo". */
export function Section({
  id,
  title,
  intro,
  link,
  children,
  className,
  headerClassName,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  link?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("py-16 md:py-24", className)}>
      <div className="container-page">
        <Reveal className={cn("mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between", headerClassName)}>
          <div className="max-w-2xl">
            <h2 id={`${id}-title`} className="text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[44px]">
              {title}
            </h2>
            {intro && <div className="mt-3 text-base leading-relaxed md:text-lg">{intro}</div>}
          </div>
          {link && (
            <Link
              href={link.href}
              className="group inline-flex h-11 shrink-0 items-center gap-2 self-start font-semibold text-accent md:self-end"
            >
              {link.label}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-1"
              />
            </Link>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
