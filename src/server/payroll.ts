'use server';

import { and, eq, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { payrollDeductions, payrollPeriods, staff } from '@/lib/db/schema';
import { requireBusiness, requireRole } from '@/lib/auth-server';

export async function listDeductions(year: number, month: number) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(payrollDeductions)
    .where(
      and(
        eq(payrollDeductions.businessId, businessId),
        eq(payrollDeductions.periodYear, year),
        eq(payrollDeductions.periodMonth, month),
      ),
    );
  return rows.map((d) => ({
    id: d.id,
    staff_id: d.staffId,
    period_year: d.periodYear,
    period_month: d.periodMonth,
    description: d.description,
    amount: Number(d.amount),
  }));
}

export async function addDeduction(input: {
  staff_id: string;
  period_year: number;
  period_month: number;
  description: string;
  amount: number;
}) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  // Verify staff belongs to business
  const [s] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, input.staff_id), eq(staff.businessId, businessId)))
    .limit(1);
  if (!s) throw new Error('Staff not found');
  await db.insert(payrollDeductions).values({
    staffId: input.staff_id,
    periodYear: input.period_year,
    periodMonth: input.period_month,
    description: input.description,
    amount: String(input.amount),
    businessId,
  });
  revalidatePath('/dashboard/payroll');
}

export async function removeDeduction(id: string) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  await db
    .delete(payrollDeductions)
    .where(
      and(
        eq(payrollDeductions.id, id),
        eq(payrollDeductions.businessId, businessId),
      ),
    );
  revalidatePath('/dashboard/payroll');
}

export async function getPeriod(start: string, end: string) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .select()
    .from(payrollPeriods)
    .where(
      and(
        eq(payrollPeriods.businessId, businessId),
        gte(payrollPeriods.startDate, start),
        lte(payrollPeriods.endDate, end),
      ),
    )
    .limit(1);
  return row
    ? {
        id: row.id,
        start_date: row.startDate,
        end_date: row.endDate,
        status: row.status,
        paid_at: row.paidAt,
      }
    : null;
}

export async function markPeriodPaid(start: string, end: string) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  const existing = await getPeriod(start, end);
  const paidAt = new Date();
  if (existing) {
    await db
      .update(payrollPeriods)
      .set({ status: 'paid', paidAt })
      .where(
        and(
          eq(payrollPeriods.id, existing.id),
          eq(payrollPeriods.businessId, businessId),
        ),
      );
    return { ...existing, status: 'paid', paid_at: paidAt };
  }
  const [row] = await db
    .insert(payrollPeriods)
    .values({ startDate: start, endDate: end, status: 'paid', paidAt, businessId })
    .returning();
  revalidatePath('/dashboard/payroll');
  return {
    id: row.id,
    start_date: row.startDate,
    end_date: row.endDate,
    status: row.status,
    paid_at: row.paidAt,
  };
}
