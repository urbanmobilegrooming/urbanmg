"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Zone = {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  color: string;
  popular?: boolean;
};

const ZONES: Zone[] = [
  // Miami-Dade
  { name: "Brickell",        lat: 25.7617, lng: -80.1918, radiusKm: 2.5, color: "#f2c037", popular: true },
  { name: "Miami Beach",     lat: 25.7907, lng: -80.1300, radiusKm: 3,   color: "#f2c037", popular: true },
  { name: "Coral Gables",    lat: 25.7215, lng: -80.2684, radiusKm: 3.5, color: "#f2c037", popular: true },
  { name: "Pinecrest",       lat: 25.6679, lng: -80.3081, radiusKm: 3,   color: "#f2c037", popular: true },
  { name: "Doral",           lat: 25.8195, lng: -80.3553, radiusKm: 3.5, color: "#f2c037", popular: true },
  { name: "Kendall",         lat: 25.6793, lng: -80.3173, radiusKm: 4,   color: "#1e73be" },
  { name: "Key Biscayne",    lat: 25.6936, lng: -80.1626, radiusKm: 2,   color: "#1e73be" },
  { name: "South Miami",     lat: 25.7079, lng: -80.2932, radiusKm: 2,   color: "#1e73be" },
  { name: "Cutler Bay",      lat: 25.5784, lng: -80.3470, radiusKm: 3,   color: "#1e73be" },
  { name: "Homestead",       lat: 25.4687, lng: -80.4776, radiusKm: 4,   color: "#1e73be" },
  // Parts of Broward
  { name: "Aventura",        lat: 25.9565, lng: -80.1392, radiusKm: 2.5, color: "#a855f7" },
  { name: "Pembroke Pines",  lat: 26.0034, lng: -80.2237, radiusKm: 4,   color: "#a855f7" },
  { name: "Hollywood",       lat: 26.0112, lng: -80.1495, radiusKm: 3.5, color: "#a855f7" },
  { name: "Sunrise",         lat: 26.1339, lng: -80.2569, radiusKm: 3.5, color: "#a855f7" },
  { name: "Fort Lauderdale", lat: 26.1224, lng: -80.1373, radiusKm: 4,   color: "#a855f7" },
];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(ZONES.map((z) => [z.lat, z.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map]);
  return null;
}

export default function ServiceMap() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-gray-50 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] ring-1 ring-gray-200/60">
      <MapContainer
        center={[25.76, -80.25]}
        zoom={10}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
        style={{ background: "#fafafa" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <FitBounds />

        {ZONES.map((zone) => (
          <Circle
            key={zone.name}
            center={[zone.lat, zone.lng]}
            radius={zone.radiusKm * 1000}
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: zone.popular ? 0.28 : 0.14,
              weight: zone.popular ? 2 : 1.4,
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={1}
              className="!rounded-lg !border-none !bg-gray-900 !px-3 !py-1.5 !text-xs !font-bold !text-white !shadow-xl"
            >
              {zone.name}
              {zone.popular && (
                <span className="ml-2 inline-block rounded bg-[#f2c037] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-gray-900">
                  Popular
                </span>
              )}
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Service Zones
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f2c037]" />
          <span className="text-xs font-medium text-gray-700">High demand</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1e73be]" />
          <span className="text-xs font-medium text-gray-700">Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" />
          <span className="text-xs font-medium text-gray-700">Extended</span>
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2c037] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f2c037]" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-900">
          Live coverage · South Florida
        </span>
      </div>
    </div>
  );
}
