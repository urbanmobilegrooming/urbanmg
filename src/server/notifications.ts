'use server';

import { and, eq, gte, lt, lte, ne, count, isNotNull, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appointments, clients, petVaccines, pets, waitList } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function getNotificationsSummary() {
  const { businessId } = await requireBusiness();
  const today = new Date().toISOString().split('T')[0];
  const weekDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // pet_vaccines has no businessId; restrict via pets
  const businessPets = await db
    .select({ id: pets.id })
    .from(pets)
    .where(eq(pets.businessId, businessId));
  const petIds = businessPets.map((p) => p.id);

  const vaccineRows = petIds.length
    ? await db
        .select()
        .from(petVaccines)
        .leftJoin(pets, eq(petVaccines.petId, pets.id))
        .where(
          and(
            inArray(petVaccines.petId, petIds),
            isNotNull(petVaccines.expiryDate),
            lt(petVaccines.expiryDate, today),
          ),
        )
        .limit(500)
    : [];

  const apptRows = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, today),
        lte(appointments.date, weekDate),
        ne(appointments.status, 'cancelled'),
      ),
    )
    .orderBy(appointments.date)
    .limit(10);

  const [waitlist] = await db
    .select({ value: count() })
    .from(waitList)
    .where(and(eq(waitList.businessId, businessId), eq(waitList.status, 'waiting')));

  return {
    vaccineAlerts: vaccineRows.map((r) => ({
      id: r.pet_vaccines.id,
      pet_name: r.pets?.name ?? 'Unknown',
      vaccine_name: r.pet_vaccines.vaccineName,
    })),
    upcomingAppts: apptRows.map((r) => ({
      id: r.appointments.id,
      client_name: r.clients ? `${r.clients.firstName} ${r.clients.lastName}` : 'Unknown',
      date: r.appointments.date,
      time: r.appointments.startTime?.slice(0, 5) ?? '',
      status: r.appointments.status,
    })),
    waitlistCount: Number(waitlist?.value ?? 0),
  };
}
