"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  TriangleAlert,
  Library,
  BookMarked,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { AreaChart, RiskDonut } from "@/components/app/charts";
import { ExecutiveSummaryCard } from "@/components/app/report-viewer";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { RISK_META, STATUS_META, CATEGORY_COLOR, riskLabel, statusLabel, fmtDateTime } from "@/lib/risk";
import {
  cases,
  stats,
  riskDistribution,
  riskByCategory,
  analysisTimeTrend,
  analysisTimeMeta,
  riskPatterns,
  analysisCriteria,
  activity,
} from "@/lib/demo/data";

export default function DashboardPage() {
  const { t, lang } = useLang();
  const [selectedId, setSelectedId] = useState<string | null>(cases[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [query, setQuery] = useState("");

  const selected = cases.find((c) => c.id === selectedId) ?? null;
  const maxCategory = Math.max(...riskByCategory.map((r) => r.reviewed));
  const lastMinutes = analysisTimeTrend[analysisTimeTrend.length - 1]?.value ?? 0;

  const rows = cases.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.client.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-in">
      <div className={cn("grid gap-6", drawerOpen ? "xl:grid-cols-[1fr_390px]" : "grid-cols-1")}>
        {/* ── Main column ──────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="label-mono text-primary">{lang === "tr" ? "Çalışma alanı" : "Workspace"}</p>
              <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight">
                {lang === "tr" ? "Analiz paneli" : "Analysis desk"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {lang === "tr"
                  ? "Müvekkil sohbetlerindeki çelişkileri işaretle, hukuki dayanakla eşleştir, riski skorla."
                  : "Flag contradictions in client conversations, match them to legal basis, and risk-score every case."}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-[13px] font-medium text-foreground shadow-pill transition-colors hover:bg-muted">
                <BookMarked className="h-4 w-4 text-muted-foreground" />
                {lang === "tr" ? "Analiz kriterleri" : "Criteria"}
              </button>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                <Upload className="h-3.5 w-3.5" />
                {lang === "tr" ? "Dosya yükle" : "Upload case"}
              </button>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => {
              const up = (s.delta ?? 0) >= 0;
              const goodDown = s.label.en === "Avg analysis time"; // down is good for time
              return (
                <div key={t(s.label)} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Icon name={s.icon} className="h-4 w-4" />
                    </span>
                    {s.delta !== undefined && s.delta !== 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                          (goodDown ? !up : up) ? "text-success" : "text-destructive",
                        )}
                      >
                        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(s.delta).toFixed(goodDown ? 0 : 1)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-3 tnum text-[26px] font-bold leading-none">{s.value}</p>
                  <p className="mt-1.5 text-[12.5px] font-medium text-muted-foreground">{t(s.label)}</p>
                  {s.hint && <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground/80">{t(s.hint)}</p>}
                </div>
              );
            })}
          </div>

          {/* Cases list */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-4">
              <h2 className="font-display text-[16px] font-semibold tracking-tight">
                {lang === "tr" ? "Dosyalar" : "Cases"}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tnum">
                {cases.length}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={lang === "tr" ? "Dosya veya müvekkil ara…" : "Search case or client…"}
                    className="w-36 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:w-48"
                  />
                </div>
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  {lang === "tr" ? "Filtre" : "Filter"}
                </button>
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  {lang === "tr" ? "Sırala" : "Sort"}
                </button>
              </div>
            </div>

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
                        onClick={() => {
                          setSelectedId(row.id);
                          setDrawerOpen(true);
                        }}
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
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk distribution + analysis time */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {/* Risk distribution donut */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h3 className="font-display text-[15px] font-semibold tracking-tight">
                  {lang === "tr" ? "Risk dağılımı" : "Risk distribution"}
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <RiskDonut segments={riskDistribution.map((r) => ({ label: t(r.label), value: r.value, color: r.color }))} />
                <div className="flex-1 space-y-2.5">
                  {riskDistribution.map((r) => (
                    <div key={r.level} className="flex items-center gap-2 text-[13px]">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                      <span className="font-medium">{t(r.label)}</span>
                      <span className="ml-auto tnum text-muted-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis time area chart */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight">{t(analysisTimeMeta.title)}</h3>
                  <p className="text-xs text-muted-foreground">{t(analysisTimeMeta.subtitle)}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <ArrowDownRight className="h-3 w-3" />
                  {analysisTimeMeta.delta}
                </span>
              </div>
              <p className="mt-3 tnum text-2xl font-bold leading-none">{lastMinutes} {lang === "tr" ? "dk" : "min"}</p>
              <div className="mt-3">
                <AreaChart data={analysisTimeTrend.map((v) => v.value)} labels={analysisTimeTrend.map((v) => v.label)} height={150} />
              </div>
            </div>
          </div>

          {/* Risk by category */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-display text-[15px] font-semibold tracking-tight">
              {lang === "tr" ? "Kategoriye göre risk" : "Risk by category"}
            </h3>
            <div className="mt-4 space-y-3.5">
              {riskByCategory.map((r) => (
                <div key={r.category}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="grid h-6 w-9 place-items-center rounded text-[10px] font-bold text-white" style={{ background: CATEGORY_COLOR[r.category] }}>
                        {r.category.slice(0, 3).toUpperCase()}
                      </span>
                      {r.category}
                    </span>
                    <span className="tnum text-muted-foreground">
                      {r.flagged} {lang === "tr" ? "işaretli" : "flagged"} / {r.reviewed}
                    </span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-primary/25" style={{ width: `${(r.reviewed / maxCategory) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.flagged / maxCategory) * 100}%`, background: "var(--color-risk-high)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk pattern library + Analysis criteria */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Risk pattern library */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-[15px] font-semibold tracking-tight">
                    {lang === "tr" ? "Risk kalıp kütüphanesi" : "Risk pattern library"}
                  </h3>
                </div>
                <Link href="/library" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
                  {lang === "tr" ? "Tümü" : "View all"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-border/60">
                {riskPatterns.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-4">
                    <p className="text-[13px] font-semibold">{t(p.topic)}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] p-2.5">
                        <p className="label-mono text-destructive">{lang === "tr" ? "Örnek ifade" : "Example phrase"}</p>
                        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{t(p.examplePhrase)}</p>
                      </div>
                      <div className="rounded-lg border border-success/20 bg-success/[0.05] p-2.5">
                        <p className="label-mono text-success">{lang === "tr" ? "Neden önemli" : "Why it matters"}</p>
                        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{t(p.whyItMatters)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis criteria */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-[15px] font-semibold tracking-tight">
                    {lang === "tr" ? "Analiz kriterleri" : "Analysis criteria"}
                  </h3>
                </div>
                <Link href="/criteria" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
                  {lang === "tr" ? "Tümü" : "View all"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-border/60">
                {analysisCriteria.map((c) => {
                  const rm = RISK_META[c.severity];
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3.5">
                      <span className="tnum w-12 shrink-0 text-[11px] font-semibold text-muted-foreground">{c.ref}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{t(c.title)}</p>
                        <p className="truncate text-[11.5px] text-muted-foreground">{t(c.threshold)}</p>
                      </div>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: rm.color }} title={riskLabel(c.severity, lang)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right drawer: condensed executive summary + activity feed ────── */}
        {drawerOpen && selected && (
          <aside className="animate-float-up xl:sticky xl:top-2 xl:self-start">
            <ExecutiveSummaryCard caseFile={selected} />

            {/* Activity feed */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display text-[15px] font-semibold tracking-tight">
                {lang === "tr" ? "Son hareketler" : "Recent activity"}
              </h3>
              <div className="mt-3.5 space-y-3.5">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        a.tone === "success" ? "bg-success" : a.tone === "warning" ? "bg-warning" : a.tone === "info" ? "bg-info" : "bg-muted-foreground",
                      )}
                    />
                    <div className="min-w-0 text-[13px]">
                      <p className="leading-snug">
                        <span className="font-semibold">{a.who}</span>{" "}
                        <span className="text-muted-foreground">{t(a.action)}</span>{" "}
                        <span className="font-medium">{a.target}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{fmtDateTime(a.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
