import { useSyncExternalStore } from "react";

export type Customer = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  defaultRate: number;
  openingPending: number;
  notes?: string;
};

export type Txn = {
  id: string;
  customerId: string;
  date: string; // yyyy-mm-dd
  type: "delivery" | "payment";
  cans?: number;
  cansReturned?: number;
  rate?: number;
  amount: number; // delivery amount or payment amount (always positive)
  createdAt: number;
};

export type Data = { customers: Customer[]; txns: Txn[] };

export const RATES = [25, 30, 35, 40];

const KEY = "water-can-accounts-v1";

const seedCustomers: Customer[] = [
  ["Sri Lakshmi Hotel", "Ramesh", "98400 12345", 30, 2450],
  ["Sri Vinayaga Stores", "Karthik", "98401 22345", 25, 0],
  ["Sri Sakthi Traders", "Murali", "98402 33456", 35, 800],
  ["Sri Murugan Mess", "Selvam", "98403 44567", 30, 350],
  ["ABC Hotel", "Anand", "98404 55678", 30, 1200],
  ["Green Leaf Cafe", "Divya", "98405 66789", 40, 0],
].map(([name, contact, phone, defaultRate, openingPending], i) => ({
  id: `seed-${i + 1}`,
  name: name as string,
  contact: contact as string,
  phone: phone as string,
  defaultRate: defaultRate as number,
  openingPending: openingPending as number,
}));

let data: Data = { customers: seedCustomers, txns: [] };
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw) as Data;
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const emptySnapshot: Data = { customers: [], txns: [] };

export function useData(): Data {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return data;
    },
    () => emptySnapshot,
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function addCustomer(c: Omit<Customer, "id">) {
  load();
  data = { ...data, customers: [...data.customers, { ...c, id: uid() }] };
  persist();
}

export function updateCustomer(id: string, patch: Partial<Customer>) {
  load();
  data = {
    ...data,
    customers: data.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
  persist();
}

export function addTxn(t: Omit<Txn, "id" | "createdAt">) {
  load();
  data = { ...data, txns: [...data.txns, { ...t, id: uid(), createdAt: Date.now() }] };
  persist();
}

export function updateTxn(id: string, patch: Partial<Txn>) {
  load();
  data = { ...data, txns: data.txns.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
  persist();
}

export function deleteTxn(id: string) {
  load();
  data = { ...data, txns: data.txns.filter((t) => t.id !== id) };
  persist();
}

/* ---------- derived helpers (pure) ---------- */

export function sortTxns(txns: Txn[]) {
  return [...txns].sort((a, b) =>
    a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1,
  );
}

export function customerTxns(d: Data, customerId: string) {
  return sortTxns(d.txns.filter((t) => t.customerId === customerId));
}

export function pendingFor(d: Data, c: Customer) {
  return customerTxns(d, c.id).reduce(
    (bal, t) => (t.type === "delivery" ? bal + t.amount : bal - t.amount),
    c.openingPending,
  );
}

export function cansWith(d: Data, customerId: string) {
  return customerTxns(d, customerId).reduce(
    (n, t) => n + (t.cans ?? 0) - (t.cansReturned ?? 0),
    0,
  );
}

export function lastPaymentDate(d: Data, customerId: string): string | null {
  const pays = customerTxns(d, customerId).filter((t) => t.type === "payment");
  return pays.length ? pays[pays.length - 1]!.date : null;
}

export function daysSince(date: string) {
  const ms = Date.now() - new Date(`${date}T00:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const rupees = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

export const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
