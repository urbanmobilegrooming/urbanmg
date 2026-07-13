"use client";

import { useState } from "react";
import { Send, Star, Percent, Cog, List, Link as LinkIcon, Check, ExternalLink, Info, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logTestReview, saveReviewSettings } from "@/server/reviews";

type Settings = { auto_send: boolean; delay_hours: number; channel: string; template: string | null; google_review_link: string | null };
type Request = { id: string; sent_at: string; status: string; channel: string; clients: { first_name: string; last_name: string; phone: string | null; email: string | null } | null };

export function ReviewsClient({ settings: initial, requests }: { settings: Settings; requests: Request[] }) {
  const router = useRouter();
  const [settings, setSettings] = useState({ auto_send: initial.auto_send, delay_hours: initial.delay_hours, channel: initial.channel, template: initial.template ?? "", google_review_link: initial.google_review_link ?? "" });
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState("");

  const totalRequested = requests.length;
  const reviewed = requests.filter((r) => r.status === "reviewed").length;
  const clicked = requests.filter((r) => r.status === "clicked" || r.status === "reviewed").length;
  const conversionRate = totalRequested > 0 ? Math.round((clicked / totalRequested) * 100) : 0;

  function preview() {
    const link = settings.google_review_link || "https://g.page/r/your-review-link";
    return (settings.template ?? "").replace(/\{client_name\}/g, "Sarah Johnson").replace(/\{pet_name\}/g, "Bella").replace(/\{review_link\}/g, link);
  }

  async function save() {
    setSaving(true);
    try {
      await saveReviewSettings(settings);
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!testTo.trim()) return;
    setSaving(true);
    try {
      await logTestReview({ channel: settings.channel, body: preview(), recipient: testTo });
      toast.success("Test logged");
      setTestOpen(false);
      setTestTo("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Booster</h1>
        <p className="text-sm text-gray-500">Automatically request Google reviews from happy clients after each service</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<Send className="h-5 w-5 text-[#2C0F73]" />} value={totalRequested} label="Requests Sent" />
        <Kpi icon={<Star className="h-5 w-5 text-[#f2c037]" />} value={reviewed} label="Reviews Est." />
        <Kpi icon={<Percent className="h-5 w-5 text-green-600" />} value={`${conversionRate}%`} label="Conversion" />
        <Kpi icon={<Star className="h-5 w-5 text-[#f2c037]" />} value={totalRequested > 0 ? "4.8" : "—"} label="Avg Rating" />
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings"><Cog className="mr-1 h-3 w-3" />Auto-Send Settings</TabsTrigger>
          <TabsTrigger value="log"><List className="mr-1 h-3 w-3" />Request Log ({requests.length})</TabsTrigger>
          <TabsTrigger value="link"><LinkIcon className="mr-1 h-3 w-3" />Google Review Link</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="mt-4 max-w-2xl space-y-5">
            <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Auto-send review request after service</div>
                <div className="text-xs text-gray-500">Automatically send a review request when an appointment is marked complete</div>
              </div>
              <input type="checkbox" checked={settings.auto_send} onChange={(e) => setSettings({ ...settings, auto_send: e.target.checked })} className="h-5 w-5" />
            </div>
            <div>
              <Label>Send Delay</Label>
              <Select value={String(settings.delay_hours)} onValueChange={(v: string | null) => setSettings({ ...settings, delay_hours: parseInt(v ?? "0") })}>
                <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immediately after service</SelectItem>
                  <SelectItem value="1">1 hour after</SelectItem>
                  <SelectItem value="2">2 hours after</SelectItem>
                  <SelectItem value="24">24 hours after</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channel</Label>
              <div className="flex flex-wrap gap-2">
                {["whatsapp", "sms", "email"].map((ch) => (
                  <button key={ch} onClick={() => setSettings({ ...settings, channel: ch })} disabled={!settings.auto_send} className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${settings.channel === ch ? "border-[#2C0F73] bg-[#2C0F73]/5 text-[#2C0F73]" : "border-gray-200 text-gray-500"}`}>{ch}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Message Template</Label>
              <Textarea value={settings.template} onChange={(e) => setSettings({ ...settings, template: e.target.value })} rows={5} disabled={!settings.auto_send} />
              <p className="mt-1 text-[11px] text-gray-400">Variables: {"{client_name}"} {"{pet_name}"} {"{review_link}"}</p>
            </div>
            {settings.template && (
              <div>
                <Label>Message Preview</Label>
                <div className="rounded-xl bg-[#dcf8c6] px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap max-w-sm">{preview()}</div>
              </div>
            )}
            <div className="flex justify-end">
              <Button disabled={saving} onClick={save} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105"><Check className="mr-1 h-3 w-3" />Save Settings</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <div className="mt-4 space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    {r.channel === "whatsapp" ? <MessageCircle className="h-4 w-4 text-green-600" /> : <Send className="h-4 w-4 text-gray-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{r.clients?.first_name} {r.clients?.last_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs capitalize text-gray-500">{r.channel}</span>
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">{r.status}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.sent_at).toLocaleString()}</span>
              </div>
            ))}
            {requests.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No review requests yet</div>}
          </div>
        </TabsContent>

        <TabsContent value="link">
          <div className="mt-4 max-w-2xl space-y-5">
            <div className="rounded-2xl border-l-4 border-l-[#f2c037] border bg-white p-4 shadow-sm flex gap-3">
              <Info className="h-5 w-5 text-[#f2c037]" />
              <div className="text-sm text-gray-600">
                Go to your <a href="https://business.google.com" target="_blank" rel="noreferrer" className="text-blue-500 underline">Google Business Profile</a> and copy the review link.
              </div>
            </div>
            <div>
              <Label>Google Review URL</Label>
              <div className="flex gap-2">
                <Input value={settings.google_review_link} onChange={(e) => setSettings({ ...settings, google_review_link: e.target.value })} placeholder="https://g.page/r/..." />
                <Button variant="outline" onClick={() => setTestOpen(true)} disabled={!settings.google_review_link}><Send className="mr-1 h-3 w-3" /> Test Send</Button>
              </div>
              {settings.google_review_link && <a href={settings.google_review_link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 underline"><ExternalLink className="h-3 w-3" /> Open link</a>}
            </div>
            <div className="flex justify-end">
              <Button disabled={saving || !settings.google_review_link} onClick={save} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105"><Check className="mr-1 h-3 w-3" />Save Link</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Test Send</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Send to (phone or email)</Label><Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="+1 555 000 0000" /></div>
            <div className="rounded-xl bg-[#dcf8c6] px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{preview()}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button disabled={saving || !testTo} onClick={sendTest} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">Send Test</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
      <div className="mb-1 flex items-center justify-center">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
