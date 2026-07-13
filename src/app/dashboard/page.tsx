import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, PawPrint, Scissors, Calendar, UserCircle, DollarSign,
  TrendingUp, Clock, Truck, AlertTriangle, CheckCircle, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { ServiceHeatMap } from "@/components/dashboard/ServiceHeatMap";
import { getDashboardData } from "@/server/dashboard";

export default async function DashboardPage() {
  const now = new Date();
  const data = await getDashboardData();

  const monthRevenue = data.monthAppts.reduce((s, a) => s + (a.price ?? 0), 0);
  const prevRevenue = data.prevMonthAppts.reduce((s, a) => s + (a.price ?? 0), 0);
  const revenueChange = prevRevenue > 0 ? Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const totalExpenses = data.monthExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const netProfit = monthRevenue - totalExpenses;
  const completedThisMonth = data.monthAppts.length;
  const avgTicket = completedThisMonth > 0 ? monthRevenue / completedThisMonth : 0;

  const totalCommissions = data.monthAppts.reduce((s, a) => {
    const rate = a.staff?.commission_rate ?? 0;
    return s + (a.price ?? 0) * (rate / 100);
  }, 0);

  const todayList = data.todayAppts;
  const todayCompleted = todayList.filter((a) => a.status === "completed").length;
  const todayInProgress = todayList.filter((a) => a.status === "in_progress").length;
  const todayPending = todayList.filter((a) => ["scheduled", "confirmed"].includes(a.status)).length;

  const dayMap = new Map<string, number>();
  data.monthAppts.forEach((a) => {
    dayMap.set(a.date, (dayMap.get(a.date) ?? 0) + (a.price ?? 0));
  });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1).toISOString().split("T")[0];
    return dayMap.get(d) ?? 0;
  });
  const maxDaily = Math.max(...dailyRevenue, 1);

  const monthLabel = now.toLocaleDateString("en", { month: "long" });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-400">{now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">{monthLabel} Revenue</p>
                <p className="mt-1 text-2xl font-black text-gray-900">${monthRevenue.toLocaleString()}</p>
                {revenueChange !== 0 && (
                  <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${revenueChange > 0 ? "text-green-600" : "text-red-500"}`}>
                    <TrendingUp size={12} className={revenueChange < 0 ? "rotate-180" : ""} />
                    {revenueChange > 0 ? "+" : ""}{revenueChange}% vs last month
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-green-100 p-3"><DollarSign size={20} className="text-green-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">Net Profit</p>
                <p className={`mt-1 text-2xl font-black ${netProfit >= 0 ? "text-gray-900" : "text-red-600"}`}>${netProfit.toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-400">Expenses: ${totalExpenses.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl p-3 ${netProfit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <TrendingUp size={20} className={netProfit >= 0 ? "text-green-600" : "text-red-600"} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">Appointments ({monthLabel})</p>
                <p className="mt-1 text-2xl font-black text-gray-900">{completedThisMonth}</p>
                <p className="mt-1 text-xs text-gray-400">Avg ticket: ${avgTicket.toFixed(0)}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3"><Calendar size={20} className="text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">Commissions</p>
                <p className="mt-1 text-2xl font-black text-[#f2c037]">${totalCommissions.toFixed(0)}</p>
                <p className="mt-1 text-xs text-gray-400">{completedThisMonth > 0 ? `${Math.round((totalCommissions / monthRevenue) * 100)}% of revenue` : "No jobs yet"}</p>
              </div>
              <div className="rounded-xl bg-[#f2c037]/10 p-3"><UserCircle size={20} className="text-[#f2c037]" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Daily Revenue — {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[120px] items-end gap-[2px]">
              {dailyRevenue.map((val, i) => {
                const height = Math.max((val / maxDaily) * 100, 2);
                const isToday = i + 1 === now.getDate();
                return (
                  <div key={i} className="group relative flex-1">
                    <div
                      className={`w-full rounded-t transition-colors ${isToday ? "bg-[#f2c037]" : val > 0 ? "bg-[#2C0F73]/60 hover:bg-[#2C0F73]" : "bg-gray-100"}`}
                      style={{ height: `${height}%` }}
                    />
                    {val > 0 && (
                      <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
                        ${val} · Day {i + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-300">
              <span>1</span>
              <span>{Math.ceil(daysInMonth / 2)}</span>
              <span>{daysInMonth}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#2C0F73]/10 p-2"><Users size={16} className="text-[#2C0F73]" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{data.clientCount ?? 0}</p>
                  <p className="text-xs text-gray-400">Clients</p>
                </div>
              </div>
              <Link href="/dashboard/clients" className="text-gray-300 hover:text-gray-500"><ArrowRight size={16} /></Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#f2c037]/10 p-2"><PawPrint size={16} className="text-[#f2c037]" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{data.petCount ?? 0}</p>
                  <p className="text-xs text-gray-400">Pets</p>
                </div>
              </div>
              <Link href="/dashboard/pets" className="text-gray-300 hover:text-gray-500"><ArrowRight size={16} /></Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#1e73be]/10 p-2"><Scissors size={16} className="text-[#1e73be]" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{data.serviceCount ?? 0}</p>
                  <p className="text-xs text-gray-400">Services</p>
                </div>
              </div>
              <Link href="/dashboard/services" className="text-gray-300 hover:text-gray-500"><ArrowRight size={16} /></Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <ServiceHeatMap appointments={data.allCompletedAppts} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Today&apos;s Schedule</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">{todayCompleted} done</Badge>
                {todayInProgress > 0 && <Badge className="bg-yellow-100 text-yellow-700">{todayInProgress} active</Badge>}
                <Badge className="bg-blue-100 text-blue-700">{todayPending} pending</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {todayList.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No appointments today</p>
            ) : (
              <div className="space-y-2">
                {todayList.map((apt) => {
                  const statusColor = apt.status === "completed" ? "bg-green-400" : apt.status === "in_progress" ? "bg-yellow-400" : "bg-blue-400";
                  return (
                    <div key={apt.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
                      <span className="w-12 shrink-0 text-xs font-bold text-gray-500">{apt.start_time?.slice(0, 5)}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-gray-900">{apt.clients?.first_name} {apt.clients?.last_name}</span>
                        <span className="mx-1.5 text-gray-300">·</span>
                        <span className="text-sm text-gray-500">{apt.pets?.name}</span>
                        <span className="mx-1.5 text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{apt.services?.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {apt.van && <Badge variant="secondary" className="text-[10px]">{apt.van}</Badge>}
                        {apt.price && <span className="text-sm font-bold text-gray-900">${apt.price}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/dashboard/appointments" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-[#f2c037] hover:underline">
              View all appointments <ArrowRight size={12} />
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.waitListCount > 0 && (
                <Link href="/dashboard/waitlist" className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 transition-colors hover:bg-yellow-100">
                  <Clock size={14} className="shrink-0 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700">{data.waitListCount} clients on wait list</span>
                </Link>
              )}
              {data.overdueVaccines > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
                  <AlertTriangle size={14} className="shrink-0 text-red-500" />
                  <span className="text-xs font-medium text-red-600">{data.overdueVaccines} overdue vaccines</span>
                </div>
              )}
              {data.waitListCount === 0 && data.overdueVaccines === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs font-medium text-green-600">All clear!</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Quick Links</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: "New Appt", href: "/dashboard/appointments", icon: Calendar, color: "bg-blue-50 text-blue-600" },
                { label: "Routes", href: "/dashboard/routes", icon: Truck, color: "bg-green-50 text-green-600" },
                { label: "Billing", href: "/dashboard/billing", icon: DollarSign, color: "bg-purple-50 text-purple-600" },
                { label: "Staff", href: "/dashboard/staff", icon: UserCircle, color: "bg-[#f2c037]/10 text-[#f2c037]" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-colors hover:opacity-80 ${link.color}`}>
                  <link.icon size={18} />
                  <span className="text-[10px] font-semibold">{link.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
