import type { Customer, Data, Txn } from "@/lib/store";
import { sortTxns } from "@/lib/store";

const HEADERS = [
  "Heading",
  "Date",
  "Day",
  "Company Name",
  "No. of Gan",
  "Price",
  "Amount",
  "Total Pending",
];

const WIDTHS = [18, 14, 12, 26, 12, 10, 14, 16];

function longDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function dayName(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" });
}

/** Excel sheet names: max 31 chars, no []:*?/\ and must be unique. */
export function safeSheetName(name: string, used: Set<string>) {
  const base = (name.replace(/[[\]:*?/\\]/g, " ").trim() || "Company").slice(0, 31);
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

type Row = (string | number)[];

export function companyRows(data: Data, customer: Customer, endDate: string): Row[] {
  const txns: Txn[] = sortTxns(
    data.txns.filter((t) => t.customerId === customer.id && t.date <= endDate),
  );
  let pending = customer.openingPending;
  const rows: Row[] = [
    ["Opening Pending", "", "", customer.name, 0, 0, 0, pending],
  ];
  for (const t of txns) {
    if (t.type === "delivery") {
      const gan = t.cans ?? 0;
      const price = t.rate ?? 0;
      const amount = t.amount;
      pending += amount;
      rows.push([
        "Delivery",
        longDate(t.date),
        dayName(t.date),
        customer.name,
        gan,
        price,
        amount,
        pending,
      ]);
    } else {
      pending -= t.amount;
      rows.push([
        "Payment",
        longDate(t.date),
        dayName(t.date),
        customer.name,
        0,
        0,
        -t.amount,
        pending,
      ]);
    }
  }
  rows.push(["TOTAL", "", "", customer.name, "", "", "", pending]);
  return rows;
}

/** Build and download an .xlsx workbook. companyId = null means all companies. */
export async function exportLedgerExcel(
  data: Data,
  companyId: string | null,
  endDate: string,
) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const targets = companyId
    ? data.customers.filter((c) => c.id === companyId)
    : [...data.customers].sort((a, b) => a.name.localeCompare(b.name));

  const used = new Set<string>();
  for (const customer of targets) {
    const ws = wb.addWorksheet(safeSheetName(customer.name, used));
    ws.columns = WIDTHS.map((width) => ({ width }));

    const titleRow = ws.addRow([`${customer.name} — Ledger up to ${longDate(endDate)}`]);
    titleRow.font = { bold: true, size: 13 };
    ws.mergeCells(1, 1, 1, HEADERS.length);
    ws.addRow([]);

    const header = ws.addRow(HEADERS);
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    for (const r of companyRows(data, customer, endDate)) {
      const row = ws.addRow(r);
      [5, 6, 7, 8].forEach((i) => {
        row.getCell(i).numFmt = "#,##0";
      });
    }
    const last = ws.lastRow;
    if (last) last.font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 3 }];
  }

  if (targets.length === 0) wb.addWorksheet("No data");

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const label = companyId
    ? (targets[0]?.name ?? "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    : "all-companies";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `water-can-ledger-${label}-${endDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
