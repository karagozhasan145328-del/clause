import { SEVERITY_RANK, normalizeSeverity, type Analysis, type ChecklistItem, type FindingSeverity } from "@/lib/analysis";

/** [ORAN], [TUTAR] TL, [SÜRE], [TARİH] … left in proposed text because the document did not state the figure. */
const PLACEHOLDER_RE = /\[(?:ORAN|TUTAR|SÜRE|TARİH|RATE|AMOUNT|PERIOD|DATE)\]/giu;

/**
 * Pre-submission checklist engine ("Mahkemeye / karşı tarafa sunulmadan önce düzeltilmesi gerekenler").
 * Merges the model's own checklist with items derived deterministically from the finished report, so the
 * list is useful even if the model skipped it: every critical finding / non-trivial discrepancy, unfilled
 * placeholders, unresolved contradictions, OCR / truncation caveats, and removed case-law citations.
 * Also fills the critical-risk summary when the model left it empty. Mutates `analysis`.
 */
export function finalizeChecklist(analysis: Analysis, lang: "tr" | "en", opts: { truncated?: boolean } = {}): void {
  const tr = lang === "tr";
  const items: ChecklistItem[] = [...(analysis.checklist ?? [])];
  const seen = new Set(items.map((i) => i.text.trim().toLowerCase()));
  const add = (text: string, severity: FindingSeverity) => {
    const k = text.trim().toLowerCase();
    if (!k || seen.has(k)) return;
    seen.add(k);
    items.push({ text, severity, origin: "auto" });
  };

  for (const f of analysis.findings) {
    if (normalizeSeverity(f.severity) !== "critical") continue;
    const where = f.document ? ` (${f.document})` : "";
    add(tr ? `Düzeltin: ${f.title}${where}` : `Fix: ${f.title}${where}`, "critical");
  }
  for (const d of analysis.comparison?.discrepancies ?? []) {
    const sev = normalizeSeverity(d.severity);
    if (sev === "low" || d.effect === "favorable") continue;
    add(tr ? `Belgeler arası çelişkiyi giderin: ${d.title}` : `Resolve the cross-document conflict: ${d.title}`, sev);
  }

  const placeholders = new Set<string>();
  const scan = (t?: string) => t?.match(PLACEHOLDER_RE)?.forEach((m) => placeholders.add(m));
  analysis.findings.forEach((f) => scan(f.suggestedFix));
  analysis.comparison?.discrepancies.forEach((d) => scan(d.suggestedFix));
  if (placeholders.size > 0) {
    const list = [...placeholders].join(", ");
    add(
      tr
        ? `Önerilen metinlerdeki boş alanları gerçek değerlerle doldurun (${list}); doldurulmamış hâliyle sunmayın.`
        : `Fill the blanks in the proposed wording with real values (${list}); do not submit them unfilled.`,
      "critical",
    );
  }
  if ((analysis.contradictions ?? []).length > 0) {
    add(tr ? "Belge içi çelişkileri gözden geçirip giderin." : "Review and resolve the internal contradictions.", "medium");
  }
  if (analysis.ocr) {
    add(
      tr
        ? "OCR ile okunan sayfalardaki isim, tarih ve tutarları orijinal belgeyle karşılaştırın."
        : "Compare names, dates and amounts on the OCR-read pages with the original document.",
      "medium",
    );
  }
  if (opts.truncated) {
    add(
      tr
        ? "Belge çok uzun olduğundan yalnızca ilk kısmı analiz edildi; kalan bölümü ayrıca kontrol edin."
        : "The document was too long and only the first part was analyzed; review the rest yourself.",
      "medium",
    );
  }
  if (analysis.removedCitations) {
    add(
      tr
        ? "Emsal kararları kendi kaynaklarınızdan doğrulayın; sistem karar atfı üretmez."
        : "Verify case law from your own sources; the system does not produce decision citations.",
      "low",
    );
  }
  add(
    tr
      ? "Kanun atıflarını ve önerilen madde metinlerini son kez kendiniz doğrulayın."
      : "Do a final check of statute references and proposed wording yourself.",
    "low",
  );

  analysis.checklist = items.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  if (!analysis.criticalSummary?.length) {
    const crit = [
      ...analysis.findings.filter((f) => normalizeSeverity(f.severity) === "critical").map((f) => f.title),
      ...(analysis.comparison?.discrepancies ?? []).filter((d) => normalizeSeverity(d.severity) === "critical").map((d) => d.title),
    ];
    analysis.criticalSummary = crit.slice(0, 6);
  }
}
