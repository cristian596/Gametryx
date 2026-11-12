/**
 * Genera supabase/seed.sql a partir del catálogo de ejemplo (src/data/catalog.mock.ts),
 * para que la base de datos y el respaldo sin BD tengan los mismos productos.
 *
 * Uso: npm run db:seed:generate   (Node 24 ejecuta TypeScript directamente)
 */
import { writeFileSync } from "node:fs";
import { categories } from "../src/data/categories.ts";
import { mockProducts } from "../src/data/catalog.mock.ts";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const out: string[] = [
  "-- ⚠️ DATOS DE EJEMPLO generados por scripts/generate-seed.mts. No editar a mano.",
  "-- Precios, stock y FPS no son reales. Reemplazar desde el panel admin (Fase 4).",
  "begin;",
  "",
  "-- Categorías",
];

categories.forEach((c, i) => {
  out.push(
    `insert into public.categories (slug, nombre, descripcion, orden) values (${q(c.slug)}, ${q(c.nombre)}, ${q(c.descripcion)}, ${i}) on conflict (slug) do nothing;`,
  );
  c.subcategorias.forEach((s, j) => {
    out.push(
      `insert into public.categories (slug, nombre, parent_id, orden) values (${q(s.slug)}, ${q(s.nombre)}, (select id from public.categories where slug = ${q(c.slug)}), ${j}) on conflict (slug) do nothing;`,
    );
  });
});

out.push("", "-- Marcas");
for (const marca of [...new Set(mockProducts.map((p) => p.marca))]) {
  out.push(`insert into public.brands (slug, nombre) values (${q(slugify(marca))}, ${q(marca)}) on conflict (slug) do nothing;`);
}

out.push("", "-- Productos");
for (const p of mockProducts) {
  const cat = categories.find((c) => c.slug === p.categoria)!;
  const catSlug = cat.subcategorias.some((s) => s.slug === p.subcategoria) ? p.subcategoria : cat.slug;
  out.push(
    `insert into public.products (slug, nombre, descripcion, categoria_id, marca_id, tipo, precio_cop, precio_anterior_cop, stock, specs, tags, es_nuevo, es_destacado, mas_vendido) values (` +
      [
        q(p.slug),
        q(p.nombre),
        q(p.descripcion),
        `(select id from public.categories where slug = ${q(catSlug)})`,
        `(select id from public.brands where slug = ${q(slugify(p.marca))})`,
        q(p.tipo),
        p.precioCop,
        p.precioAnteriorCop ?? "null",
        p.stock,
        `${q(JSON.stringify(p.specs))}::jsonb`,
        `array[${p.tags.map(q).join(", ")}]::text[]`,
        p.esNuevo,
        p.esDestacado,
        p.masVendido,
      ].join(", ") +
      `) on conflict (slug) do nothing;`,
  );
  const pid = `(select id from public.products where slug = ${q(p.slug)})`;
  // Idempotente: si el seed se ejecuta dos veces, las filas hijas no se duplican
  out.push(`delete from public.product_images where product_id = ${pid};`);
  out.push(`delete from public.pc_benchmarks where product_id = ${pid};`);
  p.imagenes.forEach((img, i) => {
    out.push(`insert into public.product_images (product_id, url, alt, orden) values (${pid}, ${q(img.url)}, ${q(img.alt)}, ${i});`);
  });
  p.fps?.forEach((f, i) => {
    out.push(
      `insert into public.pc_benchmarks (product_id, juego, resolucion, fps_estimado, orden) values (${pid}, ${q(f.juego)}, ${q(f.resolucion)}, ${f.fps}, ${i});`,
    );
  });

  // Atributos de compatibilidad derivados de las specs de los componentes
  const s = p.specs;
  const compat: Record<string, string> = {};
  if (typeof s.socket === "string") compat.socket = q(s.socket);
  if (typeof s.tipo_ram === "string") compat.tipo_ram = q(s.tipo_ram);
  if (typeof s.tdp_w === "number") compat.tdp_w = String(s.tdp_w);
  if (typeof s.potencia_w === "number") compat.potencia_w = String(s.potencia_w);
  if (typeof s.factor_forma === "string") compat.factor_forma = q(s.factor_forma);
  if (typeof s.largo_mm === "number") compat.largo_mm = String(s.largo_mm);
  if (typeof s.max_gpu_mm === "number") compat.max_gpu_mm = String(s.max_gpu_mm);
  if (typeof s.max_cooler_mm === "number") compat.max_cooler_mm = String(s.max_cooler_mm);
  if (typeof s.slots_ram === "number") compat.slots_ram = String(s.slots_ram);
  if (typeof s.m2_slots === "number") compat.m2_slots = String(s.m2_slots);
  if (typeof s.tiene_igpu === "boolean") compat.tiene_igpu = String(s.tiene_igpu);
  if (typeof s.formatos === "string")
    compat.formatos_soportados = `array[${s.formatos.split(",").map((f) => q(f.trim())).join(", ")}]::text[]`;
  const keys = Object.keys(compat);
  if (keys.length) {
    out.push(
      `insert into public.compat_attrs (product_id, ${keys.join(", ")}) values (${pid}, ${keys.map((k) => compat[k]).join(", ")}) on conflict (product_id) do nothing;`,
    );
  }
}

out.push("", "commit;", "");
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n"));
console.log(`seed.sql: ${categories.length} categorías, ${mockProducts.length} productos`);
