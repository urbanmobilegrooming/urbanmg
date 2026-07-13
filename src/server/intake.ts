'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { businesses, clients, intakeSubmissions, leads, notifications, pets } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type IntakePetInput = {
  name: string;
  species?: string;
  breed?: string;
  weight_lbs?: number | null;
  notes?: string;
};

async function defaultBusinessId(): Promise<string | null> {
  const [b] = await db.select({ id: businesses.id }).from(businesses).orderBy(businesses.createdAt).limit(1);
  return b?.id ?? null;
}

// Public — new client intake form (no auth)
export async function submitIntake(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  preferred_contact?: string | null;
  referral_source?: string | null;
  pets: IntakePetInput[];
  notes?: string | null;
}) {
  if (!input.first_name?.trim() || !input.last_name?.trim()) throw new Error('Name required');
  const phoneDigits = (input.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 10) throw new Error('Invalid phone number');
  if (input.email && !EMAIL_RE.test(input.email)) throw new Error('Invalid email');
  const petList = (input.pets ?? []).filter((p) => p.name?.trim()).slice(0, 6);
  if (!petList.length) throw new Error('At least one pet is required');

  const businessId = await defaultBusinessId();

  const [submission] = await db
    .insert(intakeSubmissions)
    .values({
      firstName: input.first_name.trim(),
      lastName: input.last_name.trim(),
      phone: input.phone,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      zip: input.zip?.trim() || null,
      preferredContact: input.preferred_contact ?? null,
      referralSource: input.referral_source ?? null,
      pets: petList,
      notes: input.notes?.trim() || null,
      businessId,
    })
    .returning();

  await db.insert(leads).values({
    name: `${input.first_name.trim()} ${input.last_name.trim()}`,
    phone: input.phone,
    email: input.email?.trim() || null,
    source: 'intake',
    notes: input.referral_source ? `Heard about us via: ${input.referral_source}` : null,
    businessId,
  });

  await db.insert(notifications).values({
    type: 'intake',
    title: 'New client intake',
    body: `${input.first_name} ${input.last_name} · ${petList.map((p) => p.name).join(', ')}`,
    href: '/dashboard/intake',
    businessId,
  });

  return { id: submission.id };
}

export async function listIntakeSubmissions() {
  const { businessId } = await requireBusiness();
  return db
    .select()
    .from(intakeSubmissions)
    .where(eq(intakeSubmissions.businessId, businessId))
    .orderBy(desc(intakeSubmissions.createdAt));
}

/** Aprueba un intake: crea cliente + mascotas y convierte el lead. */
export async function approveIntake(id: string) {
  const { businessId } = await requireBusiness();
  const [sub] = await db
    .select()
    .from(intakeSubmissions)
    .where(eq(intakeSubmissions.id, id))
    .limit(1);
  if (!sub || sub.businessId !== businessId) throw new Error('Not found');
  if (sub.status !== 'pending') throw new Error('Already reviewed');

  const [client] = await db
    .insert(clients)
    .values({
      firstName: sub.firstName,
      lastName: sub.lastName,
      phone: sub.phone,
      email: sub.email,
      address: sub.address,
      city: sub.city,
      state: 'FL',
      zip: sub.zip,
      notes: sub.notes,
      businessId,
    })
    .returning();

  const petList = (sub.pets as IntakePetInput[] | null) ?? [];
  for (const p of petList) {
    if (!p.name?.trim()) continue;
    await db.insert(pets).values({
      name: p.name.trim(),
      species: p.species ?? 'dog',
      breed: p.breed || null,
      weightLbs: p.weight_lbs != null ? String(p.weight_lbs) : null,
      groomingNotes: p.notes || null,
      clientId: client.id,
      businessId,
    });
  }

  await db
    .update(intakeSubmissions)
    .set({ status: 'approved', clientId: client.id, reviewedAt: new Date() })
    .where(eq(intakeSubmissions.id, id));

  if (sub.phone) {
    await db
      .update(leads)
      .set({ status: 'converted', clientId: client.id })
      .where(and(eq(leads.phone, sub.phone), eq(leads.businessId, businessId)));
  }

  revalidatePath('/dashboard/intake');
  revalidatePath('/dashboard/clients');
  return { clientId: client.id };
}

export async function rejectIntake(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(intakeSubmissions)
    .set({ status: 'rejected', reviewedAt: new Date() })
    .where(and(eq(intakeSubmissions.id, id), eq(intakeSubmissions.businessId, businessId)));
  revalidatePath('/dashboard/intake');
}

export async function listLeads() {
  const { businessId } = await requireBusiness();
  return db
    .select()
    .from(leads)
    .where(eq(leads.businessId, businessId))
    .orderBy(desc(leads.createdAt));
}

export async function updateLeadStatus(id: string, status: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(leads)
    .set({ status, lastContactedAt: status === 'contacted' ? new Date() : undefined })
    .where(and(eq(leads.id, id), eq(leads.businessId, businessId)));
  revalidatePath('/dashboard/intake');
}
