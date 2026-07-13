"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PawPrint, Phone, MessageCircle, CalendarPlus, TrendingUp, Pencil, Check } from "lucide-react";
import { setPetFrequency, type RebookingOpportunity } from "@/server/rebooking";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function urgency(daysOverdue: number): { label: string; cls: string } {
  if (daysOverdue >= 14) return { label: `${daysOverdue}d overdue`, cls: "bg-red-100 text-red-700" };
  if (daysOverdue >= 1) return { label: `${daysOverdue}d overdue`, cls: "bg-amber-100 text-amber-700" };
  return { label: `due in ${-daysOverdue}d`, cls: "bg-blue-100 text-blue-700" };
}

function waLink(o: RebookingOpportunity) {
  const msg = `Hi ${o.client_name.split(" ")[0]}! ${o.pet_name} is due for a groom — it's been a while since the last visit on ${formatDate(o.last_visit)}. Want us to swing by this week? 🚐 — Urban Mobile Grooming`;
  const digits = (o.client_phone ?? "").replace(/\D/g, "");
  return digits
    ? `https://wa.me/${digits.length === 10 ? "1" + digits : digits}?text=${encodeURIComponent(msg)}`
    : null;
}

function FrequencyEditor({ o }: { o: RebookingOpportunity }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [weeks, setWeeks] = useState(o.frequency_weeks);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await setPetFrequency(o.pet_id, weeks);
      toast.success(`${o.pet_name}: every ${weeks} weeks`);
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
        title={o.frequency_source === "set" ? "Set on pet" : o.frequency_source === "inferred" ? "Inferred from visit history" : "Default"}
      >
        every {o.frequency_weeks}w
        {o.frequency_source !== "set" && <span className="text-[10px] text-gray-400">({o.frequency_source})</span>}
        <Pencil className="h-3 w-3" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min={1}
        max={52}
        value={weeks}
        onChange={(e) => setWeeks(Number(e.target.value))}
        className="w-14 rounded-md border px-1.5 py-0.5 text-xs"
      />
      <span className="text-xs text-gray-500">weeks</span>
      <button disabled={saving} onClick={save} className="rounded-md bg-[#f2c037] p-1 text-[#1a0a3e]">
        <Check className="h-3 w-3" />
      </button>
    </span>
  );
}

export function RebookingClient({ opportunities }: { opportunities: RebookingOpportunity[] }) {
  const potential = useMemo(
    () => opportunities.reduce((s, o) => s + (o.last_price ?? 0), 0),
    [opportunities],
  );
  const overdue = opportunities.filter((o) => o.days_overdue >= 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
              <PawPrint className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{overdue.length}</div>
              <div className="text-xs font-medium text-gray-500">Pets overdue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{opportunities.length - overdue.length}</div>
              <div className="text-xs font-medium text-gray-500">Due this week</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{formatCurrency(potential)}</div>
              <div className="text-xs font-medium text-gray-500">Recoverable revenue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <PawPrint className="mx-auto mb-3 h-8 w-8 text-gray-200" />
            <div className="text-base font-bold text-gray-600">Everyone is up to date</div>
            <div className="mt-1 text-sm text-gray-400">
              No pets are overdue for their next groom. Check back after more completed appointments.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {opportunities.map((o) => {
            const u = urgency(o.days_overdue);
            const wa = waLink(o);
            return (
              <Card key={o.pet_id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{o.pet_name}</span>
                      {o.breed && <span className="text-xs text-gray-400">{o.breed}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.cls}`}>{u.label}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{o.client_name}</span>
                      <span>
                        Last: {formatDate(o.last_visit)}
                        {o.last_service ? ` · ${o.last_service}` : ""}
                        {o.last_price ? ` · ${formatCurrency(o.last_price)}` : ""}
                      </span>
                      <FrequencyEditor o={o} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                        onClick={() => toast.success(`WhatsApp opened for ${o.client_name}`)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}
                    {o.client_phone && (
                      <a
                        href={`tel:${o.client_phone}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    )}
                    <Link
                      href={`/dashboard/appointments?client=${o.client_id}&pet=${o.pet_id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#f2c037] px-3 py-2 text-xs font-black text-[#1a0a3e] hover:bg-[#e5a818]"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Book
                    </Link>
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
