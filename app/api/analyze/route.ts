import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeRisk, type Analysis } from "@/lib/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CHARS = 100_000;
const TEXT_EXT = [".txt", ".md", ".csv", ".json", ".log"];

const err = (code: string, message: string, status: number) =>
  NextResponse.json({ error: code, message }, { status });

export async function POST(request: Request) {
  // Auth: only enforced once Supabase is connected (demo mode stays open).
  const supabase = isSupabaseConfigured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (supabase && !user) return err("unauthorized", "Sign in to analyze a case.", 401);

  const apiKey = process.env.OPENAI_API_KEY;
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
  if (file.size > MAX_BYTES) return err("too_large", "File is larger than 5 MB.", 413);

  const name = file.name.toLowerCase();
  if (!TEXT_EXT.some((e) => name.endsWith(e))) {
    return err("unsupported", "Only text files are supported (.txt WhatsApp exports, .md, .csv, .json).", 415);
  }

  const text = (await file.text()).slice(0, MAX_CHARS).trim();
  if (!text) return err("empty", "The file is empty.", 400);

  const system = `You are a legal-risk analyst. Analyze the uploaded case material (typically a WhatsApp chat export or case document). Respond with JSON only, in ${
    lang === "tr" ? "Turkish" : "English"
  }, matching exactly:
{"summary": string, "overallRisk": "low"|"medium"|"high"|"critical", "findings": [{"title": string, "severity": "low"|"medium"|"high"|"critical", "detail": string, "evidence": string}], "contradictions": [string], "recommendations": [string]}
Only report what is supported by the text; quote short evidence. Do not invent facts.`;

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
      signal: AbortSignal.timeout(55_000),
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
    analysis = JSON.parse(json.choices?.[0]?.message?.content ?? "");
  } catch {
    return err("bad_model_output", "The model returned an unreadable response. Try again.", 502);
  }
  analysis.overallRisk = normalizeRisk(analysis.overallRisk);

  // Persist (best effort): the analysis is still returned if saving fails.
  let saved: { id: string } | null = null;
  let saveError: string | null = null;
  if (supabase && user) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const up = await supabase.storage.from("case-files").upload(storagePath, file, {
      contentType: file.type || "text/plain",
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
    truncated: file.size > MAX_CHARS,
    analysis,
    id: saved?.id ?? null,
    saveError,
  });
}
