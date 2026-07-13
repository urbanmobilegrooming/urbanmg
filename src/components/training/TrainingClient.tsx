"use client";

import { useMemo, useState } from "react";
import { Plus, BookOpen, CheckCircle, Clock, Percent, Sun, RefreshCw, Play, Check, Circle, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTrainingModule, setTrainingProgress, type TrainingModuleRow } from "@/server/training";

type Item = { id: string; label: string; checked: boolean };

const PRE_ITEMS: Item[] = [
  { id: "pre1", label: "Check pet ID and vaccine records", checked: false },
  { id: "pre2", label: "Inspect skin for irritations or parasites", checked: false },
  { id: "pre3", label: "Assess matting level and coat condition", checked: false },
  { id: "pre4", label: "Note any injuries or sensitive areas", checked: false },
  { id: "pre5", label: "Confirm requested service with owner", checked: false },
  { id: "pre6", label: "Set up and test all equipment", checked: false },
];
const POST_ITEMS: Item[] = [
  { id: "post1", label: "Clean and sanitize all tools", checked: false },
  { id: "post2", label: "Check for any cuts or nicks on pet", checked: false },
  { id: "post3", label: "Apply cologne or finishing spray", checked: false },
  { id: "post4", label: "Take after photos for report card", checked: false },
  { id: "post5", label: "Fill out grooming report card", checked: false },
  { id: "post6", label: "Clean van workspace and dispose of waste", checked: false },
];

const CATEGORIES: Record<string, { label: string; color: string }> = {
  grooming: { label: "Grooming", color: "bg-purple-100 text-purple-700" },
  safety: { label: "Safety", color: "bg-red-100 text-red-700" },
  products: { label: "Products", color: "bg-green-100 text-green-700" },
  service: { label: "Service", color: "bg-blue-100 text-blue-700" },
  equipment: { label: "Equipment", color: "bg-orange-100 text-orange-700" },
  policy: { label: "Policy", color: "bg-gray-100 text-gray-700" },
};

