"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, PawPrint, Scissors, User, Truck } from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  van: string | null;
  price: number | null;
  notes: string | null;
  clients: any;
  pets: any;
  services: any;
  staff: any;
}

const statusColors: Record<string, string> = {
  scheduled: "border-l-blue-400 bg-blue-50",
  confirmed: "border-l-green-400 bg-green-50",
  in_progress: "border-l-yellow-400 bg-yellow-50",
  completed: "border-l-gray-300 bg-gray-50",
  cancelled: "border-l-red-300 bg-red-50 opacity-50",
  no_show: "border-l-orange-400 bg-orange-50",
};

const statusDot: Record<string, string> = {
  scheduled: "bg-blue-400",
  confirmed: "bg-green-400",
  in_progress: "bg-yellow-400",
  completed: "bg-gray-400",
  cancelled: "bg-red-400",
  no_show: "bg-orange-400",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm

export function AppointmentCalendar({
  appointments,
  onStatusChange,
}: {
  appointments: Appointment[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [view, setView] = useState<"day" | "week">("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateStr = currentDate.toISOString().split("T")[0];

  // Week dates
  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate.toISOString()]);

  function navigate(dir: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === "day" ? dir : dir * 7));
    setCurrentDate(d);
  }

  function getAppointmentsForDate(date: string) {
    return appointments.filter((a) => a.date === date);
  }

  function getTopPosition(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h - 7) * 60 + m) * (80 / 60); // 80px per hour
  }

  function getHeight(startTime: string, duration: number): number {
    return duration * (80 / 60);
  }

  const nextStatus: Record<string, string> = {
    scheduled: "confirmed",
    confirmed: "in_progress",
    in_progress: "completed",
  };

  const actionLabels: Record<string, string> = {
    scheduled: "Confirm",
    confirmed: "Check In",
    in_progress: "Complete",
  };

  function renderAppointmentBlock(apt: Appointment) {
    const duration = apt.services?.duration_minutes ?? 60;
    const clientName = apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : "Unknown";

    return (
      <div
        key={apt.id}
        className={`group absolute left-1 right-1 cursor-pointer rounded-lg border-l-4 px-2.5 py-1.5 transition-shadow hover:shadow-md ${statusColors[apt.status] ?? "border-l-gray-300 bg-gray-50"}`}
        style={{
          top: `${getTopPosition(apt.start_time)}px`,
          minHeight: `${Math.max(getHeight(apt.start_time, duration), 36)}px`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[apt.status] ?? "bg-gray-400"}`} />
              <span className="truncate text-xs font-bold text-gray-900">{clientName}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-0.5"><PawPrint size={9} /> {apt.pets?.name}</span>
              <span className="flex items-center gap-0.5"><Clock size={9} /> {apt.start_time?.slice(0, 5)}</span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-gray-400">
              {apt.services?.name}
              {apt.staff && <span> · {apt.staff.first_name}</span>}
            </div>
          </div>
          {apt.price && (
            <span className="shrink-0 text-[10px] font-bold text-gray-700">${apt.price}</span>
          )}
        </div>
        {/* Quick action on hover */}
        {nextStatus[apt.status] && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange(apt.id, nextStatus[apt.status]); }}
            className="absolute -right-1 -top-1 hidden rounded-full bg-[#f2c037] px-2 py-0.5 text-[9px] font-bold text-[#1a0a3e] shadow group-hover:block"
          >
            {actionLabels[apt.status]}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight size={16} />
          </Button>
          <h2 className="ml-2 text-lg font-bold text-gray-900">
            {view === "day"
              ? currentDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })
              : `${weekDates[0].toLocaleDateString("en", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en", { month: "short", day: "numeric" })}`
            }
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setView("day")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${view === "day" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Day
          </button>
          <button
            onClick={() => setView("week")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${view === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Status legend */}
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.entries(statusDot).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-[10px] capitalize text-gray-400">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Time gutter */}
            <div className="w-10 sm:w-14 shrink-0 border-r bg-gray-50">
              {HOURS.map((h) => (
                <div key={h} className="flex h-[80px] items-start justify-end pr-2 pt-0.5">
                  <span className="text-[10px] font-medium text-gray-400">
                    {h > 12 ? `${h - 12}pm` : h === 12 ? "12pm" : `${h}am`}
                  </span>
                </div>
              ))}
            </div>

            {view === "day" ? (
              /* Day view - single column */
              <div className="relative min-h-0 flex-1">
                {HOURS.map((h) => (
                  <div key={h} className="h-[80px] border-b border-gray-100" />
                ))}
                {getAppointmentsForDate(dateStr).map(renderAppointmentBlock)}
              </div>
            ) : (
              /* Week view - 7 columns */
              <div className="flex min-h-0 flex-1">
                {weekDates.map((wd) => {
                  const wdStr = wd.toISOString().split("T")[0];
                  const isToday = wdStr === new Date().toISOString().split("T")[0];
                  return (
                    <div key={wdStr} className="relative flex-1 border-r last:border-r-0">
                      {/* Day header */}
                      <div className={`sticky top-0 z-10 border-b px-1 py-1.5 text-center ${isToday ? "bg-[#f2c037]/10" : "bg-gray-50"}`}>
                        <div className="text-[10px] font-medium text-gray-400">
                          {wd.toLocaleDateString("en", { weekday: "short" })}
                        </div>
                        <div className={`text-sm font-bold ${isToday ? "text-[#f2c037]" : "text-gray-700"}`}>
                          {wd.getDate()}
                        </div>
                      </div>
                      {/* Hour lines */}
                      {HOURS.map((h) => (
                        <div key={h} className="h-[80px] border-b border-gray-50" />
                      ))}
                      {/* Appointments */}
                      {getAppointmentsForDate(wdStr).map(renderAppointmentBlock)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
