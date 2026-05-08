import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const LOGIN = "/login";

function loginRedirectUrl(request: NextRequest, pathname: string) {
  const url = new URL(LOGIN, request.url);
  const pathWithQuery = pathname + (request.nextUrl.search || "");
  url.searchParams.set("next", pathWithQuery);
  return url;
}

/**
 * Só rotas privadas (aluno + admin). Públicas: /, /login, /cadastro — sem middleware.
 * Não decide admin; só verifica se existe sessão.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const hasSession = Boolean(session?.user);

  const pathname = request.nextUrl.pathname;

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if ((isDashboard || isAdmin) && !hasSession) {
    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(loginRedirectUrl(request, pathname)),
    );
  }

  return supabaseResponse;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
