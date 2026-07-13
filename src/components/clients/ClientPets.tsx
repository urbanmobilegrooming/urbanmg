"use client";

import { useState } from "react";
import { createPet } from "@/server/pets";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Dog, Cat, Weight, Cake } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Pet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  color: string | null;
  weight_lbs: number | null;
  date_of_birth: string | null;
  gender: string | null;
  temperament: string | null;
  grooming_notes: string | null;
};

export function ClientPets({ clientId, pets: initialPets }: { clientId: string; pets: Pet[] }) {
  const [pets, setPets] = useState(initialPets);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const weight = form.get("weight_lbs") as string;

    try {
      const data = await createPet({
        client_id: clientId,
        name: form.get("name") as string,
        species: form.get("species") as string,
        breed: (form.get("breed") as string) || null,
        color: (form.get("color") as string) || null,
        weight_lbs: weight ? parseFloat(weight) : null,
        date_of_birth: (form.get("birth_date") as string) || null,
        gender: (form.get("gender") as string) || null,
        temperament: (form.get("temperament") as string) || null,
        grooming_notes: (form.get("grooming_notes") as string) || null,
      });
      setPets([...pets, data as unknown as Pet]);
      setOpen(false);
      toast.success("Pet added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pets ({pets.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button size="sm" className="bg-[#f2c037] text-[#2C0F73] hover:bg-[#e5a818]" />}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Pet
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Pet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="species">Species *</Label>
                  <Select name="species" defaultValue="dog">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input id="breed" name="breed" />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" name="color" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="weight_lbs">Weight (lbs)</Label>
                  <Input id="weight_lbs" name="weight_lbs" type="number" step="0.1" />
                </div>
                <div>
                  <Label htmlFor="birth_date">Birth Date</Label>
                  <Input id="birth_date" name="birth_date" type="date" />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender">
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="temperament">Temperament</Label>
                <Input id="temperament" name="temperament" placeholder="e.g., Friendly, Anxious, Aggressive" />
              </div>
              <div>
                <Label htmlFor="grooming_notes">Grooming Notes</Label>
                <Textarea id="grooming_notes" name="grooming_notes" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#411992]">
                  {saving ? "Saving..." : "Add Pet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {pets.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No pets yet. Add this client&apos;s first pet!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/dashboard/pets/${pet.id}`}
                className="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-[#f2c037]/50 hover:bg-[#f2c037]/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C0F73]/10">
                  {pet.species === "cat" ? (
                    <Cat className="h-5 w-5 text-[#2C0F73]" />
                  ) : (
                    <Dog className="h-5 w-5 text-[#2C0F73]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{pet.name}</div>
                  <div className="text-xs text-gray-500">
                    {pet.breed || pet.species} {pet.color && `· ${pet.color}`}
                  </div>
                  <div className="mt-1 flex gap-2">
                    {pet.weight_lbs && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Weight className="mr-0.5 h-3 w-3" />
                        {pet.weight_lbs} lbs
                      </Badge>
                    )}
                    {pet.gender && (
                      <Badge variant="secondary" className="text-[10px]">
                        {pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : "?"} {pet.gender}
                      </Badge>
                    )}
                    {pet.date_of_birth && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Cake className="mr-0.5 h-3 w-3" />
                        {pet.date_of_birth}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
