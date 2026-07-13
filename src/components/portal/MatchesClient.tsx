"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Bolt,
  Heart,
  HeartHandshake,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import {
  discoverMatchCards,
  getMatchProfile,
  listMyMutualMatches,
  recordMatchAction,
  saveMatchProfile,
} from "@/server/portal";

type LookingFor = "playmate" | "date" | "both";

type MatchPet = {
  id: string;
  name: string;
  breed: string;
  species: string;
  weight: number | null;
  birthdate: string | null;
  photo_url: string | null;
  gender: string | null;
  temperament: string | null;
  owner_name: string;
  owner_phone: string | null;
  owner_neighborhood: string | null;
  bio: string | null;
  looking_for: LookingFor;
};

type MutualMatch = {
  pet: MatchPet;
  matched_at: string;
  is_new: boolean;
};

type MyPet = { id: string; name: string; photo_url: string | null };

type ActiveTab = "discover" | "matches" | "profile";

function age(birthdate: string) {
  const birth = new Date(birthdate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  return `${y}yr`;
}

function speciesBg(species: string) {
  const s = (species || "").toLowerCase();
  if (s === "cat") return "bg-gradient-to-br from-purple-400 to-purple-600";
  if (s === "rabbit" || s === "bunny")
    return "bg-gradient-to-br from-pink-300 to-pink-500";
  return "bg-gradient-to-br from-[#f2c037] to-[#e8a020]";
}

function lookingForLabel(lf: string) {
  return lf === "playmate"
    ? "Playmate"
    : lf === "date"
      ? "Looking for Love"
      : "Open to Both";
}

function lookingForClass(lf: string) {
  if (lf === "playmate") return "bg-blue-50 text-blue-700";
  if (lf === "date") return "bg-pink-50 text-pink-700";
  return "bg-[#f2c037]/10 text-[#b8860b]";
}

const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string; Icon: typeof Bolt }[] = [
  { value: "playmate", label: "Playmate", Icon: Bolt },
  { value: "date", label: "Date", Icon: Heart },
  { value: "both", label: "Both", Icon: Star },
];

const SPECIES_FILTERS = [
  { label: "All", value: "all" },
  { label: "Dogs", value: "Dog" },
  { label: "Cats", value: "Cat" },
];

