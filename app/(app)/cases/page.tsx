"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   CASES — the full case-file list with a fast triage drawer (condensed
   executive summary; the full 8-section report lives at /reports). Renders
   from lib/demo/data.ts (demo mode); real data replaces it once hafiza-indexle
   + hukuk-sorgula keys are wired via setup. Bilingual, inline-SVG only.
   ───────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { SavedAnalyses } from "@/components/app/saved-analyses";
import { UploadButton } from "@/components/app/upload-button";
import { Search, Filter, TriangleAlert, FolderSearch } from "lucide-react";
import { ExecutiveSummaryCard } from "@/components/app/report-viewer";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { RISK_META, STATUS_META, CATEGORY_COLOR, riskLabel, statusLabel, fmtDateTime } from "@/lib/risk";
import { cases, type RiskLevel } from "@/lib/demo/data";

const RISK_FILTERS: (RiskLevel | "all")[] = ["all", "critical", "high", "medium", "low"];

export default function CasesPage() {
  const { lang } = useLang();
  const [selectedId, setSelectedId] = useState<string | null>(cases[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const rows = useMemo(
    () =>
      cases.filter((c) => {
        const matchesQuery =
          !query ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.client.toLowerCase().includes(query.toLowerCase());
        const matchesRisk = riskFilter === "all" || c.overallRisk === riskFilter;
        return matchesQuery && matchesRisk;
      }),
    [query, riskFilter],
  );

  const counts: Record<RiskLevel | "all", number> = {
    all: cases.length,
    critical: cases.filter((c) => c.overallRisk === "critical").length,
    high: cases.filter((c) => c.overallRisk === "high").length,
    medium: cases.filter((c) => c.overallRisk === "medium").length,
    low: cases.filter((c) => c.overallRisk === "low").length,
  };

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="label-mono text-primary">{lang === "tr" ? "Çalışma alanı" : "Workspace"}</p>
          <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight">
            {lang === "tr" ? "Dosyalar" : "Cases"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {lang === "tr"
              ? "Her dosya çelişkiler için taranır, risk skorlanır ve analiz kriterlerine göre denetlenir."
              : "Every case is scanned for contradictions, risk-scored, and audited against your analysis criteria."}
          </p>
        </div>
        <UploadButton className="ml-auto" />
      </div>

      <div className="mt-6">
        <SavedAnalyses />
      </div>

      <div className={cn("mt-6 grid gap-6", selected ? "xl:grid-cols-[1fr_390px]" : "grid-cols-1")}>
        {/* ── List column ──────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "tr" ? "Dosya veya müvekkil ara…" : "Search case or client…"}
                className="w-40 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:w-56"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {RISK_FILTERS.map((rf) => {
                const active = riskFilter === rf;
                const label = rf === "all" ? (lang === "tr" ? "Tümü" : "All") : riskLabel(rf, lang);
                return (
                  <button
                    key={rf}
                    onClick={() => setRiskFilter(rf)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium capitalize transition-colors",
                      active ? "nav-pill-active text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {rf !== "all" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK_META[rf].color }} />}
                    {label}
                    <span className="tnum text-[11px] text-muted-foreground">{counts[rf]}</span>
                  </button>
                );
              })}
            </div>
            <button className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {lang === "tr" ? "Filtre" : "Filter"}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="label-mono py-2.5 pl-4 font-medium text-muted-foreground">{lang === "tr" ? "Dosya" : "Case"}</th>
                    <th className="label-mono py-2.5 font-medium text-muted-foreground">{lang === "tr" ? "Kategori" : "Category"}</th>
                    <th className="label-mono py-2.5 font-medium text-muted-foreground">{lang === "tr" ? "Risk" : "Risk"}</th>
                    <th className="label-mono py-2.5 font-medium text-muted-foreground">{lang === "tr" ? "Durum" : "Status"}</th>
                    <th className="label-mono py-2.5 pr-4 text-right font-medium text-muted-foreground">{lang === "tr" ? "Bulgu" : "Findings"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isSel = row.id === selectedId;
                    const rm = RISK_META[row.overallRisk];
                    const sm = STATUS_META[row.status];
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "cursor-pointer border-b border-border/60 transition-colors last:border-0",
                          isSel ? "bg-primary/[0.04]" : "hover:bg-muted/50",
                        )}
                      >
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white"
                              style={{ background: CATEGORY_COLOR[row.category] }}
                            >
                              {row.category.slice(0, 3).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold leading-tight">{row.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {row.client} · {fmtDateTime(row.received)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {row.category}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", rm.cls)}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: rm.color }} />
                            {riskLabel(row.overallRisk, lang)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", sm.cls)}>
                            {statusLabel(row.status, lang)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="inline-flex items-center gap-1 tnum font-semibold">
                            <TriangleAlert className="h-3 w-3 text-muted-foreground" />
                            {row.findingsCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                        <FolderSearch className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        {lang === "tr" ? "Eşleşen dosya yok." : "No matching cases."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Triage drawer ─────────────────────────────────────────── */}
        {selected && (
          <aside className="animate-float-up xl:sticky xl:top-2 xl:self-start">
            <ExecutiveSummaryCard caseFile={selected} />
          </aside>
        )}
      </div>
    </div>
  );
}
