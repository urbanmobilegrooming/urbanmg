'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { saveReportCard, type ReportCardInput } from '@/server/report_cards';

type Initial = NonNullable<
  Awaited<ReturnType<typeof import('@/server/report_cards').getReportCardForAppointment>>
>;

const RATING_CATEGORIES = [
  {
    key: 'coat_condition',
    label: 'Coat Condition',
    color: '#f2c037',
    desc: 'Shine, texture, tangles',
  },
  {
    key: 'skin_health',
    label: 'Skin Health',
    color: '#e74c3c',
    desc: 'Dryness, irritation, flaking',
  },
  {
    key: 'ear_cleanliness',
    label: 'Ear Cleanliness',
    color: '#3498db',
    desc: 'Wax buildup, odor, redness',
  },
  {
    key: 'nail_condition',
    label: 'Nail Condition',
    color: '#2ecc71',
    desc: 'Length, splitting, overgrowth',
  },
  {
    key: 'teeth_health',
    label: 'Teeth & Gum Health',
    color: '#9b59b6',
    desc: 'Tartar, gum color, breath',
  },
  {
    key: 'behavior',
    label: 'Behavior During Grooming',
    color: '#f39c12',
    desc: 'Cooperation, stress, aggression',
  },
] as const;

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const COMMON_SERVICES = [
  'Bath & Blow Dry',
  'Full Haircut',
  'Nail Trim',
  'Ear Cleaning',
  'Teeth Brushing',
  'De-shedding Treatment',
  'De-matting',
  'Anal Gland Expression',
  'Flea Treatment',
  'Bandana / Bow',
  'Paw Pad Moisturizer',
  'Cologne / Perfume',
];

const COMMON_ISSUES = [
  'Skin irritation',
  'Matting',
  'Fleas / Ticks',
  'Hot spots',
  'Ear infection signs',
  'Dental tartar buildup',
  'Overgrown nails',
  'Dry skin / dandruff',
  'Unusual lumps',
];

type FormState = {
  coat_condition: number | null;
  skin_health: number | null;
  ear_cleanliness: number | null;
  nail_condition: number | null;
  teeth_health: number | null;
  behavior: number | null;
  services_performed: string[];
  groomer_notes: string;
  recommendations: string;
  issues_found: string;
  next_visit_date: string;
};

function initialFormState(card: Initial['card']): FormState {
  return {
    coat_condition: card?.coat_condition ?? null,
    skin_health: card?.skin_health ?? null,
    ear_cleanliness: card?.ear_cleanliness ?? null,
    nail_condition: card?.nail_condition ?? null,
    teeth_health: card?.teeth_health ?? null,
    behavior: card?.behavior ?? null,
    services_performed: card?.services_performed ?? [],
    groomer_notes: card?.groomer_notes ?? '',
    recommendations: card?.recommendations ?? '',
    issues_found: card?.issues_found ?? '',
    next_visit_date: card?.next_visit_date ?? '',
  };
}

