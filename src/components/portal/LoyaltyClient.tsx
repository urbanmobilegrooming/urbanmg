"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Crown,
  DollarSign,
  Gift,
  History,
  Link as LinkIcon,
  MinusCircle,
  Phone,
  Scissors,
  Share2,
  Star,
  Tag,
} from "lucide-react";

type PointsEvent = {
  id: string;
  type: "earned" | "redeemed" | "bonus" | "referral";
  points: number;
  description: string;
  created_at: string;
};

type Tier = {
  name: string;
  min: number;
  max: number;
  next: string | null;
  nextAt: number;
  Icon: typeof Star;
};

const TIERS: Tier[] = [
  { name: "Bronze", min: 0, max: 499, next: "Silver", nextAt: 500, Icon: Star },
  { name: "Silver", min: 500, max: 999, next: "Gold", nextAt: 1000, Icon: Star },
  {
    name: "Gold",
    min: 1000,
    max: Number.POSITIVE_INFINITY,
    next: null,
    nextAt: Number.POSITIVE_INFINITY,
    Icon: Crown,
  },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points <= t.max) ?? TIERS[0];
}

type Reward = {
  id: string;
  label: string;
  cost: number;
  Icon: typeof DollarSign;
  description: string;
};

const REWARDS: Reward[] = [
  { id: "r1", label: "$5 Off", cost: 500, Icon: DollarSign, description: "$5 discount on any grooming service" },
  { id: "r2", label: "$10 Off", cost: 1000, Icon: Tag, description: "$10 discount on any service" },
  { id: "r3", label: "Free Nail Trim", cost: 750, Icon: Scissors, description: "One complimentary nail trim" },
  { id: "r4", label: "Free Bandana", cost: 300, Icon: Gift, description: "A cute Urban MG bandana for your pet" },
  { id: "r5", label: "$20 Off", cost: 2000, Icon: Star, description: "$20 discount on full grooming package" },
];

function eventIconFor(type: PointsEvent["type"]) {
  if (type === "redeemed") return MinusCircle;
  if (type === "bonus") return Gift;
  if (type === "referral") return Share2;
  return Star;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LoyaltyClient({
  points,
  referralCode,
  history,
}: {
  points: number;
  referralCode: string;
  history: PointsEvent[];
}) {
  const [animated, setAnimated] = useState(0);
  const tier = getTier(points);
  const tierRange = tier.next ? tier.nextAt - tier.min : 1;
  const tierProgress = tier.next
    ? Math.min(100, Math.round(((points - tier.min) / tierRange) * 100))
    : 100;
  const pointsToNext = tier.next ? Math.max(0, tier.nextAt - points) : 0;

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let current = 0;
    const increment = points / steps;
    const timer = setInterval(() => {
      current = Math.min(points, Math.round(current + increment));
      setAnimated(current);
      if (current >= points) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [points]);

  async function copyCode() {
    await navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied to clipboard!");
  }

  async function copyLink() {
    const link = `${window.location.origin}/book?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  }

  function whatsappShareUrl() {
    const msg = encodeURIComponent(
      `Get pampered with Urban Mobile Grooming! Use my code ${referralCode} when booking for a special bonus. Book at: ${typeof window !== "undefined" ? window.location.origin : ""}/book`
    );
    return `https://wa.me/?text=${msg}`;
  }

  const TierIcon = tier.Icon;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-black tracking-tight text-gray-800">Rewards</h1>
        <p className="mt-0.5 text-[13px] text-gray-500">
          Earn points on every visit and redeem for discounts
        </p>
      </div>

      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2C0F73] to-[#1a0a3e] p-6 shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f2c037]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#f2c037]/10 blur-xl" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              Your Balance
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span
                className="text-6xl font-black leading-none text-white"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {animated.toLocaleString()}
              </span>
              <span className="mb-1 text-lg font-semibold text-white/50">pts</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <TierIcon className="h-7 w-7 text-[#f2c037]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#f2c037]">
              {tier.name}
            </span>
          </div>
        </div>

        {tier.next ? (
          <div className="relative z-10 mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white/60">
                Progress to {tier.next}
              </span>
              <span className="font-bold text-white/80">{tierProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f2c037] to-[#e8960a] transition-all duration-700"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">
              {pointsToNext.toLocaleString()} more points to reach {tier.next}
            </p>
          </div>
        ) : (
          <div className="relative z-10 mt-4 flex items-center gap-2 rounded-xl bg-[#f2c037]/15 px-3 py-2">
            <Crown className="h-4 w-4 text-[#f2c037]" />
            <span className="text-[12px] font-bold text-[#f2c037]">
              You&apos;ve reached the highest tier!
            </span>
          </div>
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
            <Share2 className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-gray-800">Refer a Friend</h3>
            <p className="text-[11px] text-gray-500">
              Earn 250 bonus points for every referral
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
          <code className="flex-1 text-[13px] font-black tracking-widest text-[#2C0F73]">
            {referralCode}
          </code>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 transition-all hover:border-[#2C0F73]/30 hover:text-[#2C0F73]"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <a
            href={whatsappShareUrl()}
            target="_blank"
            rel="noopener"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:opacity-90"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share via WhatsApp
          </a>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition-all hover:border-[#2C0F73]/30 hover:text-[#2C0F73]"
          >
            <LinkIcon className="h-3 w-3" />
            Copy Link
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-[14px] font-bold text-gray-800">Available Rewards</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REWARDS.map((reward) => {
            const available = points >= reward.cost;
            const RIcon = reward.Icon;
            return (
              <div
                key={reward.id}
                className={
                  "flex items-center gap-3 rounded-xl border p-3.5 transition-all " +
                  (available
                    ? "border-[#f2c037]/30 bg-[#f2c037]/5 cursor-pointer hover:border-[#f2c037]/50 hover:shadow-sm"
                    : "border-gray-100 bg-gray-50 opacity-60")
                }
              >
                <div
                  className={
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                    (available ? "bg-[#f2c037]/20" : "bg-gray-100")
                  }
                >
                  <RIcon
                    className={
                      "h-4 w-4 " + (available ? "text-[#f2c037]" : "text-gray-300")
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-gray-800">
                    {reward.label}
                  </div>
                  <div className="text-[11px] text-gray-500">{reward.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={
                      "text-[13px] font-black " +
                      (available ? "text-[#2C0F73]" : "text-gray-400")
                    }
                  >
                    {reward.cost.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400">pts</div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
          <Phone className="h-3 w-3" />
          To redeem rewards, call us at (786) 906-6700
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-[14px] font-bold text-gray-800">Points History</h3>

        {history.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <History className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No points activity yet</p>
            <p className="mt-1 text-xs text-gray-300">
              Book your first appointment to start earning!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((event) => {
              const Icon = eventIconFor(event.type);
              const positive =
                event.type === "earned" ||
                event.type === "bonus" ||
                event.type === "referral";
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                      (positive ? "bg-green-50" : "bg-red-50")
                    }
                  >
                    <Icon
                      className={
                        "h-3.5 w-3.5 " +
                        (positive ? "text-green-500" : "text-red-400")
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-gray-800">
                      {event.description}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {fmtDate(event.created_at)}
                    </div>
                  </div>
                  <div
                    className={
                      "shrink-0 text-[14px] font-black " +
                      (event.type === "redeemed" ? "text-red-500" : "text-green-600")
                    }
                  >
                    {event.type === "redeemed" ? "-" : "+"}
                    {event.points.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
