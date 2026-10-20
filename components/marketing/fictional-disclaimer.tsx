"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   FictionalDisclaimer — a small muted inline note clarifying that the demo
   pipeline and sample report use fictional data, not a real client's. Used
   under the pipeline demo and under the gated sample-report preview.
   ───────────────────────────────────────────────────────────────────────────── */

import { Info } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export function FictionalDisclaimer({ className }: { className?: string }) {
  const { lang } = useLang();
  return (
    <p className={cn("flex items-center gap-1.5 text-[11px] text-muted-foreground", className)}>
      <Info className="h-3 w-3 shrink-0" />
      {lang === "tr"
        ? "Kurgusal senaryodur, gerçek müvekkil verisi içermez."
        : "Fictional scenario, contains no real client data."}
    </p>
  );
}
