import { PetsGrid } from "@/components/pets/PetsGrid";
import { db } from "@/lib/db";
import { clients, pets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";

export default async function PetsPage() {
  await requireSession();
  const rows = await db
    .select()
    .from(pets)
    .leftJoin(clients, eq(pets.clientId, clients.id))
    .where(eq(pets.isActive, true))
    .orderBy(pets.name);

  const out = rows.map((r) => ({
    id: r.pets.id,
    name: r.pets.name,
    species: r.pets.species ?? "dog",
    breed: r.pets.breed,
    color: r.pets.color,
    weight_lbs: r.pets.weightLbs ? Number(r.pets.weightLbs) : null,
    gender: r.pets.gender,
    date_of_birth: r.pets.dateOfBirth,
    is_neutered: r.pets.isNeutered,
    temperament: r.pets.temperament,
    grooming_notes: r.pets.groomingNotes,
    medical_notes: r.pets.medicalNotes,
    clients: r.clients
      ? {
          id: r.clients.id,
          first_name: r.clients.firstName,
          last_name: r.clients.lastName,
          phone: r.clients.phone ?? "",
        }
      : null,
  }));

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-inter)] text-2xl font-bold text-gray-900">
        Pets
      </h1>
      <PetsGrid pets={out} />
    </div>
  );
}
