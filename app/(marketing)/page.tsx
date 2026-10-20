"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   CLAUSE — marketing landing. A serious, editorial, authoritative
   legal-tech page for Turkish litigation lawyers. Light surfaces, hairline
   borders, deep-indigo accent, Fraunces serif headings + Hanken Grotesk body,
   tabular numerals for stats and risk scores. The site chrome (sticky nav +
   footer with the "not legal advice" disclaimer) lives in layout.tsx; this
   file is the page body.

   Everything is bilingual { tr, en } and resolved through tt() / t(). All
   marks, avatars and the floating case-risk preview are inline SVG — no
   images. Pricing is fully removed; the old pricing slot is now a
   custom-offer / book-a-demo CTA section (id="teklif").
   ───────────────────────────────────────────────────────────────────────────── */

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  Quote,
  Star,
  ScanSearch,
  Flag,
  ShieldCheck,
  Sparkles,
  Lock,
  FileCheck2,
} from "lucide-react";
import appConfig from "@/app.config";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { L } from "@/lib/i18n/config";
import { cases, pipelineDemo } from "@/lib/demo/data";
import { RISK_META, riskLabel } from "@/lib/risk";
import { RiskMatrixGrid } from "@/components/app/risk-matrix";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { PipelineDemo } from "@/components/marketing/pipeline-demo";
import { FictionalDisclaimer } from "@/components/marketing/fictional-disclaimer";
import { SampleReportGate } from "@/components/marketing/sample-report-gate";
import { DemoCtaSection } from "@/components/marketing/demo-cta";

/* ─────────────────────────────────────────────────────────────────────────────
   Local bilingual copy (doesn't belong in app.config.ts). All { tr, en }.
   ───────────────────────────────────────────────────────────────────────────── */

const HERO_BENEFITS: L[] = [
  { tr: "Her mesajı ve belgeyi okur, çelişkileri anında işaretler", en: "Reads every message and document, flags contradictions instantly" },
  { tr: "Bulguları TMK/TBK/HMK maddeleri ve Yargıtay emsalleriyle eşleştirir", en: "Matches findings to TMK/TBK/HMK statutes and Court of Cassation precedents" },
  { tr: "8 bölümlük bir rapor ve stratejik eylem planı üretir", en: "Produces an 8-section report with a strategic action plan" },
];

const TRUSTED = ["Kaya Hukuk", "Ergin & Ortakları", "Meridyen Hukuk Bürosu", "Demirtaş Hukuk", "Aydın & Partners", "Sahil Hukuk", "Vega Hukuk"];

/* How it works — four steps. */
const HOW_STEPS: { n: string; icon: string; title: L; body: L }[] = [
  { n: "01", icon: "upload", title: { tr: "Sohbet/belge yükle", en: "Upload chat/documents" }, body: { tr: "WhatsApp dökümünü ve dosya belgelerini bırak; Clause temiz bir zaman çizelgesine ayırır.", en: "Drop in the WhatsApp export and case documents; Clause parses them into a clean timeline." } },
  { n: "02", icon: "database-zap", title: { tr: "Ayrıştırma", en: "Parsing" }, body: { tr: "WhatsApp dökümü Türkçe'ye duyarlı bir şekilde mesaj mesaj ayrıştırılır, tarih ve gönderen bilgisiyle hazırlanır.", en: "The WhatsApp export is parsed message by message in a Turkish-aware way, ready with dates and sender info." } },
  { n: "03", icon: "scan-search", title: { tr: "GPT-4o analizi", en: "GPT-4o analysis" }, body: { tr: "Döküm doğrudan GPT-4o'ya gönderilir; çelişkileri ve riskleri saniyeler içinde tespit eder.", en: "The export is sent directly to GPT-4o, which detects contradictions and risks in seconds." } },
  { n: "04", icon: "list-checks", title: { tr: "Rapor & öneri", en: "Report & recommendations" }, body: { tr: "8 bölümlük hukuki risk raporu, stratejik bir eylem planıyla birlikte hazır olur.", en: "The 8-section legal risk report is ready, complete with a strategic action plan." } },
];

