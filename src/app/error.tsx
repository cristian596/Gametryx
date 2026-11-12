"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { whatsappUrl } from "@/config/site";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-1 flex-col justify-center py-20 md:py-32">
      <h1 className="text-[32px] leading-tight font-bold md:text-[56px]">Algo falló al cargar esta página</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed">
        Fue un error nuestro, no tuyo. Intenta de nuevo; si sigue pasando, escríbenos y te ayudamos con tu compra.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Intentar de nuevo</Button>
        <LinkButton
          href={whatsappUrl("Hola, una página de VOLTA me mostró un error.")}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
        >
          Hablar con un asesor
        </LinkButton>
      </div>
    </div>
  );
}
