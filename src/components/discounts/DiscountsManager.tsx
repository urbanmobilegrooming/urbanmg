"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Tag, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  createDiscountCode,
  deleteDiscountCode,
  toggleDiscountActive,
} from "@/server/discounts";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export function DiscountsManager({ codes }: { codes: DiscountCode[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", value: 0, min_order_amount: 0, max_uses: "", valid_from: "", valid_until: "" });
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDiscountCode({
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.value,
        min_order_amount: form.min_order_amount,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      });
      toast.success("Discount code created");
      setOpen(false);
      setForm({ code: "", type: "percentage", value: 0, min_order_amount: 0, max_uses: "", valid_from: "", valid_until: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await toggleDiscountActive(id, current);
      toast.success(current ? "Deactivated" : "Activated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDiscountCode(id);
      toast.success("Deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
            <Plus size={16} className="mr-1" /> New Code
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Discount Code</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="e.g. WELCOME20" className="uppercase" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? "percentage" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed ($)</SelectItem>
                      <SelectItem value="credit">Credit ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Value *</Label><Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Min Order</Label><Input type="number" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} /></div>
                <div><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Valid From</Label><Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} /></div>
                <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Creating..." : "Create Code"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No discount codes yet</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {codes.map((c) => {
            const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
            const isMaxed = c.max_uses && c.used_count >= c.max_uses;
            return (
              <Card key={c.id} className={`overflow-hidden ${!c.is_active || isExpired || isMaxed ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-[#f2c037]" />
                      <span className="font-mono text-base font-bold text-gray-900">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-gray-300 hover:text-gray-500"><Copy size={12} /></button>
                    </div>
                    <Badge className={c.is_active && !isExpired && !isMaxed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}>
                      {isExpired ? "Expired" : isMaxed ? "Maxed" : c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#f2c037]">
                    {c.type === "percentage" ? `${c.value}%` : `$${c.value}`}
                    <span className="ml-1 text-xs font-normal text-gray-400">{c.type === "percentage" ? "off" : c.type}</span>
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-gray-400">
                    <div>Used: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</div>
                    {c.min_order_amount > 0 && <div>Min order: ${c.min_order_amount}</div>}
                    {c.valid_until && <div>Expires: {c.valid_until}</div>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleActive(c.id, c.is_active)}>
                      {c.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-400" onClick={() => handleDelete(c.id)}><Trash2 size={12} /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
