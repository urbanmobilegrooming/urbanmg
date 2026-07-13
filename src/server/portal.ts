'use server';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  appointments,
  clients,
  invoiceItems,
  invoicePayments,
  invoices,
  loyaltyAccounts,
  loyaltyTransactions,
  petMatchProfiles,
  petMatches,
  petVaccines,
  pets,
  services,
  staff,
} from '@/lib/db/schema';
import { requireSession } from '@/lib/auth-server';

type SessionUser = { id: string; email: string; name?: string | null };

async function requireClient() {
  const session = await requireSession();
  const email = session.user.email;
  if (!email) throw new Error('No email on session');
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.email, email), eq(clients.isActive, true)))
    .limit(1);
  if (!client) throw new Error('No client account linked to this user');
  return { session, user: session.user as SessionUser, client };
}

// ──────────────────────────────────────────────────────────────────────────────
// Current client info
// ──────────────────────────────────────────────────────────────────────────────

export async function getCurrentClient() {
  try {
    const { client, user } = await requireClient();
    return {
      id: client.id,
      first_name: client.firstName,
      last_name: client.lastName,
      full_name: `${client.firstName} ${client.lastName}`.trim(),
      email: client.email,
      phone: client.phone,
      city: client.city,
      user_email: user.email,
      user_name: user.name ?? null,
    };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HOME — next appointment + recent activity
// ──────────────────────────────────────────────────────────────────────────────

export async function getNextAppointment() {
  const { client } = await requireClient();
  const today = new Date().toISOString().split('T')[0];
  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clientId, client.id),
        inArray(appointments.status, ['scheduled', 'confirmed', 'pending']),
      )
    )
    .orderBy(appointments.date, appointments.startTime);

  const upcoming = rows.find((r) => r.date >= today);
  if (!upcoming) return null;

  const [pet] = upcoming.petId
    ? await db.select().from(pets).where(eq(pets.id, upcoming.petId)).limit(1)
    : [null];
  const [svc] = upcoming.serviceId
    ? await db.select().from(services).where(eq(services.id, upcoming.serviceId)).limit(1)
    : [null];
  const [st] = upcoming.staffId
    ? await db.select().from(staff).where(eq(staff.id, upcoming.staffId)).limit(1)
    : [null];

  return {
    id: upcoming.id,
    scheduled_date: upcoming.date,
    scheduled_time: upcoming.startTime ?? '',
    service_name: svc?.name ?? 'Grooming',
    pet_name: pet?.name ?? 'Your Pet',
    groomer_name: st ? `${st.firstName} ${st.lastName}`.trim() : '',
    status: upcoming.status,
  };
}

