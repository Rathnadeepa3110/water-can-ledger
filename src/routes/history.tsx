import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rupees, shortDate, sortTxns, todayISO, useData } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Water Can Accounts" },
      { name: "description", content: "Day, week, month or custom range transaction history." },
      { property: "og:title", content: "History — Water Can Accounts" },
      { property: "og:description", content: "Day, week, month or custom range transaction history." },
    ],
  }),
  component: HistoryPage,
});

type Filter = "day" | "week" | "month" | "custom";

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function HistoryPage() {
  const data = useData();
  const [filter, setFilter] = useState<Filter>("day");
  const [anchor, setAnchor] = useState(todayISO());
  const [from, setFrom] = useState(addDays(todayISO(), -7));
  const [to, setTo] = useState(todayISO());

  const range = useMemo(() => {
    if (filter === "day") return { start: anchor, end: anchor };
    if (filter === "week") {
      const d = new Date(`${anchor}T00:00:00`);
      const start = addDays(anchor, -((d.getDay() + 6) % 7));
      return { start, end: addDays(start, 6) };
    }
    if (filter === "month") {
      const start = `${anchor.slice(0, 7)}-01`;
      const d = new Date(`${start}T00:00:00`);
      d.setMonth(d.getMonth() + 1);
      const end = addDays(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
        -1,
      );
      return { start, end };
    }
    return { start: from, end: to };
  }, [filter, anchor, from, to]);

  const rows = useMemo(
    () =>
      sortTxns(data.txns.filter((t) => t.date >= range.start && t.date <= range.end))
        .reverse()
        .map((t) => ({
          t,
          name: data.customers.find((c) => c.id === t.customerId)?.name ?? "—",
        })),
    [data, range],
  );

  const totals = rows.reduce(
    (acc, { t }) => ({
      cans: acc.cans + (t.cans ?? 0),
      delivery: acc.delivery + (t.type === "delivery" ? t.amount : 0),
      payment: acc.payment + (t.type === "payment" ? t.amount : 0),
    }),
    { cans: 0, delivery: 0, payment: 0 },
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <div className="inline-flex rounded-md border border-border p-1">
          {(["day", "week", "month", "custom"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-3 py-1.5 text-sm capitalize transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {filter === "custom" ? (
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label htmlFor="h-from" className="text-xs">
                From
              </Label>
              <Input
                id="h-from"
                type="date"
                className="h-10"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="h-to" className="text-xs">
                To
              </Label>
              <Input
                id="h-to"
                type="date"
                className="h-10"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="h-anchor" className="text-xs">
              {filter === "month" ? "Month" : "Date"}
            </Label>
            <Input
              id="h-anchor"
              type="date"
              className="h-10"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
            />
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Showing {shortDate(range.start)} to {shortDate(range.end)}
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 text-right font-medium">Cans</th>
              <th className="px-4 py-3 text-right font-medium">Rate</th>
              <th className="px-4 py-3 text-right font-medium">Delivery</th>
              <th className="px-4 py-3 text-right font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, name }) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{shortDate(t.date)}</td>
                <td className="px-4 py-3">{name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.cans ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.rate ? `₹${t.rate}` : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {t.type === "delivery" ? rupees(t.amount) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {t.type === "payment" ? rupees(t.amount) : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Total cans", String(totals.cans)],
          ["Total delivery amount", rupees(totals.delivery)],
          ["Total payments", rupees(totals.payment)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
