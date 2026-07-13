"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Check, X, Phone, Mail, MapPin, UserPlus, MessageCircle } from "lucide-react";
import { approveIntake, rejectIntake, updateLeadStatus, type IntakePetInput } from "@/server/intake";

type Submission = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  preferredContact: string | null;
  referralSource: string | null;
  pets: IntakePetInput[] | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const statusCls: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-gray-100 text-gray-500",
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-500",
};

export function IntakeManager({ submissions, leads }: { submissions: Submission[]; leads: Lead[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"submissions" | "leads">("submissions");
  const [busy, setBusy] = useState<string | null>(null);

  const pending = submissions.filter((s) => s.status === "pending");

  async function onApprove(id: string) {
    setBusy(id);
    try {
      const { clientId } = await approveIntake(id);
      toast.success("Client created from intake");
      router.push(`/dashboard/clients/${clientId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function onReject(id: string) {
    setBusy(id);
    try {
      await rejectIntake(id);
      toast.success("Intake rejected");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function onLeadStatus(id: string, status: string) {
    try {
      await updateLeadStatus(id, status);
      router.refresh();
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("submissions")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "submissions" ? "bg-[#1a0a3e] text-white" : "bg-white border text-gray-600"}`}
        >
          Intake forms {pending.length > 0 && <span className="ml-1 rounded-full bg-[#f2c037] px-1.5 text-[11px] text-[#1a0a3e]">{pending.length}</span>}
        </button>
        <button
          onClick={() => setTab("leads")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "leads" ? "bg-[#1a0a3e] text-white" : "bg-white border text-gray-600"}`}
        >
          Leads ({leads.length})
        </button>
        <div className="flex-1" />
        <Link
          href="/intake"
          target="_blank"
          className="rounded-xl border border-[#f2c037] px-4 py-2 text-sm font-bold text-[#b8901f] hover:bg-[#f2c037]/10"
        >
          View public form ↗
        </Link>
      </div>

      {tab === "submissions" ? (
        submissions.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <UserPlus className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <div className="text-base font-bold text-gray-600">No intake submissions yet</div>
              <div className="mt-1 text-sm text-gray-400">Share the public form link with new clients: /intake</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-gray-900">{s.firstName} {s.lastName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCls[s.status] ?? ""}`}>{s.status}</span>
                        <span className="text-xs text-gray-400">{fmtDate(s.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                        {s.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>}
                        {(s.address || s.city) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{[s.address, s.city, s.zip].filter(Boolean).join(", ")}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(s.pets ?? []).map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            <PawPrint className="h-3 w-3 text-[#f2c037]" />
                            {p.name}
                            {p.breed ? ` · ${p.breed}` : ""}
                            {p.weight_lbs ? ` · ${p.weight_lbs}lb` : ""}
                          </span>
                        ))}
                      </div>
                      {s.notes && <p className="text-xs italic text-gray-400">&ldquo;{s.notes}&rdquo;</p>}
                      {s.referralSource && <p className="text-[11px] text-gray-400">Source: {s.referralSource}</p>}
                    </div>
                    {s.status === "pending" && (
                      <div className="flex shrink-0 gap-2">
                        <Button disabled={busy === s.id} onClick={() => onApprove(s.id)} className="rounded-xl bg-green-500 font-bold text-white hover:bg-green-600">
                          <Check className="mr-1 h-4 w-4" />Approve
                        </Button>
                        <Button disabled={busy === s.id} onClick={() => onReject(s.id)} variant="outline" className="rounded-xl text-gray-500">
                          <X className="mr-1 h-4 w-4" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <UserPlus className="mx-auto mb-3 h-8 w-8 text-gray-200" />
            <div className="text-base font-bold text-gray-600">No leads yet</div>
            <div className="mt-1 text-sm text-gray-400">Leads are created automatically from intake forms and public bookings</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leads.map((l) => {
            const digits = (l.phone ?? "").replace(/\D/g, "");
            const wa = digits ? `https://wa.me/${digits.length === 10 ? "1" + digits : digits}` : null;
            return (
              <Card key={l.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{l.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCls[l.status] ?? ""}`}>{l.status}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{l.source}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
                      {l.phone && <span>{l.phone}</span>}
                      {l.email && <span>{l.email}</span>}
                      <span className="text-gray-400">{fmtDate(l.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600">
                        <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                      </a>
                    )}
                    <select
                      value={l.status}
                      onChange={(e) => onLeadStatus(l.id, e.target.value)}
                      className="rounded-xl border px-2 py-2 text-xs font-semibold text-gray-600"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
