import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Política de tratamiento de datos" };

export default function Page() {
  return (
    <ComingSoon
      title="Política de tratamiento de datos"
      description="Cómo tratamos tus datos personales según la Ley 1581 de 2012. Pendiente de revisión legal."
    />
  );
}
