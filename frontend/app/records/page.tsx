"use client";

import NavHeader from "../components/NavHeader";
import RiskScoreCard from "../components/RiskScoreCard";
import ClinicalSummaryCard from "../components/ClinicalSummaryCard";
import HistoricalTrends from "../components/HistoricalTrends";

export default function RecordsPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col">
      <div className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
        
        {/* Navigation */}
        <NavHeader />

        {/* Fall & Health Risk Score */}
        <RiskScoreCard />

        {/* Device Profile & Baseline */}
        <ClinicalSummaryCard />

        {/* 30-Day History */}
        <HistoricalTrends />

        {/* Minimal Clean Footer */}
        <footer className="text-center py-5 border-t border-slate-200 text-xs text-slate-400 font-medium">
          VitalGuard C3 • Device .1 • Room 204
        </footer>

      </div>
    </main>
  );
}
