import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanySelect } from "@/components/CompanySelect";
import { addTxn, pendingFor, rupees, todayISO, useData } from "@/lib/store";

export function PaymentForm({
  lockedCustomerId,
  onSaved,
}: {
  lockedCustomerId?: string;
  onSaved?: () => void;
}) {
  const data = useData();
  const [date, setDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState<string | null>(lockedCustomerId ?? null);
  const [amountText, setAmountText] = useState("");

  const customer = data.customers.find((c) => c.id === customerId) ?? null;
  const previous = customer ? pendingFor(data, customer) : 0;
  const amount = Math.max(0, Math.floor(Number(amountText || 0)));

  function save() {
    if (!customerId) {
      toast.error("Select a company first");
      return;
    }
    if (amount <= 0) {
      toast.error("Enter a payment amount");
      return;
    }
    addTxn({ customerId, date, type: "payment", amount });
    toast.success(`Payment ${rupees(amount)} recorded`);
    setAmountText("");
    if (!lockedCustomerId) setCustomerId(null);
    onSaved?.();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-date">Date</Label>
          <Input
            id="p-date"
            type="date"
            className="h-11"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {!lockedCustomerId && (
          <div className="space-y-2">
            <Label>Company</Label>
            <CompanySelect customers={data.customers} value={customerId} onChange={setCustomerId} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-amt">Payment amount</Label>
        <Input
          id="p-amt"
          inputMode="numeric"
          className="h-11"
          placeholder="0"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>

      {customer && (
        <div className="space-y-1 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Previous pending</span>
            <span>{rupees(previous)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment</span>
            <span>−{rupees(amount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>New pending</span>
            <span>{rupees(previous - amount)}</span>
          </div>
        </div>
      )}

      <Button className="h-12 w-full text-base" onClick={save}>
        Save payment
      </Button>
    </div>
  );
}
