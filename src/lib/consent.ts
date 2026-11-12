/** Preferencias de cookies guardadas en el navegador del visitante. */
export type CookieConsent = {
  version: 1;
  necesarias: true;
  analitica: boolean;
  marketing: boolean;
  fecha: string;
};

export const CONSENT_KEY = "volta-cookie-consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "volta:open-cookie-settings";
export const CONSENT_CHANGED_EVENT = "volta:consent-changed";

export function readConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analitica: boolean; marketing: boolean }) {
  const value: CookieConsent = {
    version: 1,
    necesarias: true,
    analitica: choice.analitica,
    marketing: choice.marketing,
    fecha: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    // Almacenamiento bloqueado: la elección vale solo para esta visita
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
  return value;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
