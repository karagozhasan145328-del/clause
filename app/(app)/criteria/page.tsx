"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   CRITERIA — the analysis criteria hukuk-sorgula applies to every uploaded
   case (date consistency, financial admissions, threat language, etc).
   Renders from lib/demo/data.ts. Bilingual, inline-SVG only.
   ───────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { RISK_META, riskLabel } from "@/lib/risk";
import { analysisCriteria } from "@/lib/demo/data";

export default function CriteriaPage() {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      analysisCriteria.filter(
        (c) => !query || t(c.title).toLowerCase().includes(query.toLowerCase()) || c.ref.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, t],
  );

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="label-mono text-primary">{lang === "tr" ? "Kütüphane" : "Library"}</p>
          <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight">
            {lang === "tr" ? "Analiz kriterleri" : "Analysis criteria"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {lang === "tr"
              ? "hukuk-sorgula her dosyayı bu kriterlere göre tarar ve bulgu üretir."
              : "hukuk-sorgula scans every case against these criteria and generates findings."}
          </p>
        </div>
        <div className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "tr" ? "Ara…" : "Search…"}
            className="w-40 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:w-56"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="label-mono py-2.5 pl-4 font-medium text-muted-foreground">{lang === "tr" ? "Ref" : "Ref"}</th>
                <th className="label-mono py-2.5 font-medium text-muted-foreground">{lang === "tr" ? "Konu" : "Topic"}</th>
                <th className="label-mono py-2.5 font-medium text-muted-foreground">{lang === "tr" ? "Kontrol" : "Checks"}</th>
                <th className="label-mono py-2.5 font-medium text-muted-foreground">{lang === "tr" ? "Eşik" : "Threshold"}</th>
                <th className="label-mono py-2.5 pr-4 text-right font-medium text-muted-foreground">{lang === "tr" ? "Önem" : "Severity"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const rm = RISK_META[c.severity];
                return (
                  <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                    <td className="py-3 pl-4">
                      <span className="tnum text-[12px] font-semibold text-muted-foreground">{c.ref}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{t(c.title)}</td>
                    <td className="py-3 pr-4 max-w-[280px] text-[12px] text-muted-foreground">{t(c.checks)}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[12px] text-foreground/80">
                        {t(c.threshold)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", rm.cls)}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: rm.color }} />
                        {riskLabel(c.severity, lang)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                    {lang === "tr" ? "Eşleşen kriter yok." : "No matching criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-3 text-[12px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {lang === "tr"
            ? "Bu kriterler her yüklenen dosyaya otomatik uygulanır; hukuk-sorgula bunlara göre bulgu üretir."
            : "These criteria are applied to every uploaded case automatically; hukuk-sorgula generates findings against them."}
        </div>
      </div>
    </div>
  );
}
