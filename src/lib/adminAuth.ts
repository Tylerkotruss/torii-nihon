import { createServerSupabase } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const LOGIN = "/login";
const ACCESS_DENIED = "/admin/access-denied";

type RequireAdminResult = {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  user: User;
};

/**
 * Sessão + linha em public.admin_profiles.
 * Sem sessão → /login?next=/admin (middleware cobre o caso normal).
 * Com sessão e sem admin → /admin/access-denied (não /dashboard).
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect(`${LOGIN}?next=${encodeURIComponent("/admin")}`);
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminErr || !adminRow) {
    redirect(ACCESS_DENIED);
  }

  return { supabase, user };
}
