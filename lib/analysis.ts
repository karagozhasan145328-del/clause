import type { RiskLevel } from "@/lib/demo/data";

export type FindingSeverity = "critical" | "medium" | "low";

export interface Finding {
  /** Clause / issue heading (madde başlığı). */
  title: string;
  /** critical | medium | low. (Legacy rows may hold "high"; it is shown as critical.) */
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

/** Product-level scale: exactly three levels. */
export const LEVELS3: FindingSeverity[] = ["critical", "medium", "low"];

const SEVERITY_ALIASES: Record<string, FindingSeverity> = {
  critical: "critical", kritik: "critical",
  // Intermediate values the model may still emit are folded UP (conservative for a lawyer).
  high: "critical", yüksek: "critical", yuksek: "critical", "very high": "critical",
  medium: "medium", orta: "medium", moderate: "medium",
  low: "low", düşük: "low", dusuk: "low",
};

/** Coerces any model/legacy value to critical | medium | low. Unknown → medium. */
export const normalizeSeverity = (v: unknown): FindingSeverity =>
  SEVERITY_ALIASES[String(v ?? "").trim().toLowerCase()] ?? "medium";

/** Overall risk uses the same 3-level scale (stored value is a valid RiskLevel for the DB check). */
export const normalizeRisk = (v: unknown): RiskLevel => normalizeSeverity(v);

/** Display/sort order, most severe first. */
export const SEVERITY_RANK: Record<FindingSeverity, number> = { critical: 0, medium: 1, low: 2 };

/**
 * Court-decision citations the model must never produce (it cannot verify them).
 * Matches e.g. "Yargıtay 3. HD, E. 2019/123 K. 2020/456", "11. Hukuk Dairesi", "YHGK".
 */
const DECISION_RE =
  /(yargıtay|danıştay|anayasa mahkemesi|\baym\b|yhgk|ybgk|\b\d{1,2}\.\s*(hukuk|ceza)\s*dairesi|\b\d{1,2}\.\s*(hd|cd)\b|\bE\.?\s*\d{4}\s*\/\s*\d+|\bK\.?\s*\d{4}\s*\/\s*\d+)/i;

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
    .sort((a, b) => SEVERITY_RANK[a.severity as FindingSeverity] - SEVERITY_RANK[b.severity as FindingSeverity]);

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
