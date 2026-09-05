import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanySelect } from "@/components/CompanySelect";
import { QtyStepper } from "@/components/QtyStepper";
import { RATES, addTxn, rupees, todayISO, useData } from "@/lib/store";

export function DeliveryForm({
  lockedCustomerId,
  onSaved,
}: {
  lockedCustomerId?: string;
  onSaved?: () => void;
}) {
  const { customers } = useData();
  const [date, setDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState<string | null>(lockedCustomerId ?? null);
  const [cans, setCans] = useState(10);
  const [returned, setReturned] = useState(0);
  const [showReturns, setShowReturns] = useState(false);
  const [rate, setRate] = useState(30);
  const [payNow, setPayNow] = useState("");

  const customer = customers.find((c) => c.id === customerId) ?? null;

  useEffect(() => {
    if (customer) setRate(customer.defaultRate);
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const amount = cans * rate;
  const payment = Math.max(0, Math.floor(Number(payNow || 0)));

  function save() {
    if (!customerId) {
      toast.error("Select a company first");
      return;
    }
    if (cans < 1) {
      toast.error("Enter number of cans");
      return;
    }
    addTxn({
      customerId,
      date,
      type: "delivery",
      cans,
      ...(returned > 0 ? { cansReturned: returned } : {}),
      rate,
      amount,
    });
    if (payment > 0) addTxn({ customerId, date, type: "payment", amount: payment });
    toast.success(`Saved ${cans} cans — ${rupees(amount)}`);
    setCans(10);
    setReturned(0);
    setPayNow("");
    if (!lockedCustomerId) setCustomerId(null);
    onSaved?.();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="d-date">Date</Label>
          <Input
            id="d-date"
            type="date"
            className="h-11"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {!lockedCustomerId && (
          <div className="space-y-2">
            <Label>Company</Label>
            <CompanySelect customers={customers} value={customerId} onChange={setCustomerId} />
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Number of cans</Label>
          <QtyStepper value={cans} onChange={setCans} min={0} />
        </div>
        <div className="space-y-2">
          <Label>Rate per can</Label>
          <Select value={String(rate)} onValueChange={(v) => setRate(Number(v))}>
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

      <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Delivery amount ({cans} × ₹{rate})
          </span>
          <span className="text-lg font-semibold">{rupees(amount)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="d-pay">Payment received now (optional)</Label>
        <Input
          id="d-pay"
          inputMode="numeric"
          className="h-11"
          placeholder="0"
          value={payNow}
          onChange={(e) => setPayNow(e.target.value.replace(/[^0-9]/g, ""))}
        />
        {payment > 0 && (
          <p className="text-sm text-muted-foreground">
            Delivery {rupees(amount)} − Payment {rupees(payment)} = pending{" "}
            {rupees(amount - payment)} from this entry
          </p>
        )}
      </div>

      {showReturns ? (
        <div className="space-y-2">
          <Label>Empty cans returned (optional)</Label>
          <QtyStepper value={returned} onChange={setReturned} min={0} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowReturns(true)}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          + Add returned cans
        </button>
      )}

      <Button className="h-12 w-full text-base" onClick={save}>
        Save entry
      </Button>
    </div>
  );
}
