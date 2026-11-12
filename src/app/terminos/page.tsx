import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function Page() {
  return (
    <ComingSoon
      title="Términos y condiciones"
      description="Condiciones de compra, envíos, garantías y derecho de retracto. Pendiente de revisión legal."
    />
  );
}
