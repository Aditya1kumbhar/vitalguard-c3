"use client";

import React, { useEffect, useState } from "react";
import { GlassIcon } from "./GlassIcon";
import { useTheme } from "../context/ThemeContext";
import { getApiBase, authFetch } from "../utils/api";

export default function ClinicalSummaryCard() {
  const { isDark } = useTheme();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch(`${getApiBase()}/patient`);
        if (res.ok) setPatient(await res.json());
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      aria-label="30-Day Vitals Average"
      className={`p-5 sm:p-6 rounded-2xl border flex flex-col gap-4 transition-colors ${isDark ? "bg-[#12161D] border-white/8 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-white/8" : "border-slate-200"}`}>
        <div>
          <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            30-Day Baseline Summary
          </h2>
          <span className="text-[11px] text-slate-400">Resting physiological averages</span>
        </div>

        <button
          onClick={handlePrint}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
            isDark
              ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
              : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
          }`}
          title="Print Summary Report"
          type="button"
        >
          <GlassIcon name="printer" size={20} interactive={false} glow={false} />
          <span>Export</span>
        </button>
      </div>

      {/* 3 Metric Badges */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Heart Rate */}
        <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 ${isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200"}`}>
          <GlassIcon name="heart" size="md" />
          <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Heart</span>
          <span className={`text-xl sm:text-2xl font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
            {patient?.baseline_hr ?? 72}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isDark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            Normal
          </span>
        </div>

        {/* Oxygen */}
        <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 ${isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200"}`}>
          <GlassIcon name="oxygen" size="md" />
          <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Oxygen</span>
          <span className={`text-xl sm:text-2xl font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
            {patient?.baseline_spo2 ?? 97}%
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isDark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            Optimal
          </span>
        </div>

        {/* Temp */}
        <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 ${isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200"}`}>
          <GlassIcon name="temp" size="md" />
          <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Temp</span>
          <span className={`text-xl sm:text-2xl font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
            {patient?.baseline_temp ?? 36.6}°C
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isDark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            Stable
          </span>
        </div>
      </div>
    </section>
  );
}
