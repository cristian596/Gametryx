import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { site } from "@/config/site";
import { formatCOP } from "@/lib/format";
import { AccountLink } from "./AccountLink";
import { CartButton } from "./CartButton";
import { MobileNav } from "./MobileNav";
import { DesktopNavLinks } from "./NavLinks";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-bg">
      <p className="bg-surface py-2 text-center text-[13px] text-muted">
        Envío gratis a toda Colombia desde{" "}
        <span className="price font-medium text-text">{formatCOP(site.shipping.freeFrom)}</span>
      </p>
      <nav aria-label="Principal" className="container-page flex h-16 items-center gap-4 lg:h-18">
        <Link href="/" aria-label="VOLTA, ir al inicio" className="-ml-1 rounded-sm p-1">
          <Logo />
        </Link>
        <div className="flex-1 lg:flex lg:justify-center">
          <DesktopNavLinks />
        </div>
        <div className="flex items-center gap-1">
          <AccountLink />
          <CartButton />
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
