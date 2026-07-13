"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Clock, Search, ChevronRight, ChevronLeft,
  User, PawPrint, Scissors, Truck, Check, List, CalendarDays,
  CheckCircle, XCircle, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, StatusFlowStep } from "@/types";
import { AppointmentCalendar } from "./AppointmentCalendar";
import {
  cancelAppointment,
  createAppointment,
  createAppointmentServices,
  updateAppointmentStatus,
} from "@/server/appointments";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  pets: { id: string; name: string; species: string | null; breed: string | null; weight_lbs?: number | null }[];
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  service_pricing: { size_category: string; price: number }[];
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  color: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-orange-100 text-orange-700",
};

const statusFlow: Record<string, StatusFlowStep> = {
  scheduled: { next: "confirmed", label: "Confirm", icon: Check },
  confirmed: { next: "in_progress", label: "Check In", icon: LogIn },
  in_progress: { next: "completed", label: "Complete", icon: CheckCircle },
};

function getSizeCategory(weight: number | null): string {
  if (!weight) return "medium";
  if (weight <= 25) return "small";
  if (weight <= 50) return "medium";
  if (weight <= 80) return "large";
  return "xl";
}

export function AppointmentsList({
  appointments,
  clients,
  services,
  staff,
}: {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  staff: StaffMember[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [petServices, setPetServices] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    client_id: "",
    staff_id: "",
    van: "",
    date: "",
    start_time: "",
    address: "",
    city: "Miami",
    state: "FL",
    zip: "",
    notes: "",
  });
  const router = useRouter();

  const selectedClient = clients.find((c) => c.id === form.client_id);

  function selectClient(clientId: string | null) {
    if (!clientId) return;
    const client = clients.find((c) => c.id === clientId);
    setSelectedPets([]);
    setPetServices({});
    setForm({
      ...form,
      client_id: clientId,
      address: client?.address ?? "",
      city: client?.city ?? "Miami",
      state: client?.state ?? "FL",
      zip: client?.zip ?? "",
    });
  }

  function togglePet(petId: string) {
    setSelectedPets((prev) =>
      prev.includes(petId) ? prev.filter((p) => p !== petId) : [...prev, petId]
    );
  }

  function setPetService(petId: string, serviceId: string) {
    setPetServices((prev) => ({ ...prev, [petId]: serviceId }));
  }

  function calculateTotal(): number {
    let total = 0;
    for (const petId of selectedPets) {
      const svcId = petServices[petId];
      if (!svcId) continue;
      const svc = services.find((s) => s.id === svcId);
      const pet = selectedClient?.pets.find((p) => p.id === petId);
      const size = getSizeCategory(pet?.weight_lbs ?? null);
      const pricing = svc?.service_pricing.find((p) => p.size_category === size);
      total += pricing?.price ?? 0;
    }
    return total;
  }

  function canNext(): boolean {
    if (step === 1) return !!form.client_id && selectedPets.length > 0;
    if (step === 2) return selectedPets.every((pid) => !!petServices[pid]);
    if (step === 3) return !!form.date && !!form.start_time;
    return true;
  }

  function resetForm() {
    setStep(1);
    setSelectedPets([]);
    setPetServices({});
    setForm({
      client_id: "", staff_id: "", van: "",
      date: "", start_time: "", address: "", city: "Miami", state: "FL", zip: "", notes: "",
    });
  }

  async function handleCreate() {
    setSaving(true);
    const firstPet = selectedPets[0];
    const firstService = petServices[firstPet];

    try {
      const apt = await createAppointment({
        client_id: form.client_id,
        pet_id: firstPet,
        service_id: firstService,
        staff_id: form.staff_id || null,
        van: form.van || null,
        date: form.date,
        start_time: form.start_time,
        address: form.address || null,
        city: form.city,
        state: form.state,
        zip: form.zip || null,
        price: calculateTotal(),
        notes: form.notes || null,
      });

      const svcRows = selectedPets.map((petId, i) => {
        const svcId = petServices[petId];
        const s = services.find((x) => x.id === svcId);
        const p = selectedClient?.pets.find((x) => x.id === petId);
        const sz = getSizeCategory(p?.weight_lbs ?? null);
        const pr = s?.service_pricing.find((x) => x.size_category === sz);
        return {
          appointment_id: apt.id,
          pet_id: petId,
          service_id: svcId,
          staff_id: form.staff_id || null,
          price: pr?.price ?? 0,
          duration_minutes: s?.duration_minutes ?? 60,
          sort_order: i,
        };
      });
      await createAppointmentServices(svcRows);

      toast.success("Appointment created");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await updateAppointmentStatus(id, newStatus);
      toast.success(`Status → ${newStatus.replace("_", " ")}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const filtered = appointments.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.clients?.first_name?.toLowerCase().includes(s) ||
      a.clients?.last_name?.toLowerCase().includes(s) ||
      a.pets?.name?.toLowerCase().includes(s) ||
      a.services?.name?.toLowerCase().includes(s)
    );
  });

  const stepLabels = ["Client & Pets", "Services", "Schedule", "Confirm"];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
            <Plus size={16} className="mr-1" /> New Appointment
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>

            <div className="mb-4 flex items-center justify-between">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-[#f2c037] text-[#1a0a3e]" : "bg-gray-100 text-gray-400"
                  }`}>
                    {step > i + 1 ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`hidden text-xs font-medium sm:inline ${step === i + 1 ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
                  {i < 3 && <ChevronRight size={14} className="mx-1 text-gray-300" />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Client *</Label>
                  <Select value={form.client_id} onValueChange={selectClient}>
                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClient && selectedClient.pets.length > 0 && (
                  <div>
                    <Label>Pets * <span className="text-xs text-gray-400">(select one or more)</span></Label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {selectedClient.pets.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePet(p.id)}
                          className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                            selectedPets.includes(p.id) ? "border-[#f2c037] bg-[#f2c037]/5" : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <PawPrint size={16} className={selectedPets.includes(p.id) ? "text-[#f2c037]" : "text-gray-300"} />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.breed ?? p.species}{p.weight_lbs ? ` · ${p.weight_lbs} lbs` : ""}</div>
                          </div>
                          {selectedPets.includes(p.id) && <Check size={14} className="ml-auto text-[#f2c037]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {selectedPets.map((petId) => {
                  const pet = selectedClient?.pets.find((p) => p.id === petId);
                  const size = getSizeCategory(pet?.weight_lbs ?? null);
                  return (
                    <div key={petId}>
                      <Label className="flex items-center gap-1.5">
                        <PawPrint size={14} className="text-[#f2c037]" />
                        {pet?.name} <span className="text-xs text-gray-400">({size})</span>
                      </Label>
                      <div className="mt-1 grid gap-2">
                        {services.map((svc) => {
                          const pricing = svc.service_pricing.find((p) => p.size_category === size);
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => setPetService(petId, svc.id)}
                              className={`flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                                petServices[petId] === svc.id ? "border-[#f2c037] bg-[#f2c037]/5" : "border-gray-100 hover:border-gray-200"
                              }`}
                            >
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{svc.name}</div>
                                <div className="text-xs text-gray-400">{svc.duration_minutes} min</div>
                              </div>
                              {pricing && <span className="text-base font-bold text-gray-900">${pricing.price}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div><Label>Time *</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Groomer</Label>
                    <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                      <SelectContent>{staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Van</Label>
                    <Select value={form.van} onValueChange={(v) => setForm({ ...form, van: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                      <SelectContent><SelectItem value="Van 5">Van 5</SelectItem><SelectItem value="Van 7">Van 7</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              </div>
            )}

            {step === 4 && (
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between"><span className="text-xs font-semibold uppercase text-gray-400">Client</span><span className="text-sm font-medium">{selectedClient?.first_name} {selectedClient?.last_name}</span></div>
                  <div className="flex justify-between"><span className="text-xs font-semibold uppercase text-gray-400">Pets</span><span className="text-sm font-medium">{selectedPets.map((pid) => selectedClient?.pets.find((p) => p.id === pid)?.name).join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-xs font-semibold uppercase text-gray-400">Services</span><span className="text-sm font-medium">{selectedPets.map((pid) => services.find((s) => s.id === petServices[pid])?.name).join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-xs font-semibold uppercase text-gray-400">Date</span><span className="text-sm font-medium">{form.date} at {form.start_time}</span></div>
                  {form.van && <div className="flex justify-between"><span className="text-xs font-semibold uppercase text-gray-400">Van</span><span className="text-sm font-medium">{form.van}</span></div>}
                  <div className="border-t pt-2"><div className="flex justify-between"><span className="text-sm font-bold">Total</span><span className="text-lg font-bold text-[#f2c037]">${calculateTotal()}</span></div></div>
                </CardContent>
              </Card>
            )}

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}><ChevronLeft size={16} className="mr-1" /> Back</Button>
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">Next <ChevronRight size={16} className="ml-1" /></Button>
              ) : (
                <Button onClick={handleCreate} disabled={saving} className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Creating..." : "Create Appointment"}</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar"><CalendarDays size={14} className="mr-1" /> Calendar</TabsTrigger>
          <TabsTrigger value="list"><List size={14} className="mr-1" /> List</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <AppointmentCalendar appointments={filtered} onStatusChange={handleStatusChange} />
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No appointments found.</p>
          ) : (
            filtered.map((apt) => {
              const flow = statusFlow[apt.status];
              return (
                <Card key={apt.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f2c037]/10">
                        <span className="text-xs font-bold text-[#f2c037]">{new Date(apt.date + "T00:00").toLocaleDateString("en", { month: "short" }).toUpperCase()}</span>
                        <span className="text-lg font-black leading-none text-[#1a0a3e]">{new Date(apt.date + "T00:00").getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900">{apt.clients?.first_name} {apt.clients?.last_name}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-sm text-gray-500">{apt.pets?.name}</span>
                          {apt.price && <span className="ml-auto text-sm font-bold text-gray-900">${apt.price}</span>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Scissors size={11} /> {apt.services?.name}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {apt.start_time?.slice(0, 5)}</span>
                          {apt.staff && <span className="hidden sm:flex items-center gap-1"><User size={11} /> {apt.staff.first_name}</span>}
                          {apt.van && <span className="hidden sm:flex items-center gap-1"><Truck size={11} /> {apt.van}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className={statusColors[apt.status] ?? ""}>{apt.status.replace("_", " ")}</Badge>
                          {flow && (
                            <Button size="sm" onClick={() => handleStatusChange(apt.id, flow.next)} className="h-7 bg-[#f2c037] text-[10px] font-bold text-[#1a0a3e] hover:bg-[#e5a818]">
                              <flow.icon size={12} className="mr-1" /> {flow.label}
                            </Button>
                          )}
                          {apt.status !== "cancelled" && apt.status !== "completed" && (
                            <Button size="sm" variant="outline" onClick={() => handleCancel(apt.id)} className="h-7 text-[10px] text-red-500 hover:text-red-600">
                              <XCircle size={12} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
