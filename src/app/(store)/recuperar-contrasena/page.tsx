import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/account/AuthShell";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      intro="Escribe el correo de tu cuenta y te enviamos un código para crear una contraseña nueva."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
