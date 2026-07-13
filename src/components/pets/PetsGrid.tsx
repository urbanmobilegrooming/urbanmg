"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Dog, Cat, Weight, Phone, Pencil } from "lucide-react";
import { toast } from "sonner";
import { updatePet } from "@/server/pets";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  weight_lbs: number | null;
  gender: string | null;
  date_of_birth: string | null;
  is_neutered: boolean | null;
  temperament: string | null;
  grooming_notes: string | null;
  medical_notes: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
};

export function PetsGrid({ pets: initialPets }: { pets: Pet[] }) {
  const [pets, setPets] = useState(initialPets);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    species: "dog",
    breed: "",
    weight_lbs: "",
    gender: "",
    date_of_birth: "",
    is_neutered: false,
    temperament: "",
    grooming_notes: "",
    medical_notes: "",
  });
  const router = useRouter();

  function openEditDialog(pet: Pet) {
    setEditPet(pet);
    setEditForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? "",
      weight_lbs: pet.weight_lbs != null ? String(pet.weight_lbs) : "",
      gender: pet.gender ?? "",
      date_of_birth: pet.date_of_birth ?? "",
      is_neutered: pet.is_neutered ?? false,
      temperament: pet.temperament ?? "",
      grooming_notes: pet.grooming_notes ?? "",
      medical_notes: pet.medical_notes ?? "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPet) return;
    setSaving(true);

    const updates = {
      name: editForm.name,
      species: editForm.species,
      breed: editForm.breed || null,
      weight_lbs: editForm.weight_lbs ? parseFloat(editForm.weight_lbs) : null,
      gender: editForm.gender || null,
      date_of_birth: editForm.date_of_birth || null,
      is_neutered: editForm.is_neutered,
      temperament: editForm.temperament || null,
      grooming_notes: editForm.grooming_notes || null,
      medical_notes: editForm.medical_notes || null,
    };

    try {
      await updatePet(editPet.id, updates);
      setPets(pets.map((p) => (p.id === editPet.id ? { ...p, ...updates } : p)));
      setEditOpen(false);
      setEditPet(null);
      toast.success("Pet updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  const filtered = pets.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.breed && p.breed.toLowerCase().includes(q)) ||
      (p.clients &&
        `${p.clients.first_name} ${p.clients.last_name}`.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search pets by name, breed, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            {search ? "No pets found" : "No pets yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((pet) => (
            <div key={pet.id} className="relative">
              <Link href={`/dashboard/pets/${pet.id}`}>
                <Card className="transition-all hover:border-[#f2c037]/50 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#2C0F73]/10">
                        {pet.species === "cat" ? (
                          <Cat className="h-6 w-6 text-[#2C0F73]" />
                        ) : (
                          <Dog className="h-6 w-6 text-[#2C0F73]" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-gray-900">{pet.name}</div>
                        <div className="truncate text-xs text-gray-500">
                          {pet.breed || pet.species}
                          {pet.color && ` · ${pet.color}`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pet.weight_lbs && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Weight className="mr-0.5 h-3 w-3" />
                          {pet.weight_lbs} lbs
                        </Badge>
                      )}
                      {pet.gender && (
                        <Badge variant="secondary" className="text-[10px]">
                          {pet.gender === "male" ? "♂" : "♀"} {pet.gender}
                        </Badge>
                      )}
                      {pet.temperament && (
                        <Badge variant="outline" className="text-[10px]">
                          {pet.temperament}
                        </Badge>
                      )}
                    </div>

                    {pet.clients && (
                      <div className="mt-3 flex items-center gap-1.5 border-t pt-2 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        {pet.clients.first_name} {pet.clients.last_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2 z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditDialog(pet);
                }}
                title="Edit pet"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-[#2C0F73]" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_pet_name">Name *</Label>
                <Input id="edit_pet_name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit_pet_species">Species *</Label>
                <Select value={editForm.species} onValueChange={(v) => setEditForm({ ...editForm, species: v ?? "dog" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_pet_breed">Breed</Label>
                <Input id="edit_pet_breed" value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit_pet_weight">Weight (lbs)</Label>
                <Input id="edit_pet_weight" type="number" step="0.1" value={editForm.weight_lbs} onChange={(e) => setEditForm({ ...editForm, weight_lbs: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_pet_gender">Gender</Label>
                <Select value={editForm.gender || "__none__"} onValueChange={(v) => setEditForm({ ...editForm, gender: v === "__none__" ? "" : (v ?? "") })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_pet_dob">Date of Birth</Label>
                <Input id="edit_pet_dob" type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_pet_temperament">Temperament</Label>
                <Input id="edit_pet_temperament" value={editForm.temperament} onChange={(e) => setEditForm({ ...editForm, temperament: e.target.value })} placeholder="e.g., calm, anxious, aggressive" />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_neutered} onChange={(e) => setEditForm({ ...editForm, is_neutered: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#2C0F73] focus:ring-[#2C0F73]" />
                  <span className="text-sm font-medium">Neutered / Spayed</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="edit_pet_grooming_notes">Grooming Notes</Label>
              <Textarea id="edit_pet_grooming_notes" value={editForm.grooming_notes} onChange={(e) => setEditForm({ ...editForm, grooming_notes: e.target.value })} rows={2} />
            </div>
            <div>
              <Label htmlFor="edit_pet_medical_notes">Medical Notes</Label>
              <Textarea id="edit_pet_medical_notes" value={editForm.medical_notes} onChange={(e) => setEditForm({ ...editForm, medical_notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#411992]">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
