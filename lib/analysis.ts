import type { RiskLevel } from "@/lib/demo/data";

export type FindingSeverity = "critical" | "medium" | "low";

export interface Finding {
  /** Clause / issue heading (madde başlığı). */
  title: string;
  /** critical | medium | low (legacy rows may also hold "high"). */
  severity: string;
  detail: string;
  evidence?: string;
  /** Statute references only, e.g. "TBK m. 182". Never court decisions. */
  legalBasis?: string[];
  /** Proposed replacement wording / corrective step. */
  suggestedFix?: string;
}

/** Shape the model returns (stored in analyses.result). */
export interface Analysis {
  summary: string;
  overallRisk: string;
  findings: Finding[];
  contradictions: string[];
  recommendations: string[];
  /** How many court-decision citations were stripped by the server guard. */
  removedCitations?: number;
}

/** A row of the public.analyses table. */
export interface AnalysisRow {
  id: string;
  file_name: string;
  file_size: number;
  overall_risk: RiskLevel;
  summary: string;
  result: Analysis;
  created_at: string;
}

const LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

/** Models occasionally return odd casing/values — coerce to a valid enum. */
export const normalizeRisk = (v: unknown): RiskLevel => {
  const s = String(v ?? "").toLowerCase() as RiskLevel;
  return LEVELS.includes(s) ? s : "medium";
};

/** Display/sort order, most severe first. Unknown values sort last. */
export const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SEVERITY_ALIASES: Record<string, FindingSeverity | "high"> = {
  critical: "critical", kritik: "critical",
  high: "high", yüksek: "high", yuksek: "high",
  medium: "medium", orta: "medium",
  low: "low", düşük: "low", dusuk: "low",
};

export const normalizeSeverity = (v: unknown): FindingSeverity | "high" =>
  SEVERITY_ALIASES[String(v ?? "").trim().toLowerCase()] ?? "medium";

/**
 * Court-decision citations the model must never produce (it cannot verify them).
 * Matches e.g. "Yargıtay 3. HD, E. 2019/123 K. 2020/456", "11. Hukuk Dairesi", "YHGK".
 */
const DECISION_RE =
  /(yargıtay|danıştay|anayasa mahkemesi|aym|yhgk|ybgk|\b\d{1,2}\.\s*(hukuk|ceza)\s*dairesi|\b\d{1,2}\.\s*(hd|cd)\b|\bE\.?\s*\d{4}\s*\/\s*\d+|\bK\.?\s*\d{4}\s*\/\s*\d+)/i;

const REDACTED = "[emsal karar — doğrulanmadan kullanmayın]";

/** Drops decision-like legalBasis entries and redacts them in free text. Returns the count removed. */
export function stripDecisionCitations(analysis: Analysis): number {
  let removed = 0;
  const redact = (s: string | undefined) => {
    if (!s) return s;
    // Redact whole sentences that cite a decision.
    return s
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => {
        if (DECISION_RE.test(sentence)) {
          removed++;
          return REDACTED;
        }
        return sentence;
      })
      .join(" ");
  };

  analysis.summary = redact(analysis.summary) ?? "";
  analysis.contradictions = (analysis.contradictions ?? []).map((c) => redact(c) ?? "");
  analysis.recommendations = (analysis.recommendations ?? []).map((r) => redact(r) ?? "");
  analysis.findings = (analysis.findings ?? []).map((f) => {
    const basis = (f.legalBasis ?? []).filter((b) => {
      if (DECISION_RE.test(b)) {
        removed++;
        return false;
      }
      return true;
    });
    return {
      ...f,
      detail: redact(f.detail) ?? "",
      evidence: f.evidence, // verbatim quote from the user's own file — never rewritten
      suggestedFix: redact(f.suggestedFix),
      legalBasis: basis,
    };
  });
  return removed;
}

/** Coerces model output into a well-formed, severity-sorted Analysis. */
export function sanitizeAnalysis(raw: Partial<Analysis>): Analysis {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

  const findings: Finding[] = (Array.isArray(raw.findings) ? raw.findings : [])
    .map((f) => ({
      title: str(f?.title) || "—",
      severity: normalizeSeverity(f?.severity),
      detail: str(f?.detail),
      evidence: str(f?.evidence) || undefined,
      legalBasis: strs(f?.legalBasis),
      suggestedFix: str(f?.suggestedFix) || undefined,
    }))
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9));

  const analysis: Analysis = {
    summary: str(raw.summary),
    overallRisk: normalizeRisk(raw.overallRisk),
    findings,
    contradictions: strs(raw.contradictions),
    recommendations: strs(raw.recommendations),
  };
  const removed = stripDecisionCitations(analysis);
  if (removed > 0) analysis.removedCitations = removed;
  return analysis;
}
