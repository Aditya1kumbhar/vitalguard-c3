"use client";

import NavHeader from "../components/NavHeader";
import RiskScoreCard from "../components/RiskScoreCard";
import ClinicalSummaryCard from "../components/ClinicalSummaryCard";
import HistoricalTrends from "../components/HistoricalTrends";
import { useAuth } from "../context/AuthContext";

export default function RecordsPage() {
  const { guardianName, bandId } = useAuth();

  return (
    <main className="min-h-[100dvh] overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col">
      <div className="flex-1 w-full max-w-xl sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-3.5 sm:p-5 md:p-6 lg:p-8 responsive-adaptive flex flex-col gap-4 sm:gap-6">
        
        {/* Navigation */}
        <NavHeader />

        {/* Responsive Grid for Tablets and Laptops */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start transition-all duration-300">
          
          {/* Left Column: Fall & Health Risk Score + Device Profile & Baseline */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6">
            <RiskScoreCard />
            <ClinicalSummaryCard />
          </div>

          {/* Right Column: 30-Day History Chart & Visual Trends */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-6">
            <HistoricalTrends />
          </div>

        </div>

        {/* Minimal Prototype Footer */}
        <footer className="text-center py-6 border-t border-slate-200/80 text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">VitalGuard C3</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">{guardianName || 'Guardian'}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-sky-700">Band: {bandId || 'VG-C3-0001'}</span>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Prototype Records Active
          </div>
        </footer>

      </div>
    </main>
  );
}
