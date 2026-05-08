import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase (anon) no servidor — lê a sessão dos cookies; sem service_role.
 * Usar em Server Components, Server Actions e route handlers.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de Server Component sem mutar cookies
          }
        },
      },
    },
  );
}
