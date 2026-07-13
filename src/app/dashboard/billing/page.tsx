import { BillingDashboard } from "@/components/billing/BillingDashboard";
import {
  listExpenses,
  listInvoiceItems,
  listInvoicePayments,
  listInvoices,
  listUnpaidAppointments,
} from "@/server/billing";
import { listAppointmentServicesForIds } from "@/server/appointments";

export default async function BillingPage() {
  const invoices = await listInvoices(50);
  const invoiceIds = invoices.map((i) => i.id);
  const [invoiceItems, invoicePayments, expenses, unpaid] = await Promise.all([
    listInvoiceItems(invoiceIds),
    listInvoicePayments(invoiceIds),
    listExpenses(50),
    listUnpaidAppointments(),
  ]);
  const aptIds = unpaid.map((a) => a.id);
  const aptServices = await listAppointmentServicesForIds(aptIds);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Finance</h1>
        <p className="text-sm text-gray-500">Invoices, payments, and expenses</p>
      </div>
      <BillingDashboard
        invoices={invoices}
        invoiceItems={invoiceItems}
        invoicePayments={invoicePayments}
        expenses={expenses}
        unpaidAppointments={unpaid}
        appointmentServices={aptServices}
      />
    </div>
  );
}
