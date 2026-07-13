'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { appointments, clients, pets, services } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

const DEFAULT_FREQUENCY_WEEKS = 6;

export type RebookingOpportunity = {
  pet_id: string;
  pet_name: string;
  breed: string | null;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  last_visit: string;
  last_service: string | null;
  last_price: number | null;
  frequency_weeks: number;
  frequency_source: 'set' | 'inferred' | 'default';
  due_date: string;
  days_overdue: number; // negativo = aún no vence
};

/**
 * Detecta mascotas que ya deberían haber vuelto según su frecuencia de grooming
 * (declarada en el pet, inferida del historial, o 6 semanas por defecto).
 */
export async function listRebookingOpportunities(): Promise<RebookingOpportunity[]> {
  const { businessId } = await requireBusiness();

  const rows = await db
    .select({
      apt_id: appointments.id,
      date: appointments.date,
      status: appointments.status,
      price: appointments.price,
      pet_id: pets.id,
      pet_name: pets.name,
      breed: pets.breed,
      pet_active: pets.isActive,
      frequency: pets.groomingFrequencyWeeks,
      client_id: clients.id,
      client_first: clients.firstName,
      client_last: clients.lastName,
      client_phone: clients.phone,
      client_active: clients.isActive,
      service_name: services.name,
    })
    .from(appointments)
    .innerJoin(pets, eq(appointments.petId, pets.id))
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(eq(appointments.businessId, businessId), eq(appointments.status, 'completed')));

  // agrupa historial completado por mascota
  const byPet = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!r.pet_active || !r.client_active) continue;
    const list = byPet.get(r.pet_id) ?? [];
    list.push(r);
    byPet.set(r.pet_id, list);
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const out: RebookingOpportunity[] = [];

  for (const [petId, visits] of byPet) {
    visits.sort((a, b) => a.date.localeCompare(b.date));
    const last = visits[visits.length - 1];

    // ya tiene una cita futura → no es oportunidad
    // (se resuelve abajo con una sola consulta extra por lote)

    let freq = last.frequency ?? 0;
    let source: RebookingOpportunity['frequency_source'] = 'set';
    if (!freq) {
      if (visits.length >= 2) {
        const gaps: number[] = [];
        for (let i = 1; i < visits.length; i++) {
          const gapDays =
            (new Date(visits[i].date).getTime() - new Date(visits[i - 1].date).getTime()) / 86400000;
          if (gapDays > 7 && gapDays < 180) gaps.push(gapDays);
        }
        if (gaps.length) {
          freq = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length / 7);
          source = 'inferred';
        }
      }
      if (!freq) {
        freq = DEFAULT_FREQUENCY_WEEKS;
        source = 'default';
      }
    }

    const due = new Date(last.date + 'T00:00:00');
    due.setDate(due.getDate() + freq * 7);
    const dueStr = due.toISOString().split('T')[0];
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);

    // solo mascotas vencidas o por vencer en los próximos 7 días
    if (daysOverdue < -7) continue;

    out.push({
      pet_id: petId,
      pet_name: last.pet_name,
      breed: last.breed,
      client_id: last.client_id,
      client_name: `${last.client_first} ${last.client_last}`.trim(),
      client_phone: last.client_phone,
      last_visit: last.date,
      last_service: last.service_name,
      last_price: last.price ? Number(last.price) : null,
      frequency_weeks: freq,
      frequency_source: source,
      due_date: dueStr,
      days_overdue: daysOverdue,
    });
  }

  // descarta mascotas que ya tienen cita futura agendada
  const futureRows = await db
    .select({ pet_id: appointments.petId, date: appointments.date, status: appointments.status })
    .from(appointments)
    .where(eq(appointments.businessId, businessId));
  const hasFuture = new Set(
    futureRows
      .filter((f) => f.pet_id && f.date >= todayStr && !['cancelled', 'no_show', 'completed'].includes(f.status))
      .map((f) => f.pet_id as string),
  );

  return out
    .filter((o) => !hasFuture.has(o.pet_id))
    .sort((a, b) => b.days_overdue - a.days_overdue);
}

export async function setPetFrequency(petId: string, weeks: number | null) {
  const { businessId } = await requireBusiness();
  await db
    .update(pets)
    .set({ groomingFrequencyWeeks: weeks })
    .where(and(eq(pets.id, petId), eq(pets.businessId, businessId)));
  revalidatePath('/dashboard/rebooking');
}
