'use server';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { petPhotos, pets } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type GalleryPhotoRow = {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'general';
  caption: string | null;
  created_at: string;
  pet_id: string;
  pet_name: string;
  pet_breed: string | null;
  pet_species: string;
  service_name: string | null;
};

export async function listGalleryPhotos(): Promise<GalleryPhotoRow[]> {
  const { businessId } = await requireBusiness();
  // pet_photos has no businessId; restrict via the pet's businessId
  const rows = await db
    .select()
    .from(petPhotos)
    .innerJoin(pets, and(eq(petPhotos.petId, pets.id), eq(pets.businessId, businessId)))
    .orderBy(desc(petPhotos.createdAt))
    .limit(200);
  return rows.map((r) => ({
    id: r.pet_photos.id,
    photo_url: r.pet_photos.photoUrl,
    photo_type: (r.pet_photos.photoType as 'before' | 'after' | 'general') ?? 'general',
    caption: r.pet_photos.caption,
    created_at: r.pet_photos.createdAt.toISOString(),
    pet_id: r.pet_photos.petId,
    pet_name: r.pets?.name ?? 'Unknown',
    pet_breed: r.pets?.breed ?? null,
    pet_species: r.pets?.species ?? 'dog',
    service_name: null,
  }));
}
