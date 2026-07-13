'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appointments, clients, leads, notifications, pets, services } from '@/lib/db/schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

// Public booking endpoint - no auth required (used by /book landing page)
export async function createPublicBooking(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string;
  zip?: string | null;
  pet_name: string;
  species?: string;
  breed?: string | null;
  weight?: number;
  service_id: string;
  staff_id?: string | null;
  date: string;
  time: string;
  notes?: string | null;
  price?: number;
}) {
  if (!input.first_name?.trim() || !input.last_name?.trim()) {
    throw new Error('Name required');
  }
  if (!input.pet_name?.trim()) throw new Error('Pet name required');

  const phoneDigits = (input.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 10) throw new Error('Invalid phone number');

  if (input.email && !EMAIL_RE.test(input.email)) {
    throw new Error('Invalid email');
  }
  if (!UUID_RE.test(input.service_id)) {
    throw new Error('Invalid service');
  }
  if (input.staff_id && !UUID_RE.test(input.staff_id)) {
    throw new Error('Invalid staff');
  }
  if (!DATE_RE.test(input.date)) throw new Error('Invalid date');
  if (!TIME_RE.test(input.time)) throw new Error('Invalid time');

  // Look up the service to derive its business — bookings must be tied to
  // the same business as the service they reference.
  const [svc] = await db
    .select()
    .from(services)
    .where(eq(services.id, input.service_id))
    .limit(1);
  if (!svc || !svc.businessId) throw new Error('Service not found');
  const businessId = svc.businessId;

  const [client] = await db
    .insert(clients)
    .values({
      firstName: input.first_name.trim(),
      lastName: input.last_name.trim(),
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
      city: input.city ?? 'Miami',
      state: 'FL',
      zip: input.zip ?? null,
      businessId,
    })
    .returning();

  const [pet] = await db
    .insert(pets)
    .values({
      clientId: client.id,
      name: input.pet_name.trim(),
      species: input.species ?? 'dog',
      breed: input.breed ?? null,
      weightLbs: input.weight != null ? String(input.weight) : null,
      businessId,
    })
    .returning();

  await db.insert(appointments).values({
    clientId: client.id,
    petId: pet.id,
    serviceId: input.service_id,
    staffId: input.staff_id ?? null,
    date: input.date,
    startTime: input.time,
    price: input.price != null ? String(input.price) : null,
    address: input.address ?? null,
    city: input.city ?? 'Miami',
    state: 'FL',
    zip: input.zip ?? null,
    notes: input.notes ?? null,
    businessId,
  });

  await db.insert(leads).values({
    name: `${input.first_name.trim()} ${input.last_name.trim()}`,
    phone: input.phone,
    email: input.email ?? null,
    source: 'booking',
    status: 'converted',
    clientId: client.id,
    businessId,
  });

  await db.insert(notifications).values({
    type: 'booking',
    title: 'New online booking',
    body: `${input.first_name} ${input.last_name} · ${input.pet_name} · ${input.date} ${input.time}`,
    href: '/dashboard/appointments',
    businessId,
  });

  return { ok: true };
}
