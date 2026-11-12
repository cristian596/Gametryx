import type { ReactNode } from "react";
import { CookieBanner } from "./CookieBanner";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { WhatsAppButton } from "./WhatsAppButton";

/** Marco de la tienda: navbar, contenido, footer, WhatsApp y aviso de cookies. */
export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </>
  );
}
