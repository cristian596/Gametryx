import { Suspense } from "react";
import { AccountNav } from "@/components/account/AccountNav";

export default function AccountPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page grid grid-cols-1 gap-6 pt-6 pb-24 md:pt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <div className="lg:pt-2">
        <Suspense fallback={<AccountNav static />}>
          <AccountNav />
        </Suspense>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
