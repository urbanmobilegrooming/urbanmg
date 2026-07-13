"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import {
  Eye, EyeOff, Loader2, ArrowRight, MapPin, Truck,
  Star, Mail, Lock, PawPrint, Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setError(error.message ?? "Sign in failed");
      setLoading(false);
      return;
    }

    window.location.replace("/dashboard");
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#080318] font-[family-name:var(--font-jakarta)]">
      {/* Animated moving gradient background */}
      <div className="absolute inset-0 animate-[bgShift_25s_ease-in-out_infinite]" style={{
        background: 'linear-gradient(135deg, #0c0420 0%, #1a0845 25%, #0d0622 50%, #0f1035 75%, #080318 100%)',
        backgroundSize: '400% 400%',
      }} />
      <div className="absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] animate-[blob1_16s_ease-in-out_infinite] rounded-full bg-[#f2c037]/30 blur-[80px]" />
        <div className="absolute right-[-10%] top-[0%] h-[450px] w-[450px] animate-[blob2_20s_ease-in-out_infinite] rounded-full bg-[#2C0F73]/60 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[10%] h-[400px] w-[400px] animate-[blob3_18s_ease-in-out_infinite] rounded-full bg-[#1e73be]/30 blur-[80px]" />
        <div className="absolute right-[20%] top-[50%] h-[300px] w-[300px] animate-[blob4_14s_ease-in-out_infinite] rounded-full bg-[#f2c037]/20 blur-[70px]" />
      </div>

      {/* Floating paw prints */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { x: 8, y: 15, size: 20, delay: 0, dur: 18 },
          { x: 85, y: 10, size: 16, delay: 2, dur: 22 },
          { x: 75, y: 75, size: 22, delay: 4, dur: 25 },
          { x: 12, y: 80, size: 14, delay: 1, dur: 20 },
          { x: 50, y: 5, size: 12, delay: 3, dur: 23 },
          { x: 92, y: 45, size: 18, delay: 5, dur: 19 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute text-white/[0.04]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `floatPaw ${p.dur}s ease-in-out infinite ${p.delay}s`,
            }}
          >
            <PawPrint size={p.size} />
          </div>
        ))}
      </div>

      {/* Main content — compact to fit viewport */}
      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center px-5 animate-[cardIn_1s_cubic-bezier(0.16,1,0.3,1)_both]">

        {/* Logo */}
        <div className="mb-3 animate-[fadeDown_0.7s_ease-out_0.2s_both]">
          <Image
            src="/logo-urban.png"
            alt="Urban Mobile Grooming"
            width={240}
            height={66}
            priority
            className="drop-shadow-[0_0_25px_rgba(242,192,55,0.3)]"
          />
        </div>

        {/* Subtitle */}
        <div className="mb-5 flex items-center gap-2 animate-[fadeDown_0.6s_ease-out_0.3s_both]">
          <Sparkles size={10} className="text-[#f2c037]/40" />
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50">
            Management Platform
          </span>
          <Sparkles size={10} className="text-[#f2c037]/40" />
        </div>

        {/* Glass card */}
        <div className="relative w-full animate-[fadeUp_0.7s_ease-out_0.35s_both]">
          <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-r from-[#f2c037]/20 via-white/5 to-[#1e73be]/20 animate-[borderGlow_6s_ease-in-out_infinite]" />
          <div className="relative rounded-[23px] bg-[#0d0622]/80 px-7 py-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] backdrop-blur-2xl">

            {/* Welcome */}
            <div className="mb-5 text-center">
              <h1 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">
                Welcome back
              </h1>
              <p className="mt-0.5 text-[13px] font-medium text-white/40">
                Sign in to manage your operations
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[11px] font-bold tracking-[0.1em] uppercase text-white/35">
                  Email
                </label>
                <div className={`group relative rounded-[12px] border transition-all duration-300 ${
                  focused === 'email'
                    ? 'border-[#f2c037]/30 bg-white/[0.06] shadow-[0_0_20px_rgba(242,192,55,0.06)]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
                }`}>
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                    <Mail size={15} className={`transition-colors duration-300 ${focused === 'email' ? 'text-[#f2c037]/70' : 'text-white/20'}`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    className="h-[44px] w-full bg-transparent pl-10 pr-4 text-[14px] font-medium text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-[11px] font-bold tracking-[0.1em] uppercase text-white/35">
                  Password
                </label>
                <div className={`group relative rounded-[12px] border transition-all duration-300 ${
                  focused === 'password'
                    ? 'border-[#f2c037]/30 bg-white/[0.06] shadow-[0_0_20px_rgba(242,192,55,0.06)]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
                }`}>
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                    <Lock size={15} className={`transition-colors duration-300 ${focused === 'password' ? 'text-[#f2c037]/70' : 'text-white/20'}`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    className="h-[44px] w-full bg-transparent pl-10 pr-12 text-[14px] font-medium text-white outline-none placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/50"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="animate-[shake_0.4s_ease-out] flex items-center gap-2.5 rounded-[12px] border border-red-500/15 bg-red-500/[0.07] px-4 py-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <span className="text-[10px] font-bold text-red-400">!</span>
                  </div>
                  <span className="text-[13px] font-medium text-red-400">{error}</span>
                </div>
              )}

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-gradient-to-r from-[#f2c037] via-[#ebc02e] to-[#daa520] text-[15px] font-extrabold text-[#1a0a3e] shadow-xl shadow-[#f2c037]/15 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(242,192,55,0.3)] active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* Info strip */}
            <div className="mt-5 flex items-center justify-center gap-4 rounded-[10px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
              {[
                { icon: MapPin, label: "South FL" },
                { icon: Truck, label: "2 Vans" },
                { icon: Star, label: "5-Star" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex shrink-0 items-center gap-1.5">
                  {i > 0 && <div className="mr-2 h-3 w-px bg-white/[0.08]" />}
                  <stat.icon size={11} className="shrink-0 text-[#f2c037]/50" />
                  <span className="whitespace-nowrap text-[10px] font-bold text-white/70">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center gap-2 animate-[fadeIn_0.5s_ease-out_1s_both]">
          <PawPrint size={9} className="text-[#f2c037]/25" />
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/70">
            urbanMG v0.1
          </span>
          <PawPrint size={9} className="text-[#f2c037]/25" />
        </div>
      </div>

    </div>
  );
}
