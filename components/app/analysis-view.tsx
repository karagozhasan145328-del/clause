"use client";

import { useLang } from "@/components/i18n/language-provider";
import type { Analysis } from "@/lib/analysis";

/** Renders a stored/returned analysis (summary, findings, contradictions, recommendations). */
export function AnalysisView({ result }: { result: Analysis }) {
  const { lang } = useLang();
  const tr = lang === "tr";
  return (
    <div className="space-y-5 text-sm">
      <p>
        <span className="font-semibold capitalize">{tr ? "Genel risk: " : "Overall risk: "}</span>
        {result.overallRisk}
      </p>
      <p className="text-muted-foreground">{result.summary}</p>
      <Section title={tr ? "Bulgular" : "Findings"} count={result.findings?.length}>
        {result.findings?.map((f, i) => (
          <li key={i}>
            <span className="font-semibold">{f.title}</span> <em className="text-muted-foreground">({f.severity})</em>
            <br />
            {f.detail}
            {f.evidence && <blockquote className="mt-1 border-l-2 border-border pl-2 text-xs text-muted-foreground">{f.evidence}</blockquote>}
          </li>
        ))}
      </Section>
      <Section title={tr ? "Çelişkiler" : "Contradictions"} count={result.contradictions?.length}>
        {result.contradictions?.map((c, i) => <li key={i}>{c}</li>)}
      </Section>
      <Section title={tr ? "Öneriler" : "Recommendations"} count={result.recommendations?.length}>
        {result.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
      </Section>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <div>
      <h3 className="label-mono mb-1.5 text-muted-foreground">{title}</h3>
      <ul className="list-disc space-y-2 pl-5">{children}</ul>
    </div>
  );
}
