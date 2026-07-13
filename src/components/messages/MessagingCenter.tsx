"use client";
import type { ClientRef } from "@/types";

interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  type: string;
  channel: string;
}
interface Message {
  id: string;
  client_id: string | null;
  template_id: string | null;
  body: string;
  direction: string;
  status: string;
  channel: string;
  sent_at: string | Date | null;
  created_at: string | Date;
  clients: ClientRef | null;
}

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Send, MessageSquare, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  sendMessage as sendMessageAction,
} from "@/server/messaging";

export function MessagingCenter({
  templates, messages, clients,
}: {
  templates: MessageTemplate[];
  messages: Message[];
  clients: ClientRef[];
}) {
  const [templateOpen, setTemplateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", type: "custom", body: "", channel: "sms" });
  const [sendForm, setSendForm] = useState({ client_id: "", body: "", channel: "sms", template_id: "" });
  const router = useRouter();

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createMessageTemplate(templateForm);
      toast.success("Template created");
      setTemplateOpen(false);
      setTemplateForm({ name: "", type: "custom", body: "", channel: "sms" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await sendMessageAction({
        client_id: sendForm.client_id,
        body: sendForm.body,
        channel: sendForm.channel,
        template_id: sendForm.template_id || null,
      });
      toast.success("Message sent");
      setSendOpen(false);
      setSendForm({ client_id: "", body: "", channel: "sms", template_id: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  function applyTemplate(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (t) setSendForm({ ...sendForm, template_id: templateId, body: t.body, channel: t.channel ?? "sms" });
  }

  async function deleteTemplate(id: string) {
    try {
      await deleteMessageTemplate(id);
      toast.success("Deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const channelColors: Record<string, string> = { sms: "bg-blue-100 text-blue-700", email: "bg-purple-100 text-purple-700", whatsapp: "bg-green-100 text-green-700" };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
            <Send size={16} className="mr-1" /> Send Message
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <form onSubmit={sendMessage} className="space-y-4">
              <div>
                <Label>Client *</Label>
                <Select value={sendForm.client_id} onValueChange={(v) => setSendForm({ ...sendForm, client_id: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c: ClientRef) => <SelectItem key={c.id} value={c.id!}>{c.first_name} {c.last_name} — {c.phone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Channel</Label>
                  <Select value={sendForm.channel} onValueChange={(v) => setSendForm({ ...sendForm, channel: v ?? "sms" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template</Label>
                  <Select value={sendForm.template_id} onValueChange={(v) => { if (v) applyTemplate(v); }}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Message *</Label><Textarea value={sendForm.body} onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })} rows={4} required placeholder="Type your message..." /></div>
              <p className="text-xs text-gray-400">Variables: {"{client_name}"}, {"{pet_name}"}, {"{date}"}, {"{time}"}</p>
              <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Sending..." : "Send"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history"><MessageSquare size={14} className="mr-1" /> History ({messages.length})</TabsTrigger>
          <TabsTrigger value="templates"><FileText size={14} className="mr-1" /> Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 space-y-2">
          {messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No messages sent yet</p>
          ) : (
            messages.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{m.clients?.first_name} {m.clients?.last_name}</span>
                      <Badge className={channelColors[m.channel] ?? ""}>{m.channel}</Badge>
                      <Badge variant="secondary">{m.direction}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{m.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{new Date(m.sent_at ?? new Date()).toLocaleString()}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" />}>
                <Plus size={14} className="mr-1" /> New Template
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
                <form onSubmit={createTemplate} className="space-y-4">
                  <div><Label>Name *</Label><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required placeholder="e.g. Appointment Reminder" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={templateForm.type} onValueChange={(v) => setTemplateForm({ ...templateForm, type: v ?? "custom" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmation">Confirmation</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                          <SelectItem value="review">Review Request</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Channel</Label>
                      <Select value={templateForm.channel} onValueChange={(v) => setTemplateForm({ ...templateForm, channel: v ?? "sms" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Body *</Label><Textarea value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} rows={4} required /></div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Creating..." : "Create"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {templates.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No templates yet</p>
          ) : (
            templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{t.name}</span>
                      <Badge variant="secondary" className="capitalize">{t.type}</Badge>
                      <Badge className={channelColors[t.channel] ?? ""}>{t.channel}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{t.body}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => deleteTemplate(t.id)} className="h-7 text-red-400"><Trash2 size={12} /></Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
