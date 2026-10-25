"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Trash2, X } from "lucide-react";
import { AnalysisView } from "@/components/app/analysis-view";
import { useLang } from "@/components/i18n/language-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AnalysisRow } from "@/lib/analysis";
import { RISK_META, riskLabel, fmtDateTime } from "@/lib/risk";
import { cn } from "@/lib/utils";

/** The signed-in user's persisted analyses (RLS limits rows to their own). */
export function SavedAnalyses() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const [rows, setRows] = useState<AnalysisRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<AnalysisRow | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await createClient()
      .from("analyses")
      .select("id,file_name,file_size,overall_risk,summary,result,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) setError(error.message);
    else {
      setError(null);
      setRows(data as AnalysisRow[]);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase
    load();
    window.addEventListener("clause:analysis-saved", load);
    return () => window.removeEventListener("clause:analysis-saved", load);
  }, [load]);

  async function remove(row: AnalysisRow) {
    if (!confirm(tr ? "Bu analiz silinsin mi?" : "Delete this analysis?")) return;
    const supabase = createClient();
    const { data: meta } = await supabase.from("analyses").select("storage_path").eq("id", row.id).single();
    const { error } = await supabase.from("analyses").delete().eq("id", row.id);
    if (error) return setError(error.message);
    if (meta?.storage_path) await supabase.storage.from("case-files").remove([meta.storage_path]);
    setOpen(null);
    load();
  }

  if (!isSupabaseConfigured) return null;

  return (
    <section className="space-y-3">
      <h2 className="label-mono text-primary">{tr ? "Analizlerim" : "My analyses"}</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {rows === null && !error && (
          <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tr ? "Yükleniyor…" : "Loading…"}
          </p>
        )}
        {error && (
          <p className="p-5 text-sm text-muted-foreground">
            {tr ? "Analizler yüklenemedi: " : "Could not load analyses: "}
            {error}
            {/relation .* does not exist|schema cache/i.test(error) && (
              <span> — {tr ? "supabase/schema.sql dosyasını SQL Editor'da çalıştırın." : "run supabase/schema.sql in the SQL Editor."}</span>
            )}
          </p>
        )}
        {rows?.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">
            {tr ? "Henüz analiz yok. “Dosya yükle” ile başlayın." : "No analyses yet. Use “Upload case” to start."}
          </p>
        )}
        {rows?.map((r) => {
          const rm = RISK_META[r.overall_risk];
          return (
            <button
              key={r.id}
              onClick={() => setOpen(r)}
              className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-muted/50"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.file_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmtDateTime(r.created_at)} · {r.summary}
                </p>
              </div>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", rm.cls)}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: rm.color }} />
                {riskLabel(r.overall_risk, lang)}
              </span>
              <span className="tnum w-8 text-right text-sm font-semibold">{r.result.findings?.length ?? 0}</span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="label-mono text-primary">{fmtDateTime(open.created_at)}</p>
                <h2 className="truncate font-display text-xl font-semibold">{open.file_name}</h2>
              </div>
              <button onClick={() => remove(open)} className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <AnalysisView result={open.result} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
