"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   ChronologicalTimeline — a vertical event timeline for a case's chat/document
   history. Highlights contradictions (an event whose facts conflict with an
   earlier one) with a destructive inset box cross-referencing the other event.
   ───────────────────────────────────────────────────────────────────────────── */

import { MessageCircle, FileText, StickyNote, TriangleAlert } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import type { TimelineEvent } from "@/lib/demo/data";

const SOURCE_ICON = {
  whatsapp: MessageCircle,
  document: FileText,
  note: StickyNote,
} as const;

const SOURCE_LABEL: Record<TimelineEvent["source"], { tr: string; en: string }> = {
  whatsapp: { tr: "WhatsApp", en: "WhatsApp" },
  document: { tr: "Belge", en: "Document" },
  note: { tr: "Not", en: "Note" },
};

export function ChronologicalTimeline({ events }: { events: TimelineEvent[] }) {
  const { t, lang } = useLang();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-0">
      {sorted.map((ev, i) => {
        const Ico = SOURCE_ICON[ev.source];
        const isLast = i === sorted.length - 1;
        const other = ev.contradiction ? events.find((e) => e.id === ev.contradiction!.withEventId) : undefined;
        return (
          <div key={ev.id} className="relative flex gap-3.5 pb-6 last:pb-0">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-pill">
                <Ico className="h-3.5 w-3.5" />
              </span>
              {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tnum text-[11.5px] font-semibold text-muted-foreground">{ev.date}</span>
                <span className="inline-flex rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {lang === "tr" ? SOURCE_LABEL[ev.source].tr : SOURCE_LABEL[ev.source].en}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] font-semibold leading-snug">{t(ev.label)}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{t(ev.detail)}</p>

              {ev.contradiction && (
                <div className="mt-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.05] p-2.5">
                  <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-destructive">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {lang === "tr" ? "Çelişki" : "Contradiction"}
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-foreground/80">{t(ev.contradiction.note)}</p>
                  {other && (
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      ↔ {t(other.label)} ({other.date})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