export function TrainingClient({ initialModules }: { initialModules: TrainingModuleRow[] }) {
  const [modules, setModules] = useState(initialModules);
  const [pre, setPre] = useState(PRE_ITEMS);
  const [post, setPost] = useState(POST_ITEMS);
  const [activeCategory, setActiveCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "grooming", duration_minutes: 30 });

  const preChecked = pre.filter((i) => i.checked).length;
  const postChecked = post.filter((i) => i.checked).length;
  const completedCount = modules.filter((m) => m.status === "completed").length;
  const totalMinutes = modules.reduce((s, m) => s + m.duration_minutes, 0);
  const completionPct = modules.length ? completedCount / modules.length : 0;

  const filtered = useMemo(() => (activeCategory ? modules.filter((m) => m.category === activeCategory) : modules), [modules, activeCategory]);

  function togglePre(id: string) {
    setPre((items) => items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }
  function togglePost(id: string) {
    setPost((items) => items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }

  async function cycle(mod: TrainingModuleRow) {
    const next: Record<string, string> = { not_started: "in_progress", in_progress: "completed", completed: "not_started" };
    const status = next[mod.status ?? "not_started"];
    setModules((ms) => ms.map((m) => (m.id === mod.id ? { ...m, status } : m)));
    // Without a staff id we cannot persist; just toast
    toast.success(`Marked ${status.replace("_", " ")}`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const row = await createTrainingModule(form);
      setModules((m) => [
        ...m,
        {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          duration_minutes: row.durationMinutes,
          is_active: row.isActive,
          created_at: row.createdAt.toISOString(),
          status: "not_started",
          completed_at: null,
        },
      ]);
      setOpen(false);
      setForm({ title: "", description: "", category: "grooming", duration_minutes: 30 });
      toast.success("Module created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Training & Checklists</h1>
          <p className="mt-0.5 text-sm text-gray-500">Grooming checklists and staff training modules</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#2C0F73] hover:bg-[#3d1a99]">
          <Plus className="mr-2 h-4 w-4" /> Add Module
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<BookOpen className="h-5 w-5 text-[#2C0F73]" />} value={modules.length} label="Total Modules" bg="bg-[#2C0F73]/10" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-500" />} value={completedCount} label="Completed" bg="bg-green-50" />
        <StatCard icon={<Clock className="h-5 w-5 text-[#f2c037]" />} value={`${totalMinutes}m`} label="Total Learning Time" bg="bg-[#f2c037]/15" />
        <StatCard icon={<Percent className="h-5 w-5 text-blue-500" />} value={`${Math.round(completionPct * 100)}%`} label="Completion Rate" bg="bg-blue-50" />
      </div>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">Checklists</TabsTrigger>
          <TabsTrigger value="modules">Training Modules ({modules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <ChecklistCard title="Pre-Grooming Checklist" subtitle="Complete before starting each appointment" items={pre} onToggle={togglePre} checked={preChecked} accent="blue" onReset={() => setPre(PRE_ITEMS.map((i) => ({ ...i, checked: false })))} icon={<Sun className="text-blue-500 h-5 w-5" />} />
            <ChecklistCard title="Post-Grooming Checklist" subtitle="Complete after finishing each appointment" items={post} onToggle={togglePost} checked={postChecked} accent="green" onReset={() => setPost(POST_ITEMS.map((i) => ({ ...i, checked: false })))} icon={<CheckCircle className="text-green-500 h-5 w-5" />} />
          </div>
          {preChecked === pre.length && postChecked === post.length && (
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <div className="font-bold text-green-800">All items complete!</div>
                <div className="text-sm text-green-600">Both checklists are fully checked off. Great job!</div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="modules">
          <div className="py-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCategory("")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${activeCategory === "" ? "border-[#2C0F73] bg-[#2C0F73] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>All</button>
              {Object.entries(CATEGORIES).map(([key, meta]) => (
                <button key={key} onClick={() => setActiveCategory(key)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${activeCategory === key ? "border-[#2C0F73] bg-[#2C0F73] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>{meta.label}</button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((mod) => (
                <div key={mod.id} className={`flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md ${mod.status === "completed" ? "border-green-200 bg-green-50/30" : ""}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${CATEGORIES[mod.category]?.color ?? "bg-gray-100 text-gray-700"}`}>
                      <ScrollText className="h-3 w-3" /> {CATEGORIES[mod.category]?.label ?? mod.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock className="h-3 w-3" /> {mod.duration_minutes} min
                    </span>
                  </div>
                  <div className="mb-4 flex-1">
                    <h3 className="mb-1 font-bold text-gray-900">{mod.title}</h3>
                    <p className="text-xs leading-relaxed text-gray-500">{mod.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${mod.status === "completed" ? "bg-green-100 text-green-700" : mod.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                      {mod.status === "completed" ? <><Check className="h-3 w-3" /> Completed</> : mod.status === "in_progress" ? <><Clock className="h-3 w-3" /> In Progress</> : <><Circle className="h-3 w-3" /> Not Started</>}
                    </span>
                    <Button size="sm" onClick={() => cycle(mod)} className={mod.status === "completed" ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-[#2C0F73] hover:bg-[#3d1a99]"}>
                      {mod.status === "completed" ? <><RefreshCw className="mr-1 h-3 w-3" />Reset</> : mod.status === "in_progress" ? <><Check className="mr-1 h-3 w-3" />Mark Done</> : <><Play className="mr-1 h-3 w-3" />Start</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && <div className="py-16 text-center text-sm text-gray-400">No modules in this category</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Training Module</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Advanced Doodle Cuts" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: string | null) => setForm({ ...form, category: v ?? "" })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#2C0F73] hover:bg-[#3d1a99]">{saving ? "Saving..." : "Create Module"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, value, label, bg }: { icon: React.ReactNode; value: React.ReactNode; label: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div className="mt-3 text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function ChecklistCard({ title, subtitle, items, onToggle, checked, accent, onReset, icon }: { title: string; subtitle: string; items: Item[]; onToggle: (id: string) => void; checked: number; accent: "blue" | "green"; onReset: () => void; icon: React.ReactNode }) {
  const accentBar = accent === "blue" ? "bg-blue-400" : "bg-green-400";
  const accentText = accent === "blue" ? "text-blue-500" : "text-green-500";
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent === "blue" ? "bg-blue-50" : "bg-green-50"}`}>{icon}</div>
        <div className="flex-1">
          <div className="font-bold text-gray-900">{title}</div>
          <div className="text-xs text-gray-400">{subtitle}</div>
        </div>
        <span className={`text-sm font-bold ${accentText}`}>{checked}/{items.length}</span>
      </div>
      <div className="px-5 pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${accentBar} transition-all duration-300`} style={{ width: `${(checked / items.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-1 p-4">
        {items.map((item) => (
          <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-gray-50 ${item.checked ? "opacity-60" : ""}`}>
            <input type="checkbox" checked={item.checked} onChange={() => onToggle(item.id)} className="h-4 w-4 rounded border-gray-300 accent-[#2C0F73]" />
            <span className={`text-sm text-gray-700 ${item.checked ? "line-through text-gray-400" : ""}`}>{item.label}</span>
          </label>
        ))}
      </div>
      <div className="border-t border-gray-100 px-5 py-3">
        <button onClick={onReset} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="mr-1 inline h-3 w-3" /> Reset checklist
        </button>
      </div>
    </div>
  );
}
