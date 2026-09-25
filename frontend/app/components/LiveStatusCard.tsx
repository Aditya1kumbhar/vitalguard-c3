"use client";

import { Wifi, WifiOff, BatteryFull } from "lucide-react";
import type { ConnectionState } from "../hooks/useTelemetrySocket";
import { playHaptic } from "../utils/haptics";

interface LiveStatusCardProps {
  connectionState: ConnectionState;
}

export default function LiveStatusCard({ connectionState }: LiveStatusCardProps) {
  const isConnected = connectionState === "connected";
  
  return (
    <div
      onClick={() => playHaptic("click")}
      className="royal-card royal-card-interactive rounded-2xl p-4 flex items-center justify-between gap-4"
    >
      {/* Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-3.5 w-3.5 shrink-0">
          {isConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
          )}
        </div>
        
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
            {isConnected ? "Device Connected" : "Device Offline"}
          </h2>
        </div>
      </div>
      
      {/* Battery and Signal */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
          <BatteryFull className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span className="font-bold text-slate-800 text-xs">92%</span>
        </div>

        <div className="flex items-center px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-sky-600" aria-hidden="true" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-500" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}
