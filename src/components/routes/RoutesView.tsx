"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Truck, Clock, MapPin, PawPrint, Phone, DollarSign } from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  start_time: string;
  status: string;
  van_id: string | null;
  address: string | null;
  city: string | null;
  price: number | null;
  clients: { first_name: string; last_name: string; phone: string } | null;
  pets: { name: string; species: string; breed: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
  staff: { first_name: string; last_name: string; color: string } | null;
  vans: { id: string; name: string } | null;
}

interface Van {
  id: string;
  name: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
  no_show: "bg-red-100 text-red-700",
};

const vanColors = ["text-[#f2c037]", "text-[#1e73be]", "text-[#e91e63]", "text-[#4caf50]"];

export function RoutesView({
  appointments,
  staff,
  vans,
  today,
}: {
  appointments: Appointment[];
  staff: any[];
  vans: Van[];
  today: string;
}) {
  const [dateFilter, setDateFilter] = useState(today);

  function getVanAppointments(vanId: string) {
    return appointments.filter((a) => a.van_id === vanId);
  }

  const unassigned = appointments.filter((a) => !a.van_id);
  const totalRevenue = appointments
    .filter((a) => a.price)
    .reduce((sum, a) => sum + (a.price ?? 0), 0);

  function renderVanColumn(van: Van, colorClass: string) {
    const items = getVanAppointments(van.id);
    const vanRevenue = items.reduce((sum, a) => sum + (a.price ?? 0), 0);

    return (
      <div className="flex-1" key={van.id}>
        <div className="mb-3 flex items-center gap-2">
          <Truck size={18} className={colorClass} />
          <h3 className="text-lg font-bold text-gray-900">{van.name}</h3>
          <Badge variant="secondary">{items.length}</Badge>
          {items.length > 0 && (
            <span className="ml-auto text-sm font-semibold text-gray-500">
              ${vanRevenue.toFixed(0)}
            </span>
          )}
        </div>
        {van.license_plate && (
          <p className="mb-2 text-xs text-gray-400">
            {van.make} {van.model} · {van.license_plate}
          </p>
        )}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-400">
              No appointments
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((apt, idx) => (
              <Card key={apt.id} className="relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: apt.staff?.color ?? "#e5e7eb" }}
                />
                <CardContent className="p-4 pl-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {apt.clients?.first_name} {apt.clients?.last_name}
                        </span>
                        <Badge className={statusColors[apt.status] ?? "bg-gray-100 text-gray-600"}>
                          {apt.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <PawPrint size={11} /> {apt.pets?.name}
                          {apt.pets?.breed && (
                            <span className="text-gray-400">({apt.pets.breed})</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {apt.start_time?.slice(0, 5)}
                        </span>
                        <span>{apt.services?.name}</span>
                      </div>
                      {apt.address && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} /> {apt.address}
                          {apt.city ? `, ${apt.city}` : ""}
                        </div>
                      )}
                      {apt.clients?.phone && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={11} /> {apt.clients.phone}
                        </div>
                      )}
                    </div>
                    {apt.price != null && (
                      <span className="text-sm font-bold text-gray-900">
                        ${apt.price}
                      </span>
                    )}
                  </div>
                  {apt.staff && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: apt.staff.color }}
                      />
                      <span className="text-xs font-medium text-gray-500">
                        {apt.staff.first_name} {apt.staff.last_name}
                      </span>
                    </div>
                  )}
                  {idx < items.length - 1 && (
                    <div className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border bg-white text-xs text-gray-300">
                      ↓
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
        />
        <span className="text-sm text-gray-500">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} today
        </span>
        <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-gray-700">
          <DollarSign size={14} /> {totalRevenue.toFixed(2)}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        {vans.map((van, i) => renderVanColumn(van, vanColors[i % vanColors.length]))}
      </div>

      {unassigned.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-gray-500">
            Unassigned ({unassigned.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {unassigned.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="p-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {apt.clients?.first_name} {apt.clients?.last_name}
                  </span>
                  <span className="mx-1 text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{apt.pets?.name}</span>
                  <span className="mx-1 text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {apt.start_time?.slice(0, 5)}
                  </span>
                  {apt.price != null && (
                    <>
                      <span className="mx-1 text-gray-300">·</span>
                      <span className="text-xs font-semibold text-gray-600">
                        ${apt.price}
                      </span>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

