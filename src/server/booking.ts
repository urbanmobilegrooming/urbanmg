'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appointments, clients, leads, notifications, pets, servicePricing, services, staff } from '@/lib/db/schema';
import { and } from 'drizzle-orm';
import { clamp, rateLimit } from '@/lib/rate-limit';

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
  try {
    await rateLimit('public-booking', 5, 60_000);
  } catch {
    return { ok: false as const, error: 'Too many requests — please try again in a minute' };
  }

  if (!input.first_name?.trim() || !input.last_name?.trim()) {
    return { ok: false as const, error: 'Name is required' };
  }
  if (!input.pet_name?.trim()) return { ok: false as const, error: 'Pet name is required' };
  if (input.weight != null && (input.weight < 0 || input.weight > 400)) return { ok: false as const, error: 'Invalid weight' };

  const phoneDigits = (input.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return { ok: false as const, error: 'Please enter a valid phone number' };

  if (input.email && !EMAIL_RE.test(input.email)) {
    return { ok: false as const, error: 'Please enter a valid email' };
  }
  if (!UUID_RE.test(input.service_id)) {
    return { ok: false as const, error: 'Invalid service' };
  }
  if (input.staff_id && !UUID_RE.test(input.staff_id)) {
    return { ok: false as const, error: 'Invalid staff' };
  }
  if (!DATE_RE.test(input.date)) return { ok: false as const, error: 'Invalid date' };
  if (!TIME_RE.test(input.time)) return { ok: false as const, error: 'Invalid time' };
  const today = new Date().toISOString().split('T')[0];
  if (input.date < today) return { ok: false as const, error: 'Please pick a date in the future' };

  // Look up the service to derive its business — bookings must be tied to
  // the same business as the service they reference.
  const [svc] = await db
    .select()
    .from(services)
    .where(eq(services.id, input.service_id))
    .limit(1);
  if (!svc || !svc.businessId) return { ok: false as const, error: 'Service not found' };
  const businessId = svc.businessId;

  // el precio nunca se confía del cliente: debe coincidir con el precio base
  // o con alguno de los precios por tamaño del servicio
  const pricingRows = await db
    .select({ price: servicePricing.price })
    .from(servicePricing)
    .where(eq(servicePricing.serviceId, svc.id));
  const allowedPrices = new Set(
    [svc.basePrice, ...pricingRows.map((r) => r.price)]
      .filter((p): p is string => p != null)
      .map((p) => Number(p)),
  );
  const price =
    input.price != null && allowedPrices.has(Number(input.price))
      ? Number(input.price)
      : svc.basePrice != null
        ? Number(svc.basePrice)
        : null;

  if (input.staff_id) {
    const [st] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, input.staff_id), eq(staff.businessId, businessId)))
      .limit(1);
    if (!st) return { ok: false as const, error: 'Invalid staff' };
  }

  // el horario elegido debe ser un slot realmente disponible
  const slots = await getAvailableSlots(input.date, input.service_id, input.staff_id ?? null);
  const chosen = slots.find((sl) => sl.time === input.time.slice(0, 5));
  if (!chosen || !chosen.available) {
    return { ok: false as const, error: 'That time is no longer available — please pick another slot' };
  }

  // reutiliza el cliente si ya existe con ese teléfono (evita duplicados)
  let [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.phone, input.phone), eq(clients.businessId, businessId)))
    .limit(1);
  if (!client) {
    [client] = await db
      .insert(clients)
      .values({
        firstName: clamp(input.first_name, 80)!,
        lastName: clamp(input.last_name, 80)!,
        phone: clamp(input.phone, 25),
        email: clamp(input.email, 120),
        address: clamp(input.address, 200),
        city: clamp(input.city, 80) ?? 'Miami',
        state: 'FL',
        zip: clamp(input.zip, 12),
        businessId,
      })
      .returning();
  }

  // idempotencia: doble submit de la misma reserva no duplica
  const [dupe] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(
      eq(appointments.clientId, client.id),
      eq(appointments.date, input.date),
      eq(appointments.startTime, input.time),
      eq(appointments.businessId, businessId),
    ))
    .limit(1);
  if (dupe) return { ok: true as const };

  // reutiliza la mascota del cliente si coincide por nombre
  const petName = clamp(input.pet_name, 80)!;
  let [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.clientId, client.id), eq(pets.name, petName)))
    .limit(1);
  if (!pet) {
    [pet] = await db
      .insert(pets)
      .values({
        clientId: client.id,
        name: petName,
        species: clamp(input.species, 30) ?? 'dog',
        breed: clamp(input.breed, 80),
        weightLbs: input.weight != null ? String(input.weight) : null,
        businessId,
      })
      .returning();
  }

  await db.insert(appointments).values({
    clientId: client.id,
    petId: pet.id,
    serviceId: input.service_id,
    staffId: input.staff_id ?? null,
    date: input.date,
    startTime: input.time,
    price: price != null ? String(price) : null,
    address: input.address ?? null,
    city: input.city ?? 'Miami',
    state: 'FL',
    zip: input.zip ?? null,
    notes: clamp(input.notes, 2000),
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

  return { ok: true as const };
}

// ─── Disponibilidad pública ───────────────────────────────────────────────────

const OPEN_MIN = 8 * 60; // 8:00
const CLOSE_MIN = 18 * 60; // 18:00
const SLOT_STEP = 30;

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function toTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Slots disponibles para una fecha (público, para /book).
 * Capacidad = groomers activos; si se elige groomer, respeta su horario,
 * bloqueos y citas. Sin groomer, un slot está lleno cuando todos están ocupados.
 */
export async function getAvailableSlots(date: string, serviceId: string, staffId?: string | null) {
  if (!DATE_RE.test(date) || !UUID_RE.test(serviceId)) return [];
  if (staffId && !UUID_RE.test(staffId)) return [];

  const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!svc || !svc.businessId) return [];
  const businessId = svc.businessId;
  const duration = svc.durationMinutes ?? 60;

  const { staffSchedules, staffBlockTimes } = await import('@/lib/db/schema');
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

  const groomers = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)));
  const groomerIds = staffId ? [staffId] : groomers.map((g) => g.id);
  if (!groomerIds.length) groomerIds.push('__none__');

  const dayAppts = await db
    .select({ staffId: appointments.staffId, startTime: appointments.startTime, endTime: appointments.endTime, status: appointments.status })
    .from(appointments)
    .where(and(eq(appointments.businessId, businessId), eq(appointments.date, date)));
  const active = dayAppts.filter((a) => !['cancelled', 'no_show'].includes(a.status));

  const schedules = await db.select().from(staffSchedules).where(eq(staffSchedules.dayOfWeek, dayOfWeek));
  const blocks = await db.select().from(staffBlockTimes).where(eq(staffBlockTimes.date, date));

  const slots: { time: string; available: boolean }[] = [];
  const today = new Date().toISOString().split('T')[0];
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  for (let start = OPEN_MIN; start + duration <= CLOSE_MIN; start += SLOT_STEP) {
    const end = start + duration;
    if (date === today && start <= nowMin + 60) {
      slots.push({ time: toTime(start), available: false });
      continue;
    }

    let freeGroomers = 0;
    for (const gid of groomerIds) {
      // horario declarado del groomer (si tiene alguno para ese día)
      const gSchedules = schedules.filter((sc) => sc.staffId === gid);
      if (gSchedules.length > 0) {
        const within = gSchedules.some(
          (sc) => sc.isAvailable && toMin(sc.startTime) <= start && end <= toMin(sc.endTime),
        );
        if (!within) continue;
      }
      // bloqueos puntuales
      const blocked = blocks.some(
        (b) => b.staffId === gid && toMin(b.startTime) < end && start < toMin(b.endTime),
      );
      if (blocked) continue;
      // citas existentes de ese groomer
      const busy = active.some((a) => {
        if (a.staffId !== gid) return false;
        const aStart = toMin(a.startTime);
        const aEnd = a.endTime ? toMin(a.endTime) : aStart + 60;
        return aStart < end && start < aEnd;
      });
      if (!busy) freeGroomers++;
    }

    // citas sin groomer asignado consumen capacidad general
    const unassignedOverlap = active.filter((a) => {
      if (a.staffId) return false;
      const aStart = toMin(a.startTime);
      const aEnd = a.endTime ? toMin(a.endTime) : aStart + 60;
      return aStart < end && start < aEnd;
    }).length;

    slots.push({ time: toTime(start), available: freeGroomers - unassignedOverlap > 0 });
  }

  return slots;
}
