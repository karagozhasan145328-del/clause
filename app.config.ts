/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  app.config.ts — the single source of truth for this starter.            │
 * │                                                                          │
 * │  Every user-facing string is bilingual: { tr: "...", en: "..." }.        │
 * │  The guided setup (run `/setup`, or say "bu projeyi kur") edits this      │
 * │  file plus app/globals.css and .env.local.                               │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 *  CLAUSE — AI destekli müvekkil sohbeti ve dosya risk analizi.
 *  WhatsApp dökümlerini ve belgeleri indeksler (hafiza-indexle), çelişkileri
 *  ve riskleri tespit eder, 8 bölümlük bir hukuki risk raporu üretir
 *  (hukuk-sorgula). Türkçe/İngilizce kopya birlikte tutulur.
 */
import type { L } from "@/lib/i18n/config";

export type IconName = string;

export interface NavItem {
  label: L;
  href: string;
  icon: IconName;
  /** Optional "Soon" / "Beta" style badge shown muted in the sidebar. */
  badge?: L;
  /** Render as disabled/muted (e.g. a not-yet-shipped section). */
  muted?: boolean;
}

export interface NavGroup {
  label: L;
  items: NavItem[];
}

export interface Feature {
  icon: IconName;
  title: L;
  body: L;
}

export interface Stat {
  value: string;
  label: L;
}

export interface DemoCta {
  title: L;
  subtitle: L;
  formNote: L;
  ctaLabel: L;
}

export interface FaqItem {
  q: L;
  a: L;
}

export interface Integration {
  key: string;
  name: string;
  envVars: string[];
  required: boolean;
  docsUrl: string;
  purpose: string;
}

export interface AppConfig {
  name: string;
  tagline: L;
  description: L;
  domain: string;
  logoText: string;
  accentName: string;
  marketing: {
    badge: L;
    heroTitle: L;
    /** Serif-italic accent line shown inside the hero title. */
    heroAccent: L;
    heroSubtitle: L;
    heroCtaPrimary: L;
    heroCtaSecondary: L;
    features: Feature[];
    stats: Stat[];
    demoCta: DemoCta;
    faq: FaqItem[];
  };
  /** Sidebar navigation, grouped (Workspace / Library). */
  navGroups: NavGroup[];
  /** Flat nav (kept for the topbar title lookup + back-compat). */
  nav: NavItem[];
  integrations: Integration[];
}

