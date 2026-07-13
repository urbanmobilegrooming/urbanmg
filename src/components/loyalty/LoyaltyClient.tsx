"use client";

import { useMemo, useState } from "react";
import { Users, Gift, Crown, Share2, Cog, Pencil, Search, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustLoyaltyPoints, saveLoyaltySettings } from "@/server/loyalty";

type Client = { id: string; first_name: string; last_name: string; email: string | null; phone: string; loyalty_points: number; total_spent: number; visit_count: number };
type Referral = { id: string; referrer_name: string; referred_name: string; referred_email: string; bonus_points: number; created_at: string; status: string };
type Settings = { points_per_dollar: number; redemption_rate: number; welcome_bonus: number };

const TIERS = [
  { name: "Bronze", min: 0, max: 499, color: "bg-amber-100 text-amber-700" },
  { name: "Silver", min: 500, max: 999, color: "bg-gray-100 text-gray-600" },
  { name: "Gold", min: 1000, max: 99999999, color: "bg-yellow-100 text-yellow-700" },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points <= t.max) ?? TIERS[0];
}

export function LoyaltyClient({ clients: initial, referrals, settings: initialSettings }: { clients: Client[]; referrals: Referral[]; settings: Settings }) {
  const router = useRouter();
  const [clients, setClients] = useState(initial);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Client | null>(null);
  const [adjForm, setAdjForm] = useState({ type: "add", points: "", reason: "" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? clients.filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)) : clients;
  }, [clients, search]);

  const totalPoints = clients.reduce((s, c) => s + c.loyalty_points, 0);
  const goldCount = clients.filter((c) => c.loyalty_points >= 1000).length;

  async function apply() {
    if (!target || !adjForm.points || !adjForm.reason.trim()) return;
    const delta = parseInt(adjForm.points);
    if (isNaN(delta) || delta <= 0) return;
    setSaving(true);
    try {
      const newPts = await adjustLoyaltyPoints(target.id, adjForm.type as "add" | "deduct", delta);
      setClients((cs) => cs.map((c) => (c.id === target.id ? { ...c, loyalty_points: newPts } : c)));
      toast.success("Points updated");
      setTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettingsFn() {
    setSaving(true);
    try {
      await saveLoyaltySettings(settings);
      toast.success("Settings saved");
      setSettingsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Loyalty Program</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage points, tiers, and referrals</p>
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}><Cog className="mr-1 h-3 w-3" /> Program Settings</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi icon={<Users className="h-5 w-5 text-[#2C0F73]" />} bg="bg-[#2C0F73]/10" value={clients.length} label="Members" />
        <Kpi icon={<Gift className="h-5 w-5 text-[#f2c037]" />} bg="bg-[#f2c037]/15" value={totalPoints.toLocaleString()} label="Points Issued" />
        <Kpi icon={<Crown className="h-5 w-5 text-amber-500" />} bg="bg-amber-50" value={goldCount} label="Gold Members" />
        <Kpi icon={<Share2 className="h-5 w-5 text-green-500" />} bg="bg-green-50" value={referrals.length} label="Referrals" />
      </div>

      <div className="flex flex-wrap gap-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-sm">
            <Star className={tier.name === "Gold" ? "h-4 w-4 text-[#f2c037]" : tier.name === "Silver" ? "h-4 w-4 text-gray-400" : "h-4 w-4 text-amber-600"} />
            <span className="text-sm font-bold text-gray-700">{tier.name}</span>
            <span className="text-xs text-gray-400">{tier.max === 99999999 ? `${tier.min}+` : `${tier.min}–${tier.max}`} pts</span>
          </div>
        ))}
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Client Points</TabsTrigger>
          <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-9" />
            </div>
            {filtered.map((client) => (
              <div key={client.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2C0F73]/10 to-[#f2c037]/10 text-sm font-black text-[#2C0F73]">{((client.first_name?.[0] ?? "") + (client.last_name?.[0] ?? "")).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{client.first_name} {client.last_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTier(client.loyalty_points).color}`}>{getTier(client.loyalty_points).name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                    <span>{client.visit_count} visits</span>
                    <span>${Math.round(client.total_spent)} spent</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-[#2C0F73]">{client.loyalty_points.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">points</div>
                </div>
                <Button size="icon-sm" variant="outline" onClick={() => { setTarget(client); setAdjForm({ type: "add", points: "", reason: "" }); }}><Pencil className="h-3 w-3" /></Button>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No clients found</div>}
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <div className="space-y-3 py-2">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50"><Share2 className="h-4 w-4 text-green-500" /></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">{ref.referrer_name} <ArrowRight className="inline h-3 w-3 mx-1 text-gray-300" /> {ref.referred_name}</div>
                  <div className="text-xs text-gray-400">{ref.referred_email} · {new Date(ref.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#f2c037]">+{ref.bonus_points}</div>
                  <div className="text-[10px] text-gray-400">bonus pts</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${ref.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{ref.status}</span>
              </div>
            ))}
            {referrals.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No referrals yet</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adjust Points</DialogTitle></DialogHeader>
          {target && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="font-bold text-gray-900">{target.first_name} {target.last_name}</div>
                <div className="text-sm text-gray-500">Current: <span className="font-bold text-[#2C0F73]">{target.loyalty_points}</span> points</div>
              </div>
              <div><Label>Type</Label>
                <Select value={adjForm.type} onValueChange={(v: string | null) => setAdjForm({ ...adjForm, type: v ?? "add" })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Points</SelectItem>
                    <SelectItem value="deduct">Deduct Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Points *</Label><Input type="number" value={adjForm.points} onChange={(e) => setAdjForm({ ...adjForm, points: e.target.value })} /></div>
              <div><Label>Reason *</Label><Textarea value={adjForm.reason} onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
                <Button disabled={saving || !adjForm.points || !adjForm.reason.trim()} onClick={apply} className="bg-[#2C0F73] hover:bg-[#411992]">Apply</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Program Settings</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Points per Dollar Spent</Label><Input type="number" value={settings.points_per_dollar} onChange={(e) => setSettings({ ...settings, points_per_dollar: parseInt(e.target.value) || 1 })} /></div>
            <div><Label>Redemption Rate (points per $1)</Label><Input type="number" value={settings.redemption_rate} onChange={(e) => setSettings({ ...settings, redemption_rate: parseInt(e.target.value) || 100 })} /></div>
            <div><Label>Welcome Bonus</Label><Input type="number" value={settings.welcome_bonus} onChange={(e) => setSettings({ ...settings, welcome_bonus: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Close</Button>
              <Button disabled={saving} onClick={saveSettingsFn} className="bg-[#2C0F73] hover:bg-[#411992]">Save Settings</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon, value, label, bg }: { icon: React.ReactNode; value: React.ReactNode; label: string; bg: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div className="mt-3 text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
