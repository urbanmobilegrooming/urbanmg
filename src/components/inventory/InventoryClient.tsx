"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, DollarSign, Warehouse, AlertTriangle, XCircle, Sliders, Bell } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustInventoryStock, createInventoryItem, deleteInventoryItem, updateInventoryItem, type InventoryItemRow } from "@/server/inventory";

const CATEGORIES = ["Shampoos", "Conditioners", "Cologne", "Tools", "Cleaning", "Medical", "Other"];

export function InventoryClient({ items: initialItems, vans }: { items: InventoryItemRow[]; vans: { id: string; name: string }[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showItem, setShowItem] = useState(false);
  const [editing, setEditing] = useState<InventoryItemRow | null>(null);
  const [form, setForm] = useState({ name: "", category: "Other", current_stock: 0, min_stock: 5, unit_cost: 0, unit: "unit", supplier: "", van_id: null as string | null });
  const [adjusting, setAdjusting] = useState<InventoryItemRow | null>(null);
  const [adjustForm, setAdjustForm] = useState<{ type: "add" | "use" | "adjust"; quantity: number; notes: string }>({ type: "add", quantity: 1, notes: "" });
  const [saving, setSaving] = useState(false);

  const lowStock = useMemo(() => items.filter((i) => i.current_stock <= i.min_stock && i.current_stock > 0), [items]);
  const outOfStock = useMemo(() => items.filter((i) => i.current_stock <= 0), [items]);
  const totalValue = items.reduce((s, i) => s + i.current_stock * i.unit_cost, 0);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", category: "Other", current_stock: 0, min_stock: 5, unit_cost: 0, unit: "unit", supplier: "", van_id: null });
    setShowItem(true);
  }

  function openEdit(item: InventoryItemRow) {
    setEditing(item);
    setForm({ name: item.name, category: item.category, current_stock: item.current_stock, min_stock: item.min_stock, unit_cost: item.unit_cost, unit: item.unit, supplier: item.supplier ?? "", van_id: item.van_id });
    setShowItem(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.warning("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateInventoryItem(editing.id, form);
        toast.success("Updated");
      } else {
        await createInventoryItem(form);
        toast.success("Added");
      }
      setShowItem(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: InventoryItemRow) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteInventoryItem(item.id);
      setItems((items) => items.filter((i) => i.id !== item.id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  function previewNew() {
    if (!adjusting) return 0;
    if (adjustForm.type === "add") return adjusting.current_stock + adjustForm.quantity;
    if (adjustForm.type === "use") return Math.max(0, adjusting.current_stock - adjustForm.quantity);
    return Math.max(0, adjustForm.quantity);
  }

  async function submitAdjust() {
    if (!adjusting) return;
    setSaving(true);
    try {
      const newStock = await adjustInventoryStock(adjusting.id, adjustForm.type, adjustForm.quantity, adjustForm.notes);
      setItems((items) => items.map((i) => (i.id === adjusting.id ? { ...i, current_stock: newStock } : i)));
      toast.success(`Stock updated to ${newStock}`);
      setAdjusting(null);
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2C0F73]/50">Supply Management</p>
          <h1 className="mt-0.5 text-2xl font-black text-[#1a0a3e] md:text-3xl">Inventory</h1>
        </div>
        <Button onClick={openAdd} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Warehouse className="h-5 w-5 text-[#2C0F73]" />} bg="bg-[#2C0F73]/10" value={items.length} label="Total Items" />
        <Kpi icon={<DollarSign className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-100" value={`$${Math.round(totalValue)}`} label="Total Value" />
        <Kpi icon={<AlertTriangle className="h-5 w-5 text-red-500" />} bg="bg-red-100" value={lowStock.length} label="Low Stock" valueClass={lowStock.length > 0 ? "text-red-500" : ""} />
        <Kpi icon={<XCircle className="h-5 w-5 text-amber-600" />} bg="bg-amber-100" value={outOfStock.length} label="Out of Stock" valueClass={outOfStock.length > 0 ? "text-amber-600" : ""} />
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-bold text-red-700">Reorder Alert — {lowStock.length} item{lowStock.length > 1 ? "s" : ""} below minimum</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStock.map((i) => (
                  <span key={i.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">{i.name} ({i.current_stock} {i.unit})</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStock.length})</TabsTrigger>
          {CATEGORIES.map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="all"><ItemGrid items={items} onEdit={openEdit} onDelete={remove} onAdjust={(i) => { setAdjusting(i); setAdjustForm({ type: "add", quantity: 1, notes: "" }); }} /></TabsContent>
        <TabsContent value="low"><ItemGrid items={lowStock} onEdit={openEdit} onDelete={remove} onAdjust={(i) => { setAdjusting(i); setAdjustForm({ type: "add", quantity: 1, notes: "" }); }} /></TabsContent>
        {CATEGORIES.map((c) => (
          <TabsContent key={c} value={c}><ItemGrid items={items.filter((i) => i.category === c)} onEdit={openEdit} onDelete={remove} onAdjust={(i) => { setAdjusting(i); setAdjustForm({ type: "add", quantity: 1, notes: "" }); }} /></TabsContent>
        ))}
      </Tabs>

      <Dialog open={showItem} onOpenChange={setShowItem}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Product Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v: string | null) => setForm({ ...form, category: v ?? "Other" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v: string | null) => setForm({ ...form, unit: v ?? "unit" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{["unit", "bottle", "box", "bag", "piece", "jar", "roll", "pair"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Current Stock</Label><Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Min Stock</Label><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Unit Cost ($)</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Assign to Van</Label>
              <Select value={form.van_id ?? "none"} onValueChange={(v: string | null) => setForm({ ...form, van_id: v === "none" ? null : v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All vans" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All vans</SelectItem>
                  {vans.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowItem(false)}>Cancel</Button>
            <Button disabled={saving} onClick={save} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">{saving ? "Saving..." : editing ? "Save Changes" : "Add Product"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adjust: {adjusting?.name}</DialogTitle></DialogHeader>
          {adjusting && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#2C0F73]/5 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#2C0F73]/60">Current Stock</p>
                <p className="mt-1 text-3xl font-black text-[#2C0F73]">{adjusting.current_stock} {adjusting.unit}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["add", "use", "adjust"] as const).map((t) => (
                  <button key={t} onClick={() => setAdjustForm({ ...adjustForm, type: t })} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition ${adjustForm.type === t ? "border-[#2C0F73] bg-[#2C0F73]/5 text-[#2C0F73]" : "border-gray-200 text-gray-500"}`}>
                    {t === "add" ? "Add Stock" : t === "use" ? "Use Stock" : "Set to"}
                  </button>
                ))}
              </div>
              <div><Label>Quantity</Label><Input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Notes</Label><Input value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} /></div>
              <div className="rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-500">New stock: <span className="ml-1 font-black text-gray-900">{previewNew()} {adjusting.unit}</span></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button>
                <Button disabled={saving} onClick={submitAdjust} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">Confirm</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon, value, label, bg, valueClass }: { icon: React.ReactNode; value: React.ReactNode; label: string; bg: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[.04]">
      <div className={`inline-flex items-center justify-center rounded-xl p-2.5 ${bg}`}>{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-2">{label}</p>
      <p className={`mt-0.5 text-2xl font-black ${valueClass ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function ItemGrid({ items, onEdit, onDelete, onAdjust }: { items: InventoryItemRow[]; onEdit: (i: InventoryItemRow) => void; onDelete: (i: InventoryItemRow) => void; onAdjust: (i: InventoryItemRow) => void }) {
  if (items.length === 0) return <div className="py-16 text-center text-sm text-gray-500">No items here</div>;
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[.04]">
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${item.current_stock <= 0 ? "bg-red-400" : item.current_stock <= item.min_stock ? "bg-amber-400" : "bg-emerald-400"}`} />
          <div className="flex items-start justify-between gap-2 pl-2">
            <div>
              <p className="text-sm font-bold text-gray-900">{item.name}</p>
              <p className="text-[10px] text-gray-400">{item.category}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-[#2C0F73]/10 hover:text-[#2C0F73]"><Pencil className="h-3 w-3" /></button>
              <button onClick={() => onDelete(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-2xl font-black ${item.current_stock <= 0 ? "text-red-500" : item.current_stock <= item.min_stock ? "text-amber-600" : "text-gray-900"}`}>{item.current_stock}</p>
                <p className="text-[10px] text-gray-400">{item.unit} · min {item.min_stock}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">${item.unit_cost.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">per {item.unit}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between pl-2">
            {item.van_name && <span className="rounded-full bg-[#2C0F73]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2C0F73]">{item.van_name}</span>}
            <button onClick={() => onAdjust(item)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#f2c037]/15 px-2.5 py-1 text-[11px] font-bold text-[#b8922a]"><Sliders className="h-3 w-3" />Adjust</button>
          </div>
        </div>
      ))}
    </div>
  );
}
