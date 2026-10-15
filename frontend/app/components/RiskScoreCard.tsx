"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, RefreshCw, Heart, Activity, CheckCircle2 } from "lucide-react";
import { getApiBase, authFetch } from "../utils/api";

interface Factor {
  name: string;
  impact: number;
  description: string;
}

interface SummaryStats {
  avg_hr?: number;
  hr_status?: string;
  avg_spo2?: number;
  spo2_status?: string;
  active_falls?: number;
  historical_falls?: number;
}

export default function RiskScoreCard() {
  const [score, setScore] = useState<number>(93);
  const [level, setLevel] = useState<string>("safe");
  const [recommendation, setRecommendation] = useState<string>("Patient is stable. Continue routine monitoring.");
  const [factors, setFactors] = useState<Factor[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    avg_hr: 72,
    hr_status: "Normal",
    avg_spo2: 98,
    spo2_status: "Good",
    active_falls: 0,
    historical_falls: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchRisk = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${getApiBase()}/analytics/risk-score`);
      if (res.ok) {
        const d = await res.json();
        // Calculate health safety index (100 - risk score = safety score)
        const risk = typeof d.overall_score === "number" ? d.overall_score : 10;
        const safety = Math.round(Math.max(10, Math.min(100, 100 - risk)));
        setScore(safety);
        setLevel(safety >= 75 ? "safe" : safety >= 50 ? "watch" : "danger");
        if (d.recommendation) setRecommendation(d.recommendation);
        if (Array.isArray(d.factors)) setFactors(d.factors);
        if (d.summary_stats) setStats(d.summary_stats);
      }
    } catch {
      // Retain fallback defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, []);

  const isSafe = level === "safe";
  const isWatch = level === "watch";

  return (
    <section aria-label="Health Safety Score" className="royal-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#01373D]/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${
            isSafe ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : isWatch ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-[#FE336A]/10 text-[#FE336A] border border-[#FE336A]/20"
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#01373D] tracking-tight">
            Safety Score
          </h2>
        </div>

        <button
          onClick={fetchRisk}
          disabled={loading}
          className="p-2 rounded-xl text-[#44706A] hover:text-[#01373D] hover:bg-[#F1F4F9] transition-all"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Big Visual Score Display */}
      <div className={`p-5 rounded-2xl flex items-center justify-between border ${
        isSafe ? "bg-emerald-50/70 border-emerald-200" : isWatch ? "bg-amber-50/70 border-amber-200" : "bg-[#FE336A]/5 border-[#FE336A]/20"
      }`}>
        <div>
          <span className="text-xs font-bold text-[#44706A] uppercase tracking-wider block">
            Current Health
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#01373D] font-mono">
              {score}
            </span>
            <span className="text-sm font-bold text-[#44706A]">/ 100</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right max-w-[55%]">
          <span className={`px-3.5 py-1.5 rounded-md font-extrabold text-xs sm:text-sm tracking-wide shadow-xs ${
            isSafe ? "bg-emerald-600 text-white" : isWatch ? "bg-amber-500 text-white" : "bg-[#FE336A] text-white"
          }`}>
            {isSafe ? "GOOD & SAFE" : isWatch ? "ATTENTION" : "HIGH RISK"}
          </span>
          <span className="text-[11px] font-semibold text-[#44706A] line-clamp-2">
            {recommendation}
          </span>
        </div>
      </div>

      {/* Dynamic Visual Status Indicators */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Heart */}
        <div className="p-3 rounded-2xl bg-[#F1F4F9] border border-[#01373D]/6 text-center flex flex-col items-center gap-1">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-[#01373D]">Heart</span>
          <span className="text-[11px] font-extrabold text-[#01373D]">
            {stats.avg_hr ?? 72} <span className="text-[9px] font-normal text-[#44706A]">bpm</span>
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
            stats.hr_status === "Normal" ? "text-emerald-700 bg-emerald-100/80" : "text-amber-700 bg-amber-100/80"
          }`}>
            {stats.hr_status ?? "Normal"}
          </span>
        </div>

        {/* Oxygen */}
        <div className="p-3 rounded-2xl bg-[#F1F4F9] border border-[#01373D]/6 text-center flex flex-col items-center gap-1">
          <Activity className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-bold text-[#01373D]">Oxygen</span>
          <span className="text-[11px] font-extrabold text-[#01373D]">
            {stats.avg_spo2 ?? 98}<span className="text-[9px] font-normal text-[#44706A]">%</span>
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
            stats.spo2_status === "Good" ? "text-emerald-700 bg-emerald-100/80" : "text-amber-700 bg-amber-100/80"
          }`}>
            {stats.spo2_status ?? "Good"}
          </span>
        </div>

        {/* Falls */}
        <div className="p-3 rounded-2xl bg-[#F1F4F9] border border-[#01373D]/6 text-center flex flex-col items-center gap-1">
          <AlertCircle className={`w-4 h-4 ${(stats.active_falls ?? 0) > 0 ? "text-rose-500" : "text-emerald-500"}`} />
          <span className="text-xs font-bold text-[#01373D]">Falls</span>
          <span className="text-[11px] font-extrabold text-[#01373D]">
            {(stats.active_falls ?? 0) === 0 ? "0 Active" : `${stats.active_falls} Alert`}
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
            (stats.active_falls ?? 0) === 0 ? "text-emerald-700 bg-emerald-100/80" : "text-rose-700 bg-rose-100/80"
          }`}>
            {(stats.active_falls ?? 0) === 0 ? "Safe" : "Action Needed"}
          </span>
        </div>
      </div>

      {/* Clinical Factor Breakdown */}
      {factors.length > 0 && (
        <div className="pt-2 border-t border-[#01373D]/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#44706A] uppercase tracking-wider">
            <span>Clinical Breakdown</span>
            <span>{factors.length} {factors.length === 1 ? 'factor' : 'factors'}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-[#F1F4F9]/60 px-3 py-2 rounded-xl border border-[#01373D]/5">
                <div className="flex flex-col">
                  <span className="font-bold text-[#01373D] text-[11px]">{f.name}</span>
                  <span className="text-[10px] text-[#44706A] font-medium leading-tight">{f.description}</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap ml-2 ${
                  f.impact > 0 ? "text-amber-700 bg-amber-100/80" : "text-emerald-700 bg-emerald-100/80"
                }`}>
                  {f.impact > 0 ? `+${f.impact}% risk` : "Healthy"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
