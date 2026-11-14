import type { Metadata } from "next";
import { SignUpForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/account/AuthShell";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta en VOLTA para guardar favoritos, tus direcciones y seguir tus pedidos.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <AuthShell title="Crear cuenta" intro="Guarda tus favoritos y tus direcciones, y sigue cada pedido hasta tu puerta.">
      <SignUpForm />
    </AuthShell>
  );
}
