/**
 * Server-side text extraction for uploaded case files (TXT-like, PDF, DOCX).
 * The file kind is decided from the file's own bytes (magic numbers), not just its name,
 * so a renamed or corrupt file is rejected with a clear reason instead of being fed to a parser.
 */

import { OCR_MAX_PAGES, OcrError, ocrPdf } from "@/lib/ocr";

export type FileKind = "text" | "pdf" | "docx";

export const TEXT_EXT = [".txt", ".md", ".csv", ".json", ".log"];
export const ACCEPT_EXT = [...TEXT_EXT, ".pdf", ".docx"];

/** Vercel serverless request bodies are capped at 4.5 MB; stay under it. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_CHARS = 100_000;
const MAX_PDF_PAGES = 300;
/** Below this many characters per page on average, a PDF is treated as a scan (images only). */
const MIN_CHARS_PER_PAGE = 30;

export type ExtractErrorCode =
  | "unsupported"
  | "legacy_doc"
  | "corrupt"
  | "password_protected"
  | "scanned_pdf"
  | "too_many_pages"
  | "ocr_too_many_pages"
  | "ocr_failed"
  | "ocr_timeout"
  | "ocr_empty"
  | "empty";

export class ExtractError extends Error {
  constructor(
    public code: ExtractErrorCode,
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}

export interface Extracted {
  kind: FileKind;
  text: string;
  /** True when the text was cut at MAX_CHARS. */
  truncated: boolean;
  /** PDF only: pages without selectable text (likely scanned) out of the total. */
  missingPages?: { missing: number; total: number };
  /** True when the text came from OCR of a scanned PDF (may contain misreadings). */
  ocr?: boolean;
}

export interface ExtractOptions {
  /** The user explicitly agreed to send a scanned PDF to OCR (it is processed by OpenAI). */
  ocr?: boolean;
  apiKey?: string;
}

const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

/** Decides the file kind from its bytes + extension, or throws an ExtractError. */
export function detectKind(name: string, bytes: Uint8Array): FileKind {
  const lower = name.toLowerCase();
  const isPdfSig = startsWith(bytes, [0x25, 0x50, 0x44, 0x46]); // %PDF
  const isZipSig = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]); // PK..
  const isOleSig = startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]); // legacy Word (.doc)

  if (lower.endsWith(".pdf")) {
    if (!isPdfSig) throw new ExtractError("corrupt", "This file is not a valid PDF.");
    return "pdf";
  }
  if (lower.endsWith(".docx")) {
    if (!isZipSig) throw new ExtractError("corrupt", "This file is not a valid .docx document.");
    return "docx";
  }
  if (lower.endsWith(".doc") || isOleSig) {
    throw new ExtractError(
      "legacy_doc",
      "Legacy .doc files are not supported. Save the document as .docx or PDF in Word and upload again.",
      415,
    );
  }
  if (TEXT_EXT.some((e) => lower.endsWith(e))) {
    // A "text" file that is really a PDF/Office file would produce garbage; stop it here.
    if (isPdfSig || isZipSig || isOleSig) throw new ExtractError("corrupt", "The file content does not match its extension.");
    return "text";
  }
  throw new ExtractError("unsupported", "Unsupported file type. Use .pdf, .docx, .txt, .md, .csv or .json.", 415);
}

async function extractPdf(
  bytes: Uint8Array,
  fileName: string,
  opts: ExtractOptions,
): Promise<{ text: string; missingPages?: Extracted["missingPages"]; ocr?: boolean }> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  let pages: string[];
  try {
    // pdf.js transfers/detaches the buffer, so hand it a copy.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new ExtractError("too_many_pages", `The PDF has more than ${MAX_PDF_PAGES} pages. Split it and upload the relevant part.`, 413);
    }
    const out = await extractText(pdf, { mergePages: false });
    pages = out.text as string[];
  } catch (e) {
    if (e instanceof ExtractError) throw e;
    const name = (e as { name?: string })?.name ?? "";
    if (name === "PasswordException") {
      throw new ExtractError("password_protected", "The PDF is password-protected. Remove the password and upload again.");
    }
    throw new ExtractError("corrupt", "The PDF could not be read. It may be damaged.");
  }

  const clean = pages.map((p) => p.replace(/\s+/g, " ").trim());
  const total = clean.length || 1;
  const withText = clean.filter((p) => p.length >= MIN_CHARS_PER_PAGE).length;
  const chars = clean.reduce((n, p) => n + p.length, 0);

  if (chars / total < MIN_CHARS_PER_PAGE) {
    // Scanned: only OCR when the user opted in (the file is then processed by OpenAI).
    if (!opts.ocr || !opts.apiKey) {
      throw new ExtractError(
        "scanned_pdf",
        "This PDF looks like a scan (images without selectable text). Choose OCR to read it, or upload a text-based PDF / .docx.",
      );
    }
    if (total > OCR_MAX_PAGES) {
      throw new ExtractError("ocr_too_many_pages", `OCR supports up to ${OCR_MAX_PAGES} pages per file. Split the PDF and upload the relevant part.`, 413);
    }
    try {
      return { text: await ocrPdf(bytes, fileName, opts.apiKey), ocr: true };
    } catch (e) {
      if (e instanceof OcrError) throw new ExtractError(e.code, e.message, e.status);
      throw e;
    }
  }

  return {
    text: clean.join("\n\n"),
    missingPages: withText < total ? { missing: total - withText, total } : undefined,
  };
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  try {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return value;
  } catch {
    throw new ExtractError("corrupt", "The .docx file could not be read. It may be damaged or password-protected.");
  }
}

/** Reads an uploaded file and returns its plain text. Throws ExtractError with a user-safe message. */
export async function extractText(file: File, opts: ExtractOptions = {}): Promise<Extracted> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(file.name, bytes);

  let text = "";
  let missingPages: Extracted["missingPages"];
  let ocr = false;
  if (kind === "text") {
    text = new TextDecoder("utf-8").decode(bytes);
  } else if (kind === "docx") {
    text = await extractDocx(bytes);
  } else {
    const r = await extractPdf(bytes, file.name, opts);
    text = r.text;
    missingPages = r.missingPages;
    ocr = Boolean(r.ocr);
  }

  text = text.replace(/^﻿/, "").trim();
  if (!text) throw new ExtractError("empty", "No readable text was found in the file.");

  const truncated = text.length > MAX_CHARS;
  return { kind, text: truncated ? text.slice(0, MAX_CHARS) : text, truncated, missingPages, ocr };
}

export const CONTENT_TYPE: Record<FileKind, string> = {
  text: "text/plain",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
