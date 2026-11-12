"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";

export type HeroSlide = {
  id: string;
  /** Texto corto para el control de la diapositiva */
  label: string;
  /** Nombre accesible de la diapositiva */
  title: string;
  /** Fondo de la diapositiva: superficie oscura o campo verde */
  tone: "dark" | "primary";
  content: ReactNode;
};

const AUTOPLAY_MS = 6000;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hero en carrusel (Embla): 500 ms de transición, autoplay de 6 s que se pausa con hover y foco,
 * botón de pausa visible (WCAG 2.2.2) y sin autoplay si el usuario pidió menos movimiento.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [autoplay] = useState(() =>
    Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true, playOnInit: false }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 }, [autoplay]);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // Cambia en cada nueva diapositiva o reanudación: reinicia la barra de progreso
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // Sin API o sin diapositivas montadas, el plugin no tiene a qué aplicar autoplay
    if (!emblaApi || emblaApi.slideNodes().length === 0) return;
    // Con 1 sola posición, Embla Autoplay no inicializa su `delay` y play() lanza
    // "Cannot read properties of undefined (reading '0')": no hay nada que rotar.
    if (emblaApi.scrollSnapList().length <= 1) return;
    // Se usa la instancia viva que registró Embla (en Strict Mode el carrusel se destruye y se vuelve a crear)
    const autoplayPlugin = emblaApi.plugins().autoplay;
    const onSelect = () => {
      setSelected(emblaApi.selectedScrollSnap());
      setCycle((c) => c + 1);
    };
    const onPlay = () => {
      setPlaying(true);
      setCycle((c) => c + 1);
    };
    const onStop = () => setPlaying(false);
    emblaApi.on("select", onSelect);
    emblaApi.on("autoplay:play", onPlay);
    emblaApi.on("autoplay:stop", onStop);
    if (!prefersReducedMotion()) autoplayPlugin?.play();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("autoplay:play", onPlay);
      emblaApi.off("autoplay:stop", onStop);
      // Evita temporizadores colgados cuando el efecto se limpia (Strict Mode, cambio de slides)
      autoplayPlugin?.stop();
    };
  }, [emblaApi]);

  // Con stopOnMouseEnter, Embla reanuda al salir del mouse; si el usuario pausó, se respeta
  useEffect(() => {
    if (userPaused && playing) emblaApi?.plugins().autoplay?.stop();
  }, [userPaused, playing, emblaApi]);

  const goTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  function togglePlay() {
    const autoplayPlugin = emblaApi?.plugins().autoplay;
    if (playing) {
      setUserPaused(true);
      autoplayPlugin?.stop();
    } else {
      setUserPaused(false);
      autoplayPlugin?.play();
    }
  }

  return (
    <section aria-roledescription="carrusel" aria-label="Destacados de VOLTA" className="container-page pt-4 md:pt-6">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${slides.length}: ${slide.title}`}
              aria-hidden={i !== selected}
              inert={i !== selected}
              className={cn(
                "min-w-0 shrink-0 grow-0 basis-full",
                slide.tone === "primary" ? "bg-primary text-on-primary" : "bg-surface text-text",
              )}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* Controles */}
      <div className="mt-3 flex items-stretch gap-2">
        <button
          type="button"
          onClick={prev}
          aria-label="Diapositiva anterior"
          className="hidden size-12 shrink-0 place-items-center rounded-sm bg-surface text-text transition-colors hover:bg-surface-2 sm:grid"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <ol className="grid flex-1 grid-cols-3 gap-2">
          {slides.map((slide, i) => {
            const active = i === selected;
            return (
              <li key={slide.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative flex h-12 w-full items-center overflow-hidden rounded-sm px-3 text-left text-sm font-semibold transition-colors sm:px-4",
                    active ? "bg-surface-2 text-text" : "bg-surface text-muted hover:text-text",
                  )}
                >
                  <span className="truncate">
                    <span className="sr-only">Diapositiva {i + 1}: </span>
                    {slide.label}
                  </span>
                  {active && (
                    <span
                      key={cycle}
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
                      style={{
                        animation: `hero-progress ${AUTOPLAY_MS}ms linear forwards`,
                        animationPlayState: playing ? "running" : "paused",
                        transform: playing ? undefined : "scaleX(0)",
                      }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={next}
          aria-label="Diapositiva siguiente"
          className="hidden size-12 shrink-0 place-items-center rounded-sm bg-surface text-text transition-colors hover:bg-surface-2 sm:grid"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar el carrusel" : "Reproducir el carrusel"}
          className="grid size-12 shrink-0 place-items-center rounded-sm bg-surface text-text transition-colors hover:bg-surface-2"
        >
          {playing ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}
        </button>
      </div>
    </section>
  );
}
