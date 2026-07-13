"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProduct, deleteProduct } from "@/server/products";
import { createAddon, deleteAddon } from "@/server/services";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number | null;
  stock: number;
  category: string | null;
  description: string | null;
  is_active: boolean;
}

interface ProductAddon {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  service_id: string | null;
  is_active: boolean;
}

export function ProductsManager({ products, addons }: { products: Product[]; addons: ProductAddon[] }) {
  const [productOpen, setProductOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", description: "", sku: "", price: 0, cost: 0, stock: 0, category: "" });
  const [addonForm, setAddonForm] = useState({ name: "", price: 0, duration_minutes: 0 });
  const router = useRouter();

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createProduct({
        name: productForm.name,
        description: productForm.description || null,
        sku: productForm.sku || null,
        price: productForm.price,
        cost: productForm.cost,
        stock: productForm.stock,
        category: productForm.category || null,
      });
      toast.success("Product added");
      setProductOpen(false);
      setProductForm({ name: "", description: "", sku: "", price: 0, cost: 0, stock: 0, category: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleCreateAddon(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAddon({
        name: addonForm.name,
        price: addonForm.price,
        duration_minutes: addonForm.duration_minutes,
      });
      toast.success("Add-on created");
      setAddonOpen(false);
      setAddonForm({ name: "", price: 0, duration_minutes: 0 });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleDeleteProduct(id: string) {
    try { await deleteProduct(id); toast.success("Deleted"); router.refresh(); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  }
  async function handleDeleteAddon(id: string) {
    try { await deleteAddon(id); toast.success("Deleted"); router.refresh(); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <Tabs defaultValue="addons">
      <TabsList>
        <TabsTrigger value="addons"><Sparkles size={14} className="mr-1" /> Add-ons ({addons.length})</TabsTrigger>
        <TabsTrigger value="products"><Package size={14} className="mr-1" /> Products ({products.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="addons" className="mt-4 space-y-3">
        <div className="flex justify-end">
          <Dialog open={addonOpen} onOpenChange={setAddonOpen}>
            <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
              <Plus size={16} className="mr-1" /> New Add-on
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Service Add-on</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateAddon} className="space-y-4">
                <div><Label>Name *</Label><Input value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} required placeholder="e.g. Teeth Brushing, Nail Grinding" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Price *</Label><Input type="number" step="0.01" value={addonForm.price} onChange={(e) => setAddonForm({ ...addonForm, price: Number(e.target.value) })} required /></div>
                  <div><Label>Duration (min)</Label><Input type="number" value={addonForm.duration_minutes} onChange={(e) => setAddonForm({ ...addonForm, duration_minutes: Number(e.target.value) })} /></div>
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Creating..." : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {addons.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No add-ons yet</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((a: ProductAddon) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="text-sm font-bold text-gray-900">{a.name}</span>
                    <div className="mt-0.5 text-xs text-gray-400">{a.duration_minutes}min</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#f2c037]">${a.price}</span>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteAddon(a.id)} className="h-7 text-red-400"><Trash2 size={12} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="products" className="mt-4 space-y-3">
        <div className="flex justify-end">
          <Dialog open={productOpen} onOpenChange={setProductOpen}>
            <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
              <Plus size={16} className="mr-1" /> New Product
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div><Label>Name *</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                <div><Label>Description</Label><Input value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div><Label>Price *</Label><Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} required /></div>
                  <div><Label>Cost</Label><Input type="number" step="0.01" value={productForm.cost} onChange={(e) => setProductForm({ ...productForm, cost: Number(e.target.value) })} /></div>
                  <div><Label>Stock</Label><Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>SKU</Label><Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} /></div>
                  <div><Label>Category</Label><Input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} /></div>
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Adding..." : "Add Product"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No products yet</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p: Product) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-gray-900">{p.name}</span>
                      {p.sku && <span className="ml-2 text-xs text-gray-400">#{p.sku}</span>}
                      {p.description && <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{p.description}</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(p.id)} className="h-7 text-red-400"><Trash2 size={12} /></Button>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">${p.price}</span>
                    {(p.cost ?? 0) > 0 && <span className="text-xs text-gray-400">Cost: ${(p.cost ?? 0)}</span>}
                    <Badge variant="secondary">{p.stock} in stock</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
