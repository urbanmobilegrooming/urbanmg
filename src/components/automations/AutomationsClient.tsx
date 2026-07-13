"use client";

import { useMemo, useState } from "react";
import { Bell, FileEdit, List, Plus, Pencil, Trash2, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMessageTemplate, deleteMessageTemplate } from "@/server/messaging";
import { upsertReminderSetting } from "@/server/marketing";

type Template = { id: string; name: string; body: string; type: string; channel: string };
type MessageLog = { id: string; sent_at: Date | null; status: string; channel: string; body: string; clients: { id: string; first_name: string; last_name: string; phone: string | null } | null };
type Reminder = { id: string; type: string; enabled: boolean; hours_offset: number; template_id: string | null };

const DEFAULT_REMINDERS = [
  { type: "confirmation", hours_offset: 0 },
  { type: "reminder_24h", hours_offset: -24 },
  { type: "reminder_1h", hours_offset: -1 },
  { type: "followup", hours_offset: 2 },
  { type: "rebook", hours_offset: 720 },
  { type: "vaccine_expiry", hours_offset: -168 },
];

const REMINDER_LABELS: Record<string, { label: string; desc: string }> = {
  confirmation: { label: "Appointment Confirmation", desc: "Sent immediately when an appointment is booked" },
  reminder_24h: { label: "24-Hour Reminder", desc: "Sent 24 hours before the appointment" },
  reminder_1h: { label: "1-Hour Reminder", desc: "Sent 1 hour before the appointment" },
  followup: { label: "Post-Service Follow-up", desc: "Sent after the service is completed" },
  rebook: { label: "Rebook Reminder (30 days)", desc: "Sent 30 days after the last visit" },
  vaccine_expiry: { label: "Vaccine Expiry Alert", desc: "Sent 7 days before a vaccine expires" },
};

