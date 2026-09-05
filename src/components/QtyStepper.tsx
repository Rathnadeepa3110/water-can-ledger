import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QtyStepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  const set = (n: number) => onChange(Math.max(min, Math.floor(Number.isFinite(n) ? n : min)));
  return (
    <div className="flex h-11 w-full max-w-[220px] items-center rounded-md border border-input">
      <Button
        type="button"
        variant="ghost"
        className="h-full rounded-r-none px-4"
        onClick={() => set(value - 1)}
        aria-label="Decrease"
      >
        <Minus className="size-4" />
      </Button>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          set(digits === "" ? min : parseInt(digits, 10));
        }}
        className="h-full min-w-0 flex-1 border-x border-input bg-transparent text-center text-base font-medium outline-none"
        aria-label="Quantity"
      />
      <Button
        type="button"
        variant="ghost"
        className="h-full rounded-l-none px-4"
        onClick={() => set(value + 1)}
        aria-label="Increase"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
