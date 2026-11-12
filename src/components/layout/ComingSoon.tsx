import { LinkButton } from "@/components/ui/Button";
import { whatsappUrl } from "@/config/site";
import { PageIntro } from "./PageIntro";

/** Página que existe en la navegación pero se construye en una fase posterior. */
export function ComingSoon({
  title,
  description,
  whatsappMessage,
}: {
  title: string;
  description: string;
  whatsappMessage?: string;
}) {
  return (
    <>
      <PageIntro title={title}>
        <p>{description}</p>
      </PageIntro>
      <div className="container-page pb-24">
        <div className="flex flex-col gap-4 rounded-lg bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <p className="max-w-xl text-base leading-relaxed">
            Estamos terminando esta sección. Mientras tanto, un asesor te ayuda por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={whatsappUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer">
              Hablar con un asesor
            </LinkButton>
            <LinkButton href="/" variant="secondary">
              Volver al inicio
            </LinkButton>
          </div>
        </div>
      </div>
    </>
  );
}
