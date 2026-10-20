"use client";

import { useId } from "react";

/* ── Area chart (turnaround time) — bespoke inline SVG, no chart lib ───────── */
export function AreaChart({
  data,
  labels,
  color = "var(--color-primary)",
  height = 150,
}: {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  const w = 520;
  const h = height;
  const padX = 8;
  const padTop = 12;
  const padBottom = labels ? 22 : 8;
  const max = Math.max(...data);
  const min = Math.min(...data) * 0.85;
  const span = max - min || 1;
  const step = (w - padX * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = padX + i * step;
    const y = padTop + (1 - (v - min) / span) * (h - padTop - padBottom);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const baseY = h - padBottom;
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${baseY} L${pts[0][0].toFixed(1)} ${baseY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`afill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={padX} x2={w - padX} y1={padTop + g * (h - padTop - padBottom)} y2={padTop + g * (h - padTop - padBottom)} stroke="var(--color-border)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#afill-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.4 : 2.2} fill="var(--color-card)" stroke={color} strokeWidth="1.6" />
      ))}
      {labels &&
        labels.map((lab, i) => (
          <text key={lab} x={padX + i * step} y={h - 6} textAnchor="middle" fontSize="9.5" fill="var(--color-muted-foreground)" fontFamily="var(--font-mono)">
            {lab}
          </text>
        ))}
    </svg>
  );
}

/* ── Risk donut — a segmented ring (inline SVG) ────────────────────────────── */
export function RiskDonut({
  segments,
  size = 168,
  thickness = 18,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={thickness} />
      {segments.map((s) => {
        const frac = s.value / total;
        const dash = frac * circ;
        const el = (
          <circle
            key={s.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--color-foreground)" fontFamily="var(--font-mono)" letterSpacing="-1">
        {total}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9.5" fill="var(--color-muted-foreground)" fontFamily="var(--font-mono)" letterSpacing="1.5">
        TOTAL
      </text>
    </svg>
  );
}

/* ── Multi-color segmented bar ─────────────────────────────────────────────── */
export function SegmentedBar({
  segments,
  className,
}: {
  segments: { label: string; value: number; color: string }[];
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s, i) => (
          <span
            key={s.label}
            title={`${s.label} · ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, marginLeft: i === 0 ? 0 : 1.5 }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
    </div>
  );
}

/* ── A simple horizontal "score" meter (0–100) ─────────────────────────────── */
export function ScoreMeter({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}
