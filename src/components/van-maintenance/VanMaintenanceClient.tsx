"use client";

import { useState } from "react";
import { Plus, Truck, AlertTriangle, Wrench, Fuel, Database, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFuelLog, createMaintenance, deleteFuelLog, deleteMaintenance, updateVan, type VanRow } from "@/server/vans";

type Maint = { id: string; van_id: string; van_name: string; type: string; description: string | null; cost: number; mileage: number | null; performed_at: string; next_due_at: string | null; notes: string | null; created_at: string };
type Fuel = { id: string; van_id: string; van_name: string; date: string; gallons: number; cost: number; mileage: number | null; station: string | null; created_at: string };

const MAINT_TYPES = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tire", label: "Tire Service" },
  { value: "brake", label: "Brake Service" },
  { value: "inspection", label: "Inspection" },
  { value: "repair", label: "Repair" },
  { value: "cleaning", label: "Cleaning" },
  { value: "other", label: "Other" },
];

const VAN_STATUS: Record<string, { label: string; bg: string }> = {
  active: { label: "Active", bg: "bg-emerald-50 text-emerald-700" },
  in_maintenance: { label: "In Maintenance", bg: "bg-amber-50 text-amber-700" },
  needs_service: { label: "Needs Service", bg: "bg-red-50 text-red-700" },
};

