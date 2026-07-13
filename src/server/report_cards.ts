'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  appointments,
  clients,
  pets,
  services,
  staff,
  groomingReportCards,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type ReportCardInput = {
  coat_condition: number | null;
  skin_health: number | null;
  ear_cleanliness: number | null;
  nail_condition: number | null;
  teeth_health: number | null;
  behavior: number | null;
  services_performed: string[];
  groomer_notes: string | null;
  recommendations: string | null;
  issues_found: string | null;
  next_visit_date: string | null;
};

export async function getReportCardForAppointment(appointmentId: string) {
  const { businessId } = await requireBusiness();
  const [apt] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      start_time: appointments.startTime,
      pet_id: pets.id,
      pet_name: pets.name,
      pet_species: pets.species,
      pet_breed: pets.breed,
      client_first: clients.firstName,
      client_last: clients.lastName,
      client_phone: clients.phone,
      staff_first: staff.firstName,
      staff_last: staff.lastName,
      service_name: services.name,
    })
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.businessId, businessId),
      ),
    )
    .limit(1);

  if (!apt) return null;

  const [card] = await db
    .select()
    .from(groomingReportCards)
    .where(eq(groomingReportCards.appointmentId, appointmentId))
    .limit(1);

  return {
    appointment: {
      id: apt.id,
      date: apt.date,
      start_time: apt.start_time,
      pets: apt.pet_id
        ? { id: apt.pet_id, name: apt.pet_name!, species: apt.pet_species ?? '', breed: apt.pet_breed }
        : null,
      clients: apt.client_first
        ? { first_name: apt.client_first, last_name: apt.client_last ?? '', phone: apt.client_phone ?? '' }
        : null,
      staff: apt.staff_first
        ? { first_name: apt.staff_first, last_name: apt.staff_last ?? '' }
        : null,
      services: apt.service_name ? { name: apt.service_name } : null,
    },
    card: card
      ? {
          id: card.id,
          coat_condition: card.coatCondition,
          skin_health: card.skinHealth,
          ear_cleanliness: card.earCleanliness,
          nail_condition: card.nailCondition,
          teeth_health: card.teethHealth,
          behavior: card.behavior,
          services_performed: (card.servicesPerformed as string[] | null) ?? [],
          groomer_notes: card.groomerNotes,
          recommendations: card.recommendations,
          issues_found: card.issuesFound,
          next_visit_date: card.nextVisitDate,
        }
      : null,
  };
}

export async function saveReportCard(appointmentId: string, input: ReportCardInput) {
  const { businessId } = await requireBusiness();

  const [apt] = await db
    .select({ id: appointments.id, petId: appointments.petId, staffId: appointments.staffId })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.businessId, businessId),
      ),
    )
    .limit(1);
  if (!apt) throw new Error('Appointment not found');

  const [existing] = await db
    .select({ id: groomingReportCards.id })
    .from(groomingReportCards)
    .where(eq(groomingReportCards.appointmentId, appointmentId))
    .limit(1);

  const values = {
    appointmentId,
    petId: apt.petId,
    staffId: apt.staffId,
    coatCondition: input.coat_condition,
    skinHealth: input.skin_health,
    earCleanliness: input.ear_cleanliness,
    nailCondition: input.nail_condition,
    teethHealth: input.teeth_health,
    behavior: input.behavior,
    servicesPerformed: input.services_performed,
    groomerNotes: input.groomer_notes,
    recommendations: input.recommendations,
    issuesFound: input.issues_found,
    nextVisitDate: input.next_visit_date,
  };

  let row;
  if (existing) {
    [row] = await db
      .update(groomingReportCards)
      .set(values)
      .where(eq(groomingReportCards.id, existing.id))
      .returning();
  } else {
    [row] = await db.insert(groomingReportCards).values(values).returning();
  }

  revalidatePath(`/dashboard/appointments/${appointmentId}/report-card`);
  revalidatePath(`/report-card/${appointmentId}`);

  return {
    id: row.id,
    coat_condition: row.coatCondition,
    skin_health: row.skinHealth,
    ear_cleanliness: row.earCleanliness,
    nail_condition: row.nailCondition,
    teeth_health: row.teethHealth,
    behavior: row.behavior,
    services_performed: (row.servicesPerformed as string[] | null) ?? [],
    groomer_notes: row.groomerNotes,
    recommendations: row.recommendations,
    issues_found: row.issuesFound,
    next_visit_date: row.nextVisitDate,
  };
}
