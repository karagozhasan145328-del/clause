"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { AnalysisView } from "@/components/app/analysis-view";
import type { Analysis } from "@/lib/analysis";
import { cn } from "@/lib/utils";

/** Mirrors lib/extract-text.ts (kept literal here: that module is server-only). */
const ACCEPT = ".pdf,.docx,.doc,.txt,.md,.csv,.json,.log";
const ALLOWED = [".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json", ".log"];
const MAX_BYTES = 4 * 1024 * 1024;

type Msg = { tr: string; en: string };

/** Server error code → message in both languages. */
const ERRORS: Record<string, Msg> = {
  unauthorized: { tr: "Analiz için giriş yapmalısın.", en: "Sign in to run an analysis." },
  too_large: { tr: "Dosya 4 MB'tan büyük. Daha küçük bir dosya yükle veya bölerek gönder.", en: "The file is larger than 4 MB. Upload a smaller file or split it." },
  unsupported: { tr: "Bu dosya türü desteklenmiyor. PDF, Word (.docx) veya metin (.txt) yükle.", en: "Unsupported file type. Upload a PDF, Word (.docx) or text (.txt) file." },
  legacy_doc: { tr: "Eski Word (.doc) biçimi desteklenmiyor. Word'de “Farklı kaydet” ile .docx veya PDF olarak kaydedip tekrar yükle.", en: "Legacy .doc is not supported. In Word choose “Save as” .docx or PDF and upload again." },
  corrupt: { tr: "Dosya okunamadı; bozuk olabilir ya da uzantısı içeriğiyle uyuşmuyor.", en: "The file couldn't be read; it may be damaged or its extension doesn't match its content." },
  password_protected: { tr: "Dosya şifreli. Şifreyi kaldırıp tekrar yükle.", en: "The file is password-protected. Remove the password and upload again." },
  scanned_pdf: {
    tr: "Bu PDF taranmış bir görüntü gibi görünüyor (seçilebilir metin yok), bu yüzden analiz edilemedi. Önce OCR uygula (ör. Adobe Acrobat'ta “Tara ve OCR”) ya da metin tabanlı PDF / .docx yükle.",
    en: "This PDF looks like a scan (no selectable text), so it couldn't be analyzed. Run OCR first (e.g. “Scan & OCR” in Adobe Acrobat) or upload a text-based PDF / .docx.",
  },
  too_many_pages: { tr: "PDF 300 sayfadan uzun. İlgili bölümü ayırıp yükle.", en: "The PDF is longer than 300 pages. Split it and upload the relevant part." },
  empty: { tr: "Dosyada okunabilir metin bulunamadı.", en: "No readable text was found in the file." },
  extract_failed: { tr: "Dosya okunamadı. Başka bir biçimde dene.", en: "The file couldn't be read. Try another format." },
};

type Meta = { truncated?: boolean; missingPages?: { missing: number; total: number } | null };

/** Upload a case file (drag & drop or browse), POST it to /api/analyze, and show the result in a dialog. */
export function UploadButton({ className }: { className?: string }) {
  const { lang } = useLang();
  const tr = lang === "tr";
  const l = (m: Msg) => (tr ? m.tr : m.en);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [meta, setMeta] = useState<Meta>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  function reset() {
    setError(null);
    setResult(null);
    setMeta({});
    setSaveError(null);
    setFileName("");
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setOpen(true);
    reset();
    setFileName(file.name);

    // Fast client-side checks (the server re-validates everything).
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED.includes(ext)) return setError(l(ERRORS.unsupported));
    if (file.size > MAX_BYTES) return setError(l(ERRORS.too_large));
    if (file.size === 0) return setError(l(ERRORS.empty));

    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("lang", lang);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const known = data?.error ? ERRORS[data.error as string] : undefined;
        setError(known ? l(known) : (data?.message ?? (tr ? "Analiz başarısız oldu." : "Analysis failed.")));
      } else {
        setResult(data.analysis);
        setMeta({ truncated: data.truncated, missingPages: data.missingPages });
        setSaveError(data.saveError ?? null);
        if (data.id) window.dispatchEvent(new Event("clause:analysis-saved"));
      }
    } catch {
      setError(tr ? "Sunucuya ulaşılamadı." : "Could not reach the server.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
    }
  }

  const drop = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!busy) void onFile(e.dataTransfer.files?.[0]);
    },
  };

  const idle = !busy && !result && !error;

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => {
          if (!busy) {
            if (!result) reset();
            setOpen(true);
          }
        }}
        {...drop}
        disabled={busy}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60",
          dragging && "ring-2 ring-ring",
          className,
        )}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {tr ? "Dosya yükle" : "Upload case"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busy && setOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="label-mono text-primary">{tr ? "Analiz" : "Analysis"}</p>
                <h2 className="truncate font-display text-xl font-semibold">
                  {fileName || (tr ? "Dosya yükle" : "Upload a file")}
                </h2>
              </div>
              <button onClick={() => !busy && setOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {(idle || error) && (
              <div
                {...drop}
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                className={cn(
                  "mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40",
                )}
              >
                <FileText className="h-7 w-7 text-primary" />
                <p className="text-sm font-medium">
                  {tr ? "Dosyayı buraya sürükle ya da seçmek için tıkla" : "Drag a file here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tr
                    ? "PDF, Word (.docx), .txt, .md, .csv, .json · en fazla 4 MB · taranmış PDF'ler için önce OCR gerekir"
                    : "PDF, Word (.docx), .txt, .md, .csv, .json · up to 4 MB · scanned PDFs need OCR first"}
                </p>
              </div>
            )}

            {busy && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tr ? "Dosya okunuyor ve analiz ediliyor…" : "Reading and analyzing the file…"}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                {error}
              </p>
            )}
            {saveError && (
              <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-xs">
                {tr ? "Analiz kaydedilemedi: " : "Analysis was not saved: "}
                {saveError}
              </p>
            )}
            {meta.missingPages && (
              <p className="mt-4 rounded-lg bg-warning/15 p-3 text-xs text-warning-foreground">
                {tr
                  ? `PDF'in ${meta.missingPages.total} sayfasından ${meta.missingPages.missing} tanesinde okunabilir metin yok (taranmış olabilir). Analiz yalnızca metin içeren sayfalara dayanıyor.`
                  : `${meta.missingPages.missing} of ${meta.missingPages.total} PDF pages have no readable text (possibly scanned). The analysis only covers pages with text.`}
              </p>
            )}
            {meta.truncated && (
              <p className="mt-4 rounded-lg bg-warning/15 p-3 text-xs text-warning-foreground">
                {tr ? "Belge çok uzun; yalnızca ilk 100.000 karakter analiz edildi." : "The document is very long; only the first 100,000 characters were analyzed."}
              </p>
            )}
            {result && (
              <div className="mt-4">
                <AnalysisView result={result} />
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    inputRef.current?.click();
                  }}
                  className="mt-5 text-sm font-medium text-primary hover:underline"
                >
                  {tr ? "Başka bir dosya analiz et" : "Analyze another file"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
