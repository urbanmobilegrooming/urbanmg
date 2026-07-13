"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Heart,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createMyPet, updateMyPet } from "@/server/portal";

type Vaccine = {
  id: string;
  vaccine_name: string;
  administered_date: string | null;
  expiry_date: string | null;
  status: "current" | "expiring_soon" | "expired";
};

export type PortalPet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  weight: number | null;
  birthdate: string | null;
  photo_url: string | null;
  notes: string | null;
  vaccines: Vaccine[];
};

function age(birthdate: string) {
  const birth = new Date(birthdate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths}mo`;
  const y = Math.floor(totalMonths / 12);
  return `${y} yr${y !== 1 ? "s" : ""}`;
}

function vaccineStatusClass(s: Vaccine["status"]) {
  const map = {
    current: "bg-green-100 text-green-700",
    expiring_soon: "bg-yellow-100 text-yellow-700",
    expired: "bg-red-100 text-red-600",
  } as const;
  return map[s];
}

function statusLabel(s: Vaccine["status"]) {
  if (s === "current") return "Current";
  if (s === "expiring_soon") return "Expiring Soon";
  return "Expired";
}

const DEFAULT_FORM = {
  name: "",
  species: "Dog",
  breed: "",
  weight: "" as string,
  birthdate: "",
  notes: "",
};

export function PetsClient({ pets }: { pets: PortalPet[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortalPet | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [openTips, setOpenTips] = useState<Set<string>>(new Set());

  function openAdd() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  }

  function openEdit(pet: PortalPet) {
    setEditing(pet);
    setForm({
      name: pet.name,
      species: pet.species || "Dog",
      breed: pet.breed ?? "",
      weight: pet.weight != null ? String(pet.weight) : "",
      birthdate: pet.birthdate ?? "",
      notes: pet.notes ?? "",
    });
    setDialogOpen(true);
  }

  function toggleTips(petId: string) {
    setOpenTips((prev) => {
      const next = new Set(prev);
      if (next.has(petId)) next.delete(petId);
      else next.add(petId);
      return next;
    });
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed || null,
        weight: form.weight ? Number(form.weight) : null,
        birthdate: form.birthdate || null,
        notes: form.notes || null,
      };
      if (editing) {
        await updateMyPet(editing.id, payload);
        toast.success(`${form.name} updated successfully`);
      } else {
        await createMyPet(payload);
        toast.success(`${form.name} added to your pets`);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save pet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-gray-800">
            My Pets
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Manage your pets&apos; info and health records
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-full bg-[#f2c037] px-4 py-2 text-[13px] font-bold text-[#1a0a3e] shadow-sm transition-all hover:bg-[#e8b52e]"
        >
          <Plus className="h-3 w-3" />
          Add Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Heart className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-[14px] font-semibold text-gray-500">
            No pets added yet
          </p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#f2c037] px-4 py-2 text-[12px] font-bold text-[#1a0a3e]"
          >
            <Plus className="h-3 w-3" />
            Add Your First Pet
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-[#f2c037]/20 hover:shadow-md"
            >
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#f2c037]/10 to-[#2C0F73]/10">
                {pet.photo_url ? (
                  <Image
                    src={pet.photo_url}
                    alt={pet.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Heart className="h-12 w-12 text-[#f2c037]/30" />
                  </div>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 shadow-sm backdrop-blur-sm">
                  {pet.species || "Dog"}
                </span>
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-[16px] font-black text-gray-800">
                      {pet.name}
                    </h3>
                    <p className="text-[12px] text-gray-500">
                      {pet.breed || "Unknown breed"}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(pet)}
                    className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mb-3 flex gap-3">
                  {pet.weight != null && (
                    <div className="flex items-center gap-1 text-[12px] text-gray-500">
                      <BarChart3 className="h-3 w-3 text-[#f2c037]" />
                      {pet.weight} lbs
                    </div>
                  )}
                  {pet.birthdate && (
                    <div className="flex items-center gap-1 text-[12px] text-gray-500">
                      <Calendar className="h-3 w-3 text-[#2C0F73]" />
                      {age(pet.birthdate)}
                    </div>
                  )}
                </div>

                {pet.vaccines.length > 0 ? (
                  <div className="border-t border-gray-50 pt-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Vaccines
                    </p>
                    <div className="space-y-1.5">
                      {pet.vaccines.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-xl bg-gray-50 px-2.5 py-1.5"
                        >
                          <span className="text-[12px] font-medium text-gray-700">
                            {v.vaccine_name}
                          </span>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                              vaccineStatusClass(v.status)
                            }
                          >
                            {statusLabel(v.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-1.5 rounded-xl bg-yellow-50 px-2.5 py-2 text-[12px] text-yellow-700">
                      <AlertTriangle className="h-3 w-3" />
                      No vaccine records on file
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-50 pt-3">
                  <button
                    onClick={() => toggleTips(pet.id)}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[12px] font-semibold text-[#2C0F73] transition-colors hover:bg-[#2C0F73]/5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="h-3 w-3 text-[#f2c037]" />
                      Care Tips
                    </span>
                    {openTips.has(pet.id) ? (
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                  {openTips.has(pet.id) && (
                    <div className="mt-2 space-y-2">
                      {careTips(pet).map((tip) => (
                        <div
                          key={tip.id}
                          className="flex gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f2c037]/15">
                            <Lightbulb className="h-3 w-3 text-[#f2c037]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-gray-800">
                              {tip.title}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500">
                              {tip.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pet" : "Add New Pet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Pet Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Buddy"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Species
                </label>
                <input
                  value={form.species}
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                  placeholder="Dog"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Breed
                </label>
                <input
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  placeholder="Golden Retriever"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="35"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={form.birthdate}
                  onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Any special notes..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#f2c037] px-4 py-2 text-[13px] font-bold text-[#1a0a3e] transition-all hover:bg-[#e8b52e] disabled:opacity-40"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editing ? "Save Changes" : "Add Pet"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function careTips(pet: PortalPet) {
  const tips: { id: string; title: string; body: string }[] = [];
  const species = (pet.species || "dog").toLowerCase();

  if (species === "dog") {
    tips.push({
      id: "ex",
      title: "Daily exercise",
      body: "Aim for at least 30–60 minutes of activity per day to keep your dog healthy.",
    });
    tips.push({
      id: "grm",
      title: "Regular grooming",
      body: "Brush a few times per week and book a full grooming every 4–8 weeks.",
    });
  } else if (species === "cat") {
    tips.push({
      id: "play",
      title: "Interactive play",
      body: "Cats need 15–20 minutes of focused play daily to stay mentally stimulated.",
    });
  }

  tips.push({
    id: "vax",
    title: "Keep vaccines current",
    body: "Check expiration dates yearly and schedule boosters with your vet.",
  });
  tips.push({
    id: "weight",
    title: "Watch the weight",
    body: "Track weight quarterly. Sudden changes may indicate health issues.",
  });

  return tips.slice(0, 4);
}
