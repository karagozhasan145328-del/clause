"use client";

import { useState } from "react";
import { Check, Copy, ListChecks } from "lucide-react";
import { RISK_META, riskLabel } from "@/lib/risk";
import { normalizeSeverity, type Analysis, type Discrepancy } from "@/lib/analysis";
import { cn } from "@/lib/utils";

export function CopyButton({ text, tr, label }: { text: string; tr: boolean; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? (tr ? "Kopyalandı" : "Copied") : (label ?? (tr ? "Kopyala" : "Copy"))}
    </button>
  );
}

const TYPE_LABEL: Record<Discrepancy["type"], { tr: string; en: string }> = {
  date: { tr: "Tarih", en: "Date" },
  amount: { tr: "Tutar / oran / süre", en: "Amount / rate / period" },
  party: { tr: "Taraf", en: "Party" },
  obligation: { tr: "Yükümlülük", en: "Obligation" },
  favorability: { tr: "Lehte / aleyhte fark", en: "Favorable / unfavorable" },
  logic: { tr: "Mantıksal tutarsızlık", en: "Logical inconsistency" },
  other: { tr: "Diğer", en: "Other" },
};

const EFFECT_META = {
  favorable: { tr: "lehte", en: "favorable", cls: "text-success bg-success/10" },
  unfavorable: { tr: "aleyhte", en: "unfavorable", cls: "text-destructive bg-destructive/10" },
  neutral: { tr: "nötr", en: "neutral", cls: "text-muted-foreground bg-muted" },
} as const;

/** Conflicts and differences between the uploaded documents. */
export function ComparisonTab({ comparison, tr }: { comparison: NonNullable<Analysis["comparison"]>; tr: boolean }) {
  const lang = tr ? "tr" : "en";
  return (
    <div className="space-y-3">
      {comparison.documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {comparison.documents.map((d, i) => (
            <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[11px]">
              <span className="font-mono text-muted-foreground">{i + 1}.</span> {d}
            </span>
          ))}
        </div>
      )}
      {comparison.summary && <p className="text-muted-foreground">{comparison.summary}</p>}
      {comparison.discrepancies.length === 0 ? (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          {tr ? "Belgeler arasında çelişki veya önemli fark tespit edilmedi." : "No conflicts or significant differences were found between the documents."}
        </p>
      ) : (
        <ol className="space-y-3">
          {comparison.discrepancies.map((d, i) => {
            const sev = normalizeSeverity(d.severity);
            const meta = RISK_META[sev];
            const effect = d.effect ? EFFECT_META[d.effect] : null;
            return (
              <li key={i} className="rounded-xl border border-border bg-card p-3.5" style={{ borderLeft: `4px solid ${meta.color}` }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>{riskLabel(sev, lang)}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">{TYPE_LABEL[d.type][lang]}</span>
                  {effect && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${effect.cls}`}>{effect[lang]}</span>}
                  <span className="font-semibold">{d.title}</span>
                </div>
                <p className="mt-2">{d.detail}</p>
                {d.sources.length > 0 && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {d.sources.map((src, j) => (
                      <blockquote key={j} className="rounded-md border-l-2 border-border bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
                        <span className="mb-0.5 block font-mono text-[10px] uppercase">{src.document}</span>
                        {src.quote}
                      </blockquote>
                    ))}
                  </div>
                )}
                {d.suggestedFix && (
                  <div className="mt-2.5 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="label-mono text-primary">{tr ? "Uzlaştırıcı metin" : "Reconciling text"}</span>
                      <CopyButton text={d.suggestedFix} tr={tr} />
                    </div>
                    <p className="select-all whitespace-pre-wrap rounded-md bg-background/70 p-2 font-serif text-[13px] leading-relaxed">{d.suggestedFix}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** "Fix before it goes to court / the other side": tick items off as you go. */
export function ChecklistTab({ items, tr }: { items: NonNullable<Analysis["checklist"]>; tr: boolean }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const lang = tr ? "tr" : "en";
  const left = items.length - done.size;
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <ListChecks className="h-4 w-4 text-primary" />
          {tr ? "Mahkemeye / karşı tarafa sunulmadan önce mutlaka düzeltilmesi gerekenler" : "Must be fixed before going to court / the other party"}
        </h3>
        <CopyButton
          text={items.map((c, i) => `${done.has(i) ? "[x]" : "[ ]"} ${c.text}`).join("\n")}
          label={tr ? "Listeyi kopyala" : "Copy list"}
          tr={tr}
        />
      </div>
      <p className={cn("text-xs", left === 0 ? "font-medium text-success" : "text-muted-foreground")}>
        {left === 0
          ? tr
            ? "Tüm maddeler işaretlendi."
            : "All items checked."
          : tr
            ? `${left} madde açık (${items.length} maddeden).`
            : `${left} of ${items.length} items still open.`}
      </p>
      <ul className="space-y-1.5">
        {items.map((c, i) => {
          const meta = RISK_META[c.severity];
          return (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 hover:bg-muted/40">
                <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} className="mt-0.5 h-4 w-4" />
                <span className={cn("flex-1", done.has(i) && "text-muted-foreground line-through")}>{c.text}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${meta.cls}`}>{riskLabel(c.severity, lang)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
