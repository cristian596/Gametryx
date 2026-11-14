import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/account/AuthShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Contraseña nueva" };

/** Llega aquí desde el enlace de recuperación: /auth/confirm ya inició la sesión. */
export default function NewPasswordPage() {
  return (
    <AuthShell title="Contraseña nueva" intro="Elige una contraseña que no uses en otros sitios.">
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-md" />}>
        <Guarded />
      </Suspense>
    </AuthShell>
  );
}

async function Guarded() {
  await requireUser("/cuenta/nueva-contrasena");
  return <NewPasswordForm />;
}
