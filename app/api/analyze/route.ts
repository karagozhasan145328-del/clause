import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeAnalysis, type Analysis } from "@/lib/analysis";
import { buildSystemPrompt } from "@/lib/analysis-prompt";
import { CONTENT_TYPE, ExtractError, MAX_UPLOAD_BYTES, extractText } from "@/lib/extract-text";

export const runtime = "nodejs";
export const maxDuration = 60;


const err = (code: string, message: string, status: number) =>
  NextResponse.json({ error: code, message }, { status });

export async function POST(request: Request) {
  const startedAt = Date.now();
  // Auth: only enforced once Supabase is connected (demo mode stays open).
  const supabase = isSupabaseConfigured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (supabase && !user) return err("unauthorized", "Sign in to analyze a case.", 401);

  const apiKey = process.env.OPENAI_API_KEY?.replace(/^﻿/, "").trim();
  if (!apiKey) {
    return err("no_key", "OPENAI_API_KEY is not set in .env.local — add it and restart the dev server.", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err("bad_request", "Expected multipart/form-data with a file.", 400);
  }

  const file = form.get("file");
  const lang = form.get("lang") === "en" ? "en" : "tr";
  if (!(file instanceof File) || file.size === 0) return err("no_file", "No file received.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return err("too_large", "File is larger than 4 MB.", 413);

  // Read text out of TXT / PDF / DOCX. Failures carry a user-safe code + message (scanned PDF, password, legacy .doc…).
  let extracted;
  try {
    extracted = await extractText(file, { ocr: form.get("ocr") === "1", apiKey });
  } catch (e) {
    if (e instanceof ExtractError) return err(e.code, e.message, e.status);
    console.error("Text extraction failed:", e);
    return err("extract_failed", "The file could not be read.", 422);
  }
  const { text } = extracted;

  const system = buildSystemPrompt(lang);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
      // Whatever OCR already used comes off the 60 s function budget (min 12 s so the call can still finish).
      signal: AbortSignal.timeout(Math.max(12_000, 55_000 - (Date.now() - startedAt))),
    });
  } catch {
    return err("upstream_unreachable", "Could not reach OpenAI (timeout or network).", 504);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("OpenAI error", res.status, detail.slice(0, 500));
    return err("upstream_error", `OpenAI returned ${res.status}.`, 502);
  }

  let analysis: Analysis;
  try {
    const json = await res.json();
    analysis = sanitizeAnalysis(JSON.parse(json.choices?.[0]?.message?.content ?? ""), text, lang);
  } catch {
    return err("bad_model_output", "The model returned an unreadable response. Try again.", 502);
  }
  // Saved with the result so the UI can warn that the text came from OCR and may contain misreadings.
  if (extracted.ocr) {
    analysis.ocr = true;
    if (extracted.ocrPages) analysis.ocrPages = extracted.ocrPages;
  }

  // Persist (best effort): the analysis is still returned if saving fails.
  let saved: { id: string } | null = null;
  let saveError: string | null = null;
  if (supabase && user) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const up = await supabase.storage.from("case-files").upload(storagePath, file, {
      contentType: CONTENT_TYPE[extracted.kind],
    });
    if (up.error) console.error("Storage upload failed:", up.error.message);

    const ins = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        storage_path: up.error ? null : storagePath,
        lang,
        overall_risk: analysis.overallRisk,
        summary: analysis.summary ?? "",
        result: analysis,
      })
      .select("id")
      .single();
    if (ins.error) {
      console.error("Saving analysis failed:", ins.error.message);
      saveError = ins.error.message;
    } else {
      saved = ins.data;
    }
  }

  return NextResponse.json({
    fileName: file.name,
    truncated: extracted.truncated,
    ocr: extracted.ocr ?? false,
    ocrPages: extracted.ocrPages ?? null,
    kind: extracted.kind,
    missingPages: extracted.missingPages ?? null,
    analysis,
    id: saved?.id ?? null,
    saveError,
  });
}
