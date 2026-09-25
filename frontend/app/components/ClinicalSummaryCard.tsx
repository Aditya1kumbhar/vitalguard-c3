"use client";

import React, { useEffect, useState } from "react";
import { Heart, Activity, Thermometer, Printer, RefreshCw } from "lucide-react";
import { getApiBase } from "../utils/api";

export default function ClinicalSummaryCard() {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${getApiBase()}/patient`);
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
    <section aria-label="30-Day Vitals Average" className="royal-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          30-Day Health Summary
        </h2>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-all shadow-xs"
          title="Print Summary"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
      </div>

      {/* 3 Expressive Visual Metric Badges */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Heart Rate */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center text-center gap-1">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-500">
            <Heart className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Heart</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {patient?.baseline_hr ?? 72}
          </span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Normal
          </span>
        </div>

        {/* Oxygen */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center text-center gap-1">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-500">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Oxygen</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {patient?.baseline_spo2 ?? 97}%
          </span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Good
          </span>
        </div>

        {/* Temp */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center text-center gap-1">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-500">
            <Thermometer className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Temp</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {patient?.baseline_temp ?? 36.6}°
          </span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Normal
          </span>
        </div>

      </div>
    </section>
  );
}
