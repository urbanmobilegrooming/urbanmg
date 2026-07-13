"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Syringe, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addVaccine, deleteVaccine } from "@/server/pets";

interface Vaccine {
  id: string;
  vaccine_name: string;
  date_given: string | null;
  expiry_date: string | null;
  vet_name: string | null;
  notes: string | null;
}

function getVaccineStatus(expiry: string | null): { label: string; color: string } {
  if (!expiry) return { label: "No expiry", color: "bg-gray-100 text-gray-500" };
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", color: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days}d left`, color: "bg-yellow-100 text-yellow-700" };
  return { label: "Up to date", color: "bg-green-100 text-green-700" };
}

export function PetVaccines({ petId, vaccines }: { petId: string; vaccines: Vaccine[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vaccine_name: "", date_given: "", expiry_date: "", vet_name: "", notes: "" });
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addVaccine(petId, {
        vaccine_name: form.vaccine_name,
        date_given: form.date_given || null,
        expiry_date: form.expiry_date || null,
        vet_name: form.vet_name || null,
        notes: form.notes || null,
      });
      toast.success("Vaccine added");
      setOpen(false);
      setForm({ vaccine_name: "", date_given: "", expiry_date: "", vet_name: "", notes: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await deleteVaccine(id, petId);
      toast.success("Vaccine removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const expired = vaccines.filter((v) => v.expiry_date && new Date(v.expiry_date) < new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe size={16} /> Vaccines
            {expired.length > 0 && (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle size={10} className="mr-1" /> {expired.length} expired
              </Badge>
            )}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
              <Plus size={14} className="mr-1" /> Add
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Vaccine Record</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div><Label>Vaccine Name *</Label><Input value={form.vaccine_name} onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })} required placeholder="e.g. Rabies, DHPP, Bordetella" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Date Given</Label><Input type="date" value={form.date_given} onChange={(e) => setForm({ ...form, date_given: e.target.value })} /></div>
                  <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
                </div>
                <div><Label>Veterinarian</Label><Input value={form.vet_name} onChange={(e) => setForm({ ...form, vet_name: e.target.value })} /></div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Saving..." : "Add Vaccine"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {vaccines.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No vaccine records</p>
        ) : (
          <div className="space-y-2">
            {vaccines.map((v) => {
              const status = getVaccineStatus(v.expiry_date);
              return (
                <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{v.vaccine_name}</span>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {v.date_given && `Given: ${v.date_given}`}
                      {v.expiry_date && ` · Expires: ${v.expiry_date}`}
                      {v.vet_name && ` · Dr. ${v.vet_name}`}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(v.id)} className="h-7 text-red-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
