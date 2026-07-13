'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PawPrint, Plus, Trash2, CheckCircle, Send } from 'lucide-react';
import { submitIntake, type IntakePetInput } from '@/server/intake';

const GOLD = '#f2c037';
const NAVY = '#1a0a3e';

const emptyPet: IntakePetInput = { name: '', species: 'dog', breed: '', weight_lbs: null, notes: '' };

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#f2c037] focus:ring-2 focus:ring-[#f2c037]/30';

export function IntakeForm() {
  const [owner, setOwner] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    preferred_contact: 'whatsapp',
    referral_source: '',
    notes: '',
  });
  const [petList, setPetList] = useState<IntakePetInput[]>([{ ...emptyPet }]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function setPet(i: number, patch: Partial<IntakePetInput>) {
    setPetList((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitIntake({ ...owner, pets: petList });
      if (res.ok) {
        setDone(true);
      } else {
        toast.error(res.error ?? 'Something went wrong');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#fafafa' }}>
        <div className="max-w-md rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-black" style={{ color: NAVY }}>You&apos;re all set!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Thanks for telling us about your pack. Our team will review your info and reach out shortly to welcome you and book your first groom.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#fafafa' }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: GOLD }}>
            <PawPrint className="h-7 w-7" style={{ color: NAVY }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: NAVY }}>Welcome to Urban Mobile Grooming</h1>
          <p className="mt-1 text-sm text-gray-500">Tell us about you and your pets — takes 2 minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dueño */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">About you</h2>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="First name *" className={inputCls} value={owner.first_name} onChange={(e) => setOwner({ ...owner, first_name: e.target.value })} />
              <input required placeholder="Last name *" className={inputCls} value={owner.last_name} onChange={(e) => setOwner({ ...owner, last_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required type="tel" placeholder="Phone *" className={inputCls} value={owner.phone} onChange={(e) => setOwner({ ...owner, phone: e.target.value })} />
              <input type="email" placeholder="Email" className={inputCls} value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} />
            </div>
            <input placeholder="Street address" className={inputCls} value={owner.address} onChange={(e) => setOwner({ ...owner, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="City" className={inputCls} value={owner.city} onChange={(e) => setOwner({ ...owner, city: e.target.value })} />
              <input placeholder="ZIP" className={inputCls} value={owner.zip} onChange={(e) => setOwner({ ...owner, zip: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select className={inputCls} value={owner.preferred_contact} onChange={(e) => setOwner({ ...owner, preferred_contact: e.target.value })}>
                <option value="whatsapp">Prefer WhatsApp</option>
                <option value="call">Prefer phone call</option>
                <option value="text">Prefer text/SMS</option>
                <option value="email">Prefer email</option>
              </select>
              <select className={inputCls} value={owner.referral_source} onChange={(e) => setOwner({ ...owner, referral_source: e.target.value })}>
                <option value="">How did you hear about us?</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="referral">Friend / referral</option>
                <option value="saw_van">Saw the van</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Mascotas */}
          {petList.map((p, i) => (
            <div key={i} className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">Pet {i + 1}</h2>
                {petList.length > 1 && (
                  <button type="button" onClick={() => setPetList((ps) => ps.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Pet name *" className={inputCls} value={p.name} onChange={(e) => setPet(i, { name: e.target.value })} />
                <select className={inputCls} value={p.species} onChange={(e) => setPet(i, { species: e.target.value })}>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Breed" className={inputCls} value={p.breed ?? ''} onChange={(e) => setPet(i, { breed: e.target.value })} />
                <input type="number" min={1} max={250} placeholder="Weight (lbs)" className={inputCls} value={p.weight_lbs ?? ''} onChange={(e) => setPet(i, { weight_lbs: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <input placeholder="Anything we should know? (temperament, allergies, matting...)" className={inputCls} value={p.notes ?? ''} onChange={(e) => setPet(i, { notes: e.target.value })} />
            </div>
          ))}

          {petList.length < 6 && (
            <button type="button" onClick={() => setPetList((ps) => [...ps, { ...emptyPet }])} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-3 text-sm font-bold text-gray-400 hover:border-[#f2c037] hover:text-[#b8901f]">
            <Plus className="h-4 w-4" />
            Add another pet
          </button>
          )}

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <textarea rows={2} placeholder="Anything else you'd like to tell us?" className={inputCls} value={owner.notes} onChange={(e) => setOwner({ ...owner, notes: e.target.value })} />
          </div>

          <button
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black shadow-md transition hover:brightness-105 disabled:opacity-60"
            style={{ background: GOLD, color: NAVY }}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
