/**
 * Verifica la seguridad y la lógica crítica de la base de datos real.
 * Uso: npm run db:check   (lee .env.local)
 *
 * - RLS: un visitante anónimo lee el catálogo pero no puede escribir ni leer datos privados.
 * - confirmar_pago(): dos pagos simultáneos de la última unidad → solo uno pasa.
 * Crea un producto y dos pedidos temporales (prefijo "zz-test-") y los borra al terminar.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishable || !secret) {
  console.error("Faltan variables de Supabase en .env.local (ver .env.example).");
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = createClient(url, publishable, opts);
const admin = createClient(url, secret, opts);

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

// ───────────── RLS ─────────────
{
  const r = await anon.from("products").select("id", { count: "exact", head: true });
  check("anónimo lee el catálogo", !r.error && r.count > 0, `${r.count ?? 0} productos`);
}
{
  const r = await anon.from("quotes").insert({ nombre: "zz-test", telefono: "3000000000", interes: "x", presupuesto: "x" });
  check("anónimo NO inserta cotizaciones", !!r.error, r.error?.code);
}
{
  const r = await anon.from("orders").insert({ subtotal_cop: 1, total_cop: 1, address_snapshot: {} });
  check("anónimo NO crea pedidos", !!r.error, r.error?.code);
}
{
  const { data: one } = await anon.from("products").select("id, precio_cop").limit(1).single();
  const r = await anon.from("products").update({ precio_cop: 1 }).eq("id", one.id).select();
  const { data: after } = await admin.from("products").select("precio_cop").eq("id", one.id).single();
  check("anónimo NO cambia precios", (r.error || r.data?.length === 0) && after.precio_cop === one.precio_cop);
}
{
  const r = await anon.rpc("confirmar_pago", { p_order_id: "00000000-0000-0000-0000-000000000000" });
  check("anónimo NO ejecuta confirmar_pago", !!r.error, r.error?.code);
}
{
  const r = await anon.rpc("rate_limit", { p_key: "zz-test", p_max: 1, p_window_seconds: 60 });
  check("anónimo NO ejecuta rate_limit", !!r.error, r.error?.code);
}
{
  const r = await anon.rpc("is_admin");
  check("anónimo no es admin", !r.error && r.data === false);
}

// ───────────── Códigos del correo: 3 intentos por código ─────────────
{
  const r = await anon.rpc("otp_attempt", { p_key: "otp:test:zz", p_max: 3 });
  check("anónimo NO ejecuta otp_attempt", !!r.error, r.error?.code);
  const key = "otp:test:check-db";
  const start = await admin.rpc("otp_start", { p_key: key });
  const tries = [];
  for (let i = 0; i < 4; i++) tries.push((await admin.rpc("otp_attempt", { p_key: key, p_max: 3 })).data);
  check(
    "otp: 3 intentos y luego bloqueado",
    !start.error && JSON.stringify(tries) === JSON.stringify([1, 2, 3, null]),
    start.error ? start.error.message : `intentos ${JSON.stringify(tries)}`,
  );
  await admin.from("rate_limits").delete().eq("key", key);
}

// ───────────── confirmar_pago: última unidad ─────────────
const { data: cat } = await admin.from("categories").select("id").eq("slug", "componentes").single();
const { data: product, error: pErr } = await admin
  .from("products")
  .insert({ slug: `zz-test-${Date.now()}`, nombre: "zz-test producto", categoria_id: cat.id, tipo: "componente", precio_cop: 1000, stock: 1, activo: false })
  .select("id")
  .single();
if (pErr) throw pErr;

const orderIds = [];
try {
  for (let i = 0; i < 2; i++) {
    const { data: order, error } = await admin
      .from("orders")
      .insert({ subtotal_cop: 1000, total_cop: 1000, address_snapshot: { prueba: true } })
      .select("id")
      .single();
    if (error) throw error;
    orderIds.push(order.id);
    const it = await admin
      .from("order_items")
      .insert({ order_id: order.id, product_id: product.id, nombre_snapshot: "zz-test", precio_snapshot: 1000, cantidad: 1 });
    if (it.error) throw it.error;
  }

  // Los dos pagos llegan a la vez
  const results = await Promise.all(orderIds.map((id) => admin.rpc("confirmar_pago", { p_order_id: id })));
  const estados = results.map((r) => (r.error ? `error: ${r.error.message}` : r.data)).sort();
  const { data: p } = await admin.from("products").select("stock").eq("id", product.id).single();
  check(
    "dos pagos simultáneos de la última unidad: solo uno pasa",
    estados[0] === "pagado" && estados[1] === "requiere_revision" && p.stock === 0,
    `${estados.join(" / ")}, stock final ${p.stock}`,
  );

  // Idempotencia: repetir el webhook no descuenta otra vez
  const again = await admin.rpc("confirmar_pago", { p_order_id: orderIds[0] });
  const { data: p2 } = await admin.from("products").select("stock").eq("id", product.id).single();
  check("repetir confirmar_pago no descuenta dos veces", !again.error && p2.stock === 0, `devolvió ${again.data}`);
} finally {
  if (orderIds.length) await admin.from("orders").delete().in("id", orderIds);
  await admin.from("products").delete().eq("id", product.id);
  console.log("(datos de prueba borrados)");
}

console.log(failures ? `\n${failures} comprobación(es) fallaron.` : "\nTodo en orden.");
process.exit(failures ? 1 : 0);
