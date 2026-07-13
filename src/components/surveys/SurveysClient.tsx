"use client";

import { Star, Clock, Heart, User } from "lucide-react";

type Survey = {
  id: string;
  created_at: string;
  overall_rating: number;
  punctuality: number;
  quality: number;
  friendliness: number;
  would_recommend: "yes" | "no" | "maybe";
  comments: string | null;
  clients: { first_name: string; last_name: string } | null;
  appointments: { date: string; services: { name: string } | null } | null;
};

export function SurveysClient({ surveys }: { surveys: Survey[] }) {
  function avg(key: "overall_rating" | "punctuality" | "quality" | "friendliness") {
    if (surveys.length === 0) return 0;
    return surveys.reduce((s, sur) => s + (sur[key] ?? 0), 0) / surveys.length;
  }

  const avgOverall = avg("overall_rating");
  const promoters = surveys.filter((s) => s.would_recommend === "yes").length;
  const detractors = surveys.filter((s) => s.would_recommend === "no").length;
  const nps = surveys.length > 0 ? ((promoters - detractors) / surveys.length) * 100 : 0;
  const recommendRate = surveys.length > 0 ? (promoters / surveys.length) * 100 : 0;
  const npsLabel = nps >= 70 ? "Excellent" : nps >= 50 ? "Great" : nps >= 0 ? "Good" : "Needs Work";

  const categoryAvgs = [
    { key: "overall_rating", label: "Overall", icon: <Star className="h-4 w-4 text-[#f2c037]" />, avg: avg("overall_rating") },
    { key: "punctuality", label: "Punctuality", icon: <Clock className="h-4 w-4 text-[#f2c037]" />, avg: avg("punctuality") },
    { key: "quality", label: "Quality", icon: <Heart className="h-4 w-4 text-[#f2c037]" />, avg: avg("quality") },
    { key: "friendliness", label: "Friendliness", icon: <User className="h-4 w-4 text-[#f2c037]" />, avg: avg("friendliness") },
  ];

  const commentsOnly = surveys.filter((s) => s.comments && s.comments.trim().length > 0).slice(0, 20);

  function recommendClass(r: string) {
    return r === "yes" ? "bg-green-100 text-green-700" : r === "no" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1a0a3e]">Client Satisfaction Surveys</h1>
        <p className="text-sm text-gray-400">Track feedback and NPS from grooming sessions</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Total Responses</div>
          <div className="text-3xl font-black text-[#1a0a3e]">{surveys.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Avg. Overall</div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-[#f2c037]">{avgOverall.toFixed(1)}</span>
            <span className="text-sm text-gray-400 mb-1">/5</span>
          </div>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3 w-3" fill={s <= avgOverall ? "#f2c037" : "#e5e7eb"} stroke="none" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">NPS Score</div>
          <span className={`text-3xl font-black ${nps >= 50 ? "text-green-600" : nps >= 0 ? "text-yellow-600" : "text-red-600"}`}>{nps.toFixed(0)}</span>
          <div className="text-xs text-gray-400 mt-1">{npsLabel}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Would Recommend</div>
          <div className="text-3xl font-black text-green-600">{recommendRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-400 mt-1">of respondents</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm font-bold text-gray-700 mb-4">Category Averages</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categoryAvgs.map((cat) => (
            <div key={cat.key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                {cat.icon}
                <span className="text-xs font-semibold text-gray-600">{cat.label}</span>
              </div>
              <div className="text-xl font-black text-gray-900">{cat.avg.toFixed(1)}</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-[#f2c037]" style={{ width: `${(cat.avg / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-700">Client Comments</div>
          <span className="text-xs text-gray-400">{commentsOnly.length} with comments</span>
        </div>
        {commentsOnly.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No comments yet</p>
        ) : (
          <div className="space-y-3">
            {commentsOnly.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{s.clients?.first_name} {s.clients?.last_name}</span>
                      <span className="text-xs text-gray-400">· {new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 italic">&quot;{s.comments}&quot;</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5 justify-end mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3 w-3" fill={star <= s.overall_rating ? "#f2c037" : "#e5e7eb"} stroke="none" />
                      ))}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${recommendClass(s.would_recommend)}`}>{s.would_recommend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
