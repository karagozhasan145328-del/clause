import { NextResponse } from "next/server";
import { cleanFilters, err, requireUser, retrieve } from "@/lib/archive/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Hybrid precedent search: Voyage embedding + Turkish full-text, fused with RRF in Postgres (hybrid_search).
 * Body: { query: string, filters?: { legalArea, court, chamber, yearFrom, yearTo, statute }, limit?: number }
 * `mode` in the response is "text" when the embedder was unavailable and only keyword search ran.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.res) return auth.res;

  const body = (await request.json().catch(() => null)) as { query?: unknown; filters?: unknown; limit?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query.trim().slice(0, 1000) : "";
  if (query.length < 2) return err("bad_request", "Enter a search query.", 400);
  const limit = Math.min(Math.max(typeof body?.limit === "number" ? Math.floor(body.limit) : 10, 1), 30);

  try {
    const { hits, mode } = await retrieve(auth.supabase, query, cleanFilters(body?.filters), limit);
    return NextResponse.json({ hits, mode });
  } catch (e) {
    console.error("Search failed:", e instanceof Error ? e.message : e);
    return err("search_failed", "Search failed. Make sure supabase/archive.sql has been run.", 500);
  }
}