export const appConfig: AppConfig = {
  name: "Clause",
  tagline: {
    tr: "Müvekkil sohbetlerini saatlerce değil, dakikalar içinde analiz edin.",
    en: "Analyze client conversations in minutes, not hours.",
  },
  description: {
    tr: "Clause, WhatsApp dökümlerinizi ve dosya belgelerinizi analiz eden yapay zekâ destekli bir hukuki risk raporlama sistemidir: çelişkileri, riskleri ve stratejik önerileri 8 bölümlük bir rapor halinde sunar. Hukuk ekipleri 8 saatlik dosya incelemesini 15 dakikaya indirir.",
    en: "Clause is an AI-powered legal risk reporting system that analyzes your WhatsApp exports and case documents: it surfaces contradictions, risks, and strategic recommendations in an 8-section report. Legal teams turn an 8-hour case review into 15 minutes.",
  },
  domain: "clause.legal",
  logoText: "§",
  accentName: "indigo",

  marketing: {
    badge: { tr: "Yapay zekâ destekli dosya risk analizi", en: "AI-powered case risk analysis" },
    heroTitle: {
      tr: "8 saatlik dosya incelemesini",
      en: "Turn an 8-hour case review",
    },
    heroAccent: {
      tr: "15 dakikaya indirin",
      en: "into 15 minutes",
    },
    heroSubtitle: {
      tr: "Müvekkil sohbetlerindeki çelişkiyi, siz fark etmeden önce yakalayın. WhatsApp dökümünü ve dosya belgelerini yükleyin; Clause her mesajı ve belgeyi tarar, tarih/olay çelişkilerini işaretler ve 8 bölümlük bir hukuki risk raporu hazırlar — hukuki dayanaktan stratejik önerilere kadar.",
      en: "Catch the contradiction in your client's messages before you have to. Upload a WhatsApp export and case documents; Clause scans every message and document, flags date and fact contradictions, and prepares an 8-section legal risk report — from legal basis to strategic recommendations.",
    },
    heroCtaPrimary: { tr: "Demo randevusu oluştur", en: "Book a demo" },
    heroCtaSecondary: { tr: "Canlı demoyu gör", en: "See the live demo" },
    features: [
      { icon: "database-zap", title: { tr: "Sohbet & belge indeksleme", en: "Chat & document indexing" }, body: { tr: "WhatsApp dökümlerinizi ve belgelerinizi Türkçe'ye duyarlı bir şekilde parçalar, büronuzun hafızasına ekler.", en: "Chunks your WhatsApp exports and documents in a Turkish-aware way and adds them to your firm's memory." } },
      { icon: "gauge", title: { tr: "Anlık risk taraması", en: "Instant risk scan" }, body: { tr: "Her dosya yüklendiği anda taranır; genel risk seviyesi Kritik/Yüksek/Orta/Düşük olarak işaretlenir.", en: "Every case is scanned the moment it's uploaded and rated Critical/High/Medium/Low." } },
      { icon: "git-compare-arrows", title: { tr: "Çelişki tespiti", en: "Contradiction detection" }, body: { tr: "Kronolojik olay akışını çıkarır ve tarih/beyan çelişkilerini kırmızı bayrakla işaretler.", en: "Builds a chronological timeline and flags date/statement contradictions as red flags." } },
      { icon: "scale", title: { tr: "Hukuki dayanak eşleştirme", en: "Legal basis matching" }, body: { tr: "Bulguları ilgili TMK, TBK, HMK maddeleri ve Yargıtay emsal kararlarıyla eşleştirir.", en: "Matches findings to relevant TMK/TBK/HMK statutes and Court of Cassation precedents." } },
      { icon: "list-checks", title: { tr: "Stratejik eylem planı", en: "Strategic action plan" }, body: { tr: "0-48 saat, 1-2 hafta ve 1-3 ay içinde atılacak adımları önceliklendirerek sıralar.", en: "Prioritizes next steps across 0-48 hours, 1-2 weeks, and 1-3 months." } },
      { icon: "shield-check", title: { tr: "Güvenli & gizli", en: "Secure & confidential" }, body: { tr: "AES-256 şifreleme, Türkiye/AB veri lokasyonu ve KVKK & GDPR uyumlu tasarım.", en: "AES-256 encryption, Turkey/EU data residency, and a design built for KVKK & GDPR compliance." } },
    ],
    stats: [
      { value: "−97%", label: { tr: "analiz süresi", en: "analysis time" } },
      { value: "8", label: { tr: "bölümlük rapor", en: "report sections" } },
      { value: "214+", label: { tr: "tespit edilen çelişki", en: "contradictions found" } },
      { value: "99%+", label: { tr: "mesaj kapsamı", en: "message coverage" } },
    ],
    demoCta: {
      title: { tr: "Büronuza özel teklif hazırlayalım", en: "Let's put together an offer for your firm" },
      subtitle: { tr: "Dosya hacminize ve ihtiyacınıza göre özel bir plan çıkarıyoruz — sabit bir fiyat listesi yok.", en: "We tailor a plan to your firm's case volume and needs — there's no fixed price list." },
      formNote: { tr: "Ekibimiz 1 iş günü içinde size dönüş yapar.", en: "Our team gets back to you within 1 business day." },
      ctaLabel: { tr: "Demo randevusu oluştur", en: "Book a demo" },
    },
    faq: [
      { q: { tr: "WhatsApp dökümü nasıl yüklenir?", en: "How do I upload a WhatsApp export?" }, a: { tr: "WhatsApp'ın \"Sohbeti dışa aktar\" özelliğiyle aldığınız .txt dosyasını sürükleyip bırakmanız yeterli; Clause geri kalanını halleder.", en: "Just drag in the .txt file from WhatsApp's \"Export chat\" feature — Clause handles the rest." } },
      { q: { tr: "Verilerim nerede saklanıyor?", en: "Where is my data stored?" }, a: { tr: "Tüm veriler Türkiye/AB sınırları içinde, AES-256 ile şifrelenmiş olarak saklanır. KVKK ve GDPR'a uygun tasarlanmıştır.", en: "All data is stored within Turkey/EU borders, encrypted with AES-256. Designed to align with KVKK and GDPR." } },
      { q: { tr: "Bu hukuki tavsiye mi?", en: "Is this legal advice?" }, a: { tr: "Hayır. Clause analizi hızlandıran bir karar destek aracıdır — yapay zekâ karar vermez, siz karar verirsiniz. Çıktılar hukuki tavsiye değildir.", en: "No. Clause is a decision-support tool that speeds up analysis — the AI doesn't decide, you do. Outputs are not legal advice." } },
      { q: { tr: "OpenAI entegrasyonu gerçek mi çalışıyor?", en: "Is the OpenAI integration really live?" }, a: { tr: "Evet. .env.local'a kendi OPENAI_API_KEY'inizi ekleyin; yüklediğiniz WhatsApp dökümü bir Next.js Route Handler üzerinden doğrudan GPT-4o'ya gönderilir ve gerçek zamanlı analiz edilir. Anahtar yoksa ürün demo veriyle çalışır.", en: "Yes. Add your own OPENAI_API_KEY to .env.local and the WhatsApp export you upload is sent straight to GPT-4o through a Next.js Route Handler for real-time analysis. Without a key, the product runs on demo data." } },
      { q: { tr: "Ücretsiz örnek rapor var mı?", en: "Is there a free sample report?" }, a: { tr: "Evet, landing sayfasındaki örnek raporu e-postanızı bırakarak görüntüleyebilirsiniz.", en: "Yes — leave your email on the landing page to view the sample report." } },
      { q: { tr: "Fiyatlandırma nasıl çalışıyor?", en: "How does pricing work?" }, a: { tr: "Sabit bir fiyat listemiz yok; büronuzun dosya hacmine göre özel teklif hazırlıyoruz — demo görüşmesinde netleşir.", en: "We don't have a fixed price list; we prepare a custom offer based on your firm's case volume — it's clarified during the demo call." } },
      { q: { tr: "Verilerim eğitimde kullanılır mı?", en: "Is my data used for training?" }, a: { tr: "Hayır. Dosyalarınız yalnızca sizin çalışma alanınızda işlenir; modelleri eğitmek için kullanılmaz.", en: "No. Your files are processed only in your workspace and are never used to train models." } },
      { q: { tr: "Teknoloji nedir?", en: "What's the stack?" }, a: { tr: "Next.js 16, React 19, Tailwind v4. Bir Next.js Route Handler üzerinden doğrudan OpenAI (GPT-4o) ile bağlanır — ara katman yok.", en: "Next.js 16, React 19, Tailwind v4. Wires directly to OpenAI (GPT-4o) through a Next.js Route Handler — no middleman." } },
    ],
  },

  navGroups: [
    {
      label: { tr: "Çalışma alanı", en: "Workspace" },
      items: [
        { label: { tr: "Panel", en: "Dashboard" }, href: "/dashboard", icon: "layout-dashboard" },
        { label: { tr: "Dosyalar", en: "Cases" }, href: "/cases", icon: "folder-search" },
        { label: { tr: "Raporlar", en: "Reports" }, href: "/reports", icon: "file-text" },
        { label: { tr: "Analiz kriterleri", en: "Analysis criteria" }, href: "/criteria", icon: "book-marked" },
      ],
    },
    {
      label: { tr: "Kütüphane", en: "Library" },
      items: [
        { label: { tr: "Risk kalıp kütüphanesi", en: "Risk pattern library" }, href: "/library", icon: "library" },
        { label: { tr: "Şablonlar", en: "Templates" }, href: "/templates", icon: "file-stack", muted: true, badge: { tr: "Yakında", en: "Soon" } },
        { label: { tr: "Entegrasyonlar", en: "Integrations" }, href: "/settings", icon: "plug" },
      ],
    },
  ],

  nav: [
    { label: { tr: "Panel", en: "Dashboard" }, href: "/dashboard", icon: "layout-dashboard" },
    { label: { tr: "Dosyalar", en: "Cases" }, href: "/cases", icon: "folder-search" },
    { label: { tr: "Raporlar", en: "Reports" }, href: "/reports", icon: "file-text" },
    { label: { tr: "Analiz kriterleri", en: "Analysis criteria" }, href: "/criteria", icon: "book-marked" },
    { label: { tr: "Ayarlar", en: "Settings" }, href: "/settings", icon: "settings" },
  ],

  integrations: [
    {
      key: "llm",
      name: "OpenAI (GPT-4o)",
      envVars: ["OPENAI_API_KEY"],
      required: false,
      docsUrl: "https://platform.openai.com/docs/quickstart",
      purpose: "Yüklenen WhatsApp dökümünü bir Next.js Route Handler üzerinden doğrudan analiz eder ve 8 bölümlük hukuki risk raporunu üretir. Olmadan dosyalar demo veriden gelir.",
    },
    {
      key: "supabase",
      name: "Supabase",
      envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      required: false,
      docsUrl: "https://supabase.com/dashboard/project/_/settings/api",
      purpose: "Veritabanı ve kullanıcı girişi. Olmadan uygulama demo modunda çalışır.",
    },
  ],
};

export default appConfig;
