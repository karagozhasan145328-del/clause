/**
 * UYAP UDF reader. A .udf file is a ZIP archive whose `content.xml` holds the document text inside a
 * <content><![CDATA[ … ]]></content> element (formatting lives in separate <elements>/<styles> offsets,
 * which we don't need). Some exports are the bare XML without the ZIP wrapper; both are handled.
 * Only text is read — nothing in the archive is executed or written to disk.
 */

const MAX_XML_BYTES = 20 * 1024 * 1024; // zip-bomb guard for the decompressed content.xml

export class UdfError extends Error {}

const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Pulls the document text out of UDF content.xml. */
export function textFromUdfXml(xml: string): string {
  const m = xml.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
  if (!m) throw new UdfError("no_content");
  const cdata = m[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  const raw = cdata ? cdata[1] : decodeEntities(m[1].replace(/<[^>]+>/g, ""));
  return raw.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** True when the bytes look like a ZIP archive (PK\x03\x04). */
export const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

export async function extractUdfText(bytes: Uint8Array): Promise<string> {
  let xml: string;
  if (isZip(bytes)) {
    const { default: JSZip } = await import("jszip");
    let zip;
    try {
      zip = await JSZip.loadAsync(bytes);
    } catch {
      throw new UdfError("corrupt");
    }
    const entry = zip.file("content.xml") ?? zip.file(/(^|\/)content\.xml$/i)[0];
    if (!entry) throw new UdfError("no_content");
    const data = await entry.async("uint8array");
    if (data.byteLength > MAX_XML_BYTES) throw new UdfError("corrupt");
    xml = new TextDecoder("utf-8").decode(data);
  } else {
    xml = new TextDecoder("utf-8").decode(bytes);
    if (!/<content[\s>]/i.test(xml)) throw new UdfError("corrupt");
  }
  return textFromUdfXml(xml);
}
