'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { petMedications, petPhotos, pets, petVaccines, petVetInfo } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type PetInput = {
  client_id?: string | null;
  name: string;
  species?: string | null;
  breed?: string | null;
  color?: string | null;
  weight_lbs?: number | null;
  date_of_birth?: string | null;
  gender?: string | null;
  is_neutered?: boolean | null;
  temperament?: string | null;
  grooming_notes?: string | null;
  medical_notes?: string | null;
};

const toApi = (p: typeof pets.$inferSelect) => ({
  ...p,
  client_id: p.clientId,
  weight_lbs: p.weightLbs ? Number(p.weightLbs) : null,
  date_of_birth: p.dateOfBirth,
  is_neutered: p.isNeutered,
  is_active: p.isActive,
  grooming_notes: p.groomingNotes,
  medical_notes: p.medicalNotes,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

async function petBelongsToBusiness(petId: string, businessId: string) {
  const [p] = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.businessId, businessId)))
    .limit(1);
  return !!p;
}

export async function listPets() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(pets)
    .where(and(eq(pets.businessId, businessId), eq(pets.isActive, true)))
    .orderBy(pets.name);
  return rows.map(toApi);
}

export async function listPetsByClient(clientId: string) {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(pets)
    .where(
      and(
        eq(pets.businessId, businessId),
        eq(pets.clientId, clientId),
        eq(pets.isActive, true),
      ),
    )
    .orderBy(desc(pets.createdAt));
  return rows.map(toApi);
}

export async function getPet(id: string) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, id), eq(pets.businessId, businessId)))
    .limit(1);
  return row ? toApi(row) : null;
}

export async function createPet(input: PetInput) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .insert(pets)
    .values({
      clientId: input.client_id ?? null,
      name: input.name,
      species: input.species ?? null,
      breed: input.breed ?? null,
      color: input.color ?? null,
      weightLbs: input.weight_lbs != null ? String(input.weight_lbs) : null,
      dateOfBirth: input.date_of_birth ?? null,
      gender: input.gender ?? null,
      isNeutered: input.is_neutered ?? false,
      temperament: input.temperament ?? null,
      groomingNotes: input.grooming_notes ?? null,
      medicalNotes: input.medical_notes ?? null,
      businessId,
    })
    .returning();
  if (input.client_id) revalidatePath(`/dashboard/clients/${input.client_id}`);
  revalidatePath('/dashboard/pets');
  return toApi(row);
}

export async function updatePet(id: string, input: Partial<PetInput>) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .update(pets)
    .set({
      clientId: input.client_id ?? undefined,
      name: input.name,
      species: input.species,
      breed: input.breed,
      color: input.color,
      weightLbs: input.weight_lbs != null ? String(input.weight_lbs) : undefined,
      dateOfBirth: input.date_of_birth,
      gender: input.gender,
      isNeutered: input.is_neutered ?? undefined,
      temperament: input.temperament,
      groomingNotes: input.grooming_notes,
      medicalNotes: input.medical_notes,
      updatedAt: new Date(),
    })
    .where(and(eq(pets.id, id), eq(pets.businessId, businessId)))
    .returning();
  revalidatePath('/dashboard/pets');
  revalidatePath(`/dashboard/pets/${id}`);
  if (row?.clientId) revalidatePath(`/dashboard/clients/${row.clientId}`);
  return toApi(row);
}

export async function deletePet(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(pets)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(pets.id, id), eq(pets.businessId, businessId)));
  revalidatePath('/dashboard/pets');
}

// ----- Pet vaccines -----
export type VaccineInput = {
  vaccine_name: string;
  date_given?: string | null;
  expiry_date?: string | null;
  vet_name?: string | null;
  notes?: string | null;
};

export async function listVaccines(petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) return [];
  const rows = await db
    .select()
    .from(petVaccines)
    .where(eq(petVaccines.petId, petId))
    .orderBy(desc(petVaccines.expiryDate));
  return rows.map((v) => ({
    ...v,
    pet_id: v.petId,
    vaccine_name: v.vaccineName,
    date_given: v.dateGiven,
    expiry_date: v.expiryDate,
    vet_name: v.vetName,
  }));
}

