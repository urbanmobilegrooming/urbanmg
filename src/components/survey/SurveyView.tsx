'use client';

import { useMemo, useState } from 'react';
import { submitSurvey } from '@/server/public';

type Appointment = NonNullable<
  Awaited<ReturnType<typeof import('@/server/public').getSurveyAppointment>>
>;

type RatingKey = 'overall_rating' | 'punctuality' | 'quality' | 'friendliness';

const QUESTIONS: { key: RatingKey; label: string }[] = [
  { key: 'overall_rating', label: 'Overall Satisfaction' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'quality', label: 'Quality of Grooming' },
  { key: 'friendliness', label: 'Friendliness' },
];

const RECOMMEND_OPTIONS: { value: 'yes' | 'no' | 'maybe'; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
];

function ratingLabel(n: number): string {
  return ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][n] ?? '';
}

function formatDate(d: string | null): string {
  if (!d) return '';
  return new Date(d + 'T00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SurveyView({ appointment }: { appointment: Appointment }) {
  type FormState = {
    overall_rating: number | null;
    punctuality: number | null;
    quality: number | null;
    friendliness: number | null;
    would_recommend: 'yes' | 'no' | 'maybe' | null;
    comments: string;
  };
  const [form, setForm] = useState<FormState>({
    overall_rating: null,
    punctuality: null,
    quality: null,
    friendliness: null,
    would_recommend: null,
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const confettiDots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 30}%`,
        background: ['#f2c037', '#2C0F73', '#22c55e', '#3b82f6', '#ec4899'][i % 5],
        animationDelay: `${Math.random() * 1.2}s`,
        animationDuration: `${1.8 + Math.random() * 1.2}s`,
      })),
    [],
  );

  function setRating(key: RatingKey, value: number) {
    setForm((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  }

  function isComplete(): boolean {
    return (
      form.overall_rating !== null &&
      form.punctuality !== null &&
      form.quality !== null &&
      form.friendliness !== null &&
      form.would_recommend !== null
    );
  }

  async function handleSubmit() {
    if (!isComplete()) return;
    setSubmitting(true);
    try {
      await submitSurvey(appointment.id, {
        overall_rating: form.overall_rating!,
        punctuality: form.punctuality!,
        quality: form.quality!,
        friendliness: form.friendliness!,
        would_recommend: form.would_recommend!,
        comments: form.comments || null,
      });
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiDots.map((d) => (
              <div
                key={d.id}
                className="absolute w-2 h-2 rounded-full confetti-anim"
                style={{
                  left: d.left,
                  top: d.top,
                  background: d.background,
                  animationDelay: d.animationDelay,
                  animationDuration: d.animationDuration,
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f2c037]">
              <svg className="h-10 w-10 text-[#1a0a3e]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Thank You!</h2>
            <p className="mt-2 text-base text-gray-600">Your feedback means the world to us.</p>
            <p className="mt-1 text-sm text-gray-500">We&apos;ll use it to keep improving our service.</p>

            <div className="mt-6 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className="h-7 w-7"
                  fill={s <= (form.overall_rating ?? 0) ? '#f2c037' : '#e5e7eb'}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>

            {form.would_recommend === 'yes' && (
              <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-3 text-sm font-semibold text-green-700">
                You would recommend us — that&apos;s amazing!
              </div>
            )}
          </div>
        </div>
        <style>{`
          .confetti-anim { animation-name: confetti-fall; animation-timing-function: ease-in; animation-fill-mode: forwards; }
          @keyframes confetti-fall {
            0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(350px) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2c037]">
            <svg className="h-8 w-8 text-[#1a0a3e]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white">How did we do?</h1>
          <p className="text-sm text-white/60">Tell us about your experience</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 rounded-2xl bg-[#1a0a3e]/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2c037]">
              <svg className="h-5 w-5 text-[#1a0a3e]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black text-gray-900">
                {appointment.clients?.first_name}&apos;s visit with {appointment.pets?.name}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(appointment.date)} • {appointment.services?.name}
              </div>
            </div>
          </div>

          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-gray-800">{q.label}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(q.key, star)}
                    className="transition-transform active:scale-90"
                  >
                    <svg
                      className="h-8 w-8 transition-colors"
                      fill={star <= (form[q.key] ?? 0) ? '#f2c037' : '#d1d5db'}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                ))}
                {form[q.key] !== null && (
                  <span className="ml-2 self-center text-xs text-gray-400">
                    {ratingLabel(form[q.key]!)}
                  </span>
                )}
              </div>
            </div>
          ))}

          <div>
            <div className="text-sm font-bold text-gray-800 mb-2">Would you recommend us?</div>
            <div className="flex gap-2">
              {RECOMMEND_OPTIONS.map((opt) => {
                const active = form.would_recommend === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, would_recommend: opt.value }))}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? 'border-[#f2c037] bg-[#f2c037]/10 text-[#1a0a3e]'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-800 mb-2 block">
              Comments (optional)
            </label>
            <textarea
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
              rows={3}
              placeholder="Tell us more about your experience…"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-[#f2c037] focus:ring-2 focus:ring-[#f2c037]/20 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete() || submitting}
            className="w-full rounded-2xl py-4 text-base font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#f2c037', color: '#1a0a3e' }}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>

        <p className="text-center text-xs text-white/40">urbanMG • Miami Mobile Pet Grooming</p>
      </div>
    </div>
  );
}
