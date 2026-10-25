"use client";

/* ─────────────────────────────────────────────────
   CLAUSE — landing page for Turkish lawyers and in-house counsel.
   Every claim here maps to something the product actually does:
   - findings are tied to statute articles; court-decision citations are forbidden in the
     prompt and stripped server-side (lib/analysis.ts)
   - proposed clause text is copy-ready; figures not stated in the document are left blank
   - output is decision support, not legal advice
   No invented testimonials, logos or statistics. Everything is bilingual { tr, en }.
   ───────────────────────────────────────────────── */

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, ClipboardCopy, FileUp, ListOrdered, Scale, ShieldCheck, Ban } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { L } from "@/lib/i18n/config";
import { RISK_META, riskLabel } from "@/lib/risk";

const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  primary: "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  lg: "h-12 px-6 text-base",
  md: "h-10 px-4 text-sm",
};

/* ── Copy ───────────────────────────────────────── */

const TRUST: { icon: typeof Scale; title: L; body: L }[] = [
  {
    icon: Ban,
    title: { tr: "Uydurma emsal karar yok", en: "No invented case law" },
    body: {
      tr: "Model mahkeme kararı, esas/karar numarası veya daire adı üretmez. Üretmeye kalkarsa sunucu bu atıfları çıkarır ve size bildirir.",
      en: "The model never produces court decisions, docket numbers or chamber names. If it tries, the server strips them and tells you.",
    },
  },
  {
    icon: Scale,
    title: { tr: "Kanun maddesi dayanağı", en: "Statute-based findings" },
    body: {
      tr: "Her bulgu TBK, TTK, HMK, İş Kanunu veya KVKK maddesine bağlanır; kaynağı belirsizse bunu ayrıca belirtir. Atıflar avukat tarafından doğrulanmalıdır.",
      en: "Each finding is tied to TBK, TTK, HMK, Labour Law or KVKK provisions, and says so when the basis is uncertain. Citations must be verified by a lawyer.",
    },
  },
  {
    icon: ClipboardCopy,
    title: { tr: "Kopyalanabilir alternatif madde", en: "Copy-ready replacement clause" },
    body: {
      tr: "Tavsiye cümlesi değil, sözleşmeye yapıştırılabilecek madde metni. Belgede olmayan tutar, oran ve süreler uydurulmaz; boş bırakılır.",
      en: "Not advice prose — clause text you can paste into the contract. Amounts, rates and periods not in the document are never invented; they are left blank.",
    },
  },
  {
    icon: ShieldCheck,
    title: { tr: "Karar destek mimarisi", en: "Decision-support by design" },
    body: {
      tr: "Clause hukuki mütalaa vermez; incelemeyi hızlandırır. Her bulgunun yanında belgeden alıntı bulunur, böylece 30 saniyede kontrol edersiniz.",
      en: "Clause does not give legal opinions; it speeds up review. Every finding carries a quote from the document so you can check it in seconds.",
    },
  },
];

const STEPS: { icon: typeof Scale; title: L; body: L }[] = [
  {
    icon: FileUp,
    title: { tr: "Dosyayı yükle", en: "Upload the file" },
    body: { tr: "Sözleşme, dilekçe veya yazışma dökümünü (.txt) yükleyin. Dil otomatik uygulanır.", en: "Upload the contract, pleading or chat export (.txt)." },
  },
  {
    icon: ListOrdered,
    title: { tr: "Riskleri öncelik sırasıyla gör", en: "See risks by priority" },
    body: { tr: "Bulgular Kritik → Orta → Düşük sıralanır; her biri kanun maddesi ve belgeden alıntıyla gelir.", en: "Findings are ranked Critical → Medium → Low, each with a statute reference and a quote from the document." },
  },
  {
    icon: BookOpenCheck,
    title: { tr: "Alternatif maddeyi tek tıkla kopyala", en: "Copy the replacement clause in one click" },
    body: { tr: "Hazır madde metnini kopyalayın ya da tüm önerileri tek seferde alın; kontrol edip belgeye ekleyin.", en: "Copy a ready clause or all proposals at once, review, and drop them into the document." },
  },
];

type Plan = { name: L; price: string; blurb: L; features: L[]; cta: L; highlight?: boolean };

