import type { Lang } from "@/lib/i18n/config";
import type { RiskLevel, CaseStatus } from "@/lib/demo/data";

/** Risk pill: label (TR/EN), text+bg classes, and a solid color var. */
export const RISK_META: Record<
  RiskLevel,
  { tr: string; en: string; cls: string; color: string }
> = {
  low: { tr: "düşük", en: "low", cls: "text-success bg-success/10", color: "var(--color-risk-low)" },
  medium: { tr: "orta", en: "medium", cls: "text-warning-foreground bg-warning/15", color: "var(--color-risk-medium)" },
  high: { tr: "yüksek", en: "high", cls: "text-destructive bg-destructive/10", color: "var(--color-risk-high)" },
  critical: { tr: "kritik", en: "critical", cls: "text-[var(--color-risk-critical)] bg-[var(--color-risk-critical)]/12", color: "var(--color-risk-critical)" },
};

export function riskLabel(level: RiskLevel, lang: Lang) {
  return lang === "tr" ? RISK_META[level].tr : RISK_META[level].en;
}

/** Case status pill. */
export const STATUS_META: Record<
  CaseStatus,
  { tr: string; en: string; cls: string }
> = {
  ready: { tr: "rapor hazır", en: "ready", cls: "text-success bg-success/10" },
  analyzing: { tr: "analiz ediliyor", en: "analyzing", cls: "text-info bg-info/12" },
  urgent: { tr: "acil", en: "urgent", cls: "text-destructive bg-destructive/10" },
  queued: { tr: "sırada", en: "queued", cls: "text-muted-foreground bg-muted" },
};

export function statusLabel(status: CaseStatus, lang: Lang) {
  return lang === "tr" ? STATUS_META[status].tr : STATUS_META[status].en;
}

/** Case-category chip color (subtle, per category). */
export const CATEGORY_COLOR: Record<string, string> = {
  Family: "var(--seg-1)",
  Employment: "var(--seg-2)",
  Commercial: "var(--seg-3)",
  Tenancy: "var(--seg-4)",
  Inheritance: "var(--seg-5)",
};

export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${mon} · ${hh}:${mm}`;
}
