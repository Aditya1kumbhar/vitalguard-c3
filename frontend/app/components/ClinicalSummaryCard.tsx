"use client";

import React, { useEffect, useState } from "react";
import { Heart, Activity, Thermometer, Printer } from "lucide-react";
import { getApiBase, authFetch } from "../utils/api";

export default function ClinicalSummaryCard() {
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
      className="p-5 sm:p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            30-Day Baseline Summary
          </h2>
          <span className="text-[11px] text-slate-400">Resting physiological averages</span>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs border border-white/10 transition-all cursor-pointer"
          title="Print Summary Report"
          type="button"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export</span>
        </button>
      </div>

      {/* 3 Metric Badges */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Heart Rate */}
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/6 flex flex-col items-center text-center gap-1">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Heart className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-300">Heart</span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            {patient?.baseline_hr ?? 72}
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Normal
          </span>
        </div>

        {/* Oxygen */}
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/6 flex flex-col items-center text-center gap-1">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-300">Oxygen</span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            {patient?.baseline_spo2 ?? 97}%
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Optimal
          </span>
        </div>

        {/* Temp */}
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/6 flex flex-col items-center text-center gap-1">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Thermometer className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-300">Temp</span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            {patient?.baseline_temp ?? 36.6}°C
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Stable
          </span>
        </div>
      </div>
    </section>
  );
}
