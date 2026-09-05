import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeliveryForm } from "@/components/DeliveryForm";
import { PaymentForm } from "@/components/PaymentForm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Entry — Water Can Accounts" },
      { name: "description", content: "Record can deliveries and payments in seconds." },
      { property: "og:title", content: "Daily Entry — Water Can Accounts" },
      { property: "og:description", content: "Record can deliveries and payments in seconds." },
    ],
  }),
  component: DailyEntry,
});

function DailyEntry() {
  const [tab, setTab] = useState<"delivery" | "payment">("delivery");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Daily Entry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search the company, enter cans, confirm rate, save.
      </p>

      <div className="mt-6 inline-flex rounded-md border border-border p-1">
        {(["delivery", "payment"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded px-4 py-2 text-sm transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {t === "delivery" ? "Add Delivery" : "Record Payment"}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        {tab === "delivery" ? <DeliveryForm /> : <PaymentForm />}
      </div>
    </div>
  );
}
