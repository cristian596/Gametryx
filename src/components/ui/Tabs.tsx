"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string; content: ReactNode };

/** Pestañas accesibles (patrón WAI-ARIA): flechas, Inicio y Fin para moverse. */
export function Tabs({ tabs, defaultTab, className }: { tabs: Tab[]; defaultTab?: string; className?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-sm bg-surface p-1">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "h-11 shrink-0 rounded-sm px-4 text-sm font-semibold transition-colors duration-(--duration-fast)",
                selected ? "bg-surface-3 text-text" : "text-muted hover:text-text",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-5 focus-visible:outline-offset-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