/* Comparison table: manual lawyer hours / generic tool / Clause. */
type CompareValue = boolean | L | string;
const COMPARE: { feature: L; manual: CompareValue; generic: CompareValue; product: CompareValue }[] = [
  { feature: { tr: "İlk dosya incelemesi süresi", en: "First-pass case review time" }, manual: { tr: "~8 saat", en: "~8 hours" }, generic: { tr: "~45 dk", en: "~45 min" }, product: { tr: "~15 dk", en: "~15 min" } },
  { feature: { tr: "Çelişki tespiti", en: "Contradiction detection" }, manual: { tr: "Hafızadan", en: "From memory" }, generic: false, product: true },
  { feature: { tr: "Hukuki dayanak eşleştirme", en: "Legal basis matching" }, manual: { tr: "Manuel", en: "Manual" }, generic: false, product: true },
  { feature: { tr: "Delil haritası çıkarma", en: "Evidence mapping" }, manual: { tr: "Değişken", en: "Variable" }, generic: false, product: true },
  { feature: { tr: "Tutarlı stratejik öneri", en: "Consistent strategic recommendations" }, manual: { tr: "Avukata göre", en: "Per lawyer" }, generic: { tr: "Kısmi", en: "Partial" }, product: true },
];

/* Testimonials — fictional Turkish avukat/hukuk bürosu personas, with metrics. */
const TESTIMONIALS: { quote: L; name: string; role: L; initials: string; metric: L }[] = [
  { quote: { tr: "Ayrılık tarihindeki çelişkiyi duruşmadan bir hafta önce yakaladık — mahkemede sürpriz yaşamadık.", en: "We caught the separation-date contradiction a week before the hearing — no surprises in court." }, name: "Ayşe Kaya", role: { tr: "Kurucu Avukat · Kaya Hukuk", en: "Founding Partner · Kaya Hukuk" }, initials: "AK", metric: { tr: "1 kritik çelişki yakalandı", en: "1 critical contradiction caught" } },
  { quote: { tr: "8 saatlik dosya incelemesi 15 dakikaya indi; artık her dosyayı aynı titizlikle tarıyoruz.", en: "An 8-hour case review dropped to 15 minutes; now every file gets the same level of scrutiny." }, name: "Emre Solak", role: { tr: "Kıdemli Avukat · Meridyen Hukuk Bürosu", en: "Senior Counsel · Meridyen Hukuk Bürosu" }, initials: "ES", metric: { tr: "inceleme süresi −97%", en: "review time −97%" } },
  { quote: { tr: "Gözden kaçırdığım bir tehdit mesajını işaretledi — müvekkilimi zor durumda bırakabilirdi.", en: "It flagged a threatening message I'd have missed — it could have hurt my client badly." }, name: "Nazlı Ergin", role: { tr: "Ortak · Ergin & Ortakları", en: "Partner · Ergin & Ortakları" }, initials: "NE", metric: { tr: "1 kritik uyarı", en: "1 critical flag" } },
  { quote: { tr: "Yargıtay emsallerini otomatik eşleştirmesi dilekçe hazırlığımı çok hızlandırdı.", en: "Automatic precedent matching sped up my petition drafting enormously." }, name: "Tolga Demirtaş", role: { tr: "Kurucu Avukat · Demirtaş Hukuk", en: "Founding Partner · Demirtaş Hukuk" }, initials: "TD", metric: { tr: "12 emsal eşleşti", en: "12 precedents matched" } },
  { quote: { tr: "Artık her mesajı tek tek okumuyorum; Clause öncelikli olanları önüme koyuyor.", en: "I no longer read every message myself; Clause surfaces the ones that matter first." }, name: "Sibel Aydın", role: { tr: "Avukat · Aydın & Partners", en: "Attorney · Aydın & Partners" }, initials: "SA", metric: { tr: "214+ çelişki taranmış", en: "214+ contradictions scanned" } },
  { quote: { tr: "Sigorta müzakeresinde kusur itirazını önceden görüp hazırlıklı gittik.", en: "We saw the fault objection coming in the insurance negotiation and went in prepared." }, name: "Caner Yıldız", role: { tr: "Avukat · Sahil Hukuk", en: "Attorney · Sahil Hukuk" }, initials: "CY", metric: { tr: "1 gün önce hazır", en: "ready a day ahead" } },
];