/** Placeholder plan contents — edit here. Billing is not wired yet: every CTA goes to sign-up. */
const PLANS: Plan[] = [
  {
    name: { tr: "Solo", en: "Solo" },
    price: "$99",
    blurb: { tr: "Tek avukat ve serbest çalışanlar için", en: "For individual lawyers and freelancers" },
    features: [
      { tr: "Türk hukukuna göre risk analizi", en: "Risk analysis under Turkish law" },
      { tr: "Öncelik sıralı bulgular + kanun dayanağı", en: "Priority-ranked findings + statute basis" },
      { tr: "Kopyalanabilir alternatif maddeler", en: "Copy-ready replacement clauses" },
      { tr: "Kayıtlı analiz geçmişi", en: "Saved analysis history" },
    ],
    cta: { tr: "Solo ile başla", en: "Start with Solo" },
  },
  {
    name: { tr: "Büro", en: "Firm" },
    price: "$249",
    blurb: { tr: "Küçük ve orta ölçekli hukuk büroları için", en: "For small and mid-size law firms" },
    features: [
      { tr: "Solo'daki her şey", en: "Everything in Solo" },
      { tr: "Daha yüksek analiz hacmi", en: "Higher analysis volume" },
      { tr: "Ekip kullanımı (yakında)", en: "Team seats (coming soon)" },
      { tr: "PDF / Word yükleme (yakında)", en: "PDF / Word upload (coming soon)" },
    ],
    cta: { tr: "Büro planını dene", en: "Try the Firm plan" },
    highlight: true,
  },
  {
    name: { tr: "Kurumsal", en: "Enterprise" },
    price: "$499",
    blurb: { tr: "Şirket hukuk departmanları için", en: "For in-house legal departments" },
    features: [
      { tr: "Büro'daki her şey", en: "Everything in Firm" },
      { tr: "En yüksek analiz hacmi", en: "Highest analysis volume" },
      { tr: "Veri işleme ve KVKK görüşmesi", en: "Data-processing and KVKK discussion" },
      { tr: "Öncelikli destek", en: "Priority support" },
    ],
    cta: { tr: "Kurumsal için başla", en: "Start with Enterprise" },
  },
];

const FAQ: { q: L; a: L }[] = [
  {
    q: { tr: "Bu hukuki tavsiye mi?", en: "Is this legal advice?" },
    a: { tr: "Hayır. Clause bir karar destek aracıdır. Kanun atıflarını ve önerilen metinleri kullanmadan önce bir avukat doğrulamalıdır.", en: "No. Clause is a decision-support tool. A lawyer must verify statute references and proposed wording before use." },
  },
  {
    q: { tr: "Verilerim nasıl işleniyor?", en: "How is my data handled?" },
    a: { tr: "Yüklediğiniz dosyalar özel bir depoda tutulur ve her kullanıcı yalnızca kendi kayıtlarına erişir. Analiz için metin, OpenAI API'sine gönderilir; bu, yurt dışına aktarım anlamına gelir. Müvekkil verisi yüklemeden önce KVKK yükümlülüklerinizi değerlendirin.", en: "Uploaded files are stored privately and each user can only access their own records. For analysis the text is sent to the OpenAI API, which is a cross-border transfer. Assess your KVKK obligations before uploading client data." },
  },
  {
    q: { tr: "Hangi dosya türleri destekleniyor?", en: "Which file types are supported?" },
    a: { tr: "Şu an metin dosyaları (.txt, .md, .csv, .json, .log). PDF ve Word desteği yolda.", en: "Text files today (.txt, .md, .csv, .json, .log). PDF and Word support is on the way." },
  },
  {
    q: { tr: "Hangi mevzuata göre analiz yapılıyor?", en: "Which legislation does it apply?" },
    a: { tr: "TBK, TTK, HMK, İş Kanunu ve KVKK odaklıdır; konu gerektirdiğinde TMK ve tüketici mevzuatına da bakar.", en: "Focused on TBK, TTK, HMK, the Labour Law and KVKK, and looks at the Civil Code and consumer law when relevant." },
  },
];

/* ── Page ───────────────────────────────────────── */

