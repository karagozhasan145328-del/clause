"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { AnalysisView } from "@/components/app/analysis-view";
import type { Analysis } from "@/lib/analysis";
import { cn } from "@/lib/utils";

/** Upload a case file, POST it to /api/analyze, and show the result in a dialog. */
export function UploadButton({ className }: { className?: string }) {
  const { lang } = useLang();
  const tr = lang === "tr";
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setOpen(true);
    setBusy(true);
    setError(null);
    setResult(null);
    setSaveError(null);
    setFileName(file.name);

    const body = new FormData();
    body.append("file", file);
    body.append("lang", lang);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? (tr ? "Analiz başarısız oldu." : "Analysis failed."));
      } else {
        setResult(data.analysis);
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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.log,text/plain"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60",
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
                <h2 className="truncate font-display text-xl font-semibold">{fileName}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {busy && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tr ? "Dosya analiz ediliyor…" : "Analyzing the file…"}
              </p>
            )}
            {error && <p className="mt-6 rounded-lg border border-border bg-muted p-3 text-sm">{error}</p>}
            {saveError && (
              <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-xs">
                {tr ? "Analiz kaydedilemedi: " : "Analysis was not saved: "}
                {saveError}
              </p>
            )}
            {result && (
              <div className="mt-4">
                <AnalysisView result={result} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
