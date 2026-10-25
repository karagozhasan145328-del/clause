import type { RiskLevel } from "@/lib/demo/data";

export interface Finding {
  title: string;
  severity: string;
  detail: string;
  evidence?: string;
}

/** Shape the model returns (stored in analyses.result). */
export interface Analysis {
  summary: string;
  overallRisk: string;
  findings: Finding[];
  contradictions: string[];
  recommendations: string[];
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