export default function LandingPage() {
  const { t, lang } = useLang();
  const tr = lang === "tr";

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60" style={{ backgroundImage: "radial-gradient(60% 60% at 50% 0%, oklch(92% 0.04 282), transparent)" }} />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="label-mono text-primary">{tr ? "Türk hukuku için yapay zekâ risk analizi" : "AI risk analysis for Turkish law"}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {tr ? (
                <>
                  Sözleşmeleri ve dava dosyalarını dakikalar değil,{" "}
                  <span className="italic text-primary">saniyeler içinde</span> Türk hukukuna göre analiz edin.
                </>
              ) : (
                <>
                  Analyze contracts and case files under Turkish law in{" "}
                  <span className="italic text-primary">seconds, not minutes.</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {tr
                ? "TBK, TTK ve KVKK'ya göre riskleri öncelik sırasıyla görün, her biri için kanun dayanağını ve sözleşmeye yapıştırabileceğiniz alternatif maddeyi alın."
                : "See risks ranked by priority under TBK, TTK and KVKK — each with its statute basis and a replacement clause you can paste into the contract."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className={cn(btn.base, btn.primary, btn.lg)}>
                {tr ? "Ücretsiz dene" : "Try it free"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={cn(btn.base, btn.outline, btn.lg)}>
                {tr ? "Test hesabıyla incele" : "Explore with a test account"}
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {tr ? "Karar destek aracıdır · hukuki mütalaa değildir" : "Decision support · not legal advice"}
            </p>
          </div>

          <ExampleCard tr={tr} lang={lang} />
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead
            kicker={tr ? "Avukatlar için tasarlandı" : "Built for lawyers"}
            title={tr ? "Güvenebileceğiniz bir analiz, kontrol edebileceğiniz bir çıktı" : "An analysis you can trust and an output you can check"}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {TRUST.map((x) => (
              <div key={x.title.en} className="rounded-2xl border border-border bg-card p-6 shadow-pill">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <x.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{t(x.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(x.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead kicker={tr ? "Nasıl çalışır" : "How it works"} title={tr ? "Üç adımda dosyadan karara" : "From file to decision in three steps"} />
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title.en} className="relative rounded-2xl border border-border bg-card p-6 shadow-pill">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <span className="mt-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{t(s.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead kicker={tr ? "Fiyatlandırma" : "Pricing"} title={tr ? "Büronuzun ölçeğine göre plan seçin" : "Pick a plan that fits your practice"} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name.en}
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-6 shadow-pill",
                  p.highlight ? "border-primary ring-1 ring-primary/40" : "border-border",
                )}
              >
                {p.highlight && <span className="label-mono mb-2 text-primary">{tr ? "En çok tercih edilen" : "Most popular"}</span>}
                <h3 className="font-display text-xl font-semibold">{t(p.name)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(p.blurb)}</p>
                <p className="mt-5">
                  <span className="font-display text-4xl font-semibold tabular-nums">{p.price}</span>
                  <span className="text-sm text-muted-foreground"> {tr ? "/ ay" : "/ month"}</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f.en} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{t(f)}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn(btn.base, btn.md, "mt-6", p.highlight ? btn.primary : btn.outline)}>
                  {t(p.cta)}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {tr ? "Fiyatlar aylıktır. Ödeme altyapısı henüz aktif değil; kayıt olarak erken erişim alırsınız." : "Prices are monthly. Billing is not live yet; signing up gives you early access."}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <SectionHead kicker={tr ? "Sık sorulanlar" : "FAQ"} title={tr ? "Karar vermeden önce bilmeniz gerekenler" : "What to know before you decide"} />
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card shadow-pill">
          {FAQ.map((f) => (
            <details key={f.q.en} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {t(f.q)}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.a)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl p-10 text-center text-white" style={{ backgroundImage: "var(--grad-brand)" }}>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            {tr ? "İlk sözleşmenizi şimdi analiz edin" : "Analyze your first contract now"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            {tr ? "Hesap açın ya da hazır test hesabıyla ürünü dakikalar içinde inceleyin." : "Create an account, or explore the product in minutes with the ready-made test account."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(btn.base, btn.lg, "bg-white text-primary hover:bg-white/90")}>
              {tr ? "Kayıt ol" : "Sign up"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={cn(btn.base, btn.lg, "border border-white/40 text-white hover:bg-white/10")}>
              {tr ? "Giriş yap" : "Sign in"}
            </Link>
            <Link href="/dashboard" className={cn(btn.base, btn.lg, "text-white/90 hover:text-white")}>
              {tr ? "Panele git" : "Go to dashboard"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="label-mono text-primary">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

/** Static illustration of what one finding looks like (not live data). */
function ExampleCard({ tr, lang }: { tr: boolean; lang: "tr" | "en" }) {
  const meta = RISK_META.critical;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-pill" aria-label={tr ? "Örnek çıktı" : "Sample output"}>
      <div className="flex items-center justify-between">
        <span className="label-mono text-muted-foreground">{tr ? "Örnek çıktı" : "Sample output"}</span>
        <span className="text-[11px] text-muted-foreground">{tr ? "Canlı veri değil" : "Illustration"}</span>
      </div>
      <div className="mt-3 rounded-xl border border-border p-3.5" style={{ borderLeft: `4px solid ${meta.color}` }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">#1</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>{riskLabel("critical", lang)}</span>
          <span className="font-semibold">{tr ? "Madde 5 — Cezai şart" : "Clause 5 — Penalty clause"}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["TBK m. 179", "TBK m. 182"].map((b) => (
            <span key={b} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">{b}</span>
          ))}
        </div>
        <p className="mt-2 text-sm">
          {tr
            ? "Cezai şart fahiş olabilir ve hâkimin indirim hakkı dışlanmış; bu hüküm kanuna aykırıdır."
            : "The penalty may be excessive and the judge's right to reduce it is excluded, which conflicts with the statute."}
        </p>
        <blockquote className="mt-2 border-l-2 border-border pl-2 text-xs text-muted-foreground">
          {tr ? "“…Hâkimin cezai şartı indirme hakkı bulunmamaktadır.”" : "“…The judge has no right to reduce the penalty.”"}
        </blockquote>
        <div className="mt-2.5 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
          <span className="label-mono text-primary">{tr ? "Alternatif madde metni" : "Replacement clause text"}</span>
          <p className="mt-1.5 rounded-md bg-background/70 p-2 font-serif text-[13px] leading-relaxed">
            {tr
              ? "Madde 5 – Cezai Şart: Hizmet alan, sözleşmeyi haklı sebep olmaksızın feshederse [TUTAR] TL cezai şart öder. Hâkim, TBK m. 182/3 uyarınca fahiş görülen cezai şartı indirebilir."
              : "Clause 5 – Penalty: If the customer terminates without just cause, it pays a penalty of [AMOUNT]. The judge may reduce an excessive penalty under TBK art. 182/3."}
          </p>
        </div>
      </div>
    </div>
  );
}
