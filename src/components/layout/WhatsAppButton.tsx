import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { whatsappUrl } from "@/config/site";

/**
 * Botón flotante de WhatsApp.
 * Salto: 3 rebotes cada 6 s (keyframes wa-bounce en globals.css), se pausa con hover o foco
 * y se desactiva con prefers-reduced-motion.
 */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)"
      className="wa-float group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 sm:right-6 sm:bottom-6"
    >
      <span className="flex size-14 animate-wa-bounce items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-(--duration-fast) group-hover:[animation-play-state:paused] group-hover:bg-primary-hover group-focus-visible:[animation-play-state:paused] group-active:scale-95">
        <WhatsAppIcon className="size-7" />
      </span>
    </a>
  );
}
