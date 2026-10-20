/**
 * Demo data — what makes Clause feel alive with zero API keys. Labels are
 * bilingual ({ tr, en }); the dashboard resolves them to the active language.
 * Everything here is FICTIONAL — sample clients, chat excerpts and report
 * findings are illustrative only and are NOT legal advice. Replace with a real
 * n8n pipeline (hafiza-indexle → Qdrant → hukuk-sorgula/GPT-4o) once setup
 * wires the keys.
 */
import type { L } from "@/lib/i18n/config";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type CaseCategory = "Family" | "Employment" | "Commercial" | "Tenancy" | "Inheritance";
export type CaseStatus = "ready" | "analyzing" | "urgent" | "queued";

/* ── Top stat row ──────────────────────────────────────────────────────────── */
export interface DStat {
  label: L;
  value: string;
  delta?: number;
  hint?: L;
  icon: string;
}
const vsLast: L = { tr: "geçen aya göre", en: "vs last month" };
export const stats: DStat[] = [
  { label: { tr: "İncelenen dosya", en: "Cases analyzed" }, value: "86", delta: 21.2, icon: "folder-search", hint: vsLast },
  { label: { tr: "Tespit edilen çelişki", en: "Contradictions found" }, value: "214", delta: 14.6, icon: "triangle-alert", hint: vsLast },
  { label: { tr: "Ort. analiz süresi", en: "Avg analysis time" }, value: "14 dk", delta: -97.0, icon: "timer", hint: { tr: "manuel ~8 saatti", en: "was ~8h manual" } },
  { label: { tr: "Bekleyen", en: "Pending" }, value: "5", delta: 0, icon: "clock", hint: { tr: "kuyrukta", en: "in queue" } },
];

/* ── WhatsApp-style chat transcript indexed by hafiza-indexle ──────────────── */
export interface ChatMessage {
  id: string;
  sender: "client" | "counterparty" | "lawyer" | "system";
  senderName: string;
  text: string;
  /** ISO date-time */
  at: string;
  /** highlighted as evidence / contradiction by hukuk-sorgula */
  flagged?: boolean;
  flagNote?: L;
}

/* ── The 8 report sections produced by hukuk-sorgula (GPT-4o) ──────────────── */
export interface ExecutiveSummary {
  overallRisk: RiskLevel;
  headline: L;
  keyNumbers: { label: L; value: string }[];
}

export interface TimelineEvent {
  id: string;
  /** ISO date */
  date: string;
  label: L;
  detail: L;
  source: "whatsapp" | "document" | "note";
  /** cross-references another event's id when dates/facts conflict */
  contradiction?: { withEventId: string; note: L };
}

export interface EvidenceItem {
  id: string;
  title: L;
  source: L;
  excerpt: string;
  strength: "strong" | "moderate" | "weak";
  supports: L;
}

export interface RiskMatrixItem {
  id: string;
  risk: L;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  level: RiskLevel;
  note: L;
}

export interface PartyAnalysis {
  party: L;
  strengths: L[];
  weaknesses: L[];
  toneLabel: L;
  /** 0–100, higher = calmer/more cooperative tone */
  toneScore: number;
}

export interface LegalBasis {
  id: string;
  /** e.g. "TMK m. 166" */
  statute: string;
  title: L;
  relevance: L;
  /** e.g. "Yargıtay 2. HD, 2021/1234 E." */
  precedent?: string;
}

export interface StrategicRecommendation {
  id: string;
  tier: "0-48h" | "1-2w" | "1-3m";
  action: L;
  rationale: L;
  priority: RiskLevel;
}

export interface CaseReport {
  executiveSummary: ExecutiveSummary;
  timeline: TimelineEvent[];
  evidence: EvidenceItem[];
  riskMatrix: RiskMatrixItem[];
  parties: PartyAnalysis[];
  legalBasis: LegalBasis[];
  recommendations: StrategicRecommendation[];
  conclusion: {
    summary: L;
    urgentActions: { id: string; action: L; deadline: L }[];
  };
}

/* ── A case file + its full 8-section risk report (drawer / report page) ───── */
export interface CaseFile {
  id: string;
  name: string;
  client: string;
  category: CaseCategory;
  overallRisk: RiskLevel;
  status: CaseStatus;
  /** ISO date received */
  received: string;
  messagesIndexed: number;
  documentsIndexed: number;
  findingsCount: number;
  /** 0–100 overall risk score */
  score: number;
  /** one-line AI summary */
  summary: L;
  chatSample: ChatMessage[];
  report: CaseReport;
}

