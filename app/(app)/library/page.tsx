"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   LIBRARY — the risk pattern library: example red-flag chat patterns
   hukuk-sorgula looks for (date contradictions, payment admissions, threat
   language, etc). Renders from lib/demo/data.ts. Bilingual, inline-SVG only.
   ───────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { riskPatterns } from "@/lib/demo/data";

export default function LibraryPage() {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");

  const patterns = useMemo(
    () => riskPatterns.filter((p) => !query || t(p.topic).toLowerCase().includes(query.toLowerCase())),
    [query, t],
  );

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="label-mono text-primary">{lang === "tr" ? "Kütüphane" : "Library"}</p>
          <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight">
            {lang === "tr" ? "Risk kalıp kütüphanesi" : "Risk pattern library"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {lang === "tr"
              ? "hukuk-sorgula'nın müvekkil sohbetlerinde aradığı örnek kırmızı bayrak kalıpları."
              : "Example red-flag chat patterns hukuk-sorgula looks for in client conversations."}
          </p>
        </div>
        <div className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "tr" ? "Konu ara…" : "Search topic…"}
            className="w-40 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:w-56"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {patterns.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="font-display text-[15px] font-semibold tracking-tight">{t(p.topic)}</p>
            <div className="mt-3 space-y-2.5">
              <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] p-3">
                <p className="label-mono text-destructive">{lang === "tr" ? "Örnek ifade" : "Example phrase"}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-foreground/80">{t(p.examplePhrase)}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/[0.05] p-3">
                <p className="label-mono text-success">{lang === "tr" ? "Neden önemli" : "Why it matters"}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-foreground/80">{t(p.whyItMatters)}</p>
              </div>
            </div>
          </div>
        ))}
        {patterns.length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground shadow-soft">
            {lang === "tr" ? "Eşleşen kalıp yok." : "No matching patterns."}
          </div>
        )}
      </div>
    </div>
  );
}
