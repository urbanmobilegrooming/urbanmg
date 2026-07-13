'use server';

import { and, desc, eq, gte, inArray, lte, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  appointmentServices,
  appointments,
  clients,
  pets,
  services,
  staff,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type AppointmentInput = {
  client_id?: string | null;
  pet_id?: string | null;
  service_id?: string | null;
  staff_id?: string | null;
  van?: string | null;
  date: string;
  start_time: string;
  end_time?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  notes?: string | null;
  status?: string;
};

type AptRow = typeof appointments.$inferSelect;
type ClientRow = typeof clients.$inferSelect;
type PetRow = typeof pets.$inferSelect;
type ServiceRow = typeof services.$inferSelect;
type StaffRow = typeof staff.$inferSelect;

function aptToApi(
  a: AptRow,
  c: ClientRow | null,
  p: PetRow | null,
  s: ServiceRow | null,
  st: StaffRow | null
) {
  return {
    id: a.id,
    date: a.date,
    start_time: a.startTime,
    end_time: a.endTime,
    status: a.status,
    van: a.van,
    price: a.price != null ? Number(a.price) : null,
    notes: a.notes,
    address: a.address,
    city: a.city,
    state: a.state,
    zip: a.zip,
    payment_status: a.paymentStatus,
    payment_method: a.paymentMethod,
    checkin_at: a.checkinAt,
    checkout_at: a.checkoutAt,
    client_id: a.clientId,
    pet_id: a.petId,
    service_id: a.serviceId,
    staff_id: a.staffId,
    clients: c
      ? {
          id: c.id,
          first_name: c.firstName,
          last_name: c.lastName,
          phone: c.phone,
        }
      : null,
    pets: p
      ? { id: p.id, name: p.name, species: p.species, breed: p.breed }
      : null,
    services: s
      ? { id: s.id, name: s.name, duration_minutes: s.durationMinutes }
      : null,
    staff: st
      ? {
          id: st.id,
          first_name: st.firstName,
          last_name: st.lastName,
          color: st.color,
          commission_rate: st.commissionRate != null ? Number(st.commissionRate) : 0,
        }
      : null,
  };
}

export async function listAppointments(limit = 100) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(eq(appointments.businessId, businessId))
    .orderBy(desc(appointments.date), appointments.startTime)
    .limit(limit);
  return rows.map((r) =>
    aptToApi(r.appointments, r.clients, r.pets, r.services, r.staff)
  );
}

export async function listAppointmentsForClient(clientId: string) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.clientId, clientId),
      ),
    )
    .orderBy(desc(appointments.date));
  return rows.map((r) =>
    aptToApi(r.appointments, null, r.pets, r.services, r.staff)
  );
}

export async function listAppointmentsForPet(petId: string, limit = 30) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.petId, petId),
      ),
    )
    .orderBy(desc(appointments.date))
    .limit(limit);
  return rows.map((r) => aptToApi(r.appointments, null, null, r.services, r.staff));
}

export async function listAppointmentsForDate(date: string) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.date, date),
        ne(appointments.status, 'cancelled'),
      ),
    )
    .orderBy(appointments.startTime);
  return rows.map((r) =>
    aptToApi(r.appointments, r.clients, r.pets, r.services, r.staff)
  );
}

export async function listAppointmentsForRange(
  from: string,
  to: string,
  opts: { status?: string } = {}
) {
  const { businessId } = await requireBusiness();
  const cond = opts.status
    ? and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, from),
        lte(appointments.date, to),
        eq(appointments.status, opts.status)
      )
    : and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, from),
        lte(appointments.date, to),
      );
  const rows = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(cond)
    .orderBy(appointments.date);
  return rows.map((r) =>
    aptToApi(r.appointments, r.clients, r.pets, r.services, r.staff)
  );
}

const VALID_STATUSES = ['scheduled', 'confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'];

function endOf(start: string, end: string | null): number {
  const [h, m] = start.split(':').map(Number);
  if (end) {
    const [eh, em] = end.split(':').map(Number);
    return eh * 60 + em;
  }
  return h * 60 + m + 60; // sin end_time se asume 1h
}

