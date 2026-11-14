import type { Metadata } from "next";

/** Todo lo de /cuenta es privado: fuera de los buscadores (el proxy además envía X-Robots-Tag). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountRootLayout({ children }: LayoutProps<"/cuenta">) {
  return children;
}
