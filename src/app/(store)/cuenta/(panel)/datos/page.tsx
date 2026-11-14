import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountHeading } from "@/components/account/AccountHeading";
import { EmailForm, PasswordForm, ProfileForm } from "@/components/account/AccountForms";
import { FormAlert } from "@/components/account/FormAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Mis datos" };

type Props = PageProps<"/cuenta/datos">;

const NOTICES: Record<string, string> = {
  clave: "Listo: actualizamos tu contraseña.",
  correo: "Confirmamos el cambio de correo.",
};

export default function DataPage({ searchParams }: Props) {
  return (
    <>
      <AccountHeading title="Mis datos" />
      <Suspense fallback={<Skeleton className="h-[560px] w-full rounded-lg" />}>
        <DataForms searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DataForms({ searchParams }: { searchParams: Props["searchParams"] }) {
  const [{ supabase, user }, sp] = await Promise.all([requireUser("/cuenta/datos"), searchParams]);
  const { data: profile } = await supabase.from("profiles").select("nombre, telefono").eq("id", user.id).maybeSingle();
  const notice = typeof sp.aviso === "string" ? NOTICES[sp.aviso] : undefined;

  return (
    <div className="flex flex-col gap-4">
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      <ProfileForm nombre={(profile?.nombre as string | null) ?? ""} telefono={(profile?.telefono as string | null) ?? ""} />
      <EmailForm email={user.email ?? ""} />
      <PasswordForm />
    </div>
  );
}
