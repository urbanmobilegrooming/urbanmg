import Link from "next/link";
import { getCurrentClient, getNextAppointment, getRecentActivity } from "@/server/portal";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Info,
  Plus,
  Receipt,
  User as UserIcon,
  XCircle,
} from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const QUICK_ACTIONS = [
  {
    label: "Book Appointment",
    href: "/book",
    icon: CalendarPlus,
    bg: "bg-[#f2c037]/10",
    color: "#f2c037",
  },
  {
    label: "My Pets",
    href: "/portal/pets",
    icon: Heart,
    bg: "bg-red-50",
    color: "#ef4444",
  },
  {
    label: "Invoices",
    href: "/portal/invoices",
    icon: Receipt,
    bg: "bg-green-50",
    color: "#22c55e",
  },
  {
    label: "Appointments",
    href: "/portal/appointments",
    icon: Calendar,
    bg: "bg-blue-50",
    color: "#3b82f6",
  },
];

const ACTIVITY_META: Record<string, { icon: typeof Info; color: string }> = {
  appointment_created: { icon: Calendar, color: "bg-blue-50 text-blue-500" },
  appointment_completed: { icon: CheckCircle2, color: "bg-green-50 text-green-600" },
  appointment_cancelled: { icon: XCircle, color: "bg-red-50 text-red-500" },
  payment_received: { icon: CreditCard, color: "bg-[#f2c037]/10 text-[#b8860b]" },
  invoice_created: { icon: Receipt, color: "bg-purple-50 text-purple-500" },
  default: { icon: Info, color: "bg-gray-50 text-gray-400" },
};

export default async function PortalHomePage() {
  const [client, nextAppt, activity] = await Promise.all([
    getCurrentClient(),
    getNextAppointment().catch(() => null),
    getRecentActivity().catch(() => []),
  ]);

  const firstName =
    (client?.first_name || client?.full_name?.split(" ")[0] || "there").trim();

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] px-6 py-8 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[13px] font-medium text-white/50">
              Good to see you,
            </p>
            <h1 className="text-[26px] font-black tracking-tight text-white">
              {firstName}
            </h1>
            <p className="mt-1 text-[13px] text-white/60">
              Manage your pets and appointments right here.
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#f2c037]/20">
            <Heart className="h-7 w-7 text-[#f2c037]" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-bold text-gray-700">
            Next Appointment
          </h2>

          {nextAppt ? (
            <div className="rounded-2xl border border-[#f2c037]/20 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[18px] font-black text-gray-800">
                    {nextAppt.pet_name}
                  </p>
                  <p className="text-[13px] text-gray-500">
                    {nextAppt.service_name}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700">
                  Confirmed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f2c037]/10">
                    <Calendar className="h-3.5 w-3.5 text-[#f2c037]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Date
                    </p>
                    <p className="text-[13px] font-semibold text-gray-700">
                      {formatDate(nextAppt.scheduled_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50">
                    <Clock className="h-3.5 w-3.5 text-[#2C0F73]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Time
                    </p>
                    <p className="text-[13px] font-semibold text-gray-700">
                      {nextAppt.scheduled_time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                    <UserIcon className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Groomer
                    </p>
                    <p className="text-[13px] font-semibold text-gray-700">
                      {nextAppt.groomer_name || "TBD"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                <Calendar className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-[14px] font-semibold text-gray-500">
                No upcoming appointments
              </p>
              <p className="mt-1 text-[12px] text-gray-400">
                Book one for your furry friend!
              </p>
              <Link
                href="/book"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#f2c037] px-4 py-2 text-[12px] font-bold text-[#1a0a3e] transition-all hover:bg-[#e8b52e]"
              >
                <Plus className="h-3 w-3" />
                Book Appointment
              </Link>
            </div>
          )}

          <h2 className="mb-3 mt-6 text-[15px] font-bold text-gray-700">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f2c037]/30 hover:shadow-md"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg}`}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: a.color }} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-600">
                    {a.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-[15px] font-bold text-gray-700">
            Recent Activity
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Info className="h-7 w-7 text-gray-200" />
                <p className="mt-2 text-[13px] text-gray-400">
                  No recent activity
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activity.map((item) => {
                  const meta = ACTIVITY_META[item.type] ?? ACTIVITY_META.default;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium leading-snug text-gray-700">
                          {item.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
