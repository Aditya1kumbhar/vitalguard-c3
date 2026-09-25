"use client";

import NavHeader from "../components/NavHeader";
import RiskScoreCard from "../components/RiskScoreCard";
import ClinicalSummaryCard from "../components/ClinicalSummaryCard";
import HistoricalTrends from "../components/HistoricalTrends";

export default function RecordsPage() {
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

        {/* Minimal Clean Footer */}
        <footer className="text-center py-5 border-t border-slate-200 text-xs text-slate-400 font-medium">
          VitalGuard C3 • Device .1 • Room 204
        </footer>

      </div>
    </main>
  );
}
