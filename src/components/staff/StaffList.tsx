"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus, Truck, Percent, Phone, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createStaff, updateStaff } from "@/server/staff";

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  color: string;
  commission_rate: number;
  is_active: boolean;
}

export function StaffList({ staff: initialStaff }: { staff: Staff[] }) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    role: "groomer",
    phone: "",
    email: "",
    color: "#f2c037",
    commission_rate: 0,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    role: "groomer",
    commission_rate: 0,
    color: "#f2c037",
    is_active: true,
  });
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createStaff({
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role,
        phone: form.phone || null,
        email: form.email || null,
        color: form.color,
        commission_rate: form.commission_rate,
      });
      toast.success("Staff member added");
      setOpen(false);
      setForm({ first_name: "", last_name: "", role: "groomer", phone: "", email: "", color: "#f2c037", commission_rate: 0 });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  function openEditDialog(member: Staff) {
    setEditStaff(member);
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone ?? "",
      email: member.email ?? "",
      role: member.role,
      commission_rate: member.commission_rate,
      color: member.color,
      is_active: member.is_active,
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStaff) return;
    setSaving(true);

    const updates = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone || null,
      email: editForm.email || null,
      role: editForm.role,
      commission_rate: editForm.commission_rate,
      color: editForm.color,
      is_active: editForm.is_active,
    };

    try {
      await updateStaff(editStaff.id, updates);
      setStaffList(staffList.map((s) => (s.id === editStaff.id ? { ...s, ...updates } : s)));
      setEditOpen(false);
      setEditStaff(null);
      toast.success("Staff member updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  const vanMap: Record<string, string> = {};
  staffList.forEach((s) => {
    if (s.first_name === "Erick") vanMap[s.id] = "Van 5";
    if (s.first_name === "Nelzareth") vanMap[s.id] = "Van 7";
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{staffList.length} team member{staffList.length !== 1 ? "s" : ""}</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
            <Plus size={16} className="mr-1" /> Add Staff
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required /></div>
                <div><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "groomer" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groomer">Groomer</SelectItem>
                      <SelectItem value="bather">Bather</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Commission %</Label><Input type="number" min={0} max={100} value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border" />
                  <span className="text-sm text-gray-400">{form.color}</span>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Saving..." : "Add Staff Member"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {staffList.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No staff members yet</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((s) => (
            <div key={s.id} className="relative">
              <Link href={`/dashboard/staff/${s.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="h-1.5" style={{ backgroundColor: s.color }} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: s.color }}>
                        {s.first_name[0]}
                        {s.last_name?.[0] ?? ""}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-900">{s.first_name} {s.last_name}</h3>
                        <Badge variant="secondary" className="mt-0.5 capitalize">{s.role}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Percent size={14} />
                        <span>{s.commission_rate}% commission</span>
                      </div>
                      {vanMap[s.id] && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Truck size={14} />
                          <span>{vanMap[s.id]}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone size={14} />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail size={14} />
                          <span>{s.email}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Button variant="ghost" size="icon-sm" className="absolute right-2 top-4 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditDialog(s); }} title="Edit staff member">
                <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-[#2C0F73]" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Staff Member</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>First Name *</Label><Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} required /></div>
              <div><Label>Last Name</Label><Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v ?? "groomer" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groomer">Groomer</SelectItem>
                    <SelectItem value="bather">Bather</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Commission %</Label><Input type="number" min={0} max={100} value={editForm.commission_rate} onChange={(e) => setEditForm({ ...editForm, commission_rate: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border" />
                <span className="text-sm text-gray-400">{editForm.color}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#2C0F73] focus:ring-[#2C0F73]" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
