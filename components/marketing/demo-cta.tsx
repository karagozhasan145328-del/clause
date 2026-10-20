"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   DemoCtaSection — replaces the old pricing section. Reads
   appConfig.marketing.demoCta and renders a centered "book a demo / get a
   custom offer" card with a client-side-only lead form. No pricing figures,
   no backend — flips to a thank-you state on submit via local useState.
   ───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import appConfig from "@/app.config";
import { useLang } from "@/components/i18n/language-provider";

export function DemoCtaSection() {
  const { t, lang } = useLang();
  const demoCta = appConfig.marketing.demoCta;
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [email, setEmail] = useState("");
  const [volume, setVolume] = useState("");

  return (
    <section id="teklif" className="scroll-mt-20 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-2xl px-5 py-20">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-soft sm:p-9">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t(demoCta.title)}</h2>
            <p className="mt-3 text-muted-foreground">{t(demoCta.subtitle)}</p>
          </div>

          {!submitted ? (
            <form
              className="mt-8 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "tr" ? "Ad Soyad" : "Full name"}
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
                />
                <input
                  required
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  placeholder={lang === "tr" ? "Büro adı" : "Firm name"}
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === "tr" ? "E-posta" : "Email"}
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
                />
                <input
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder={lang === "tr" ? "Aylık dosya hacmi" : "Monthly case volume"}
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
                />
              </div>
              <button
                type="submit"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                {t(demoCta.ctaLabel)} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-xs text-muted-foreground">{t(demoCta.formNote)}</p>
            </form>
          ) : (
            <div className="ink-rise mt-8 flex flex-col items-center gap-2 rounded-xl border border-success/25 bg-success/[0.05] px-5 py-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-success/12 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="font-display text-[16px] font-semibold tracking-tight">
                {lang === "tr" ? "Teşekkürler, ekibimiz sizinle iletişime geçecek" : "Thanks, our team will reach out"}
              </p>
              <p className="text-sm text-muted-foreground">{t(demoCta.formNote)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
