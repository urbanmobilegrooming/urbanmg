"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addPhoto, deletePhoto } from "@/server/pets";

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string;
  caption: string | null;
  created_at: Date | string;
}

const typeColors: Record<string, string> = {
  before: "bg-blue-100 text-blue-700",
  after: "bg-green-100 text-green-700",
  general: "bg-gray-100 text-gray-600",
};

export function PetPhotos({ petId, photos }: { petId: string; photos: Photo[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ photo_url: "", photo_type: "general", caption: "" });
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addPhoto(petId, {
        photo_url: form.photo_url,
        photo_type: form.photo_type,
        caption: form.caption || null,
      });
      toast.success("Photo added");
      setOpen(false);
      setForm({ photo_url: "", photo_type: "general", caption: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await deletePhoto(id, petId);
      toast.success("Photo removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera size={16} /> Photos ({photos.length})
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
              <Plus size={14} className="mr-1" /> Add
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Photo</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div><Label>Photo URL *</Label><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} required placeholder="https://..." /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.photo_type} onValueChange={(v) => setForm({ ...form, photo_type: v ?? "general" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before</SelectItem>
                      <SelectItem value="after">After</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Caption</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
                <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Saving..." : "Add Photo"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No photos yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl border">
                <div className="aspect-square bg-gray-100 relative">
                  <Image src={p.photo_url} alt={p.caption ?? ""} fill className="object-cover" />
                </div>
                <div className="absolute left-2 top-2">
                  <Badge className={typeColors[p.photo_type] ?? "bg-gray-100 text-gray-600"}>
                    {p.photo_type}
                  </Badge>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute right-2 top-2 hidden rounded-full bg-red-500 p-1 text-white shadow group-hover:block"
                >
                  <Trash2 size={12} />
                </button>
                {p.caption && (
                  <div className="p-2">
                    <span className="text-xs text-gray-500">{p.caption}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
