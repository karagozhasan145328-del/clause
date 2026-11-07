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
  /** Multi-document analyses: which uploaded file the issue is in. */
  document?: string;
}

export type DiscrepancyType = "date" | "amount" | "party" | "obligation" | "favorability" | "logic" | "other";
export const DISCREPANCY_TYPES: DiscrepancyType[] = ["date", "amount", "party", "obligation", "favorability", "logic", "other"];

/** One conflict / difference *between* the uploaded documents. */
export interface Discrepancy {
  type: DiscrepancyType;
  title: string;
  severity: string;
  detail: string;
  /** Verbatim quotes, one per document involved. */
  sources: { document: string; quote: string }[];
  /** For favorability differences: is it for or against the user's side? */
  effect?: "favorable" | "unfavorable" | "neutral";
  suggestedFix?: string;
}

/** Cross-document report (only present when two or more files were uploaded together). */
export interface Comparison {
  documents: string[];
  summary: string;
  discrepancies: Discrepancy[];
}

/** One item of the pre-submission checklist ("must be fixed before it goes to court / the other side"). */
export interface ChecklistItem {
  text: string;
  severity: FindingSeverity;
  /** "auto" = derived deterministically by the server from the report, "model" = proposed by the model. */
  origin: "auto" | "model";
}

/** Shape the model returns (stored in analyses.result). */
export interface Analysis {
  summary: string;
  overallRisk: string;
  findings: Finding[];
  contradictions: string[];
  recommendations: string[];
  /** Cross-document comparison (multi-file uploads). */
  comparison?: Comparison;
  /** "Critical risk summary": the few things that matter most, in one glance. */
  criticalSummary?: string[];
  /** Must-fix list before filing / sending to the other side. */
  checklist?: ChecklistItem[];
  /** How many court-decision citations were stripped by the server guard. */
  removedCitations?: number;
  /** Figures in proposed text that were not in the document and were replaced by placeholders. */
  blankedFigures?: number;
  /** The source text came from OCR of a scanned PDF, so quotes may contain misreadings. */
  ocr?: boolean;
  /** Partly scanned PDF: how many pages were read via OCR (the rest were digital text). */
  ocrPages?: number;
  /** Pages read via OCR (charged to the monthly quota). */
  ocrPageCount?: number;
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
  analysis.criticalSummary = (analysis.criticalSummary ?? []).map((r) => redact(r) ?? "");
  analysis.checklist = (analysis.checklist ?? []).map((c) => ({ ...c, text: redact(c.text) ?? "" }));
  if (analysis.comparison) {
    analysis.comparison.summary = redact(analysis.comparison.summary) ?? "";
    analysis.comparison.discrepancies = analysis.comparison.discrepancies.map((d) => ({
      ...d,
      detail: redact(d.detail) ?? "",
      suggestedFix: redact(d.suggestedFix),
    }));
  }
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

type FigureClass = "percent" | "money" | "period";

/**
 * Amounts, percentages and durations (TR + EN) — the figures a model must not invent.
 * Unit suffixes are matched with a Unicode-aware lookahead (JS `\b` is ASCII-only: "gün" would miss).
 */
const FIGURE_RES: { cls: FigureClass; re: RegExp; placeholder: { tr: string; en: string } }[] = [
  {
    cls: "percent",
    re: /%\s?\d[\d.,]*|\d[\d.,]*\s?%|yüzde\s+\d[\d.,]*/giu,
    placeholder: { tr: "%[ORAN]", en: "[RATE]%" },
  },
  {
    cls: "money",
    re: /\d[\d.,]*\s?(?:TL|TRY|₺|lira|USD|EUR|€|\$)(?![\p{L}\d])/giu,
    placeholder: { tr: "[TUTAR] TL", en: "[AMOUNT]" },
  },
  {
    cls: "period",
    re: /\d[\d.,]*\s?(?:gün|hafta|ay|yıl|saat|days?|weeks?|months?|years?|hours?)(?![\p{L}\d])/giu,
    placeholder: { tr: "[SÜRE]", en: "[PERIOD]" },
  },
];

/** "2.000.000,00" / "2,000,000.50" / "50.000" → 2000000 / 2000000.5 / 50000. */
function parseFigureNumber(token: string): number | null {
  let t = token.replace(/[.,]+$/, "");
  // A last separator followed by 1–2 digits is a decimal part ("12,5", "2.000.000,00"); 3 digits = thousands group.
  const dec = t.match(/[.,](\d{1,2})$/);
  let frac = "";
  if (dec) {
    frac = dec[1];
    t = t.slice(0, -dec[0].length);
  }
  const n = Number(t.replace(/[.,]/g, "") + (frac ? `.${frac}` : ""));
  return Number.isFinite(n) ? n : null;
}

const UNIT_ROOT: [RegExp, string][] = [
  [/^(gün|day)/i, "d"],
  [/^(hafta|week)/i, "w"],
  [/^(ay|month)/i, "m"],
  [/^(yıl|year)/i, "y"],
  [/^(saat|hour)/i, "h"],
];

/** Canonical key of one matched figure: percent/money → value; period → value + unit. */
function figureKey(cls: FigureClass, match: string): string | null {
  const num = match.match(/\d[\d.,]*/)?.[0];
  if (!num) return null;
  const value = parseFigureNumber(num);
  if (value === null) return null;
  if (cls !== "period") return `${cls}:${value}`;
  const unit = match.slice(match.indexOf(num) + num.length).trim();
  const root = UNIT_ROOT.find(([re]) => re.test(unit))?.[1];
  return root ? `period:${value}${root}` : null;
}

/** Every figure the source document itself states, as canonical keys. */
function sourceFigureKeys(source: string): Set<string> {
  const keys = new Set<string>();
  for (const { cls, re } of FIGURE_RES) {
    for (const m of source.matchAll(new RegExp(re.source, re.flags))) {
      const k = figureKey(cls, m[0]);
      if (k) keys.add(k);
    }
  }
  return keys;
}

/**
 * In proposed clause text, keeps any amount/percentage/duration the source document itself
 * states (same value and, for durations, same unit) and blanks the rest with an empty
 * placeholder. Returns how many invented figures were replaced.
 */
export function blankInventedFigures(analysis: Analysis, source: string, lang: "tr" | "en"): number {
  const known = sourceFigureKeys(source);
  let replaced = 0;
  const fix = (text: string | undefined) => {
    if (!text) return text;
    let out = text;
    for (const { cls, re, placeholder } of FIGURE_RES) {
      out = out.replace(re, (m) => {
        const key = figureKey(cls, m);
        if (key && known.has(key)) return m; // stated in the document → safe to reuse verbatim
        replaced++;
        return placeholder[lang];
      });
    }
    return out;
  };
  analysis.findings = analysis.findings.map((f) => ({ ...f, suggestedFix: fix(f.suggestedFix) }));
  if (analysis.comparison) {
    analysis.comparison.discrepancies = analysis.comparison.discrepancies.map((d) => ({ ...d, suggestedFix: fix(d.suggestedFix) }));
  }
  return replaced;
}

/** Coerces the model's cross-document section (quotes stay verbatim; severity folded to 3 levels, sorted). */
function sanitizeComparison(raw: unknown): Comparison | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Partial<Comparison>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const list = Array.isArray(r.discrepancies) ? r.discrepancies : [];
  const discrepancies: Discrepancy[] = list
    .map((d) => {
      const type = DISCREPANCY_TYPES.includes(d?.type as DiscrepancyType) ? (d.type as DiscrepancyType) : "other";
      const effect = d?.effect === "favorable" || d?.effect === "unfavorable" || d?.effect === "neutral" ? d.effect : undefined;
      return {
        type,
        title: str(d?.title) || "—",
        severity: normalizeSeverity(d?.severity),
        detail: str(d?.detail),
        sources: (Array.isArray(d?.sources) ? d.sources : [])
          .map((s) => ({ document: str(s?.document), quote: str(s?.quote) }))
          .filter((s) => s.document || s.quote),
        effect,
        suggestedFix: str(d?.suggestedFix) || undefined,
      };
    })
    .sort((a, b) => SEVERITY_RANK[a.severity as FindingSeverity] - SEVERITY_RANK[b.severity as FindingSeverity]);
  return {
    documents: (Array.isArray(r.documents) ? r.documents : []).map(str).filter(Boolean),
    summary: str(r.summary),
    discrepancies,
  };
}

