'use server';

import { randomBytes } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { appointments, clients, pets, services, staff, trackingSessions, vans } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

const AVG_SPEED_KMH = 32; // promedio urbano Miami

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function etaMinutes(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const km = haversineKm(fromLat, fromLng, toLat, toLng);
  // factor 1.3 por calles vs línea recta
  return Math.max(1, Math.round(((km * 1.3) / AVG_SPEED_KMH) * 60));
}

async function geocodeAddress(address: string, city: string | null): Promise<{ lat: number; lng: number } | null> {
  const full = `${address}, ${city ?? 'Miami'}, FL, USA`;
  const googleKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(full)}&key=${googleKey}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const data = (await res.json()) as { results?: { geometry: { location: { lat: number; lng: number } } }[] };
        const loc = data.results?.[0]?.geometry?.location;
        if (loc) return { lat: loc.lat, lng: loc.lng };
      }
    } catch {
      /* cae a Nominatim */
    }
  }

  try {
    const q = encodeURIComponent(full);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'UrbanMG/1.0 (urbanmobilegrooming.com)' }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/** Inicia (o reutiliza) la sesión de tracking de una cita y devuelve el token para compartir. */
export async function startTracking(appointmentId: string) {
  const { businessId } = await requireBusiness();

  const [apt] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, businessId)))
    .limit(1);
  if (!apt) throw new Error('Appointment not found');
  // nunca retroceder una cita que ya llegó / está en servicio / terminó
  if (['arrived', 'in_progress', 'grooming', 'completed', 'cancelled', 'no_show'].includes(apt.status)) {
    throw new Error('Appointment already past the on-the-way stage');
  }

  const [existing] = await db
    .select()
    .from(trackingSessions)
    .where(and(eq(trackingSessions.appointmentId, appointmentId), eq(trackingSessions.status, 'active')))
    .orderBy(desc(trackingSessions.startedAt))
    .limit(1);
  if (existing) return { token: existing.shareToken, sessionId: existing.id };

  let dest: { lat: number; lng: number } | null = null;
  const [client] = apt.clientId
    ? await db.select().from(clients).where(eq(clients.id, apt.clientId)).limit(1)
    : [];
  const address = apt.address ?? client?.address;
  if (address) dest = await geocodeAddress(address, apt.city ?? client?.city ?? null);

  const token = randomBytes(12).toString('base64url');
  const [session] = await db
    .insert(trackingSessions)
    .values({
      appointmentId,
      staffId: apt.staffId,
      shareToken: token,
      destinationLat: dest ? String(dest.lat) : null,
      destinationLng: dest ? String(dest.lng) : null,
      businessId,
    })
    .returning();

  await db
    .update(appointments)
    .set({ status: 'on_the_way' })
    .where(eq(appointments.id, appointmentId));

  revalidatePath('/dashboard/groomer-app');
  return { token: session.shareToken, sessionId: session.id };
}

/** Recibe la posición GPS del groomer y actualiza sesión + van asignado. */
export async function updateTrackingPosition(sessionId: string, lat: number, lng: number) {
  const { businessId } = await requireBusiness();

  const [session] = await db
    .select()
    .from(trackingSessions)
    .where(and(eq(trackingSessions.id, sessionId), eq(trackingSessions.businessId, businessId)))
    .limit(1);
  if (!session || session.status !== 'active') return null;

  let eta: number | null = null;
  if (session.destinationLat && session.destinationLng) {
    eta = etaMinutes(lat, lng, Number(session.destinationLat), Number(session.destinationLng));
  }

  await db
    .update(trackingSessions)
    .set({ lastLat: String(lat), lastLng: String(lng), lastPingAt: new Date(), etaMinutes: eta })
    .where(eq(trackingSessions.id, sessionId));

  // refleja también la posición en el van de la cita
  const [apt] = await db
    .select({ van: appointments.van })
    .from(appointments)
    .where(eq(appointments.id, session.appointmentId))
    .limit(1);
  if (apt?.van) {
    await db
      .update(vans)
      .set({ lastLat: String(lat), lastLng: String(lng), lastUpdated: new Date() })
      .where(and(eq(vans.name, apt.van), eq(vans.businessId, businessId)));
  }

  return { etaMinutes: eta };
}

/** Cierra la sesión de tracking (llegada o fin del servicio). */
export async function endTracking(appointmentId: string, finalStatus: 'arrived' | 'completed' = 'arrived') {
  const { businessId } = await requireBusiness();
  await db
    .update(trackingSessions)
    .set({ status: 'ended', endedAt: new Date() })
    .where(and(eq(trackingSessions.appointmentId, appointmentId), eq(trackingSessions.businessId, businessId), eq(trackingSessions.status, 'active')));
  await db
    .update(appointments)
    .set({ status: finalStatus })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, businessId)));
  revalidatePath('/dashboard/groomer-app');
}

export type PublicTracking = {
  status: string;
  appointment_status: string;
  eta_minutes: number | null;
  van_lat: number | null;
  van_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  last_ping_at: string | null;
  date: string;
  start_time: string;
  pet_name: string;
  client_first: string;
  groomer_name: string;
  service_name: string;
  address: string;
  city: string;
  van: string;
};

/** Vista pública por token compartible — sin auth. */
export async function getTrackingByToken(token: string): Promise<PublicTracking | null> {
  if (!token || token.length > 64) return null;
  const [row] = await db
    .select({
      session: trackingSessions,
      apt_status: appointments.status,
      date: appointments.date,
      start_time: appointments.startTime,
      address: appointments.address,
      city: appointments.city,
      van: appointments.van,
      pet_name: pets.name,
      client_first: clients.firstName,
      client_address: clients.address,
      client_city: clients.city,
      staff_first: staff.firstName,
      staff_last: staff.lastName,
      service_name: services.name,
    })
    .from(trackingSessions)
    .innerJoin(appointments, eq(trackingSessions.appointmentId, appointments.id))
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(eq(trackingSessions.shareToken, token))
    .limit(1);
  if (!row) return null;

  return {
    status: row.session.status,
    appointment_status: row.apt_status,
    eta_minutes: row.session.etaMinutes,
    van_lat: row.session.lastLat ? Number(row.session.lastLat) : null,
    van_lng: row.session.lastLng ? Number(row.session.lastLng) : null,
    dest_lat: row.session.destinationLat ? Number(row.session.destinationLat) : null,
    dest_lng: row.session.destinationLng ? Number(row.session.destinationLng) : null,
    last_ping_at: row.session.lastPingAt ? row.session.lastPingAt.toISOString() : null,
    date: row.date,
    start_time: row.start_time,
    pet_name: row.pet_name ?? 'Your pet',
    client_first: row.client_first ?? '',
    groomer_name: row.staff_first ? `${row.staff_first} ${row.staff_last ?? ''}`.trim() : '',
    service_name: row.service_name ?? 'Grooming',
    address: row.address ?? row.client_address ?? '',
    city: row.city ?? row.client_city ?? 'Miami',
    van: row.van ?? '',
  };
}