export function ReportCardForm({
  appointmentId,
  initial,
}: {
  appointmentId: string;
  initial: Initial;
}) {
  const [form, setForm] = useState<FormState>(() => initialFormState(initial.card));
  const [hasCard, setHasCard] = useState(!!initial.card);
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  function setRating(key: keyof FormState, value: number) {
    setForm((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  }

  function toggleService(svc: string) {
    setForm((f) => {
      const idx = f.services_performed.indexOf(svc);
      if (idx >= 0) {
        const next = [...f.services_performed];
        next.splice(idx, 1);
        return { ...f, services_performed: next };
      }
      return { ...f, services_performed: [...f.services_performed, svc] };
    });
  }

  function toggleIssueTag(issue: string) {
    setForm((f) => {
      const current = f.issues_found ?? '';
      let next: string;
      if (current.includes(issue)) {
        next = current
          .replace(issue, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*|,\s*$/g, '')
          .trim();
      } else {
        next = current ? current + ', ' + issue : issue;
      }
      return { ...f, issues_found: next };
    });
  }

  function publicUrl() {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/report-card/${appointmentId}`;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: ReportCardInput = {
        coat_condition: form.coat_condition,
        skin_health: form.skin_health,
        ear_cleanliness: form.ear_cleanliness,
        nail_condition: form.nail_condition,
        teeth_health: form.teeth_health,
        behavior: form.behavior,
        services_performed: form.services_performed,
        groomer_notes: form.groomer_notes || null,
        recommendations: form.recommendations || null,
        issues_found: form.issues_found || null,
        next_visit_date: form.next_visit_date || null,
      };
      await saveReportCard(appointmentId, payload);
      setHasCard(true);
      setToast({ kind: 'success', message: 'Report card saved successfully.' });
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to save.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  function copyPublicLink() {
    navigator.clipboard.writeText(publicUrl()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            toast.kind === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Grooming Report Card</h2>
          {initial.appointment && (
            <p className="mt-0.5 text-sm text-gray-500">
              {initial.appointment.pets?.name} · {formatDate(initial.appointment.date)}
              {initial.appointment.staff &&
                ` · ${initial.appointment.staff.first_name} ${initial.appointment.staff.last_name}`}
            </p>
          )}
        </div>
        {hasCard && (
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: 'rgba(44,15,115,0.08)', color: '#2C0F73' }}
          >
            Report Saved
          </span>
        )}
      </div>

      {/* Ratings */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-gray-400">
          Health &amp; Condition Ratings
        </h3>
        <div className="space-y-5">
          {RATING_CATEGORIES.map((cat) => {
            const v = form[cat.key as keyof FormState] as number | null;
            return (
              <div key={cat.key}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">{cat.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{cat.desc}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: cat.color }}>
                    {STAR_LABELS[v ?? 0]}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (v ?? 0);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(cat.key as keyof FormState, star)}
                        className="flex h-9 flex-1 items-center justify-center rounded-xl border-2 transition-all"
                        style={{
                          borderColor: active ? cat.color : '#e5e7eb',
                          background: active ? cat.color + '18' : '#f9fafb',
                        }}
                      >
                        <svg
                          className="h-4 w-4"
                          fill={active ? cat.color : '#d1d5db'}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Services Performed
        </h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_SERVICES.map((svc) => {
            const active = form.services_performed.includes(svc);
            return (
              <button
                key={svc}
                type="button"
                onClick={() => toggleService(svc)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(44,15,115,0.1)' : '#f9fafb',
                  border: active ? '1.5px solid rgba(44,15,115,0.4)' : '1.5px solid #e5e7eb',
                  color: active ? '#2C0F73' : '#6b7280',
                }}
              >
                {svc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Issues Found
        </h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {COMMON_ISSUES.map((issue) => {
            const active = form.issues_found.includes(issue);
            return (
              <button
                key={issue}
                type="button"
                onClick={() => toggleIssueTag(issue)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background: active ? 'rgba(234,88,12,0.1)' : '#fef9f5',
                  border: active ? '1.5px solid rgba(234,88,12,0.4)' : '1.5px solid #fed7aa',
                  color: active ? '#c2410c' : '#9a3412',
                }}
              >
                {issue}
              </button>
            );
          })}
        </div>
        <textarea
          rows={3}
          value={form.issues_found}
          onChange={(e) => setForm((f) => ({ ...f, issues_found: e.target.value }))}
          placeholder="Describe any health issues, skin irritations, parasites, or concerns found during grooming..."
          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-[#2C0F73] focus:ring-2 focus:ring-[#2C0F73]/20 resize-none"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Groomer Notes
        </h3>
        <textarea
          rows={4}
          value={form.groomer_notes}
          onChange={(e) => setForm((f) => ({ ...f, groomer_notes: e.target.value }))}
          placeholder="How did the session go? Any notable observations about the pet's behavior, condition, or temperament..."
          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-[#2C0F73] focus:ring-2 focus:ring-[#2C0F73]/20 resize-none"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Recommendations for Next Visit
        </h3>
        <textarea
          rows={3}
          value={form.recommendations}
          onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
          placeholder="e.g. Start de-shedding treatment, schedule teeth cleaning, address hot spots before next visit..."
          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-[#2C0F73] focus:ring-2 focus:ring-[#2C0F73]/20 resize-none"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Next Recommended Visit
        </h3>
        <input
          type="date"
          value={form.next_visit_date}
          onChange={(e) => setForm((f) => ({ ...f, next_visit_date: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-[#2C0F73] focus:ring-2 focus:ring-[#2C0F73]/20"
        />
      </div>

      {hasCard && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#2C0F73]/20 bg-[#2C0F73]/5 p-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-600">Public Report Card Link</p>
            <p className="truncate text-xs text-gray-400">{publicUrl()}</p>
          </div>
          <button
            type="button"
            onClick={copyPublicLink}
            className="shrink-0 rounded-xl border border-[#2C0F73]/20 px-3 py-1.5 text-xs font-bold text-[#2C0F73] transition-colors hover:bg-[#2C0F73]/10"
          >
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-[#2C0F73] py-3 text-sm font-bold text-white transition-colors hover:bg-[#411992] disabled:opacity-60"
        >
          {saving ? 'Saving...' : hasCard ? 'Update Report Card' : 'Save Report Card'}
        </button>
        {hasCard && (
          <a
            href={publicUrl()}
            target="_blank"
            rel="noopener"
            className="rounded-xl border border-[#2C0F73]/30 px-4 py-3 text-sm font-bold text-[#2C0F73] transition-colors hover:bg-[#2C0F73]/5"
          >
            View Public Card
          </a>
        )}
      </div>
    </div>
  );
}
