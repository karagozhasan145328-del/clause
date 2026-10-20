"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   REPORTS — the full 8-section (+ chat log) AI risk report for a selected case.
   A compact case picker on the left (search + list), the full ReportViewer on
   the right. Selection is local useState, seeded from the ?case= URL param —
   this kit has no [id] dynamic route segments, so every page uses this pattern.
   ───────────────────────────────────────────────────────────────────────────── */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FolderSearch } from "lucide-react";
import { ReportViewer } from "@/components/app/report-viewer";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { RISK_META, CATEGORY_COLOR, riskLabel } from "@/lib/risk";
import { cases } from "@/lib/demo/data";

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsPageInner />
    </Suspense>
  );
}

function ReportsPageInner() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const paramId = searchParams.get("case");
  const initialId = cases.find((c) => c.id === paramId)?.id ?? cases[0]?.id ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [query, setQuery] = useState("");

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const rows = useMemo(
    () =>
      cases.filter(
        (c) =>
          !query ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.client.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="label-mono text-primary">{lang === "tr" ? "Kütüphane" : "Library"}</p>
          <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight">
            {lang === "tr" ? "Raporlar" : "Reports"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {lang === "tr"
              ? "Her dosya için 8 bölümlük hukuki risk raporu — özetten sohbet kaydına kadar."
              : "The 8-section legal risk report for every case — from executive summary to the chat log."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ── Case picker ──────────────────────────────────────────── */}
        <div className="min-w-0 space-y-3 lg:sticky lg:top-2 lg:self-start">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm shadow-pill">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "tr" ? "Dosya veya müvekkil ara…" : "Search case or client…"}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
          </div>

          <div className="max-h-[calc(100dvh-220px)] overflow-y-auto rounded-2xl border border-border bg-card shadow-soft">
            <div className="divide-y divide-border/60">
              {rows.map((c) => {
                const isSel = c.id === selectedId;
                const rm = RISK_META[c.overallRisk];
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 p-3 text-left transition-colors",
                      isSel ? "bg-primary/[0.06]" : "hover:bg-muted/50",
                    )}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: CATEGORY_COLOR[c.category] }}
                    >
                      {c.category.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold leading-tight">{c.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.client}</p>
                    </div>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: rm.color }}
                      title={riskLabel(c.overallRisk, lang)}
                    />
                  </button>
                );
              })}
              {rows.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <FolderSearch className="mx-auto mb-2 h-5 w-5 opacity-50" />
                  {lang === "tr" ? "Eşleşen dosya yok." : "No matching cases."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Full report ──────────────────────────────────────────── */}
        <div className="min-w-0">
          {selected ? (
            <ReportViewer caseFile={selected} />
          ) : (
            <div className="rounded-2xl border border-border bg-card py-24 text-center text-sm text-muted-foreground shadow-soft">
              {lang === "tr" ? "Görüntülemek için bir dosya seçin." : "Select a case to view its report."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
