import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Tu carrito", robots: { index: false } };

export default function Page() {
  return (
    <ComingSoon
      title="Tu carrito"
      description="Aquí verás los productos que agregaste y cuánto te falta para el envío gratis."
    />
  );
}