export async function getRecentActivity() {
  const { client } = await requireClient();
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.clientId, client.id))
    .orderBy(desc(appointments.updatedAt))
    .limit(8);

  return rows.map((a) => {
    let type = 'appointment_created';
    let description = 'Appointment scheduled';
    if (a.status === 'completed') {
      type = 'appointment_completed';
      description = 'Appointment completed';
    } else if (a.status === 'cancelled') {
      type = 'appointment_cancelled';
      description = 'Appointment cancelled';
    } else if (a.paymentStatus === 'paid') {
      type = 'payment_received';
      description = 'Payment received';
    }
    return {
      id: a.id,
      type,
      description,
      created_at: a.updatedAt.toISOString(),
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ──────────────────────────────────────────────────────────────────────────────

export async function listMyAppointments() {
  const { client } = await requireClient();
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.clientId, client.id))
    .orderBy(desc(appointments.date), desc(appointments.startTime));

  const petIds = Array.from(new Set(rows.map((r) => r.petId).filter(Boolean) as string[]));
  const svcIds = Array.from(new Set(rows.map((r) => r.serviceId).filter(Boolean) as string[]));
  const stIds = Array.from(new Set(rows.map((r) => r.staffId).filter(Boolean) as string[]));

  const petRows = petIds.length
    ? await db.select().from(pets).where(inArray(pets.id, petIds))
    : [];
  const svcRows = svcIds.length
    ? await db.select().from(services).where(inArray(services.id, svcIds))
    : [];
  const stRows = stIds.length
    ? await db.select().from(staff).where(inArray(staff.id, stIds))
    : [];

  const petMap = new Map(petRows.map((p) => [p.id, p]));
  const svcMap = new Map(svcRows.map((s) => [s.id, s]));
  const stMap = new Map(stRows.map((s) => [s.id, s]));

  return rows.map((a) => {
    const pet = a.petId ? petMap.get(a.petId) : null;
    const svc = a.serviceId ? svcMap.get(a.serviceId) : null;
    const st = a.staffId ? stMap.get(a.staffId) : null;
    return {
      id: a.id,
      scheduled_date: a.date,
      scheduled_time: a.startTime ?? '',
      service_name: svc?.name ?? 'Grooming',
      pet_name: pet?.name ?? 'Pet',
      groomer_name: st ? `${st.firstName} ${st.lastName}`.trim() : '',
      status: a.status ?? 'scheduled',
      notes: a.notes ?? '',
      total: a.price != null ? Number(a.price) : 0,
    };
  });
}

export async function cancelMyAppointment(id: string, reason: string, late: boolean) {
  const { client } = await requireClient();
  const note = `Cancelled by client. Reason: ${reason}${late ? ' [Late cancellation — fee may apply]' : ''}`;
  await db
    .update(appointments)
    .set({ status: 'cancelled', notes: note, updatedAt: new Date() })
    .where(and(eq(appointments.id, id), eq(appointments.clientId, client.id)));
  revalidatePath('/portal/appointments');
  revalidatePath('/portal');
}

export async function rescheduleMyAppointment(id: string, date: string, time: string) {
  const { client } = await requireClient();
  await db
    .update(appointments)
    .set({ date, startTime: time, status: 'scheduled', updatedAt: new Date() })
    .where(and(eq(appointments.id, id), eq(appointments.clientId, client.id)));
  revalidatePath('/portal/appointments');
  revalidatePath('/portal');
}

// ──────────────────────────────────────────────────────────────────────────────
// PETS
// ──────────────────────────────────────────────────────────────────────────────

export type PortalPetInput = {
  name: string;
  species?: string | null;
  breed?: string | null;
  weight?: number | null;
  birthdate?: string | null;
  notes?: string | null;
};

export async function listMyPets() {
  const { client } = await requireClient();
  const petRows = await db
    .select()
    .from(pets)
    .where(and(eq(pets.clientId, client.id), eq(pets.isActive, true)))
    .orderBy(pets.name);

  const petIds = petRows.map((p) => p.id);
  const vaccines = petIds.length
    ? await db.select().from(petVaccines).where(inArray(petVaccines.petId, petIds))
    : [];

  const today = new Date();
  function vaccineStatus(expiry: string | null): 'current' | 'expiring_soon' | 'expired' {
    if (!expiry) return 'current';
    const d = new Date(expiry);
    const days = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring_soon';
    return 'current';
  }

  return petRows.map((p) => ({
    id: p.id,
    name: p.name,
    species: p.species ?? 'Dog',
    breed: p.breed,
    weight: p.weightLbs ? Number(p.weightLbs) : null,
    birthdate: p.dateOfBirth,
    photo_url: null as string | null,
    notes: p.medicalNotes,
    gender: p.gender,
    temperament: p.temperament,
    vaccines: vaccines
      .filter((v) => v.petId === p.id)
      .map((v) => ({
        id: v.id,
        vaccine_name: v.vaccineName,
        administered_date: v.dateGiven,
        expiry_date: v.expiryDate,
        status: vaccineStatus(v.expiryDate),
      })),
  }));
}

export async function createMyPet(input: PortalPetInput) {
  const { client } = await requireClient();
  await db.insert(pets).values({
    clientId: client.id,
    name: input.name.trim(),
    species: input.species ?? 'Dog',
    breed: input.breed ?? null,
    weightLbs: input.weight != null ? String(input.weight) : null,
    dateOfBirth: input.birthdate ?? null,
    medicalNotes: input.notes ?? null,
  });
  revalidatePath('/portal/pets');
}

export async function updateMyPet(id: string, input: PortalPetInput) {
  const { client } = await requireClient();
  await db
    .update(pets)
    .set({
      name: input.name.trim(),
      species: input.species ?? undefined,
      breed: input.breed ?? null,
      weightLbs: input.weight != null ? String(input.weight) : null,
      dateOfBirth: input.birthdate ?? null,
      medicalNotes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(pets.id, id), eq(pets.clientId, client.id)));
  revalidatePath('/portal/pets');
}

// ──────────────────────────────────────────────────────────────────────────────
// INVOICES
// ──────────────────────────────────────────────────────────────────────────────

export async function listMyInvoices() {
  const { client } = await requireClient();
  const invs = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, client.id))
    .orderBy(desc(invoices.createdAt));

  const ids = invs.map((i) => i.id);
  const lines = ids.length
    ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, ids))
    : [];
  const payments = ids.length
    ? await db.select().from(invoicePayments).where(inArray(invoicePayments.invoiceId, ids))
    : [];

  return invs.map((inv) => {
    const total = Number(inv.total);
    const paidAmount = Number(inv.paidAmount);
    let status: 'paid' | 'unpaid' | 'overdue' | 'draft';
    if (inv.status === 'draft') status = 'draft';
    else if (paidAmount >= total && total > 0) status = 'paid';
    else if (inv.dueDate && new Date(inv.dueDate) < new Date()) status = 'overdue';
    else status = 'unpaid';

    return {
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      created_at: inv.createdAt.toISOString(),
      due_date: inv.dueDate,
      status,
      total,
      lines: lines
        .filter((l) => l.invoiceId === inv.id)
        .map((l) => ({
          id: l.id,
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unitPrice),
          total: Number(l.total),
        })),
      payments: payments
        .filter((p) => p.invoiceId === inv.id)
        .map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          payment_date: p.paidAt.toISOString(),
          method: p.paymentMethod,
        })),
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// PET MATCHES
// ──────────────────────────────────────────────────────────────────────────────

