/**
 * Departamentos de Colombia (32 + Bogotá D.C.) con sugerencias de ciudades principales.
 * La ciudad es un campo libre: las sugerencias solo ayudan a escribir (no es la lista completa de municipios).
 * Para la lista oficial completa, ver DIVIPOLA del DANE.
 */
export type Departamento = { nombre: string; ciudades: string[] };

export const departamentos: Departamento[] = [
  { nombre: "Amazonas", ciudades: ["Leticia"] },
  { nombre: "Antioquia", ciudades: ["Medellín", "Bello", "Envigado", "Itagüí", "Sabaneta", "Rionegro", "Apartadó"] },
  { nombre: "Arauca", ciudades: ["Arauca"] },
  { nombre: "Atlántico", ciudades: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia"] },
  { nombre: "Bogotá D.C.", ciudades: ["Bogotá"] },
  { nombre: "Bolívar", ciudades: ["Cartagena de Indias", "Magangué", "Turbaco"] },
  { nombre: "Boyacá", ciudades: ["Tunja", "Duitama", "Sogamoso"] },
  { nombre: "Caldas", ciudades: ["Manizales", "Villamaría"] },
  { nombre: "Caquetá", ciudades: ["Florencia"] },
  { nombre: "Casanare", ciudades: ["Yopal"] },
  { nombre: "Cauca", ciudades: ["Popayán"] },
  { nombre: "Cesar", ciudades: ["Valledupar"] },
  { nombre: "Chocó", ciudades: ["Quibdó"] },
  { nombre: "Córdoba", ciudades: ["Montería"] },
  {
    nombre: "Cundinamarca",
    ciudades: ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá", "Girardot", "Mosquera", "Madrid", "Funza", "Cajicá"],
  },
  { nombre: "Guainía", ciudades: ["Inírida"] },
  { nombre: "Guaviare", ciudades: ["San José del Guaviare"] },
  { nombre: "Huila", ciudades: ["Neiva", "Pitalito"] },
  { nombre: "La Guajira", ciudades: ["Riohacha", "Maicao"] },
  { nombre: "Magdalena", ciudades: ["Santa Marta"] },
  { nombre: "Meta", ciudades: ["Villavicencio"] },
  { nombre: "Nariño", ciudades: ["Pasto", "Ipiales", "Tumaco"] },
  { nombre: "Norte de Santander", ciudades: ["Cúcuta", "Ocaña"] },
  { nombre: "Putumayo", ciudades: ["Mocoa"] },
  { nombre: "Quindío", ciudades: ["Armenia"] },
  { nombre: "Risaralda", ciudades: ["Pereira", "Dosquebradas"] },
  { nombre: "San Andrés y Providencia", ciudades: ["San Andrés"] },
  { nombre: "Santander", ciudades: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"] },
  { nombre: "Sucre", ciudades: ["Sincelejo"] },
  { nombre: "Tolima", ciudades: ["Ibagué"] },
  { nombre: "Valle del Cauca", ciudades: ["Cali", "Palmira", "Buenaventura", "Tuluá", "Jamundí", "Yumbo", "Cartago", "Buga"] },
  { nombre: "Vaupés", ciudades: ["Mitú"] },
  { nombre: "Vichada", ciudades: ["Puerto Carreño"] },
];
