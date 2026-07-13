'use server';

import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  appointments,
  clients,
  expenses,
  invoiceItems,
  invoicePayments,
  invoices,
} from '@/lib/db/schema';
import { requireBusiness, requireRole } from '@/lib/auth-server';

type InvoiceRow = typeof invoices.$inferSelect;
type ClientRow = typeof clients.$inferSelect;

const invoiceToApi = (i: InvoiceRow, c: ClientRow | null) => ({
  id: i.id,
  invoice_number: i.invoiceNumber,
  appointment_id: i.appointmentId,
  client_id: i.clientId,
  subtotal: Number(i.subtotal),
  tax: Number(i.tax),
  total: Number(i.total),
  status: i.status,
  payment_method: i.paymentMethod,
  paid_amount: Number(i.paidAmount),
  paid_at: i.paidAt,
  due_date: i.dueDate,
  notes: i.notes,
  created_at: i.createdAt,
  clients: c
    ? { first_name: c.firstName, last_name: c.lastName, phone: c.phone }
    : null,
});

export async function listInvoices(limit = 50) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.businessId, businessId))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);
  return rows.map((r) => invoiceToApi(r.invoices, r.clients));
}

export async function listInvoiceItems(invoiceIds: string[]) {
  const { businessId } = await requireBusiness();
  if (!invoiceIds.length) return [];
  // Only allow ids that belong to this business
  const owned = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(inArray(invoices.id, invoiceIds), eq(invoices.businessId, businessId)),
    );
  const ownedIds = owned.map((o) => o.id);
  if (!ownedIds.length) return [];
  const rows = await db
    .select()
    .from(invoiceItems)
    .where(inArray(invoiceItems.invoiceId, ownedIds))
    .orderBy(invoiceItems.sortOrder);
  return rows.map((i) => ({
    id: i.id,
    invoice_id: i.invoiceId,
    appointment_service_id: i.appointmentServiceId,
    description: i.description,
    quantity: Number(i.quantity),
    unit_price: Number(i.unitPrice),
    discount_amount: Number(i.discountAmount),
    tax_amount: Number(i.taxAmount),
    total: Number(i.total),
    sort_order: i.sortOrder,
  }));
}

export async function listInvoicePayments(invoiceIds: string[]) {
  const { businessId } = await requireBusiness();
  if (!invoiceIds.length) return [];
  const owned = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(inArray(invoices.id, invoiceIds), eq(invoices.businessId, businessId)),
    );
  const ownedIds = owned.map((o) => o.id);
  if (!ownedIds.length) return [];
  const rows = await db
    .select()
    .from(invoicePayments)
    .where(inArray(invoicePayments.invoiceId, ownedIds))
    .orderBy(desc(invoicePayments.paidAt));
  return rows.map((p) => ({
    id: p.id,
    invoice_id: p.invoiceId,
    amount: Number(p.amount),
    payment_method: p.paymentMethod,
    paid_at: p.paidAt,
    reference: p.reference,
  }));
}

// ----- expenses -----

export async function listExpenses(limit = 50) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.businessId, businessId))
    .orderBy(desc(expenses.date))
    .limit(limit);
  return rows.map((e) => ({
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    category: e.category,
    date: e.date,
    van: e.van,
  }));
}

export async function listExpensesForRange(from: string, to: string) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.date, from),
        lte(expenses.date, to),
      ),
    );
  return rows.map((e) => ({
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    category: e.category,
    date: e.date,
    van: e.van,
  }));
}

export async function createExpense(input: {
  category: string;
  description: string;
  amount: number;
  date: string;
  van?: string | null;
}) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  await db.insert(expenses).values({
    category: input.category,
    description: input.description,
    amount: String(input.amount),
    date: input.date,
    van: input.van ?? null,
    businessId,
  });
  revalidatePath('/dashboard/billing');
}

// ----- unpaid completed appointments -----

export async function listUnpaidAppointments() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.status, 'completed'),
        eq(appointments.paymentStatus, 'pending'),
      ),
    )
    .orderBy(desc(appointments.date));
  return rows.map((r) => ({
    id: r.appointments.id,
    date: r.appointments.date,
    price: r.appointments.price != null ? Number(r.appointments.price) : null,
    client_id: r.appointments.clientId,
    clients: r.clients
      ? { first_name: r.clients.firstName, last_name: r.clients.lastName }
      : null,
    pets: null,
    services: null,
  }));
}

// ----- create invoice from appointment payment -----

export async function createInvoiceFromAppointment(input: {
  appointment_id: string;
  client_id: string | null;
  invoice_number: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  items: {
    appointment_service_id?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    sort_order: number;
  }[];
}) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);

  // Verify appointment belongs to this business
  const [apt] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, input.appointment_id),
        eq(appointments.businessId, businessId),
      ),
    )
    .limit(1);
  if (!apt) throw new Error('Appointment not found');

  const now = new Date();
  const [inv] = await db
    .insert(invoices)
    .values({
      appointmentId: input.appointment_id,
      clientId: input.client_id,
      invoiceNumber: input.invoice_number,
      subtotal: String(input.subtotal),
      tax: String(input.tax),
      total: String(input.total),
      status: 'paid',
      paymentMethod: input.payment_method,
      paidAmount: String(input.total),
      paidAt: now,
      dueDate: now.toISOString().split('T')[0],
      businessId,
    })
    .returning();

  if (input.items.length > 0) {
    await db.insert(invoiceItems).values(
      input.items.map((it) => ({
        invoiceId: inv.id,
        appointmentServiceId: it.appointment_service_id ?? null,
        description: it.description,
        quantity: String(it.quantity),
        unitPrice: String(it.unit_price),
        total: String(it.total),
        sortOrder: it.sort_order,
      }))
    );
  }

  await db.insert(invoicePayments).values({
    invoiceId: inv.id,
    amount: String(input.total),
    paymentMethod: input.payment_method,
    paidAt: now,
  });

  await db
    .update(appointments)
    .set({ paymentStatus: 'paid', paymentMethod: input.payment_method })
    .where(
      and(
        eq(appointments.id, input.appointment_id),
        eq(appointments.businessId, businessId),
      ),
    );

  revalidatePath('/dashboard/billing');
  return inv.invoiceNumber;
}
