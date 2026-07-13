"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  DollarSign, Percent, Scissors, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Printer, Download, CheckCircle, Plus, Trash2, Minus,
} from "lucide-react";
import { toast } from "sonner";
import {
  addDeduction,
  getPeriod,
  listDeductions,
  markPeriodPaid,
  removeDeduction,
} from "@/server/payroll";
import { listAppointmentsForRange } from "@/server/appointments";

interface Appointment {
  id: string;
  date: string;
  price: number | null;
  van: string | null;
  staff: { id: string; first_name?: string; last_name?: string; commission_rate?: number; color?: string } | null;
  services: { name: string } | null;
  clients: { first_name: string; last_name: string } | null;
  pets: { name: string } | null;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  commission_rate: number;
  color: string;
}

interface Deduction {
  id: string;
  staff_id: string;
  period_year: number;
  period_month: number;
  description: string;
  amount: number;
}

interface PayrollPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  paid_at: Date | string | null;
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function firstOfMonth(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().split("T")[0];
}
function lastOfMonth(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().split("T")[0];
}

export function PayrollView({
  appointments: initialAppointments,
  staff: initialStaff,
}: {
  appointments: Appointment[];
  staff: StaffMember[];
}) {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [staff] = useState<StaffMember[]>(initialStaff);
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const [expandedGroomers, setExpandedGroomers] = useState<Set<string>>(new Set());
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false);
  const [deductionStaffId, setDeductionStaffId] = useState<string>("");
  const [deductionDesc, setDeductionDesc] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [savingDeduction, setSavingDeduction] = useState(false);

  useEffect(() => {
    const isInitial = year === now.getFullYear() && month === now.getMonth();
    setLoading(true);
    (async () => {
      const start = firstOfMonth(year, month);
      const end = lastOfMonth(year, month);
      const [deds, per, appts] = await Promise.all([
        listDeductions(year, month + 1),
        getPeriod(start, end),
        isInitial ? Promise.resolve<Appointment[] | null>(null) : listAppointmentsForRange(start, end, { status: "completed" }) as unknown as Promise<Appointment[]>,
      ]);
      setDeductions(deds);
      setPeriod(per);
      if (appts) setAppointments(appts);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function prevMonth() {
    setMonth((prev) => { if (prev === 0) { setYear((y) => y - 1); return 11; } return prev - 1; });
  }
  function nextMonth() {
    setMonth((prev) => { if (prev === 11) { setYear((y) => y + 1); return 0; } return prev + 1; });
  }
  function toggleGroomer(id: string) {
    setExpandedGroomers((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  async function handleAddDeduction() {
    if (!deductionStaffId || !deductionDesc.trim() || !deductionAmount) return;
    setSavingDeduction(true);
    try {
      await addDeduction({
        staff_id: deductionStaffId,
        period_year: year,
        period_month: month + 1,
        description: deductionDesc.trim(),
        amount: parseFloat(deductionAmount),
      });
      toast.success("Deduction added");
      setDeductionDesc("");
      setDeductionAmount("");
      setDeductionDialogOpen(false);
      const data = await listDeductions(year, month + 1);
      setDeductions(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSavingDeduction(false);
  }

  async function handleRemoveDeduction(id: string) {
    try {
      await removeDeduction(id);
      setDeductions((prev) => prev.filter((d) => d.id !== id));
      toast.success("Deduction removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleMarkAsPaid() {
    setMarkingPaid(true);
    try {
      const start = firstOfMonth(year, month);
      const end = lastOfMonth(year, month);
      const result = await markPeriodPaid(start, end);
      setPeriod(result);
      toast.success("Period marked as paid");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setMarkingPaid(false);
  }

  const groomerData = useMemo(() => {
    return staff.map((s) => {
      const jobs = appointments.filter((a) => a.staff?.id === s.id);
      const totalRevenue = jobs.reduce((sum, a) => sum + (a.price ?? 0), 0);
      const commission = totalRevenue * (s.commission_rate / 100);
      const staffDeductions = deductions.filter((d) => d.staff_id === s.id);
      const totalDeductions = staffDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
      const netPay = commission - totalDeductions;
      return { ...s, jobs, totalRevenue, commission, staffDeductions, totalDeductions, netPay };
    });
  }, [appointments, staff, deductions]);

  function exportCSV() {
    const rows: string[][] = [["Groomer", "Jobs", "Revenue", "Commission Rate", "Gross Commission", "Deductions", "Net Pay"]];
    groomerData.forEach((g) => {
      rows.push([
        `${g.first_name} ${g.last_name}`,
        String(g.jobs.length),
        g.totalRevenue.toFixed(2),
        `${g.commission_rate}%`,
        g.commission.toFixed(2),
        g.totalDeductions.toFixed(2),
        g.netPay.toFixed(2),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${year}-${String(month + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalCommissions = groomerData.reduce((sum, g) => sum + g.commission, 0);
  const totalRevenue = appointments.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const totalDeductions = groomerData.reduce((sum, g) => sum + g.totalDeductions, 0);
  const totalNetPay = groomerData.reduce((sum, g) => sum + g.netPay, 0);
  const isPaid = period?.status === "paid";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} disabled={loading}><ChevronLeft size={16} /></Button>
          <span className="min-w-[170px] text-center text-lg font-semibold text-gray-900">{monthLabel(year, month)}</span>
          <Button variant="outline" size="icon" onClick={nextMonth} disabled={loading}><ChevronRight size={16} /></Button>
        </div>

        <div className="flex items-center gap-2">
          {isPaid ? (
            <Badge className="bg-green-100 text-green-700 gap-1">
              <CheckCircle size={14} /> Paid{" "}
              {period?.paid_at
                ? new Date(period.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                : ""}
            </Badge>
          ) : (
            <Button variant="default" size="sm" onClick={handleMarkAsPaid} disabled={markingPaid || loading} className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle size={14} className="mr-1" /> Mark as Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} className="mr-1" /> Print</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download size={14} className="mr-1" /> CSV</Button>
        </div>
      </div>

      {loading && <div className="text-center text-sm text-gray-400 py-4">Loading...</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-green-100 p-3 print:hidden"><DollarSign size={20} className="text-green-600" /></div><div><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-[#f2c037]/20 p-3 print:hidden"><Percent size={20} className="text-[#f2c037]" /></div><div><p className="text-sm text-gray-500">Gross Commissions</p><p className="text-2xl font-bold text-gray-900">${totalCommissions.toFixed(2)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-red-100 p-3 print:hidden"><Minus size={20} className="text-red-600" /></div><div><p className="text-sm text-gray-500">Total Deductions</p><p className="text-2xl font-bold text-gray-900">${totalDeductions.toFixed(2)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-blue-100 p-3 print:hidden"><Scissors size={20} className="text-blue-600" /></div><div><p className="text-sm text-gray-500">Total Net Pay</p><p className="text-2xl font-bold text-gray-900">${totalNetPay.toFixed(2)}</p></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
        {groomerData.map((g) => {
          const isExpanded = expandedGroomers.has(g.id);
          return (
            <Card key={g.id} className="overflow-hidden print:break-inside-avoid">
              <div className="h-1.5" style={{ backgroundColor: g.color }} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{g.first_name} {g.last_name}</CardTitle>
                  <Badge variant="secondary">{g.commission_rate}% commission</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{g.jobs.length} jobs</span>
                  <span>Revenue: ${g.totalRevenue.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-xs text-gray-500">Gross</p><p className="text-lg font-bold" style={{ color: g.color }}>${g.commission.toFixed(2)}</p></div>
                    <div><p className="text-xs text-gray-500">Deductions</p><p className="text-lg font-bold text-red-600">-${g.totalDeductions.toFixed(2)}</p></div>
                    <div><p className="text-xs text-gray-500">Net Pay</p><p className="text-lg font-bold text-gray-900">${g.netPay.toFixed(2)}</p></div>
                  </div>
                </div>

                {g.staffDeductions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deductions</p>
                    {g.staffDeductions.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-1.5 text-sm">
                        <span className="text-gray-700">{d.description}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-600">-${Number(d.amount).toFixed(2)}</span>
                          <button onClick={() => handleRemoveDeduction(d.id)} className="text-gray-400 hover:text-red-500 transition-colors print:hidden"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="print:hidden">
                  <Dialog
                    open={deductionDialogOpen && deductionStaffId === g.id}
                    onOpenChange={(open) => { setDeductionDialogOpen(open); if (open) setDeductionStaffId(g.id); }}
                  >
                    <DialogTrigger render={<Button variant="outline" size="sm" className="w-full text-xs"><Plus size={14} className="mr-1" /> Add Deduction</Button>} />
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Deduction -- {g.first_name} {g.last_name}</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-2">
                        <div><label className="text-xs font-medium text-gray-500">Description</label><Input placeholder="Cash advance, supply purchase, penalty..." value={deductionDesc} onChange={(e) => setDeductionDesc(e.target.value)} /></div>
                        <div><label className="text-xs font-medium text-gray-500">Amount ($)</label><Input type="number" min="0" step="0.01" placeholder="0.00" value={deductionAmount} onChange={(e) => setDeductionAmount(e.target.value)} /></div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddDeduction} disabled={savingDeduction || !deductionDesc.trim() || !deductionAmount}>{savingDeduction ? "Saving..." : "Add Deduction"}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {g.jobs.length > 0 && (
                  <div>
                    <button onClick={() => toggleGroomer(g.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors print:hidden">
                      <span>{isExpanded ? "Hide" : "Show"} job details ({g.jobs.length})</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div className={isExpanded ? "mt-2" : "hidden print:block print:mt-2"}>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="text-right">Comm.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {g.jobs.map((job) => (
                              <TableRow key={job.id}>
                                <TableCell className="text-xs">{job.date}</TableCell>
                                <TableCell className="text-xs">{job.clients?.first_name} {job.clients?.last_name}</TableCell>
                                <TableCell className="text-xs">{job.services?.name}</TableCell>
                                <TableCell className="text-right text-xs">${job.price ?? 0}</TableCell>
                                <TableCell className="text-right text-xs font-semibold">${((job.price ?? 0) * (g.commission_rate / 100)).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {g.jobs.length === 0 && <p className="py-4 text-center text-sm text-gray-400">No completed jobs this month</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
