'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { businesses, clients, intakeSubmissions, leads, notifications, pets } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';
import { clamp, rateLimit } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type IntakePetInput = {
  name: string;
  species?: string;
  breed?: string;
  weight_lbs?: number | null;
  notes?: string;
};

async function defaultBusinessId(): Promise<string> {
  const [b] = await db.select({ id: businesses.id }).from(businesses).orderBy(businesses.createdAt).limit(1);
  if (!b) throw new Error('Business not configured');
  return b.id;
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
  try {
    await rateLimit('public-intake', 5, 60_000);
  } catch {
    return { ok: false as const, error: 'Too many requests — please try again in a minute' };
  }

  if (!input.first_name?.trim() || !input.last_name?.trim()) return { ok: false as const, error: 'Name is required' };
  const phoneDigits = (input.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return { ok: false as const, error: 'Please enter a valid phone number' };
  if (input.email && !EMAIL_RE.test(input.email)) return { ok: false as const, error: 'Please enter a valid email' };
  const petList = (input.pets ?? [])
    .filter((p) => p.name?.trim())
    .slice(0, 6)
    .map((p) => ({
      name: clamp(p.name, 80)!,
      species: clamp(p.species, 30) ?? 'dog',
      breed: clamp(p.breed, 80) ?? undefined,
      weight_lbs: p.weight_lbs != null && p.weight_lbs >= 0 && p.weight_lbs <= 400 ? p.weight_lbs : null,
      notes: clamp(p.notes, 500) ?? undefined,
    }));
  if (!petList.length) return { ok: false as const, error: 'Please add at least one pet with a name' };

  const businessId = await defaultBusinessId();

  const [submission] = await db
    .insert(intakeSubmissions)
    .values({
      firstName: clamp(input.first_name, 80)!,
      lastName: clamp(input.last_name, 80)!,
      phone: clamp(input.phone, 25),
      email: clamp(input.email, 120),
      address: clamp(input.address, 200),
      city: clamp(input.city, 80),
      zip: clamp(input.zip, 12),
      preferredContact: clamp(input.preferred_contact, 20),
      referralSource: clamp(input.referral_source, 40),
      pets: petList,
      notes: clamp(input.notes, 2000),
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

  return { ok: true as const, id: submission.id };
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
