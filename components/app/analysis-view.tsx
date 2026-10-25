"use client";

import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { RISK_META, riskLabel } from "@/lib/risk";
import { SEVERITY_RANK, normalizeRisk, normalizeSeverity, type Analysis, type Finding } from "@/lib/analysis";

/** Renders a stored/returned analysis: findings ranked most-severe first, with legal basis and a suggested fix. */
export function AnalysisView({ result }: { result: Analysis }) {
  const { lang } = useLang();
  const tr = lang === "tr";

  // Re-sort here too: rows saved before the sorted schema (or by older code) may be unordered.
  const findings = [...(result.findings ?? [])].sort(
    (a, b) => (SEVERITY_RANK[normalizeSeverity(a.severity)] ?? 9) - (SEVERITY_RANK[normalizeSeverity(b.severity)] ?? 9),
  );
  const overall = normalizeRisk(result.overallRisk);
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    const k = normalizeSeverity(f.severity);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{tr ? "Genel risk:" : "Overall risk:"}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${RISK_META[overall].cls}`}>
          {riskLabel(overall, lang)}
        </span>
        {(["critical", "high", "medium", "low"] as const).map((k) =>
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

      {findings.length > 0 && (
        <div>
          <h3 className="label-mono mb-2 text-muted-foreground">
            {tr ? `Bulgular · öncelik sırasıyla (${findings.length})` : `Findings · by priority (${findings.length})`}
          </h3>
          <ol className="space-y-3">
            {findings.map((f, i) => (
              <FindingCard key={i} finding={f} rank={i + 1} tr={tr} lang={lang} />
            ))}
          </ol>
        </div>
      )}

      <Section title={tr ? "Çelişkiler" : "Contradictions"} items={result.contradictions} />
      <Section title={tr ? "Öneriler" : "Recommendations"} items={result.recommendations} />

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
        <div className="mt-2.5 rounded-lg bg-primary/5 p-2.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="label-mono text-primary">{tr ? "Önerilen düzeltme" : "Suggested fix"}</span>
            <CopyButton text={f.suggestedFix} tr={tr} />
          </div>
          <p className="whitespace-pre-wrap text-[13px]">{f.suggestedFix}</p>
        </div>
      )}
    </li>
  );
}

function CopyButton({ text, tr }: { text: string; tr: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? (tr ? "Kopyalandı" : "Copied") : tr ? "Kopyala" : "Copy"}
    </button>
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
