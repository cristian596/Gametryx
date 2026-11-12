/** Glifos simplificados dibujados para VOLTA (24×24, color actual). */
type IconProps = { className?: string };

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.2 2.5c.35 2.45 1.85 4.1 4.3 4.35v3.25a7.6 7.6 0 0 1-4.25-1.3v6.55a5.85 5.85 0 1 1-5.85-5.85c.3 0 .6.02.9.07v3.3a2.6 2.6 0 1 0 1.7 2.45V2.5h3.2Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KickIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M3 3h6v5h2V5.5h2.5V3H20v6.5h-2.5V12H20v9h-6.5v-2.5H11V16H9v5H3V3Z" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2.8a9.2 9.2 0 0 0-7.95 13.8L2.8 21.2l4.75-1.22A9.2 9.2 0 1 0 12 2.8Z" />
      <path
        d="M8.6 7.6c.25-.3.6-.3.85-.05l1.05 1.6c.18.3.12.62-.12.88l-.5.52c.55 1.25 1.4 2.12 2.65 2.68l.55-.5c.26-.24.6-.3.9-.1l1.55 1.03c.27.24.25.6-.05.86l-.7.65c-.5.45-1.25.6-1.9.36-2.55-.95-4.4-2.8-5.35-5.35-.25-.66-.08-1.4.38-1.9l.69-.68Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
