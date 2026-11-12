import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Contáctenos" };

export default function Page() {
  return (
    <ComingSoon
      title="Contáctenos"
      description="Escríbenos por WhatsApp o correo. Te responde una persona del equipo."
    />
  );
}
