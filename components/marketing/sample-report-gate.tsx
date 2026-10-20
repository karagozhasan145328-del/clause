"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   SampleReportGate — a client-side-only gated download: enter an email,
   "unlock" a compact preview of the sample 8-section report (reusing 2-3
   fields from cases[0].report.executiveSummary). No backend, no real file.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cases } from "@/lib/demo/data";
import { RISK_META, riskLabel } from "@/lib/risk";
import { FictionalDisclaimer } from "@/components/marketing/fictional-disclaimer";

export function SampleReportGate() {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const exec = cases[0].report.executiveSummary;
  const rm = RISK_META[exec.overallRisk];

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-7 shadow-soft sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-[19px] font-semibold tracking-tight">
            {lang === "tr" ? "Örnek raporu görün" : "See a sample report"}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {lang === "tr"
              ? "Gerçek çıktı formatını yansıtan 8 bölümlük örnek raporun bir önizlemesini e-postanızı bırakarak görün."
              : "Leave your email to preview a sample built in the real 8-section report format."}
          </p>
        </div>
      </div>

      {!submitted ? (
        <form
          className="mt-6 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === "tr" ? "e-posta adresiniz" : "your email address"}
            className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            {lang === "tr" ? "Örneği gör" : "View sample"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="ink-rise mt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            {lang === "tr" ? "Teşekkürler — örnek rapor aşağıda" : "Thanks — the sample report is below"}
          </div>

          {/* mini report preview card */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-4 py-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: rm.color }}>
                <FileText className="h-3.5 w-3.5 text-white" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">{cases[0].name}</p>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize" style={{ background: `color-mix(in oklch, ${rm.color} 14%, transparent)`, color: rm.color }}>
                {riskLabel(exec.overallRisk, lang)}
              </span>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[13px] leading-relaxed text-foreground/90">{t(exec.headline)}</p>
              <div className="grid grid-cols-3 gap-2">
                {exec.keyNumbers.map((k) => (
                  <div key={t(k.label)} className="rounded-lg border border-border px-2.5 py-2 text-center">
                    <p className="tnum text-[15px] font-bold leading-none">{k.value}</p>
                    <p className="mt-1 text-[9.5px] leading-tight text-muted-foreground">{t(k.label)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <FictionalDisclaimer className="mt-4" />
    </div>
  );
}
