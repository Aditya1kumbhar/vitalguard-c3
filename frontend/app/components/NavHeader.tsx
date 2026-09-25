"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Calendar, Activity, Cpu } from "lucide-react";
import { playHaptic } from "../utils/haptics";
import DeviceSpecsModal from "./DeviceSpecsModal";

export default function NavHeader() {
  const pathname = usePathname();
  const [showSpecs, setShowSpecs] = useState(false);

  const isLive = pathname === "/";
  const isRecords = pathname === "/records";

  return (
    <header className="flex flex-col gap-3 pt-1">
      {/* iOS Floating Dynamic Island Header */}
      <div className="dynamic-island rounded-3xl p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-sm">
            <Activity className="w-5 h-5" aria-hidden="true" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
              VitalGuard <span className="text-sky-600 font-extrabold">C3</span>
            </h1>
          </div>
        </div>

        {/* Device Capsule & Specs Trigger */}
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            Device .1
          </span>
          <span className="text-xs font-bold text-sky-800 bg-sky-50/90 border border-sky-200 px-2.5 py-0.5 rounded-full shadow-sm">
            Room 204
          </span>
          <button
            onClick={() => {
              playHaptic("pop");
              setShowSpecs(true);
            }}
            className="spring-btn flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white/95 hover:bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-xs"
            title="System Specifications & Architecture"
            aria-label="View System Specs"
          >
            <Cpu className="w-3 h-3 text-sky-600" />
            <span className="hidden sm:inline">Specs</span>
          </button>
        </div>
      </div>

      <DeviceSpecsModal open={showSpecs} onClose={() => setShowSpecs(false)} />

      {/* iOS Fluid Segmented Control */}
      <nav aria-label="Main Navigation" className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-inner">
        <Link
          href="/"
          onClick={() => playHaptic("pop")}
          className={`spring-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base ${
            isLive
              ? "bg-white text-slate-900 font-black shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
          aria-current={isLive ? "page" : undefined}
        >
          <Radio className={`w-4 h-4 ${isLive ? "text-sky-600 animate-pulse" : "text-slate-500"}`} aria-hidden="true" />
          <span>Live Monitor</span>
        </Link>

        <Link
          href="/records"
          onClick={() => playHaptic("pop")}
          className={`spring-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base ${
            isRecords
              ? "bg-white text-slate-900 font-black shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
          aria-current={isRecords ? "page" : undefined}
        >
          <Calendar className={`w-4 h-4 ${isRecords ? "text-sky-600" : "text-slate-500"}`} aria-hidden="true" />
          <span>Past Records</span>
        </Link>
      </nav>
    </header>
  );
}
