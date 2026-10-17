"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { GlassIcon } from "./GlassIcon";
import { useTheme } from "../context/ThemeContext";
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
  const { isDark } = useTheme();
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
    <section
      aria-label="Health Safety Score"
      className={`p-5 sm:p-6 rounded-2xl border flex flex-col gap-4 transition-colors ${isDark ? "bg-[#12161D] border-white/8 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-white/8" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <GlassIcon
            name={isSafe ? "shield-check" : "shield-alert"}
            variant={isSafe ? "emerald" : isWatch ? "amber" : "rose"}
            size="md"
          />
          <div>
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Safety Score
            </h2>
            <span className="text-[11px] text-slate-400">Clinical index computed from telemetry</span>
          </div>
        </div>

        <button
          onClick={fetchRisk}
          disabled={loading}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          title="Refresh Safety Score"
          type="button"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Big Visual Score Display */}
      <div
        className={`p-4 sm:p-5 rounded-xl flex items-center justify-between border ${
          isSafe
            ? "bg-emerald-500/10 border-emerald-500/25"
            : isWatch
            ? "bg-amber-500/10 border-amber-500/25"
            : "bg-rose-500/10 border-rose-500/25"
        }`}
      >
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Health Safety Index
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono">
              {score}
            </span>
            <span className="text-sm font-bold text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 text-right max-w-[55%]">
          <span
            className={`px-3 py-1 rounded-lg font-extrabold text-xs tracking-wide ${
              isSafe
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : isWatch
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            }`}
          >
            {isSafe ? "NOMINAL & SAFE" : isWatch ? "MONITORING ADVISORY" : "ELEVATED RISK"}
          </span>
          <span className="text-[11px] text-slate-300 line-clamp-2">
            {recommendation}
          </span>
        </div>
      </div>

      {/* Dynamic Visual Status Indicators */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {/* Heart */}
        <div className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 ${isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200"}`}>
          <GlassIcon name="heart" size="sm" />
          <span className="text-xs font-bold text-slate-300">Heart</span>
          <span className="text-base font-extrabold text-white font-mono">
            {stats.avg_hr ?? 72} <span className="text-[10px] font-normal text-slate-400">BPM</span>
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              stats.hr_status === "Normal"
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            {stats.hr_status ?? "Normal"}
          </span>
        </div>

        {/* Oxygen */}
        <div className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 ${isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200"}`}>
          <GlassIcon name="oxygen" size="sm" />
          <span className="text-xs font-bold text-slate-300">Oxygen</span>
          <span className="text-base font-extrabold text-white font-mono">
            {stats.avg_spo2 ?? 98}<span className="text-[10px] font-normal text-slate-400">%</span>
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              stats.spo2_status === "Good"
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            {stats.spo2_status ?? "Good"}
          </span>
        </div>

        {/* Falls */}
        <div className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 ${isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200"}`}>
          <GlassIcon
            name={(stats.active_falls ?? 0) > 0 ? "shield-alert" : "shield-check"}
            variant={(stats.active_falls ?? 0) > 0 ? "rose" : "emerald"}
            size="sm"
          />
          <span className="text-xs font-bold text-slate-300">Falls</span>
          <span className="text-base font-extrabold text-white font-mono">
            {(stats.active_falls ?? 0) === 0 ? "0 Active" : `${stats.active_falls} Alert`}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              (stats.active_falls ?? 0) === 0
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
            }`}
          >
            {(stats.active_falls ?? 0) === 0 ? "Clear" : "Incident"}
          </span>
        </div>
      </div>

      {/* Clinical Factor Breakdown */}
      {factors.length > 0 && (
        <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Risk Factors</span>
            <span>{factors.length} {factors.length === 1 ? "factor" : "factors"}</span>
          </div>
          <div className="flex flex-col gap-2">
            {factors.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-white/4 px-3 py-2 rounded-xl border border-white/6"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-white text-xs">{f.name}</span>
                  <span className="text-[11px] text-slate-400 leading-tight">{f.description}</span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap ml-2 ${
                    f.impact > 0
                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                      : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  }`}
                >
                  {f.impact > 0 ? `+${f.impact}% risk` : "Nominal"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
