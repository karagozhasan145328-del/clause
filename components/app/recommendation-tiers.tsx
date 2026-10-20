"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   RecommendationTiers — 3-column strategic action plan (0-48h / 1-2w / 1-3m),
   each column a stack of priority-colored cards.
   ───────────────────────────────────────────────────────────────────────────── */

import { useLang } from "@/components/i18n/language-provider";
import { RISK_META } from "@/lib/risk";
import type { StrategicRecommendation } from "@/lib/demo/data";

const TIERS: StrategicRecommendation["tier"][] = ["0-48h", "1-2w", "1-3m"];

const TIER_LABEL: Record<StrategicRecommendation["tier"], { tr: string; en: string }> = {
  "0-48h": { tr: "0-48 saat", en: "0-48h" },
  "1-2w": { tr: "1-2 hafta", en: "1-2 weeks" },
  "1-3m": { tr: "1-3 ay", en: "1-3 months" },
};

export function RecommendationTiers({ items }: { items: StrategicRecommendation[] }) {
  const { t, lang } = useLang();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {TIERS.map((tier) => {
        const tierItems = items.filter((i) => i.tier === tier);
        return (
          <div key={tier}>
            <p className="label-mono mb-2.5 text-muted-foreground">{lang === "tr" ? TIER_LABEL[tier].tr : TIER_LABEL[tier].en}</p>
            <div className="space-y-2.5">
              {tierItems.map((item) => {
                const rm = RISK_META[item.priority];
                return (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-3 shadow-soft" style={{ borderLeft: `3px solid ${rm.color}` }}>
                    <p className="text-[12.5px] font-semibold leading-snug">{t(item.action)}</p>
                    <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{t(item.rationale)}</p>
                  </div>
                );
              })}
              {tierItems.length === 0 && (
                <p className="text-[11.5px] text-muted-foreground/70">{lang === "tr" ? "Öneri yok" : "No recommendations"}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
