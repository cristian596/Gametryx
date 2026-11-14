import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/account/AuthShell";
import { FormAlert } from "@/components/account/FormAlert";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

type Props = PageProps<"/iniciar-sesion">;

export default function SignInPage({ searchParams }: Props) {
  return (
    <AuthShell title="Iniciar sesión" intro="Entra para ver tus pedidos, tus favoritos y tus direcciones de envío.">
      <Suspense fallback={<SignInForm />}>
        <SignInWithParams searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function SignInWithParams({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "", "/");
  return (
    <div className="flex flex-col gap-5">
      {sp.error === "enlace" && (
        <FormAlert>
          Ese enlace venció o ya se usó. Si estabas confirmando tu correo, intenta iniciar sesión; si querías recuperar tu
          contraseña, pide un código nuevo.
        </FormAlert>
      )}
      {sp.error === "navegador" && (
        <FormAlert>
          Ese enlace ya no sirve. Entra a «¿Olvidaste tu contraseña?» y pide un código: lo escribes aquí mismo, sin abrir
          enlaces.
        </FormAlert>
      )}
      {sp.aviso === "confirmado" && <FormAlert tone="success">Tu correo quedó confirmado. Ya puedes iniciar sesión.</FormAlert>}
      <SignInForm next={next || undefined} />
    </div>
  );
}