export const cases: CaseFile[] = [
  {
    id: "d1",
    name: "Boşanma Dosyası — Kaya / Kaya",
    client: "Y. Kaya",
    category: "Family",
    overallRisk: "critical",
    status: "urgent",
    received: "2026-07-20T09:10:00Z",
    messagesIndexed: 1842,
    documentsIndexed: 6,
    findingsCount: 7,
    score: 91,
    summary: {
      tr: "Ayrılık tarihi konusunda kritik bir çelişki var; bu durum nafaka ve mal rejimi hesaplamasını doğrudan etkiliyor.",
      en: "A critical contradiction over the separation date directly affects the alimony and property-regime calculation.",
    },
    chatSample: [
      { id: "d1m1", sender: "client", senderName: "Y. Kaya", text: "Aslında ben Mart ayında evden ayrıldım, o zamandan beri fiilen ayrıyız.", at: "2026-05-02T20:14:00Z" },
      { id: "d1m2", sender: "counterparty", senderName: "B. Kaya", text: "Hayır, sen Haziran'a kadar evdeydin, unutma.", at: "2026-05-02T20:16:00Z", flagged: true, flagNote: { tr: "Ayrılık tarihi konusunda doğrudan çelişki — dilekçedeki Mart tarihiyle uyuşmuyor.", en: "Direct contradiction on separation date — conflicts with the March date in the petition." } },
      { id: "d1m3", sender: "counterparty", senderName: "B. Kaya", text: "O evi sattığımızı söylemeyeceksin kimseye, tamam mı? Aramızda kalsın.", at: "2026-05-14T22:03:00Z", flagged: true, flagNote: { tr: "Mal varlığının gizlenmesine işaret eden ifade.", en: "Statement suggesting concealment of an asset." } },
      { id: "d1m4", sender: "client", senderName: "Y. Kaya", text: "Çocuğu bu hafta sonu göremeyeceksin, avukatım öyle dedi.", at: "2026-06-01T11:40:00Z" },
      { id: "d1m5", sender: "counterparty", senderName: "B. Kaya", text: "Bana böyle yaparsan pişman olursun, seni uyarıyorum.", at: "2026-06-01T11:52:00Z", flagged: true, flagNote: { tr: "Tehdit içerikli dil — taraf analizi/ton skoruna yansıtıldı.", en: "Threatening language — reflected in the party tone score." } },
    ],
    report: {
      executiveSummary: {
        overallRisk: "critical",
        headline: { tr: "Ayrılık tarihi çelişkisi ve mal kaçırma şüphesi, dosyayı kritik risk seviyesine taşıyor.", en: "A separation-date contradiction and a suspected asset concealment push this case to critical risk." },
        keyNumbers: [
          { label: { tr: "Tespit edilen çelişki", en: "Contradictions found" }, value: "3" },
          { label: { tr: "Tehdit/taciz işareti", en: "Threat/harassment flags" }, value: "2" },
          { label: { tr: "Velayet duruşmasına kalan", en: "Days to custody hearing" }, value: "9 gün" },
        ],
      },
      timeline: [
        { id: "d1t1", date: "2026-03-14", label: { tr: "Dilekçede beyan edilen ayrılık tarihi", en: "Separation date stated in petition" }, detail: { tr: "Müvekkil dilekçesinde 14 Mart 2026'da evden ayrıldığını beyan etti.", en: "Client's petition states they left the home on 14 March 2026." }, source: "document" },
        { id: "d1t2", date: "2026-05-02", label: { tr: "WhatsApp'ta ayrılık tarihi tartışması", en: "WhatsApp dispute over separation date" }, detail: { tr: "Karşı taraf, müvekkilin Haziran'a kadar evde kaldığını iddia etti.", en: "Counterparty claims the client stayed until June." }, source: "whatsapp", contradiction: { withEventId: "d1t1", note: { tr: "İki ayrı ayrılık tarihi — nafaka ve katkı payı hesaplamasını doğrudan etkiler.", en: "Two conflicting separation dates — directly affects alimony and contribution calculations." } } },
        { id: "d1t3", date: "2026-05-14", label: { tr: "Ev satışının gizlenmesi talebi", en: "Request to conceal home sale" }, detail: { tr: "Karşı taraf bir mülk satışının gizli tutulmasını istedi.", en: "Counterparty asked that a property sale be kept secret." }, source: "whatsapp" },
        { id: "d1t4", date: "2026-06-01", label: { tr: "Velayet konusunda tehdit dili", en: "Threatening language over custody" }, detail: { tr: "Çocukla görüşme programı üzerine gerginlik ve tehdit içerikli mesaj.", en: "Tension and a threatening message over the visitation schedule." }, source: "whatsapp" },
      ],
      evidence: [
        { id: "d1e1", title: { tr: "Ayrılık tarihi mesaj çifti", en: "Separation-date message pair" }, source: { tr: "WhatsApp · 2 Mayıs 2026", en: "WhatsApp · 2 May 2026" }, excerpt: "\"Aslında ben Mart ayında evden ayrıldım...\" / \"Hayır, sen Haziran'a kadar evdeydin.\"", strength: "strong", supports: { tr: "Dilekçedeki Mart tarihini zayıflatabilir; karşı tanık/kayıtla teyit gerekir.", en: "May weaken the March date in the petition; needs corroboration from another witness or record." } },
        { id: "d1e2", title: { tr: "Mal kaçırma itirafı", en: "Asset-concealment admission" }, source: { tr: "WhatsApp · 14 Mayıs 2026", en: "WhatsApp · 14 May 2026" }, excerpt: "\"O evi sattığımızı söylemeyeceksin kimseye, tamam mı?\"", strength: "strong", supports: { tr: "Mal rejimi tasfiyesinde saklanan bir varlığa işaret eder.", en: "Points to a concealed asset relevant to property-regime liquidation." } },
        { id: "d1e3", title: { tr: "Tehdit içerikli mesaj", en: "Threatening message" }, source: { tr: "WhatsApp · 1 Haziran 2026", en: "WhatsApp · 1 June 2026" }, excerpt: "\"Bana böyle yaparsan pişman olursun, seni uyarıyorum.\"", strength: "moderate", supports: { tr: "Velayet değerlendirmesinde karşı tarafın tutumuna dair kanıt.", en: "Evidence of the counterparty's conduct relevant to the custody assessment." } },
      ],
      riskMatrix: [
        { id: "d1r1", risk: { tr: "Ayrılık tarihi ihtilafının nafaka hesabını bozması", en: "Separation-date dispute skewing alimony calculation" }, likelihood: "high", impact: "high", level: "critical", note: { tr: "Ek tanık beyanı veya banka kaydıyla tarih doğrulanmalı.", en: "The date should be corroborated with witness testimony or bank records." } },
        { id: "d1r2", risk: { tr: "Gizlenmiş mal varlığının tasfiye dışı kalması", en: "Concealed asset being excluded from liquidation" }, likelihood: "medium", impact: "high", level: "high", note: { tr: "Tapu/banka kaydı talep edilmeli.", en: "Title deed and bank records should be requested." } },
        { id: "d1r3", risk: { tr: "Tehdit dilinin velayet kararını etkilemesi", en: "Threatening language affecting the custody decision" }, likelihood: "medium", impact: "medium", level: "medium", note: { tr: "Mahkemeye sunulabilecek ek kayıt toplanmalı.", en: "Additional records suitable for submission to the court should be gathered." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (Y. Kaya)", en: "Client (Y. Kaya)" }, strengths: [{ tr: "Tutarlı ve belgeye dayalı ifadeler", en: "Consistent, document-backed statements" }, { tr: "İletişimde sakin ton", en: "Calm communication tone" }], weaknesses: [{ tr: "Ayrılık tarihine dair ek kanıt eksik", en: "Lacks additional evidence for the separation date" }], toneLabel: { tr: "Sakin / işbirlikçi", en: "Calm / cooperative" }, toneScore: 78 },
        { party: { tr: "Karşı taraf (B. Kaya)", en: "Counterparty (B. Kaya)" }, strengths: [{ tr: "Ekonomik konularda ayrıntılı bilgiye sahip", en: "Detailed knowledge of financial matters" }], weaknesses: [{ tr: "Tehdit içerikli dil kullanımı", en: "Use of threatening language" }, { tr: "Mal kaçırma itirafı", en: "Asset-concealment admission" }], toneLabel: { tr: "Gergin / yükselen", en: "Tense / escalating" }, toneScore: 31 },
      ],
      legalBasis: [
        { id: "d1l1", statute: "TMK m. 166", title: { tr: "Evlilik birliğinin sarsılması", en: "Irretrievable breakdown of marriage" }, relevance: { tr: "Ayrılık tarihinin netleşmesi boşanma sebebinin ispatını güçlendirir.", en: "Clarifying the separation date strengthens proof of the grounds for divorce." }, precedent: "Yargıtay 2. HD, 2021/4521 E." },
        { id: "d1l2", statute: "TMK m. 202", title: { tr: "Edinilmiş mallara katılma rejimi", en: "Participation in acquired property regime" }, relevance: { tr: "Gizlenen mal varlığı tasfiye hesabına dahil edilmelidir.", en: "Concealed assets must be included in the liquidation calculation." } },
        { id: "d1l3", statute: "TMK m. 182", title: { tr: "Velayetin kullanılması", en: "Exercise of custody" }, relevance: { tr: "Tarafın iletişim tonu ve tehdit dili velayet takdirinde dikkate alınabilir.", en: "The party's communication tone and threatening language may factor into the custody determination." } },
      ],
      recommendations: [
        { id: "d1a1", tier: "0-48h", action: { tr: "Tehdit içeren mesajları noter onaylı tespit ile kayıt altına alın.", en: "Have the threatening messages notarized for the record." }, rationale: { tr: "Delilin bütünlüğünü korur.", en: "Preserves the integrity of the evidence." }, priority: "critical" },
        { id: "d1a2", tier: "0-48h", action: { tr: "Ayrılık tarihini teyit edecek üçüncü kişi tanıklığı talep edin.", en: "Request third-party witness testimony to confirm the separation date." }, rationale: { tr: "Dilekçedeki tarihi güçlendirir.", en: "Strengthens the date in the petition." }, priority: "high" },
        { id: "d1a3", tier: "1-2w", action: { tr: "Tapu ve banka kayıtlarını mahkeme aracılığıyla talep edin.", en: "Request title deed and bank records through the court." }, rationale: { tr: "Gizlenen mal varlığını belgeler.", en: "Documents the concealed asset." }, priority: "high" },
        { id: "d1a4", tier: "1-3m", action: { tr: "Velayet değerlendirmesi için sosyal inceleme raporu talep edin.", en: "Request a social-assessment report for the custody evaluation." }, rationale: { tr: "Tarafların tutumunu bağımsız bir kaynakla destekler.", en: "Supports the parties' conduct with an independent source." }, priority: "medium" },
      ],
      conclusion: {
        summary: { tr: "Dosya kritik risk taşıyor; ayrılık tarihi çelişkisi ve mal kaçırma şüphesi öncelikli olarak belgelenmelidir.", en: "This case carries critical risk; the separation-date contradiction and suspected asset concealment must be documented as a priority." },
        urgentActions: [
          { id: "d1u1", action: { tr: "Tehditkâr mesajları tespit ettirin", en: "Notarize the threatening messages" }, deadline: { tr: "24 saat içinde", en: "within 24 hours" } },
          { id: "d1u2", action: { tr: "Velayet duruşması için dosya hazırlığını tamamlayın", en: "Complete case prep for the custody hearing" }, deadline: { tr: "72 saat içinde", en: "within 72 hours" } },
        ],
      },
    },
  },
  {
    id: "d2",
    name: "Mobbing ve Haksız Fesih — S. Aydın",
    client: "S. Aydın",
    category: "Employment",
    overallRisk: "high",
    status: "analyzing",
    received: "2026-07-19T13:45:00Z",
    messagesIndexed: 963,
    documentsIndexed: 3,
    findingsCount: 5,
    score: 74,
    summary: {
      tr: "Fesih öncesi tonun aniden sertleşmesi ve yazılı uyarı olmadan işten çıkarma, haksız fesih iddiasını güçlendiriyor.",
      en: "A sudden shift in tone before termination, with no written warning, strengthens the wrongful-termination claim.",
    },
    chatSample: [
      { id: "d2m1", sender: "counterparty", senderName: "Yönetici — K. Soner", text: "Bu ay performansın gayet iyiydi, teşekkürler.", at: "2026-06-02T09:12:00Z" },
      { id: "d2m2", sender: "counterparty", senderName: "Yönetici — K. Soner", text: "Artık seninle çalışmak istemiyorum, yarın gelme.", at: "2026-06-18T18:03:00Z", flagged: true, flagNote: { tr: "Ton 16 gün içinde aniden sertleşti — yazılı uyarı kaydı yok.", en: "Tone escalated sharply within 16 days — no written warning on record." } },
      { id: "d2m3", sender: "client", senderName: "S. Aydın", text: "Neden, herhangi bir uyarı almadım ki?", at: "2026-06-18T18:05:00Z" },
      { id: "d2m4", sender: "counterparty", senderName: "Yönetici — K. Soner", text: "Sebep sormana gerek yok, imzala git.", at: "2026-06-18T18:07:00Z", flagged: true, flagNote: { tr: "Fesih gerekçesinin belgelenmediğine işaret ediyor.", en: "Indicates the termination reason was never documented." } },
    ],
    report: {
      executiveSummary: {
        overallRisk: "high",
        headline: { tr: "Yazılı uyarı olmadan ani fesih, mobbing ve haksız fesih iddiasını destekliyor.", en: "An abrupt termination with no written warning supports the mobbing and wrongful-termination claim." },
        keyNumbers: [
          { label: { tr: "Ton değişimi", en: "Tone shift" }, value: "16 gün" },
          { label: { tr: "Yazılı uyarı kaydı", en: "Written warnings on record" }, value: "0" },
          { label: { tr: "İşe iade dava süresi", en: "Reinstatement filing window" }, value: "~11 gün" },
        ],
      },
      timeline: [
        { id: "d2t1", date: "2026-06-02", label: { tr: "Olumlu performans mesajı", en: "Positive performance message" }, detail: { tr: "Yönetici performansı olumlu değerlendirdi.", en: "Manager rated performance positively." }, source: "whatsapp" },
        { id: "d2t2", date: "2026-06-18", label: { tr: "Ani ve gerekçesiz fesih", en: "Sudden, unexplained termination" }, detail: { tr: "Aynı yöneticiden 16 gün sonra ani fesih bildirimi.", en: "The same manager issues a sudden termination notice 16 days later." }, source: "whatsapp", contradiction: { withEventId: "d2t1", note: { tr: "Olumlu değerlendirmeden 16 gün sonra ani fesih — tutarsız.", en: "Abrupt termination just 16 days after a positive review — inconsistent." } } },
        { id: "d2t3", date: "2026-06-19", label: { tr: "Fesih bildirimi (yazılı)", en: "Termination notice (written)" }, detail: { tr: "İşveren yazılı fesih bildirimi gönderdi, gerekçe belirtilmedi.", en: "Employer sent a written termination notice with no stated reason." }, source: "document" },
      ],
      evidence: [
        { id: "d2e1", title: { tr: "Ton değişimi mesaj çifti", en: "Tone-shift message pair" }, source: { tr: "WhatsApp · 2–18 Haziran 2026", en: "WhatsApp · 2–18 June 2026" }, excerpt: "\"Bu ay performansın gayet iyiydi\" → \"Artık seninle çalışmak istemiyorum, yarın gelme.\"", strength: "strong", supports: { tr: "Ani ve gerekçesiz fesih iddiasını güçlendirir.", en: "Strengthens the claim of sudden, unjustified termination." } },
        { id: "d2e2", title: { tr: "Gerekçe talebinin reddi", en: "Refusal to give a reason" }, source: { tr: "WhatsApp · 18 Haziran 2026", en: "WhatsApp · 18 June 2026" }, excerpt: "\"Sebep sormana gerek yok, imzala git.\"", strength: "strong", supports: { tr: "Fesih gerekçesinin belgelenmediğini gösterir.", en: "Shows the termination reason was never documented." } },
      ],
      riskMatrix: [
        { id: "d2r1", risk: { tr: "Haksız fesih tazminatı riski", en: "Risk of wrongful-termination compensation" }, likelihood: "high", impact: "high", level: "high", note: { tr: "Yazılı savunma alınmadan fesih, işveren aleyhine güçlü bir emsal oluşturur.", en: "Termination without a written defense request creates a strong precedent against the employer." } },
        { id: "d2r2", risk: { tr: "Mobbing iddiasının ispat yükü", en: "Burden of proof for the mobbing claim" }, likelihood: "medium", impact: "medium", level: "medium", note: { tr: "Ek tanık ifadeleriyle desteklenmeli.", en: "Should be supported with additional witness statements." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (S. Aydın)", en: "Client (S. Aydın)" }, strengths: [{ tr: "Olumlu performans kaydı mevcut", en: "Positive performance record on file" }], weaknesses: [{ tr: "Sözlü tanık desteği henüz toplanmadı", en: "Verbal witness support not yet gathered" }], toneLabel: { tr: "Şaşkın / işbirlikçi", en: "Surprised / cooperative" }, toneScore: 70 },
        { party: { tr: "İşveren (K. Soner)", en: "Employer (K. Soner)" }, strengths: [], weaknesses: [{ tr: "Yazılı savunma talep etmeden fesih", en: "Terminated without requesting a written defense" }, { tr: "Ani ton değişimi", en: "Abrupt tone shift" }], toneLabel: { tr: "Ani / sert", en: "Abrupt / harsh" }, toneScore: 22 },
      ],
      legalBasis: [
        { id: "d2l1", statute: "İş Kanunu m. 19", title: { tr: "Sözleşmenin feshinde usul", en: "Termination procedure" }, relevance: { tr: "Savunma alınmadan yapılan fesih usul eksikliği oluşturur.", en: "Termination without a defense request is a procedural defect." }, precedent: "Yargıtay 9. HD, 2022/8890 E." },
        { id: "d2l2", statute: "İş Kanunu m. 20", title: { tr: "Fesih bildirimine itiraz", en: "Objection to termination notice" }, relevance: { tr: "İşe iade davası açma süresi bu tarihten işlemeye başlar.", en: "The reinstatement filing period runs from this date." } },
      ],
      recommendations: [
        { id: "d2a1", tier: "0-48h", action: { tr: "İşe iade davası için süre takibini başlatın.", en: "Start tracking the reinstatement filing deadline." }, rationale: { tr: "Hak düşürücü süre kaçırılmamalı.", en: "The statutory deadline must not be missed." }, priority: "high" },
        { id: "d2a2", tier: "1-2w", action: { tr: "Ton değişimini destekleyecek ek tanık ifadeleri toplayın.", en: "Gather additional witness statements supporting the tone shift." }, rationale: { tr: "Mobbing iddiasını güçlendirir.", en: "Strengthens the mobbing claim." }, priority: "medium" },
        { id: "d2a3", tier: "1-3m", action: { tr: "Arabuluculuk başvurusunu değerlendirin.", en: "Consider a mandatory mediation application." }, rationale: { tr: "Dava öncesi zorunlu adım, hızlı çözüm ihtimali sunar.", en: "A required pre-suit step that offers a chance at a faster resolution." }, priority: "medium" },
      ],
      conclusion: {
        summary: { tr: "Güçlü bir haksız fesih dosyası; süre takibi ve tanık toplama önceliklidir.", en: "A strong wrongful-termination case; deadline tracking and witness collection are the priorities." },
        urgentActions: [
          { id: "d2u1", action: { tr: "Arabuluculuk başvurusunu hazırlayın", en: "Prepare the mediation application" }, deadline: { tr: "48 saat içinde", en: "within 48 hours" } },
        ],
      },
    },
  },
  {
    id: "d3",
    name: "Ortaklık Uyuşmazlığı — Vega Yapı",
    client: "Vega Yapı Ltd. Şti.",
    category: "Commercial",
    overallRisk: "high",
    status: "ready",
    received: "2026-07-17T10:30:00Z",
    messagesIndexed: 1410,
    documentsIndexed: 5,
    findingsCount: 6,
    score: 68,
    summary: {
      tr: "Sözlü kâr paylaşımı anlaşmasına dair mesajlar, yazılı sözleşmedeki oranla çelişiyor.",
      en: "Messages referencing a verbal profit-sharing agreement conflict with the ratio in the written contract.",
    },
    chatSample: [
      { id: "d3m1", sender: "counterparty", senderName: "Ortak — T. Ergin", text: "Aramızda konuştuğumuz gibi kârı yüzde 60-40 paylaşıyoruz, sözleşmeyi sonra düzeltiriz.", at: "2026-04-11T15:20:00Z", flagged: true, flagNote: { tr: "Yazılı sözleşmedeki %50-50 oranıyla çelişiyor.", en: "Conflicts with the 50-50 ratio in the written contract." } },
      { id: "d3m2", sender: "client", senderName: "Vega Yapı — M. Şahin", text: "Tamam, geçen ayki ödemeyi de o orana göre yaptım zaten.", at: "2026-04-11T15:25:00Z" },
      { id: "d3m3", sender: "counterparty", senderName: "Ortak — T. Ergin", text: "Son faturayı ödemedim, biliyorsun nakit sıkıntısı var şu an.", at: "2026-06-30T09:44:00Z", flagged: true, flagNote: { tr: "Ödeme itirafı — alacak talebini destekler.", en: "Payment admission — supports the receivable claim." } },
    ],
    report: {
      executiveSummary: {
        overallRisk: "high",
        headline: { tr: "Sözlü kâr paylaşımı anlaşması yazılı sözleşmeyle çelişiyor; ödeme itirafı alacak talebini güçlendiriyor.", en: "A verbal profit-sharing deal conflicts with the written contract; a payment admission strengthens the receivable claim." },
        keyNumbers: [
          { label: { tr: "Oran çelişkisi", en: "Ratio contradiction" }, value: "%60-40 / %50-50" },
          { label: { tr: "Ödeme itirafı", en: "Payment admissions" }, value: "2" },
          { label: { tr: "Etkilenen fatura tutarı", en: "Invoice amount affected" }, value: "₺340.000" },
        ],
      },
      timeline: [
        { id: "d3t1", date: "2026-01-15", label: { tr: "Yazılı ortaklık sözleşmesi imzalandı", en: "Written partnership agreement signed" }, detail: { tr: "Sözleşmede kâr paylaşımı %50-50 olarak belirlendi.", en: "The contract fixes profit sharing at 50-50." }, source: "document" },
        { id: "d3t2", date: "2026-04-11", label: { tr: "Sözlü oran değişikliği mesajı", en: "Message on a verbal ratio change" }, detail: { tr: "Karşı taraf %60-40 oranından söz etti.", en: "Counterparty references a 60-40 split." }, source: "whatsapp", contradiction: { withEventId: "d3t1", note: { tr: "Yazılı sözleşmeyle doğrudan çelişen bir oran iddiası.", en: "A ratio claim directly conflicting with the written contract." } } },
        { id: "d3t3", date: "2026-06-30", label: { tr: "Ödenmemiş fatura itirafı", en: "Unpaid-invoice admission" }, detail: { tr: "Karşı taraf son faturayı ödemediğini kabul etti.", en: "Counterparty admits the last invoice is unpaid." }, source: "whatsapp" },
      ],
      evidence: [
        { id: "d3e1", title: { tr: "Kâr oranı çelişkisi", en: "Profit-ratio contradiction" }, source: { tr: "WhatsApp · 11 Nisan 2026", en: "WhatsApp · 11 April 2026" }, excerpt: "\"Aramızda konuştuğumuz gibi kârı yüzde 60-40 paylaşıyoruz...\"", strength: "moderate", supports: { tr: "Sözlü değişiklik iddiasını destekler ama yazılı teyit gerekir.", en: "Supports the claim of a verbal amendment but needs written corroboration." } },
        { id: "d3e2", title: { tr: "Ödeme itirafı", en: "Payment admission" }, source: { tr: "WhatsApp · 30 Haziran 2026", en: "WhatsApp · 30 June 2026" }, excerpt: "\"Son faturayı ödemedim, biliyorsun nakit sıkıntısı var.\"", strength: "strong", supports: { tr: "Alacak davasında doğrudan delil niteliğinde.", en: "Constitutes direct evidence in a receivable/debt claim." } },
      ],
      riskMatrix: [
        { id: "d3r1", risk: { tr: "Kâr oranı ihtilafının tasfiyeyi geciktirmesi", en: "Profit-ratio dispute delaying dissolution" }, likelihood: "high", impact: "high", level: "high", note: { tr: "Ek yazışma ve banka transferleriyle oran teyit edilmeli.", en: "The ratio should be confirmed with further correspondence and bank transfers." } },
        { id: "d3r2", risk: { tr: "Ödenmemiş faturanın tahsil edilememesi", en: "Failure to collect the unpaid invoice" }, likelihood: "low", impact: "medium", level: "medium", note: { tr: "İtiraf niteliğindeki mesaj güçlü bir dayanak sağlıyor.", en: "The admission message provides a strong basis for collection." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (Vega Yapı)", en: "Client (Vega Yapı)" }, strengths: [{ tr: "Ödeme kayıtları düzenli", en: "Well-kept payment records" }], weaknesses: [{ tr: "Sözlü değişikliği yazıya dökmemiş", en: "Never documented the verbal amendment in writing" }], toneLabel: { tr: "İşbirlikçi", en: "Cooperative" }, toneScore: 74 },
        { party: { tr: "Karşı taraf (T. Ergin)", en: "Counterparty (T. Ergin)" }, strengths: [{ tr: "Nakit akışı konusunda şeffaf", en: "Transparent about cash-flow issues" }], weaknesses: [{ tr: "Ödeme yükümlülüğünü geciktirme eğilimi", en: "Tendency to delay payment obligations" }], toneLabel: { tr: "Kaçamaklı", en: "Evasive" }, toneScore: 46 },
      ],
      legalBasis: [
        { id: "d3l1", statute: "TBK m. 620", title: { tr: "Adi ortaklıkta kâr ve zarar paylaşımı", en: "Profit/loss sharing in ordinary partnership" }, relevance: { tr: "Sözlü değişiklik iddiası ek delille desteklenmezse yazılı sözleşme esas alınır.", en: "Absent further evidence, the written contract governs over the verbal-amendment claim." } },
        { id: "d3l2", statute: "TBK m. 128", title: { tr: "Borcun ikrarı", en: "Acknowledgment of debt" }, relevance: { tr: "WhatsApp'taki ödeme itirafı ikrar niteliğinde değerlendirilebilir.", en: "The WhatsApp payment admission may be treated as an acknowledgment of debt." }, precedent: "Yargıtay 15. HD, 2020/3312 E." },
      ],
      recommendations: [
        { id: "d3a1", tier: "0-48h", action: { tr: "Ödeme itirafını içeren mesajları noter tespiti ile kayıt altına alın.", en: "Notarize the messages containing the payment admission." }, rationale: { tr: "Delilin bütünlüğünü korur.", en: "Preserves the integrity of the evidence." }, priority: "high" },
        { id: "d3a2", tier: "1-2w", action: { tr: "İhtarname göndererek ödenmemiş faturayı talep edin.", en: "Send a formal notice demanding payment of the unpaid invoice." }, rationale: { tr: "Temerrüdü resmileştirir.", en: "Formalizes the default." }, priority: "medium" },
        { id: "d3a3", tier: "1-3m", action: { tr: "Kâr oranı ihtilafı için banka kayıtlarıyla destekli dava hazırlığı yapın.", en: "Prepare litigation on the profit-ratio dispute, supported by bank records." }, rationale: { tr: "Sözlü iddiayı somut kayıtlarla güçlendirir.", en: "Strengthens the verbal claim with concrete records." }, priority: "medium" },
      ],
      conclusion: {
        summary: { tr: "Ödeme itirafı güçlü bir dayanak sağlıyor; kâr oranı ihtilafı için ek kayıt toplanmalı.", en: "The payment admission provides a strong basis; further records should be gathered for the profit-ratio dispute." },
        urgentActions: [
          { id: "d3u1", action: { tr: "Mesajları noter tespiti ile kayıt altına alın", en: "Notarize the messages" }, deadline: { tr: "48 saat içinde", en: "within 48 hours" } },
        ],
      },
    },
  },
  {
    id: "d4",
    name: "Kira Tahliye — Sahil Apartmanı",
    client: "N. Ural",
    category: "Tenancy",
    overallRisk: "medium",
    status: "ready",
    received: "2026-07-15T08:20:00Z",
    messagesIndexed: 512,
    documentsIndexed: 2,
    findingsCount: 3,
    score: 41,
    summary: {
      tr: "Genel olarak sakin bir dosya; yalnızca bir tarih boşluğu netleştirilmeli.",
      en: "A generally calm case; only one timeline gap needs clarifying.",
    },
    chatSample: [
      { id: "d4m1", sender: "counterparty", senderName: "Kiracı — O. Demir", text: "Kirayı bu ay biraz geç yatırabilirim, haber vermek istedim.", at: "2026-05-03T12:10:00Z" },
      { id: "d4m2", sender: "client", senderName: "N. Ural", text: "Sorun değil, ne zaman yatırırsın peki?", at: "2026-05-03T12:15:00Z" },
      { id: "d4m3", sender: "counterparty", senderName: "Kiracı — O. Demir", text: "En geç ay sonu derim.", at: "2026-05-03T12:16:00Z" },
    ],
    report: {
      executiveSummary: {
        overallRisk: "medium",
        headline: { tr: "Dosyada büyük bir risk yok; yalnızca bir ödeme-tarihi boşluğu belgelenmeli.", en: "No major risk in this case; only a payment-date gap needs documenting." },
        keyNumbers: [
          { label: { tr: "Gecikmiş ödeme sayısı", en: "Late payments" }, value: "2" },
          { label: { tr: "Belgelenmemiş dönem", en: "Undocumented period" }, value: "9 gün" },
          { label: { tr: "Tahliye ihtarı süresi", en: "Eviction notice window" }, value: "30 gün" },
        ],
      },
      timeline: [
        { id: "d4t1", date: "2026-05-03", label: { tr: "Gecikmiş ödeme bildirimi", en: "Late-payment notice" }, detail: { tr: "Kiracı ödemenin gecikeceğini bildirdi.", en: "Tenant notified of a delayed payment." }, source: "whatsapp" },
        { id: "d4t2", date: "2026-05-31", label: { tr: "Ödemenin yapılıp yapılmadığı belirsiz", en: "Unclear whether payment was made" }, detail: { tr: "Bu tarihe dair ne belge ne mesaj kaydı var.", en: "No document or message exists for this date." }, source: "note" },
      ],
      evidence: [
        { id: "d4e1", title: { tr: "Gecikme bildirimi", en: "Delay notice" }, source: { tr: "WhatsApp · 3 Mayıs 2026", en: "WhatsApp · 3 May 2026" }, excerpt: "\"Kirayı bu ay biraz geç yatırabilirim.\"", strength: "moderate", supports: { tr: "Tahliye talebinde gecikme geçmişini gösterir.", en: "Shows a history of late payment relevant to the eviction request." } },
      ],
      riskMatrix: [
        { id: "d4r1", risk: { tr: "Ödeme tarihinin belgelenmemesi", en: "Payment date undocumented" }, likelihood: "low", impact: "low", level: "low", note: { tr: "Banka dekontu talep edilerek kapatılabilir.", en: "Can be closed by requesting a bank receipt." } },
          { id: "d4r2", risk: { tr: "Tahliye sürecinin uzaması", en: "Eviction process running long" }, likelihood: "medium", impact: "medium", level: "medium", note: { tr: "İhtarname süreci standart takvimde ilerliyor.", en: "The formal-notice process is proceeding on a standard timeline." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (N. Ural)", en: "Client (N. Ural)" }, strengths: [{ tr: "Anlaşılır ve belgeli iletişim", en: "Clear, documented communication" }], weaknesses: [], toneLabel: { tr: "Sakin", en: "Calm" }, toneScore: 82 },
        { party: { tr: "Kiracı (O. Demir)", en: "Tenant (O. Demir)" }, strengths: [{ tr: "Şeffaf bildirimler", en: "Transparent notices" }], weaknesses: [{ tr: "Tekrarlayan gecikmeler", en: "Recurring late payments" }], toneLabel: { tr: "İşbirlikçi", en: "Cooperative" }, toneScore: 68 },
      ],
      legalBasis: [
        { id: "d4l1", statute: "TBK m. 352", title: { tr: "Kira bedelinin ödenmemesi nedeniyle tahliye", en: "Eviction for non-payment of rent" }, relevance: { tr: "İki haklı ihtar şartı bu dosyada henüz oluşmadı.", en: "The two-warning threshold has not yet been met in this file." } },
      ],
      recommendations: [
        { id: "d4a1", tier: "1-2w", action: { tr: "31 Mayıs ödemesi için banka dekontu talep edin.", en: "Request a bank receipt for the 31 May payment." }, rationale: { tr: "Zaman çizelgesindeki boşluğu kapatır.", en: "Closes the timeline gap." }, priority: "low" },
      ],
      conclusion: {
        summary: { tr: "Düşük-orta risk; tek eksik ödeme kaydı tamamlanınca dosya nettir.", en: "Low-to-medium risk; the file is clean once the one missing payment record is completed." },
        urgentActions: [],
      },
    },
  },
  {
    id: "d5",
    name: "Miras Paylaşımı — Demirtaş Ailesi",
    client: "F. Demirtaş",
    category: "Inheritance",
    overallRisk: "medium",
    status: "analyzing",
    received: "2026-07-12T16:00:00Z",
    messagesIndexed: 788,
    documentsIndexed: 4,
    findingsCount: 4,
    score: 55,
    summary: {
      tr: "Mirasçılar arasında vasiyetnamenin geçerliliği konusunda çelişkili beyanlar var.",
      en: "Conflicting statements among heirs over the validity of the will.",
    },
    chatSample: [
      { id: "d5m1", sender: "counterparty", senderName: "Kardeş — H. Demirtaş", text: "Babam o vasiyeti hasta yatağında değil, çok önceden yazmıştı.", at: "2026-03-20T14:00:00Z", flagged: true, flagNote: { tr: "Diğer mirasçının beyanıyla çelişiyor.", en: "Conflicts with another heir's statement." } },
      { id: "d5m2", sender: "client", senderName: "F. Demirtaş", text: "Hayır, ben yanındaydım, son ayında yazdırdı noterle.", at: "2026-03-20T14:05:00Z" },
    ],
    report: {
      executiveSummary: {
        overallRisk: "medium",
        headline: { tr: "Vasiyetnamenin yazıldığı tarih konusunda mirasçılar arasında çelişki var.", en: "Heirs disagree on when the will was drafted." },
        keyNumbers: [
          { label: { tr: "Çelişkili beyan", en: "Conflicting statements" }, value: "1" },
          { label: { tr: "Mirasçı sayısı", en: "Number of heirs" }, value: "3" },
          { label: { tr: "Zayıf delil sayısı", en: "Weak-strength evidence items" }, value: "1" },
        ],
      },
      timeline: [
        { id: "d5t1", date: "2026-03-20", label: { tr: "Vasiyetin yazıldığı tarih tartışması", en: "Dispute over when the will was drafted" }, detail: { tr: "İki mirasçı farklı tarihler ileri sürdü.", en: "Two heirs assert different dates." }, source: "whatsapp" },
      ],
      evidence: [
        { id: "d5e1", title: { tr: "Vasiyet tarihi çelişkisi", en: "Will-date contradiction" }, source: { tr: "WhatsApp · 20 Mart 2026", en: "WhatsApp · 20 March 2026" }, excerpt: "\"Babam o vasiyeti hasta yatağında değil, çok önceden yazmıştı.\"", strength: "weak", supports: { tr: "Noter kaydıyla doğrulanmadan zayıf delil sayılır.", en: "Considered weak until corroborated by the notary record." } },
      ],
      riskMatrix: [
        { id: "d5r1", risk: { tr: "Vasiyetin ehliyet itirazına konu olması", en: "Will challenged on grounds of capacity" }, likelihood: "medium", impact: "medium", level: "medium", note: { tr: "Noter kaydı ve tarih netleştirilmeli.", en: "The notary record and date should be clarified." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (F. Demirtaş)", en: "Client (F. Demirtaş)" }, strengths: [{ tr: "Noter süreciyle ilgili doğrudan tanıklık", en: "Direct testimony about the notary process" }], weaknesses: [], toneLabel: { tr: "Kararlı", en: "Firm" }, toneScore: 66 },
        { party: { tr: "Kardeş (H. Demirtaş)", en: "Sibling (H. Demirtaş)" }, strengths: [], weaknesses: [{ tr: "Tarih iddiası kayıtla desteklenmiyor", en: "Date claim unsupported by any record" }], toneLabel: { tr: "Şüpheci", en: "Skeptical" }, toneScore: 52 },
      ],
      legalBasis: [
        { id: "d5l1", statute: "TMK m. 502", title: { tr: "Vasiyetin ehliyet şartı", en: "Testamentary capacity requirement" }, relevance: { tr: "Vasiyetin yazıldığı tarihteki sağlık durumu ehliyeti etkiler.", en: "The testator's health at the drafting date affects capacity." } },
      ],
      recommendations: [
        { id: "d5a1", tier: "1-2w", action: { tr: "Noterden vasiyetin düzenlenme tarihini teyit edin.", en: "Confirm the will's execution date with the notary." }, rationale: { tr: "Çelişkiyi kesin olarak çözer.", en: "Definitively resolves the contradiction." }, priority: "medium" },
      ],
      conclusion: {
        summary: { tr: "Noter kaydı temin edilince çelişki büyük olasılıkla ortadan kalkacak.", en: "The contradiction will likely resolve once the notary record is obtained." },
        urgentActions: [],
      },
    },
  },
  {
    id: "d6",
    name: "Alacak Davası — Norm Tekstil",
    client: "Norm Tekstil San. Tic. A.Ş.",
    category: "Commercial",
    overallRisk: "low",
    status: "ready",
    received: "2026-07-08T11:00:00Z",
    messagesIndexed: 340,
    documentsIndexed: 3,
    findingsCount: 2,
    score: 22,
    summary: {
      tr: "Alacağın büyük kısmı zaten tahsil edilmiş; kalan tutar için net bir ödeme taahhüdü mevcut.",
      en: "Most of the receivable is already collected; a clear payment commitment covers the remainder.",
    },
    chatSample: [
      { id: "d6m1", sender: "counterparty", senderName: "Müşteri — R. Tekin", text: "Kalan 40 bin TL'yi ay sonuna kadar göndereceğim, söz.", at: "2026-06-25T17:30:00Z" },
    ],
    report: {
      executiveSummary: {
        overallRisk: "low",
        headline: { tr: "Dosya büyük ölçüde çözüme kavuşmuş, kalan alacak için yazılı taahhüt var.", en: "The case is largely resolved, with a written commitment covering the remaining receivable." },
        keyNumbers: [
          { label: { tr: "Tahsil edilen tutar", en: "Amount collected" }, value: "%78" },
          { label: { tr: "Kalan alacak", en: "Remaining receivable" }, value: "₺40.000" },
          { label: { tr: "Bulgular", en: "Findings" }, value: "2" },
        ],
      },
      timeline: [
        { id: "d6t1", date: "2026-06-25", label: { tr: "Ödeme taahhüdü", en: "Payment commitment" }, detail: { tr: "Müşteri kalan tutarı ay sonuna kadar ödemeyi taahhüt etti.", en: "Customer commits to paying the remainder by month-end." }, source: "whatsapp" },
      ],
      evidence: [
        { id: "d6e1", title: { tr: "Ödeme taahhüdü", en: "Payment commitment" }, source: { tr: "WhatsApp · 25 Haziran 2026", en: "WhatsApp · 25 June 2026" }, excerpt: "\"Kalan 40 bin TL'yi ay sonuna kadar göndereceğim, söz.\"", strength: "strong", supports: { tr: "Takip talebinde doğrudan delil.", en: "Direct evidence in a collection request." } },
      ],
      riskMatrix: [
        { id: "d6r1", risk: { tr: "Taahhüdün yerine getirilmemesi", en: "Commitment not being honored" }, likelihood: "low", impact: "low", level: "low", note: { tr: "Ödeme takvimi netleşince risk düşük kalır.", en: "Risk stays low once the payment schedule is confirmed." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (Norm Tekstil)", en: "Client (Norm Tekstil)" }, strengths: [{ tr: "Düzenli takip ve belgeleme", en: "Consistent follow-up and documentation" }], weaknesses: [], toneLabel: { tr: "Profesyonel", en: "Professional" }, toneScore: 85 },
        { party: { tr: "Müşteri (R. Tekin)", en: "Customer (R. Tekin)" }, strengths: [{ tr: "Yazılı taahhütte bulunuyor", en: "Provides written commitments" }], weaknesses: [], toneLabel: { tr: "İşbirlikçi", en: "Cooperative" }, toneScore: 71 },
      ],
      legalBasis: [
        { id: "d6l1", statute: "TBK m. 128", title: { tr: "Borcun ikrarı", en: "Acknowledgment of debt" }, relevance: { tr: "Yazılı taahhüt takip talebini güçlendirir.", en: "The written commitment strengthens the collection request." } },
      ],
      recommendations: [
        { id: "d6a1", tier: "1-2w", action: { tr: "Ay sonunda ödeme yapılmazsa ihtarname gönderin.", en: "Send a formal notice if payment is not made by month-end." }, rationale: { tr: "Temerrüdü resmileştirir.", en: "Formalizes the default." }, priority: "low" },
      ],
      conclusion: {
        summary: { tr: "Düşük risk; taahhüde göre takip yeterli.", en: "Low risk; routine follow-up per the commitment is sufficient." },
        urgentActions: [],
      },
    },
  },
  {
    id: "d7",
    name: "Trafik Kazası Tazminatı — E. Kılıç",
    client: "E. Kılıç",
    category: "Commercial",
    overallRisk: "medium",
    status: "queued",
    received: "2026-07-05T09:50:00Z",
    messagesIndexed: 601,
    documentsIndexed: 4,
    findingsCount: 4,
    score: 58,
    summary: {
      tr: "Sigorta görüşmesinde kusur oranına dair çelişkili beyanlar var; müzakere devam ediyor.",
      en: "Conflicting statements on fault ratio surfaced during insurance negotiations; talks are ongoing.",
    },
    chatSample: [
      { id: "d7m1", sender: "counterparty", senderName: "Sigorta — Poliçe Uzmanı", text: "Kaza tutanağında karşı taraf %70 kusurlu görünüyor.", at: "2026-05-10T13:00:00Z" },
      { id: "d7m2", sender: "counterparty", senderName: "Karşı taraf — C. Aydemir", text: "Aslında ben hiç kusurlu değildim, sinyal veriyordum zaten.", at: "2026-05-11T09:20:00Z", flagged: true, flagNote: { tr: "Kaza tutanağıyla çelişen kusur beyanı.", en: "Fault statement conflicting with the accident report." } },
    ],
    report: {
      executiveSummary: {
        overallRisk: "medium",
        headline: { tr: "Kusur oranına dair çelişki, tazminat müzakeresini geciktirebilir.", en: "A contradiction over the fault ratio may delay the compensation negotiation." },
        keyNumbers: [
          { label: { tr: "Tutanaktaki kusur oranı", en: "Fault ratio per report" }, value: "%70" },
          { label: { tr: "Çelişkili beyan", en: "Conflicting statements" }, value: "1" },
          { label: { tr: "Müzakere aşaması", en: "Negotiation stage" }, value: "2 / 4" },
        ],
      },
      timeline: [
        { id: "d7t1", date: "2026-05-10", label: { tr: "Kaza tutanağı düzenlendi", en: "Accident report filed" }, detail: { tr: "Tutanakta karşı tarafın %70 kusurlu olduğu belirtildi.", en: "Report states the counterparty was 70% at fault." }, source: "document" },
        { id: "d7t2", date: "2026-05-11", label: { tr: "Kusuru reddeden mesaj", en: "Message denying fault" }, detail: { tr: "Karşı taraf kusuru tamamen reddetti.", en: "Counterparty fully denies fault." }, source: "whatsapp", contradiction: { withEventId: "d7t1", note: { tr: "Resmi tutanakla doğrudan çelişiyor.", en: "Directly conflicts with the official report." } } },
      ],
      evidence: [
        { id: "d7e1", title: { tr: "Kusur reddi mesajı", en: "Fault-denial message" }, source: { tr: "WhatsApp · 11 Mayıs 2026", en: "WhatsApp · 11 May 2026" }, excerpt: "\"Aslında ben hiç kusurlu değildim, sinyal veriyordum zaten.\"", strength: "moderate", supports: { tr: "Tutanağın aksini iddia ediyor; ek tanıkla teyit gerekir.", en: "Contradicts the report; needs corroboration from another witness." } },
      ],
      riskMatrix: [
        { id: "d7r1", risk: { tr: "Kusur itirazının tazminatı düşürmesi", en: "Fault dispute reducing the compensation" }, likelihood: "medium", impact: "medium", level: "medium", note: { tr: "Tutanak ve kamera kaydı ile güçlendirilebilir.", en: "Can be reinforced with the report and any camera footage." } },
      ],
      parties: [
        { party: { tr: "Müvekkil (E. Kılıç)", en: "Client (E. Kılıç)" }, strengths: [{ tr: "Resmi tutanakla desteklenen konum", en: "Position backed by the official report" }], weaknesses: [], toneLabel: { tr: "Sakin", en: "Calm" }, toneScore: 75 },
        { party: { tr: "Karşı taraf (C. Aydemir)", en: "Counterparty (C. Aydemir)" }, strengths: [], weaknesses: [{ tr: "Tutanakla çelişen beyan", en: "Statement conflicting with the report" }], toneLabel: { tr: "Savunmacı", en: "Defensive" }, toneScore: 40 },
      ],
      legalBasis: [
        { id: "d7l1", statute: "TBK m. 51", title: { tr: "Tazminatın belirlenmesi", en: "Determination of compensation" }, relevance: { tr: "Kusur oranı tazminat miktarını doğrudan belirler.", en: "The fault ratio directly determines the compensation amount." }, precedent: "Yargıtay 17. HD, 2019/6602 E." },
      ],
      recommendations: [
        { id: "d7a1", tier: "1-2w", action: { tr: "Varsa kamera kaydını ve ek tanık beyanlarını toplayın.", en: "Collect any camera footage and additional witness statements." }, rationale: { tr: "Kusur oranı itirazına karşı tutanağı güçlendirir.", en: "Reinforces the report against the fault-ratio objection." }, priority: "medium" },
      ],
      conclusion: {
        summary: { tr: "Orta risk; ek delille tutanaktaki kusur oranı büyük olasılıkla korunur.", en: "Medium risk; the report's fault ratio will likely hold with additional evidence." },
        urgentActions: [],
      },
    },
  },
];

/* ── Risk distribution (segmented) ─────────────────────────────────────────── */
export const riskDistribution: { level: RiskLevel; label: L; value: number; color: string }[] = [
  { level: "critical", label: { tr: "Kritik", en: "Critical" }, value: 1, color: "var(--color-risk-critical)" },
  { level: "high", label: { tr: "Yüksek", en: "High" }, value: 2, color: "var(--color-risk-high)" },
  { level: "medium", label: { tr: "Orta", en: "Medium" }, value: 3, color: "var(--color-risk-medium)" },
  { level: "low", label: { tr: "Düşük", en: "Low" }, value: 1, color: "var(--color-risk-low)" },
];

/* ── Risk by case category (small bars) ────────────────────────────────────── */
export const riskByCategory: { category: CaseCategory; reviewed: number; flagged: number }[] = [
  { category: "Family", reviewed: 12, flagged: 9 },
  { category: "Employment", reviewed: 18, flagged: 7 },
  { category: "Commercial", reviewed: 34, flagged: 11 },
  { category: "Tenancy", reviewed: 14, flagged: 3 },
  { category: "Inheritance", reviewed: 8, flagged: 3 },
];

/* ── Analysis-time trend (weekly, in minutes) — the "8 hours → 15 min" story ─ */
export interface TrendPointLite {
  label: string;
  value: number;
}
export const analysisTimeTrend: TrendPointLite[] = [
  { label: "May 16", value: 460 },
  { label: "May 23", value: 210 },
  { label: "May 30", value: 95 },
  { label: "Jun 06", value: 38 },
  { label: "Jun 13", value: 14 },
];
export const analysisTimeMeta = {
  title: { tr: "Analiz süresi", en: "Analysis time" } as L,
  subtitle: { tr: "Dosya başına ort. analiz (dk)", en: "Avg analysis per case (min)" } as L,
  delta: "−97%",
};

/* ── Risk pattern library: example red-flag chat patterns ─────────────────── */
export interface PatternExample {
  id: string;
  topic: L;
  examplePhrase: L;
  whyItMatters: L;
}
export const riskPatterns: PatternExample[] = [
  {
    id: "pat1",
    topic: { tr: "Tarih çelişkisi", en: "Date contradiction" },
    examplePhrase: { tr: "\"Aslında ben Mart'ta ayrıldım\" / \"Hayır, Haziran'a kadar oradaydın\"", en: "\"I actually left in March\" / \"No, you were there until June\"" },
    whyItMatters: { tr: "Nafaka, kıdem ve zamanaşımı hesaplamalarını doğrudan etkiler.", en: "Directly affects alimony, seniority, and limitation-period calculations." },
  },
  {
    id: "pat2",
    topic: { tr: "Ödeme itirafı", en: "Payment admission" },
    examplePhrase: { tr: "\"Son faturayı ödemedim, biliyorsun\"", en: "\"I didn't pay the last invoice, you know that\"" },
    whyItMatters: { tr: "Borcun ikrarı niteliğinde güçlü bir delildir.", en: "Constitutes strong evidence as an acknowledgment of debt." },
  },
  {
    id: "pat3",
    topic: { tr: "Tehdit / taciz dili", en: "Threat / harassment language" },
    examplePhrase: { tr: "\"Bana böyle yaparsan pişman olursun\"", en: "\"You'll regret it if you do this to me\"" },
    whyItMatters: { tr: "Velayet ve ceza hukuku değerlendirmelerinde tarafın tutumuna dair kanıttır.", en: "Evidence of a party's conduct relevant to custody and criminal-law assessments." },
  },
  {
    id: "pat4",
    topic: { tr: "Velayet/nafaka çelişkisi", en: "Custody/alimony contradiction" },
    examplePhrase: { tr: "\"Çocuğu bu hafta göremeyeceksin\" / önceki mutabakat metniyle çelişki", en: "\"You won't see the child this week\" vs. the prior agreed schedule" },
    whyItMatters: { tr: "Görüşme programına uyulmadığını gösteren doğrudan kanıttır.", en: "Direct evidence that the agreed visitation schedule was not followed." },
  },
  {
    id: "pat5",
    topic: { tr: "Sözlü anlaşmaya atıf", en: "Reference to a verbal agreement" },
    examplePhrase: { tr: "\"Aramızda konuştuğumuz gibi %60-40 paylaşıyoruz\"", en: "\"As we discussed, we're splitting it 60-40\"" },
    whyItMatters: { tr: "Yazılı sözleşmeyle çelişiyorsa ispat yükünü değiştirebilir.", en: "Can shift the burden of proof when it conflicts with the written contract." },
  },
];

/* ── Analysis criteria: what hukuk-sorgula checks for ──────────────────────── */
export interface AnalysisCriterion {
  id: string;
  ref: string;
  title: L;
  checks: L;
  threshold: L;
  severity: RiskLevel;
}
export const analysisCriteria: AnalysisCriterion[] = [
  { id: "ac1", ref: "K-1", title: { tr: "Tarih/saat tutarlılığı", en: "Date/time consistency" }, checks: { tr: "Aynı olaya dair farklı tarih/saat beyanlarını karşılaştırır.", en: "Cross-checks differing date/time statements about the same event." }, threshold: { tr: "≥ 1 çelişki = işaretle", en: "≥ 1 contradiction = flag" }, severity: "high" },
  { id: "ac2", ref: "K-2", title: { tr: "Finansal itiraf ifadeleri", en: "Financial admission phrases" }, checks: { tr: "Ödeme, borç veya mal varlığına dair itiraf niteliğindeki ifadeleri tarar.", en: "Scans for admission-like language about payment, debt, or assets." }, threshold: { tr: "Doğrudan itiraf = yüksek önem", en: "Direct admission = high severity" }, severity: "high" },
  { id: "ac3", ref: "K-3", title: { tr: "Tehdit/taciz dili", en: "Threat/harassment language" }, checks: { tr: "Tehdit, baskı veya taciz içeren dil kalıplarını tespit eder.", en: "Detects language patterns indicating threats, pressure, or harassment." }, threshold: { tr: "Herhangi bir tespit = işaretle", en: "Any detection = flag" }, severity: "critical" },
  { id: "ac4", ref: "K-4", title: { tr: "Velayet/nafaka çelişkileri", en: "Custody/alimony contradictions" }, checks: { tr: "Görüşme programı ve nafaka taahhütlerindeki tutarsızlıkları karşılaştırır.", en: "Cross-checks inconsistencies in visitation schedules and alimony commitments." }, threshold: { tr: "≥ 1 çelişki = işaretle", en: "≥ 1 contradiction = flag" }, severity: "high" },
  { id: "ac5", ref: "K-5", title: { tr: "Yargıtay emsal eşleşmesi", en: "Precedent matching" }, checks: { tr: "Bulguları benzer Yargıtay kararlarıyla eşleştirir.", en: "Matches findings against similar Court of Cassation decisions." }, threshold: { tr: "Benzerlik ≥ %80", en: "Similarity ≥ 80%" }, severity: "medium" },
  { id: "ac6", ref: "K-6", title: { tr: "İletişim tonu değişimi", en: "Communication tone shift" }, checks: { tr: "Taraflar arası ton skorundaki ani düşüşleri izler.", en: "Tracks sudden drops in the tone score between parties." }, threshold: { tr: "≥ 30 puan düşüş = işaretle", en: "≥ 30-point drop = flag" }, severity: "medium" },
];

/* ── Activity feed (right rail) ────────────────────────────────────────────── */
export interface DActivity {
  id: string;
  who: string;
  action: L;
  target: string;
  at: string;
  tone: "neutral" | "success" | "warning" | "info";
}
export const activity: DActivity[] = [
  { id: "a1", who: "AI Asistanı", action: { tr: "çelişki tespit etti:", en: "flagged a contradiction in" }, target: "Kaya / Kaya · ayrılık tarihi", at: "2026-07-20T09:12:00Z", tone: "warning" },
  { id: "a2", who: "E. Solak", action: { tr: "raporu inceledi:", en: "reviewed the report on" }, target: "Vega Yapı ortaklık dosyası", at: "2026-07-17T11:05:00Z", tone: "success" },
  { id: "a3", who: "AI Asistanı", action: { tr: "analiz etti:", en: "analyzed" }, target: "Norm Tekstil · 340 mesaj", at: "2026-07-08T11:02:00Z", tone: "info" },
  { id: "a4", who: "AI Asistanı", action: { tr: "acil aksiyon önerdi:", en: "flagged an urgent action in" }, target: "Kaya / Kaya · tehdit mesajları", at: "2026-07-20T09:14:00Z", tone: "warning" },
  { id: "a5", who: "M. Yıldız", action: { tr: "analiz kriterine ekledi:", en: "added an analysis criterion" }, target: "K-6 · Ton değişimi", at: "2026-07-05T10:40:00Z", tone: "success" },
];

/* ── Interactive landing demo: indexing → query → 8-section report ─────────── */
export const pipelineDemo = {
  stages: [
    { key: "index", label: { tr: "İndeksleme", en: "Indexing" } as L, detail: { tr: "WhatsApp dökümü ve belgeler Türkçe parçalayıcıyla bölünüp embedding'e çevriliyor.", en: "The WhatsApp export and documents are chunked with a Turkish-aware splitter and embedded." } as L },
    { key: "query", label: { tr: "Sorgu", en: "Query" } as L, detail: { tr: "Qdrant'ta benzerlik araması yapılıyor, ilgili kanıtlar birleştiriliyor.", en: "A similarity search runs against Qdrant and the relevant evidence is merged." } as L },
    { key: "report", label: { tr: "Rapor üretimi", en: "Report generation" } as L, detail: { tr: "GPT-4o, 8 bölümlü hukuki risk raporunu oluşturuyor.", en: "GPT-4o assembles the 8-section legal risk report." } as L },
  ],
  liveStats: [
    { tr: "247 mesaj tarandı", en: "247 messages scanned" } as L,
    { tr: "3 çelişki bulundu", en: "3 contradictions found" } as L,
    { tr: "12 emsal eşleşti", en: "12 precedents matched" } as L,
  ],
  resultPreview: {
    overallRisk: "high" as RiskLevel,
    headline: { tr: "Ayrılık tarihi konusunda kritik bir çelişki tespit edildi.", en: "A critical contradiction was found over the separation date." } as L,
    topFinding: { tr: "İki taraf da farklı bir ayrılık tarihi beyan etti — nafaka hesaplamasını etkiliyor.", en: "Both parties state a different separation date — this affects the alimony calculation." } as L,
  },
};
