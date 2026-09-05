import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliveryForm } from "@/components/DeliveryForm";
import { PaymentForm } from "@/components/PaymentForm";
import {
  RATES,
  cansWith,
  customerTxns,
  deleteTxn,
  pendingFor,
  rupees,
  shortDate,
  updateTxn,
  useData,
  type Txn,
} from "@/lib/store";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer ledger — Water Can Accounts" },
      { name: "description", content: "Full delivery and payment history for one company." },
      { property: "og:title", content: "Customer ledger — Water Can Accounts" },
      { property: "og:description", content: "Full delivery and payment history for one company." },
    ],
  }),
  component: CustomerLedger,
});

function EditTxnDialog({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  const [date, setDate] = useState(txn.date);
  const [cans, setCans] = useState(String(txn.cans ?? 0));
  const [returned, setReturned] = useState(String(txn.cansReturned ?? 0));
  const [rate, setRate] = useState(String(txn.rate ?? 30));
  const [amount, setAmount] = useState(String(txn.amount));

  function save() {
    if (txn.type === "delivery") {
      const n = Math.max(1, Math.floor(Number(cans || 0)));
      const r = Number(rate);
      updateTxn(txn.id, {
        date,
        cans: n,
        rate: r,
        amount: n * r,
        cansReturned: Math.max(0, Math.floor(Number(returned || 0))),
      });
    } else {
      const a = Math.max(1, Math.floor(Number(amount || 0)));
      updateTxn(txn.id, { date, amount: a });
    }
    toast.success("Transaction updated");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {txn.type === "delivery" ? "delivery" : "payment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="e-date">Date</Label>
            <Input
              id="e-date"
              type="date"
              className="h-11"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {txn.type === "delivery" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="e-cans">Number of cans</Label>
                  <Input
                    id="e-cans"
                    inputMode="numeric"
                    className="h-11"
                    value={cans}
                    onChange={(e) => setCans(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate per can</Label>
                  <Select value={rate} onValueChange={setRate}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATES.map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          ₹{r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-ret">Empty cans returned</Label>
                <Input
                  id="e-ret"
                  inputMode="numeric"
                  className="h-11"
                  value={returned}
                  onChange={(e) => setReturned(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Delivery amount: {rupees(Number(cans || 0) * Number(rate))}
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="e-amt">Payment amount</Label>
              <Input
                id="e-amt"
                inputMode="numeric"
                className="h-11"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button className="h-11 flex-1" onClick={save}>
              Save changes
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                deleteTxn(txn.id);
                toast.success("Transaction deleted");
                onClose();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomerLedger() {
  const { id } = Route.useParams();
  const data = useData();
  const [mode, setMode] = useState<"delivery" | "payment" | null>(null);
  const [editing, setEditing] = useState<Txn | null>(null);

  const customer = data.customers.find((c) => c.id === id);
  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-muted-foreground">
        Customer not found.{" "}
        <Link to="/customers" className="text-primary hover:underline">
          Back to customers
        </Link>
      </div>
    );
  }

  const txns = customerTxns(data, customer.id);
  let running = customer.openingPending;
  const rows = txns.map((t) => {
    running = t.type === "delivery" ? running + t.amount : running - t.amount;
    return { t, balance: running };
  });
  rows.reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/customers" className="text-sm text-muted-foreground hover:text-foreground">
        ← Customers
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{customer.name}</h1>

      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Current pending</p>
        <p className="text-3xl font-semibold tabular-nums">
          {rupees(pendingFor(data, customer))}
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:block">
            <dt className="text-muted-foreground">Contact person</dt>
            <dd>{customer.contact || "—"}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{customer.phone || "—"}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-muted-foreground">Default rate</dt>
            <dd>₹{customer.defaultRate} per can</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-muted-foreground">Opening pending</dt>
            <dd>{rupees(customer.openingPending)}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-muted-foreground">Cans with customer</dt>
            <dd>{cansWith(data, customer.id)}</dd>
          </div>
          {customer.notes && (
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Notes</dt>
              <dd>{customer.notes}</dd>
            </div>
          )}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="h-11" onClick={() => setMode("delivery")}>
            + Add Delivery
          </Button>
          <Button variant="outline" className="h-11" onClick={() => setMode("payment")}>
            + Add Payment
          </Button>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Transaction history</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Cans</th>
              <th className="px-4 py-3 text-right font-medium">Rate</th>
              <th className="px-4 py-3 text-right font-medium">Delivery</th>
              <th className="px-4 py-3 text-right font-medium">Payment</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, balance }) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{shortDate(t.date)}</td>
                <td className="px-4 py-3">{t.type === "delivery" ? "Delivery" : "Payment"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.cans ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.rate ? `₹${t.rate}` : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {t.type === "delivery" ? `+${rupees(t.amount)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {t.type === "payment" ? `−${rupees(t.amount)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{rupees(balance)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(t)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "delivery" ? "Add delivery" : "Add payment"} — {customer.name}
            </DialogTitle>
          </DialogHeader>
          {mode === "delivery" ? (
            <DeliveryForm lockedCustomerId={customer.id} onSaved={() => setMode(null)} />
          ) : mode === "payment" ? (
            <PaymentForm lockedCustomerId={customer.id} onSaved={() => setMode(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      {editing && <EditTxnDialog txn={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
