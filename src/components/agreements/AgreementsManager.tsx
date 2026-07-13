"use client";
import type { AgreementTemplate, ClientRef } from "@/types";
interface Agreement {
  id: string;
  client_id: string;
  template_id: string | null;
  signed_at: Date | string | null;
  signature_url: string | null;
  status: string;
  created_at: Date | string;
  clients: ClientRef | null;
  agreement_templates: AgreementTemplate | null;
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
import { Plus, Send, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAgreementTemplate,
  createClientAgreement,
  deleteAgreementTemplate,
  markAgreementSigned,
} from "@/server/messaging";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  signed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-600",
};

export function AgreementsManager({
  templates, agreements, clients,
}: {
  templates: AgreementTemplate[];
  agreements: Agreement[];
  clients: ClientRef[];
}) {
  const [templateOpen, setTemplateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", body: "", requires_signature: true });
  const [sendForm, setSendForm] = useState({ client_id: "", template_id: "" });
  const router = useRouter();

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAgreementTemplate(templateForm);
      toast.success("Template created");
      setTemplateOpen(false);
      setTemplateForm({ name: "", body: "", requires_signature: true });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function sendAgreement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createClientAgreement({ client_id: sendForm.client_id, template_id: sendForm.template_id });
      toast.success("Agreement sent");
      setSendOpen(false);
      setSendForm({ client_id: "", template_id: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function markSigned(id: string) {
    try {
      await markAgreementSigned(id);
      toast.success("Marked as signed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function deleteTemplate(id: string) {
    try {
      await deleteAgreementTemplate(id);
      toast.success("Deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger render={<Button className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
            <Send size={16} className="mr-1" /> Send Agreement
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Agreement</DialogTitle></DialogHeader>
            <form onSubmit={sendAgreement} className="space-y-4">
              <div>
                <Label>Client *</Label>
                <Select value={sendForm.client_id} onValueChange={(v) => setSendForm({ ...sendForm, client_id: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c: ClientRef) => <SelectItem key={c.id} value={c.id!}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template *</Label>
                <Select value={sendForm.template_id} onValueChange={(v) => setSendForm({ ...sendForm, template_id: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>{templates.map((t: AgreementTemplate) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving || !sendForm.client_id || !sendForm.template_id} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Sending..." : "Send"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="agreements">
        <TabsList>
          <TabsTrigger value="agreements">Agreements ({agreements.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements" className="mt-4 space-y-2">
          {agreements.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No agreements sent yet</p>
          ) : (
            agreements.map((a: Agreement) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{a.clients?.first_name} {a.clients?.last_name}</span>
                      <Badge className={statusColors[a.status] ?? ""}>{a.status}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {a.agreement_templates?.name}
                      {a.signed_at && ` · Signed: ${new Date(a.signed_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  {a.status === "pending" && (
                    <Button size="sm" onClick={() => markSigned(a.id)} className="h-7 bg-green-500 text-xs text-white hover:bg-green-600">
                      <CheckCircle size={12} className="mr-1" /> Mark Signed
                    </Button>
                  )}
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
                <DialogHeader><DialogTitle>Create Agreement Template</DialogTitle></DialogHeader>
                <form onSubmit={createTemplate} className="space-y-4">
                  <div><Label>Name *</Label><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required placeholder="e.g. Service Agreement" /></div>
                  <div><Label>Body *</Label><Textarea value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} rows={8} required placeholder="Agreement text..." /></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={templateForm.requires_signature} onChange={(e) => setTemplateForm({ ...templateForm, requires_signature: e.target.checked })} />
                    <Label>Requires digital signature</Label>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">{saving ? "Creating..." : "Create"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {templates.map((t: AgreementTemplate) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <span className="text-sm font-bold text-gray-900">{t.name}</span>
                  <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{t.body}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => deleteTemplate(t.id)} className="h-7 text-red-400"><Trash2 size={12} /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
