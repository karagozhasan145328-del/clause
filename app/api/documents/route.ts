import { NextResponse } from "next/server";
import { err, requireUser } from "@/lib/archive/server";

export const runtime = "nodejs";

/** Lists the signed-in user's archive documents (newest first). */
export async function GET() {
  const auth = await requireUser();
  if (auth.res) return auth.res;

  const { data, error } = await auth.supabase
    .from("documents")
    .select("id, title, file_name, status, error, created_at, char_count")
    .eq("kind", "precedent")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return err("db_error", error.message, 500);
  return NextResponse.json({ documents: data ?? [] });
}