export async function addVaccine(petId: string, input: VaccineInput) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) {
    throw new Error('Pet not found');
  }
  await db.insert(petVaccines).values({
    petId,
    vaccineName: input.vaccine_name,
    dateGiven: input.date_given ?? null,
    expiryDate: input.expiry_date ?? null,
    vetName: input.vet_name ?? null,
    notes: input.notes ?? null,
  });
  revalidatePath(`/dashboard/pets/${petId}`);
}

export async function deleteVaccine(id: string, petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) {
    throw new Error('Pet not found');
  }
  await db
    .delete(petVaccines)
    .where(and(eq(petVaccines.id, id), eq(petVaccines.petId, petId)));
  revalidatePath(`/dashboard/pets/${petId}`);
}

// ----- Pet photos -----
export type PhotoInput = {
  photo_url: string;
  photo_type?: string;
  caption?: string | null;
};

export async function listPhotos(petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) return [];
  const rows = await db
    .select()
    .from(petPhotos)
    .where(eq(petPhotos.petId, petId))
    .orderBy(desc(petPhotos.createdAt));
  return rows.map((p) => ({
    ...p,
    pet_id: p.petId,
    photo_url: p.photoUrl,
    photo_type: p.photoType,
    created_at: p.createdAt,
  }));
}

export async function addPhoto(petId: string, input: PhotoInput) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) {
    throw new Error('Pet not found');
  }
  await db.insert(petPhotos).values({
    petId,
    photoUrl: input.photo_url,
    photoType: input.photo_type ?? 'general',
    caption: input.caption ?? null,
  });
  revalidatePath(`/dashboard/pets/${petId}`);
}

export async function deletePhoto(id: string, petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) {
    throw new Error('Pet not found');
  }
  await db
    .delete(petPhotos)
    .where(and(eq(petPhotos.id, id), eq(petPhotos.petId, petId)));
  revalidatePath(`/dashboard/pets/${petId}`);
}

// ----- Pet medications -----
export type MedicationInput = {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  notes?: string | null;
};

export async function listMedications(petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) return [];
  const rows = await db
    .select()
    .from(petMedications)
    .where(and(eq(petMedications.petId, petId), eq(petMedications.isActive, true)))
    .orderBy(desc(petMedications.createdAt));
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    frequency: m.frequency,
    notes: m.notes,
  }));
}

export async function addMedication(petId: string, input: MedicationInput) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) throw new Error('Pet not found');
  if (!input.name?.trim()) throw new Error('Name required');
  await db.insert(petMedications).values({
    petId,
    name: input.name.trim(),
    dosage: input.dosage ?? null,
    frequency: input.frequency ?? null,
    notes: input.notes ?? null,
  });
  revalidatePath(`/dashboard/pets/${petId}`);
}

export async function deleteMedication(id: string, petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) throw new Error('Pet not found');
  await db
    .update(petMedications)
    .set({ isActive: false })
    .where(and(eq(petMedications.id, id), eq(petMedications.petId, petId)));
  revalidatePath(`/dashboard/pets/${petId}`);
}

// ----- Pet vet info -----
export type VetInfoInput = {
  vet_name?: string | null;
  clinic_name?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export async function getVetInfo(petId: string) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) return null;
  const [row] = await db.select().from(petVetInfo).where(eq(petVetInfo.petId, petId)).limit(1);
  if (!row) return null;
  return {
    vet_name: row.vetName,
    clinic_name: row.clinicName,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
  };
}

export async function saveVetInfo(petId: string, input: VetInfoInput) {
  const { businessId } = await requireBusiness();
  if (!(await petBelongsToBusiness(petId, businessId))) throw new Error('Pet not found');
  const values = {
    vetName: input.vet_name?.trim() || null,
    clinicName: input.clinic_name?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    updatedAt: new Date(),
  };
  const [existing] = await db.select().from(petVetInfo).where(eq(petVetInfo.petId, petId)).limit(1);
  if (existing) {
    await db.update(petVetInfo).set(values).where(eq(petVetInfo.petId, petId));
  } else {
    await db.insert(petVetInfo).values({ petId, ...values });
  }
  revalidatePath(`/dashboard/pets/${petId}`);
}
