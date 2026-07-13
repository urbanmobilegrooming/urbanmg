import {
  discoverMatchCards,
  getMatchProfile,
  listMyMutualMatches,
  listMyPetsForMatch,
} from "@/server/portal";
import { MatchesClient } from "@/components/portal/MatchesClient";

export default async function PortalMatchesPage() {
  const myPets = await listMyPetsForMatch();
  const firstPetId = myPets[0]?.id ?? null;

  const [initialProfile, initialCards, initialMatches] = await Promise.all([
    firstPetId ? getMatchProfile(firstPetId) : Promise.resolve(null),
    firstPetId ? discoverMatchCards(firstPetId) : Promise.resolve([]),
    listMyMutualMatches(),
  ]);

  return (
    <MatchesClient
      myPets={myPets}
      initialCards={initialCards}
      initialMatches={initialMatches}
      initialProfile={initialProfile}
      initialPetId={firstPetId}
    />
  );
}
