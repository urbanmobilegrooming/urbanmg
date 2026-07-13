'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clients, pets } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type ClientInput = {
  first_name: string;
  last_name: string;
  phone?: string | null;
  phone_secondary?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
};

export async function listClients() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.isActive, true)))
    .orderBy(desc(clients.createdAt));

  const petRows = await db.select().from(pets).where(eq(pets.businessId, businessId));
  const petsByClient = new Map<string, typeof petRows>();
  for (const p of petRows) {
    if (!p.clientId) continue;
    const arr = petsByClient.get(p.clientId) ?? [];
    arr.push(p);
    petsByClient.set(p.clientId, arr);
  }

  return rows.map((c) => ({
    ...c,
    first_name: c.firstName,
    last_name: c.lastName,
    phone_secondary: c.phoneSecondary,
    is_active: c.isActive,
    pets: (petsByClient.get(c.id) ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
    })),
  }));
}

export async function getClientWithDetails(id: string) {
  const { businessId } = await requireBusiness();
  const [c] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.id, id),
        eq(clients.businessId, businessId),
        eq(clients.isActive, true),
      ),
    )
    .limit(1);
  if (!c) return null;
  return {
    ...c,
    first_name: c.firstName,
    last_name: c.lastName,
    phone_secondary: c.phoneSecondary,
    is_active: c.isActive,
  };
}

export async function createClient(input: ClientInput) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .insert(clients)
    .values({
      firstName: input.first_name,
      lastName: input.last_name,
      phone: input.phone ?? null,
      phoneSecondary: input.phone_secondary ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      notes: input.notes ?? null,
      businessId,
    })
    .returning();
  revalidatePath('/dashboard/clients');
  return row;
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .update(clients)
    .set({
      firstName: input.first_name,
      lastName: input.last_name,
      phone: input.phone,
      phoneSecondary: input.phone_secondary,
      email: input.email,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)))
    .returning();
  revalidatePath('/dashboard/clients');
  revalidatePath(`/dashboard/clients/${id}`);
  return row;
}

export async function deleteClient(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(clients)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)));
  revalidatePath('/dashboard/clients');
}

export async function getClient(id: string) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.id, id),
        eq(clients.businessId, businessId),
        eq(clients.isActive, true),
      ),
    )
    .limit(1);
  return row ?? null;
}
