'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  clients,
  pets,
  services,
  staff,
  waitList,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function listWaitList() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(waitList)
    .leftJoin(clients, eq(waitList.clientId, clients.id))
    .leftJoin(pets, eq(waitList.petId, pets.id))
    .leftJoin(services, eq(waitList.serviceId, services.id))
    .leftJoin(staff, eq(waitList.preferredStaffId, staff.id))
    .where(eq(waitList.businessId, businessId))
    .orderBy(desc(waitList.createdAt));
  return rows.map((r) => ({
    id: r.wait_list.id,
    client_id: r.wait_list.clientId,
    pet_id: r.wait_list.petId,
    service_id: r.wait_list.serviceId,
    preferred_staff_id: r.wait_list.preferredStaffId,
    preferred_date_start: r.wait_list.preferredDateStart,
    preferred_date_end: r.wait_list.preferredDateEnd,
    preferred_time_start: r.wait_list.preferredTimeStart,
    preferred_time_end: r.wait_list.preferredTimeEnd,
    notes: r.wait_list.notes,
    status: r.wait_list.status,
    created_at: r.wait_list.createdAt,
    clients: r.clients
      ? {
          id: r.clients.id,
          first_name: r.clients.firstName,
          last_name: r.clients.lastName,
          phone: r.clients.phone,
        }
      : null,
    pets: r.pets ? { id: r.pets.id, name: r.pets.name, species: r.pets.species } : null,
    services: r.services ? { id: r.services.id, name: r.services.name } : null,
    staff: r.staff
      ? { id: r.staff.id, first_name: r.staff.firstName, last_name: r.staff.lastName }
      : null,
  }));
}

export async function addWaitListEntry(input: {
  client_id: string;
  pet_id?: string | null;
  service_id?: string | null;
  preferred_staff_id?: string | null;
  preferred_date_start?: string | null;
  preferred_date_end?: string | null;
  preferred_time_start?: string | null;
  preferred_time_end?: string | null;
  notes?: string | null;
}) {
  const { businessId } = await requireBusiness();
  // Verify client belongs to this business
  const [c] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, input.client_id), eq(clients.businessId, businessId)))
    .limit(1);
  if (!c) throw new Error('Client not found');
  await db.insert(waitList).values({
    clientId: input.client_id,
    petId: input.pet_id ?? null,
    serviceId: input.service_id ?? null,
    preferredStaffId: input.preferred_staff_id ?? null,
    preferredDateStart: input.preferred_date_start ?? null,
    preferredDateEnd: input.preferred_date_end ?? null,
    preferredTimeStart: input.preferred_time_start ?? null,
    preferredTimeEnd: input.preferred_time_end ?? null,
    notes: input.notes ?? null,
    businessId,
  });
  revalidatePath('/dashboard/waitlist');
}

export async function updateWaitListStatus(id: string, status: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(waitList)
    .set({ status })
    .where(and(eq(waitList.id, id), eq(waitList.businessId, businessId)));
  revalidatePath('/dashboard/waitlist');
}

export async function deleteWaitListEntry(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(waitList)
    .where(and(eq(waitList.id, id), eq(waitList.businessId, businessId)));
  revalidatePath('/dashboard/waitlist');
}
