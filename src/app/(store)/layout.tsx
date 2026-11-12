import { StoreShell } from "@/components/layout/StoreShell";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreShell>{children}</StoreShell>;
}
