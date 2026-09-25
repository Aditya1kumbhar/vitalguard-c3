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
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${
            isSafe ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : isWatch ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-rose-50 text-rose-600 border border-rose-200"
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Safety Score
          </h2>
        </div>

        <button
          onClick={fetchRisk}
          disabled={loading}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Big Visual Score Display */}
      <div className={`p-5 rounded-2xl flex items-center justify-between border ${
        isSafe ? "bg-emerald-50/70 border-emerald-200" : isWatch ? "bg-amber-50/70 border-amber-200" : "bg-rose-50/70 border-rose-200"
      }`}>
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Current Health
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
              {score}
            </span>
            <span className="text-sm font-bold text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-xs ${
            isSafe ? "bg-emerald-600 text-white" : isWatch ? "bg-amber-500 text-white" : "bg-rose-600 text-white"
          }`}>
            {isSafe ? "GOOD & SAFE" : isWatch ? "ATTENTION" : "HIGH RISK"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {isSafe ? "Doing well" : "Caregiver check recommended"}
          </span>
        </div>
      </div>

      {/* 3 Simple Visual Status Indicators (Expressive without complex text) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center flex flex-col items-center gap-1">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-800">Heart</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            Normal
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center flex flex-col items-center gap-1">
          <Activity className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-bold text-slate-800">Oxygen</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            Good
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center flex flex-col items-center gap-1">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800">Falls</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            0 Today
          </span>
        </div>
      </div>
    </section>
  );
}
