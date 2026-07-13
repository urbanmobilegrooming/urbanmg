"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Flame } from "lucide-react";

interface AppointmentData {
  city: string | null;
  address: string | null;
  price: number | null;
}

interface ZoneData {
  zone: string;
  count: number;
  revenue: number;
}

const ZONE_COLORS = [
  { min: 0, bg: "bg-gray-100", text: "text-gray-400", bar: "bg-gray-200" },
  { min: 1, bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-300" },
  { min: 3, bg: "bg-yellow-50", text: "text-yellow-600", bar: "bg-yellow-400" },
  { min: 6, bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-400" },
  { min: 10, bg: "bg-red-50", text: "text-red-600", bar: "bg-red-500" },
];

function getZoneColor(count: number) {
  for (let i = ZONE_COLORS.length - 1; i >= 0; i--) {
    if (count >= ZONE_COLORS[i].min) return ZONE_COLORS[i];
  }
  return ZONE_COLORS[0];
}

export function ServiceHeatMap({ appointments }: { appointments: AppointmentData[] }) {
  // Group by city/zone
  const zones: ZoneData[] = [];
  const map = new Map<string, { count: number; revenue: number }>();

  appointments.forEach((a) => {
    const zone = a.city || "Unknown";
    const existing = map.get(zone) ?? { count: 0, revenue: 0 };
    map.set(zone, { count: existing.count + 1, revenue: existing.revenue + (a.price ?? 0) });
  });

  map.forEach((val, key) => zones.push({ zone: key, ...val }));
  zones.sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...zones.map((z) => z.count), 1);

  if (zones.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-gray-500"><Flame size={16} /> Service Heat Map</CardTitle></CardHeader>
        <CardContent><p className="py-4 text-center text-sm text-gray-400">No data yet</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Flame size={16} className="text-orange-500" /> Service Heat Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Color legend */}
        <div className="mb-4 flex items-center gap-1">
          <span className="text-[10px] text-gray-400">Less</span>
          {ZONE_COLORS.map((c, i) => (
            <div key={i} className={`h-3 w-6 rounded-sm ${c.bar}`} />
          ))}
          <span className="text-[10px] text-gray-400">More</span>
        </div>

        {/* Zone grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {zones.slice(0, 12).map((z) => {
            const color = getZoneColor(z.count);
            const pct = Math.round((z.count / maxCount) * 100);
            return (
              <div key={z.zone} className={`relative overflow-hidden rounded-xl p-3 ${color.bg}`}>
                {/* Background bar */}
                <div className={`absolute bottom-0 left-0 top-0 ${color.bar} opacity-20`} style={{ width: `${pct}%` }} />
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className={color.text} />
                    <span className={`text-xs font-bold ${color.text}`}>{z.zone}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-black text-gray-900">{z.count}</span>
                    <span className="text-[10px] font-semibold text-gray-400">${z.revenue.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top services by zone */}
        <div className="mt-4">
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Busiest Areas</h4>
          <div className="space-y-1.5">
            {zones.slice(0, 5).map((z) => {
              const pct = Math.round((z.count / maxCount) * 100);
              const color = getZoneColor(z.count);
              return (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs font-semibold text-gray-700">{z.zone}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${color.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-bold text-gray-500">{z.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
