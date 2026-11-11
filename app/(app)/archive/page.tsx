"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { ArchiveUploader } from "@/components/archive/archive-uploader";
import { PrecedentSearch } from "@/components/archive/precedent-search";
import { AnswerWithCitations } from "@/components/archive/answer-with-citations";
import type { AskResult } from "@/lib/archive/shared";
import { cn } from "@/lib/utils";

type Tab = "ask" | "search" | "upload";

export default function ArchivePage() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const [tab, setTab] = useState<Tab>("ask");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [noSources, setNoSources] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 5 || busy) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    setNoSources(false);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.message ?? (tr ? "Yanıt alınamadı." : "Could not get an answer."));
      else if (data.noSources) setNoSources(true);
      else setAnswer(data);
    } catch {
      setError(tr ? "Sunucuya ulaşılamadı." : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "ask", label: tr ? "Soru sor" : "Ask" },
    { id: "search", label: tr ? "Emsal ara" : "Search" },
    { id: "upload", label: tr ? "Arşiv" : "Archive" },
  ];

  return (
    <div className="mx-auto max-w-[900px] animate-fade-in">
      <p className="label-mono text-primary">{tr ? "Emsal arşivi" : "Precedent archive"}</p>
      <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight">
        {tr ? "Kendi emsal kararlarında ara ve sor" : "Search and ask your own precedents"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {tr
          ? "Yanıtlar yalnızca yüklediğin kararlara dayanır ve her alıntı kaynak metinde doğrulanır."
          : "Answers rely only on the decisions you uploaded, and every quote is verified against the source text."}
      </p>

      <div className="mt-5 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2 text-[13.5px] font-medium transition-colors",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "ask" && (
          <div className="space-y-4">
            <form onSubmit={ask} className="space-y-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder={
                  tr
                    ? "Örn. Yargıtay 9. HD fazla mesai ispatında tanık beyanını yeterli görüyor mu?"
                    : "e.g. Does the 9th Civil Chamber accept witness statements as proof of overtime?"
                }
                className="w-full resize-y rounded-lg border border-border bg-card p-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={busy || question.trim().length < 5}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {tr ? "Yanıtla" : "Answer"}
              </button>
            </form>
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                {error}
              </p>
            )}
            {noSources && (
              <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                {tr ? "Arşivinde bu soruyla eşleşen karar bulunamadı. Önce emsal yükle ya da soruyu farklı ifade et." : "No decision in your archive matches this question. Upload precedents or rephrase."}
              </p>
            )}
            {answer && <AnswerWithCitations result={answer} />}
          </div>
        )}
        {tab === "search" && <PrecedentSearch />}
        {tab === "upload" && <ArchiveUploader />}
      </div>
    </div>
  );
}
