import Link from "next/link";
import { AlertTriangle, Calendar, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { getNotificationsSummary } from "@/server/notifications";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { vaccineAlerts, upcomingAppts, waitlistCount } = await getNotificationsSummary();
  const empty = vaccineAlerts.length === 0 && upcomingAppts.length === 0 && waitlistCount === 0;
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">Alerts, reminders, and updates</p>
        </div>
      </div>
      {empty ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">All Caught Up</h3>
          <p className="text-sm text-gray-400 mt-1">No pending notifications</p>
        </div>
      ) : (
        <>
          {vaccineAlerts.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-bold text-red-700">Overdue Vaccines ({vaccineAlerts.length})</h3>
              </div>
              <div className="space-y-2">
                {vaccineAlerts.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-red-100">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{v.pet_name}</span>
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{v.vaccine_name}</span>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Expired</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcomingAppts.length > 0 && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold text-blue-700">Upcoming ({upcomingAppts.length})</h3>
              </div>
              <div className="space-y-2">
                {upcomingAppts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-blue-100">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{a.client_name}</span>
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{a.date} {a.time}</span>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {waitlistCount > 0 && (
            <Link href="/dashboard/waitlist" className="block rounded-2xl border border-yellow-200 bg-yellow-50 p-5 hover:bg-yellow-100">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <h3 className="text-sm font-bold text-yellow-700">{waitlistCount} on waitlist</h3>
                <ArrowRight className="h-3 w-3 text-yellow-500 ml-auto" />
              </div>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
