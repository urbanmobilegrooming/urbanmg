'use client';

import { useMemo, useState } from 'react';
import { formatDate } from '@/lib/format';

type Data = NonNullable<
  Awaited<ReturnType<typeof import('@/server/public').getPublicReportCard>>
>;

const RATING_CATEGORIES = [
  { key: 'coat_condition', label: 'Coat Condition', color: '#f2c037' },
  { key: 'skin_health', label: 'Skin Health', color: '#e74c3c' },
  { key: 'ear_cleanliness', label: 'Ear Cleanliness', color: '#3498db' },
  { key: 'nail_condition', label: 'Nail Condition', color: '#2ecc71' },
  { key: 'teeth_health', label: 'Teeth & Gum Health', color: '#9b59b6' },
  { key: 'behavior', label: 'Behavior During Grooming', color: '#f39c12' },
] as const;

function ratingLabel(v: number | null): string {
  if (!v) return 'N/A';
  return ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][v] ?? 'N/A';
}

function overallScore(card: Data['reportCard']): number {
  if (!card) return 0;
  const vals = [
    card.coat_condition,
    card.skin_health,
    card.ear_cleanliness,
    card.nail_condition,
    card.teeth_health,
    card.behavior,
  ].filter((v): v is number => v !== null);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function ReportCardView({ data }: { data: Data }) {
  const { reportCard, appointment, photos } = data;
  const [copied, setCopied] = useState(false);

  const beforePhoto = useMemo(() => photos.find((p) => p.photo_type === 'before') ?? null, [photos]);
  const afterPhoto = useMemo(() => photos.find((p) => p.photo_type === 'after') ?? null, [photos]);

  const score = overallScore(reportCard);
  const overallLabel =
    score >= 4.5
      ? 'Excellent Session'
      : score >= 3.5
        ? 'Great Session'
        : score >= 2.5
          ? 'Good Session'
          : score >= 1.5
            ? 'Fair Session'
            : 'Session Complete';

  function shareWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const petName = appointment.pets?.name ?? 'your pet';
    const text = encodeURIComponent(
      `Check out ${petName}'s grooming report card from urbanMG! `,
    );
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function getRating(key: string): number | null {
    if (!reportCard) return null;
    return (reportCard as Record<string, unknown>)[key] as number | null ?? null;
  }

  if (!reportCard) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #2C0F73 40%, #1a0a3e 100%)' }}
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white">Report Not Yet Available</h2>
          <p className="mt-2 text-sm text-white/50">
            The grooming report for this appointment hasn&apos;t been created yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #2C0F73 40%, #1a0a3e 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl shadow-2xl bg-white">
          <div className="h-2" style={{ background: 'linear-gradient(90deg, #f2c037, #ffd86b, #f2c037)' }} />

          {/* Header band */}
          <div
            className="relative overflow-hidden px-8 py-8"
            style={{ background: 'linear-gradient(135deg, #2C0F73 0%, #1a0a3e 100%)' }}
          >
            <div className="relative z-10 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: '#f2c037' }}
                >
                  <svg className="h-5 w-5" fill="#2C0F73" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span
                  className="text-xl font-black tracking-widest text-white"
                  style={{ letterSpacing: '0.2em' }}
                >
                  urbanMG
                </span>
              </div>

              <p
                className="mb-2 text-xs font-bold uppercase tracking-[0.3em]"
                style={{ color: '#f2c037' }}
              >
                Grooming Report Card
              </p>

              <div className="mt-5 flex flex-col items-center">
                <div className="relative">
                  {beforePhoto ? (
                    <div
                      className="h-24 w-24 overflow-hidden rounded-full border-4 shadow-xl"
                      style={{ borderColor: '#f2c037' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={beforePhoto.photo_url}
                        alt={appointment.pets?.name ?? 'Pet'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-xl"
                      style={{
                        background: 'rgba(242,192,55,0.15)',
                        borderColor: '#f2c037',
                      }}
                    >
                      <svg className="h-12 w-12" fill="#f2c037" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow"
                    style={{ background: '#f2c037', color: '#2C0F73' }}
                  >
                    {score}
                  </div>
                </div>

                <h1 className="mt-4 text-3xl font-black text-white">{appointment.pets?.name}</h1>
                <p className="mt-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {appointment.pets?.breed ?? appointment.pets?.species}
                  {appointment.pets?.color ? `  ·  ${appointment.pets.color}` : ''}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Pill text={formatDate(appointment.date)} />
                {appointment.staff && (
                  <Pill text={`${appointment.staff.first_name} ${appointment.staff.last_name}`} />
                )}
                {appointment.services && <Pill text={appointment.services.name} />}
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            {/* Overall score banner */}
            <div
              className="flex items-center gap-4 rounded-2xl px-6 py-5"
              style={{
                background:
                  'linear-gradient(135deg, rgba(242,192,55,0.1) 0%, rgba(255,216,107,0.05) 100%)',
                border: '1px solid rgba(242,192,55,0.3)',
              }}
            >
              <div className="flex flex-col items-center">
                <div className="text-5xl font-black" style={{ color: '#f2c037' }}>
                  {score}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  / 5.0
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className="h-6 w-6"
                      fill={s <= score ? '#f2c037' : '#e5e7eb'}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base font-bold text-gray-800">{overallLabel}</p>
                <p className="text-xs text-gray-400">Overall grooming session score</p>
              </div>
            </div>

            {/* Ratings grid */}
            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                Health &amp; Condition Ratings
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {RATING_CATEGORIES.map((cat) => {
                  const r = getRating(cat.key);
                  return (
                    <div
                      key={cat.key}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">{cat.label}</span>
                          <span className="text-xs font-bold" style={{ color: cat.color }}>
                            {ratingLabel(r)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className="h-1.5 flex-1 rounded-full transition-all"
                              style={{
                                background: star <= (r ?? 0) ? cat.color : '#e5e7eb',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Services Performed */}
            {(reportCard.services_performed ?? []).length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                  Services Performed
                </h2>
                <div className="flex flex-wrap gap-2">
                  {reportCard.services_performed.map((svc) => (
                    <span
                      key={svc}
                      className="rounded-full px-4 py-1.5 text-sm font-semibold"
                      style={{
                        background: 'rgba(44,15,115,0.08)',
                        color: '#2C0F73',
                        border: '1px solid rgba(44,15,115,0.15)',
                      }}
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Before / After */}
            {(beforePhoto || afterPhoto) && (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                  Before &amp; After
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {beforePhoto && (
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <div className="aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={beforePhoto.photo_url} alt="Before" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 bg-blue-50 py-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                          Before
                        </span>
                      </div>
                    </div>
                  )}
                  {afterPhoto && (
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <div className="aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={afterPhoto.photo_url} alt="After" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 bg-green-50 py-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">
                          After
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {reportCard.groomer_notes && (
              <Section title="Groomer Notes" bg="rgba(44,15,115,0.04)" textColor="text-gray-700">
                {reportCard.groomer_notes}
              </Section>
            )}

            {reportCard.issues_found && (
              <Section title="Issues Found" bg="#fff7ed" textColor="text-orange-800" border="border-orange-100">
                {reportCard.issues_found}
              </Section>
            )}

            {reportCard.recommendations && (
              <Section
                title="Recommendations for Next Visit"
                bg="#f0fdf4"
                textColor="text-green-800"
                border="border-green-100"
              >
                {reportCard.recommendations}
              </Section>
            )}

            {reportCard.next_visit_date && (
              <div
                className="flex items-center gap-4 rounded-2xl p-5"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(242,192,55,0.12) 0%, rgba(242,192,55,0.06) 100%)',
                  border: '1px solid rgba(242,192,55,0.3)',
                }}
              >
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#b07d00' }}
                  >
                    Next Recommended Visit
                  </p>
                  <p className="text-lg font-black text-gray-900">
                    {formatDate(reportCard.next_visit_date)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-2">
              <a
                href="/book"
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #2C0F73, #411992)', color: '#fff' }}
              >
                Book Next Appointment
              </a>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 py-3 text-sm font-bold text-green-700 transition-all hover:bg-green-100 active:scale-[0.98]"
                >
                  Share via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-100 active:scale-[0.98]"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span
                className="px-3 text-xs font-bold tracking-widest text-gray-300"
                style={{ letterSpacing: '0.2em' }}
              >
                urbanMG
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          </div>

          <div className="h-2" style={{ background: 'linear-gradient(90deg, #f2c037, #ffd86b, #f2c037)' }} />
        </div>
      </div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
      style={{
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      {text}
    </div>
  );
}

function Section({
  title,
  children,
  bg,
  textColor,
  border,
}: {
  title: string;
  children: React.ReactNode;
  bg: string;
  textColor: string;
  border?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${border ?? 'border border-[#2C0F73]/10'}`}
      style={{ background: bg }}
    >
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">{title}</h2>
      <p className={`text-sm leading-relaxed ${textColor}`}>{children}</p>
    </div>
  );
}
