'use client';

import { useState } from 'react';
import { checkInAppointment } from '@/server/public';

type Appointment = Awaited<ReturnType<typeof import('@/server/public').getCheckinAppointment>>;

function formatTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

function titleCase(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function CheckinView({ appointment }: { appointment: NonNullable<Appointment> }) {
  const initiallyChecked =
    appointment.status === 'in_progress' || appointment.status === 'completed';
  const [confirmed, setConfirmed] = useState(initiallyChecked);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinTime, setCheckinTime] = useState(() => {
    if (appointment.checkin_at) {
      return new Date(appointment.checkin_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return '';
  });
  const [status, setStatus] = useState(appointment.status);

  async function handleCheckin() {
    setCheckingIn(true);
    try {
      const { checkin_at } = await checkInAppointment(appointment.id);
      setCheckinTime(
        new Date(checkin_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      );
      setStatus('in_progress');
      setConfirmed(true);
    } catch (err) {
      alert('Check-in failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCheckingIn(false);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900">Checked In!</h2>
          <p className="mt-2 text-base text-gray-600">Your groomer will be with you shortly.</p>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Client</span>
              <span className="font-bold text-gray-900">
                {appointment.clients?.first_name} {appointment.clients?.last_name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Pet</span>
              <span className="font-bold text-gray-900">{appointment.pets?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Service</span>
              <span className="font-bold text-gray-900">{appointment.services?.name}</span>
            </div>
            {appointment.staff && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Groomer</span>
                <span className="font-bold text-gray-900">
                  {appointment.staff.first_name} {appointment.staff.last_name}
                </span>
              </div>
            )}
          </div>

          {checkinTime && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-600 font-semibold">
              <span>Check-in time: {checkinTime}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2c037]">
            <svg className="h-8 w-8 text-[#1a0a3e]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17a2 2 0 002 2h1a3 3 0 006 0h2a3 3 0 006 0h1a2 2 0 002-2v-6l-3-5h-3V4H3v13zm14-7l2 3h-4V7h2v3zm-9 6a1 1 0 110 2 1 1 0 010-2zm8 0a1 1 0 110 2 1 1 0 010-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white">Urban Mobile Grooming</h1>
          <p className="text-sm text-white/60">Client Check-In</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Appointment</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(status)}`}>
              {titleCase(status)}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#1a0a3e]/5 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2c037]">
              <svg className="h-6 w-6 text-[#1a0a3e]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <div className="font-black text-gray-900">
                {appointment.clients?.first_name} {appointment.clients?.last_name}
              </div>
              <div className="text-sm text-gray-500">
                {appointment.pets?.name}
                {appointment.pets?.breed ? ` • ${appointment.pets.breed}` : ''}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Service</div>
              <div className="text-sm font-bold text-gray-900">{appointment.services?.name ?? '—'}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Time</div>
              <div className="text-sm font-bold text-gray-900">{formatTime(appointment.start_time)}</div>
            </div>
          </div>

          {appointment.staff && (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ background: appointment.staff.color ?? '#2C0F73' }}
              >
                {appointment.staff.first_name.charAt(0)}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-gray-400">Your Groomer</div>
                <div className="text-sm font-bold text-gray-900">
                  {appointment.staff.first_name} {appointment.staff.last_name}
                </div>
              </div>
            </div>
          )}

          {status === 'scheduled' || status === 'confirmed' ? (
            <button
              onClick={handleCheckin}
              disabled={checkingIn}
              className="w-full rounded-2xl py-4 text-lg font-black transition-all active:scale-95 disabled:opacity-60"
              style={{ background: '#f2c037', color: '#1a0a3e' }}
            >
              {checkingIn ? 'Checking In…' : 'Check In Now'}
            </button>
          ) : status === 'completed' ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 py-4 text-center">
              <div className="text-sm font-bold text-green-800">Appointment Completed</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-red-50 border border-red-200 py-4 text-center">
              <div className="text-sm font-bold text-red-700">This appointment is {status}</div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/40">urbanMG • Miami Mobile Pet Grooming</p>
      </div>
    </div>
  );
}
