import { listMyInvoices } from "@/server/portal";
import { InvoicesClient } from "@/components/portal/InvoicesClient";

export default async function PortalInvoicesPage() {
  const invoices = await listMyInvoices();
  return <InvoicesClient invoices={invoices} />;
}
