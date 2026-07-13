"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign, Calendar, TrendingUp, TrendingDown, Scissors, Truck, Users, Download, Loader2,
} from "lucide-react";
import { getReportsData } from "@/server/dashboard";

interface Appointment {
  id: string;
  date: string;
  price: number | null;
  status: string;
  payment_status: string;
  van: string | null;
  services: { name: string } | null;
  staff: { id: string; first_name?: string; last_name?: string; commission_rate?: number; color?: string } | null;
  clients: { first_name: string; last_name: string } | null;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string | null;
  van?: string | null;
}

const GOLD = "#f2c037";
const PURPLE = "#2C0F73";
const CHART_COLORS = [GOLD, PURPLE, "#1e73be", "#e74c3c", "#2ecc71", "#9b59b6", "#e67e22", "#1abc9c"];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}
function todayStr(): string { return new Date().toISOString().split("T")[0]; }
function monthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function monthEnd(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}
function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function RevenueBarChart({ data }: { data: { date: string; revenue: number }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length === 0) return <p className="py-8 text-center text-sm text-gray-400">No revenue data for this period.</p>;
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const chartH = 200;
  const barGap = 2;
  const totalW = data.length * 30;
  const viewW = Math.max(totalW, 300);
  const barW = Math.max((viewW - barGap * data.length) / data.length, 4);
  const labelStep = data.length > 14 ? Math.ceil(data.length / 7) : 1;
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
  const leftPad = 50;
  const bottomPad = 28;
  const fullW = leftPad + viewW + 10;
  const fullH = chartH + bottomPad + 10;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${fullW} ${fullH}`} className="w-full" style={{ minWidth: Math.min(fullW, 400), maxHeight: 280 }} role="img">
        {yTicks.map((tick, i) => {
          const y = chartH - (tick / maxVal) * chartH + 5;
          return (
            <g key={i}>
              <line x1={leftPad} y1={y} x2={fullW - 10} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={leftPad - 6} y={y + 3} textAnchor="end" fill="#9ca3af" fontSize={9}>{fmtShort(tick)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = maxVal > 0 ? (d.revenue / maxVal) * chartH : 0;
          const x = leftPad + i * (barW + barGap);
          const y = chartH - h + 5;
          const isHovered = hoveredIdx === i;
          return (
            <g key={d.date} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: "pointer" }}>
              <rect x={x} y={y} width={barW} height={Math.max(h, 0)} fill={isHovered ? PURPLE : GOLD} rx={2} />
              {i % labelStep === 0 && (
                <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fill="#6b7280" fontSize={8}>{d.date.slice(5)}</text>
              )}
              {isHovered && (
                <>
                  <rect x={x + barW / 2 - 30} y={y - 22} width={60} height={18} rx={4} fill={PURPLE} />
                  <text x={x + barW / 2} y={y - 10} textAnchor="middle" fill="#ffffff" fontSize={9} fontWeight="bold">${fmt(d.revenue)}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ServiceDonutChart({ data }: { data: { name: string; revenue: number; color: string }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  if (total === 0) return <p className="py-8 text-center text-sm text-gray-400">No service data.</p>;
  const cx = 80; const cy = 80; const outerR = 70; const innerR = 42;
  let cumAngle = -Math.PI / 2;
  const segments = data.map((d, i) => {
    const pct = d.revenue / total;
    const angle = pct * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const largeArc = angle > Math.PI ? 1 : 0;
    const x1Outer = cx + outerR * Math.cos(startAngle);
    const y1Outer = cy + outerR * Math.sin(startAngle);
    const x2Outer = cx + outerR * Math.cos(endAngle);
    const y2Outer = cy + outerR * Math.sin(endAngle);
    const x1Inner = cx + innerR * Math.cos(endAngle);
    const y1Inner = cy + innerR * Math.sin(endAngle);
    const x2Inner = cx + innerR * Math.cos(startAngle);
    const y2Inner = cy + innerR * Math.sin(startAngle);
    const path = [`M ${x1Outer} ${y1Outer}`, `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`, `L ${x1Inner} ${y1Inner}`, `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`, "Z"].join(" ");
    return { ...d, path, pct, idx: i };
  });
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img">
        {segments.map((seg) => (
          <path key={seg.name} d={seg.path} fill={seg.color} opacity={hoveredIdx !== null && hoveredIdx !== seg.idx ? 0.4 : 1} onMouseEnter={() => setHoveredIdx(seg.idx)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: "pointer" }} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#374151" fontSize={11} fontWeight="bold">${fmt(total)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize={8}>total</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center gap-2 text-sm" onMouseEnter={() => setHoveredIdx(seg.idx)} onMouseLeave={() => setHoveredIdx(null)}>
            <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="truncate text-gray-700">{seg.name}</span>
            <span className="ml-auto whitespace-nowrap font-medium text-gray-900">{(seg.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VanComparisonChart({ van5Revenue, van7Revenue, van5Count, van7Count }: { van5Revenue: number; van7Revenue: number; van5Count: number; van7Count: number }) {
  const maxVal = Math.max(van5Revenue, van7Revenue, 1);
  const chartW = 200;
  const barH = 32;
  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${chartW + 80} 96`} className="w-full" style={{ maxHeight: 120 }}>
        <text x={0} y={20} fill="#374151" fontSize={11} fontWeight="600">Van 5</text>
        <rect x={50} y={8} width={(van5Revenue / maxVal) * chartW} height={barH} fill={GOLD} rx={4} />
        <text x={54 + (van5Revenue / maxVal) * chartW} y={28} fill="#374151" fontSize={10} fontWeight="bold">${fmt(van5Revenue)} ({van5Count} jobs)</text>
        <text x={0} y={68} fill="#374151" fontSize={11} fontWeight="600">Van 7</text>
        <rect x={50} y={56} width={(van7Revenue / maxVal) * chartW} height={barH} fill={PURPLE} rx={4} />
        <text x={54 + (van7Revenue / maxVal) * chartW} y={76} fill="#ffffff" fontSize={10} fontWeight="bold">${fmt(van7Revenue)} ({van7Count} jobs)</text>
      </svg>
    </div>
  );
}

