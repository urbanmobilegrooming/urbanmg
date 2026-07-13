"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pill, Trash2, Stethoscope, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  addMedication,
  deleteMedication,
  saveVetInfo,
  type MedicationInput,
  type VetInfoInput,
} from "@/server/pets";

type Medication = { id: string; name: string; dosage: string | null; frequency: string | null; notes: string | null };
type VetInfo = { vet_name: string | null; clinic_name: string | null; phone: string | null; address: string | null; notes: string | null } | null;

export function PetMedical({ petId, medications, vetInfo }: { petId: string; medications: Medication[]; vetInfo: VetInfo }) {
  const router = useRouter();
  const [medOpen, setMedOpen] = useState(false);
  const [vetOpen, setVetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [medForm, setMedForm] = useState<MedicationInput>({ name: "", dosage: "", frequency: "", notes: "" });
  const [vetForm, setVetForm] = useState<VetInfoInput>({
    vet_name: vetInfo?.vet_name ?? "",
    clinic_name: vetInfo?.clinic_name ?? "",
    phone: vetInfo?.phone ?? "",
    address: vetInfo?.address ?? "",
    notes: vetInfo?.notes ?? "",
  });

  async function handleAddMed(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addMedication(petId, medForm);
      toast.success("Medication added");
      setMedOpen(false);
      setMedForm({ name: "", dosage: "", frequency: "", notes: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMed(id: string) {
    try {
      await deleteMedication(id, petId);
      toast.success("Medication removed");
      router.refresh();
    } catch {
      toast.error("Failed");
    }
  }

  async function handleSaveVet(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveVetInfo(petId, vetForm);
      toast.success("Vet info saved");
      setVetOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Medicamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-[#2C0F73]" />
            Medications
          </CardTitle>
          <Dialog open={medOpen} onOpenChange={setMedOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="border-[#f2c037] text-[#b8901f]" />}>
              <Plus className="mr-1 h-4 w-4" />Add
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add medication</DialogTitle></DialogHeader>
              <form onSubmit={handleAddMed} className="space-y-3">
                <div>
                  <Label>Name *</Label>
                  <Input required value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} placeholder="e.g. Apoquel" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Dosage</Label>
                    <Input value={medForm.dosage ?? ""} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} placeholder="16mg" />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Input value={medForm.frequency ?? ""} onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })} placeholder="Twice daily" />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={medForm.notes ?? ""} onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })} placeholder="Give with food" />
                </div>
                <Button disabled={saving} className="w-full bg-[#f2c037] font-bold text-[#1a0a3e]">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-sm text-gray-400">No medications on file.</p>
          ) : (
            <div className="space-y-2">
              {medications.map((m) => (
                <div key={m.id} className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                    </div>
                    {m.notes && <div className="mt-0.5 text-xs italic text-gray-400">{m.notes}</div>}
                  </div>
                  <button onClick={() => handleDeleteMed(m.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Veterinario */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-[#2C0F73]" />
            Veterinarian
          </CardTitle>
          <Dialog open={vetOpen} onOpenChange={setVetOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="border-[#f2c037] text-[#b8901f]" />}>
              <Pencil className="mr-1 h-4 w-4" />{vetInfo ? "Edit" : "Add"}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Veterinarian info</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveVet} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vet name</Label>
                    <Input value={vetForm.vet_name ?? ""} onChange={(e) => setVetForm({ ...vetForm, vet_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Clinic</Label>
                    <Input value={vetForm.clinic_name ?? ""} onChange={(e) => setVetForm({ ...vetForm, clinic_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={vetForm.phone ?? ""} onChange={(e) => setVetForm({ ...vetForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={vetForm.address ?? ""} onChange={(e) => setVetForm({ ...vetForm, address: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={vetForm.notes ?? ""} onChange={(e) => setVetForm({ ...vetForm, notes: e.target.value })} />
                </div>
                <Button disabled={saving} className="w-full bg-[#f2c037] font-bold text-[#1a0a3e]">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!vetInfo ? (
            <p className="text-sm text-gray-400">No vet on file — add it for emergencies.</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              <div className="font-semibold text-gray-900">
                {vetInfo.vet_name || "—"}
                {vetInfo.clinic_name && <span className="font-normal text-gray-500"> · {vetInfo.clinic_name}</span>}
              </div>
              {vetInfo.phone && (
                <a href={`tel:${vetInfo.phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Phone className="h-3.5 w-3.5" />{vetInfo.phone}
                </a>
              )}
              {vetInfo.address && <div className="text-gray-500">{vetInfo.address}</div>}
              {vetInfo.notes && <div className="text-xs italic text-gray-400">{vetInfo.notes}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
