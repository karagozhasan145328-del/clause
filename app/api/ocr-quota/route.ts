import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOcrUsage } from "@/lib/ocr-quota";

export const runtime = "nodejs";

/** The signed-in user's OCR usage this month: { used, limit, remaining }. */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ used: 0, limit: 0, remaining: 0, unlimited: true });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { used, limit, remaining } = await getOcrUsage(supabase);
    return NextResponse.json({ used, limit, remaining });
  } catch (e) {
    console.error("OCR quota lookup failed:", e);
    return NextResponse.json({ error: "quota_unavailable" }, { status: 503 });
  }
}
