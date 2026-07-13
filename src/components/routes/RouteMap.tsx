"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, PawPrint, Phone, Truck, Navigation } from "lucide-react";

interface Appointment {
  id: string;
  start_time: string;
  address: string | null;
  city: string | null;
  van: string | null;
  price: number | null;
  status: string;
  clients: any;
  pets: any;
  services: any;
  staff: any;
}

interface GeoStop {
  appointment: Appointment;
  lat: number;
  lng: number;
  order: number;
}

const MIAMI_CENTER: [number, number] = [25.7617, -80.1918];
const VAN_CONFIG: Record<string, { color: string; label: string }> = {
  "Van 5": { color: "#f2c037", label: "Van 5" },
  "Van 7": { color: "#1e73be", label: "Van 7" },
};

export function RouteMap({ appointments }: { appointments: Appointment[] }) {
  const [leafletMods, setLeafletMods] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [stops, setStops] = useState<GeoStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVan, setSelectedVan] = useState<string | null>(null);

  // Dynamic import
  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl, leaflet]) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setLeafletMods(rl);
      setL(leaflet);
    });
  }, []);

  // Geocode
  useEffect(() => {
    async function geocode() {
      const results: GeoStop[] = [];
      const withAddress = appointments.filter((a) => a.address);
      for (let i = 0; i < withAddress.length; i++) {
        const apt = withAddress[i];
        const query = `${apt.address}, ${apt.city || "Miami"}, FL`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { "User-Agent": "urbanMG/1.0" } }
          );
          const data = await res.json();
          if (data[0]) {
            results.push({ appointment: apt, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), order: i + 1 });
          }
          await new Promise((r) => setTimeout(r, 1100));
        } catch { /* skip */ }
      }
      setStops(results);
      setLoading(false);
    }
    if (appointments.length > 0) geocode();
    else setLoading(false);
  }, [appointments]);

  // Group by van
  const vanGroups = useMemo(() => {
    const groups: Record<string, GeoStop[]> = {};
    const sorted = [...stops].sort((a, b) => a.appointment.start_time.localeCompare(b.appointment.start_time));
    sorted.forEach((s, i) => {
      const van = s.appointment.van || "Unassigned";
      if (!groups[van]) groups[van] = [];
      s.order = groups[van].length + 1;
      groups[van].push(s);
    });
    return groups;
  }, [stops]);

  const displayVans = selectedVan ? { [selectedVan]: vanGroups[selectedVan] || [] } : vanGroups;

  if (!leafletMods || !L) {
    return (
      <Card><CardContent className="flex h-[500px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f2c037] border-t-transparent" />
      </CardContent></Card>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } = leafletMods;

  const allStops = Object.values(displayVans).flat();
  const center: [number, number] = allStops.length > 0
    ? [allStops.reduce((s, st) => s + st.lat, 0) / allStops.length, allStops.reduce((s, st) => s + st.lng, 0) / allStops.length]
    : MIAMI_CENTER;

  function createNumberedIcon(num: number, color: string) {
    return L.divIcon({
      className: "",
      html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:system-ui">${num}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  return (
    <div className="space-y-4">
      {/* Van filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedVan(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${!selectedVan ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          All Vans
        </button>
        {Object.keys(vanGroups).map((van) => {
          const cfg = VAN_CONFIG[van] ?? { color: "#888", label: van };
          const count = vanGroups[van].length;
          return (
            <button
              key={van}
              onClick={() => setSelectedVan(selectedVan === van ? null : van)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${selectedVan === van ? "text-white" : "text-gray-600 hover:opacity-80"}`}
              style={{ backgroundColor: selectedVan === van ? cfg.color : `${cfg.color}20` }}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label} ({count})
            </button>
          );
        })}
        {loading && <span className="text-xs text-gray-400 animate-pulse">Geocoding...</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Map */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardContent className="p-0">
            <MapContainer center={center} zoom={11} style={{ height: "500px", width: "100%" }} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {Object.entries(displayVans).map(([van, vanStops]) => {
                const cfg = VAN_CONFIG[van] ?? { color: "#888", label: van };
                return (
                  <div key={van}>
                    {/* Route line */}
                    {vanStops.length > 1 && (
                      <Polyline
                        positions={vanStops.map((s: GeoStop) => [s.lat, s.lng] as [number, number])}
                        color={cfg.color}
                        weight={4}
                        opacity={0.8}
                      />
                    )}

                    {/* Direction arrows between stops */}
                    {vanStops.length > 1 && vanStops.slice(0, -1).map((s: GeoStop, i: number) => {
                      const next = vanStops[i + 1];
                      const midLat = (s.lat + next.lat) / 2;
                      const midLng = (s.lng + next.lng) / 2;
                      return (
                        <CircleMarker key={`arrow-${i}`} center={[midLat, midLng]} radius={4} fillColor={cfg.color} fillOpacity={0.6} stroke={false}>
                          <Tooltip permanent direction="center" className="!border-0 !bg-transparent !p-0 !shadow-none">
                            <span style={{ fontSize: "10px", color: cfg.color, fontWeight: 900 }}>→</span>
                          </Tooltip>
                        </CircleMarker>
                      );
                    })}

                    {/* Numbered markers */}
                    {vanStops.map((stop: GeoStop) => (
                      <Marker key={stop.appointment.id} position={[stop.lat, stop.lng]} icon={createNumberedIcon(stop.order, cfg.color)}>
                        <Popup>
                          <div className="min-w-[200px]">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: cfg.color }}>{stop.order}</span>
                              <span className="text-sm font-bold">{stop.appointment.clients?.first_name} {stop.appointment.clients?.last_name}</span>
                            </div>
                            <div className="space-y-0.5 text-xs text-gray-500">
                              <div>{stop.appointment.pets?.name} · {stop.appointment.services?.name}</div>
                              <div>{stop.appointment.start_time?.slice(0, 5)}</div>
                              <div>{stop.appointment.address}, {stop.appointment.city}</div>
                              {stop.appointment.clients?.phone && <div>{stop.appointment.clients.phone}</div>}
                            </div>
                            {stop.appointment.price && (
                              <div className="mt-1 text-sm font-bold" style={{ color: cfg.color }}>${stop.appointment.price}</div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </div>
                );
              })}
            </MapContainer>
          </CardContent>
        </Card>

        {/* Itinerary sidebar */}
        <div className="space-y-3">
          {Object.entries(displayVans).map(([van, vanStops]) => {
            const cfg = VAN_CONFIG[van] ?? { color: "#888", label: van };
            const totalRevenue = vanStops.reduce((s: number, st: GeoStop) => s + (st.appointment.price ?? 0), 0);
            return (
              <Card key={van} className="overflow-hidden">
                <div className="h-1" style={{ backgroundColor: cfg.color }} />
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck size={16} style={{ color: cfg.color }} />
                      <span className="text-sm font-bold text-gray-900">{cfg.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{vanStops.length} stops</Badge>
                    </div>
                    <span className="text-sm font-bold" style={{ color: cfg.color }}>${totalRevenue}</span>
                  </div>

                  {vanStops.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-400">No stops</p>
                  ) : (
                    <div className="space-y-0">
                      {vanStops.map((stop: GeoStop, i: number) => (
                        <div key={stop.appointment.id}>
                          <div className="flex gap-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center">
                              <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                                style={{ backgroundColor: cfg.color }}
                              >
                                {stop.order}
                              </div>
                              {i < vanStops.length - 1 && (
                                <div className="w-px flex-1 bg-gray-200" style={{ minHeight: "24px" }} />
                              )}
                            </div>
                            {/* Content */}
                            <div className="min-w-0 flex-1 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900">
                                  {stop.appointment.clients?.first_name} {stop.appointment.clients?.last_name}
                                </span>
                                <span className="text-[10px] font-semibold text-gray-400">{stop.appointment.start_time?.slice(0, 5)}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                                <span>{stop.appointment.pets?.name}</span>
                                <span>·</span>
                                <span>{stop.appointment.services?.name}</span>
                                {stop.appointment.price && <span className="ml-auto font-bold text-gray-600">${stop.appointment.price}</span>}
                              </div>
                              {stop.appointment.address && (
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-300">
                                  <MapPin size={9} /> {stop.appointment.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* No data */}
          {Object.keys(displayVans).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Navigation size={24} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No routes to display</p>
                <p className="text-xs text-gray-300">Add addresses to appointments</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
