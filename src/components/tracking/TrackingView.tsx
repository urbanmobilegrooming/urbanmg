'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTrackingAppointment } from '@/server/public';

type Appointment = NonNullable<Awaited<ReturnType<typeof getTrackingAppointment>>>;
type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'on_the_way'
  | 'arrived'
  | 'grooming'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

const GOLD = '#f2c037';
const PURPLE = '#2C0F73';
const MAP_W = 500;
const MAP_H = 320;
const MAP_LAT_MIN = 25.4;
const MAP_LAT_MAX = 26.05;
const MAP_LNG_MIN = -80.6;
const MAP_LNG_MAX = -80.05;

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Miami: { lat: 25.7617, lng: -80.1918 },
  'Miami Beach': { lat: 25.7907, lng: -80.13 },
  'Coral Gables': { lat: 25.7215, lng: -80.2684 },
  Hialeah: { lat: 25.8576, lng: -80.2781 },
  Kendall: { lat: 25.6751, lng: -80.3565 },
  Doral: { lat: 25.8194, lng: -80.3518 },
  Aventura: { lat: 25.9565, lng: -80.1392 },
  Brickell: { lat: 25.7617, lng: -80.194 },
  Wynwood: { lat: 25.8017, lng: -80.1997 },
  Homestead: { lat: 25.4687, lng: -80.4776 },
  'North Miami': { lat: 25.8896, lng: -80.1868 },
  'Opa-locka': { lat: 25.9021, lng: -80.2498 },
  Pinecrest: { lat: 25.6651, lng: -80.3123 },
};

function latlngToXY(lat: number, lng: number) {
  const x = ((lng - MAP_LNG_MIN) / (MAP_LNG_MAX - MAP_LNG_MIN)) * MAP_W;
  const y = MAP_H - ((lat - MAP_LAT_MIN) / (MAP_LAT_MAX - MAP_LAT_MIN)) * MAP_H;
  return { x, y };
}

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

