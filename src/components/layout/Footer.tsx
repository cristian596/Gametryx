import { cacheLife } from "next/cache";
import Link from "next/link";

import { InstagramIcon, KickIcon, TikTokIcon, WhatsAppIcon } from "@/components/brand/SocialIcons";
import { legalLinks, mainNav, supportLinks } from "@/config/navigation";
import { site, whatsappUrl } from "@/config/site";
import { CookieSettingsButton } from "./CookieSettingsButton";

const linkClass =
  "inline-flex min-h-11 items-center text-[15px] text-muted transition-colors hover:text-text md:min-h-9";

const socials = [
  { label: "TikTok", href: site.social.tiktok, Icon: TikTokIcon },
  { label: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
  { label: "Kick", href: site.social.kick, Icon: KickIcon },
];

/** El año se calcula una vez y se guarda en caché por días (Cache Components no permite `new Date()` sin caché). */
async function getYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await getYear();

  return (
    <footer className="mt-auto bg-surface">
      <div className="container-page grid gap-12 pt-16 pb-10 md:grid-cols-12 md:pt-24">
        <section aria-labelledby="footer-soporte" className="md:col-span-5">
          <h2 id="footer-soporte" className="text-2xl font-semibold md:text-[28px]">
            ¿Dudas con tu compra o tu armado?
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text">
            Te asesora una persona, no un bot. {site.supportHours}.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 self-start rounded-sm bg-primary px-5 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              <WhatsAppIcon className="size-5" />
              Escríbenos al {site.whatsappDisplay}
            </a>
            <a href={`mailto:${site.email}`} className="self-start text-[15px] text-accent underline-offset-4 hover:underline">
              {site.email}
            </a>
          </div>
        </section>

        <nav aria-labelledby="footer-tienda" className="md:col-span-2 md:col-start-7">
          <h2 id="footer-tienda" className="text-base font-semibold">
            Tienda
          </h2>
          <ul className="mt-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-ayuda" className="md:col-span-2">
          <h2 id="footer-ayuda" className="text-base font-semibold">
            Soporte
          </h2>
          <ul className="mt-3">
            {supportLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal" className="md:col-span-2">
          <h2 id="footer-legal" className="text-base font-semibold">
            Legal
          </h2>
          <ul className="mt-3">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className={`${linkClass} cursor-pointer text-left`} />
            </li>
          </ul>
        </nav>
      </div>

      {/* Cierre: la marca vuelve a ancho completo */}
      <div className="container-page">
        <div className="flex flex-col gap-6 pb-8 md:flex-row md:items-end md:justify-between">
          {/* Decorativo y en SVG: es una imagen de marca, no texto que se deba leer */}
          <svg aria-hidden viewBox="0 0 1000 200" className="w-full select-none md:w-[72%]">
            <g transform="scale(3.125)">
              <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
              <path d="M37 7 L14 37 H29 L25 57 L50 26 H35 Z" fill="var(--color-on-primary)" />
            </g>
            <text
              x="240"
              y="178"
              textLength="755"
              lengthAdjust="spacingAndGlyphs"
              fontSize="232"
              fontWeight="700"
              fill="var(--color-surface-3)"
              style={{ fontFamily: "var(--font-chakra)" }}
            >
              VOLTA
            </text>
          </svg>
          <ul className="flex gap-2 md:pb-3" aria-label="Redes sociales">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`VOLTA en ${label}`}
                  className="grid size-12 place-items-center rounded-sm bg-surface-2 text-text transition-colors hover:bg-primary hover:text-on-primary"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-bg">
        <div className="container-page flex flex-col gap-2 py-5 text-sm text-muted md:flex-row md:justify-between">
          <p>
            © {year} {site.legal.businessName} · NIT {site.legal.nit}
          </p>
          <p>{site.legal.address}</p>
        </div>
      </div>
    </footer>
  );
}
