"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogIn, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";
import { clockIn as clockInAction, clockOut as clockOutAction } from "@/server/staff";

interface ClockRecord {
  id: string;
  clock_in: string | Date;
  clock_out: string | Date | null;
  total_hours: number | null;
  notes: string | null;
}

export function StaffClockRecords({ staffId, records }: { staffId: string; records: ClockRecord[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const activeShift = records.find((r) => !r.clock_out);

  async function handleClockIn() {
    setLoading(true);
    try {
      await clockInAction(staffId);
      toast.success("Clocked in");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  async function handleClockOut() {
    if (!activeShift) return;
    setLoading(true);
    try {
      const hours = await clockOutAction(activeShift.id, staffId);
      toast.success(`Clocked out · ${hours}h`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  const totalHours = records.filter((r) => r.total_hours).reduce((sum, r) => sum + (r.total_hours ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock size={16} /> Time Tracking
            {activeShift && <Badge className="bg-green-100 text-green-700">On shift</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            {activeShift ? (
              <Button size="sm" onClick={handleClockOut} disabled={loading} className="bg-red-500 text-white hover:bg-red-600">
                <LogOut size={14} className="mr-1" /> Clock Out
              </Button>
            ) : (
              <Button size="sm" onClick={handleClockIn} disabled={loading} className="bg-green-500 text-white hover:bg-green-600">
                <LogIn size={14} className="mr-1" /> Clock In
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">Total: {totalHours.toFixed(1)}h this period</p>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No clock records</p>
        ) : (
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.clock_in).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{new Date(r.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                  <TableCell className="text-xs">
                    {r.clock_out ? new Date(r.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : <Badge className="bg-green-100 text-green-700">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right text-xs font-semibold">{r.total_hours ? `${r.total_hours}h` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
