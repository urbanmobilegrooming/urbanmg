"use client";

import { useMemo, useState } from "react";
import { Search, X, RefreshCw, Calendar, CreditCard, User, Heart, Receipt, IdCard, Cog, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listActivity, type ActivityEntry } from "@/server/activity";

const TYPE_STYLES: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  appointment: { icon: <Calendar className="h-3 w-3" />, bg: "bg-blue-50", color: "#3b82f6" },
  payment: { icon: <CreditCard className="h-3 w-3" />, bg: "bg-green-50", color: "#16a34a" },
  client: { icon: <User className="h-3 w-3" />, bg: "bg-purple-50", color: "#7c3aed" },
  pet: { icon: <Heart className="h-3 w-3" />, bg: "bg-[#f2c037]/10", color: "#b8860b" },
  invoice: { icon: <Receipt className="h-3 w-3" />, bg: "bg-yellow-50", color: "#d97706" },
  staff: { icon: <IdCard className="h-3 w-3" />, bg: "bg-cyan-50", color: "#0891b2" },
  system: { icon: <Cog className="h-3 w-3" />, bg: "bg-gray-100", color: "#6b7280" },
};

const PAGE = 40;

export function ActivityClient({ initial }: { initial: ActivityEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === PAGE);

  const hasFilters = search || type || from || to;

  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityEntry[]>();
    for (const e of entries) {
      const date = e.created_at.split("T")[0];
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(e);
    }
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    return Array.from(groups.entries()).map(([date, entries]) => ({
      date,
      label: date === today ? "Today" : date === yesterday ? "Yesterday" : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      entries,
    }));
  }, [entries]);

  async function load(reset = true) {
    setLoading(true);
    try {
      const data = await listActivity({ search, type, date_from: from, date_to: to, offset: 0, limit: PAGE });
      setEntries(data);
      setHasMore(data.length === PAGE);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await listActivity({ search, type, date_from: from, date_to: to, offset: entries.length, limit: PAGE });
      setEntries((arr) => [...arr, ...data]);
      setHasMore(data.length === PAGE);
    } finally {
      setLoadingMore(false);
    }
  }

  function clear() {
    setSearch(""); setType(""); setFrom(""); setTo("");
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-800">Activity Log</h1>
        <p className="mt-0.5 text-sm text-gray-500">System-wide timeline of all actions and events</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity..." className="pl-9" />
        </div>
        <Select value={type || "all"} onValueChange={(v: string | null) => setType(v === "all" || !v ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="appointment">Appointments</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="pet">Pets</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
        <span className="text-xs text-gray-400">to</span>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
        <Button size="sm" onClick={() => load()} variant="outline">Apply</Button>
        {hasFilters && (
          <Button size="sm" variant="outline" onClick={clear}><X className="mr-1 h-3 w-3" /> Clear</Button>
        )}
        <Button size="sm" variant="outline" onClick={() => load()} className="ml-auto"><RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20 text-center">
          <Info className="h-8 w-8 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No activity found</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm">
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{group.label}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              {group.entries.map((entry, idx) => {
                const base = entry.type.split("_")[0];
                const style = TYPE_STYLES[base] ?? { icon: <Info className="h-3 w-3" />, bg: "bg-gray-100", color: "#6b7280" };
                return (
                  <div key={entry.id} className={`flex gap-4 px-5 ${idx !== group.entries.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="flex flex-col items-center pt-3.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${style.bg}`} style={{ color: style.color }}>{style.icon}</div>
                    </div>
                    <div className="flex-1 py-3.5">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium text-gray-700">{entry.description}</p>
                        <span className="shrink-0 text-[11px] text-gray-400">{new Date(entry.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {entry.user_name && <span className="text-[11px] text-gray-400">{entry.user_name}</span>}
                        {entry.client_name && <span className="text-[11px] text-gray-400">{entry.client_name}</span>}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{entry.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center p-4">
              <Button variant="outline" disabled={loadingMore} onClick={loadMore}><ChevronDown className="mr-1 h-3 w-3" />{loadingMore ? "Loading..." : "Load More"}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
