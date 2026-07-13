"use client";
import type { Appointment } from "@/types";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Plus, TrendingDown, CreditCard, Printer, Eye } from "lucide-react";
import { toast } from "sonner";
import { createExpense, createInvoiceFromAppointment } from "@/server/billing";

interface Invoice {
  id: string;
  appointment_id: string | null;
  client_id: string | null;
  invoice_number: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  payment_method: string | null;
  paid_amount: number;
  paid_at: string | Date | null;
  due_date: string | null;
  notes: string | null;
  created_at: string | Date;
  clients: { first_name: string; last_name: string; phone: string | null } | null;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  appointment_service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  sort_order: number;
}

interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  paid_at: string | Date;
}

interface Expense {
  id: string;
  category: string | null;
  description: string;
  amount: number;
  date: string;
  van: string | null;
}

interface UnpaidAppointment {
  id: string;
  date: string;
  price: number | null;
  client_id: string | null;
  clients: Appointment["clients"];
  pets: Appointment["pets"];
  services: import("@/types").ServiceRef | null;
}

interface AppointmentService {
  id: string;
  appointment_id: string;
  pet_id: string | null;
  service_id: string | null;
  price: number;
  duration_minutes: number | null;
  status: string | null;
  notes: string | null;
  sort_order: number;
  services: { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-400",
};

const PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "apple_pay", label: "Apple Pay" },
] as const;

