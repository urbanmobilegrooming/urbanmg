'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import {
  appointments,
  clients,
  pets,
  services,
  staff,
  clientAgreements,
  agreementTemplates,
  satisfactionSurveys,
  groomingReportCards,
  petPhotos,
} from '@/lib/db/schema';

// ─── CHECK-IN ────────────────────────────────────────────────────────────────

export async function getCheckinAppointment(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      start_time: appointments.startTime,
      status: appointments.status,
      checkin_at: appointments.checkinAt,
      client_first: clients.firstName,
      client_last: clients.lastName,
      client_phone: clients.phone,
      pet_name: pets.name,
      pet_breed: pets.breed,
      pet_species: pets.species,
      service_name: services.name,
      staff_first: staff.firstName,
      staff_last: staff.lastName,
      staff_color: staff.color,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(eq(appointments.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    start_time: row.start_time,
    status: row.status,
    checkin_at: row.checkin_at ? row.checkin_at.toISOString() : null,
    clients: row.client_first
      ? { first_name: row.client_first, last_name: row.client_last, phone: row.client_phone }
      : null,
    pets: row.pet_name
      ? { name: row.pet_name, breed: row.pet_breed, species: row.pet_species }
      : null,
    services: row.service_name ? { name: row.service_name } : null,
    staff: row.staff_first
      ? { first_name: row.staff_first, last_name: row.staff_last, color: row.staff_color }
      : null,
  };
}

export async function checkInAppointment(id: string) {
  await rateLimit('public-checkin', 10, 60_000);
  if (!isUuid(id)) throw new Error('Invalid appointment ID');
  const now = new Date();
  const [current] = await db
    .select({ status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  if (!current) throw new Error('Appointment not found');
  if (['completed', 'cancelled', 'no_show'].includes(current.status)) {
    throw new Error('This appointment is already closed');
  }
  const [row] = await db
    .update(appointments)
    .set({ status: 'in_progress', checkinAt: now, updatedAt: now })
    .where(eq(appointments.id, id))
    .returning();
  if (!row) throw new Error('Appointment not found');
  revalidatePath(`/checkin/${id}`);
  return { checkin_at: now.toISOString() };
}

// ─── SIGN AGREEMENT ──────────────────────────────────────────────────────────

export async function getAgreement(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: clientAgreements.id,
      status: clientAgreements.status,
      signed_at: clientAgreements.signedAt,
      signature_url: clientAgreements.signatureUrl,
      client_first: clients.firstName,
      client_last: clients.lastName,
      template_name: agreementTemplates.name,
      template_body: agreementTemplates.body,
    })
    .from(clientAgreements)
    .leftJoin(clients, eq(clientAgreements.clientId, clients.id))
    .leftJoin(agreementTemplates, eq(clientAgreements.templateId, agreementTemplates.id))
    .where(eq(clientAgreements.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    signed_at: row.signed_at ? row.signed_at.toISOString() : null,
    signature_url: row.signature_url,
    clients: row.client_first ? { first_name: row.client_first, last_name: row.client_last } : null,
    agreement_templates: row.template_name
      ? { name: row.template_name, body: row.template_body }
      : null,
  };
}

export async function signAgreement(id: string, signatureDataUrl: string) {
  await rateLimit('public-sign', 10, 60_000);
  if (!isUuid(id)) throw new Error('Invalid agreement ID');
  if (typeof signatureDataUrl !== 'string' || !signatureDataUrl.startsWith('data:image/')) {
    throw new Error('Invalid signature');
  }
  if (signatureDataUrl.length >= 200_000) {
    throw new Error('Signature too large');
  }
  const now = new Date();
  const [row] = await db
    .update(clientAgreements)
    .set({ status: 'signed', signedAt: now, signatureUrl: signatureDataUrl })
    .where(and(eq(clientAgreements.id, id), ne(clientAgreements.status, 'signed')))
    .returning();
  if (!row) throw new Error('Agreement not found or already signed');
  revalidatePath(`/sign/${id}`);
  return { signed_at: now.toISOString() };
}

// ─── SURVEY ──────────────────────────────────────────────────────────────────

export async function getSurveyAppointment(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      client_id: appointments.clientId,
      client_first: clients.firstName,
      client_last: clients.lastName,
      pet_name: pets.name,
      pet_breed: pets.breed,
      service_name: services.name,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    client_id: row.client_id,
    clients: row.client_first ? { first_name: row.client_first, last_name: row.client_last } : null,
    pets: row.pet_name ? { name: row.pet_name, breed: row.pet_breed } : null,
    services: row.service_name ? { name: row.service_name } : null,
  };
}

export type SurveyInput = {
  overall_rating: number;
  punctuality: number;
  quality: number;
  friendliness: number;
  would_recommend: 'yes' | 'no' | 'maybe';
  comments: string | null;
};

function clampRating(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : 0;
  return Math.max(0, Math.min(5, v));
}

export async function submitSurvey(appointmentId: string, input: SurveyInput) {
  await rateLimit('public-survey', 5, 60_000);
  if (!isUuid(appointmentId)) throw new Error('Invalid appointment ID');
  const [existing] = await db
    .select({ id: satisfactionSurveys.id })
    .from(satisfactionSurveys)
    .where(eq(satisfactionSurveys.appointmentId, appointmentId))
    .limit(1);
  if (existing) throw new Error('A review was already submitted for this appointment');
  if (!['yes', 'no', 'maybe'].includes(input.would_recommend)) {
    throw new Error('Invalid recommendation');
  }
  const comments =
    typeof input.comments === 'string' ? input.comments.slice(0, 1000) : null;

  const [appt] = await db
    .select({ id: appointments.id, clientId: appointments.clientId })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  if (!appt) throw new Error('Appointment not found');
  await db.insert(satisfactionSurveys).values({
    appointmentId,
    clientId: appt.clientId,
    overallRating: clampRating(input.overall_rating),
    rating: clampRating(input.overall_rating),
    punctuality: clampRating(input.punctuality),
    quality: clampRating(input.quality),
    friendliness: clampRating(input.friendliness),
    wouldRecommend: input.would_recommend,
    comments,
  });
  revalidatePath(`/survey/${appointmentId}`);
}

// ─── TRACKING ────────────────────────────────────────────────────────────────

export async function getTrackingAppointment(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      start_time: appointments.startTime,
      status: appointments.status,
      price: appointments.price,
      van: appointments.van,
      address: appointments.address,
      city: appointments.city,
      service_name: services.name,
      pet_name: pets.name,
      client_first: clients.firstName,
      client_last: clients.lastName,
      client_address: clients.address,
      client_city: clients.city,
      staff_first: staff.firstName,
      staff_last: staff.lastName,
      staff_phone: staff.phone,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(eq(appointments.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    date: row.date,
    start_time: row.start_time,
    service_name: row.service_name ?? 'Grooming',
    groomer_name: row.staff_first ? `${row.staff_first} ${row.staff_last ?? ''}`.trim() : '',
    groomer_phone: row.staff_phone ?? '',
    pet_name: row.pet_name ?? 'Your pet',
    client_name: row.client_first ? `${row.client_first} ${row.client_last ?? ''}`.trim() : '',
    address: row.address ?? row.client_address ?? '',
    city: row.city ?? row.client_city ?? 'Miami',
    price: row.price ? Number(row.price) : 0,
    van: row.van ?? '',
  };
}

// ─── REPORT CARD (public) ────────────────────────────────────────────────────

export async function getPublicReportCard(appointmentId: string) {
  if (!isUuid(appointmentId)) return null;
  const [card] = await db
    .select()
    .from(groomingReportCards)
    .where(eq(groomingReportCards.appointmentId, appointmentId))
    .limit(1);

  const [apt] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      start_time: appointments.startTime,
      status: appointments.status,
      pet_id: pets.id,
      pet_name: pets.name,
      pet_species: pets.species,
      pet_breed: pets.breed,
      pet_color: pets.color,
      pet_weight: pets.weightLbs,
      client_id: clients.id,
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
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!apt) return null;

  let photos: Array<{
    id: string;
    photo_url: string;
    photo_type: string;
    caption: string | null;
    created_at: string;
  }> = [];
  if (apt.pet_id) {
    const ph = await db
      .select()
      .from(petPhotos)
      .where(eq(petPhotos.petId, apt.pet_id));
    photos = ph.map((p) => ({
      id: p.id,
      photo_url: p.photoUrl,
      photo_type: p.photoType,
      caption: p.caption,
      created_at: p.createdAt.toISOString(),
    }));
  }

  return {
    reportCard: card
      ? {
          id: card.id,
          appointment_id: card.appointmentId,
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
          created_at: card.createdAt.toISOString(),
        }
      : null,
    appointment: {
      id: apt.id,
      date: apt.date,
      start_time: apt.start_time,
      status: apt.status,
      pets: apt.pet_id
        ? {
            id: apt.pet_id,
            name: apt.pet_name!,
            species: apt.pet_species ?? '',
            breed: apt.pet_breed,
            color: apt.pet_color,
            weight_lbs: apt.pet_weight ? Number(apt.pet_weight) : null,
          }
        : null,
      clients: apt.client_id
        ? {
            id: apt.client_id,
            first_name: apt.client_first!,
            last_name: apt.client_last!,
            phone: apt.client_phone ?? '',
          }
        : null,
      staff: apt.staff_first
        ? { first_name: apt.staff_first, last_name: apt.staff_last ?? '' }
        : null,
      services: apt.service_name ? { name: apt.service_name } : null,
    },
    photos,
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isUuid(s: string | null | undefined): s is string {
  return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