function GroomerPerformanceCards({ appointments }: { appointments: Appointment[] }) {
  const groomerMap = new Map<string, { name: string; jobs: number; revenue: number; commissionRate: number; color: string }>();
  appointments.forEach((a) => {
    if (!a.staff) return;
    const id = a.staff.id ?? a.staff.first_name ?? "";
    const existing = groomerMap.get(id) ?? {
      name: `${a.staff.first_name ?? ""} ${a.staff.last_name ?? ""}`.trim(),
      jobs: 0, revenue: 0,
      commissionRate: a.staff.commission_rate ?? 0,
      color: a.staff.color ?? GOLD,
    };
    existing.jobs += 1;
    existing.revenue += a.price ?? 0;
    groomerMap.set(id, existing);
  });
  const groomers = [...groomerMap.values()].sort((a, b) => b.revenue - a.revenue);
  if (groomers.length === 0) return <p className="py-4 text-sm text-gray-400">No groomer data for this period.</p>;
  const maxRevenue = Math.max(...groomers.map((g) => g.revenue), 1);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groomers.map((g) => {
        const avgTicket = g.jobs > 0 ? g.revenue / g.jobs : 0;
        const commission = g.revenue * (g.commissionRate / 100);
        const barPct = (g.revenue / maxRevenue) * 100;
        return (
          <div key={g.name} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-sm font-bold text-gray-900">{g.name}</span>
            </div>
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${barPct}%`, backgroundColor: g.color }} />
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div><span className="text-gray-500">Jobs</span><p className="font-bold text-gray-900">{g.jobs}</p></div>
              <div><span className="text-gray-500">Revenue</span><p className="font-bold text-gray-900">${fmt(g.revenue)}</p></div>
              <div><span className="text-gray-500">Avg Ticket</span><p className="font-bold text-gray-900">${fmt(avgTicket)}</p></div>
              <div><span className="text-gray-500">Commission ({g.commissionRate}%)</span><p className="font-bold text-green-600">${fmt(commission)}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function exportCSV(appointments: Appointment[], expenses: Expense[], from: string, to: string) {
  const rows: string[][] = [];
  rows.push(["--- APPOINTMENTS ---"]);
  rows.push(["Date", "Client", "Service", "Van", "Status", "Payment", "Price"]);
  appointments.forEach((a) => {
    rows.push([
      a.date,
      a.clients ? `${a.clients.first_name ?? ""} ${a.clients.last_name ?? ""}`.trim() : "",
      a.services?.name ?? "",
      a.van ?? "",
      a.status,
      a.payment_status,
      (a.price ?? 0).toFixed(2),
    ]);
  });
  rows.push([]);
  rows.push(["--- EXPENSES ---"]);
  rows.push(["Date", "Category", "Description", "Amount"]);
  expenses.forEach((e) => { rows.push([e.date, e.category, e.description ?? "", e.amount.toFixed(2)]); });
  const completed = appointments.filter((a) => a.status === "completed");
  const totalRevenue = completed.reduce((s, a) => s + (a.price ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  rows.push([]);
  rows.push(["--- SUMMARY ---"]);
  rows.push(["Total Revenue", totalRevenue.toFixed(2)]);
  rows.push(["Total Expenses", totalExpenses.toFixed(2)]);
  rows.push(["Net Profit", (totalRevenue - totalExpenses).toFixed(2)]);
  const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `urbanmg-report-${from}-to-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsDashboard() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => {
    const end = monthEnd();
    const today = todayStr();
    return end < today ? end : today;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (fromDate: string, toDate: string) => {
    setLoading(true);
    const data = await getReportsData(fromDate, toDate);
    setAppointments(data.appointments as Appointment[]);
    setExpenses(data.expenses as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(from, to); }, [from, to, fetchData]);

  const completed = useMemo(() => appointments.filter((a) => a.status === "completed"), [appointments]);
  const cancelled = useMemo(() => appointments.filter((a) => a.status === "cancelled"), [appointments]);
  const totalRevenue = useMemo(() => completed.reduce((s, a) => s + (a.price ?? 0), 0), [completed]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const netProfit = totalRevenue - totalExpenses;
  const paidCount = useMemo(() => completed.filter((a) => a.payment_status === "paid").length, [completed]);

  const dailyRevenue = useMemo(() => {
    const dates = dateRange(from, to);
    const revenueByDate = new Map<string, number>();
    completed.forEach((a) => { revenueByDate.set(a.date, (revenueByDate.get(a.date) ?? 0) + (a.price ?? 0)); });
    return dates.map((d) => ({ date: d, revenue: revenueByDate.get(d) ?? 0 }));
  }, [from, to, completed]);

  const serviceData = useMemo(() => {
    const map = new Map<string, number>();
    completed.forEach((a) => {
      const name = a.services?.name ?? "Unknown";
      map.set(name, (map.get(name) ?? 0) + (a.price ?? 0));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, revenue], i) => ({ name, revenue, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [completed]);

  const van5 = useMemo(() => completed.filter((a) => a.van === "Van 5"), [completed]);
  const van7 = useMemo(() => completed.filter((a) => a.van === "Van 7"), [completed]);
  const van5Revenue = useMemo(() => van5.reduce((s, a) => s + (a.price ?? 0), 0), [van5]);
  const van7Revenue = useMemo(() => van7.reduce((s, a) => s + (a.price ?? 0), 0), [van7]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => { map.set(e.category, (map.get(e.category) ?? 0) + e.amount); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const rangeLabel = useMemo(() => {
    const f = new Date(from + "T00:00:00");
    const t = new Date(to + "T00:00:00");
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    return `${f.toLocaleDateString("en-US", opts)} - ${t.toLocaleDateString("en-US", opts)}`;
  }, [from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Badge variant="secondary" className="mb-1 text-xs">{rangeLabel}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(appointments, expenses, from, to)} disabled={loading}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-400">Loading report data...</span>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-green-100 p-2.5"><DollarSign size={18} className="text-green-600" /></div><div><p className="text-xs text-gray-500">Revenue</p><p className="text-xl font-bold text-gray-900">${fmt(totalRevenue)}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-red-100 p-2.5"><TrendingDown size={18} className="text-red-600" /></div><div><p className="text-xs text-gray-500">Expenses</p><p className="text-xl font-bold text-gray-900">${fmt(totalExpenses)}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><div className={`rounded-xl p-2.5 ${netProfit >= 0 ? "bg-green-100" : "bg-red-100"}`}><TrendingUp size={18} className={netProfit >= 0 ? "text-green-600" : "text-red-600"} /></div><div><p className="text-xs text-gray-500">Net Profit</p><p className={`text-xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>${fmt(netProfit)}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-2.5"><Calendar size={18} className="text-blue-600" /></div><div><p className="text-xs text-gray-500">Appointments</p><p className="text-xl font-bold text-gray-900">{completed.length}{" "}<span className="text-sm font-normal text-gray-400">/ {appointments.length} total</span></p></div></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign size={16} /> Daily Revenue</CardTitle></CardHeader>
            <CardContent><RevenueBarChart data={dailyRevenue} /></CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scissors size={16} /> Service Breakdown</CardTitle></CardHeader><CardContent><ServiceDonutChart data={serviceData} /></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Truck size={16} /> Van Comparison</CardTitle></CardHeader><CardContent><VanComparisonChart van5Revenue={van5Revenue} van7Revenue={van7Revenue} van5Count={van5.length} van7Count={van7.length} /></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingDown size={16} /> Expense Categories</CardTitle></CardHeader><CardContent className="space-y-3">{expenseBreakdown.length === 0 ? <p className="text-sm text-gray-400">No expenses in this period.</p> : expenseBreakdown.map(([cat, amount]) => (<div key={cat} className="flex items-center justify-between"><span className="text-sm font-medium capitalize text-gray-900">{cat}</span><span className="text-sm font-bold text-red-600">-${fmt(amount)}</span></div>))}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users size={16} /> Collection</CardTitle></CardHeader><CardContent><div className="text-center"><p className="text-4xl font-black text-gray-900">{completed.length > 0 ? Math.round((paidCount / completed.length) * 100) : 0}%</p><p className="mt-1 text-sm text-gray-500">{paidCount} of {completed.length} paid</p>{cancelled.length > 0 && <p className="mt-2 text-xs text-red-400">{cancelled.length} cancelled</p>}</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scissors size={16} /> Groomer Performance</CardTitle></CardHeader>
            <CardContent><GroomerPerformanceCards appointments={completed} /></CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
