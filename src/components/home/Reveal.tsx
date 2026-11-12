"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Aparición al entrar en pantalla: fade + 12 px, una sola vez.
 * El contenido solo se oculta si el script está activo (clase .js en <html>), así nunca queda invisible sin JS.
 * Los hijos con [data-reveal-item] entran escalonados (70 ms).
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((item, i) => {
      item.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 70}ms`);
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // @ts-expect-error — ref polimórfico entre div/ul/ol
    <Tag ref={ref} data-reveal="" className={className}>
      {children}
    </Tag>
  );
}
