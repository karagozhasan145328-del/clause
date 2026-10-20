"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   RiskMatrixGrid — a hand-rolled inline-SVG 3×3 likelihood × impact grid.
   Plots each RiskMatrixItem as a colored dot (color = RISK_META[item.level].color)
   at its (likelihood, impact) cell, with a legend beneath listing every item's
   risk label + its note. Public API is stable — also imported by the marketing
   page workstream. No chart library.
   ───────────────────────────────────────────────────────────────────────────── */

import { useLang } from "@/components/i18n/language-provider";
import { RISK_META } from "@/lib/risk";
import type { RiskMatrixItem } from "@/lib/demo/data";

const AXIS_ORDER = ["low", "medium", "high"] as const;

const AXIS_LABEL: Record<(typeof AXIS_ORDER)[number], { tr: string; en: string }> = {
  low: { tr: "düşük", en: "low" },
  medium: { tr: "orta", en: "medium" },
  high: { tr: "yüksek", en: "high" },
};

export function RiskMatrixGrid({ items }: { items: RiskMatrixItem[] }) {
  const { t, lang } = useLang();

  const size = 280;
  const padL = 46;
  const padB = 30;
  const padT = 10;
  const padR = 10;
  const gridW = size - padL - padR;
  const gridH = size - padT - padB;
  const cell = gridW / 3;

  // Group items by cell so multiple dots in the same cell offset instead of overlapping.
  const byCell = new Map<string, RiskMatrixItem[]>();
  for (const item of items) {
    const key = `${item.likelihood}-${item.impact}`;
    const arr = byCell.get(key) ?? [];
    arr.push(item);
    byCell.set(key, arr);
  }

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "auto", maxWidth: 320 }}>
        {/* grid cells */}
        {AXIS_ORDER.map((impact, row) =>
          AXIS_ORDER.map((likelihood, col) => {
            const x = padL + col * cell;
            const y = padT + row * cell;
            return (
              <rect
                key={`${likelihood}-${impact}`}
                x={x}
                y={y}
                width={cell}
                height={cell}
                fill={row === 2 - col ? "var(--color-muted)" : "transparent"}
                stroke="var(--color-border)"
                strokeWidth="1"
              />
            );
          }),
        )}

        {/* y-axis (impact, high at top) labels */}
        {AXIS_ORDER.slice()
          .reverse()
          .map((impact, row) => (
            <text
              key={impact}
              x={padL - 8}
              y={padT + row * cell + cell / 2 + 3}
              textAnchor="end"
              fontSize="9.5"
              fill="var(--color-muted-foreground)"
              fontFamily="var(--font-mono)"
            >
              {lang === "tr" ? AXIS_LABEL[impact].tr : AXIS_LABEL[impact].en}
            </text>
          ))}

        {/* x-axis (likelihood) labels */}
        {AXIS_ORDER.map((likelihood, col) => (
          <text
            key={likelihood}
            x={padL + col * cell + cell / 2}
            y={size - padB + 16}
            textAnchor="middle"
            fontSize="9.5"
            fill="var(--color-muted-foreground)"
            fontFamily="var(--font-mono)"
          >
            {lang === "tr" ? AXIS_LABEL[likelihood].tr : AXIS_LABEL[likelihood].en}
          </text>
        ))}

        {/* axis titles */}
        <text x={padL + gridW / 2} y={size - 2} textAnchor="middle" fontSize="9" fill="var(--color-muted-foreground)" letterSpacing="1" fontFamily="var(--font-mono)">
          {lang === "tr" ? "OLASILIK →" : "LIKELIHOOD →"}
        </text>
        <text
          x={10}
          y={padT + gridH / 2}
          textAnchor="middle"
          fontSize="9"
          fill="var(--color-muted-foreground)"
          letterSpacing="1"
          fontFamily="var(--font-mono)"
          transform={`rotate(-90 10 ${padT + gridH / 2})`}
        >
          {lang === "tr" ? "ETKİ →" : "IMPACT →"}
        </text>

        {/* dots */}
        {[...byCell.entries()].map(([key, cellItems]) => {
          const [likelihood, impact] = key.split("-") as [(typeof AXIS_ORDER)[number], (typeof AXIS_ORDER)[number]];
          const col = AXIS_ORDER.indexOf(likelihood);
          const row = 2 - AXIS_ORDER.indexOf(impact);
          const cx0 = padL + col * cell + cell / 2;
          const cy0 = padT + row * cell + cell / 2;
          return cellItems.map((item, i) => {
            // Fan out multiple dots within the same cell.
            const n = cellItems.length;
            const angle = (i / Math.max(n, 1)) * Math.PI * 2;
            const jitter = n > 1 ? Math.min(cell * 0.22, 14) : 0;
            const cx = cx0 + Math.cos(angle) * jitter;
            const cy = cy0 + Math.sin(angle) * jitter;
            const rm = RISK_META[item.level];
            return (
              <circle key={item.id} cx={cx} cy={cy} r={7} fill={rm.color} stroke="var(--color-card)" strokeWidth="2">
                <title>
                  {t(item.risk)} — {t(item.note)}
                </title>
              </circle>
            );
          });
        })}
      </svg>

      {/* legend + notes */}
      <div className="mt-3 space-y-1.5">
        {items.map((item) => {
          const rm = RISK_META[item.level];
          return (
            <div key={item.id} className="flex items-start gap-2 text-[11.5px]">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: rm.color }} />
              <div className="min-w-0">
                <span className="font-medium">{t(item.risk)}</span>
                <span className="ml-1.5 text-muted-foreground">— {t(item.note)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
