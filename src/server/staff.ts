'use server';

import { and, desc, eq, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clockRecords, staff, staffBlockTimes, staffSchedules } from '@/lib/db/schema';
import { requireBusiness, requireRole } from '@/lib/auth-server';

type StaffRow = typeof staff.$inferSelect;

const staffToApi = (s: StaffRow) => ({
  id: s.id,
  first_name: s.firstName,
  last_name: s.lastName,
  color: s.color,
  role: s.role,
  commission_rate: s.commissionRate != null ? Number(s.commissionRate) : 0,
  phone: s.phone,
  email: s.email,
  is_active: s.isActive,
});

async function staffBelongsToBusiness(staffId: string, businessId: string) {
  const [s] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);
  return !!s;
}

export async function listStaff() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)))
    .orderBy(staff.firstName);
  return rows.map(staffToApi);
}

export async function listAllStaff() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(staff)
    .where(eq(staff.businessId, businessId))
    .orderBy(staff.firstName);
  return rows.map(staffToApi);
}

export async function getStaff(id: string) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.businessId, businessId)))
    .limit(1);
  return row ? staffToApi(row) : null;
}

export type StaffInput = {
  first_name: string;
  last_name?: string;
  role?: string;
  phone?: string | null;
  email?: string | null;
  color?: string;
  commission_rate?: number;
  is_active?: boolean;
};

export async function createStaff(input: StaffInput) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  const [row] = await db
    .insert(staff)
    .values({
      firstName: input.first_name,
      lastName: input.last_name ?? '',
      role: input.role ?? 'groomer',
      phone: input.phone ?? null,
      email: input.email ?? null,
      color: input.color ?? '#f2c037',
      commissionRate: String(input.commission_rate ?? 0),
      businessId,
    })
    .returning();
  revalidatePath('/dashboard/staff');
  return staffToApi(row);
}

export async function updateStaff(id: string, input: Partial<StaffInput>) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  await db
    .update(staff)
    .set({
      firstName: input.first_name,
      lastName: input.last_name,
      role: input.role,
      phone: input.phone,
      email: input.email,
      color: input.color,
      commissionRate: input.commission_rate != null ? String(input.commission_rate) : undefined,
      isActive: input.is_active,
      updatedAt: new Date(),
    })
    .where(and(eq(staff.id, id), eq(staff.businessId, businessId)));
  revalidatePath('/dashboard/staff');
  revalidatePath(`/dashboard/staff/${id}`);
}

// ----- schedules -----

export async function listSchedules(staffId: string) {
  const { businessId } = await requireBusiness();
  if (!(await staffBelongsToBusiness(staffId, businessId))) return [];
  const rows = await db
    .select()
    .from(staffSchedules)
    .where(
      and(
        eq(staffSchedules.staffId, staffId),
        eq(staffSchedules.businessId, businessId),
      ),
    )
    .orderBy(staffSchedules.dayOfWeek);
  return rows.map((r) => ({
    id: r.id,
    staff_id: r.staffId,
    day_of_week: r.dayOfWeek,
    start_time: r.startTime,
    end_time: r.endTime,
    is_available: r.isAvailable,
  }));
}

export async function saveSchedules(
  staffId: string,
  rows: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[]
) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  if (!(await staffBelongsToBusiness(staffId, businessId))) {
    throw new Error('Staff not found');
  }
  await db
    .delete(staffSchedules)
    .where(
      and(
        eq(staffSchedules.staffId, staffId),
        eq(staffSchedules.businessId, businessId),
      ),
    );
  if (rows.length > 0) {
    await db.insert(staffSchedules).values(
      rows.map((r) => ({
        staffId,
        dayOfWeek: r.day_of_week,
        startTime: r.start_time,
        endTime: r.end_time,
        isAvailable: r.is_available,
        businessId,
      }))
    );
  }
  revalidatePath(`/dashboard/staff/${staffId}`);
}

// ----- block times -----

export async function listBlockTimes(staffId: string) {
  const { businessId } = await requireBusiness();
  if (!(await staffBelongsToBusiness(staffId, businessId))) return [];
  const today = new Date().toISOString().split('T')[0];
  const rows = await db
    .select()
    .from(staffBlockTimes)
    .where(
      and(
        eq(staffBlockTimes.staffId, staffId),
        eq(staffBlockTimes.businessId, businessId),
        gte(staffBlockTimes.date, today),
      ),
    )
    .orderBy(staffBlockTimes.date);
  return rows.map((r) => ({
    id: r.id,
    staff_id: r.staffId,
    date: r.date,
    start_time: r.startTime,
    end_time: r.endTime,
    description: r.description,
  }));
}

export async function addBlockTime(input: {
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string | null;
}) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  if (!(await staffBelongsToBusiness(input.staff_id, businessId))) {
    throw new Error('Staff not found');
  }
  await db.insert(staffBlockTimes).values({
    staffId: input.staff_id,
    date: input.date,
    startTime: input.start_time,
    endTime: input.end_time,
    description: input.description ?? null,
    businessId,
  });
  revalidatePath(`/dashboard/staff/${input.staff_id}`);
}

export async function deleteBlockTime(id: string, staffId: string) {
  const { businessId } = await requireRole(['admin', 'owner', 'manager']);
  await db
    .delete(staffBlockTimes)
    .where(
      and(eq(staffBlockTimes.id, id), eq(staffBlockTimes.businessId, businessId)),
    );
  revalidatePath(`/dashboard/staff/${staffId}`);
}

// ----- clock records -----

export async function listClockRecords(staffId: string, limit = 30) {
  const { businessId } = await requireBusiness();
  if (!(await staffBelongsToBusiness(staffId, businessId))) return [];
  const rows = await db
    .select()
    .from(clockRecords)
    .where(
      and(
        eq(clockRecords.staffId, staffId),
        eq(clockRecords.businessId, businessId),
      ),
    )
    .orderBy(desc(clockRecords.clockIn))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    staff_id: r.staffId,
    clock_in: r.clockIn,
    clock_out: r.clockOut,
    total_hours: r.totalHours != null ? Number(r.totalHours) : null,
    notes: r.notes,
  }));
}

export async function clockIn(staffId: string) {
  const { businessId } = await requireBusiness();
  if (!(await staffBelongsToBusiness(staffId, businessId))) {
    throw new Error('Staff not found');
  }
  await db
    .insert(clockRecords)
    .values({ staffId, clockIn: new Date(), businessId });
  revalidatePath(`/dashboard/staff/${staffId}`);
}

export async function clockOut(id: string, staffId: string) {
  const { businessId } = await requireBusiness();
  const [existing] = await db
    .select()
    .from(clockRecords)
    .where(and(eq(clockRecords.id, id), eq(clockRecords.businessId, businessId)))
    .limit(1);
  if (!existing) throw new Error('Clock record not found');
  const out = new Date();
  const hours = Math.round(((out.getTime() - new Date(existing.clockIn).getTime()) / 3600000) * 100) / 100;
  await db
    .update(clockRecords)
    .set({ clockOut: out, totalHours: String(hours) })
    .where(and(eq(clockRecords.id, id), eq(clockRecords.businessId, businessId)));
  revalidatePath(`/dashboard/staff/${staffId}`);
  return hours;
}
