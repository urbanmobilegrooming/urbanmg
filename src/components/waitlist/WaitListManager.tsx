"use client";
import type { ServiceRef, StaffMember } from "@/types";
interface ClientRef {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pets?: { id: string; name: string }[];
}

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Phone, PawPrint, Scissors, Trash2, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { addWaitListEntry, deleteWaitListEntry, updateWaitListStatus } from "@/server/wait_list";

const statusColors: Record<string, string> = {
  waiting: "bg-yellow-100 text-yellow-700",
  contacted: "bg-blue-100 text-blue-700",
  booked: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-400",
};

interface WaitlistEntry {
  id: string;
  client_id: string;
  service_id: string | null;
  preferred_staff_id?: string | null;
  preferred_date_start?: string | null;
  preferred_date_end?: string | null;
  preferred_time_start?: string | null;
  preferred_time_end?: string | null;
  notes: string | null;
  status: string;
  created_at: Date | string;
  clients: ClientRef | null;
  services: ServiceRef | null;
  staff?: StaffMember | null;
  pets?: { id: string; name: string; species?: string | null } | null;
}

export function WaitListManager({
  entries, clients, services, staff,
}: {
  entries: WaitlistEntry[];
  clients: ClientRef[];
  services: ServiceRef[];
  staff: StaffMember[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "", pet_id: "", service_id: "", preferred_staff_id: "",
    preferred_date_start: "", preferred_date_end: "",
    preferred_time_start: "", preferred_time_end: "", notes: "",
  });
  const router = useRouter();

  const selectedClient = clients.find((c: ClientRef) => c.id === form.client_id) ?? null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addWaitListEntry({
        client_id: form.client_id,
        pet_id: form.pet_id || null,
        service_id: form.service_id || null,
        preferred_staff_id: form.preferred_staff_id || null,
        preferred_date_start: form.preferred_date_start || null,
        preferred_date_end: form.preferred_date_end || null,
        preferred_time_start: form.preferred_time_start || null,
        preferred_time_end: form.preferred_time_end || null,
        notes: form.notes || null,
      });
      toast.success("Added to wait list");
      setOpen(false);
      setForm({ client_id: "", pet_id: "", service_id: "", preferred_staff_id: "", preferred_date_start: "", preferred_date_end: "", preferred_time_start: "", preferred_time_end: "", notes: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    try {
      await updateWaitListStatus(id, status);
      toast.success(`Status → ${status}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWaitListEntry(id);
      toast.success("Removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const active = entries.filter((e) => e.status !== "cancelled" && e.status !== "booked");
  const resolved = entries.filter((e) => e.status === "cancelled" || e.status === "booked");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{active.length} waiting</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
            <Plus size={16} className="mr-1" /> Add to Wait List
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Wait List</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v ?? "", pet_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(selectedClient?.pets?.length ?? 0) > 0 && (
                <div>
                  <Label>Pet</Label>
                  <Select value={form.pet_id} onValueChange={(v) => setForm({ ...form, pet_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
                    <SelectContent>
                      {(selectedClient?.pets ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Service</Label>
                  <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred Groomer</Label>
                  <Select value={form.preferred_staff_id} onValueChange={(v) => setForm({ ...form, preferred_staff_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Date From</Label><Input type="date" value={form.preferred_date_start} onChange={(e) => setForm({ ...form, preferred_date_start: e.target.value })} /></div>
                <div><Label>Date To</Label><Input type="date" value={form.preferred_date_end} onChange={(e) => setForm({ ...form, preferred_date_end: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Time From</Label><Input type="time" value={form.preferred_time_start} onChange={(e) => setForm({ ...form, preferred_time_start: e.target.value })} /></div>
                <div><Label>Time To</Label><Input type="time" value={form.preferred_time_end} onChange={(e) => setForm({ ...form, preferred_time_end: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Saving..." : "Add to Wait List"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {active.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Wait list is empty</p>
      ) : (
        <div className="space-y-3">
          {active.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{entry.clients?.first_name} {entry.clients?.last_name}</span>
                    <Badge className={statusColors[entry.status] ?? ""}>{entry.status}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                    {entry.pets && <span className="flex items-center gap-1"><PawPrint size={11} /> {entry.pets.name}</span>}
                    {entry.services && <span className="flex items-center gap-1"><Scissors size={11} /> {entry.services.name}</span>}
                    {entry.clients?.phone && <span className="flex items-center gap-1"><Phone size={11} /> {entry.clients.phone}</span>}
                    {entry.preferred_date_start && <span className="flex items-center gap-1"><Clock size={11} /> {entry.preferred_date_start}{entry.preferred_date_end ? ` to ${entry.preferred_date_end}` : ""}</span>}
                  </div>
                  {entry.notes && <p className="mt-1 text-xs text-gray-400">{entry.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {entry.status === "waiting" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(entry.id, "contacted")}>Contacted</Button>
                  )}
                  <Button size="sm" className="h-7 bg-green-500 text-xs text-white hover:bg-green-600" onClick={() => updateStatus(entry.id, "booked")}>
                    <CalendarCheck size={12} className="mr-1" /> Book
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(entry.id)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h3 className="mb-2 mt-6 text-xs font-bold uppercase text-gray-400">Resolved ({resolved.length})</h3>
          <div className="space-y-2 opacity-60">
            {resolved.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm text-gray-500">{entry.clients?.first_name} {entry.clients?.last_name}</span>
                  <Badge className={statusColors[entry.status] ?? ""}>{entry.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
