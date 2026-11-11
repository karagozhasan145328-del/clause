import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { cleanFilters, err, requireUser, retrieve } from "@/lib/archive/server";
import type { AnswerSegment, AskResult, Citation, SearchHit } from "@/lib/archive/shared";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";
const SOURCES = 8;

const systemPrompt = (lang: "tr" | "en") =>
  [
    "You are a legal research assistant for a Turkish lawyer. You answer questions using ONLY the decision excerpts supplied as documents in this conversation.",
    "Rules:",
    "- Every statement about what a decision held or said must be backed by a citation to the excerpt it comes from. Do not state anything about case law that you cannot cite.",
    "- If the excerpts do not contain enough to answer, say so plainly and explain what is missing. Never fill the gap from memory, and never invent decisions, E./K. numbers, dates or statute articles.",
    "- If excerpts disagree, say so and cite both sides.",
    "- Refer to decisions by their künye (shown in each document's title), e.g. “Yargıtay 9. HD, E. 2023/1234 K. 2024/567”.",
    "- Be concise and structured; a short direct answer first, then the supporting reasoning.",
    `- Write the answer in ${lang === "tr" ? "Turkish" : "English"}.`,
    "- This is research support, not legal advice.",
  ].join("\n");

/** Collapses whitespace so a quote can be compared with the stored chunk regardless of line wrapping. */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Retrieval-augmented answer with verified citations.
 * Each retrieved chunk is passed to Claude as a citable document; the API returns the exact quoted span for every
 * citation. We then check each quote really occurs in that chunk and drop any that don't, so the UI never shows a
 * quote that isn't in the user's archive.
 * Body: { question: string, filters?: {...}, lang?: "tr" | "en" }
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.res) return auth.res;

  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^﻿/, "").trim();
  if (!apiKey) return err("no_key", "ANTHROPIC_API_KEY is not set in .env.local — add it and restart the dev server.", 503);

  const body = (await request.json().catch(() => null)) as { question?: unknown; filters?: unknown; lang?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 2000) : "";
  if (question.length < 5) return err("bad_request", "Ask a question.", 400);
  const lang = body?.lang === "en" ? "en" : "tr";

  let hits: SearchHit[];
  let mode: "hybrid" | "text";
  try {
    ({ hits, mode } = await retrieve(auth.supabase, question, cleanFilters(body?.filters), SOURCES));
  } catch (e) {
    console.error("Retrieval failed:", e instanceof Error ? e.message : e);
    return err("search_failed", "Search failed. Make sure supabase/archive.sql has been run.", 500);
  }

  const empty: AskResult = { segments: [], sources: [], droppedCitations: 0, ungrounded: true, mode };
  if (hits.length === 0) return NextResponse.json({ ...empty, noSources: true });

  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // Policy declines are retried server-side on a fallback model instead of surfacing as an empty answer.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systemPrompt(lang),
      messages: [
        {
          role: "user",
          content: [
            ...hits.map((h, i) => ({
              type: "document" as const,
              source: { type: "text" as const, media_type: "text/plain" as const, data: h.content },
              title: `[${i + 1}] ${h.label}${h.heading ? ` — ${h.heading}` : ""}`,
              citations: { enabled: true },
            })),
            { type: "text" as const, text: question },
          ],
        },
      ],
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return err("rate_limited", "The AI service is busy. Try again in a moment.", 429);
    if (e instanceof Anthropic.AuthenticationError) return err("bad_key", "ANTHROPIC_API_KEY was rejected.", 502);
    if (e instanceof Anthropic.APIConnectionError) return err("upstream_unreachable", "Could not reach the AI service.", 504);
    console.error("Claude request failed:", e instanceof Error ? e.message : e);
    return err("upstream_error", "The AI service returned an error.", 502);
  }

  if (response.stop_reason === "refusal") {
    return err("refused", "The model declined to answer this question.", 422);
  }

  // Keep only citations whose quote really occurs in the chunk they point at.
  const chunkText = hits.map((h) => norm(h.content));
  const segments: AnswerSegment[] = [];
  let dropped = 0;
  for (const block of response.content) {
    if (block.type !== "text" || !block.text) continue;
    const seen = new Set<string>();
    const citations: Citation[] = [];
    for (const c of block.citations ?? []) {
      if (c.type !== "char_location") continue;
      const quote = norm(c.cited_text);
      const idx = c.document_index;
      if (!quote || idx < 0 || idx >= hits.length || !chunkText[idx].includes(quote)) {
        dropped++;
        continue;
      }
      const key = `${idx}:${quote}`;
      if (seen.has(key)) continue;
      seen.add(key);
      citations.push({ source: idx + 1, quote });
    }
    segments.push({ text: block.text, citations });
  }

  if (segments.length === 0) return err("bad_model_output", "The model returned no answer. Try again.", 502);

  const result: AskResult = {
    segments,
    sources: hits,
    droppedCitations: dropped,
    ungrounded: !segments.some((s) => s.citations.length > 0),
    mode,
  };
  return NextResponse.json(result);
}
