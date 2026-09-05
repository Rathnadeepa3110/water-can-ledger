import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { daysSince, lastPaymentDate, pendingFor, rupees, shortDate, useData } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [
      { title: "Pending — Water Can Accounts" },
      { name: "description", content: "Companies that currently owe money, with days since last payment." },
      { property: "og:title", content: "Pending — Water Can Accounts" },
      {
        property: "og:description",
        content: "Companies that currently owe money, with days since last payment.",
      },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const data = useData();
  const [sort, setSort] = useState<"highest" | "oldest">("highest");

  const rows = useMemo(() => {
    const list = data.customers
      .map((c) => {
        const last = lastPaymentDate(data, c.id);
        return {
          c,
          pending: pendingFor(data, c),
          last,
          days: last ? daysSince(last) : null,
        };
      })
      .filter((r) => r.pending > 0);
    list.sort((a, b) =>
      sort === "highest" ? b.pending - a.pending : (b.days ?? 99999) - (a.days ?? 99999),
    );
    return list;
  }, [data, sort]);

  const total = rows.reduce((s, r) => s + r.pending, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Pending</h1>
        <div className="inline-flex rounded-md border border-border p-1">
          {(
            [
              ["highest", "Highest pending"],
              ["oldest", "Oldest pending"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                sort === key ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {rows.length} companies owe a total of{" "}
        <span className="font-medium text-foreground">{rupees(total)}</span>
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 text-right font-medium">Pending</th>
              <th className="px-4 py-3 font-medium">Last payment</th>
              <th className="px-4 py-3 text-right font-medium">Days</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, pending, last, days }) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{rupees(pending)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {last ? shortDate(last) : "No payment yet"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{days ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/customers/$id"
                    params={{ id: c.id }}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nothing pending
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