/** Coerces model output into a well-formed, severity-sorted Analysis. */
export function sanitizeAnalysis(raw: Partial<Analysis>, source = "", lang: "tr" | "en" = "tr"): Analysis {
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
      document: str(f?.document) || undefined,
    }))
    .sort((a, b) => SEVERITY_RANK[a.severity as FindingSeverity] - SEVERITY_RANK[b.severity as FindingSeverity]);

  const analysis: Analysis = {
    summary: str(raw.summary),
    overallRisk: normalizeRisk(raw.overallRisk),
    findings,
    contradictions: strs(raw.contradictions),
    recommendations: strs(raw.recommendations),
  };
  const comparison = sanitizeComparison(raw.comparison);
  if (comparison) analysis.comparison = comparison;
  analysis.criticalSummary = strs(raw.criticalSummary).slice(0, 6);
  analysis.checklist = (Array.isArray(raw.checklist) ? raw.checklist : [])
    .map((c) => ({ text: str(c?.text), severity: normalizeSeverity(c?.severity), origin: "model" as const }))
    .filter((c) => c.text)
    .slice(0, 15);
  const removed = stripDecisionCitations(analysis);
  if (removed > 0) analysis.removedCitations = removed;
  const blanked = blankInventedFigures(analysis, source, lang);
  if (blanked > 0) analysis.blankedFigures = blanked;
  return analysis;
}
