import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Ingreso al panel", robots: { index: false, follow: false } };

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/ingresar">) {
  return (
    <main id="contenido" className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-[28px] font-bold">Panel de administración</h1>
        <p className="mt-2 text-muted">Solo para el equipo de VOLTA.</p>
        <div className="mt-8 rounded-lg bg-surface p-6">
          <Suspense fallback={<LoginForm />}>
            <LoginWithNext searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/admin/ingresar">["searchParams"] }) {
  const sp = await searchParams;
  return <LoginForm next={typeof sp.next === "string" ? sp.next : undefined} />;
}