export async function listMyPetsForMatch() {
  const { client } = await requireClient();
  const rows = await db
    .select()
    .from(pets)
    .where(and(eq(pets.clientId, client.id), eq(pets.isActive, true)))
    .orderBy(pets.name);
  return rows.map((p) => ({ id: p.id, name: p.name, photo_url: null as string | null }));
}

export async function getMatchProfile(petId: string) {
  const { client } = await requireClient();
  // Ensure the pet belongs to us
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.clientId, client.id)))
    .limit(1);
  if (!pet) return null;

  const [row] = await db
    .select()
    .from(petMatchProfiles)
    .where(eq(petMatchProfiles.petId, petId))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    pet_id: row.petId,
    bio: row.bio ?? '',
    looking_for: (row.lookingFor as 'playmate' | 'date' | 'both') ?? 'playmate',
    is_active: row.isActive,
  };
}

export async function saveMatchProfile(petId: string, input: { bio: string; looking_for: string; is_active: boolean }) {
  const { client } = await requireClient();
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.clientId, client.id)))
    .limit(1);
  if (!pet) throw new Error('Pet not found');

  const [existing] = await db
    .select()
    .from(petMatchProfiles)
    .where(eq(petMatchProfiles.petId, petId))
    .limit(1);

  if (existing) {
    await db
      .update(petMatchProfiles)
      .set({
        bio: input.bio || null,
        lookingFor: input.looking_for,
        isActive: input.is_active,
        updatedAt: new Date(),
      })
      .where(eq(petMatchProfiles.id, existing.id));
  } else {
    await db.insert(petMatchProfiles).values({
      petId,
      bio: input.bio || null,
      lookingFor: input.looking_for,
      isActive: input.is_active,
    });
  }
  revalidatePath('/portal/matches');
}

