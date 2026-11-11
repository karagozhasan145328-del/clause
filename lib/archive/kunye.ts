/**
 * Regex-first extraction of the precedent "künye" (court, chamber, E./K. numbers, date, cited statutes, outcome).
 * Everything is best effort and nullable; extraction_source is "regex" when anything was found, else "none".
 * Written to tolerate flattened text (no newlines) as produced by PDF extraction.
 */

export interface Kunye {
  court: string | null;
  chamber: string | null;
  esasNo: string | null;
  kararNo: string | null;
  decisionDate: string | null; // ISO yyyy-mm-dd
  legalArea: string | null;
  subject: string | null;
  statutes: string[];
  outcome: string | null;
  source: "regex" | "none";
}

const HEAD = 6000; // the künye lives at the top of the decision
const L = "\\p{L}";

const LAW_NO: Record<string, string> = {
  "4857": "İK",
  "6098": "TBK",
  "6100": "HMK",
  "5237": "TCK",
  "5271": "CMK",
  "6102": "TTK",
  "4721": "TMK",
  "2004": "İİK",
  "2577": "İYUK",
  "7036": "İŞMK",
  "6502": "TKHK",
  "5510": "SGK",
  "6552": "İK",
  "2709": "AY",
  "6325": "HUAK",
  "3194": "İmar",
};
const ABBR = "TBK|HMK|TCK|CMK|TTK|TMK|İİK|İK|İYUK|İŞMK|TKHK|SGK|KTK|AY|CGK|VUK|KVKK|GVK|KDV|AAÜT|HUAK|MK|BK|YİBK|İBK";

