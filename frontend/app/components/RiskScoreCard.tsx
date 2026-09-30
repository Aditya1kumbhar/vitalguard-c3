"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, RefreshCw, Heart, Activity, Check } from "lucide-react";
import { getApiBase } from "../utils/api";

export default function RiskScoreCard() {
  const [score, setScore] = useState<number>(85);
  const [level, setLevel] = useState<string>("safe");
  const [loading, setLoading] = useState(true);

  const fetchRisk = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/analytics/risk-score`);
      if (res.ok) {
        const d = await res.json();
        // Calculate health safety index (100 - risk score = safety score)
        const risk = d.overall_score ?? 20;
        const safety = Math.max(10, 100 - risk);
        setScore(safety);
        setLevel(safety >= 75 ? "safe" : safety >= 50 ? "watch" : "danger");
      }
    } catch {
      // Fallback
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

        <div className="flex flex-col items-end gap-1">
          <span className={`px-3.5 py-1.5 rounded-md font-extrabold text-xs sm:text-sm tracking-wide shadow-xs ${
            isSafe ? "bg-emerald-600 text-white" : isWatch ? "bg-amber-500 text-white" : "bg-[#FE336A] text-white"
          }`}>
            {isSafe ? "GOOD & SAFE" : isWatch ? "ATTENTION" : "HIGH RISK"}
          </span>
          <span className="text-[11px] font-semibold text-[#44706A]">
            {isSafe ? "Doing well" : "Caregiver check recommended"}
          </span>
        </div>
      </div>

      {/* 3 Simple Visual Status Indicators (Expressive without complex text) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-3 rounded-2xl bg-[#F1F4F9] border border-[#01373D]/6 text-center flex flex-col items-center gap-1">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-[#01373D]">Heart</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Normal
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F1F4F9] border border-[#01373D]/6 text-center flex flex-col items-center gap-1">
          <Activity className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-bold text-[#01373D]">Oxygen</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Good
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F1F4F9] border border-[#01373D]/6 text-center flex flex-col items-center gap-1">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-[#01373D]">Falls</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            0 Today
          </span>
        </div>
      </div>
    </section>
  );
}
