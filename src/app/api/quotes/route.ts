import { NextResponse } from "next/server";
import { allowRequest, clientKey } from "@/lib/auth/rate-limit";
import { getBuilderParts } from "@/lib/builder-parts";
import { checkBuild, SLOTS, type Build } from "@/lib/compat";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PRIVACY_POLICY_VERSION, quoteSchema } from "@/lib/validation/quote";
import { paramToPicks } from "@/store/builder-params";

/**
 * Recibe cotizaciones (home, /cotizacion y armador).
 * Valida con Zod, filtra bots (campo trampa), limita 3 envíos cada 10 minutos por IP y guarda
 * la cotización y la autorización de datos con la clave secreta (el navegador no puede escribir en quotes).
 * El armado se vuelve a leer del catálogo: nombres y precios no se toman del navegador.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  // Bot: responde como si todo saliera bien y no guarda nada
  if (typeof (body as { empresa?: unknown })?.empresa === "string" && (body as { empresa: string }).empresa.trim()) {
    return NextResponse.json({ ok: true });
  }

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: issue?.message ?? "Revisa los datos.", field: issue?.path[0] }, { status: 422 });
  }
  const q = parsed.data;

  if (!(await allowRequest(await clientKey("quote"), 3, 600))) {
    return NextResponse.json(
      { ok: false, error: "Ya recibimos varias cotizaciones desde tu conexión. Espera unos minutos o escríbenos por WhatsApp." },
      { status: 429 },
    );
  }

  let build: object | null = null;
  if (q.armado) {
    const parts = await getBuilderParts();
    const picks = paramToPicks(q.armado, new Set(parts.map((p) => `${p.slot}:${p.slug}`)));
    const chosen: Build = {};
    for (const s of SLOTS) {
      const part = parts.find((p) => p.slot === s.slot && p.slug === picks[s.slot]);
      if (part) chosen[s.slot] = part;
    }
    if (Object.keys(chosen).length) {
      const result = checkBuild(chosen);
      build = {
        piezas: SLOTS.filter((s) => chosen[s.slot]).map((s) => ({
          hueco: s.label,
          producto_id: chosen[s.slot]!.id,
          nombre: chosen[s.slot]!.nombre,
          precio: chosen[s.slot]!.precio,
        })),
        total: result.total,
        errores: result.errores.map((e) => e.message),
        avisos: result.avisos.map((a) => a.message),
      };
    }
  }

  const admin = createSupabaseAdminClient();
  const { data: quote, error } = await admin
    .from("quotes")
    .insert({
      nombre: q.nombre,
      telefono: q.telefono,
      email: q.correo || null,
      interes: q.interes,
      presupuesto: q.presupuesto,
      mensaje: q.mensaje || null,
      build,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[quotes] no se pudo guardar:", error.message);
    return NextResponse.json({ ok: false, error: "No pudimos guardar tu cotización. Intenta de nuevo o escríbenos por WhatsApp." }, { status: 500 });
  }

  const consent = await admin.from("consents").insert({
    quote_id: quote.id,
    finalidad: "cotizacion",
    version_politica: PRIVACY_POLICY_VERSION,
    origen: q.armado ? "armador" : "formulario-cotizacion",
  });
  if (consent.error) console.error("[quotes] no se guardó la autorización:", consent.error.message);

  return NextResponse.json({ ok: true });
}
