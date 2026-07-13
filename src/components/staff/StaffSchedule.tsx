"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Ban, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { addBlockTime, deleteBlockTime, saveSchedules } from "@/server/staff";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlockTime {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string | null;
}

export function StaffSchedule({
  staffId, schedules, blockTimes,
}: {
  staffId: string;
  schedules: Schedule[];
  blockTimes: BlockTime[];
}) {
  const [saving, setSaving] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", start_time: "09:00", end_time: "17:00", description: "" });
  const [editSchedules, setEditSchedules] = useState<Record<number, { start: string; end: string; active: boolean }>>(() => {
    const map: Record<number, { start: string; end: string; active: boolean }> = {};
    for (let i = 0; i < 7; i++) {
      const existing = schedules.find((s) => s.day_of_week === i);
      map[i] = existing
        ? { start: existing.start_time.slice(0, 5), end: existing.end_time.slice(0, 5), active: existing.is_available }
        : { start: "08:00", end: "17:00", active: i >= 1 && i <= 5 };
    }
    return map;
  });
  const router = useRouter();

  async function handleSaveSchedules() {
    setSaving(true);
    try {
      const rows = Object.entries(editSchedules).map(([day, val]) => ({
        day_of_week: Number(day),
        start_time: val.start,
        end_time: val.end,
        is_available: val.active,
      }));
      await saveSchedules(staffId, rows);
      toast.success("Schedule saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleAddBlockTime(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addBlockTime({
        staff_id: staffId,
        date: blockForm.date,
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        description: blockForm.description || null,
      });
      toast.success("Block time added");
      setBlockOpen(false);
      setBlockForm({ date: "", start_time: "09:00", end_time: "17:00", description: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDeleteBlock(id: string) {
    try {
      await deleteBlockTime(id, staffId);
      toast.success("Removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Clock size={16} /> Weekly Schedule</CardTitle>
            <Button size="sm" onClick={handleSaveSchedules} disabled={saving} className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">
              <Save size={14} className="mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {DAYS.map((day, i) => {
            const sched = editSchedules[i];
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
                <button
                  type="button"
                  onClick={() => setEditSchedules({ ...editSchedules, [i]: { ...sched, active: !sched.active } })}
                  className={`w-20 shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                    sched.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
                {sched.active ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={sched.start} onChange={(e) => setEditSchedules({ ...editSchedules, [i]: { ...sched, start: e.target.value } })} className="rounded border px-2 py-1 text-xs" />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="time" value={sched.end} onChange={(e) => setEditSchedules({ ...editSchedules, [i]: { ...sched, end: e.target.value } })} className="rounded border px-2 py-1 text-xs" />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Day off</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Ban size={16} /> Block Times</CardTitle>
            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
              <DialogTrigger render={<Button size="sm" className="bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]" />}>
                <Plus size={14} className="mr-1" /> Add
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Block Time</DialogTitle></DialogHeader>
                <form onSubmit={handleAddBlockTime} className="space-y-4">
                  <div><Label>Date *</Label><Input type="date" value={blockForm.date} onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })} required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>From</Label><Input type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })} /></div>
                    <div><Label>To</Label><Input type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })} /></div>
                  </div>
                  <div><Label>Reason</Label><Input value={blockForm.description} onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })} placeholder="e.g. Doctor appointment" /></div>
                  <Button type="submit" className="w-full bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">Add Block</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {blockTimes.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No upcoming block times</p>
          ) : (
            <div className="space-y-2">
              {blockTimes.map((bt) => (
                <div key={bt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{bt.date}</div>
                    <div className="text-xs text-gray-400">{bt.start_time.slice(0, 5)} - {bt.end_time.slice(0, 5)}{bt.description ? ` · ${bt.description}` : ""}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteBlock(bt.id)} className="h-7 text-red-400"><Trash2 size={12} /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
