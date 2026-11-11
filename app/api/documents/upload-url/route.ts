import { NextResponse } from "next/server";
import { ARCHIVE_EXT, MAX_ARCHIVE_BYTES } from "@/lib/archive/shared";
import { err, requireUser } from "@/lib/archive/server";

export const runtime = "nodejs";

/**
 * Step 1 of an archive upload. Creates the `documents` row (status "pending") and a signed Storage upload URL,
 * so the browser sends the file straight to Storage instead of through this function's request-body limit.
 * Body: { fileName: string, fileSize: number, kind?: "precedent" | "case_doc" }
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.res) return auth.res;
  const { supabase, userId } = auth;

  const body = (await request.json().catch(() => null)) as { fileName?: unknown; fileSize?: unknown; kind?: unknown } | null;
  const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : NaN;
  const kind = body?.kind === "case_doc" ? "case_doc" : "precedent";

  if (!fileName || !Number.isFinite(fileSize)) return err("bad_request", "fileName and fileSize are required.", 400);
  const lower = fileName.toLowerCase();
  if (!ARCHIVE_EXT.some((e) => lower.endsWith(e))) {
    return err("unsupported", `Unsupported file type. Use ${ARCHIVE_EXT.join(", ")}.`, 415);
  }
  if (fileSize <= 0) return err("empty", "The file is empty.", 400);
  if (fileSize > MAX_ARCHIVE_BYTES) return err("too_large", `Files can be at most ${MAX_ARCHIVE_BYTES / 1024 / 1024} MB.`, 413);

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      kind,
      title: fileName.replace(/\.[^.]+$/, "").slice(0, 240),
      file_name: fileName.slice(0, 240),
      file_size: Math.round(fileSize),
      status: "pending",
    })
    .select("id")
    .single();
  if (docError || !doc) {
    console.error("Creating document row failed:", docError?.message);
    return err("db_error", "Could not register the upload.", 500);
  }

  // The first path segment must be the user's id: the Storage RLS policy keys on it.
  const safeName = fileName.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `${userId}/archive/${doc.id}-${safeName}`;
  const { data: signed, error: signError } = await supabase.storage.from("case-files").createSignedUploadUrl(path);
  if (signError || !signed) {
    console.error("Signed upload URL failed:", signError?.message);
    await supabase.from("documents").delete().eq("id", doc.id);
    return err("storage_error", "Could not prepare the upload.", 502);
  }

  const { error: pathError } = await supabase.from("documents").update({ storage_path: path }).eq("id", doc.id);
  if (pathError) {
    await supabase.from("documents").delete().eq("id", doc.id);
    return err("db_error", "Could not register the upload.", 500);
  }

  return NextResponse.json({ documentId: doc.id, path, token: signed.token });
}
