import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportLedgerExcel } from "@/lib/export";
import { todayISO, useData } from "@/lib/store";

const ALL = "all";

export function ExportExcel({ defaultCompanyId }: { defaultCompanyId?: string | null }) {
  const data = useData();
  const [company, setCompany] = useState<string>(defaultCompanyId ?? ALL);
  const [busy, setBusy] = useState(false);

  const value = company === ALL ? ALL : company;

  async function run() {
    setBusy(true);
    try {
      await exportLedgerExcel(data, value === ALL ? null : value, todayISO());
      toast.success(
        value === ALL
          ? "Exported every company — one sheet each"
          : "Exported the selected company's full history",
      );
    } catch (e) {
      console.error(e);
      toast.error("Could not create the Excel file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-muted/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="x-company">Export company</Label>
          <Select value={value} onValueChange={setCompany}>
            <SelectTrigger id="x-company" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All companies</SelectItem>
              {data.customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:w-auto"
          disabled={busy}
          onClick={run}
        >
          <Download className="size-4" />
          {busy ? "Preparing..." : "Export Excel"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Includes every entry from the beginning up to today, with a running pending total.
      </p>
    </div>
  );
}
