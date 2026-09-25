"use client";

import { Heart, Activity, Thermometer, Footprints } from "lucide-react";
import type { TelemetryPacket } from "../hooks/useTelemetrySocket";
import { playHaptic } from "../utils/haptics";

interface VitalsGridProps {
  latest: TelemetryPacket | null;
}

export default function VitalsGrid({ latest }: VitalsGridProps) {
  const hr = latest?.heart_rate ?? 0;
  const spo2 = latest?.spo2 ?? 0;
  const temp = latest?.body_temp ?? 0;
  const isOnline = latest !== null;
  
  // Real-time pulse interval in seconds for organic cardiovascular rhythm
  const pulseSpeed = hr > 0 ? (60 / hr).toFixed(2) + "s" : "0.85s";

  const getHrStatus = (v: number) => !isOnline ? "offline" : v < 50 || v > 120 ? "danger" : v < 60 || v > 100 ? "warning" : "normal";
  const getSpo2Status = (v: number) => !isOnline ? "offline" : v < 92 ? "danger" : v < 95 ? "warning" : "normal";
  const getTempStatus = (v: number) => !isOnline ? "offline" : v > 38.0 ? "danger" : v > 37.5 || v < 36.0 ? "warning" : "normal";
  
  const StatusPill = ({ status }: { status: string }) => {
    if (status === "offline") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
          Offline
        </span>
      );
    }
    if (status === "normal") {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          Normal
        </span>
      );
    }
    if (status === "warning") {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
          Check
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase animate-pulse">
        Alert
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
      {/* Living Organism Heart Rate Card */}
      <div
        onClick={() => playHaptic("soft")}
        style={{ "--pulse-speed": pulseSpeed } as React.CSSProperties}
        className={`royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px] relative overflow-hidden ${
          isOnline && hr > 0 ? "animate-living-heart" : ""
        }`}
      >
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 shadow-sm">
              <Heart className="w-4 h-4 animate-pulse" aria-hidden="true" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">Heart Beat</span>
          </div>
          <StatusPill status={getHrStatus(hr)} />
        </div>

        <div className="mt-3 flex items-baseline gap-1.5 z-10">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
            {hr || "--"}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-400">BPM</span>
        </div>
      </div>

      {/* Oxygen Card */}
      <div
        onClick={() => playHaptic("soft")}
        className="royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 shadow-sm">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">Oxygen</span>
          </div>
          <StatusPill status={getSpo2Status(spo2)} />
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
            {spo2 || "--"}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-400">%</span>
        </div>
      </div>

      {/* Body Temp Card */}
      <div
        onClick={() => playHaptic("soft")}
        className="royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 shadow-sm">
              <Thermometer className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">Body Temp</span>
          </div>
          <StatusPill status={getTempStatus(temp)} />
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
            {temp || "--"}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-400">°C</span>
        </div>
      </div>

      {/* Movement Card */}
      <div
        onClick={() => playHaptic("soft")}
        className="royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <Footprints className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">Movement</span>
          </div>
          <StatusPill status={isOnline ? "normal" : "offline"} />
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 capitalize truncate">
            {latest?.stage === 'normal' ? 'Resting' : (latest?.stage?.replace(/_/g, ' ') || 'Resting')}
          </span>
        </div>
      </div>
    </div>
  );
}
