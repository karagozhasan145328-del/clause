"use client";

import { Fragment, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import type { AskResult } from "@/lib/archive/shared";
import { cn } from "@/lib/utils";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps each verified quote inside the source text in <mark>. Quotes are whitespace-normalised, so match loosely. */
function Highlighted({ text, quotes }: { text: string; quotes: string[] }) {
  if (quotes.length === 0) return <>{text}</>;
  const re = new RegExp(`(${quotes.map((q) => escapeRe(q).replace(/\s+/g, "\\s+")).join("|")})`, "g");
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** The answer with numbered citation chips; every chip opens the exact quote it was verified against. */
export function AnswerWithCitations({ result }: { result: AskResult }) {
  const { lang } = useLang();
  const tr = lang === "tr";
  const [open, setOpen] = useState<string | null>(null); // "segment:citation"

  const quotesBySource = new Map<number, string[]>();
  for (const seg of result.segments)
    for (const c of seg.citations) quotesBySource.set(c.source, [...(quotesBySource.get(c.source) ?? []), c.quote]);

  return (
    <div className="space-y-4">
      {result.ungrounded ? (
        <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/15 p-3 text-xs text-warning-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {tr
            ? "Bu yanıtta doğrulanmış alıntı yok. Arşivindeki kararlarla desteklenmediği için güvenme; kaynakları kendin kontrol et."
            : "This answer has no verified citations. It isn't backed by decisions in your archive — don't rely on it; check the sources yourself."}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          {tr
            ? "Gösterilen alıntılar kaynak metinde birebir doğrulandı."
            : "Quotes shown were verified verbatim against the source text."}
          {result.droppedCitations > 0 && (
            <span>
              {tr ? ` ${result.droppedCitations} doğrulanamayan alıntı gizlendi.` : ` ${result.droppedCitations} unverifiable citation(s) hidden.`}
            </span>
          )}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="whitespace-pre-wrap text-[14px] leading-relaxed">
          {result.segments.map((seg, si) => (
            <Fragment key={si}>
              {seg.text}
              {seg.citations.map((c, ci) => {
                const id = `${si}:${ci}`;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOpen(open === id ? null : id)}
                    aria-expanded={open === id}
                    className={cn(
                      "mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-primary/10 px-1 align-super text-[10.5px] font-semibold text-primary hover:bg-primary/20",
                      open === id && "bg-primary text-primary-foreground",
                    )}
                  >
                    {c.source}
                  </button>
                );
              })}
              {seg.citations.map((c, ci) =>
                open === `${si}:${ci}` ? (
                  <span key={`q${ci}`} className="my-2 block rounded-lg border-l-2 border-primary bg-muted/50 p-3 text-[12.5px]">
                    <span className="label-mono block text-primary">{result.sources[c.source - 1]?.label}</span>
                    <span className="mt-1 block italic text-foreground/85">“{c.quote}”</span>
                  </span>
                ) : null,
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div>
        <p className="label-mono mb-2 text-muted-foreground">{tr ? "Kaynaklar" : "Sources"}</p>
        <ol className="space-y-2">
          {result.sources.map((s, i) => {
            const cited = quotesBySource.has(i + 1);
            return (
              <li key={s.chunkId} className={cn("rounded-xl border bg-card p-3", cited ? "border-primary/40" : "border-border opacity-70")}>
                <p className="text-[13px] font-semibold">
                  <span className="mr-1.5 text-primary">[{i + 1}]</span>
                  {s.label}
                  {s.heading && <span className="label-mono ml-2 font-normal text-muted-foreground">{s.heading}</span>}
                </p>
                <p className={cn("mt-1.5 text-[12.5px] leading-relaxed text-foreground/80", !cited && "line-clamp-3")}>
                  <Highlighted text={s.content} quotes={quotesBySource.get(i + 1) ?? []} />
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
