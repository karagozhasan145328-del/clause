"use client";

import { useState } from "react";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import type { SearchFilters, SearchHit } from "@/lib/archive/shared";
import { cn } from "@/lib/utils";

const field = "h-8 rounded-md border border-border bg-card px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring";

export function PrecedentSearch() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<keyof SearchFilters, string>>({
    legalArea: "",
    court: "",
    chamber: "",
    yearFrom: "",
    yearTo: "",
    statute: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [mode, setMode] = useState<"hybrid" | "text" | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (query.trim().length < 2 || busy) return;
    setBusy(true);
    setError(null);
    const f: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(filters)) if (v.trim()) f[k] = k.startsWith("year") ? Number(v) : v.trim();
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters: f }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? (tr ? "Arama başarısız oldu." : "Search failed."));
        setHits(null);
      } else {
        setHits(data.hits);
        setMode(data.mode);
      }
    } catch {
      setError(tr ? "Sunucuya ulaşılamadı." : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof SearchFilters) => (e: React.ChangeEvent<HTMLInputElement>) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="space-y-2">
        <div className="flex gap-2">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr ? "Örn. haksız fesihte kıdem tazminatı, TBK 49, ispat yükü…" : "e.g. severance on unjust termination, TBK 49, burden of proof…"}
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-label={tr ? "Filtreler" : "Filters"}
            className={cn("grid h-10 w-10 place-items-center rounded-lg border border-border bg-card", showFilters && "border-primary text-primary")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={busy || query.trim().length < 2}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {tr ? "Ara" : "Search"}
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-3">
            <input className={field} placeholder={tr ? "Hukuk alanı (İş, Ceza…)" : "Legal area (İş, Ceza…)"} value={filters.legalArea} onChange={set("legalArea")} />
            <input className={field} placeholder={tr ? "Mahkeme (Yargıtay…)" : "Court (Yargıtay…)"} value={filters.court} onChange={set("court")} />
            <input className={field} placeholder={tr ? "Daire (9. Hukuk Dairesi)" : "Chamber (9. Hukuk Dairesi)"} value={filters.chamber} onChange={set("chamber")} />
            <input className={field} placeholder={tr ? "Mevzuat (TBK 49)" : "Statute (TBK 49)"} value={filters.statute} onChange={set("statute")} />
            <input className={field} inputMode="numeric" placeholder={tr ? "Yıl (başlangıç)" : "Year from"} value={filters.yearFrom} onChange={set("yearFrom")} />
            <input className={field} inputMode="numeric" placeholder={tr ? "Yıl (bitiş)" : "Year to"} value={filters.yearTo} onChange={set("yearTo")} />
          </div>
        )}
      </form>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          {error}
        </p>
      )}
      {mode === "text" && hits && (
        <p className="rounded-lg bg-warning/15 p-2.5 text-xs text-warning-foreground">
          {tr ? "Anlamsal arama kullanılamadı; yalnızca anahtar kelime sonuçları gösteriliyor." : "Semantic search was unavailable; showing keyword results only."}
        </p>
      )}
      {hits && hits.length === 0 && <p className="text-sm text-muted-foreground">{tr ? "Eşleşen emsal bulunamadı." : "No matching precedents."}</p>}

      <ul className="space-y-3">
        {hits?.map((h) => (
          <li key={h.chunkId} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="font-display text-[15px] font-semibold tracking-tight">{h.label}</p>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11.5px] text-muted-foreground">
              {h.legalArea && <span>{h.legalArea}</span>}
              {h.decisionDate && <span>{new Date(h.decisionDate).toLocaleDateString(tr ? "tr-TR" : "en-GB")}</span>}
              {h.heading && <span className="label-mono">{h.heading}</span>}
            </p>
            <p className="mt-2 line-clamp-6 text-[13px] leading-relaxed text-foreground/85">{h.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
