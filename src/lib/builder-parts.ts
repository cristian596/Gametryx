import { catalog } from "@/lib/catalog";
import { slotFromComponente, type BuildPart } from "@/lib/compat";

/** Componentes del catálogo que el armador puede usar, con su hueco y sus atributos de compatibilidad. */
export async function getBuilderParts(): Promise<BuildPart[]> {
  const componentes = await catalog.getProducts({ categoria: "pc-gaming", subcategoria: "componentes", orden: "precio-asc" });
  return componentes.flatMap((p) => {
    const slot = slotFromComponente(p.specs.componente);
    if (!slot) return [];
    return [
      {
        id: p.id,
        slug: p.slug,
        nombre: p.nombre,
        precio: p.precioCop,
        stock: p.stock,
        slot,
        compat: p.compat ?? {},
        imagen: p.imagenes[0]?.url,
      },
    ];
  });
}
