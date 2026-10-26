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
    tr: "Bu PDF taranmış bir görüntü gibi görünüyor (seçilebilir metin yok). OCR ile okutabilirsin.",
    en: "This PDF looks like a scan (no selectable text). You can have it read with OCR.",
  },
  ocr_too_many_pages: { tr: "OCR en fazla 20 sayfalık dosyaları destekliyor. PDF'i bölüp ilgili kısmı yükle.", en: "OCR supports files of up to 20 pages. Split the PDF and upload the relevant part." },
  ocr_timeout: { tr: "OCR çok uzun sürdü. Daha az sayfalı bir dosya dene.", en: "OCR took too long. Try a file with fewer pages." },
  ocr_failed: { tr: "OCR servisine ulaşılamadı veya hata verdi. Biraz sonra tekrar dene.", en: "The OCR service failed or was unreachable. Try again shortly." },
  ocr_empty: { tr: "Taranmış sayfalarda okunabilir metin tanınamadı. Tarama kalitesi düşük olabilir.", en: "No readable text could be recognized in the scan. The scan quality may be too low." },
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
  const [needsOcr, setNeedsOcr] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);

  function reset() {
    setNeedsOcr(false);
    setError(null);
    setResult(null);
    setMeta({});
    setSaveError(null);
    setFileName("");
  }

  async function onFile(file: File | undefined, ocr = false) {
    if (!file) return;
    setLastFile(file);
    setOpen(true);
    reset();
    setOcrBusy(ocr);
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
    if (ocr) body.append("ocr", "1"); // explicit opt-in: a scanned PDF is then read by OpenAI
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const known = data?.error ? ERRORS[data.error as string] : undefined;
        setError(known ? l(known) : (data?.message ?? (tr ? "Analiz başarısız oldu." : "Analysis failed.")));
        if (data?.error === "scanned_pdf") setNeedsOcr(true);
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
      setOcrBusy(false);
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
                    ? "PDF, Word (.docx), .txt, .md, .csv, .json · en fazla 4 MB · taranmış PDF'ler için OCR seçeneği sunulur"
                    : "PDF, Word (.docx), .txt, .md, .csv, .json · up to 4 MB · OCR is offered for scanned PDFs"}
                </p>
              </div>
            )}

            {busy && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {ocrBusy
                  ? tr
                    ? "Taranmış sayfalar OCR ile okunuyor, ardından analiz ediliyor… (30-60 sn sürebilir)"
                    : "Reading the scanned pages with OCR, then analyzing… (can take 30-60 s)"
                  : tr
                    ? "Dosya okunuyor ve analiz ediliyor…"
                    : "Reading and analyzing the file…"}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                {error}
              </p>
            )}
            {needsOcr && lastFile && (
              <OcrOffer
                tr={tr}
                label={tr ? "OCR ile oku ve analiz et" : "Read with OCR and analyze"}
                onClick={() => void onFile(lastFile, true)}
              />
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
            {meta.missingPages && lastFile && !result?.ocr && (
              <OcrOffer
                tr={tr}
                label={
                  tr
                    ? `Taranmış ${meta.missingPages.missing} sayfayı OCR ile oku ve yeniden analiz et`
                    : `Read the ${meta.missingPages.missing} scanned page(s) with OCR and re-analyze`
                }
                onClick={() => void onFile(lastFile, true)}
              />
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

/** OCR opt-in: the button plus the privacy / accuracy notice shown right next to it. */
function OcrOffer({ tr, label, onClick }: { tr: boolean; label: string; onClick: () => void }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground hover:opacity-90"
      >
        {label}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        {tr
          ? "Gizlilik: OCR için taranmış sayfalar OpenAI'ye gönderilir (yurt dışına aktarım). Müvekkil verisi içeriyorsa KVKK yükümlülüklerinizi değerlendirin. En fazla 20 taranmış sayfa. Dijital metin sayfaları olduğu gibi kalır. OCR hata yapabilir; sonucu orijinal belgeyle karşılaştırın."
          : "Privacy: for OCR the scanned pages are sent to OpenAI (cross-border transfer). If they contain client data, assess your KVKK obligations. Up to 20 scanned pages. Digital-text pages are kept as they are. OCR can misread; compare the result with the original."}
      </p>
    </div>
  );
}
