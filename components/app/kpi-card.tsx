import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface Kpi {
  label: string;
  value: string;
  delta?: number;
  icon?: string;
  hint?: string;
  /** 1–4 — selects one of the soft gradient tiles. */
  tone?: 1 | 2 | 3 | 4;
}

const tiles: Record<number, string> = {
  1: "var(--grad-tile-1)",
  2: "var(--grad-tile-2)",
  3: "var(--grad-tile-3)",
  4: "var(--grad-tile-4)",
};

export function KpiCard({ label, value, delta, icon, hint, tone = 1 }: Kpi) {
  const up = (delta ?? 0) >= 0;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 ring-1 ring-border shadow-soft transition-shadow hover:shadow-pop"
      style={{ background: tiles[tone] }}
    >
      <div className="flex items-start justify-between">
        {icon ? (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-foreground/80 ring-1 ring-border">
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        ) : (
          <span />
        )}
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full bg-card/70 px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-border/60",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-3.5 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-2 text-[13px] font-medium text-foreground/90">{label}</p>
      {hint && <p className="mt-0.5 line-clamp-1 text-[11.5px] text-foreground/55">{hint}</p>}
    </div>
  );
}
