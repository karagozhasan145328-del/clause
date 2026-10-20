"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   PipelineDemo — interactive inline demo for the "id=demo" section. A tiny
   three-phase state machine (idle → running → done) that ticks through
   pipelineDemo.stages (index → query → report), progressively revealing
   pipelineDemo.liveStats lines, then reveals pipelineDemo.resultPreview.
   Mirrors the shape of the former ReviewDemo but for the case-risk pipeline.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Check, ScanSearch, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/i18n/language-provider";
import type { L } from "@/lib/i18n/config";
import { pipelineDemo } from "@/lib/demo/data";
import { RISK_META, riskLabel } from "@/lib/risk";

export function PipelineDemo() {
  const { lang } = useLang();
  const tt = (v: L) => v[lang];
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [stage, setStage] = useState(0);
  const rm = RISK_META[pipelineDemo.resultPreview.overallRisk];

  function run() {
    if (phase === "running") return;
    setPhase("running");
    setStage(0);
    const total = pipelineDemo.stages.length;
    let i = 0;
    const tick = () => {
      i += 1;
      setStage(i);
      if (i < total) {
        setTimeout(tick, 620);
      } else {
        setTimeout(() => setPhase("done"), 420);
      }
    };
    setTimeout(tick, 480);
  }

  function reset() {
    setPhase("idle");
    setStage(0);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-pop">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/8 text-primary">
          <ScanSearch className="h-4 w-4" />
        </span>
        <p className="font-display text-[14px] font-semibold tracking-tight">
          {lang === "tr" ? "Dosya analiz hattı" : "Case analysis pipeline"}
        </p>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
          Kaya / Kaya
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* the source being processed */}
        <div>
          <p className="label-mono text-muted-foreground">{lang === "tr" ? "İşlenecek kaynak" : "Source to process"}</p>
          <div className="relative mt-1.5 overflow-hidden rounded-xl border border-border bg-muted/40 p-3.5">
            <p className="font-display text-[13px] italic leading-relaxed text-foreground/85">
              {lang === "tr"
                ? "WhatsApp dökümü · 1.842 mesaj + 6 belge (boşanma dosyası)"
                : "WhatsApp export · 1,842 messages + 6 documents (divorce case)"}
            </p>
            {/* scan-line while running */}
            {phase === "running" && (
              <span
                className="scan-line pointer-events-none absolute inset-x-0 top-0 h-8"
                style={{ background: "linear-gradient(to bottom, color-mix(in oklch, var(--color-primary) 16%, transparent), transparent)" }}
                aria-hidden
              />
            )}
          </div>
        </div>

        {/* stage progress + progressively revealed live stats (only while running) */}
        {phase === "running" && (
          <div className="space-y-3">
            <div className="space-y-2">
              {pipelineDemo.stages.map((s, i) => {
                const active = i < stage;
                const current = i === stage - 1;
                return (
                  <div
                    key={s.key}
                    className={cn("flex items-center gap-2.5 text-[13px] transition-colors", active ? "text-foreground" : "text-muted-foreground/50")}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {active ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={cn(current && "pulse-dot")}>{tt(s.label)}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              {pipelineDemo.liveStats.slice(0, stage).map((line) => (
                <p key={tt(line)} className="ink-rise flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                  {tt(line)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* the result (only when done) */}
        {phase === "done" && (
          <div className="ink-rise space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/[0.04] p-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: rm.color }}>
                <ScanSearch className="h-3.5 w-3.5 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold leading-tight">{lang === "tr" ? "Rapor hazır" : "Report ready"}</p>
                <p className="text-[11px] text-muted-foreground">{lang === "tr" ? "8 bölümlük hukuki risk raporu" : "8-section legal risk report"}</p>
              </div>
              <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", rm.cls)}>
                {riskLabel(pipelineDemo.resultPreview.overallRisk, lang)}
              </span>
            </div>

            <div>
              <p className="label-mono text-primary">{lang === "tr" ? "Genel bulgu" : "Overall finding"}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{tt(pipelineDemo.resultPreview.headline)}</p>
            </div>

            <div className="rounded-xl border border-warning/25 bg-warning/[0.06] p-3">
              <p className="label-mono text-warning-foreground">{lang === "tr" ? "Öne çıkan bulgu" : "Top finding"}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-foreground/85">{tt(pipelineDemo.resultPreview.topFinding)}</p>
            </div>
          </div>
        )}

        {/* action button */}
        {phase !== "done" ? (
          <button
            onClick={run}
            disabled={phase === "running"}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {phase === "running" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {lang === "tr" ? "Analiz ediliyor…" : "Analyzing…"}
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" />
                {lang === "tr" ? "Dosyayı analiz et" : "Analyze the case"}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {lang === "tr" ? "Tekrar dene" : "Try again"}
          </button>
        )}
      </div>
    </div>
  );
}
