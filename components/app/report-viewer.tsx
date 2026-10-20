"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   report-viewer.tsx — two views over a CaseFile's 8-section AI risk report:

   - ExecutiveSummaryCard: condensed, used in the dashboard/cases right drawer.
   - ReportViewer: full tabbed view (the /reports page), one tab per report
     section plus a chat-log tab.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import {
  Info,
  Clock,
  FileSearch,
  LayoutGrid,
  Users,
  Scale,
  ListChecks,
  CheckCircle2,
  MessageCircle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { RISK_META, CATEGORY_COLOR, riskLabel } from "@/lib/risk";
import { ScoreMeter } from "@/components/app/charts";
import { RiskMatrixGrid } from "@/components/app/risk-matrix";
import { ChronologicalTimeline } from "@/components/app/timeline";
import { RecommendationTiers } from "@/components/app/recommendation-tiers";
import { ChatTimeline } from "@/components/app/chat-timeline";
import type { CaseFile } from "@/lib/demo/data";

/* ── Condensed executive-summary card (dashboard / cases drawer) ───────────── */
export function ExecutiveSummaryCard({ caseFile }: { caseFile: CaseFile }) {
  const { t, lang } = useLang();
  const rm = RISK_META[caseFile.overallRisk];
  const es = caseFile.report.executiveSummary;
  const topRisks = caseFile.report.riskMatrix.slice(0, 3);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
      {/* Case header */}
      <div className="rounded-xl border border-border bg-muted/40 p-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: CATEGORY_COLOR[caseFile.category] }}
          >
            {caseFile.category.slice(0, 3).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold leading-tight">{caseFile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{caseFile.client}</p>
          </div>
        </div>
      </div>

      {/* Overall risk + headline */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label-mono text-muted-foreground">{lang === "tr" ? "Genel risk" : "Overall risk"}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", rm.cls)}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: rm.color }} />
            {riskLabel(caseFile.overallRisk, lang)} · {caseFile.score}/100
          </span>
        </div>
        <ScoreMeter score={caseFile.score} color={rm.color} />
        <p className="mt-3 text-[12.5px] leading-snug text-foreground/80">{t(es.headline)}</p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2.5">
        {es.keyNumbers.map((k) => (
          <div key={t(k.label)} className="rounded-xl border border-border p-3 text-center">
            <p className="tnum text-[15px] font-bold leading-tight">{k.value}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-muted-foreground">{t(k.label)}</p>
          </div>
        ))}
      </div>

      {/* Top risk-matrix items */}
      <div>
        <p className="label-mono mb-2 text-muted-foreground">{lang === "tr" ? "Öne çıkan riskler" : "Top risks"}</p>
        <div className="space-y-2">
          {topRisks.map((item) => {
            const irm = RISK_META[item.level];
            return (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-[12px]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: irm.color }} />
                <span className="min-w-0 flex-1 truncate">{t(item.risk)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href={`/reports?case=${caseFile.id}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {lang === "tr" ? "Tam raporu gör" : "View full report"}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ── Full 8-section (+ chat) tabbed report viewer (/reports page) ──────────── */
type Tab = "summary" | "timeline" | "evidence" | "matrix" | "parties" | "legal" | "recommendations" | "conclusion" | "chat";

const TABS: { key: Tab; icon: typeof Info; label: { tr: string; en: string } }[] = [
  { key: "summary", icon: Info, label: { tr: "Özet", en: "Summary" } },
  { key: "timeline", icon: Clock, label: { tr: "Zaman Akışı", en: "Timeline" } },
  { key: "evidence", icon: FileSearch, label: { tr: "Deliller", en: "Evidence" } },
  { key: "matrix", icon: LayoutGrid, label: { tr: "Risk Matrisi", en: "Risk Matrix" } },
  { key: "parties", icon: Users, label: { tr: "Taraflar", en: "Parties" } },
  { key: "legal", icon: Scale, label: { tr: "Hukuki Dayanak", en: "Legal Basis" } },
  { key: "recommendations", icon: ListChecks, label: { tr: "Öneriler", en: "Recommendations" } },
  { key: "conclusion", icon: CheckCircle2, label: { tr: "Sonuç", en: "Conclusion" } },
  { key: "chat", icon: MessageCircle, label: { tr: "Sohbet Kaydı", en: "Chat Log" } },
];

const STRENGTH_CLS: Record<string, string> = {
  strong: "text-success bg-success/10",
  moderate: "text-warning-foreground bg-warning/15",
  weak: "text-muted-foreground bg-muted",
};

const STRENGTH_LABEL: Record<string, { tr: string; en: string }> = {
  strong: { tr: "güçlü", en: "strong" },
  moderate: { tr: "orta", en: "moderate" },
  weak: { tr: "zayıf", en: "weak" },
};

export function ReportViewer({ caseFile }: { caseFile: CaseFile }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("summary");
  const r = caseFile.report;
  const rm = RISK_META[caseFile.overallRisk];

  return (
    <div className="space-y-5">
      {/* Decision-support banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground shadow-pill">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          {lang === "tr"
            ? "Bu rapor bir karar değil, karar desteğidir — nihai değerlendirme sizindir. Kurgusal senaryodur, gerçek müvekkil verisi içermez."
            : "This report is not a decision, it's decision support — the final judgment is yours. Fictional scenario, contains no real client data."}
        </span>
      </div>

      {/* Case header */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-white"
          style={{ background: CATEGORY_COLOR[caseFile.category] }}
        >
          {caseFile.category.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[16px] font-semibold leading-tight tracking-tight">{caseFile.name}</p>
          <p className="truncate text-xs text-muted-foreground">{caseFile.client}</p>
        </div>
        <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold capitalize", rm.cls)}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: rm.color }} />
          {riskLabel(caseFile.overallRisk, lang)} · {caseFile.score}/100
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-pill">
        {TABS.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tb.icon className="h-3.5 w-3.5" />
              {lang === "tr" ? tb.label.tr : tb.label.en}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="ink-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
        {tab === "summary" && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-foreground/85">{t(r.executiveSummary.headline)}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {r.executiveSummary.keyNumbers.map((k) => (
                <div key={t(k.label)} className="rounded-xl border border-border p-3.5 text-center">
                  <p className="tnum text-xl font-bold leading-none">{k.value}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{t(k.label)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "timeline" && <ChronologicalTimeline events={r.timeline} />}

        {tab === "evidence" && (
          <div className="space-y-3">
            {r.evidence.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-border p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold leading-tight">{t(ev.title)}</p>
                    <p className="text-[11px] text-muted-foreground">{t(ev.source)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize", STRENGTH_CLS[ev.strength])}>
                    {lang === "tr" ? STRENGTH_LABEL[ev.strength].tr : STRENGTH_LABEL[ev.strength].en}
                  </span>
                </div>
                <p className="mt-2 rounded-lg bg-muted/50 p-2.5 font-display text-[12px] italic leading-snug text-foreground/85">{ev.excerpt}</p>
                <p className="mt-2 text-[12px] leading-snug text-muted-foreground">{t(ev.supports)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "matrix" && <RiskMatrixGrid items={r.riskMatrix} />}

        {tab === "parties" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {r.parties.map((p) => (
              <div key={t(p.party)} className="rounded-xl border border-border p-3.5">
                <p className="text-[13.5px] font-semibold leading-tight">{t(p.party)}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{t(p.toneLabel)}</span>
                  <span className="tnum">{p.toneScore}/100</span>
                </div>
                <div className="mt-1">
                  <ScoreMeter score={p.toneScore} color={p.toneScore >= 60 ? "var(--color-risk-low)" : p.toneScore >= 35 ? "var(--color-risk-medium)" : "var(--color-risk-high)"} />
                </div>
                {p.strengths.length > 0 && (
                  <div className="mt-3">
                    <p className="label-mono text-success">{lang === "tr" ? "Güçlü yönler" : "Strengths"}</p>
                    <ul className="mt-1 space-y-0.5">
                      {p.strengths.map((s) => (
                        <li key={t(s)} className="text-[12px] leading-snug text-foreground/80">
                          + {t(s)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.weaknesses.length > 0 && (
                  <div className="mt-2">
                    <p className="label-mono text-destructive">{lang === "tr" ? "Zayıf yönler" : "Weaknesses"}</p>
                    <ul className="mt-1 space-y-0.5">
                      {p.weaknesses.map((w) => (
                        <li key={t(w)} className="text-[12px] leading-snug text-foreground/80">
                          − {t(w)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "legal" && (
          <div className="space-y-3">
            {r.legalBasis.map((lb) => (
              <div key={lb.id} className="rounded-xl border border-border p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-md border border-primary/25 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">{lb.statute}</span>
                  {lb.precedent && (
                    <span className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">{lb.precedent}</span>
                  )}
                </div>
                <p className="mt-2 text-[13px] font-semibold leading-tight">{t(lb.title)}</p>
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{t(lb.relevance)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "recommendations" && <RecommendationTiers items={r.recommendations} />}

        {tab === "conclusion" && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-foreground/85">{t(r.conclusion.summary)}</p>
            {r.conclusion.urgentActions.length > 0 && (
              <div>
                <p className="label-mono mb-2 text-destructive">{lang === "tr" ? "Acil aksiyonlar" : "Urgent actions"}</p>
                <div className="space-y-2">
                  {r.conclusion.urgentActions.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/[0.04] p-3">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-destructive/50" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold leading-snug">{t(a.action)}</p>
                        <p className="text-[11px] text-muted-foreground">{t(a.deadline)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "chat" && <ChatTimeline messages={caseFile.chatSample} />}
      </div>
    </div>
  );
}
