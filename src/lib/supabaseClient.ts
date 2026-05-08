import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const missingEnvMessage =
  "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY";

let cachedClient: SupabaseClient | null = null;

/**
 * Cliente Supabase (anon) no browser com sessão em cookies (Supabase PKCE + SSR),
 * alinhado ao `middleware` que lê a mesma sessão.
 * Não usar service_role nem chaves secretas no browser.
 */
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(missingEnvMessage);
  }
  if (!cachedClient) {
    cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedClient;
}