function startOf(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function createAppointment(input: AppointmentInput) {
  const { businessId } = await requireBusiness();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Invalid date');
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.start_time)) throw new Error('Invalid time');
  if (input.price != null && (input.price < 0 || input.price > 100000)) throw new Error('Invalid price');
  if (input.status && !VALID_STATUSES.includes(input.status)) throw new Error('Invalid status');

  // evita doble booking del mismo groomer o van en horarios que se solapan
  if (input.staff_id || input.van) {
    const sameDay = await db
      .select({ id: appointments.id, staffId: appointments.staffId, van: appointments.van, startTime: appointments.startTime, endTime: appointments.endTime, status: appointments.status })
      .from(appointments)
      .where(and(eq(appointments.businessId, businessId), eq(appointments.date, input.date)));
    const newStart = startOf(input.start_time);
    const newEnd = endOf(input.start_time, input.end_time ?? null);
    for (const a of sameDay) {
      if (['cancelled', 'no_show', 'completed'].includes(a.status)) continue;
      const overlap = startOf(a.startTime) < newEnd && newStart < endOf(a.startTime, a.endTime);
      if (!overlap) continue;
      if (input.staff_id && a.staffId === input.staff_id) {
        throw new Error('This groomer already has an appointment at that time');
      }
      if (input.van && a.van === input.van) {
        throw new Error('This van is already booked at that time');
      }
    }
  }

  const [row] = await db
    .insert(appointments)
    .values({
      clientId: input.client_id ?? null,
      petId: input.pet_id ?? null,
      serviceId: input.service_id ?? null,
      staffId: input.staff_id ?? null,
      van: input.van ?? null,
      date: input.date,
      startTime: input.start_time,
      endTime: input.end_time ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      price: input.price != null ? String(input.price) : null,
      notes: input.notes ?? null,
      status: input.status ?? 'scheduled',
      businessId,
    })
    .returning();
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/routes');
  return row;
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { businessId } = await requireBusiness();
  if (!VALID_STATUSES.includes(status)) throw new Error('Invalid status');
  const updates: Partial<typeof appointments.$inferInsert> = { status, updatedAt: new Date() };
  if (status === 'in_progress') updates.checkinAt = new Date();
  if (status === 'completed') updates.checkoutAt = new Date();
  await db
    .update(appointments)
    .set(updates)
    .where(
      and(eq(appointments.id, id), eq(appointments.businessId, businessId)),
    );
  // mantiene las líneas de servicio en sincronía con la cita
  if (['completed', 'cancelled', 'no_show'].includes(status)) {
    await db
      .update(appointmentServices)
      .set({ status })
      .where(eq(appointmentServices.appointmentId, id));
  }
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/routes');
}

export async function updateAppointmentPayment(
  id: string,
  payment_status: string,
  payment_method: string | null
) {
  const { businessId } = await requireBusiness();
  await db
    .update(appointments)
    .set({ paymentStatus: payment_status, paymentMethod: payment_method, updatedAt: new Date() })
    .where(
      and(eq(appointments.id, id), eq(appointments.businessId, businessId)),
    );
  revalidatePath('/dashboard/billing');
  revalidatePath('/dashboard/appointments');
}

export async function cancelAppointment(id: string) {
  await updateAppointmentStatus(id, 'cancelled');
}

// ----- appointment_services -----

export type AppointmentServiceInput = {
  appointment_id: string;
  pet_id?: string | null;
  service_id?: string | null;
  staff_id?: string | null;
  price: number;
  duration_minutes?: number | null;
  sort_order?: number;
};

export async function listAppointmentServicesForIds(aptIds: string[]) {
  const { businessId } = await requireBusiness();
  if (!aptIds.length) return [];

  // Filter aptIds to only those owned by this business
  const ownedApts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        inArray(appointments.id, aptIds),
        eq(appointments.businessId, businessId),
      ),
    );
  const ownedIds = ownedApts.map((a) => a.id);
  if (!ownedIds.length) return [];

  const rows = await db
    .select()
    .from(appointmentServices)
    .leftJoin(services, eq(appointmentServices.serviceId, services.id))
    .where(inArray(appointmentServices.appointmentId, ownedIds))
    .orderBy(appointmentServices.sortOrder);
  return rows.map((r) => ({
    id: r.appointment_services.id,
    appointment_id: r.appointment_services.appointmentId,
    pet_id: r.appointment_services.petId,
    service_id: r.appointment_services.serviceId,
    staff_id: r.appointment_services.staffId,
    price: Number(r.appointment_services.price),
    duration_minutes: r.appointment_services.durationMinutes,
    status: r.appointment_services.status,
    notes: r.appointment_services.notes,
    sort_order: r.appointment_services.sortOrder,
    services: r.services ? { name: r.services.name } : null,
  }));
}

export async function createAppointmentServices(rows: AppointmentServiceInput[]) {
  const { businessId } = await requireBusiness();
  if (!rows.length) return;

  // Verify all appointment IDs belong to this business
  const aptIds = Array.from(new Set(rows.map((r) => r.appointment_id)));
  const ownedApts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        inArray(appointments.id, aptIds),
        eq(appointments.businessId, businessId),
      ),
    );
  const ownedSet = new Set(ownedApts.map((a) => a.id));
  const filtered = rows.filter((r) => ownedSet.has(r.appointment_id));
  if (!filtered.length) return;

  await db.insert(appointmentServices).values(
    filtered.map((r) => ({
      appointmentId: r.appointment_id,
      petId: r.pet_id ?? null,
      serviceId: r.service_id ?? null,
      staffId: r.staff_id ?? null,
      price: String(r.price),
      durationMinutes: r.duration_minutes ?? null,
      sortOrder: r.sort_order ?? 0,
    }))
  );
  revalidatePath('/dashboard/appointments');
}
