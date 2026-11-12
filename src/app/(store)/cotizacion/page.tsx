import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Cotiza tu PC" };

export default function Page() {
  return (
    <ComingSoon
      title="Cotiza tu PC"
      description="Cuéntanos qué quieres jugar y tu presupuesto. Te enviamos una cotización sin compromiso."
    />
  );
}
