"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  Receipt,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  method: string;
};

export type PortalInvoice = {
  id: string;
  invoice_number: string;
  created_at: string;
  due_date: string | null;
  status: "paid" | "unpaid" | "overdue" | "draft";
  total: number;
  lines: InvoiceLine[];
  payments: Payment[];
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    unpaid: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-600",
    draft: "bg-gray-100 text-gray-500",
  };
  return map[s] ?? "bg-gray-100 text-gray-500";
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

export function InvoicesClient({ invoices }: { invoices: PortalInvoice[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<PortalInvoice | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all" ? invoices : invoices.filter((i) => i.status === filter),
    [filter, invoices]
  );

  const stats = useMemo(() => {
    const totalSpent = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.total, 0);
    const unpaid = invoices.filter(
      (i) => i.status === "unpaid" || i.status === "overdue"
    );
    return [
      {
        label: "Total Invoices",
        value: invoices.length.toString(),
        Icon: Receipt,
        bg: "bg-blue-50",
        color: "#3b82f6",
      },
      {
        label: "Total Spent",
        value: `$${totalSpent.toFixed(0)}`,
        Icon: DollarSign,
        bg: "bg-green-50",
        color: "#22c55e",
      },
      {
        label: "Unpaid",
        value: unpaid.length.toString(),
        Icon: AlertCircle,
        bg: "bg-yellow-50",
        color: "#f59e0b",
      },
      {
        label: "Outstanding",
        value: `$${unpaid.reduce((s, i) => s + i.total, 0).toFixed(0)}`,
        Icon: CreditCard,
        bg: "bg-red-50",
        color: "#ef4444",
      },
    ];
  }, [invoices]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-black tracking-tight text-gray-800">
          My Invoices
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-500">
          Billing history and payment records
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.Icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div
                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}
              >
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <p className="text-[19px] font-black text-gray-800">{stat.value}</p>
              <p className="text-[11px] font-medium text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-5 flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              "flex-1 rounded-xl py-2 text-[13px] font-semibold transition-all " +
              (filter === f.key
                ? "bg-[#1a0a3e] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Receipt className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-[14px] font-semibold text-gray-500">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-[#f2c037]/20 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl " +
                      (inv.status === "paid"
                        ? "bg-green-50"
                        : inv.status === "overdue"
                          ? "bg-red-50"
                          : "bg-yellow-50")
                    }
                  >
                    {inv.status === "paid" ? (
                      <CheckCircle2 className="h-[18px] w-[18px] text-green-600" />
                    ) : inv.status === "overdue" ? (
                      <AlertCircle className="h-[18px] w-[18px] text-red-500" />
                    ) : (
                      <Receipt className="h-[18px] w-[18px] text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-800">
                      {inv.invoice_number ||
                        `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                    </p>
                    <p className="text-[12px] text-gray-500">
                      {fmtDate(inv.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide " +
                      statusClass(inv.status)
                    }
                  >
                    {inv.status}
                  </span>
                  <span className="text-[18px] font-black text-gray-800">
                    {fmtCurrency(inv.total)}
                  </span>
                  <button
                    onClick={() => setSelected(inv)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-gray-600 transition-all hover:border-[#f2c037]/30 hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="py-2">
              <div className="mb-5 flex items-start justify-between rounded-2xl bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] p-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                    Invoice
                  </p>
                  <p className="text-[18px] font-black text-white">
                    {selected.invoice_number ||
                      `INV-${selected.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-[12px] text-white/60">
                    {fmtLongDate(selected.created_at)}
                  </p>
                </div>
                <span
                  className={
                    "rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide " +
                    statusClass(selected.status)
                  }
                >
                  {selected.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Services
                </p>
                {selected.lines.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No line items on record.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      <span className="col-span-6">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>
                    {selected.lines.map((line) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-12 border-t border-gray-50 px-3 py-2.5 text-[13px]"
                      >
                        <span className="col-span-6 font-medium text-gray-700">
                          {line.description}
                        </span>
                        <span className="col-span-2 text-center text-gray-500">
                          {line.quantity}
                        </span>
                        <span className="col-span-2 text-right text-gray-500">
                          {fmtCurrency(line.unit_price)}
                        </span>
                        <span className="col-span-2 text-right font-semibold text-gray-800">
                          {fmtCurrency(line.total)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2.5">
                      <span className="text-[13px] font-bold text-gray-700">Total</span>
                      <span className="text-[16px] font-black text-gray-800">
                        {fmtCurrency(selected.total)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selected.payments.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Payment History
                  </p>
                  <div className="space-y-2">
                    {selected.payments.map((pmt) => (
                      <div
                        key={pmt.id}
                        className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <div>
                            <p className="text-[12px] font-semibold text-green-800">
                              {fmtDate(pmt.payment_date)}
                            </p>
                            <p className="text-[11px] text-green-600">
                              {pmt.method || "Card"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[14px] font-black text-green-800">
                          {fmtCurrency(pmt.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
