import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Política de cookies" };

export default function Page() {
  return (
    <ComingSoon
      title="Política de cookies"
      description="Qué cookies usamos y cómo cambiar tu elección. Pendiente de revisión legal."
    />
  );
}
