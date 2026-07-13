"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronRight, Building2, MapPin, Scissors } from "lucide-react";
import { setupBusiness } from "@/server/business";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    slug: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    timezone: "America/New_York",
    service_areas: "",
    groomer_name: "",
    groomer_commission: 50,
    van_name: "Van 1",
  });

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await setupBusiness({
        name: form.business_name,
        slug: form.slug || generateSlug(form.business_name),
        phone: form.phone || undefined,
        email: form.email || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        timezone: form.timezone,
        service_areas: form.service_areas ? form.service_areas.split(",").map((s) => s.trim()) : [],
        groomer_name: form.groomer_name || undefined,
        groomer_commission: form.groomer_commission,
      });
      setDone(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#f2c037]/40 focus:bg-white/[0.07]";
  const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30";

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080318] font-[family-name:var(--font-jakarta)]">
        <div className="text-center animate-[fadeUp_0.5s_ease-out]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <Check size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">You&apos;re all set!</h1>
          <p className="mt-2 text-white/40">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const steps = ["Business", "Location", "Team", "Go!"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080318] px-4 font-[family-name:var(--font-jakarta)]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image src="/logo-urban.png" alt="urbanMG" width={160} height={44} className="drop-shadow-[0_0_20px_rgba(242,192,55,0.3)]" />
        </div>

        <h1 className="mb-2 text-center text-xl font-bold text-white">Set up your business</h1>
        <p className="mb-6 text-center text-sm text-white/30">Get started in under 2 minutes</p>

        <div className="mb-6 flex items-center justify-center gap-1">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-[#f2c037] text-[#1a0a3e]" : "bg-white/10 text-white/30"
              }`}>
                {step > i + 1 ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${step === i + 1 ? "text-white/60" : "text-white/15"}`}>{label}</span>
              {i < 3 && <ChevronRight size={12} className="mx-0.5 text-white/10" />}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-7 backdrop-blur-xl">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#f2c037]"><Building2 size={18} /> <span className="font-bold text-white">Business Info</span></div>
              <div>
                <label className={labelClass}>Business Name *</label>
                <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value, slug: generateSlug(e.target.value) })} className={inputClass} placeholder="e.g. Happy Paws Grooming" />
              </div>
              <div>
                <label className={labelClass}>URL Slug</label>
                <div className="flex items-center gap-0 rounded-xl border border-white/10 bg-white/5">
                  <span className="shrink-0 pl-4 text-xs text-white/20">urbanmg.com/book/</span>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="h-11 flex-1 bg-transparent px-1 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelClass}>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#f2c037]"><MapPin size={18} /> <span className="font-bold text-white">Location</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelClass}>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Miami" /></div>
                <div><label className={labelClass}>State</label><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} placeholder="FL" /></div>
              </div>
              <div>
                <label className={labelClass}>Service Areas</label>
                <input value={form.service_areas} onChange={(e) => setForm({ ...form, service_areas: e.target.value })} className={inputClass} placeholder="e.g. Miami-Dade, Broward (comma separated)" />
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={inputClass}>
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#f2c037]"><Scissors size={18} /> <span className="font-bold text-white">Your First Groomer</span></div>
              <p className="text-xs text-white/30">You can add more staff later from the dashboard.</p>
              <div><label className={labelClass}>Groomer Name</label><input value={form.groomer_name} onChange={(e) => setForm({ ...form, groomer_name: e.target.value })} className={inputClass} placeholder="e.g. Maria" /></div>
              <div><label className={labelClass}>Commission %</label><input type="number" min={0} max={100} value={form.groomer_commission} onChange={(e) => setForm({ ...form, groomer_commission: Number(e.target.value) })} className={inputClass} /></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2c037]"><Check className="h-7 w-7 text-[#1a0a3e]" /></div>
              <h2 className="text-lg font-bold text-white">Ready to go!</h2>
              <div className="space-y-2 rounded-xl bg-white/5 p-4 text-left text-sm">
                <div className="flex justify-between"><span className="text-white/40">Business</span><span className="font-medium text-white">{form.business_name}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Location</span><span className="font-medium text-white">{form.city}{form.state ? `, ${form.state}` : ""}</span></div>
                {form.groomer_name && <div className="flex justify-between"><span className="text-white/40">Groomer</span><span className="font-medium text-white">{form.groomer_name} ({form.groomer_commission}%)</span></div>}
                <div className="flex justify-between"><span className="text-white/40">Plan</span><span className="font-medium text-[#f2c037]">14-day free trial</span></div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 hover:text-white/60">Back</button>
            ) : <div />}
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} disabled={step === 1 && !form.business_name} className="rounded-xl bg-[#f2c037] px-6 py-2.5 text-sm font-bold text-[#1a0a3e] hover:bg-[#e5a818] disabled:opacity-40">
                Next <ChevronRight size={14} className="ml-1 inline" />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={saving} className="rounded-xl bg-[#f2c037] px-6 py-2.5 text-sm font-bold text-[#1a0a3e] hover:bg-[#e5a818] disabled:opacity-40">
                {saving ? "Creating..." : "Launch my business"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
