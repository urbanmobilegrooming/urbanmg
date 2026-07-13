"use client";

import { useMemo, useState } from "react";
import { Gift, Heart, Megaphone, RefreshCw, Send, UserMinus, Plus, Calendar, MessageCircle, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCampaign } from "@/server/marketing";

type BirthdayPet = { id: string; name: string; breed: string | null; birth_date: string | null; owner_name: string; owner_phone: string | null; owner_email: string | null; daysUntil: number };
type RebookClient = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null; last_visit: string | null; daysSince: number; contacted?: boolean };
type Campaign = { id: string; name: string; description: string | null; discount: string | null; audience: string; start_date: string | null; end_date: string | null; color: string | null; icon: string | null };

const AUDIENCE: Record<string, string> = { all: "All Clients", inactive: "Inactive 60+ days", new: "New Clients", zip: "Specific Zip Codes" };

export function MarketingClient({ birthdays, rebook: initialRebook, campaigns }: { birthdays: BirthdayPet[]; rebook: RebookClient[]; campaigns: Campaign[] }) {
  const [rebook, setRebook] = useState(initialRebook.map((c) => ({ ...c, contacted: false })));
  const [threshold, setThreshold] = useState(45);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", discount: "", audience: "all", start_date: "", end_date: "" });

  const upcoming = useMemo(() => birthdays.filter((p) => p.daysUntil >= 0 && p.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil), [birthdays]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    return birthdays.filter((p) => p.birth_date && new Date(p.birth_date + "T00:00:00").getMonth() === now.getMonth()).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [birthdays]);
  const rebookFiltered = useMemo(() => rebook.filter((c) => c.daysSince >= threshold).sort((a, b) => b.daysSince - a.daysSince), [rebook, threshold]);
  const contactedCount = rebook.filter((c) => c.contacted).length;

  function whatsapp(phone: string | null, msg: string) {
    const p = (phone ?? "").replace(/\D/g, "");
    return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
  }

  function markContacted(id: string) {
    setRebook((cs) => cs.map((c) => (c.id === id ? { ...c, contacted: true } : c)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createCampaign(form);
      toast.success("Campaign created");
      setOpen(false);
      setForm({ name: "", description: "", discount: "", audience: "all", start_date: "", end_date: "" });
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
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Marketing</h1>
          <p className="mt-0.5 text-sm text-gray-500">Birthdays, campaigns, and rebook reminders</p>
        </div>
        <Button onClick={() => setOpen(true)} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi icon={<Heart className="h-5 w-5 text-pink-500" />} bg="bg-pink-50" value={thisMonth.length} label="Birthdays This Month" />
        <Kpi icon={<Megaphone className="h-5 w-5 text-[#f2c037]" />} bg="bg-[#f2c037]/15" value={campaigns.length} label="Active Campaigns" />
        <Kpi icon={<UserMinus className="h-5 w-5 text-orange-500" />} bg="bg-orange-50" value={rebookFiltered.length} label="Need Rebook" />
        <Kpi icon={<Send className="h-5 w-5 text-green-500" />} bg="bg-green-50" value={contactedCount} label="Contacted" />
      </div>

      <Tabs defaultValue="birthdays">
        <TabsList>
          <TabsTrigger value="birthdays">Birthday Reminders ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="rebook">Rebook Reminders ({rebookFiltered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="birthdays">
          <div className="space-y-4 py-4">
            {upcoming.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No upcoming pet birthdays</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((pet) => (
                  <div key={pet.id} className="flex items-center gap-4 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-pink-50">
                      <Gift className="h-5 w-5 text-pink-400" />
                      <span className="text-[9px] font-bold text-pink-400">{pet.daysUntil === 0 ? "TODAY" : pet.daysUntil === 1 ? "TMR" : `${pet.daysUntil}d`}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{pet.name}</span>
                        {pet.breed && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{pet.breed}</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">Owner: {pet.owner_name} {pet.owner_phone && ` · ${pet.owner_phone}`}</div>
                    </div>
                    {pet.owner_phone && (
                      <a href={whatsapp(pet.owner_phone, `Happy Birthday to ${pet.name}!`)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {campaigns.map((camp) => (
              <div key={camp.id} className={`rounded-2xl border p-5 ${camp.color ?? "bg-purple-50 border-purple-200"}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900">{camp.name}</div>
                    <div className="text-xs text-gray-500">{AUDIENCE[camp.audience] ?? camp.audience}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-gray-700">{camp.discount}</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-gray-600">{camp.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" /> {camp.start_date} – {camp.end_date}
                  </div>
                  <Button size="sm" className="bg-[#2C0F73] hover:bg-[#3d1a99]" onClick={() => toast.info(`Launch "${camp.name}"`)}>
                    <Send className="mr-1 h-3 w-3" /> Launch
                  </Button>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && <div className="col-span-full py-16 text-center text-sm text-gray-400">No campaigns yet</div>}
          </div>
        </TabsContent>

        <TabsContent value="rebook">
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Show clients inactive for:</span>
              {[30, 45, 60, 90].map((d) => (
                <button key={d} onClick={() => setThreshold(d)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${threshold === d ? "border-[#2C0F73] bg-[#2C0F73] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>{d}+ days</button>
              ))}
            </div>

            {rebookFiltered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No clients inactive for {threshold}+ days</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {rebookFiltered.map((client) => (
                  <div key={client.id} className={`flex items-center gap-4 border-b border-gray-50 px-5 py-4 ${client.contacted ? "bg-green-50/50 opacity-70" : "hover:bg-gray-50"}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-black text-orange-500">
                      {((client.first_name?.[0] ?? "") + (client.last_name?.[0] ?? "")).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900">{client.first_name} {client.last_name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${client.daysSince >= 90 ? "bg-red-100 text-red-700" : client.daysSince >= 60 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>{client.daysSince} days ago</span>
                        {client.contacted && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700"><Check className="mr-0.5 inline h-3 w-3" />Contacted</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">{client.last_visit ? `Last visit: ${new Date(client.last_visit).toLocaleDateString()}` : "No visit on record"}</div>
                    </div>
                    {!client.contacted && (
                      <div className="flex gap-2">
                        {client.phone && (
                          <a href={whatsapp(client.phone, `Hi ${client.first_name}, we miss you!`)} target="_blank" rel="noreferrer" onClick={() => markContacted(client.id)} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white">
                            <MessageCircle className="h-4 w-4" /> Send
                          </a>
                        )}
                        <Button size="sm" variant="outline" onClick={() => markContacted(client.id)}>
                          <Check className="mr-1 h-3 w-3" /> Done
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount *</Label>
                <Input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} required />
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v: string | null) => setForm({ ...form, audience: v ?? "all" })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AUDIENCE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#3d1a99]">{saving ? "Saving..." : "Create Campaign"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon, value, label, bg }: { icon: React.ReactNode; value: React.ReactNode; label: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div className="mt-3 text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
