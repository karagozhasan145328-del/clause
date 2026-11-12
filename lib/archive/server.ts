import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { embedQuery, toVector } from "@/lib/archive/embed";
import { kunyeLabel } from "@/lib/archive/kunye";
import type { SearchFilters, SearchHit } from "@/lib/archive/shared";

export const err = (code: string, message: string, status: number) =>
  NextResponse.json({ error: code, message }, { status });

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** The archive stores per-user data, so unlike the demo analyze flow it needs Supabase and a signed-in user. */
export async function requireUser(): Promise<
  { supabase: Supabase; userId: string; res?: undefined } | { res: NextResponse; supabase?: undefined; userId?: undefined }
> {
  if (!isSupabaseConfigured) return { res: err("no_supabase", "The precedent archive needs Supabase. Connect it in .env.local.", 503) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    // Log why (no cookie vs. expired/invalid token vs. Supabase unreachable) so a "signed in but rejected" report can be diagnosed.
    const hasCookie = (await cookies()).getAll().some((c) => c.name.startsWith("sb-"));
    console.error(`Archive auth rejected: ${error?.message ?? "no user"} (supabase cookie present: ${hasCookie}, status: ${error?.status ?? "n/a"})`);
    return { res: err("unauthorized", "Your session is missing or has expired. Sign in again to use the archive.", 401) };
  }
  return { supabase, userId: user.id };
}

export function cleanFilters(raw: unknown): SearchFilters {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : undefined);
  const year = (v: unknown) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
    return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : undefined;
  };
  return {
    legalArea: str(r.legalArea),
    court: str(r.court),
    chamber: str(r.chamber),
    yearFrom: year(r.yearFrom),
    yearTo: year(r.yearTo),
    statute: str(r.statute),
  };
}

interface Row {
  chunk_id: string;
  document_id: string;
  ord: number;
  heading: string | null;
  content: string;
  title: string;
  legal_area: string | null;
  court: string | null;
  chamber: string | null;
  esas_no: string | null;
  karar_no: string | null;
  decision_date: string | null;
  score: number;
  vector_rank: number | null;
  text_rank: number | null;
}

/**
 * Hybrid retrieval: embeds the query with Voyage (falls back to full-text only if the embedder is
 * missing or down) and calls the hybrid_search SQL function, which runs under the caller's RLS.
 */
export async function retrieve(
  supabase: Supabase,
  query: string,
  filters: SearchFilters,
  limit: number,
): Promise<{ hits: SearchHit[]; mode: "hybrid" | "text" }> {
  let embedding: string | null = null;
  try {
    embedding = toVector(await embedQuery(query));
  } catch (e) {
    console.error("Query embedding unavailable, using full-text only:", e instanceof Error ? e.message : e);
  }

  const { data, error } = await supabase.rpc("hybrid_search", {
    query_text: query,
    query_embedding: embedding,
    match_count: limit,
    p_legal_area: filters.legalArea ?? null,
    p_court: filters.court ?? null,
    p_chamber: filters.chamber ?? null,
    p_year_from: filters.yearFrom ?? null,
    p_year_to: filters.yearTo ?? null,
    p_statute: filters.statute ?? null,
  });
  if (error) throw new Error(error.message);

  const hits = ((data ?? []) as Row[]).map<SearchHit>((r) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    ord: r.ord,
    heading: r.heading,
    content: r.content,
    title: r.title,
    label: kunyeLabel(r) || r.title,
    legalArea: r.legal_area,
    court: r.court,
    chamber: r.chamber,
    esasNo: r.esas_no,
    kararNo: r.karar_no,
    decisionDate: r.decision_date,
    score: r.score,
    vectorRank: r.vector_rank,
    textRank: r.text_rank,
  }));
  return { hits, mode: embedding ? "hybrid" : "text" };
}
