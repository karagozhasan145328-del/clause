import type { SupabaseClient } from "@supabase/supabase-js";

/** Pages of OCR each user may use per calendar month (UTC). Override with OCR_MONTHLY_PAGE_LIMIT. */
export const DEFAULT_OCR_MONTHLY_PAGES = 60;

export function ocrMonthlyLimit(): number {
  const n = Number(process.env.OCR_MONTHLY_PAGE_LIMIT);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_OCR_MONTHLY_PAGES;
}

/** First instant of the current UTC month. */
export function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export interface OcrUsage {
  used: number;
  limit: number;
  remaining: number;
  /** "table" = ocr_usage (tamper-resistant), "analyses" = fallback until ocr_usage.sql has been run. */
  source: "table" | "analyses";
}

/** Postgres "undefined_table" / PostgREST "table not in schema cache". */
const isMissingTable = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|schema cache/i.test(e.message ?? "")));

/** Pages of OCR used this month by the signed-in user (RLS limits every query to their own rows). */
export async function getOcrUsage(supabase: SupabaseClient, now = new Date()): Promise<OcrUsage> {
  const limit = ocrMonthlyLimit();
  const since = monthStartIso(now);

  const t = await supabase.from("ocr_usage").select("pages").gte("created_at", since);
  if (!t.error) {
    const used = (t.data ?? []).reduce((n, r) => n + Number(r.pages ?? 0), 0);
    return { used, limit, remaining: Math.max(0, limit - used), source: "table" };
  }
  if (!isMissingTable(t.error)) throw new Error(`ocr_usage query failed: ${t.error.message}`);

  // Fallback: count the pages of saved analyses that were read via OCR this month.
  const a = await supabase.from("analyses").select("result").gte("created_at", since).eq("result->>ocr", "true");
  if (a.error) throw new Error(`analyses query failed: ${a.error.message}`);
  const used = (a.data ?? []).reduce((n, r) => {
    const res = (r.result ?? {}) as { ocrPageCount?: number; ocrPages?: number };
    return n + (res.ocrPageCount ?? res.ocrPages ?? 1);
  }, 0);
  return { used, limit, remaining: Math.max(0, limit - used), source: "analyses" };
}

/** Records OCR pages after a successful OCR. Without the table the saved analysis itself is the record. */
export async function recordOcrUsage(supabase: SupabaseClient, pages: number, fileName: string): Promise<void> {
  const r = await supabase.from("ocr_usage").insert({ pages, file_name: fileName });
  if (r.error && !isMissingTable(r.error)) console.error("Recording OCR usage failed:", r.error.message);
}
