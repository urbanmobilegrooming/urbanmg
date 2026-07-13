"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateBusiness, updateMyProfile } from "@/server/users";

interface ProfileInput {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BusinessInput {
  id: string;
  name: string;
  slug?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  timezone?: string;
  service_areas?: string[] | null;
  subscription_plan?: string;
}

export function SettingsForm({
  profile,
  business,
}: {
  profile: ProfileInput;
  business: BusinessInput | null;
}) {
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
  });
  const [bizForm, setBizForm] = useState({
    name: business?.name ?? "",
    phone: business?.phone ?? "",
    email: business?.email ?? "",
    website: business?.website ?? "",
    address: business?.address ?? "",
    city: business?.city ?? "",
    state: business?.state ?? "",
    zip: business?.zip ?? "",
    timezone: business?.timezone ?? "America/New_York",
    service_areas: (business?.service_areas ?? []).join(", "),
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({ full_name: profileForm.full_name, phone: profileForm.phone });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setSaving(true);
    try {
      await updateBusiness({
        id: business.id,
        name: bizForm.name,
        phone: bizForm.phone || null,
        email: bizForm.email || null,
        website: bizForm.website || null,
        address: bizForm.address || null,
        city: bizForm.city || null,
        state: bizForm.state || null,
        zip: bizForm.zip || null,
        timezone: bizForm.timezone,
        service_areas: bizForm.service_areas ? bizForm.service_areas.split(",").map((s) => s.trim()) : [],
      });
      toast.success("Business settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile"><User size={14} className="mr-1" /> Profile</TabsTrigger>
        {business && <TabsTrigger value="business"><Building2 size={14} className="mr-1" /> Business</TabsTrigger>}
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        <Card>
          <CardHeader><CardTitle>Your Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={profileForm.email} disabled className="bg-gray-50" /></div>
              </div>
              <div><Label>Phone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
              <Button type="submit" disabled={saving} className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">
                <Save size={14} className="mr-1" /> {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {business && (
        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Business Settings</CardTitle>
                <Badge className="bg-[#f2c037]/10 text-[#f2c037] capitalize">{business.subscription_plan}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveBusiness} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Business Name *</Label><Input value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} required /></div>
                  <div><Label>Website</Label><Input value={bizForm.website} onChange={(e) => setBizForm({ ...bizForm, website: e.target.value })} placeholder="https://..." /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Phone</Label><Input value={bizForm.phone} onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={bizForm.email} onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input value={bizForm.address} onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><Label>City</Label><Input value={bizForm.city} onChange={(e) => setBizForm({ ...bizForm, city: e.target.value })} /></div>
                  <div><Label>State</Label><Input value={bizForm.state} onChange={(e) => setBizForm({ ...bizForm, state: e.target.value })} /></div>
                  <div><Label>ZIP</Label><Input value={bizForm.zip} onChange={(e) => setBizForm({ ...bizForm, zip: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Timezone</Label>
                    <select value={bizForm.timezone} onChange={(e) => setBizForm({ ...bizForm, timezone: e.target.value })} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                    </select>
                  </div>
                  <div><Label>Service Areas</Label><Input value={bizForm.service_areas} onChange={(e) => setBizForm({ ...bizForm, service_areas: e.target.value })} placeholder="Comma separated" /></div>
                </div>
                <Button type="submit" disabled={saving} className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">
                  <Save size={14} className="mr-1" /> {saving ? "Saving..." : "Save Business Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
