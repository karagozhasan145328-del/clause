/**
 * Splits a decision into overlapping chunks, labelled with the section they fall in (gerekçe, hüküm, …).
 * Works on flattened text too: PDF extraction collapses newlines, so headings are recognised by shape
 * (an UPPERCASE label followed by ":" or standing on its own line), not by line breaks alone.
 */

export interface Chunk {
  ord: number;
  heading: string | null;
  content: string;
  tokenCount: number;
}

const TARGET = 1800; // ≈ 450–500 tokens of Turkish
const MAX = 2400;
const OVERLAP = 200;

// Longest first so "İNCELEME VE GEREKÇE" wins over "GEREKÇE".
const HEADINGS = [
  "İNCELEME VE GEREKÇE",
  "DAVA KONUSU",
  "TEMYİZ EDEN",
  "KARŞI OY",
  "GEREKÇE",
  "HÜKÜM",
  "SONUÇ",
  "İDDİA",
  "SAVUNMA",
  "CEVAP",
  "DELİLLER",
  "İSTEM",
  "TEMYİZ",
  "İSTİNAF",
  "DAVA",
  "KARAR",
  "ÖZET",
];
const HEADING_RE = new RegExp(`(?:^|\\n)\\s*(${HEADINGS.join("|")})\\s*(?::|\\n)|(?<=[.!?]\\s)(${HEADINGS.join("|")})\\s*:`, "gu");

const approxTokens = (s: string) => Math.ceil(s.length / 3.5);

/** Cuts at a sentence boundary near `limit` if there is one in the back half, else at a space. */
function cutPoint(s: string, limit: number): number {
  if (s.length <= limit) return s.length;
  const window = s.slice(0, limit);
  const sentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf(".\n"), window.lastIndexOf("; "));
  if (sentence > limit * 0.5) return sentence + 1;
  const space = window.lastIndexOf(" ");
  return space > limit * 0.5 ? space : limit;
}

function splitSection(body: string): string[] {
  const text = body.trim();
  if (!text) return [];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > MAX) {
    const cut = cutPoint(rest, TARGET);
    parts.push(rest.slice(0, cut).trim());
    // Overlap: step back a little so a sentence split across chunks stays searchable from both.
    const back = Math.max(0, cut - OVERLAP);
    const backSpace = rest.indexOf(" ", back);
    rest = rest.slice(backSpace > 0 && backSpace < cut ? backSpace + 1 : cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export function chunkText(text: string): Chunk[] {
  const sections: { heading: string | null; body: string }[] = [];
  let last = 0;
  let heading: string | null = null;
  for (const m of text.matchAll(HEADING_RE)) {
    const start = m.index ?? 0;
    sections.push({ heading, body: text.slice(last, start) });
    heading = m[1] ?? m[2];
    last = start + m[0].length;
  }
  sections.push({ heading, body: text.slice(last) });

  const chunks: Chunk[] = [];
  for (const sec of sections) {
    for (const part of splitSection(sec.body)) {
      // A tiny trailing section (a lone "KARAR:" with a few words) is kept: the operative part is what lawyers cite.
      chunks.push({ ord: chunks.length, heading: sec.heading, content: part, tokenCount: approxTokens(part) });
    }
  }
  return chunks;
}
