'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { vans, vanMaintenance, fuelLogs } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type VanRow = {
  id: string;
  name: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  current_mileage: number | null;
  last_oil_change: string | null;
  last_inspection: string | null;
  insurance_expiry: string | null;
  status: string;
  is_active: boolean;
};

async function vanBelongsToBusiness(vanId: string, businessId: string) {
  const [v] = await db
    .select({ id: vans.id })
    .from(vans)
    .where(and(eq(vans.id, vanId), eq(vans.businessId, businessId)))
    .limit(1);
  return !!v;
}

export async function listVans(): Promise<VanRow[]> {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(vans)
    .where(and(eq(vans.businessId, businessId), eq(vans.isActive, true)))
    .orderBy(vans.name);
  return rows.map((v) => ({
    id: v.id,
    name: v.name,
    license_plate: v.licensePlate,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color,
    current_mileage: v.currentMileage,
    last_oil_change: v.lastOilChange,
    last_inspection: v.lastInspection,
    insurance_expiry: v.insuranceExpiry,
    status: v.status,
    is_active: v.isActive,
  }));
}

export async function listVanMaintenance() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(vanMaintenance)
    .where(eq(vanMaintenance.businessId, businessId))
    .orderBy(desc(vanMaintenance.performedAt))
    .limit(100);
  const vanRows = await db
    .select()
    .from(vans)
    .where(eq(vans.businessId, businessId));
  const vanMap = new Map(vanRows.map((v) => [v.id, v.name]));
  return rows.map((r) => ({
    id: r.id,
    van_id: r.vanId,
    van_name: vanMap.get(r.vanId) ?? r.vanId,
    type: r.type,
    description: r.description,
    cost: Number(r.cost),
    mileage: r.mileage,
    performed_at: r.performedAt,
    next_due_at: r.nextDueAt,
    notes: r.notes,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function listFuelLogs() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(fuelLogs)
    .where(eq(fuelLogs.businessId, businessId))
    .orderBy(desc(fuelLogs.date))
    .limit(100);
  const vanRows = await db
    .select()
    .from(vans)
    .where(eq(vans.businessId, businessId));
  const vanMap = new Map(vanRows.map((v) => [v.id, v.name]));
  return rows.map((r) => ({
    id: r.id,
    van_id: r.vanId,
    van_name: vanMap.get(r.vanId) ?? r.vanId,
    date: r.date,
    gallons: Number(r.gallons),
    cost: Number(r.cost),
    mileage: r.mileage,
    station: r.station,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function createMaintenance(input: {
  van_id: string;
  type: string;
  description?: string;
  cost: number;
  mileage?: number | null;
  performed_at: string;
  next_due_at?: string | null;
  notes?: string | null;
}) {
  const { businessId } = await requireBusiness();
  if (!(await vanBelongsToBusiness(input.van_id, businessId))) {
    throw new Error('Van not found');
  }
  await db.insert(vanMaintenance).values({
    vanId: input.van_id,
    type: input.type,
    description: input.description ?? null,
    cost: String(input.cost),
    mileage: input.mileage ?? null,
    performedAt: input.performed_at,
    nextDueAt: input.next_due_at ?? null,
    notes: input.notes ?? null,
    businessId,
  });
  const updates: Record<string, unknown> = {};
  if (input.type === 'oil_change') updates.lastOilChange = input.performed_at;
  if (input.type === 'inspection') updates.lastInspection = input.performed_at;
  if (input.mileage) updates.currentMileage = input.mileage;
  if (Object.keys(updates).length > 0) {
    await db
      .update(vans)
      .set(updates)
      .where(and(eq(vans.id, input.van_id), eq(vans.businessId, businessId)));
  }
  revalidatePath('/dashboard/van-maintenance');
}

export async function deleteMaintenance(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(vanMaintenance)
    .where(
      and(eq(vanMaintenance.id, id), eq(vanMaintenance.businessId, businessId)),
    );
  revalidatePath('/dashboard/van-maintenance');
}

export async function createFuelLog(input: {
  van_id: string;
  date: string;
  gallons: number;
  cost: number;
  mileage?: number | null;
  station?: string | null;
}) {
  const { businessId } = await requireBusiness();
  if (!(await vanBelongsToBusiness(input.van_id, businessId))) {
    throw new Error('Van not found');
  }
  await db.insert(fuelLogs).values({
    vanId: input.van_id,
    date: input.date,
    gallons: String(input.gallons),
    cost: String(input.cost),
    mileage: input.mileage ?? null,
    station: input.station ?? null,
    businessId,
  });
  revalidatePath('/dashboard/van-maintenance');
}

export async function deleteFuelLog(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(fuelLogs)
    .where(and(eq(fuelLogs.id, id), eq(fuelLogs.businessId, businessId)));
  revalidatePath('/dashboard/van-maintenance');
}

export async function updateVan(id: string, input: { status?: string; current_mileage?: number }) {
  const { businessId } = await requireBusiness();
  await db
    .update(vans)
    .set({
      status: input.status,
      currentMileage: input.current_mileage,
    })
    .where(and(eq(vans.id, id), eq(vans.businessId, businessId)));
  revalidatePath('/dashboard/van-maintenance');
}
