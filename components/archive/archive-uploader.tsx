"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { createClient } from "@/lib/supabase/client";
import { ARCHIVE_EXT, MAX_ARCHIVE_BYTES, MAX_FILES_PER_BATCH, type ArchiveDoc } from "@/lib/archive/shared";
import { cn } from "@/lib/utils";

type Msg = { tr: string; en: string };
const ERRORS: Record<string, Msg> = {
  unauthorized: { tr: "Oturumun yok ya da süresi dolmuş. Yeniden giriş yap.", en: "Your session is missing or has expired. Sign in again." },
  no_supabase: { tr: "Arşiv için Supabase bağlantısı gerekli.", en: "The archive needs a Supabase connection." },
  unsupported: { tr: "Desteklenmeyen dosya türü (PDF, DOCX, UDF, TXT, MD).", en: "Unsupported file type (PDF, DOCX, UDF, TXT, MD)." },
  too_large: { tr: "Dosya 25 MB'tan büyük.", en: "The file is larger than 25 MB." },
  duplicate: { tr: "Bu belge arşivinde zaten var.", en: "This document is already in your archive." },
  scanned_pdf: { tr: "Taranmış PDF: seçilebilir metin yok. Metin tabanlı PDF / .docx yükle.", en: "Scanned PDF with no selectable text. Upload a text-based PDF / .docx." },
  password_protected: { tr: "Dosya şifreli.", en: "The file is password-protected." },
  corrupt: { tr: "Dosya okunamadı veya bozuk.", en: "The file couldn't be read or is damaged." },
  empty: { tr: "Dosyada okunabilir metin yok.", en: "No readable text in the file." },
  too_many_pages: { tr: "PDF 300 sayfadan uzun.", en: "The PDF is longer than 300 pages." },
  legacy_doc: { tr: "Eski .doc desteklenmiyor; .docx veya PDF kaydet.", en: "Legacy .doc isn't supported; save as .docx or PDF." },
};

type Item = {
  key: string;
  name: string;
  step: "uploading" | "processing" | "done" | "failed";
  note?: string;
};

export function ArchiveUploader({ onChanged }: { onChanged?: () => void }) {
  const { lang } = useLang();
  const tr = lang === "tr";
  const l = (m: Msg) => (tr ? m.tr : m.en);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [docs, setDocs] = useState<ArchiveDoc[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const busy = items.some((i) => i.step === "uploading" || i.step === "processing");

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/documents").catch(() => null);
    const data = await res?.json().catch(() => null);
    return { ok: Boolean(res?.ok), data };
  }, []);

  const applyDocs = useCallback(
    ({ ok, data }: { ok: boolean; data: { documents?: ArchiveDoc[]; error?: string; message?: string } | null }) => {
      if (!ok) {
        setListError(data?.error && ERRORS[data.error] ? (tr ? ERRORS[data.error].tr : ERRORS[data.error].en) : (data?.message ?? null));
        setDocs([]);
        return;
      }
      setListError(null);
      setDocs(data?.documents ?? []);
    },
    [tr],
  );

  const loadDocs = useCallback(async () => applyDocs(await fetchDocs()), [applyDocs, fetchDocs]);

  useEffect(() => {
    let alive = true;
    void fetchDocs().then((r) => alive && applyDocs(r));
    return () => {
      alive = false;
    };
  }, [fetchDocs, applyDocs]);

  const patch = (key: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const fail = (key: string, code: string | undefined, fallback: string) =>
    patch(key, { step: "failed", note: code && ERRORS[code] ? l(ERRORS[code]) : fallback });

  async function uploadOne(file: File, key: string) {
    // 1. Ask the server for a signed upload URL (it also registers the document row).
    const ures = await fetch("/api/documents/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
    }).catch(() => null);
    const u = await ures?.json().catch(() => null);
    if (!ures?.ok) return fail(key, u?.error, u?.message ?? (tr ? "Sunucuya ulaşılamadı." : "Could not reach the server."));

    // 2. Browser → Storage directly.
    const up = await createClient().storage.from("case-files").uploadToSignedUrl(u.path, u.token, file);
    if (up.error) return fail(key, undefined, tr ? "Yükleme başarısız oldu." : "Upload failed.");

    // 3. Extract, chunk, embed, store.
    patch(key, { step: "processing" });
    const ires = await fetch("/api/documents/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: u.documentId }),
    }).catch(() => null);
    const d = await ires?.json().catch(() => null);
    if (!ires?.ok) return fail(key, d?.error, d?.message ?? (tr ? "İşleme başarısız oldu." : "Processing failed."));
    patch(key, {
      step: "done",
      note: d.embedded
        ? undefined
        : tr
          ? "Yalnızca anahtar kelime aramasına açık (gömme yapılamadı)."
          : "Keyword search only (embedding unavailable).",
    });
  }

  async function onFiles(list: FileList | File[] | null | undefined) {
    const files = Array.from(list ?? []).slice(0, MAX_FILES_PER_BATCH);
    if (files.length === 0 || busy) return;
    const batch: Item[] = files.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, step: "uploading" }));
    setItems(batch);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (!ARCHIVE_EXT.includes(ext)) fail(batch[i].key, "unsupported", "");
      else if (f.size > MAX_ARCHIVE_BYTES) fail(batch[i].key, "too_large", "");
      else if (f.size === 0) fail(batch[i].key, "empty", "");
      else await uploadOne(f, batch[i].key);
    }
    if (inputRef.current) inputRef.current.value = "";
    await loadDocs();
    onChanged?.();
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ARCHIVE_EXT.join(",")}
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void onFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <UploadCloud className="h-7 w-7 text-primary" />
        <p className="text-sm font-medium">
          {tr ? "Emsal kararları buraya sürükle ya da seçmek için tıkla" : "Drag precedent decisions here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          {tr
            ? `PDF, Word (.docx), UYAP (.udf), .txt · dosya başına en fazla 25 MB · tek seferde ${MAX_FILES_PER_BATCH} dosya`
            : `PDF, Word (.docx), UYAP (.udf), .txt · up to 25 MB per file · ${MAX_FILES_PER_BATCH} files at a time`}
        </p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.key} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              {it.step === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : it.step === "failed" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{it.name}</p>
                <p className={cn("text-xs", it.step === "failed" ? "text-destructive" : "text-muted-foreground")}>
                  {it.step === "uploading" && (tr ? "Yükleniyor…" : "Uploading…")}
                  {it.step === "processing" && (tr ? "Metin çıkarılıyor, parçalanıyor ve indeksleniyor…" : "Extracting, chunking and indexing…")}
                  {it.step === "done" && (it.note ?? (tr ? "Arşive eklendi." : "Added to the archive."))}
                  {it.step === "failed" && it.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="label-mono mb-2 text-muted-foreground">{tr ? "Arşivindeki belgeler" : "Documents in your archive"}</p>
        {listError && <p className="text-xs text-destructive">{listError}</p>}
        {docs === null ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : docs.length === 0 && !listError ? (
          <p className="text-sm text-muted-foreground">{tr ? "Henüz belge yok." : "No documents yet."}</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{d.title}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                    d.status === "ready" && "bg-success/15 text-success",
                    d.status === "failed" && "bg-destructive/10 text-destructive",
                    (d.status === "pending" || d.status === "processing") && "bg-muted text-muted-foreground",
                  )}
                  title={d.error ?? undefined}
                >
                  {d.status === "ready" ? (tr ? "hazır" : "ready") : d.status === "failed" ? (tr ? "hata" : "failed") : tr ? "bekliyor" : d.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