function iso(d: string, m: string, y: string): string | null {
  const day = +d, mon = +m, yr = +y;
  if (yr < 1900 || yr > 2100 || mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseCourt(head: string): Pick<Kunye, "court" | "chamber"> {
  let court: string | null = null;
  if (/Anayasa\s+Mahkemesi/iu.test(head)) court = "Anayasa Mahkemesi";
  else if (/Dan[ıi]ştay/iu.test(head)) court = "Danıştay";
  else if (/Yarg[ıi]tay/iu.test(head)) court = "Yargıtay";
  else if (/B[ÖO]LGE\s+ADL[İI]YE|\bBAM\b/iu.test(head)) court = "BAM";
  else if (/Uyu[şs]mazl[ıi]k\s+Mahkemesi/iu.test(head)) court = "Uyuşmazlık Mahkemesi";

  let chamber: string | null = null;
  const num = head.match(/(\d{1,2})\s*\.?\s*(Hukuk|Ceza)\s+Da[iİI]res[iİI]/iu);
  const kurul = head.match(/(Hukuk|Ceza)\s+Genel\s+Kurulu|[İI]dari\s+Dava\s+Da[iİI]releri\s+Kurulu|Büyük\s+Genel\s+Kurul|Birinci\s+B[öo]l[üu]m|[İI]kinci\s+B[öo]l[üu]m/iu);
  const dan = court === "Danıştay" ? head.match(/(\d{1,2})\s*\.?\s*Da[iİI]re\b/iu) : null;
  if (num) chamber = `${num[1]}. ${num[2][0].toUpperCase()}${num[2].slice(1).toLowerCase()} Dairesi`;
  else if (dan) chamber = `${dan[1]}. Daire`;
  else if (kurul) chamber = kurul[0].replace(/\s+/g, " ").trim();
  return { court, chamber };
}

function parseNumbers(head: string): Pick<Kunye, "esasNo" | "kararNo"> {
  const no = String.raw`(\d{4})\s*\/\s*(\d{1,6})`;
  const esas =
    head.match(new RegExp(String.raw`(?:ESAS(?:\s*NO)?|Esas(?:\s*No)?|\bE\.)\s*[:.]?\s*${no}`, "u")) ??
    head.match(new RegExp(`${no}\\s*(?:Esas|E\\.)(?![${L}])`, "u"));
  const karar =
    head.match(new RegExp(String.raw`(?:KARAR(?:\s*NO)?|Karar(?:\s*No)?|\bK\.)\s*[:.]?\s*${no}`, "u")) ??
    head.match(new RegExp(`${no}\\s*(?:Karar|K\\.)(?![${L}])`, "u"));
  return {
    esasNo: esas ? `${esas[1]}/${esas[2]}` : null,
    kararNo: karar ? `${karar[1]}/${karar[2]}` : null,
  };
}

function parseDate(head: string): string | null {
  const labelled = head.match(/KARAR\s*TAR[İI]H[İI]\s*[:\-]?\s*(\d{1,2})[./](\d{1,2})[./](\d{4})/iu);
  if (labelled) return iso(labelled[1], labelled[2], labelled[3]);
  // "… K. 2024/567 … 12.03.2024": first full date after the karar number
  const afterK = head.match(/\d{4}\s*\/\s*\d+\s*(?:Karar|K\.)[^]{0,120}?(\d{1,2})[./](\d{1,2})[./](\d{4})/iu);
  return afterK ? iso(afterK[1], afterK[2], afterK[3]) : null;
}

export function parseStatutes(text: string): string[] {
  const found = new Set<string>();
  const add = (abbr: string, art: string) => {
    if (found.size < 40) found.add(`${abbr} ${+art}`);
  };

  // "TBK 49", "TBK'nın 49. maddesi", "TBK m. 49"
  const a = new RegExp(`(?<![${L}])(${ABBR})\\s*(?:['’]\\s*\\w{1,4})?\\s*(?:m\\.|md\\.|madde(?:si)?)?\\s*(\\d{1,4})(?![\\d/])`, "gu");
  for (const m of text.matchAll(a)) add(m[1], m[2]);

  // "4857 sayılı İş Kanunu'nun 18. maddesi"
  const b = /(\d{3,4})\s+say[ıi]l[ıi]\s+[^.;]{0,80}?(?:Kanun|Kanunu|Yasa)\w*\s*['’]?\s*\w{0,4}\s+(\d{1,4})\s*\.?\s*(?:inci\s+)?madde/giu;
  for (const m of text.matchAll(b)) add(LAW_NO[m[1]] ?? `${m[1]} s.K.`, m[2]);

  return [...found];
}

const OUTCOMES: [RegExp, string][] = [
  [/D[ÜU]ZELT[İI]LEREK\s+ONANMASINA|düzeltilerek\s+onanmasına/iu, "Düzeltilerek onama"],
  [/ONANMASINA|onanmasına/iu, "Onama"],
  [/BOZULMASINA|bozulmasına|BOZULMASI/iu, "Bozma"],
  [/KALDIRILMASINA|kaldırılmasına/iu, "Kaldırma"],
  [/[İI]PTAL[İI]NE|iptaline/iu, "İptal"],
  [/YÜRÜTMEN[İI]N\s+DURDURULMASINA/iu, "Yürütmeyi durdurma"],
  [/ESASTAN\s+RED|esastan\s+reddine/iu, "Esastan ret"],
  [/KABUL[ÜU]NE|kabulüne/iu, "Kabul"],
  [/REDD[İI]NE|reddine/iu, "Ret"],
  [/[İI]hlal\s+ed[İi]ld[İi][ğg][İi]ne|ihlal\s+edildiğine/iu, "İhlal"],
];

function parseOutcome(text: string): string | null {
  const tail = text.slice(-2500);
  for (const [re, label] of OUTCOMES) if (re.test(tail)) return label;
  return null;
}

function parseSubject(head: string): string | null {
  const m = head.match(/(?:DAVA\s*KONUSU|KONUSU|KONU|DAVA)\s*:\s*(.{3,200}?)(?=\s+(?:DAVACI|DAVALI|TEMY[İI]Z|KARAR|ÖZET|[İI]STEM|TARAFLAR)\b|$)/u);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

const AREA_KEYWORDS: [string, RegExp][] = [
  ["İş", /işçi|işveren|iş\s+sözleşmes|kıdem\s+tazminat|fazla\s+çalışma|iş\s+mahkemesi|4857/giu],
  ["Aile", /boşanma|nafaka|velayet|mal\s+rejimi|evlilik/giu],
  ["Gayrimenkul", /taşınmaz|tapu|kira\s+bedel|kiralanan|tahliye|ortaklığın\s+giderilmesi|kat\s+mülkiyeti/giu],
  ["Ticaret", /ticari|şirket|anonim|bono|çek\b|poliçe|iflas|konkordato/giu],
  ["İcra", /icra|haciz|itirazın\s+iptali|menfi\s+tespit/giu],
  ["Tazminat", /maddi\s+tazminat|manevi\s+tazminat|trafik\s+kazası|destekten\s+yoksun/giu],
];

function inferArea(text: string, chamber: string | null, court: string | null): string | null {
  if (chamber && /Ceza/i.test(chamber)) return "Ceza";
  if (court === "Danıştay") return "İdare";
  const sample = text.slice(0, 20000);
  let best: [string, number] | null = null;
  for (const [area, re] of AREA_KEYWORDS) {
    const n = (sample.match(re) ?? []).length;
    if (n >= 3 && (!best || n > best[1])) best = [area, n];
  }
  if (best) return best[0];
  if (chamber && /Hukuk/i.test(chamber)) return "Hukuk";
  return null;
}

export function parseKunye(text: string): Kunye {
  const head = text.slice(0, HEAD);
  const { court, chamber } = parseCourt(head);
  const { esasNo, kararNo } = parseNumbers(head);
  const k: Kunye = {
    court,
    chamber,
    esasNo,
    kararNo,
    decisionDate: parseDate(head),
    legalArea: inferArea(text, chamber, court),
    subject: parseSubject(head),
    statutes: parseStatutes(text),
    outcome: parseOutcome(text),
    source: "none",
  };
  if (court || chamber || esasNo || kararNo || k.decisionDate || k.statutes.length) k.source = "regex";
  return k;
}

const CHAMBER_SHORT = (c: string) => c.replace(/(\d+)\.\s*Hukuk Dairesi/, "$1. HD").replace(/(\d+)\.\s*Ceza Dairesi/, "$1. CD");

/** "Yargıtay 9. HD, E. 2023/1234 K. 2024/567" — the form used to cite a decision. */
export function kunyeLabel(k: {
  court?: string | null;
  chamber?: string | null;
  esas_no?: string | null;
  karar_no?: string | null;
  esasNo?: string | null;
  kararNo?: string | null;
}): string {
  const esas = k.esas_no ?? k.esasNo;
  const karar = k.karar_no ?? k.kararNo;
  const where = [k.court, k.chamber ? CHAMBER_SHORT(k.chamber) : null].filter(Boolean).join(" ");
  const nums = [esas ? `E. ${esas}` : null, karar ? `K. ${karar}` : null].filter(Boolean).join(" ");
  return [where, nums].filter(Boolean).join(", ");
}
