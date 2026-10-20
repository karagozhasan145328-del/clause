"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   TrustStrip — a compact 4-up row of trust/compliance facts shown right below
   the hero column, before the "trusted by" logo row. Distinct from the lower
   TRUST section (explainability / data isolation / human-in-the-loop) — this
   one covers encryption, data residency, KVKK/GDPR design, and the
   AI-doesn't-decide principle.
   ───────────────────────────────────────────────────────────────────────────── */

import { Lock, MapPin, ShieldCheck, Scale } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import type { L } from "@/lib/i18n/config";

const ITEMS: { icon: typeof Lock; label: L }[] = [
  { icon: Lock, label: { tr: "AES-256 şifreleme", en: "AES-256 encryption" } },
  { icon: MapPin, label: { tr: "Türkiye/AB veri lokasyonu", en: "Turkey/EU data residency" } },
  { icon: ShieldCheck, label: { tr: "KVKK & GDPR uyumlu tasarım", en: "Designed for KVKK & GDPR compliance" } },
  { icon: Scale, label: { tr: "AI karar vermez, siz karar verirsiniz", en: "The AI doesn't decide, you do" } },
];

export function TrustStrip() {
  const { t } = useLang();
  return (
    <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => {
        const I = item.icon;
        return (
          <div
            key={t(item.label)}
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-soft"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
              <I className="h-4 w-4" />
            </span>
            <span className="text-[12.5px] font-medium leading-snug">{t(item.label)}</span>
          </div>
        );
      })}
    </div>
  );
}
