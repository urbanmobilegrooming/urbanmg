'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import { getTrackingByToken, type PublicTracking } from '@/server/tracking';

const GOLD = '#f2c037';
const MIAMI_CENTER: [number, number] = [25.7617, -80.1918];

const STEPS: { key: string; label: string; statusMatch: string[] }[] = [
  { key: 'scheduled', label: 'Scheduled', statusMatch: ['scheduled', 'confirmed'] },
  { key: 'on_the_way', label: 'On the way', statusMatch: ['on_the_way'] },
  { key: 'arrived', label: 'Arrived', statusMatch: ['arrived'] },
  { key: 'grooming', label: 'Grooming', statusMatch: ['grooming', 'in_progress'] },
  { key: 'complete', label: 'Complete', statusMatch: ['completed'] },
];

function stepIndex(status: string): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].statusMatch.includes(status)) return i;
  }
  return 0;
}

function displayStatus(s: string): string {
  const map: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    on_the_way: 'On the way',
    arrived: 'Arriving soon',
    grooming: 'Grooming in progress',
    in_progress: 'Grooming in progress',
    completed: 'Grooming complete',
    cancelled: 'Appointment cancelled',
    no_show: 'No show',
  };
  return map[s] ?? s;
}

function statusColor(s: string): string {
  const map: Record<string, string> = {
    scheduled: '#60a5fa',
    confirmed: '#60a5fa',
    on_the_way: GOLD,
    arrived: GOLD,
    grooming: '#a78bfa',
    in_progress: '#a78bfa',
    completed: '#4ade80',
    cancelled: '#f87171',
    no_show: '#f87171',
  };
  return map[s] ?? '#60a5fa';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function LiveMap({ data }: { data: PublicTracking }) {
  const [mods, setMods] = useState<{ rl: any; L: any } | null>(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([rl, leaflet]) => {
      setMods({ rl, L: leaflet });
    });
  }, []);

  if (!mods) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f2c037] border-t-transparent" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Polyline } = mods.rl;
  const L = mods.L;

  const van: [number, number] | null = data.van_lat != null && data.van_lng != null ? [data.van_lat, data.van_lng] : null;
  const dest: [number, number] | null = data.dest_lat != null && data.dest_lng != null ? [data.dest_lat, data.dest_lng] : null;
  const center = van ?? dest ?? MIAMI_CENTER;
  const bounds = van && dest ? L.latLngBounds([van, dest]).pad(0.25) : undefined;

  const vanIcon = L.divIcon({
    className: '',
    html: `<div style="background:${GOLD};width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a0a3e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
  const homeIcon = L.divIcon({
    className: '',
    html: `<div style="background:#2C0F73;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      <MapContainer
        center={center}
        zoom={13}
        bounds={bounds}
        style={{ height: 300, width: '100%' }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {van && dest && <Polyline positions={[van, dest]} pathOptions={{ color: GOLD, dashArray: '8 8', weight: 3 }} />}
        {van && <Marker position={van} icon={vanIcon} />}
        {dest && <Marker position={dest} icon={homeIcon} />}
      </MapContainer>
    </div>
  );
}

export function LiveTrackingView({ token, initial }: { token: string; initial: PublicTracking }) {
  const [data, setData] = useState<PublicTracking>(initial);
  const [lastUpdatedMs, setLastUpdatedMs] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let stopped = false;

    async function tick() {
      try {
        const fresh = await getTrackingByToken(token);
        if (fresh && !stopped) {
          setData(fresh);
          setLastUpdatedMs(Date.now());
          if (['completed', 'cancelled', 'no_show'].includes(fresh.appointment_status)) return; // terminal: deja de sondear
          // GPS activo → 10s; tracking cerrado (llegó / en servicio) → 60s
          pollRef.current = setTimeout(tick, fresh.status === 'active' ? 10000 : 60000);
          return;
        }
      } catch {
        /* ignore */
      }
      if (!stopped) pollRef.current = setTimeout(tick, 15000);
    }

    pollRef.current = setTimeout(tick, 10000);
    return () => {
      stopped = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [token]);

  const status = data.appointment_status;
  const currentStepIdx = stepIndex(status);
  const showMap = ['on_the_way', 'arrived'].includes(status) && data.status === 'active';
  const lastUpdated = new Date(lastUpdatedMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #1a0a3e 0%, #2C0F73 40%, #1a0a3e 100%)' }}>
      <header className="flex items-center justify-between px-5 py-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <rect width="36" height="36" rx="10" fill="#f2c037" />
            <text x="18" y="25" textAnchor="middle" fill="#1a0a3e" fontSize="18" fontWeight="900" fontFamily="sans-serif">U</text>
          </svg>
          <div>
            <p className="text-base font-black text-white leading-tight">urbanMG</p>
            <p className="text-[10px] font-medium leading-tight" style={{ color: GOLD }}>Live Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
          <span className="text-[11px] font-semibold text-white">Live</span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        {/* Status banner */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: statusColor(status) + '33' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={statusColor(status)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-white leading-tight">{displayStatus(status)}</p>
              {status === 'on_the_way' && data.eta_minutes != null ? (
                <p className="mt-0.5 text-sm font-semibold" style={{ color: GOLD }}>
                  Approximately {data.eta_minutes} min away
                </p>
              ) : status === 'grooming' || status === 'in_progress' ? (
                <p className="mt-0.5 text-sm opacity-60 text-white">{data.pet_name} is being pampered</p>
              ) : status === 'completed' ? (
                <p className="mt-0.5 text-sm opacity-60 text-white">All done! Hope you love the results.</p>
              ) : status === 'arrived' ? (
                <p className="mt-0.5 text-sm opacity-60 text-white">Your groomer is at the door</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mapa en vivo */}
        {showMap && <LiveMap data={data} />}

        {/* Progress steps */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => {
              const last = i === STEPS.length - 1;
              const completed = i < currentStepIdx;
              const current = i === currentStepIdx;
              return (
                <div key={step.key} className="contents">
                  <div className={`flex flex-col items-center ${last ? 'flex-none' : 'flex-1'}`}>
                    <div
                      className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500"
                      style={{
                        background: completed || current ? GOLD : 'rgba(255,255,255,0.12)',
                        boxShadow: current ? `0 0 0 5px ${GOLD}33` : 'none',
                      }}
                    >
                      {completed ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a0a3e" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="text-xs font-black" style={{ color: current ? '#1a0a3e' : 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                      )}
                    </div>
                    <p className="mt-2 text-center text-[10px] font-bold leading-tight" style={{ color: completed || current ? 'white' : 'rgba(255,255,255,0.4)' }}>
                      {step.label}
                    </p>
                  </div>
                  {!last && (
                    <div className="mt-5 h-[3px] flex-1 rounded-full" style={{ background: i < currentStepIdx ? GOLD : 'rgba(255,255,255,0.12)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalles de la cita */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          {[
            ['Pet', data.pet_name],
            ['Service', data.service_name],
            ['Groomer', data.groomer_name || '—'],
            ['Date', `${formatDate(data.date)} · ${data.start_time?.slice(0, 5) ?? ''}`],
            ['Address', data.address ? `${data.address}, ${data.city}` : data.city],
            ['Van', data.van || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
              <span className="text-right text-sm font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>

        <p className="pb-6 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Updated {lastUpdated} · refreshes automatically
        </p>
      </div>
    </div>
  );
}
