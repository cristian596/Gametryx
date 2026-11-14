import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Ids de los favoritos del usuario actual (para pintar los corazones). Sin sesión: lista vacía. */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isSupabaseConfigured) return NextResponse.json({ ids: [] }, { headers });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ids: [] }, { headers });

  const { data, error } = await supabase.from("wishlist").select("product_id").eq("user_id", user.id);
  if (error) return NextResponse.json({ ids: [] }, { status: 500, headers });
  return NextResponse.json({ ids: data.map((r) => r.product_id as string) }, { headers });
}