export function BillingDashboard({
  invoices,
  invoiceItems,
  invoicePayments,
  expenses,
  unpaidAppointments,
  appointmentServices,
}: {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  invoicePayments: InvoicePayment[];
  expenses: Expense[];
  unpaidAppointments: UnpaidAppointment[];
  appointmentServices: AppointmentService[];
}) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "fuel",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    van: "",
  });
  const router = useRouter();

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0);
  const totalPending = invoices.filter((i) => ["sent", "draft"].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function handleExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpense({
        category: expenseForm.category,
        description: expenseForm.description,
        amount: expenseForm.amount,
        date: expenseForm.date,
        van: expenseForm.van || null,
      });
      toast.success("Expense added");
      setExpenseOpen(false);
      setExpenseForm({ category: "fuel", description: "", amount: 0, date: new Date().toISOString().split("T")[0], van: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  function generateInvoiceNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const seq = invoices.filter((i) => i.invoice_number.startsWith(`INV-${dateStr}`)).length + 1;
    return `INV-${dateStr}-${seq}`;
  }

  async function markAsPaid(appointment: UnpaidAppointment, method: string) {
    setProcessingId(appointment.id);
    try {
      const aptSvcs = appointmentServices.filter((s) => s.appointment_id === appointment.id);
      const subtotal = aptSvcs.length > 0
        ? aptSvcs.reduce((sum, s) => sum + Number(s.price), 0)
        : Number(appointment.price ?? 0);
      const tax = 0;
      const total = subtotal + tax;
      const invoiceNumber = generateInvoiceNumber();

      const items = aptSvcs.length > 0
        ? aptSvcs.map((svc, idx) => ({
            appointment_service_id: svc.id,
            description: svc.services?.name ?? "Service",
            quantity: 1,
            unit_price: Number(svc.price),
            total: Number(svc.price),
            sort_order: idx,
          }))
        : [{
            appointment_service_id: null,
            description: appointment.services?.name ?? "Grooming Service",
            quantity: 1,
            unit_price: Number(appointment.price ?? 0),
            total: Number(appointment.price ?? 0),
            sort_order: 0,
          }];

      const number = await createInvoiceFromAppointment({
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        invoice_number: invoiceNumber,
        subtotal,
        tax,
        total,
        payment_method: method,
        items,
      });

      toast.success(`Invoice ${number} created and marked as paid`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setProcessingId(null);
    }
  }

  function openInvoiceDetail(inv: Invoice) {
    setSelectedInvoice(inv);
    setDetailOpen(true);
  }

  function getItemsForInvoice(invoiceId: string) {
    return invoiceItems.filter((item) => item.invoice_id === invoiceId);
  }

  function getPaymentsForInvoice(invoiceId: string) {
    return invoicePayments.filter((p) => p.invoice_id === invoiceId);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-green-100 p-3"><DollarSign size={20} className="text-green-600" /></div><div><p className="text-sm text-gray-500">Revenue (Paid)</p><p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-yellow-100 p-3"><CreditCard size={20} className="text-yellow-600" /></div><div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-gray-900">${totalPending.toFixed(2)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-red-100 p-3"><TrendingDown size={20} className="text-red-600" /></div><div><p className="text-sm text-gray-500">Expenses</p><p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="unpaid">
        <TabsList>
          <TabsTrigger value="unpaid">Unpaid ({unpaidAppointments.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid" className="mt-4 space-y-3">
          {unpaidAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">All caught up! No unpaid appointments.</p>
          ) : (
            unpaidAppointments.map((apt) => {
              const aptSvcs = appointmentServices.filter((s) => s.appointment_id === apt.id);
              const lineTotal = aptSvcs.length > 0
                ? aptSvcs.reduce((sum, s) => sum + Number(s.price), 0)
                : Number(apt.price ?? 0);
              return (
                <Card key={apt.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{apt.clients?.first_name} {apt.clients?.last_name}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-sm text-gray-500">{apt.pets?.name}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-sm text-gray-500">{apt.services?.name}</span>
                      {aptSvcs.length > 1 && <span className="ml-1 text-xs text-gray-400">(+{aptSvcs.length - 1} more)</span>}
                      <div className="mt-0.5 text-xs text-gray-400">{apt.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">${lineTotal.toFixed(2)}</span>
                      <Select onValueChange={(v) => { if (v && !processingId) markAsPaid(apt, v as string); }}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue placeholder={processingId === apt.id ? "Processing..." : "Mark paid"} />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((pm) => (<SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-3">
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <Card key={inv.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openInvoiceDetail(inv)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="text-sm font-bold text-gray-900">#{inv.invoice_number}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{inv.clients?.first_name} {inv.clients?.last_name}</span>
                    <div className="mt-0.5 text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-gray-900">${Number(inv.total).toFixed(2)}</span>
                    <Badge className={statusColors[inv.status] ?? ""}>{inv.status}</Badge>
                    <Eye size={16} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
                <Plus size={16} className="mr-1" /> Add Expense
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                <form onSubmit={handleExpense} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Category *</Label>
                      <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v ?? "fuel" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fuel">Fuel</SelectItem>
                          <SelectItem value="supplies">Supplies</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Amount *</Label><Input type="number" step="0.01" min={0} value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })} required /></div>
                  </div>
                  <div><Label>Description *</Label><Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>Date</Label><Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></div>
                    <div>
                      <Label>Van</Label>
                      <Select value={expenseForm.van} onValueChange={(v) => setExpenseForm({ ...expenseForm, van: v ?? "" })}>
                        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Van 5">Van 5</SelectItem>
                          <SelectItem value="Van 7">Van 7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Saving..." : "Add Expense"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {expenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No expenses recorded.</p>
          ) : (
            expenses.map((exp) => (
              <Card key={exp.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{exp.description}</span>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                      <Badge variant="secondary" className="capitalize">{exp.category}</Badge>
                      <span>{exp.date}</span>
                      {exp.van && <span>{exp.van}</span>}
                    </div>
                  </div>
                  <span className="text-base font-bold text-red-600">-${exp.amount}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedInvoice && (
            <InvoiceDetailView invoice={selectedInvoice} items={getItemsForInvoice(selectedInvoice.id)} payments={getPaymentsForInvoice(selectedInvoice.id)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceDetailView({
  invoice,
  items,
  payments,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  payments: InvoicePayment[];
}) {
  const subtotal = Number(invoice.subtotal);
  const tax = Number(invoice.tax);
  const total = Number(invoice.total);

  return (
    <div className="space-y-4 print:text-black">
      <DialogHeader>
        <DialogTitle>Invoice #{invoice.invoice_number}</DialogTitle>
      </DialogHeader>

      <div className="flex items-start justify-between text-sm">
        <div>
          <p className="font-semibold text-gray-900">{invoice.clients?.first_name} {invoice.clients?.last_name}</p>
          {invoice.clients?.phone && <p className="text-gray-500">{invoice.clients.phone}</p>}
        </div>
        <div className="text-right">
          <Badge className={statusColors[invoice.status] ?? ""}>{invoice.status}</Badge>
          <p className="mt-1 text-xs text-gray-400">{new Date(invoice.created_at).toLocaleDateString()}</p>
          {invoice.due_date && <p className="text-xs text-gray-400">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>}
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Line Items</p>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No line items recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs text-center">Qty</TableHead>
                <TableHead className="text-xs text-right">Price</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm">${Number(item.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">${Number(item.total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Separator />

      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
        {tax > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-medium">${tax.toFixed(2)}</span></div>}
        <div className="flex justify-between text-base font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Payment History</p>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium capitalize">{p.payment_method.replace("_", " ")}</span>
                  <span className="ml-2 text-xs text-gray-400">{new Date(p.paid_at).toLocaleString()}</span>
                  {p.reference && <span className="ml-2 text-xs text-gray-400">Ref: {p.reference}</span>}
                </div>
                <span className="font-bold text-green-600">${Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {invoice.notes && (
        <>
          <Separator />
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        </>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
          <Printer size={14} />
          Print
        </Button>
      </DialogFooter>
    </div>
  );
}
