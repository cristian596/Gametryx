"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Fila horizontal con scroll-snap nativo (sin librería): se desliza con el dedo en celular
 * y con botones en escritorio. Los botones se desactivan en los extremos.
 */
export function Rail({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function scrollByPage(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  }

  const btn =
    "grid size-11 place-items-center rounded-sm bg-surface text-text transition-colors hover:bg-surface-2 disabled:opacity-35 disabled:hover:bg-surface";

  return (
    <div>
      <ul
        ref={ref}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {children}
      </ul>
      <div className="mt-4 hidden justify-end gap-2 md:flex">
        <button type="button" className={btn} onClick={() => scrollByPage(-1)} disabled={edges.start} aria-label="Ver anteriores">
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button type="button" className={btn} onClick={() => scrollByPage(1)} disabled={edges.end} aria-label="Ver siguientes">
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}

export function RailItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li className={cn("flex w-[72%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[calc((100%-3rem)/4)]", className)}>
      {children}
    </li>
  );
}
