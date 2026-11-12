import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon
      title="Crear cuenta"
      description="Crea tu cuenta para guardar favoritos y seguir tus pedidos."
    />
  );
}