function etaMinutes(startTime: string | null, status: string): number | null {
  if (!startTime) return null;
  if (['completed', 'grooming', 'in_progress', 'arrived', 'cancelled', 'no_show'].includes(status))
    return null;
  try {
    const [h, m] = startTime.split(':').map(Number);
    const apptMs = new Date().setHours(h, m, 0, 0);
    const diff = Math.round((apptMs - Date.now()) / 60000);
    return diff > 0 ? diff : null;
  } catch {
    return null;
  }
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

export function TrackingView({ initialAppointment }: { initialAppointment: Appointment }) {
  const [appt, setAppt] = useState<Appointment>(initialAppointment);
  const [lastUpdatedMs, setLastUpdatedMs] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await getTrackingAppointment(appt.id);
        if (fresh) {
          setAppt(fresh);
          setLastUpdatedMs(Date.now());
        }
      } catch {
        /* ignore */
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [appt.id]);

  const status = appt.status as AppointmentStatus;
  const currentStepIdx = stepIndex(status);
  const eta = etaMinutes(appt.start_time, status);

  const mapCities = useMemo(
    () =>
      Object.entries(CITY_COORDS).map(([name, coords]) => ({
        name,
        ...latlngToXY(coords.lat, coords.lng),
      })),
    [],
  );

  const destPos = useMemo(() => {
    const coords = CITY_COORDS[appt.city] ?? CITY_COORDS['Miami'];
    return latlngToXY(coords.lat, coords.lng);
  }, [appt.city]);

  const vanPos = useMemo(() => {
    if (['completed', 'arrived', 'grooming', 'in_progress'].includes(status)) return destPos;
    return { x: destPos.x - 45, y: destPos.y - 35 };
  }, [status, destPos]);

  const lastUpdated = new Date(lastUpdatedMs).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #1a0a3e 0%, #2C0F73 40%, #1a0a3e 100%)' }}
    >
      <header
        className="flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <rect width="36" height="36" rx="10" fill="#f2c037" />
            <text
              x="18"
              y="25"
              textAnchor="middle"
              fill="#1a0a3e"
              fontSize="18"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              U
            </text>
          </svg>
          <div>
            <p className="text-base font-black text-white leading-tight">urbanMG</p>
            <p className="text-[10px] font-medium leading-tight" style={{ color: '#f2c037' }}>
              Live Tracking
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
          <span className="text-[11px] font-semibold text-white">Live</span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        {/* Status Banner */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: statusColor(status) + '33' }}
            >
              <span className="text-2xl" style={{ color: statusColor(status) }}>
                •
              </span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-white leading-tight">
                {displayStatus(status)}
              </p>
              {eta !== null ? (
                <p className="mt-0.5 text-sm font-semibold" style={{ color: '#f2c037' }}>
                  Approximately {eta} minutes away
                </p>
              ) : status === 'grooming' || status === 'in_progress' ? (
                <p className="mt-0.5 text-sm opacity-60 text-white">
                  Your pet is being pampered
                </p>
              ) : status === 'completed' ? (
                <p className="mt-0.5 text-sm opacity-60 text-white">
                  All done! Hope you love the results.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
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
                        background: i <= currentStepIdx ? GOLD : 'rgba(255,255,255,0.15)',
                        boxShadow: current ? `0 0 0 4px ${GOLD}44` : 'none',
                      }}
                    >
                      {completed && (
                        <div
                          className="absolute inset-0 flex items-center justify-center rounded-full"
                          style={{ background: '#f2c037' }}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke={PURPLE}
                            strokeWidth={3}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p
                      className="mt-2 text-center text-[10px] font-semibold leading-tight"
                      style={{
                        color: i <= currentStepIdx ? '#f2c037' : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {step.label}
                    </p>
                  </div>
                  {!last && (
                    <div
                      className="mt-5 h-0.5 flex-1 transition-all duration-700"
                      style={{
                        background: i < currentStepIdx ? GOLD : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 px-5 pt-4 pb-3">
            <span className="text-sm font-bold text-white">Service Area</span>
            {appt.city && (
              <span className="ml-auto text-xs opacity-50 text-white">{appt.city}</span>
            )}
          </div>
          <div className="relative mx-4 mb-4 overflow-hidden rounded-xl" style={{ height: 220 }}>
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(160deg, #1e3a5f 0%, #1a2f4e 50%, #162540 100%)',
              }}
            >
              <rect x="380" y="0" width="120" height="320" fill="#1a4a6b" opacity="0.5" />
              <rect x="420" y="60" width="80" height="180" fill="#1e5570" opacity="0.4" />
              {[40, 80, 120, 160, 200, 240, 280].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="500"
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
              ))}
              {[60, 120, 180, 240, 300, 360, 420].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="320"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
              ))}
              <line x1="200" y1="0" x2="160" y2="320" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
              <line x1="0" y1="160" x2="500" y2="140" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
              <line x1="300" y1="0" x2="300" y2="320" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
              {mapCities.map((c) => (
                <g key={c.name}>
                  <circle cx={c.x} cy={c.y} r={3} fill="rgba(255,255,255,0.2)" />
                  <text
                    x={c.x + 5}
                    y={c.y + 3}
                    fill="rgba(255,255,255,0.3)"
                    fontSize="7"
                    fontFamily="sans-serif"
                  >
                    {c.name}
                  </text>
                </g>
              ))}
              <circle cx={vanPos.x} cy={vanPos.y} r="28" fill="none" stroke="#f2c037" strokeWidth="1" opacity="0.2" />
              <circle cx={vanPos.x} cy={vanPos.y} r="18" fill="none" stroke="#f2c037" strokeWidth="1.5" opacity="0.35" />
              <circle cx={vanPos.x} cy={vanPos.y} r="11" fill="#f2c037" />
              <text
                x={vanPos.x}
                y={vanPos.y + 4}
                textAnchor="middle"
                fontSize="10"
                fill="#1a0a3e"
                fontWeight="900"
              >
                ⇧
              </text>
              <circle cx={destPos.x} cy={destPos.y} r="8" fill="#ef4444" />
              <circle cx={destPos.x} cy={destPos.y} r="3" fill="white" />
              <text
                x={destPos.x}
                y={destPos.y - 13}
                textAnchor="middle"
                fill="white"
                fontSize="7.5"
                fontFamily="sans-serif"
                fontWeight="600"
              >
                Your home
              </text>
              <line
                x1={vanPos.x}
                y1={vanPos.y}
                x2={destPos.x}
                y2={destPos.y}
                stroke="#f2c037"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity="0.6"
              />
            </svg>
            <div
              className="absolute bottom-2 left-2 rounded-lg px-2 py-1 text-[10px] font-semibold text-white"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              Approximate location
            </div>
          </div>
        </div>

        {/* Appointment details */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p className="text-sm font-bold text-white">Appointment Details</p>
          </div>
          <div
            className="grid grid-cols-2 gap-0 divide-x divide-y"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <DetailCell label="Date" value={formatDate(appt.date)} />
            <DetailCell label="Time" value={appt.start_time || 'TBD'} />
            <DetailCell label="Pet" value={appt.pet_name} />
            <DetailCell label="Service" value={appt.service_name} />
            <DetailCell label="Groomer" value={appt.groomer_name || 'Assigned'} />
            <DetailCell label="Van" value={appt.van || 'urbanMG Van'} />
          </div>
        </div>

        {/* Call groomer */}
        {appt.groomer_phone &&
          !['completed', 'cancelled', 'no_show'].includes(status) && (
            <a
              href={'tel:' + appt.groomer_phone}
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-black transition-all active:scale-95"
              style={{ background: '#f2c037', color: '#1a0a3e' }}
            >
              Call Your Groomer
            </a>
          )}

        <div className="pb-4 text-center">
          <p className="text-[11px] opacity-30 text-white">urbanMG — Miami&apos;s Mobile Pet Grooming</p>
          <p className="text-[10px] opacity-20 text-white mt-0.5">Last updated {lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50 text-white">
          {label}
        </p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
