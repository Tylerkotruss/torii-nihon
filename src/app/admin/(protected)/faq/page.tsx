import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  // Decisão de produto: FAQ não é gerenciado no Admin Panel por enquanto.
  redirect("/admin/duvidas");
}

