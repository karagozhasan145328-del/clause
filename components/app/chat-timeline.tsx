"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   ChatTimeline — WhatsApp-style bubble list for a case's indexed chat sample.
   client/lawyer bubbles align left (muted); counterparty aligns right (primary
   tint); system messages render as a centered pill. Flagged messages get a
   destructive ring + a flag note caption underneath.
   ───────────────────────────────────────────────────────────────────────────── */

import { Flag } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/risk";
import type { ChatMessage } from "@/lib/demo/data";

export function ChatTimeline({ messages }: { messages: ChatMessage[] }) {
  const { t } = useLang();

  return (
    <div className="space-y-3">
      {messages.map((m) => {
        if (m.sender === "system") {
          return (
            <div key={m.id} className="flex justify-center">
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{m.text}</span>
            </div>
          );
        }

        const isRight = m.sender === "counterparty";
        return (
          <div key={m.id} className={cn("flex flex-col", isRight ? "items-end" : "items-start")}>
            <span className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">{m.senderName}</span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug shadow-sm",
                isRight ? "rounded-tr-sm bg-primary/10 text-foreground" : "rounded-tl-sm bg-muted text-foreground",
                m.flagged && "ring-1 ring-destructive/40",
              )}
            >
              {m.text}
              <div className={cn("mt-1 text-[10px] text-muted-foreground", isRight ? "text-right" : "text-left")}>
                {fmtDateTime(m.at)}
              </div>
            </div>
            {m.flagged && m.flagNote && (
              <p className={cn("mt-1 flex max-w-[80%] items-start gap-1 px-1 text-[11px] leading-snug text-destructive", isRight && "flex-row-reverse text-right")}>
                <Flag className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{t(m.flagNote)}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