export function VanMaintenanceClient({ vans, maintenance, fuel }: { vans: VanRow[]; maintenance: Maint[]; fuel: Fuel[] }) {
  const router = useRouter();
  const [showMaint, setShowMaint] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [showVanEdit, setShowVanEdit] = useState(false);
  const [editingVan, setEditingVan] = useState<VanRow | null>(null);
  const [vanForm, setVanForm] = useState({ status: "active", current_mileage: 0 });
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const totalMaintCost = maintenance.filter((l) => l.performed_at >= firstOfMonth).reduce((s, l) => s + l.cost, 0);
  const totalFuelCost = fuel.filter((l) => l.date >= firstOfMonth).reduce((s, l) => s + l.cost, 0);

  const blankMaint = { van_id: vans[0]?.id ?? "", type: "oil_change", description: "", cost: 0, mileage: null as number | null, performed_at: today.toISOString().split("T")[0], next_due_at: "", notes: "" };
  const blankFuel = { van_id: vans[0]?.id ?? "", date: today.toISOString().split("T")[0], gallons: 0, cost: 0, mileage: null as number | null, station: "" };
  const [maintForm, setMaintForm] = useState(blankMaint);
  const [fuelForm, setFuelForm] = useState(blankFuel);

  async function saveMaint() {
    if (!maintForm.van_id) {
      toast.warning("Select a van");
      return;
    }
    setSaving(true);
    try {
      await createMaintenance({ ...maintForm, next_due_at: maintForm.next_due_at || null });
      toast.success("Service logged");
      setShowMaint(false);
      setMaintForm(blankMaint);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveFuel() {
    if (!fuelForm.van_id || fuelForm.gallons <= 0 || fuelForm.cost <= 0) {
      toast.warning("Fill required fields");
      return;
    }
    setSaving(true);
    try {
      await createFuelLog(fuelForm);
      toast.success("Fuel logged");
      setShowFuel(false);
      setFuelForm(blankFuel);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function delMaint(id: string) {
    if (!confirm("Delete record?")) return;
    await deleteMaintenance(id);
    router.refresh();
  }

  async function delFuel(id: string) {
    if (!confirm("Delete record?")) return;
    await deleteFuelLog(id);
    router.refresh();
  }

  function openVanEdit(v: VanRow) {
    setEditingVan(v);
    setVanForm({ status: v.status, current_mileage: v.current_mileage ?? 0 });
    setShowVanEdit(true);
  }

  async function saveVanEdit() {
    if (!editingVan) return;
    setSaving(true);
    try {
      await updateVan(editingVan.id, vanForm);
      toast.success("Van updated");
      setShowVanEdit(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2C0F73]/50">Fleet Management</p>
          <h1 className="mt-0.5 text-2xl font-black text-[#1a0a3e]">Van Maintenance</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setFuelForm(blankFuel); setShowFuel(true); }}><Fuel className="mr-2 h-4 w-4" /> Log Fuel</Button>
          <Button className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105" onClick={() => { setMaintForm(blankMaint); setShowMaint(true); }}><Plus className="mr-2 h-4 w-4" /> Log Service</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Truck className="h-5 w-5 text-[#2C0F73]" />} bg="bg-[#2C0F73]/10" value={vans.filter((v) => v.status === "active").length} label="Active Vans" />
        <Kpi icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} bg="bg-amber-100" value={vans.filter((v) => v.status !== "active").length} label="Need Service" />
        <Kpi icon={<Wrench className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-100" value={`$${Math.round(totalMaintCost)}`} label="Maintenance Cost" />
        <Kpi icon={<Database className="h-5 w-5 text-sky-600" />} bg="bg-sky-100" value={`$${Math.round(totalFuelCost)}`} label="Fuel Cost" />
      </div>

      <Tabs defaultValue="vans">
        <TabsList>
          <TabsTrigger value="vans">Van Fleet ({vans.length})</TabsTrigger>
          <TabsTrigger value="maintenance">Service Log ({maintenance.length})</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Log ({fuel.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vans">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {vans.map((van) => (
              <div key={van.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[.04]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2C0F73] text-white"><Truck className="h-5 w-5" /></div>
                    <div>
                      <p className="text-base font-black text-gray-900">{van.name}</p>
                      <p className="text-xs text-gray-400">{van.year ?? ""} {van.make ?? ""} {van.model ?? ""} {van.license_plate && `· ${van.license_plate}`}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${VAN_STATUS[van.status]?.bg ?? "bg-gray-50 text-gray-700"}`}>{VAN_STATUS[van.status]?.label ?? van.status}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Info label="Mileage" value={`${(van.current_mileage ?? 0).toLocaleString()} mi`} />
                  <Info label="Insurance" value={van.insurance_expiry ?? "Not set"} />
                  <Info label="Last Oil Change" value={van.last_oil_change ?? "Not recorded"} />
                  <Info label="Last Inspection" value={van.last_inspection ?? "Not recorded"} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-[#2C0F73]/20 text-[#2C0F73]" onClick={() => { setMaintForm({ ...blankMaint, van_id: van.id }); setShowMaint(true); }}><Plus className="mr-1 h-3 w-3" /> Log Service</Button>
                  <Button size="icon-sm" variant="outline" onClick={() => openVanEdit(van)}><Pencil className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            {vans.length === 0 && <div className="col-span-full py-16 text-center text-sm text-gray-400">No vans found</div>}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="mt-4 space-y-3">
            {maintenance.map((log) => (
              <div key={log.id} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[.04]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"><Wrench className="h-4 w-4 text-amber-600" /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{MAINT_TYPES.find((t) => t.value === log.type)?.label ?? log.type}</p>
                  {log.description && <p className="text-xs text-gray-500">{log.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-gray-400">
                    <span>{log.van_name}</span>
                    <span>{log.performed_at}</span>
                    {log.mileage && <span>{log.mileage.toLocaleString()} mi</span>}
                    {log.next_due_at && <span className="text-amber-500">Next: {log.next_due_at}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-gray-900">${log.cost.toFixed(2)}</p>
                  <button onClick={() => delMaint(log.id)} className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
            {maintenance.length === 0 && <div className="py-16 text-center text-sm text-gray-400">No service records yet</div>}
          </div>
        </TabsContent>

        <TabsContent value="fuel">
          <div className="mt-4 space-y-2">
            {fuel.map((log) => (
              <div key={log.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[.04]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50"><Database className="h-4 w-4 text-sky-600" /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{log.gallons} gal {log.station && <span className="text-xs text-gray-500">· {log.station}</span>}</p>
                  <div className="flex flex-wrap gap-x-3 text-[11px] text-gray-400">
                    <span>{log.van_name}</span>
                    <span>{log.date}</span>
                    {log.mileage && <span>{log.mileage.toLocaleString()} mi</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">${log.cost.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">${(log.cost / log.gallons).toFixed(2)}/gal</p>
                </div>
                <button onClick={() => delFuel(log.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            {fuel.length === 0 && <div className="py-16 text-center text-sm text-gray-400">No fuel logs yet</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showMaint} onOpenChange={setShowMaint}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Service</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Van *</Label>
              <Select value={maintForm.van_id} onValueChange={(v: string | null) => setMaintForm({ ...maintForm, van_id: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select van" /></SelectTrigger>
                <SelectContent>{vans.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Service Type *</Label>
              <Select value={maintForm.type} onValueChange={(v: string | null) => setMaintForm({ ...maintForm, type: v ?? "other" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{MAINT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={maintForm.performed_at} onChange={(e) => setMaintForm({ ...maintForm, performed_at: e.target.value })} /></div>
              <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={maintForm.cost} onChange={(e) => setMaintForm({ ...maintForm, cost: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Mileage</Label><Input type="number" value={maintForm.mileage ?? ""} onChange={(e) => setMaintForm({ ...maintForm, mileage: e.target.value ? parseInt(e.target.value) : null })} /></div>
              <div><Label>Next Due</Label><Input type="date" value={maintForm.next_due_at} onChange={(e) => setMaintForm({ ...maintForm, next_due_at: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Input value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={maintForm.notes} onChange={(e) => setMaintForm({ ...maintForm, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowMaint(false)}>Cancel</Button>
              <Button disabled={saving} onClick={saveMaint} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">Save Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFuel} onOpenChange={setShowFuel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Fuel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Van *</Label>
              <Select value={fuelForm.van_id} onValueChange={(v: string | null) => setFuelForm({ ...fuelForm, van_id: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select van" /></SelectTrigger>
                <SelectContent>{vans.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} /></div>
              <div><Label>Gallons *</Label><Input type="number" step="0.1" value={fuelForm.gallons} onChange={(e) => setFuelForm({ ...fuelForm, gallons: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Total Cost *</Label><Input type="number" step="0.01" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Mileage</Label><Input type="number" value={fuelForm.mileage ?? ""} onChange={(e) => setFuelForm({ ...fuelForm, mileage: e.target.value ? parseInt(e.target.value) : null })} /></div>
            </div>
            <div><Label>Gas Station</Label><Input value={fuelForm.station} onChange={(e) => setFuelForm({ ...fuelForm, station: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowFuel(false)}>Cancel</Button>
              <Button disabled={saving} onClick={saveFuel} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">Log Fuel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVanEdit} onOpenChange={setShowVanEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit: {editingVan?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Status</Label>
              <Select value={vanForm.status} onValueChange={(v: string | null) => setVanForm({ ...vanForm, status: v ?? "active" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in_maintenance">In Service</SelectItem>
                  <SelectItem value="needs_service">Needs Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Current Mileage</Label><Input type="number" value={vanForm.current_mileage} onChange={(e) => setVanForm({ ...vanForm, current_mileage: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowVanEdit(false)}>Cancel</Button>
              <Button disabled={saving} onClick={saveVanEdit} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon, value, label, bg }: { icon: React.ReactNode; value: React.ReactNode; label: string; bg: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[.04]">
      <div className={`inline-flex items-center justify-center rounded-xl p-2.5 ${bg}`}>{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-2">{label}</p>
      <p className="mt-0.5 text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-gray-700">{value}</p>
    </div>
  );
}
