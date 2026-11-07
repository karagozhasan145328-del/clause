"use client";

import { useState } from "react";
import { ShieldAlert, Siren } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { RISK_META, riskLabel } from "@/lib/risk";
import { LEVELS3, SEVERITY_RANK, normalizeSeverity, type Analysis, type Finding } from "@/lib/analysis";
import { ChecklistTab, ComparisonTab, CopyButton } from "@/components/app/report-tabs";
import { cn } from "@/lib/utils";

type Tab = "report" | "comparison" | "checklist";

/** Renders a stored/returned analysis: findings ranked most-severe first, with legal basis and a suggested fix. */
export function AnalysisView({ result }: { result: Analysis }) {
  const { lang } = useLang();
  const tr = lang === "tr";

  // Re-sort here too: rows saved before the sorted schema (or by older code) may be unordered.
  const findings = [...(result.findings ?? [])].sort(
    (a, b) => SEVERITY_RANK[normalizeSeverity(a.severity)] - SEVERITY_RANK[normalizeSeverity(b.severity)],
  );
  const overall = normalizeSeverity(result.overallRisk);
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    const k = normalizeSeverity(f.severity);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const [tab, setTab] = useState<Tab>("report");
  const comparison = result.comparison;
  const checklist = result.checklist ?? [];
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "report", label: tr ? "Rapor" : "Report", count: findings.length },
    ...(comparison ? [{ id: "comparison" as const, label: tr ? "Belge karşılaştırması" : "Cross-document", count: comparison.discrepancies.length }] : []),
    ...(checklist.length ? [{ id: "checklist" as const, label: tr ? "Sunum öncesi kontrol" : "Pre-submission check", count: checklist.length }] : []),
  ];

  const fixes = findings.map((f) => f.suggestedFix?.trim()).filter((x): x is string => Boolean(x));

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{tr ? "Genel risk:" : "Overall risk:"}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${RISK_META[overall].cls}`}>
          {riskLabel(overall, lang)}
        </span>
        {LEVELS3.map((k) =>
          counts[k] ? (
            <span key={k} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${RISK_META[k].cls}`}>
              {counts[k]} {riskLabel(k, lang)}
            </span>
          ) : null,
        )}
      </div>

      <p className="text-muted-foreground">{result.summary}</p>

      {result.removedCitations ? (
        <p className="flex items-start gap-2 rounded-lg bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {tr
            ? `Doğrulanamayan ${result.removedCitations} mahkeme kararı atfı güvenlik nedeniyle çıkarıldı. Emsal karar için kendi kaynaklarınızı kullanın.`
            : `${result.removedCitations} unverifiable court-decision citation(s) were removed for safety. Use your own sources for case law.`}
        </p>
      ) : null}

      {result.ocr ? (
        <p className="flex items-start gap-2 rounded-lg bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {tr
            ? `${result.ocrPages ? `Belgenin ${result.ocrPages} taranmış sayfası OCR ile okundu (diğer sayfalar dijital metin).` : "Bu belge taranmış PDF'ten OCR ile okundu."} Rakam, isim ve tarihlerde okuma hatası olabilir; alıntıları ve tutarları orijinal belgeyle karşılaştırın.`
            : `${result.ocrPages ? `${result.ocrPages} scanned page(s) were read via OCR (the rest is digital text).` : "This document was read from a scanned PDF via OCR."} Digits, names and dates may be misread; compare quotes and amounts with the original.`}
        </p>
      ) : null}

      {result.blankedFigures ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {tr
            ? `Önerilen metinlerde belgede bulunmayan ${result.blankedFigures} tutar/oran/süre uydurmamak için boş bırakıldı (köşeli parantez). Metni kullanmadan önce doldurun.`
            : `${result.blankedFigures} amount/rate/period in the proposed text was not in the document and was left blank (square brackets). Fill it in before use.`}
        </p>
      ) : null}

      {result.criticalSummary && result.criticalSummary.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
            <Siren className="h-3.5 w-3.5" />
            {tr ? "Kritik risk özeti" : "Critical risk summary"}
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            {result.criticalSummary.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {tabs.length > 1 && (
        <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px cursor-pointer border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{t.count}</span>}
            </button>
          ))}
        </div>
      )}

      {tab === "comparison" && comparison && <ComparisonTab comparison={comparison} tr={tr} />}
      {tab === "checklist" && checklist.length > 0 && <ChecklistTab items={checklist} tr={tr} />}

      {tab === "report" && findings.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="label-mono text-muted-foreground">
              {tr ? `Bulgular · öncelik sırasıyla (${findings.length})` : `Findings · by priority (${findings.length})`}
            </h3>
            {fixes.length > 0 && (
              <CopyButton
                text={fixes.join("\n\n")}
                label={tr ? `Tüm madde önerilerini kopyala (${fixes.length})` : `Copy all clause proposals (${fixes.length})`}
                tr={tr}
              />
            )}
          </div>
          <ol className="space-y-3">
            {findings.map((f, i) => (
              <FindingCard key={i} finding={f} rank={i + 1} tr={tr} lang={lang} />
            ))}
          </ol>
        </div>
      )}

      {tab === "report" && (
        <>
          <Section title={tr ? "Çelişkiler" : "Contradictions"} items={result.contradictions} />
          <Section title={tr ? "Öneriler" : "Recommendations"} items={result.recommendations} />
        </>
      )}

      <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
        {tr
          ? "Bu çıktı bir karar destek aracıdır, hukuki mütalaa değildir. Kanun atıfları ve önerilen metinler avukat tarafından doğrulanmalıdır."
          : "This output is a decision-support aid, not legal advice. Statute references and suggested wording must be verified by a lawyer."}
      </p>
    </div>
  );
}

function FindingCard({ finding: f, rank, tr, lang }: { finding: Finding; rank: number; tr: boolean; lang: "tr" | "en" }) {
  const sev = normalizeSeverity(f.severity);
  const meta = RISK_META[sev];
  return (
    <li className="rounded-xl border border-border bg-card p-3.5" style={{ borderLeft: `4px solid ${meta.color}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">#{rank}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>
          {riskLabel(sev, lang)}
        </span>
        <span className="font-semibold">{f.title}</span>
        {f.document && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{f.document}</span>}
      </div>

      {f.legalBasis && f.legalBasis.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {f.legalBasis.map((b, i) => (
            <span key={i} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">
              {b}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2">{f.detail}</p>

      {f.evidence && (
        <blockquote className="mt-2 border-l-2 border-border pl-2 text-xs text-muted-foreground">{f.evidence}</blockquote>
      )}

      {f.suggestedFix && (
        <div className="mt-2.5 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="label-mono text-primary">{tr ? "Alternatif madde metni" : "Replacement clause text"}</span>
            <CopyButton text={f.suggestedFix} tr={tr} />
          </div>
          <p className="select-all whitespace-pre-wrap rounded-md bg-background/70 p-2 font-serif text-[13px] leading-relaxed">
            {f.suggestedFix}
          </p>
        </div>
      )}
    </li>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="label-mono mb-1.5 text-muted-foreground">{title}</h3>
      <ul className="list-disc space-y-2 pl-5">
        {items.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