/* Security / trust strip (lower section) — distinct facts from the hero-adjacent TrustStrip. */
const TRUST: { icon: typeof Lock; title: L; body: L }[] = [
  { icon: Sparkles, title: { tr: "Açıklanabilir", en: "Explainable" }, body: { tr: "Her bulgu bir gerekçeye ve hukuki dayanağa bağlanır — kara kutu yok.", en: "Every finding ties to a reason and a legal basis — no black box." } },
  { icon: Lock, title: { tr: "Veri izolasyonu", en: "Data isolation" }, body: { tr: "Dosyalarınız yalnızca sizin çalışma alanınızda işlenir, modelleri eğitmek için kullanılmaz.", en: "Your files are processed only in your workspace, never used to train models." } },
  { icon: ShieldCheck, title: { tr: "İnsan her zaman devrede", en: "Human-in-the-loop" }, body: { tr: "Nihai karar her zaman sizindir.", en: "The final call is always yours." } },
];

export default function LandingPage() {
  const { t, lang } = useLang();
  const m = appConfig.marketing;
  const tt = (v: L) => v[lang];

  const sectionCopy = {
    demoTitle: { tr: "Bir dosyayı incele — canlı dene", en: "Analyze a case — try it live" } as L,
    demoSub: { tr: "Gerçek bir dosya örneği al, Clause'a incelet, riskin ve bulguların belirişini izle.", en: "Take a real sample case, run Clause on it, and watch the risk and findings appear." } as L,
    featuresTitle: { tr: "İlk dosya incelemesini kapatmak için ihtiyacın olan her şey", en: "Everything you need to close a first-pass case review" } as L,
    featuresSub: { tr: "Sohbet indekslemeden stratejik eylem planına, hukuki dayanaktan güvenliğe kadar tek çalışma masası.", en: "From chat indexing to a strategic action plan, from legal basis to security — one workbench." } as L,
    howTitle: { tr: "Yükle, indeksle, analiz et, rapor al", en: "Upload, index, analyze, report" } as L,
    howSub: { tr: "Sohbeti ve belgeleri bırak; Clause aradaki ağır işi yapsın, son kararı sen ver.", en: "Drop in the chat and documents; Clause does the heavy lifting, you make the final call." } as L,
    riskMatrixTitle: { tr: "Açıklanabilir risk matrisi", en: "Explainable risk matrix" } as L,
    riskMatrixSub: { tr: "Her bulgu olasılık × etki eksenine yerleşir — hangi risk seviyesinin ne anlama geldiğiyle birlikte.", en: "Every finding is placed on a likelihood × impact grid — together with what each risk level means." } as L,
    compareTitle: { tr: "Neden Clause?", en: "Why Clause?" } as L,
    compareSub: { tr: "Manuel avukat saatleri ve genel yapay zekâ araçlarıyla karşılaştır.", en: "Compared to manual lawyer hours and generic AI tools." } as L,
    trustTitle: { tr: "Hukuk ekiplerinin güveneceği şekilde inşa edildi", en: "Built for legal teams to trust" } as L,
    trustSub: { tr: "Güvenlik, gizlilik ve açıklanabilirlik baştan tasarlandı.", en: "Security, privacy and explainability, designed in from the start." } as L,
    testimonialsTitle: { tr: "Avukatlar Clause'a güveniyor", en: "Lawyers trust Clause" } as L,
    testimonialsSub: { tr: "Dosya risk analizini Clause'a devreden hukuk bürolarından.", en: "From law firms who hand case risk analysis to Clause." } as L,
    faqTitle: { tr: "Sıkça sorulanlar", en: "Frequently asked" } as L,
    faqSub: { tr: "Cevabını bulamadın mı? Ekibimize yaz.", en: "Can't find an answer? Reach our team." } as L,
    ctaTitle: { tr: "İlk dosyanı bugün 15 dakikada analiz et", en: "Analyze your first case in 15 minutes today" } as L,
    ctaSub: { tr: "Demo modda anahtarsız aç, hazır olduğunda kendi OpenAI anahtarını bağla.", en: "Open the keyless demo, then wire your own OpenAI key when you're ready." } as L,
  };

  return (
    <>
      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--grad-hero)" }} aria-hidden />
        <div className="paper pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left copy */}
          <div className="stagger">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-pill">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
              {t(m.badge)}
            </span>
            <h1 className="mt-5 max-w-xl font-display text-[40px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[58px]">
              {t(m.heroTitle)}{" "}
              <span className="display-accent font-normal">{t(m.heroAccent)}</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">{t(m.heroSubtitle)}</p>

            <ul className="mt-7 space-y-3">
              {HERO_BENEFITS.map((b) => (
                <li key={tt(b)} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {tt(b)}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                {t(m.heroCtaPrimary)} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-[15px] font-semibold text-foreground shadow-pill transition-colors hover:bg-muted"
              >
                {t(m.heroCtaSecondary)}
              </a>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {lang === "tr" ? "Kredi kartı gerekmez · Anahtarsız demo · 5 dakikada kurulum" : "No credit card · Keyless demo · 5-minute setup"}
            </p>
          </div>

          {/* Right floating product-preview: a case file with flagged findings */}
          <div className="relative animate-float-up lg:pl-4">
            <span className="absolute -left-8 -top-8 -z-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl drift" aria-hidden />
            <span className="absolute -bottom-10 -right-6 -z-10 h-48 w-48 rounded-full blur-3xl" aria-hidden style={{ background: "color-mix(in oklch, var(--color-serif) 18%, transparent)" }} />
            <CaseRiskPreview />
          </div>
        </div>

        {/* Trust strip */}
        <div className="mx-auto max-w-6xl px-5">
          <TrustStrip />
        </div>

        {/* Trusted-by row */}
        <div className="mt-10 border-y border-border bg-card/60">
          <div className="mx-auto max-w-6xl px-5 py-6">
            <p className="text-center label-mono text-muted-foreground">
              {lang === "tr" ? "Modern hukuk büroları tarafından kullanılıyor" : "Used by modern law firms"}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-9 gap-y-4 sm:gap-x-12">
              {TRUSTED.map((c) => (
                <CompanyMark key={c} name={c} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAND ═══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-soft sm:grid-cols-4">
          {m.stats.map((s) => (
            <div key={s.value} className="bg-card px-5 py-8 text-center">
              <p className="font-display text-3xl font-semibold tracking-tight">{s.value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{t(s.label)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ INTERACTIVE DEMO ═════════════════════════════════════════════════ */}
      <section id="demo" className="scroll-mt-20 border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="lg:sticky lg:top-24">
              <p className="label-mono text-primary">{lang === "tr" ? "Canlı analiz" : "Live analysis"}</p>
              <h2 className="mt-2 max-w-md font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.demoTitle)}</h2>
              <p className="mt-3 max-w-md text-muted-foreground">{tt(sectionCopy.demoSub)}</p>
              <ul className="mt-6 space-y-2.5">
                {pipelineDemo.stages.map((s) => (
                  <li key={s.key} className="flex items-center gap-2.5 text-[14px] text-muted-foreground">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {tt(s.label)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <PipelineDemo />
              <FictionalDisclaimer className="mt-3" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-mono text-primary">{lang === "tr" ? "Özellikler" : "Features"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.featuresTitle)}</h2>
            <p className="mt-3 text-muted-foreground">{tt(sectionCopy.featuresSub)}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {m.features.map((f) => (
              <div key={tt(f.title)} className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-pop">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight">{tt(f.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tt(f.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section id="how" className="scroll-mt-20 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-mono text-primary">{lang === "tr" ? "Nasıl çalışır" : "How it works"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.howTitle)}</h2>
            <p className="mt-3 text-muted-foreground">{tt(sectionCopy.howSub)}</p>
          </div>
          <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((s, i) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="font-display text-3xl font-semibold text-primary/15">{s.n}</span>
                </div>
                <h3 className="mt-4 font-display text-[16px] font-semibold tracking-tight">{tt(s.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tt(s.body)}</p>
                {i < HOW_STEPS.length - 1 && (
                  <span className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground lg:grid">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ RISK MATRIX DEEP-DIVE ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="label-mono text-primary">{lang === "tr" ? "Risk seviyeleri" : "Risk levels"}</p>
            <h2 className="mt-2 max-w-md font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.riskMatrixTitle)}</h2>
            <p className="mt-3 max-w-md text-muted-foreground">{tt(sectionCopy.riskMatrixSub)}</p>
            <div className="mt-7 space-y-3">
              {(["low", "medium", "high", "critical"] as const).map((level) => {
                const rm = RISK_META[level];
                const meaning: L =
                  level === "critical"
                    ? { tr: "Acil aksiyon gerekir, 48 saat içinde", en: "Requires urgent action within 48 hours" }
                    : level === "high"
                      ? { tr: "Bu hafta içinde ele alınmalı", en: "Should be addressed within the week" }
                      : level === "medium"
                        ? { tr: "Yakın takip gerekir", en: "Needs close follow-up" }
                        : { tr: "Rutin takip yeterli", en: "Routine follow-up is enough" };
                return (
                  <div key={level} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <span className="mt-0.5 h-9 w-2.5 shrink-0 rounded-full" style={{ background: rm.color }} aria-hidden />
                    <div className="min-w-0">
                      <p className="font-display text-[15px] font-semibold capitalize tracking-tight">{riskLabel(level, lang)}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{meaning[lang]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* the shared risk-matrix grid, fed with cases[0]'s findings */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-pop">
            <RiskMatrixGrid items={cases[0].report.riskMatrix} />
          </div>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ═════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-mono text-primary">{lang === "tr" ? "Karşılaştırma" : "Comparison"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.compareTitle)}</h2>
            <p className="mt-3 text-muted-foreground">{tt(sectionCopy.compareSub)}</p>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground"></th>
                    <th className="px-5 py-4 text-center font-medium text-muted-foreground">{lang === "tr" ? "Manuel avukat" : "Manual lawyer"}</th>
                    <th className="px-5 py-4 text-center font-medium text-muted-foreground">{lang === "tr" ? "Genel YZ aracı" : "Generic AI tool"}</th>
                    <th className="bg-primary/[0.04] px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 font-display font-semibold text-primary">
                        <ScanSearch className="h-4 w-4" />
                        {appConfig.name}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={tt(row.feature)} className={cn("border-b border-border/60 last:border-0", i % 2 === 1 && "bg-muted/20")}>
                      <td className="px-5 py-3.5 font-medium">{tt(row.feature)}</td>
                      <CompareCell value={row.manual} lang={lang} />
                      <CompareCell value={row.generic} lang={lang} />
                      <CompareCell value={row.product} lang={lang} highlight />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ══ GATED SAMPLE REPORT ══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SampleReportGate />
      </section>

      {/* ══ TRUST / SECURITY STRIP ═══════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-mono text-primary">{lang === "tr" ? "Güven" : "Trust"}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.trustTitle)}</h2>
          <p className="mt-3 text-muted-foreground">{tt(sectionCopy.trustSub)}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TRUST.map((s) => {
            const I = s.icon;
            return (
              <div key={tt(s.title)} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
                  <I className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-semibold tracking-tight">{tt(s.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tt(s.body)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-mono text-primary">{lang === "tr" ? "Referanslar" : "Testimonials"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.testimonialsTitle)}</h2>
            <p className="mt-3 text-muted-foreground">{tt(sectionCopy.testimonialsSub)}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((tm) => (
              <figure key={tm.name} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
                <Quote className="h-5 w-5 text-primary/30" />
                <blockquote className="mt-3 flex-1 font-display text-[15px] italic leading-relaxed text-foreground/90">
                  {tt(tm.quote)}
                </blockquote>
                <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <Avatar initials={tm.initials} />
                  <div className="min-w-0 flex-1">
                    <figcaption className="text-sm font-semibold leading-tight">{tm.name}</figcaption>
                    <p className="truncate text-xs text-muted-foreground">{tt(tm.role)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">{tt(tm.metric)}</span>
                </div>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-warning text-warning" />
            ))}
            <span className="ml-2">{lang === "tr" ? "4.9/5 · 300+ hukuk bürosu" : "4.9/5 · 300+ law firms"}</span>
          </div>
        </div>
      </section>

      {/* ══ GET A CUSTOM OFFER / BOOK A DEMO (replaces pricing) ═══════════════ */}
      <DemoCtaSection />

      {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="text-center">
            <p className="label-mono text-primary">{lang === "tr" ? "S.S.S." : "FAQ"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.faqTitle)}</h2>
            <p className="mt-3 text-muted-foreground">{tt(sectionCopy.faqSub)}</p>
          </div>
          <div className="mt-10 space-y-3">
            {m.faq.map((f) => (
              <details key={t(f.q)} className="group rounded-xl border border-border bg-card px-5 py-4 shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {t(f.q)}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                    <Plus className="h-3.5 w-3.5 group-open:hidden" />
                    <Minus className="hidden h-3.5 w-3.5 group-open:block" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-20">
        <div className="relative overflow-hidden rounded-3xl border border-border px-8 py-16 text-center text-white shadow-pop" style={{ backgroundImage: "var(--grad-brand)" }}>
          <span className="paper pointer-events-none absolute inset-0 -z-0 opacity-20" aria-hidden />
          <div className="relative z-10">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>{lang === "tr" ? "Anahtarsız demo · canlı" : "Keyless demo · live"}</span>
            </div>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tt(sectionCopy.ctaTitle)}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">{tt(sectionCopy.ctaSub)}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-[15px] font-semibold text-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                {t(m.heroCtaPrimary)} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                {lang === "tr" ? "Giriş yap" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO PRODUCT PREVIEW — a floating case-file card with flagged findings.
   ═══════════════════════════════════════════════════════════════════════════ */
function CaseRiskPreview() {
  const { lang } = useLang();
  const c = cases[0];
  const rm = RISK_META[c.overallRisk];
  const findings = c.report.riskMatrix.slice(0, 3);

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-pop sm:p-5">
      {/* case header */}
      <div className="flex items-center gap-3 border-b border-border pb-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white" style={{ background: "var(--seg-1)" }}>
          AH
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] font-semibold leading-tight tracking-tight">{c.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {c.client} · {c.messagesIndexed.toLocaleString(lang === "tr" ? "tr-TR" : "en-US")} {lang === "tr" ? "mesaj" : "messages"} · {c.documentsIndexed} {lang === "tr" ? "belge" : "docs"}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize", rm.cls)}>
          {riskLabel(c.overallRisk, lang)}
        </span>
      </div>

      {/* risk-score row */}
      <div className="mt-3.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label-mono text-muted-foreground">{lang === "tr" ? "Risk skoru" : "Risk score"}</span>
            <span className="tnum text-[12px] font-bold" style={{ color: rm.color }}>{c.score}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: rm.color }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg border border-border px-2.5 py-1.5">
            <p className="tnum text-[15px] font-bold leading-none" style={{ color: rm.color }}>{c.findingsCount}</p>
            <p className="text-[9px] text-muted-foreground">{lang === "tr" ? "bulgu" : "findings"}</p>
          </div>
          <div className="rounded-lg border border-border px-2.5 py-1.5">
            <p className="tnum text-[15px] font-bold leading-none">8</p>
            <p className="text-[9px] text-muted-foreground">{lang === "tr" ? "bölüm" : "sections"}</p>
          </div>
        </div>
      </div>

      {/* flagged findings list */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/40 px-3 py-2 label-mono text-muted-foreground">
          {lang === "tr" ? "İşaretli bulgular" : "Flagged findings"}
        </div>
        {findings.map((item, i) => {
          const frm = RISK_META[item.level];
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5",
                i === 0 && "bg-destructive/[0.03]",
                i < findings.length - 1 && "border-b border-border/60",
              )}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: frm.color }}>
                <Flag className="h-2.5 w-2.5 text-white" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{item.risk[lang]}</span>
              <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold capitalize", frm.cls)}>
                {riskLabel(item.level, lang)}
              </span>
            </div>
          );
        })}
      </div>

      {/* footer teaser + decorative CTA */}
      <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <FileCheck2 className="h-3.5 w-3.5 text-primary" />
        {lang === "tr" ? "8 bölümlü rapor hazır" : "8-section report ready"}
      </div>
      <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground">
        <ArrowRight className="h-4 w-4" />
        {lang === "tr" ? "Tam raporu gör" : "View full report"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL PARTS — inline-SVG firm marks, SVG-initial avatars, compare cells.
   ═══════════════════════════════════════════════════════════════════════════ */
function CompanyMark({ name }: { name: string }) {
  const glyphs: Record<string, React.ReactNode> = {
    "Kaya Hukuk": <path d="M3 17 L9 4 L12 11 L15 4 L21 17" />,
    "Ergin & Ortakları": <circle cx="12" cy="11" r="7" />,
    "Meridyen Hukuk Bürosu": <path d="M12 3 L20 18 H4 Z M12 9 L16 17 H8 Z" />,
    "Demirtaş Hukuk": <path d="M4 12 h16 M12 5 v14" />,
    "Aydın & Partners": <path d="M4 18 L9 6 L12 14 L15 6 L20 18" />,
    "Sahil Hukuk": <path d="M12 4 c5 4 5 10 0 14 c-5 -4 -5 -10 0 -14 z" />,
    "Vega Hukuk": <path d="M4 5 h16 v4 h-6 v9 h-4 v-9 h-6 z" />,
  };
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground/70">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {glyphs[name]}
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">{name}</span>
    </span>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" aria-hidden>
      <svg viewBox="0 0 40 40" className="h-10 w-10">
        <defs>
          <linearGradient id={`av-${initials}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(50% 0.13 282)" />
            <stop offset="1" stopColor="oklch(38% 0.13 290)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="20" fill={`url(#av-${initials})`} />
        <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="700" fill="#fff" fontFamily="var(--font-display)">
          {initials}
        </text>
      </svg>
    </span>
  );
}

function CompareCell({
  value,
  lang,
  highlight = false,
}: {
  value: boolean | L | string;
  lang: "tr" | "en";
  highlight?: boolean;
}) {
  const text = typeof value === "string" ? value : typeof value === "object" ? value[lang] : null;
  return (
    <td className={cn("px-5 py-3.5 text-center", highlight && "bg-primary/[0.04]")}>
      {typeof value === "boolean" ? (
        value ? (
          <span className={cn("mx-auto grid h-5 w-5 place-items-center rounded-full", highlight ? "bg-primary text-primary-foreground" : "bg-success/12 text-success")}>
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : (
          <span className="mx-auto grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground">
            <Minus className="h-3 w-3" />
          </span>
        )
      ) : (
        <span className={cn("tnum text-[13px] font-medium", highlight ? "text-primary" : "text-muted-foreground")}>{text}</span>
      )}
    </td>
  );
}
