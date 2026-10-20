import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatNumber, cn } from "@/lib/utils";

export type CellFormat = "money" | "number" | "badge" | "text";

export interface Column {
  key: string;
  label: string;
  align?: "right";
  format?: CellFormat;
}

export interface DataRow {
  id: string;
  /** Optional secondary line shown under the first column. */
  _sub?: string;
  [key: string]: string | number | undefined;
}

type Tone = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

const TONE: Record<string, Tone> = {
  active: "success", paid: "success", confirmed: "success", completed: "success",
  delivered: "success", approved: "success", live: "success", sent: "success",
  published: "success", won: "success", healthy: "success", "in stock": "success",
  trialing: "info", scheduled: "info", new: "info", booked: "info", processing: "info",
  pending: "warning", waiting: "warning", "low stock": "warning", "at risk": "warning",
  draft: "neutral", paused: "neutral", archived: "neutral",
  past_due: "destructive", "past due": "destructive", cancelled: "destructive",
  canceled: "destructive", failed: "destructive", overdue: "destructive",
  "no-show": "destructive", "no show": "destructive", rejected: "destructive",
  churned: "destructive", "out of stock": "destructive",
};

function toneFor(v: string | number | undefined): Tone {
  return TONE[String(v ?? "").toLowerCase()] ?? "neutral";
}

function renderCell(row: DataRow, col: Column) {
  const v = row[col.key];
  switch (col.format) {
    case "money":
      return <span className="tabular-nums font-medium">{formatMoney(Number(v) || 0)}</span>;
    case "number":
      return <span className="tabular-nums">{formatNumber(Number(v) || 0)}</span>;
    case "badge":
      return (
        <Badge tone={toneFor(v)} className="capitalize">
          {String(v).replace(/[-_]/g, " ")}
        </Badge>
      );
    default:
      return <span>{v}</span>;
  }
}

export function DataTable({
  title,
  columns,
  rows,
  action,
}: {
  title?: string;
  columns: Column[];
  rows: DataRow[];
  action?: ReactNode;
}) {
  return (
    <Card>
      {(title || action) && (
        <CardHeader className="flex-row items-center justify-between">
          {title && <CardTitle>{title}</CardTitle>}
          {action}
        </CardHeader>
      )}
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn("px-5 py-3 font-medium", c.align === "right" && "text-right")}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors"
                >
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      className={cn("px-5 py-3", c.align === "right" && "text-right")}
                    >
                      {i === 0 ? (
                        <div>
                          <div className="font-medium">{renderCell(row, c)}</div>
                          {row._sub && (
                            <div className="text-xs text-muted-foreground">{row._sub}</div>
                          )}
                        </div>
                      ) : (
                        renderCell(row, c)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
