"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Calendar, Activity, LogOut } from "lucide-react";
import { playHaptic } from "../utils/haptics";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function NavHeader() {
  const pathname = usePathname();
  const { isAuthenticated, guardianName, bandId, logout } = useAuth();

  const isLive = pathname === "/";
  const isRecords = pathname === "/records";

  return (
    <header className="flex flex-col gap-3 pt-1">
      {/* iOS Floating Dynamic Island Header */}
      <div className="dynamic-island rounded-3xl p-3.5 sm:p-4 flex items-center justify-between bg-white/80 dark:bg-[#12161D]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md dark:shadow-lg transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 flex items-center justify-center">
            <img
              src="/logo-tight.png"
              alt="VitalGuard Logo"
              className="h-9 w-auto object-contain select-none"
            />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              VitalGuard <span className="text-sky-600 dark:text-cyan-400 font-extrabold">C3</span>
            </h1>
          </div>
        </div>

        {/* Patient and Band Details + Theme Toggle + Logout */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg shadow-xs">
            {guardianName || 'Guardian'}
          </span>
          <span className="text-xs font-mono font-bold text-sky-800 dark:text-cyan-300 bg-sky-50 dark:bg-cyan-950/40 border border-sky-200 dark:border-cyan-800/40 px-2.5 py-1 rounded-lg shadow-xs">
            Band: {bandId || 'VG-C3-0001'}
          </span>

          <ThemeToggle size="sm" />

          {isAuthenticated && (
            <button
              onClick={() => {
                playHaptic("pop");
                logout();
              }}
              className="spring-btn flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/40 px-2 py-1 rounded-lg shadow-xs ml-1 cursor-pointer"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-3 h-3 text-rose-500 dark:text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Fluid Segmented Control */}
      <nav aria-label="Main Navigation" className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
        <Link
          href="/"
          onClick={() => playHaptic("pop")}
          className={`spring-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
            isLive
              ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white font-black shadow-sm border border-slate-200/80 dark:border-white/10"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          aria-current={isLive ? "page" : undefined}
        >
          <Radio className={`w-4 h-4 ${isLive ? "text-sky-600 dark:text-cyan-400 animate-pulse" : "text-slate-500 dark:text-slate-400"}`} aria-hidden="true" />
          <span>Live Monitor</span>
        </Link>

        <Link
          href="/records"
          onClick={() => playHaptic("pop")}
          className={`spring-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
            isRecords
              ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white font-black shadow-sm border border-slate-200/80 dark:border-white/10"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          aria-current={isRecords ? "page" : undefined}
        >
          <Calendar className={`w-4 h-4 ${isRecords ? "text-sky-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}`} aria-hidden="true" />
          <span>Past Records</span>
        </Link>
      </nav>
    </header>
  );
}