export function AutomationsClient({ templates, messages, reminders }: { templates: Template[]; messages: MessageLog[]; reminders: Reminder[] }) {
  const router = useRouter();
  const merged = useMemo(() => {
    const map = new Map(reminders.map((r) => [r.type, r]));
    return DEFAULT_REMINDERS.map((d) => map.get(d.type) ?? { id: "", type: d.type, enabled: false, hours_offset: d.hours_offset, template_id: null });
  }, [reminders]);
  const [settings, setSettings] = useState(merged);
  const [logSearch, setLogSearch] = useState("");
  const [logStatus, setLogStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", type: "reminder", body: "", channel: "whatsapp" });
  const [saving, setSaving] = useState(false);

  const waMessages = messages.filter((m) => m.channel === "whatsapp");
  const filteredLog = waMessages.filter((m) => {
    if (logSearch && !`${m.clients?.first_name ?? ""} ${m.clients?.last_name ?? ""}`.toLowerCase().includes(logSearch.toLowerCase())) return false;
    if (logStatus && m.status !== logStatus) return false;
    return true;
  });

  function preview(body: string) {
    return body
      .replace(/\{client_name\}/g, "Sarah Johnson")
      .replace(/\{pet_name\}/g, "Bella")
      .replace(/\{date\}/g, "Saturday, Mar 22")
      .replace(/\{time\}/g, "10:00 AM")
      .replace(/\{service\}/g, "Full Groom")
      .replace(/\{groomer\}/g, "Maria")
      .replace(/\{price\}/g, "$85");
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const s of settings) {
        await upsertReminderSetting({ id: s.id || undefined, type: s.type, enabled: s.enabled, hours_offset: s.hours_offset, template_id: s.template_id });
      }
      toast.success("Reminder settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", type: "reminder", body: "", channel: "whatsapp" });
    setOpen(true);
  }

  async function saveTemplate() {
    if (!form.name.trim() || !form.body.trim()) {
      toast.warning("Name and body required");
      return;
    }
    setSaving(true);
    try {
      await createMessageTemplate(form);
      toast.success("Template saved");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function delTemplate(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteMessageTemplate(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Automations</h1>
          <p className="text-sm text-gray-500">Configure automated messages sent to clients via WhatsApp</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2">
          <MessageCircle className="h-5 w-5 text-red-500" />
          <div className="text-xs font-semibold text-red-600">WhatsApp Disconnected</div>
        </div>
      </div>

      <Tabs defaultValue="reminders">
        <TabsList>
          <TabsTrigger value="reminders"><Bell className="mr-1 h-3 w-3" />Reminder Settings</TabsTrigger>
          <TabsTrigger value="templates"><FileEdit className="mr-1 h-3 w-3" />Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="log"><List className="mr-1 h-3 w-3" />Message Log</TabsTrigger>
        </TabsList>

        <TabsContent value="reminders">
          <div className="mt-4 space-y-3">
            {settings.map((s, i) => (
              <div key={s.type} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={s.enabled} onChange={(e) => setSettings((arr) => arr.map((x, idx) => (idx === i ? { ...x, enabled: e.target.checked } : x)))} className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{REMINDER_LABELS[s.type]?.label ?? s.type}</div>
                      <div className="text-xs text-gray-500">{REMINDER_LABELS[s.type]?.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <Label className="text-xs">Timing (hours)</Label>
                      <Input type="number" disabled={!s.enabled} value={s.hours_offset} onChange={(e) => setSettings((arr) => arr.map((x, idx) => (idx === i ? { ...x, hours_offset: parseInt(e.target.value) || 0 } : x)))} className="w-24 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Template</Label>
                      <Select value={s.template_id ?? "none"} onValueChange={(v: string | null) => setSettings((arr) => arr.map((x, idx) => (idx === i ? { ...x, template_id: v === "none" ? null : v } : x)))}>
                        <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Default" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Default</SelectItem>
                          {templates.filter((t) => t.channel === "whatsapp").map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button disabled={saving} onClick={saveAll} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105"><Check className="mr-1 h-3 w-3" /> Save Settings</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="mt-4">
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-1 h-3 w-3" /> New Template</Button>
            </div>
            <div className="space-y-3">
              {templates.map((t) => (
                <div key={t.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{t.name}</span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{t.channel}</span>
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs capitalize text-purple-700">{t.type}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{t.body}</p>
                      <div className="mt-2 rounded-lg bg-[#dcf8c6] px-3 py-2 text-xs text-gray-800 max-w-sm whitespace-pre-wrap">
                        <div className="mb-1 text-[10px] font-semibold text-gray-500">Preview</div>
                        {preview(t.body)}
                      </div>
                    </div>
                    <Button size="icon-sm" variant="outline" onClick={() => delTemplate(t.id, t.name)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No templates yet</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <div className="mt-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <Input value={logSearch} onChange={(e) => setLogSearch(e.target.value)} placeholder="Search client..." className="w-48" />
              <Select value={logStatus || "all"} onValueChange={(v: string | null) => setLogStatus(v === "all" || !v ? "" : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {filteredLog.map((m) => (
                <div key={m.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-gray-900">{m.clients?.first_name} {m.clients?.last_name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.status === "delivered" ? "bg-green-100 text-green-700" : m.status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{m.status}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{m.body}</p>
                    </div>
                    <span className="text-xs text-gray-400">{m.sent_at ? new Date(m.sent_at).toLocaleString() : ""}</span>
                  </div>
                </div>
              ))}
              {filteredLog.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No messages found</div>}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v: string | null) => setForm({ ...form, type: v ?? "custom" })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{["confirmation", "reminder", "followup", "rebook", "vaccine", "review", "custom"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v: string | null) => setForm({ ...form, channel: v ?? "whatsapp" })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{["whatsapp", "sms", "email"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Message Body *</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} /></div>
            {form.body && (
              <div><Label>Preview</Label>
                <div className="rounded-xl bg-[#dcf8c6] px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">{preview(form.body)}</div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={saving} onClick={saveTemplate} className="bg-[#f2c037] text-[#1a0a3e] hover:brightness-105">{saving ? "Saving..." : "Save Template"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
