import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeAnalysis, type Analysis } from "@/lib/analysis";
import { buildSystemPrompt } from "@/lib/analysis-prompt";
import { CONTENT_TYPE, ExtractError, MAX_UPLOAD_BYTES, extractText } from "@/lib/extract-text";
import { getOcrUsage, recordOcrUsage } from "@/lib/ocr-quota";

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
    extracted = await extractText(file, {
      ocr: form.get("ocr") === "1",
      apiKey,
      // Monthly per-user OCR page quota (skipped in demo mode, where there is no user).
      quota:
        supabase && user
          ? {
              check: async (pages) => {
                // Fail closed: if usage can't be verified, don't run (paid) OCR.
                const u = await getOcrUsage(supabase).catch((e) => {
                  console.error("OCR quota check failed:", e);
                  throw new ExtractError("ocr_failed", "Could not verify the OCR quota. Try again shortly.", 503);
                });
                if (u.used + pages > u.limit) {
                  throw new ExtractError(
                    "ocr_quota_exceeded",
                    `Monthly OCR quota reached (${u.used}/${u.limit} pages used, ${pages} needed).`,
                    429,
                    { quota: { used: u.used, limit: u.limit, remaining: u.remaining, needed: pages } },
                  );
                }
              },
              record: (pages) => recordOcrUsage(supabase, pages, file.name),
            }
          : undefined,
    });
  } catch (e) {
    if (e instanceof ExtractError) {
      return NextResponse.json({ error: e.code, message: e.message, ...e.extra }, { status: e.status });
    }
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
    if (extracted.ocrPageCount) analysis.ocrPageCount = extracted.ocrPageCount; // pages charged to the quota
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

  // An OCR re-analysis replaces the earlier (text-only) analysis of the same file. Only after the new row
  // is safely stored, only when OCR really produced the text, and only the caller's own row with the same file name.
  let replacedId: string | null = null;
  const replaces = String(form.get("replaces") ?? "");
  if (supabase && user && saved && extracted.ocr && /^[0-9a-f-]{36}$/i.test(replaces) && replaces !== saved.id) {
    const { data: old } = await supabase
      .from("analyses")
      .select("id, file_name, storage_path")
      .eq("id", replaces)
      .eq("user_id", user.id)
      .maybeSingle();
    if (old && old.file_name === file.name) {
      const del = await supabase.from("analyses").delete().eq("id", old.id).eq("user_id", user.id);
      if (del.error) {
        console.error("Replacing previous analysis failed:", del.error.message);
      } else {
        replacedId = old.id;
        if (old.storage_path) await supabase.storage.from("case-files").remove([old.storage_path]);
      }
    }
  }

  return NextResponse.json({
    fileName: file.name,
    truncated: extracted.truncated,
    ocr: extracted.ocr ?? false,
    ocrPages: extracted.ocrPages ?? null,
    ocrQuota: extracted.ocr && supabase && user ? await getOcrUsage(supabase).catch(() => null) : null,
    kind: extracted.kind,
    missingPages: extracted.missingPages ?? null,
    analysis,
    id: saved?.id ?? null,
    replacedId,
    saveError,
  });
}
