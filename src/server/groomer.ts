'use server';

import { and, eq, gte, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { appointments, clients, pets, services, staff } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type GroomerAppointmentRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  address: string | null;
  city: string | null;
  price: number | null;
  notes: string | null;
  checkin_at: string | null;
  clients: { first_name: string; last_name: string; phone: string | null } | null;
  pets: { name: string; breed: string | null; species: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
};

export async function listMyAppointments(profileId?: string | null): Promise<GroomerAppointmentRow[]> {
  const { businessId } = await requireBusiness();
  const today = new Date().toISOString().split('T')[0];

  let staffId: string | null = null;
  if (profileId) {
    const [s] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.profileId, profileId), eq(staff.businessId, businessId)))
      .limit(1);
    staffId = s?.id ?? null;
  }

  const conds = [
    eq(appointments.businessId, businessId),
    gte(appointments.date, today),
    ne(appointments.status, 'cancelled'),
  ];
  if (staffId) conds.push(eq(appointments.staffId, staffId));

  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(...conds))
    .orderBy(appointments.date, appointments.startTime);

  return rows.map((r) => ({
    id: r.appointments.id,
    date: r.appointments.date,
    start_time: r.appointments.startTime,
    end_time: r.appointments.endTime,
    status: r.appointments.status,
    address: r.appointments.address,
    city: r.appointments.city,
    price: r.appointments.price ? Number(r.appointments.price) : null,
    notes: r.appointments.notes,
    checkin_at: r.appointments.checkinAt ? r.appointments.checkinAt.toISOString() : null,
    clients: r.clients ? { first_name: r.clients.firstName, last_name: r.clients.lastName, phone: r.clients.phone } : null,
    pets: r.pets ? { name: r.pets.name, breed: r.pets.breed, species: r.pets.species } : null,
    services: r.services ? { name: r.services.name, duration_minutes: r.services.durationMinutes } : null,
  }));
}

export async function advanceAppointmentStatus(id: string, newStatus: string) {
  const { businessId } = await requireBusiness();
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'in_progress') updates.checkinAt = new Date();
  if (newStatus === 'completed') updates.checkoutAt = new Date();
  await db
    .update(appointments)
    .set(updates)
    .where(and(eq(appointments.id, id), eq(appointments.businessId, businessId)));
  revalidatePath('/dashboard/groomer-app');
}

export async function saveAppointmentNote(id: string, notes: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(appointments)
    .set({ notes })
    .where(and(eq(appointments.id, id), eq(appointments.businessId, businessId)));
  revalidatePath('/dashboard/groomer-app');
}
