"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Car, Zap, MapPin, Phone, Map, LogIn, CheckCircle, Save, List, Calendar, RefreshCw, Scissors, Info, Clock, Navigation, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { advanceAppointmentStatus, saveAppointmentNote, type GroomerAppointmentRow } from "@/server/groomer";
import { startTracking, updateTrackingPosition, endTracking } from "@/server/tracking";

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

export function GroomerAppClient({ appointments, userName }: { appointments: GroomerAppointmentRow[]; userName: string }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const todayApts = useMemo(() => appointments.filter((a) => a.date === today).sort((a, b) => a.start_time.localeCompare(b.start_time)), [appointments, today]);
  const limit = new Date(); limit.setDate(limit.getDate() + 7);
  const limitStr = limit.toISOString().split("T")[0];
  const upcoming = useMemo(() => appointments.filter((a) => a.date > today && a.date <= limitStr).slice(0, 10), [appointments, today, limitStr]);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [elapsed, setElapsed] = useState("0:00");
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState<{ aptId: string; sessionId: string; token: string } | null>(null);
  const lastPingRef = useRef(0);
  const endedTrackingRef = useRef<Set<string>>(new Set());
  const geoErrorRef = useRef(false);

  const currentApt = useMemo(() => {
    if (currentId) return todayApts.find((a) => a.id === currentId) ?? null;
    return (
      todayApts.find((a) => ["in_progress", "on_the_way", "arrived"].includes(a.status)) ??
      todayApts.find((a) => a.status === "scheduled" || a.status === "confirmed") ??
      null
    );
  }, [todayApts, currentId]);

  const earnings = todayApts.filter((a) => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const completed = todayApts.filter((a) => a.status === "completed").length;

  useEffect(() => {
    const itv = setInterval(() => {
      if (currentApt?.status === "in_progress" && currentApt.checkin_at) {
        const e = Date.now() - new Date(currentApt.checkin_at).getTime();
        const mins = Math.floor(e / 60000);
        const secs = Math.floor((e % 60000) / 1000);
        setElapsed(`${mins}:${String(secs).padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(itv);
  }, [currentApt]);

  async function advance(id: string, status: string) {
    setSaving(true);
    try {
      await advanceAppointmentStatus(id, status);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  // reanuda la sesión si la cita ya está on_the_way (p.ej. tras recargar);
  // salta citas cuyo tracking el groomer acaba de cerrar (estado stale hasta el refresh)
  useEffect(() => {
    if (
      currentApt?.status === "on_the_way" &&
      tracking?.aptId !== currentApt.id &&
      !endedTrackingRef.current.has(currentApt.id)
    ) {
      startTracking(currentApt.id)
        .then((s) => setTracking({ aptId: currentApt.id, sessionId: s.sessionId, token: s.token }))
        .catch(() => {});
    }
  }, [currentApt, tracking]);

  // publica la posición GPS mientras hay tracking activo
  useEffect(() => {
    if (!tracking || !("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastPingRef.current < 15000) return;
        lastPingRef.current = now;
        updateTrackingPosition(tracking.sessionId, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => {
        if (!geoErrorRef.current) {
          geoErrorRef.current = true;
          toast.error("Enable location to share live tracking");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking]);

  async function goOnTheWay(id: string) {
    setSaving(true);
    endedTrackingRef.current.delete(id);
    try {
      const s = await startTracking(id);
      setTracking({ aptId: id, sessionId: s.sessionId, token: s.token });
      toast.success("Client can now track you live");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function markArrived(id: string) {
    setSaving(true);
    endedTrackingRef.current.add(id);
    try {
      await endTracking(id, "arrived");
      setTracking(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  function trackingUrl(token: string) {
    return `${window.location.origin}/track/${token}`;
  }

  function shareWhatsApp(token: string, phone: string | null | undefined, petName: string | undefined) {
    const msg = `Hi! Your groomer is on the way to pamper ${petName ?? "your pet"}. Track the van live here: ${trackingUrl(token)}`;
    const digits = (phone ?? "").replace(/\D/g, "");
    const url = digits
      ? `https://wa.me/${digits.length === 10 ? "1" + digits : digits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  async function copyTrackingLink(token: string) {
    try {
      await navigator.clipboard.writeText(trackingUrl(token));
      toast.success("Tracking link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function saveNote(id: string) {
    if (!reportNote.trim()) return;
    setSaving(true);
    try {
      await saveAppointmentNote(id, reportNote);
      toast.success("Note saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-700",
      confirmed: "bg-indigo-100 text-indigo-700",
      on_the_way: "bg-sky-100 text-sky-700",
      arrived: "bg-amber-100 text-amber-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-600",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 bg-[#1a0a3e] px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2c037]"><Car className="h-4 w-4 text-[#1a0a3e]" /></div>
            <div>
              <div className="text-sm font-black text-white leading-tight">urbanMG</div>
              <div className="text-[10px] text-white/50 leading-tight">Groomer App</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-white">{userName}</div>
            <div className="text-[10px] text-white/50">{todayLabel}</div>
          </div>
        </div>
      </div>

      <div className="pb-24">
        <div className="bg-gradient-to-r from-[#f2c037] to-[#e6b22f] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase text-[#1a0a3e]/60">Today&apos;s Earnings</div>
              <div className="text-2xl font-black text-[#1a0a3e]">{formatCurrency(earnings)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase text-[#1a0a3e]/60">Appointments</div>
              <div className="text-2xl font-black text-[#1a0a3e]">{todayApts.length}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase text-[#1a0a3e]/60">Completed</div>
              <div className="text-2xl font-black text-[#1a0a3e]">{completed}</div>
            </div>
          </div>
        </div>

        {currentApt ? (
          <div className="mx-4 mt-4 rounded-3xl overflow-hidden shadow-lg">
            <div className="bg-[#1a0a3e] px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#f2c037] tracking-wider mb-0.5"><Zap className="inline h-3 w-3 mr-1" />Current Appointment</div>
                  <div className="text-xl font-black text-white">{currentApt.clients?.first_name} {currentApt.clients?.last_name}</div>
                  <div className="text-sm text-white/60">{currentApt.pets?.name} {currentApt.pets?.breed && `· ${currentApt.pets.breed}`}</div>
                </div>
                <div className="rounded-xl bg-[#f2c037] px-3 py-2 text-center">
                  <div className="text-xs font-bold text-[#1a0a3e]">{formatTime(currentApt.start_time)}</div>
                  {currentApt.price && <div className="text-sm font-black text-[#1a0a3e]">{formatCurrency(currentApt.price)}</div>}
                </div>
              </div>
            </div>
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-[#f2c037]" />
                <span className="text-sm font-semibold text-gray-800">{currentApt.services?.name ?? "Grooming"}</span>
              </div>
              {currentApt.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#f2c037] mt-0.5" />
                  <span className="text-sm text-gray-700">{currentApt.address}{currentApt.city ? `, ${currentApt.city}` : ""}</span>
                </div>
              )}
              {currentApt.status === "in_progress" && currentApt.checkin_at && (
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-800">Grooming time: {elapsed}</span>
                </div>
              )}
              {currentApt.notes && (
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Info className="inline h-3 w-3 mr-1" />{currentApt.notes}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {currentApt.address && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((currentApt.address ?? "") + (currentApt.city ? ", " + currentApt.city : ""))}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">
                    <Map className="h-4 w-4" />Navigate
                  </a>
                )}
                {currentApt.clients?.phone && (
                  <a href={`tel:${currentApt.clients.phone}`} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white">
                    <Phone className="h-4 w-4" />Call Client
                  </a>
                )}
              </div>
              <div className="space-y-2 pt-1">
                {(currentApt.status === "scheduled" || currentApt.status === "confirmed") && (
                  <Button disabled={saving} onClick={() => goOnTheWay(currentApt.id)} className="w-full rounded-2xl bg-blue-600 py-3.5 text-base font-black text-white hover:bg-blue-700"><Navigation className="mr-2 h-4 w-4" />I&apos;m On The Way</Button>
                )}
                {currentApt.status === "on_the_way" && tracking?.aptId === currentApt.id && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      Sharing live location with client
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => shareWhatsApp(tracking.token, currentApt.clients?.phone, currentApt.pets?.name)} className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white"><Share2 className="h-3.5 w-3.5" />Send via WhatsApp</button>
                      <button onClick={() => copyTrackingLink(tracking.token)} className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-white py-2.5 text-xs font-bold text-blue-700"><Copy className="h-3.5 w-3.5" />Copy Link</button>
                    </div>
                  </div>
                )}
                {currentApt.status === "on_the_way" && (
                  <Button disabled={saving} onClick={() => markArrived(currentApt.id)} className="w-full rounded-2xl bg-[#f2c037] py-3.5 text-base font-black text-[#1a0a3e] hover:brightness-105"><MapPin className="mr-2 h-4 w-4" />I&apos;ve Arrived</Button>
                )}
                {currentApt.status === "arrived" && (
                  <Button disabled={saving} onClick={() => advance(currentApt.id, "in_progress")} className="w-full rounded-2xl bg-[#f2c037] py-3.5 text-base font-black text-[#1a0a3e] hover:brightness-105"><LogIn className="mr-2 h-4 w-4" />Start Grooming</Button>
                )}
                {currentApt.status === "in_progress" && (
                  <Button disabled={saving} onClick={() => advance(currentApt.id, "completed")} className="w-full rounded-2xl bg-green-500 py-3.5 text-base font-black text-white hover:bg-green-600"><CheckCircle className="mr-2 h-4 w-4" />Complete Appointment</Button>
                )}
              </div>
              {(currentApt.status === "in_progress" || currentApt.status === "completed") && (
                <div className="border-t pt-3">
                  <div className="text-[11px] font-bold uppercase text-gray-400 mb-2">Quick Report Card</div>
                  <Textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} rows={2} placeholder="Notes for report card..." />
                  <Button disabled={!reportNote.trim() || saving} onClick={() => saveNote(currentApt.id)} variant="outline" className="mt-2 w-full border-[#f2c037] text-[#f2c037]"><Save className="mr-1 h-3 w-3" />Save Note</Button>
                </div>
              )}
            </div>
          </div>
        ) : todayApts.length === 0 ? (
          <div className="mx-4 mt-4 rounded-2xl bg-white border p-8 text-center shadow-sm">
            <Calendar className="h-8 w-8 text-gray-200 mb-3 mx-auto" />
            <div className="text-base font-bold text-gray-600">No appointments today</div>
            <div className="text-sm text-gray-400 mt-1">Enjoy your day off!</div>
          </div>
        ) : null}

        {todayApts.length > 0 && (
          <div className="px-4 mt-5">
            <div className="text-sm font-bold text-gray-700 mb-3"><List className="inline h-3 w-3 mr-1.5 text-[#f2c037]" />Today&apos;s Schedule</div>
            <div className="space-y-2">
              {todayApts.map((apt) => (
                <button key={apt.id} onClick={() => { setCurrentId(apt.id); setReportNote(apt.notes ?? ""); }} className={`w-full rounded-2xl bg-white border p-4 text-left shadow-sm ${currentId === apt.id ? "border-[#f2c037] border-l-4" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{apt.clients?.first_name} {apt.clients?.last_name}</div>
                      <div className="text-xs text-gray-500">{apt.pets?.name} · {apt.services?.name}</div>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge(apt.status)}`}>{apt.status.replace("_", " ")}</span>
                      {apt.price && <div className="text-xs font-bold text-gray-700 mt-1">{formatCurrency(apt.price)}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="px-4 mt-5">
            <div className="text-sm font-bold text-gray-700 mb-3"><Calendar className="inline h-3 w-3 mr-1.5 text-gray-400" />Upcoming (next 7 days)</div>
            <div className="space-y-2">
              {upcoming.map((apt) => (
                <div key={apt.id} className="rounded-xl bg-white border p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{apt.clients?.first_name} {apt.clients?.last_name}</div>
                    <div className="text-xs text-gray-400">{apt.pets?.name} · {formatTime(apt.start_time)} · {apt.date}</div>
                  </div>
                  {apt.price && <div className="text-sm font-bold text-gray-700">{formatCurrency(apt.price)}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white">
        <div className="flex">
          <button className="flex flex-1 flex-col items-center py-3 text-[#f2c037]">
            <Car className="h-5 w-5" />
            <span className="text-[10px] font-semibold mt-0.5">Home</span>
          </button>
          <button className="flex flex-1 flex-col items-center py-3 text-gray-400" onClick={() => router.refresh()}>
            <RefreshCw className="h-5 w-5" />
            <span className="text-[10px] font-semibold mt-0.5">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
