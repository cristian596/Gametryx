export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
};

export const mainNav: NavItem[] = [
  { label: "Inicio", href: "/" },
  {
    label: "PC Gaming",
    href: "/pc-gaming",
    children: [
      { label: "PC armados", href: "/pc-gaming?tipo=pc-armados", description: "Listos para jugar" },
      { label: "Componentes", href: "/pc-gaming?tipo=componentes", description: "Procesadores, tarjetas gráficas y más" },
      { label: "Arma tu PC", href: "/armar-pc", description: "Elige pieza por pieza" },
    ],
  },
  {
    label: "Gameroom",
    href: "/gameroom",
    children: [
      { label: "Sillas gamer", href: "/gameroom?tipo=sillas" },
      { label: "Escritorios", href: "/gameroom?tipo=escritorios" },
      { label: "Luces y ambientación", href: "/gameroom?tipo=iluminacion" },
    ],
  },
  { label: "Monitores", href: "/monitores" },
  { label: "Periféricos", href: "/perifericos" },
  { label: "Contáctenos", href: "/contacto" },
];

export const supportLinks = [
  { label: "Cotiza tu PC", href: "/cotizacion" },
  { label: "Arma tu PC", href: "/armar-pc" },
  { label: "Envíos y entregas", href: "/terminos#envios" },
  { label: "Garantías", href: "/terminos#garantias" },
  { label: "Derecho de retracto", href: "/terminos#retracto" },
];

export const legalLinks = [
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Tratamiento de datos", href: "/privacidad" },
  { label: "Política de cookies", href: "/cookies" },
];