export async function discoverMatchCards(myPetId: string) {
  const { client } = await requireClient();

  // Verify my pet
  const myPets = await db
    .select()
    .from(pets)
    .where(eq(pets.clientId, client.id));
  const myPetIds = new Set(myPets.map((p) => p.id));
  if (!myPetIds.has(myPetId)) return [];

  // Pets I've acted on
  const acted = await db
    .select()
    .from(petMatches)
    .where(eq(petMatches.petId, myPetId));
  const excludeIds = new Set<string>(acted.map((r) => r.targetPetId));
  myPetIds.forEach((id) => excludeIds.add(id));

  // Active profiles
  const profiles = await db
    .select()
    .from(petMatchProfiles)
    .where(eq(petMatchProfiles.isActive, true));

  const candidatePetIds = profiles
    .map((p) => p.petId)
    .filter((id) => !excludeIds.has(id));
  if (candidatePetIds.length === 0) return [];

  const candPets = await db
    .select()
    .from(pets)
    .where(inArray(pets.id, candidatePetIds));

  const ownerClientIds = Array.from(new Set(candPets.map((p) => p.clientId).filter(Boolean) as string[]));
  const owners = ownerClientIds.length
    ? await db.select().from(clients).where(inArray(clients.id, ownerClientIds))
    : [];
  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const profMap = new Map(profiles.map((p) => [p.petId, p]));

  const cards = candPets.map((p) => {
    const owner = p.clientId ? ownerMap.get(p.clientId) ?? null : null;
    const prof = profMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      breed: p.breed ?? '',
      species: p.species ?? 'Dog',
      weight: p.weightLbs ? Number(p.weightLbs) : null,
      birthdate: p.dateOfBirth,
      photo_url: null as string | null,
      gender: p.gender,
      temperament: p.temperament,
      owner_name: owner ? owner.firstName : 'Owner',
      owner_phone: owner?.phone ?? null,
      owner_neighborhood: owner?.city ?? null,
      bio: prof?.bio ?? null,
      looking_for: (prof?.lookingFor as 'playmate' | 'date' | 'both') ?? 'playmate',
    };
  });

  // Shuffle
  return cards.sort(() => Math.random() - 0.5);
}

