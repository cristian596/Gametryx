import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon
      title="Iniciar sesión"
      description="Entra para ver tus pedidos, tus favoritos y tus direcciones de envío."
    />
  );
}
