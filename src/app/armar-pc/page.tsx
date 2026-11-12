import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Arma tu PC gamer" };

export default function Page() {
  return (
    <ComingSoon
      title="Arma tu PC gamer"
      description="Elige procesador, board, memoria, gráfica y gabinete. Te avisamos si algo no es compatible."
    />
  );
}
