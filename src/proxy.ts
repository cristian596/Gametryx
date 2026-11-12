import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase (cookies) y hace una comprobación OPTIMISTA en /admin:
 * sin sesión → a la página de ingreso. La autorización real (¿es admin?) se hace en el servidor,
 * junto a los datos, con requireAdmin() y la RLS.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims valida la firma del token y refresca la sesión si hace falta
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/ingresar";
  if (pathname.startsWith("/admin") && !isLogin && !signedIn) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/ingresar";
    to.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(to);
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Solo rutas con sesión: la tienda pública no paga el costo del proxy
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
