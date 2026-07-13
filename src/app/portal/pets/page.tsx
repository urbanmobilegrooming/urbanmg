import { listMyPets } from "@/server/portal";
import { PetsClient } from "@/components/portal/PetsClient";

export default async function PortalPetsPage() {
  const pets = await listMyPets();
  return <PetsClient pets={pets} />;
}