export async function recordMatchAction(myPetId: string, targetPetId: string, action: 'like' | 'pass') {
  const { client } = await requireClient();
  // Verify my pet
  const [myPet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, myPetId), eq(pets.clientId, client.id)))
    .limit(1);
  if (!myPet) throw new Error('Pet not found');

  // Upsert (manual since we don't have a unique composite)
  const existing = await db
    .select()
    .from(petMatches)
    .where(and(eq(petMatches.petId, myPetId), eq(petMatches.targetPetId, targetPetId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(petMatches)
      .set({ action })
      .where(eq(petMatches.id, existing[0].id));
  } else {
    await db.insert(petMatches).values({ petId: myPetId, targetPetId, action });
  }

  // Check mutual
  if (action === 'like') {
    const reverse = await db
      .select()
      .from(petMatches)
      .where(
        and(
          eq(petMatches.petId, targetPetId),
          eq(petMatches.targetPetId, myPetId),
          eq(petMatches.action, 'like'),
        )
      )
      .limit(1);
    if (reverse.length > 0) return { matched: true };
  }
  return { matched: false };
}

export async function listMyMutualMatches() {
  const { client } = await requireClient();
  const myPets = await db
    .select()
    .from(pets)
    .where(eq(pets.clientId, client.id));
  const myPetIds = myPets.map((p) => p.id);
  if (myPetIds.length === 0) return [];

  const myLikes = await db
    .select()
    .from(petMatches)
    .where(and(inArray(petMatches.petId, myPetIds), eq(petMatches.action, 'like')));
  if (myLikes.length === 0) return [];

  const likedTargets = myLikes.map((r) => r.targetPetId);
  const reverseLikes = await db
    .select()
    .from(petMatches)
    .where(
      and(
        inArray(petMatches.petId, likedTargets),
        inArray(petMatches.targetPetId, myPetIds),
        eq(petMatches.action, 'like'),
      )
    );
  if (reverseLikes.length === 0) return [];

  // Mutual pet ids = pets that liked me AND I liked
  const mutualPetIds = reverseLikes
    .filter((r) =>
      myLikes.some((ml) => ml.petId === r.targetPetId && ml.targetPetId === r.petId)
    )
    .map((r) => r.petId);
  if (mutualPetIds.length === 0) return [];

  const matchedPets = await db
    .select()
    .from(pets)
    .where(inArray(pets.id, mutualPetIds));

  const ownerIds = Array.from(new Set(matchedPets.map((p) => p.clientId).filter(Boolean) as string[]));
  const owners = ownerIds.length
    ? await db.select().from(clients).where(inArray(clients.id, ownerIds))
    : [];
  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const profiles = await db
    .select()
    .from(petMatchProfiles)
    .where(inArray(petMatchProfiles.petId, mutualPetIds));
  const profMap = new Map(profiles.map((p) => [p.petId, p]));

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return matchedPets.map((p) => {
    const owner = p.clientId ? ownerMap.get(p.clientId) ?? null : null;
    const prof = profMap.get(p.id);
    const reverseMatch = reverseLikes.find((r) => r.petId === p.id);
    const matchedAt = reverseMatch?.createdAt ?? new Date();
    return {
      pet: {
        id: p.id,
        name: p.name,
        breed: p.breed ?? '',
        species: p.species ?? 'Dog',
        weight: p.weightLbs ? Number(p.weightLbs) : null,
        birthdate: p.dateOfBirth,
        photo_url: null as string | null,
        gender: p.gender,
        temperament: p.temperament,
        owner_name: owner ? owner.firstName : 'Owner',
        owner_phone: owner?.phone ?? null,
        owner_neighborhood: owner?.city ?? null,
        bio: prof?.bio ?? null,
        looking_for: (prof?.lookingFor as 'playmate' | 'date' | 'both') ?? 'playmate',
      },
      matched_at: matchedAt.toISOString(),
      is_new: matchedAt.getTime() > sevenDaysAgo,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// LOYALTY
// ──────────────────────────────────────────────────────────────────────────────

export async function getMyLoyalty() {
  const { client } = await requireClient();

  const [account] = await db
    .select()
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.clientId, client.id))
    .limit(1);

  const points = account?.points ?? 0;

  // Build history from transactions table + completed appointments fallback
  const txns = await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.clientId, client.id))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(30);

  let history = txns.map((t) => ({
    id: t.id,
    type: (t.type as 'earned' | 'redeemed' | 'bonus' | 'referral') ?? 'earned',
    points: t.points,
    description: t.description ?? '',
    created_at: t.createdAt.toISOString(),
  }));

  // If no transactions, derive from completed appointments
  if (history.length === 0) {
    const appts = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.clientId, client.id), eq(appointments.status, 'completed')))
      .orderBy(desc(appointments.date))
      .limit(20);

    const svcIds = Array.from(new Set(appts.map((a) => a.serviceId).filter(Boolean) as string[]));
    const svcs = svcIds.length
      ? await db.select().from(services).where(inArray(services.id, svcIds))
      : [];
    const svcMap = new Map(svcs.map((s) => [s.id, s]));

    history = appts.map((a) => {
      const svc = a.serviceId ? svcMap.get(a.serviceId) : null;
      return {
        id: a.id,
        type: 'earned' as const,
        points: Math.round((a.price != null ? Number(a.price) : 0) * 10),
        description: `${svc?.name ?? 'Grooming'} appointment`,
        created_at: a.date + 'T00:00:00.000Z',
      };
    });
  }

  return {
    points,
    referral_code: 'URBAN-' + client.id.slice(0, 6).toUpperCase(),
    history,
  };
}
