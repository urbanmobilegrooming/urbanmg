"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, DollarSign, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createCategory, createService, updateService } from "@/server/services";

type Category = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

type ServicePricing = {
  id: string;
  service_id: string;
  size_category: string;
  price: number;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  base_price: number | null;
  is_active: boolean;
  category_id: string | null;
  service_categories: { id: string; name: string; color: string } | null;
  service_pricing: ServicePricing[];
};

const SIZE_LABELS: Record<string, string> = {
  small: "S (0-25 lbs)",
  medium: "M (26-50 lbs)",
  large: "L (51-80 lbs)",
  xl: "XL (81+ lbs)",
};

export function ServicesManager({
  categories: initialCategories,
  services: initialServices,
}: {
  categories: Category[];
  services: Service[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [services, setServices] = useState(initialServices);
  const [openService, setOpenService] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    duration_minutes: "60",
    base_price: "",
    is_active: true,
  });
  const router = useRouter();

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      const cat = await createCategory({
        name: form.get("name") as string,
        color: (form.get("color") as string) || "#f2c037",
      });
      setCategories([...categories, cat]);
      setOpenCategory(false);
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleCreateService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const categoryId = (form.get("category_id") as string) || null;
    const pricingRows = ["small", "medium", "large", "xl"]
      .map((size) => {
        const price = form.get(`price_${size}`) as string;
        return price ? { size_category: size, price: parseFloat(price) } : null;
      })
      .filter((p): p is { size_category: string; price: number } => p !== null);

    try {
      const svc = await createService({
        name: form.get("name") as string,
        description: (form.get("description") as string) || null,
        duration_minutes: parseInt(form.get("duration_minutes") as string) || 60,
        category_id: categoryId,
        pricing: pricingRows,
      });
      setServices([...services, svc as Service]);
      setOpenService(false);
      toast.success("Service created");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  function openEditServiceDialog(svc: Service) {
    setEditService(svc);
    setEditForm({
      name: svc.name,
      duration_minutes: String(svc.duration_minutes),
      base_price: svc.base_price != null ? String(svc.base_price) : "",
      is_active: svc.is_active,
    });
    setEditOpen(true);
  }

  async function handleEditService(e: React.FormEvent) {
    e.preventDefault();
    if (!editService) return;
    setSaving(true);

    const updates = {
      name: editForm.name,
      duration_minutes: parseInt(editForm.duration_minutes) || 60,
      base_price: editForm.base_price ? parseFloat(editForm.base_price) : null,
      is_active: editForm.is_active,
    };

    try {
      await updateService(editService.id, updates);
      setServices(services.map((s) => (s.id === editService.id ? { ...s, ...updates } : s)));
      setEditOpen(false);
      setEditService(null);
      toast.success("Service updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Categories</CardTitle>
          <Dialog open={openCategory} onOpenChange={setOpenCategory}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              <Plus className="mr-1 h-4 w-4" /> Add Category
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="cat_name">Name *</Label>
                  <Input id="cat_name" name="name" required placeholder="e.g., Full Grooming" />
                </div>
                <div>
                  <Label htmlFor="cat_color">Color</Label>
                  <Input id="cat_color" name="color" type="color" defaultValue="#f2c037" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenCategory(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#411992]">{saving ? "Saving..." : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">No categories yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat.id} style={{ backgroundColor: cat.color + "20", color: cat.color, borderColor: cat.color + "40" }} className="border px-3 py-1 text-sm font-medium">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Services ({services.length})</CardTitle>
          <Dialog open={openService} onOpenChange={setOpenService}>
            <DialogTrigger render={<Button size="sm" className="bg-[#2C0F73] hover:bg-[#411992]" />}>
              <Plus className="mr-1 h-4 w-4" /> Add Service
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>New Service</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="svc_name">Name *</Label>
                    <Input id="svc_name" name="name" required placeholder="e.g., Full Groom" />
                  </div>
                  <div>
                    <Label htmlFor="svc_category">Category</Label>
                    <Select name="category_id">
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="svc_desc">Description</Label>
                  <Textarea id="svc_desc" name="description" rows={2} />
                </div>
                <div>
                  <Label htmlFor="svc_duration">Duration (minutes) *</Label>
                  <Input id="svc_duration" name="duration_minutes" type="number" defaultValue={60} required />
                </div>
                <div>
                  <Label className="mb-2 block">Pricing by Size</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(SIZE_LABELS).map(([key, label]) => (
                      <div key={key}>
                        <Label htmlFor={`price_${key}`} className="text-xs text-gray-500">{label}</Label>
                        <Input id={`price_${key}`} name={`price_${key}`} type="number" step="0.01" placeholder="$0.00" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenService(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#411992]">{saving ? "Saving..." : "Create Service"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No services yet. Add your first service!</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc) => (
                <div key={svc.id} className="rounded-xl border p-4 transition-colors hover:border-[#f2c037]/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                        {!svc.is_active && (<Badge variant="secondary" className="text-[10px] text-gray-400">Inactive</Badge>)}
                      </div>
                      {svc.description && (<p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{svc.description}</p>)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {svc.service_categories && (
                        <Badge style={{ backgroundColor: svc.service_categories.color + "20", color: svc.service_categories.color }} className="text-[10px]">
                          {svc.service_categories.name}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditServiceDialog(svc)} title="Edit service">
                        <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-[#2C0F73]" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{svc.duration_minutes} min</span>
                  </div>

                  {svc.service_pricing.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {svc.service_pricing
                        .sort((a, b) => {
                          const order = ["small", "medium", "large", "xl"];
                          return order.indexOf(a.size_category) - order.indexOf(b.size_category);
                        })
                        .map((p) => (
                          <Badge key={p.id} variant="secondary" className="text-[10px]">
                            <DollarSign className="mr-0.5 h-3 w-3" />
                            {p.size_category.charAt(0).toUpperCase()}: ${Number(p.price).toFixed(0)}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
          <form onSubmit={handleEditService} className="space-y-4">
            <div>
              <Label htmlFor="edit_svc_name">Name *</Label>
              <Input id="edit_svc_name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_svc_duration">Duration (min) *</Label>
                <Input id="edit_svc_duration" type="number" value={editForm.duration_minutes} onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit_svc_price">Base Price ($)</Label>
                <Input id="edit_svc_price" type="number" step="0.01" value={editForm.base_price} onChange={(e) => setEditForm({ ...editForm, base_price: e.target.value })} placeholder="0.00" />
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
              <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#411992]">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
