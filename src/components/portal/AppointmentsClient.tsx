"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Scissors,
  User as UserIcon,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cancelMyAppointment, rescheduleMyAppointment } from "@/server/portal";

export type PortalAppointment = {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  service_name: string;
  pet_name: string;
  groomer_name: string;
  status: string;
  notes: string;
  total: number;
};

const CANCEL_REASONS = [
  "Schedule conflict",
  "Pet is sick",
  "Weather",
  "Other",
];

const TIME_SLOTS = [
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:00 PM", value: "17:00" },
];

function isUpcoming(a: PortalAppointment) {
  const today = new Date().toISOString().split("T")[0];
  return a.scheduled_date >= today && !["cancelled", "completed", "no_show"].includes(a.status);
}

function isLateCancellation(a: PortalAppointment) {
  const apptDate = new Date(`${a.scheduled_date}T${a.scheduled_time || "08:00"}:00`);
  const hoursUntil = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil < 24;
}

function formatDate(d: string) {
  return new Date(d + "T00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBarColor(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-green-400",
    scheduled: "bg-blue-400",
    pending: "bg-yellow-400",
    completed: "bg-gray-300",
    cancelled: "bg-red-300",
    no_show: "bg-orange-300",
  };
  return map[status] ?? "bg-gray-200";
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    scheduled: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-orange-100 text-orange-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

export function AppointmentsClient({
  appointments,
}: {
  appointments: PortalAppointment[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const [cancelTarget, setCancelTarget] = useState<PortalAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);

  const [rescheduleTarget, setRescheduleTarget] = useState<PortalAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.scheduled_date >= today &&
          !["cancelled", "no_show"].includes(a.status)
      ),
    [appointments, today]
  );
  const past = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.scheduled_date < today ||
          ["completed", "cancelled", "no_show"].includes(a.status)
      ),
    [appointments, today]
  );
  const list = tab === "upcoming" ? upcoming : past;

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  async function confirmCancel() {
    if (!cancelTarget || !cancelReason) return;
    setCancelSaving(true);
    try {
      await cancelMyAppointment(
        cancelTarget.id,
        cancelReason,
        isLateCancellation(cancelTarget)
      );
      toast.success("Appointment cancelled");
      setCancelTarget(null);
      setCancelReason("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel");
    } finally {
      setCancelSaving(false);
    }
  }

  async function confirmReschedule() {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    setRescheduleSaving(true);
    try {
      await rescheduleMyAppointment(rescheduleTarget.id, rescheduleDate, rescheduleTime);
      toast.success(`Moved to ${rescheduleDate} at ${rescheduleTime}`);
      setRescheduleTarget(null);
      setRescheduleDate("");
      setRescheduleTime("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reschedule");
    } finally {
      setRescheduleSaving(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-gray-800">
            My Appointments
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Your upcoming and past grooming sessions
          </p>
        </div>
        <Link
          href="/book"
          className="flex items-center gap-1.5 rounded-full bg-[#f2c037] px-4 py-2 text-[13px] font-bold text-[#1a0a3e] shadow-sm transition-all hover:bg-[#e8b52e]"
        >
          <Plus className="h-3 w-3" />
          Book New
        </Link>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#f2c037]/30 bg-[#fffde7] px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f2c037]" />
        <p className="text-[12px] leading-relaxed text-[#92400e]">
          <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours
          before your appointment. Late cancellations (within 24 hours) may incur a{" "}
          <strong>$25 fee</strong>.
        </p>
      </div>

      <div className="mb-5 flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
        {([
          { key: "upcoming", label: "Upcoming", count: upcoming.length },
          { key: "past", label: "Past", count: past.length },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "flex-1 rounded-xl py-2 text-[13px] font-semibold transition-all " +
              (tab === t.key
                ? "bg-[#1a0a3e] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700")
            }
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] " +
                  (tab === t.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600")
                }
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Calendar className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-[14px] font-semibold text-gray-500">
            {tab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
          </p>
          {tab === "upcoming" && (
            <Link
              href="/book"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#f2c037] px-4 py-2 text-[12px] font-bold text-[#1a0a3e]"
            >
              <Plus className="h-3 w-3" />
              Book Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((appt) => {
            const upcomingNow = isUpcoming(appt);
            const late = isLateCancellation(appt);
            return (
              <div
                key={appt.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-[#f2c037]/20 hover:shadow-md"
              >
                <div className={`h-1 w-full ${statusBarColor(appt.status)}`} />
                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f2c037]/10">
                        <Scissors className="h-[18px] w-[18px] text-[#f2c037]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-800">{appt.pet_name}</p>
                        <p className="text-[12px] text-gray-500">{appt.service_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide " +
                          statusBadgeClass(appt.status)
                        }
                      >
                        {appt.status}
                      </span>
                      {appt.total > 0 && (
                        <span className="text-[14px] font-black text-gray-800">
                          ${appt.total.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <Calendar className="h-3 w-3 text-[#f2c037]" />
                      {formatDate(appt.scheduled_date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <Clock className="h-3 w-3 text-[#2C0F73]" />
                      {appt.scheduled_time || "Time TBD"}
                    </div>
                    {appt.groomer_name && (
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <UserIcon className="h-3 w-3 text-blue-400" />
                        {appt.groomer_name}
                      </div>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-[12px] text-gray-500">
                      <MessageSquare className="mr-1.5 inline h-3 w-3" />
                      {appt.notes}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {upcomingNow && (
                      <>
                        <Link
                          href={`/track/${appt.id}`}
                          target="_blank"
                          className="flex items-center gap-1.5 rounded-xl border border-[#f2c037]/40 bg-[#f2c037]/10 px-3 py-1.5 text-[12px] font-semibold text-[#92640a] transition-all hover:bg-[#f2c037]/25"
                        >
                          <MapPin className="h-3 w-3" />
                          Track
                        </Link>
                        <button
                          onClick={() => {
                            setRescheduleTarget(appt);
                            setRescheduleDate("");
                            setRescheduleTime("");
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-[#2C0F73]/20 bg-[#f0ebff] px-3 py-1.5 text-[12px] font-semibold text-[#2C0F73] transition-all hover:bg-[#e8dfff]"
                        >
                          <Calendar className="h-3 w-3" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setCancelTarget(appt);
                            setCancelReason("");
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                          {late && (
                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-600">
                              $25 fee
                            </span>
                          )}
                        </button>
                      </>
                    )}
                    {(!upcomingNow || appt.status === "completed") && (
                      <Link
                        href="/book"
                        className="flex items-center gap-1.5 rounded-xl border border-[#f2c037]/20 bg-[#f2c037]/10 px-3 py-1.5 text-[12px] font-semibold text-[#b8860b] transition-all hover:bg-[#f2c037]/20"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Rebook
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          {cancelTarget && (
            <div>
              {isLateCancellation(cancelTarget) ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-[13px] font-bold text-orange-700">Late Cancellation</p>
                    <p className="mt-0.5 text-[12px] text-orange-600">
                      This appointment is less than 24 hours away. A late
                      cancellation fee of <strong>$25</strong> may apply.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-[13px] font-bold text-green-700">Free Cancellation</p>
                    <p className="mt-0.5 text-[12px] text-green-600">
                      This appointment is more than 24 hours away — no fee will be
                      charged.
                    </p>
                  </div>
                </div>
              )}

              <p className="mb-3 text-[13px] text-gray-600">
                Cancelling appointment for <strong>{cancelTarget.pet_name}</strong> on{" "}
                <strong>{formatDate(cancelTarget.scheduled_date)}</strong>
                {cancelTarget.scheduled_time && (
                  <>
                    {" "}at <strong>{cancelTarget.scheduled_time}</strong>
                  </>
                )}
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-gray-600">
                  Reason for Cancellation
                </label>
                <Select value={cancelReason} onValueChange={(v) => setCancelReason(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCEL_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCancelTarget(null);
                    setCancelReason("");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 transition-all hover:bg-gray-50"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={!cancelReason || cancelSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
                >
                  {cancelSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      Confirm Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRescheduleTarget(null);
            setRescheduleDate("");
            setRescheduleTime("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          {rescheduleTarget && (
            <div>
              <p className="mb-4 text-[13px] text-gray-600">
                Rescheduling <strong>{rescheduleTarget.pet_name}</strong>&apos;s appointment.
                Choose a new date and time.
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-gray-600">
                  <Calendar className="mr-1 inline h-3 w-3 text-[#f2c037]" />
                  New Date
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px]"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wide text-gray-600">
                  <Clock className="mr-1 inline h-3 w-3 text-[#f2c037]" />
                  New Time
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      onClick={() => setRescheduleTime(slot.value)}
                      className={
                        "rounded-lg border-2 py-2 text-[11px] font-semibold transition-all " +
                        (rescheduleTime === slot.value
                          ? "border-[#f2c037] bg-[#f2c037] text-[#1a0a3e]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#f2c037] hover:bg-[#fffbeb]")
                      }
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRescheduleTarget(null);
                    setRescheduleDate("");
                    setRescheduleTime("");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReschedule}
                  disabled={!rescheduleDate || !rescheduleTime || rescheduleSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-[#2C0F73] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#1a0a3e] disabled:opacity-50"
                >
                  {rescheduleSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