const GENDER_FILTERS = [
  { label: "Any", value: "all" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export function MatchesClient({
  myPets,
  initialCards,
  initialMatches,
  initialProfile,
  initialPetId,
}: {
  myPets: MyPet[];
  initialCards: MatchPet[];
  initialMatches: MutualMatch[];
  initialProfile: {
    id: string;
    pet_id: string;
    bio: string;
    looking_for: LookingFor;
    is_active: boolean;
  } | null;
  initialPetId: string | null;
}) {
  const [tab, setTab] = useState<ActiveTab>("discover");

  // Discover
  const [cards, setCards] = useState<MatchPet[]>(initialCards);
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [acting, setActing] = useState(false);
  const [showMatch, setShowMatch] = useState<MatchPet | null>(null);

  // Matches
  const [matches, setMatches] = useState<MutualMatch[]>(initialMatches);

  // Profile
  const [selectedPetId, setSelectedPetId] = useState<string | null>(initialPetId);
  const [profile, setProfile] = useState(initialProfile);
  const [form, setForm] = useState({
    bio: initialProfile?.bio ?? "",
    looking_for: (initialProfile?.looking_for ?? "playmate") as LookingFor,
    is_active: initialProfile?.is_active ?? true,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [, startTransition] = useTransition();

  const filteredStack = useMemo(() => {
    return cards.filter((p) => {
      if (
        speciesFilter !== "all" &&
        (p.species || "").toLowerCase() !== speciesFilter.toLowerCase()
      )
        return false;
      if (
        genderFilter !== "all" &&
        (p.gender || "").toLowerCase() !== genderFilter.toLowerCase()
      )
        return false;
      return true;
    });
  }, [cards, speciesFilter, genderFilter]);

  const currentCard = filteredStack[0] ?? null;
  const myActivePet = myPets.find((p) => p.id === selectedPetId) ?? null;
  const newMatchCount = matches.filter((m) => m.is_new).length;
  const hasActiveProfile =
    myPets.length > 0 && !!selectedPetId && profile?.is_active === true;

  async function reloadDiscover() {
    if (!selectedPetId) return;
    try {
      const fresh = await discoverMatchCards(selectedPetId);
      setCards(fresh);
    } catch {
      toast.error("Could not refresh");
    }
  }

  async function reloadMatches() {
    try {
      const fresh = await listMyMutualMatches();
      setMatches(fresh);
    } catch {
      // ignore
    }
  }

  async function act(action: "like" | "pass" | "super") {
    if (!currentCard || !selectedPetId || acting) return;
    setActing(true);
    const dbAction = action === "super" ? "like" : action;
    const card = currentCard;
    try {
      const result = await recordMatchAction(selectedPetId, card.id, dbAction);
      setCards((prev) => prev.filter((p) => p.id !== card.id));
      if (result.matched) {
        setShowMatch(card);
        setMatches((prev) => [
          {
            pet: card,
            matched_at: new Date().toISOString(),
            is_new: true,
          },
          ...prev,
        ]);
        setTimeout(() => setShowMatch(null), 3500);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(false);
    }
  }

  async function selectActivePet(id: string) {
    setSelectedPetId(id);
    try {
      const prof = await getMatchProfile(id);
      setProfile(prof);
      setForm({
        bio: prof?.bio ?? "",
        looking_for: prof?.looking_for ?? "playmate",
        is_active: prof?.is_active ?? true,
      });
    } catch {
      // ignore
    }
  }

  async function saveProfile() {
    if (!selectedPetId) return;
    setSavingProfile(true);
    try {
      await saveMatchProfile(selectedPetId, {
        bio: form.bio.trim(),
        looking_for: form.looking_for,
        is_active: form.is_active,
      });
      toast.success(`${myActivePet?.name ?? "Profile"} saved!`);
      const fresh = await getMatchProfile(selectedPetId);
      setProfile(fresh);
      startTransition(() => {
        reloadDiscover();
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingProfile(false);
    }
  }

  useEffect(() => {
    setForm({
      bio: profile?.bio ?? "",
      looking_for: profile?.looking_for ?? "playmate",
      is_active: profile?.is_active ?? true,
    });
  }, [profile]);

  return (
    <>
      {showMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-3xl bg-gradient-to-br from-[#2C0F73] to-[#4a1da8] px-10 py-8 text-center shadow-2xl border-2 border-[#f2c037]/40 max-w-xs w-full mx-4">
            <div className="mb-4 flex justify-center">
              <Heart className="h-12 w-12 text-[#f2c037]" fill="currentColor" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f2c037] mb-1">
              It&apos;s a Match!
            </p>
            <p className="text-[22px] font-black text-white leading-tight">
              {showMatch.name}
              <br />
              likes {myActivePet?.name ?? "your pet"} too!
            </p>
            <p className="mt-2 text-[13px] text-white/60">
              You can now see their contact info
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg pb-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-gray-800">
              Pet Match
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Find playmates for your fur baby
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f2c037]/20 to-[#2C0F73]/10">
            <Heart className="h-4 w-4 text-[#f2c037]" fill="currentColor" />
          </div>
        </div>

        <div className="mb-5 flex gap-1 rounded-2xl bg-gray-100 p-1">
          {[
            { key: "discover" as const, label: "Discover", Icon: Search },
            { key: "matches" as const, label: "Matches", Icon: Heart },
            { key: "profile" as const, label: "Profile", Icon: UserIcon },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "relative flex-1 rounded-xl py-2 text-[13px] transition-all " +
                (tab === t.key
                  ? "bg-white font-bold text-gray-800 shadow-sm"
                  : "font-semibold text-gray-400 hover:text-gray-600")
              }
            >
              <t.Icon className="mr-1.5 inline h-3 w-3" />
              {t.label}
              {t.key === "matches" && newMatchCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {newMatchCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "discover" && (
          <>
            {!hasActiveProfile ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#f2c037]/40 bg-gradient-to-br from-[#f2c037]/5 to-[#2C0F73]/5 py-16 text-center px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2c037]/20">
                  <Heart className="h-7 w-7 text-[#f2c037]" />
                </div>
                <h3 className="text-[17px] font-black text-gray-800">
                  Set Up Your Pet&apos;s Profile
                </h3>
                <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
                  Create a profile for your pet to start meeting new friends in the
                  neighborhood!
                </p>
                <button
                  onClick={() => setTab("profile")}
                  className="mt-5 flex items-center gap-2 rounded-full bg-[#f2c037] px-6 py-2.5 text-[13px] font-bold text-[#1a0a3e] shadow-sm transition-all hover:bg-[#e8b52e]"
                >
                  <Plus className="h-3 w-3" />
                  Create Profile
                </button>
              </div>
            ) : filteredStack.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-16 text-center px-6 shadow-sm">
                <div className="mb-4 relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 mx-auto">
                    <Search className="h-7 w-7 text-gray-300" />
                  </div>
                </div>
                <h3 className="text-[16px] font-black text-gray-700">
                  You&apos;ve seen everyone!
                </h3>
                <p className="mt-2 text-[13px] text-gray-400 leading-relaxed">
                  No more pets to discover right now.
                  <br />
                  Check back soon for new furry friends!
                </p>
                <button
                  onClick={reloadDiscover}
                  className="mt-5 flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-[13px] font-semibold text-gray-600 transition-all hover:border-[#f2c037]/40 hover:bg-[#f2c037]/5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Filter:
                  </span>
                  {SPECIES_FILTERS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSpeciesFilter(opt.value)}
                      className={
                        speciesFilter === opt.value
                          ? "shrink-0 rounded-full bg-[#2C0F73] px-3 py-1 text-[11px] font-bold text-white"
                          : "shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-500 hover:border-[#2C0F73]/40"
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="mx-1 h-4 w-px shrink-0 bg-gray-200" />
                  {GENDER_FILTERS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGenderFilter(opt.value)}
                      className={
                        genderFilter === opt.value
                          ? "shrink-0 rounded-full bg-[#f2c037] px-3 py-1 text-[11px] font-bold text-[#1a0a3e]"
                          : "shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-500 hover:border-[#f2c037]/40"
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {currentCard && (
                  <div className="relative" style={{ height: 560 }}>
                    {filteredStack.length > 1 && (
                      <div
                        className="absolute inset-x-2 top-2 bottom-0 rounded-3xl border border-gray-100 bg-white shadow-sm"
                        style={{ transform: "scale(0.96) translateY(4px)", zIndex: 1 }}
                      />
                    )}
                    {filteredStack.length > 2 && (
                      <div
                        className="absolute inset-x-4 top-4 bottom-0 rounded-3xl border border-gray-100 bg-white"
                        style={{ transform: "scale(0.92) translateY(8px)", zIndex: 0 }}
                      />
                    )}
                    <div className="absolute inset-0 z-10 select-none">
                      <div className="h-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
                        <div className="relative overflow-hidden" style={{ height: 340 }}>
                          {currentCard.photo_url ? (
                            <Image
                              src={currentCard.photo_url}
                              alt={currentCard.name}
                              fill
                              className="object-cover pointer-events-none"
                              sizes="(max-width: 768px) 100vw, 600px"
                            />
                          ) : (
                            <div
                              className={
                                "flex h-full items-center justify-center " +
                                speciesBg(currentCard.species)
                              }
                            >
                              <Heart className="h-20 w-20 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h2 className="text-[26px] font-black text-white leading-none">
                                    {currentCard.name}
                                  </h2>
                                </div>
                                <p className="text-[14px] font-semibold text-white/80">
                                  {currentCard.breed || currentCard.species}
                                </p>
                              </div>
                              {currentCard.birthdate && (
                                <div className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1">
                                  <span className="text-[13px] font-bold text-white">
                                    {age(currentCard.birthdate)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-5 overflow-y-auto" style={{ maxHeight: 220 }}>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="flex items-center gap-1 rounded-full bg-[#2C0F73]/10 px-2.5 py-1 text-[11px] font-bold text-[#2C0F73]">
                              <Tag className="h-2.5 w-2.5" />
                              {currentCard.species}
                            </span>
                            {currentCard.weight != null && (
                              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                                <BarChart3 className="h-2.5 w-2.5" />
                                {currentCard.weight} lbs
                              </span>
                            )}
                            <span
                              className={
                                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold " +
                                lookingForClass(currentCard.looking_for)
                              }
                            >
                              <HeartHandshake className="h-2.5 w-2.5" />
                              {lookingForLabel(currentCard.looking_for)}
                            </span>
                            {currentCard.temperament && (
                              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                                <Star className="h-2.5 w-2.5" />
                                {currentCard.temperament}
                              </span>
                            )}
                          </div>

                          {currentCard.bio && (
                            <p className="text-[13px] leading-relaxed text-gray-600 mb-3">
                              {currentCard.bio}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-[12px] text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>
                              Owner: {currentCard.owner_name}
                              {currentCard.owner_neighborhood &&
                                ` · ${currentCard.owner_neighborhood}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-center gap-5">
                  <button
                    onClick={() => act("pass")}
                    disabled={acting || !currentCard}
                    className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-200 bg-white shadow-md transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-lg active:scale-90 disabled:opacity-40"
                  >
                    <X className="h-5 w-5 text-red-400 group-hover:text-red-500" />
                  </button>
                  <button
                    onClick={() => act("super")}
                    disabled={acting || !currentCard}
                    className="group flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#2C0F73]/20 bg-white shadow-sm transition-all hover:border-[#2C0F73]/50 hover:bg-purple-50 active:scale-90 disabled:opacity-40"
                  >
                    <Star className="h-4 w-4 text-[#2C0F73]/50 group-hover:text-[#2C0F73]" />
                  </button>
                  <button
                    onClick={() => act("like")}
                    disabled={acting || !currentCard}
                    className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#f2c037]/50 bg-gradient-to-br from-[#f2c037] to-[#e8b52e] shadow-md transition-all hover:shadow-lg active:scale-90 disabled:opacity-40"
                  >
                    <Heart className="h-5 w-5 text-[#1a0a3e]" fill="currentColor" />
                  </button>
                </div>

                <p className="mt-3 text-center text-[11px] text-gray-400">
                  {filteredStack.length} pet{filteredStack.length !== 1 ? "s" : ""} nearby
                </p>
              </>
            )}
          </>
        )}

        {tab === "matches" && (
          <>
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#f2c037]/40 bg-gradient-to-br from-[#f2c037]/5 to-[#2C0F73]/5 py-16 text-center px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2c037]/20">
                  <Heart className="h-7 w-7 text-[#f2c037]" />
                </div>
                <h3 className="text-[17px] font-black text-gray-700">No matches yet</h3>
                <p className="mt-2 text-[13px] text-gray-400 leading-relaxed">
                  Keep swiping! When another pet likes yours back, they&apos;ll show up here.
                </p>
                <button
                  onClick={() => setTab("discover")}
                  className="mt-5 flex items-center gap-2 rounded-full bg-[#f2c037] px-6 py-2.5 text-[13px] font-bold text-[#1a0a3e] transition-all hover:bg-[#e8b52e]"
                >
                  <Search className="h-3 w-3" />
                  Start Discovering
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-gray-600">
                    {matches.length} Match{matches.length !== 1 ? "es" : ""}
                  </h2>
                  {newMatchCount > 0 && (
                    <span className="rounded-full bg-[#f2c037]/20 px-3 py-1 text-[11px] font-bold text-[#b8860b]">
                      {newMatchCount} new
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.pet.id}
                      className={
                        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md " +
                        (match.is_new
                          ? "border-[#f2c037]/40 bg-gradient-to-r from-[#f2c037]/5 to-white"
                          : "border-gray-100")
                      }
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="relative shrink-0">
                          {match.pet.photo_url ? (
                            <Image
                              src={match.pet.photo_url}
                              alt={match.pet.name}
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-2xl object-cover"
                            />
                          ) : (
                            <div
                              className={
                                "h-14 w-14 rounded-2xl flex items-center justify-center " +
                                speciesBg(match.pet.species)
                              }
                            >
                              <Heart className="h-6 w-6 text-white/60" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f2c037] shadow-sm">
                            <Heart
                              className="h-2.5 w-2.5 text-[#1a0a3e]"
                              fill="currentColor"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[15px] font-black text-gray-800 truncate">
                                {match.pet.name}
                              </p>
                              <p className="text-[12px] text-gray-500">
                                {match.pet.breed || match.pet.species}
                              </p>
                            </div>
                            {match.is_new && (
                              <span className="shrink-0 rounded-full bg-[#f2c037] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#1a0a3e]">
                                New
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1 text-[12px] text-[#2C0F73] font-semibold">
                              <UserIcon className="h-3 w-3" />
                              {match.pet.owner_name}
                            </div>
                            {match.pet.owner_phone && (
                              <a
                                href={`tel:${match.pet.owner_phone}`}
                                className="flex items-center gap-1 text-[12px] text-[#f2c037] font-bold hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {match.pet.owner_phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === "profile" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-gray-400">
                Which Pet?
              </h3>
              {myPets.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-[13px] text-amber-700">
                    Add pets in <strong>My Pets</strong> first.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {myPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => selectActivePet(pet.id)}
                      className={
                        selectedPetId === pet.id
                          ? "flex items-center gap-2 rounded-full bg-[#2C0F73] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm"
                          : "flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:border-[#2C0F73]/40"
                      }
                    >
                      <Heart className="h-3 w-3" />
                      {pet.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPetId && (
              <>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    <Pencil className="mr-1 inline h-3 w-3" />
                    Pet Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    placeholder={`Tell the world about ${myActivePet?.name ?? "your pet"}!`}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#f2c037] focus:bg-white"
                  />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    <Heart className="mr-1 inline h-3 w-3" />
                    Looking For
                  </label>
                  <div className="flex gap-2">
                    {LOOKING_FOR_OPTIONS.map((opt) => {
                      const Icon = opt.Icon;
                      const active = form.looking_for === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() =>
                            setForm({ ...form, looking_for: opt.value })
                          }
                          className={
                            active
                              ? "flex-1 rounded-xl border-2 border-[#f2c037] bg-[#f2c037]/10 py-2.5 text-[12px] font-bold text-[#b8860b]"
                              : "flex-1 rounded-xl border-2 border-gray-100 bg-gray-50 py-2.5 text-[12px] font-semibold text-gray-400 hover:border-gray-200"
                          }
                        >
                          <Icon className="mx-auto mb-1 h-4 w-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-[14px] font-bold text-gray-700">
                      Show in Discover
                    </p>
                    <p className="text-[12px] text-gray-400">
                      Let others find {myActivePet?.name ?? "your pet"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setForm({ ...form, is_active: !form.is_active })
                    }
                    className={
                      "relative h-7 w-12 rounded-full transition-all shadow-inner " +
                      (form.is_active ? "bg-[#f2c037]" : "bg-gray-200")
                    }
                  >
                    <div
                      className={
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all " +
                        (form.is_active ? "right-1" : "left-1")
                      }
                    />
                  </button>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f2c037] to-[#e8b52e] py-3.5 text-[14px] font-black text-[#1a0a3e] shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
