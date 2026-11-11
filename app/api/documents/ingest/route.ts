import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { CONTENT_TYPE, ExtractError, extractText } from "@/lib/extract-text";
import { chunkText } from "@/lib/archive/chunk";
import { EmbedError, embedDocuments, embeddingsConfigured, toVector } from "@/lib/archive/embed";
import { kunyeLabel, parseKunye } from "@/lib/archive/kunye";
import { MAX_ARCHIVE_CHARS } from "@/lib/archive/shared";
import { err, requireUser } from "@/lib/archive/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const INSERT_BATCH = 40;

/**
 * Step 2 of an archive upload (after the browser finished the signed upload).
 * Pipeline: download → extract text → hash (duplicate check) → künye (regex) → chunk → embed (Voyage) → store.
 * Idempotent: re-running replaces the document's chunks. If embedding is unavailable the chunks are still stored
 * (full-text searchable) and the response says `embedded: false`.
 * Body: { documentId: string }
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.res) return auth.res;
  const { supabase, userId } = auth;

  const body = (await request.json().catch(() => null)) as { documentId?: unknown } | null;
  const documentId = typeof body?.documentId === "string" ? body.documentId : "";
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) return err("bad_request", "documentId is required.", 400);

  const { data: doc } = await supabase
    .from("documents")
    .select("id, kind, title, file_name, storage_path, status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return err("not_found", "Document not found.", 404);
  if (!doc.storage_path) return err("not_uploaded", "No file was uploaded for this document.", 409);
  if (doc.status === "processing") return err("busy", "This document is already being processed.", 409);

  await supabase.from("documents").update({ status: "processing", error: null }).eq("id", documentId);

  const fail = async (code: string, message: string, status: number, extra?: Record<string, unknown>) => {
    await supabase.from("documents").update({ status: "failed", error: message.slice(0, 500) }).eq("id", documentId);
    return NextResponse.json({ error: code, message, ...extra }, { status });
  };

  // 1. Download the original from Storage.
  const dl = await supabase.storage.from("case-files").download(doc.storage_path);
  if (dl.error || !dl.data) {
    console.error("Storage download failed:", dl.error?.message);
    return fail("not_uploaded", "The uploaded file could not be found in storage.", 409);
  }

  // 2. Text extraction (no OCR here: a scanned PDF fails with scanned_pdf and can be re-uploaded as text).
  let extracted;
  try {
    extracted = await extractText(new File([dl.data], doc.file_name), { maxChars: MAX_ARCHIVE_CHARS });
  } catch (e) {
    if (e instanceof ExtractError) return fail(e.code, e.message, e.status);
    console.error("Archive text extraction failed:", e);
    return fail("extract_failed", "The file could not be read.", 422);
  }

  // 3. Duplicate check on the extracted text (unique per user).
  const hash = createHash("sha256").update(extracted.text).digest("hex");
  const hashed = await supabase.from("documents").update({ content_hash: hash }).eq("id", documentId);
  if (hashed.error) {
    if (hashed.error.code === "23505") {
      const { data: existing } = await supabase
        .from("documents")
        .select("id, title")
        .eq("content_hash", hash)
        .neq("id", documentId)
        .maybeSingle();
      await supabase.from("documents").delete().eq("id", documentId);
      await supabase.storage.from("case-files").remove([doc.storage_path]);
      return NextResponse.json(
        { error: "duplicate", message: "This document is already in your archive.", existing: existing ?? null },
        { status: 409 },
      );
    }
    console.error("Saving content hash failed:", hashed.error.message);
    return fail("db_error", "Could not save the document.", 500);
  }

  // 4. Künye + 5. chunks
  const isPrecedent = doc.kind === "precedent";
  const kunye = isPrecedent ? parseKunye(extracted.text) : null;
  const chunks = chunkText(extracted.text);
  if (chunks.length === 0) return fail("empty", "No readable text was found in the file.", 422);

  // 6. Embeddings (best effort: chunks are stored either way).
  let vectors: number[][] | null = null;
  let embedNote: string | null = null;
  if (!embeddingsConfigured()) {
    embedNote = "VOYAGE_API_KEY is not set; stored for full-text search only.";
  } else {
    try {
      vectors = await embedDocuments(chunks.map((c) => (c.heading ? `${c.heading}: ${c.content}` : c.content)));
    } catch (e) {
      embedNote = e instanceof EmbedError ? e.message : "Embedding failed.";
      console.error("Embedding failed:", e instanceof Error ? e.message : e);
    }
  }

  // 7. Store. Replace any chunks from an earlier run first.
  const del = await supabase.from("document_chunks").delete().eq("document_id", documentId);
  if (del.error) return fail("db_error", "Could not reset the document's chunks.", 500);
  for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
    const rows = chunks.slice(i, i + INSERT_BATCH).map((c, j) => ({
      document_id: documentId,
      user_id: userId,
      ord: c.ord,
      heading: c.heading,
      content: c.content,
      token_count: c.tokenCount,
      embedding: vectors ? toVector(vectors[i + j]) : null,
    }));
    const ins = await supabase.from("document_chunks").insert(rows);
    if (ins.error) {
      console.error("Inserting chunks failed:", ins.error.message);
      await supabase.from("document_chunks").delete().eq("document_id", documentId);
      return fail("db_error", "Could not store the document's text.", 500);
    }
  }

  if (kunye) {
    const up = await supabase.from("precedents").upsert(
      {
        document_id: documentId,
        user_id: userId,
        legal_area: kunye.legalArea,
        court: kunye.court,
        chamber: kunye.chamber,
        esas_no: kunye.esasNo,
        karar_no: kunye.kararNo,
        decision_date: kunye.decisionDate,
        subject: kunye.subject,
        statutes: kunye.statutes,
        outcome: kunye.outcome,
        extraction_source: kunye.source,
      },
      { onConflict: "document_id" },
    );
    if (up.error) console.error("Saving precedent metadata failed:", up.error.message); // chunks are searchable without it
  }

  const label = kunye ? kunyeLabel(kunye) : "";
  await supabase
    .from("documents")
    .update({
      status: "ready",
      // Not an error: a note that the document is searchable by keywords only until it is re-embedded.
      error: embedNote,
      char_count: extracted.text.length,
      ...(label ? { title: label.slice(0, 240) } : {}),
    })
    .eq("id", documentId);

  return NextResponse.json({
    documentId,
    status: "ready",
    contentType: CONTENT_TYPE[extracted.kind],
    chunks: chunks.length,
    embedded: Boolean(vectors),
    embedNote,
    truncated: extracted.truncated,
    kunye,
    title: label || doc.title,
  });
}
