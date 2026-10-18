'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Users,
  LayoutGrid,
  Search,
  Mic,
  Flame,
  User,
  Sun,
  Brain,
  MoveHorizontal,
  Wind,
  Bell,
  X,
  Radio,
  Bluetooth,
  ChevronRight,
  Shield,
  ShieldAlert,
  FileText,
  FileCheck,
  Sliders,
  LogOut,
  Cpu,
  Check,
  AlertTriangle,
  TrendingUp,
  Activity,
  Gauge,
  Info,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Database,
  RotateCcw,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Ring } from './design/Ring';
import { Card } from './design/Card';
import { Sheet } from './design/Sheet';
import { FallAlertSheet } from './design/FallAlertSheet';
import { MockBand } from './data/MockBand';
import { WebBluetoothBand } from './data/WebBluetoothBand';
import { useBand } from './data/useBand';
import { useAuth } from './context/AuthContext';
import { DailyRecord, getDailyRecords, seedInitialDataIfEmpty } from './utils/localDatabase';
import RiskScoreCard from './components/RiskScoreCard';
import ClinicalSummaryCard from './components/ClinicalSummaryCard';
import HistoricalTrends from './components/HistoricalTrends';
import GlassIcon from './components/GlassIcon';
import GlassLogo from './components/GlassLogo';
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import VitalGuardCanvasBackground from './components/VitalGuardCanvasBackground';
import { playHaptic } from './utils/haptics';
import {
  colors,
  dimensions,
  layout,
  press,
  spring,
  typography,
} from './design/motion.tokens';

export default function VitalGuardCompanionDashboard() {
  const { guardianName, bandId, logout } = useAuth();
  const { isDark } = useTheme();

  // Navigation tab state: 'summary' | 'trends' | 'falls'
  const [activeTab, setActiveTab] = useState<'summary' | 'trends' | 'falls'>('summary');
  const [transportMode, setTransportMode] = useState<'mock' | 'ble'>('mock');
  const [isBleSupported, setIsBleSupported] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [manualFallActive, setManualFallActive] = useState<boolean>(false);
  const [dismissedCards, setDismissedCards] = useState<{ [key: string]: boolean }>({});
  const [thirtyDayRecords, setThirtyDayRecords] = useState<DailyRecord[]>([]);

  // Rolling 60s heart rate history for the sparkline
  const [hrHistory, setHrHistory] = useState<number[]>([
    70, 71, 70, 69, 70, 72, 71, 70, 69, 70, 71, 72, 73, 72, 71, 70, 69, 70, 71, 72,
    70, 69, 70, 71, 72, 71, 70, 69, 70, 71, 70, 71, 72, 71, 70, 69, 70, 71, 72, 70,
  ]);

  // Transports
  const mockTransport = useMemo(() => new MockBand(), []);
  const bleTransport = useMemo(() => new WebBluetoothBand(), []);
  const activeTransport = transportMode === 'mock' ? mockTransport : bleTransport;

  const { frame, status, connect, disconnect, dismissFall } = useBand(activeTransport);

  useEffect(() => {
    setIsBleSupported(WebBluetoothBand.isSupported());
  }, []);

  // Connect mock on mount
  useEffect(() => {
    if (transportMode === 'mock') {
      mockTransport.connect().then(() => setIsConnected(true));
      return () => {
        mockTransport.disconnect();
      };
    }
  }, [mockTransport, transportMode]);

  // Push HR updates to sparkline
  useEffect(() => {
    if (frame?.hr && frame.hr > 0) {
      setHrHistory((prev) => [...prev.slice(1), frame.hr]);
    }
  }, [frame?.hr, frame?.ts]);

  // Load 30-Day FIFO Fall Records from local IndexedDB
  useEffect(() => {
    async function loadFIFOData() {
      try {
        let recs = await getDailyRecords(30);
        if (recs.length === 0) {
          recs = await seedInitialDataIfEmpty();
        }
        setThirtyDayRecords(recs);
      } catch (err) {
        console.warn('Failed to load FIFO records from IndexedDB:', err);
      }
    }
    loadFIFOData();
  }, []);

  const hrValue = frame?.hr ?? 70;
  const spo2Value = frame?.spo2 ?? 98;
  const batteryValue = frame?.battery ?? 85;
  const pulseDuration = Math.max(0.4, 60 / (hrValue || 70));

  // Compute live Signal Vector Magnitude (SVM in G-force)
  const isCurrentlyFalling = status === 'fall' || manualFallActive;
  const liveSvm = isCurrentlyFalling ? 3.82 : status === 'irregular' ? 1.48 : 1.02;

  // Compute Sparkline SVG
  const sparklineSvg = useMemo(() => {
    const width = 420;
    const height = 90;
    const pts = hrHistory;
    const minVal = Math.min(...pts) - 5;
    const maxVal = Math.max(...pts) + 5;
    const range = maxVal - minVal || 1;

    const coords = pts.map((val, idx) => ({
      x: (idx / (pts.length - 1)) * width,
      y: height - ((val - minVal) / range) * (height - 20) - 10,
    }));

    const linePath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return { linePath, areaPath };
  }, [hrHistory]);

  const handleConnectionToggle = () => {
    if (isConnected) {
      disconnect();
      setIsConnected(false);
    } else {
      connect()
        .then(() => setIsConnected(true))
        .catch((err) => console.error('Connection failed:', err));
    }
  };

  const handleModeChange = (mode: 'mock' | 'ble') => {
    disconnect();
    setIsConnected(false);
    setTransportMode(mode);
    setIsAccountOpen(false);
  };

  const displayName = guardianName && guardianName !== 'Guardian' ? guardianName : 'Aditya Kumbhar';
  const displayBandId = bandId || 'VG-C3-0001';

  const initials = useMemo(() => {
    if (!displayName) return 'AK';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase() || 'AK';
  }, [displayName]);

  // FIFO Statistics
  const totalFallsIn30Days = useMemo(() => {
    return thirtyDayRecords.reduce((acc, r) => acc + (r.fall_count || 0), 0);
  }, [thirtyDayRecords]);

  const safeDaysCount = useMemo(() => {
    return thirtyDayRecords.filter((r) => (r.fall_count || 0) === 0).length;
  }, [thirtyDayRecords]);

    return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        backgroundColor: 'transparent',
        fontFamily: typography.fontFamily,
        color: 'var(--text-primary)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* ── 3D Interactive Hardware Scrollytelling Canvas Background ── */}
      <VitalGuardCanvasBackground isDark={isDark} opacity={isDark ? 0.95 : 0.88} />

      {/* ── Background Cyber-Glow Effect ───────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 400,
          pointerEvents: 'none',
          background:
            isCurrentlyFalling
              ? 'radial-gradient(ellipse 800px 320px at 50% 0%, rgba(255, 69, 58, 0.35) 0%, transparent 100%)'
              : status === 'irregular'
              ? 'radial-gradient(ellipse 800px 320px at 50% 0%, rgba(255, 159, 10, 0.28) 0%, transparent 100%)'
              : 'radial-gradient(ellipse 800px 320px at 50% 0%, rgba(14, 165, 233, 0.20) 0%, transparent 100%)',
          transition: 'background 1200ms ease',
          zIndex: 0,
        }}
      />

      {/* ── Main Responsive Container (Expanded Breathing Room & Minimal Calming Aesthetic) ── */}
      <div
        className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-14 relative z-10 flex flex-col gap-16 sm:gap-20 lg:gap-28"
        style={{
          paddingBottom: 'calc(max(40px, env(safe-area-inset-bottom)) + 260px)',
          minHeight: '280vh',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Cohesive Header Bar across all tabs ──────────────────────────── */}
        <header className="flex items-center justify-between pb-6 sm:pb-8 border-b border-slate-200 dark:border-white/8">
          <div className="flex items-center gap-3.5">
            <GlassLogo
              size={48}
              isFalling={isCurrentlyFalling}
              showStatusDot={true}
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  VitalGuard
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider">
                  C3
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Settings Sheet Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.button
              type="button"
              onClick={() => setIsAccountOpen(true)}
              whileTap={{ scale: press.scale }}
              aria-label="Open Account and Device Settings"
              className="flex items-center gap-3 p-2 pr-4 rounded-2xl transition-colors cursor-pointer bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-cyan-400/40"
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(14, 165, 233, 0.45)',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{initials}</span>
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">Settings</span>
            </motion.button>
          </div>
        </header>

        {/* ═════════════════════════════════════════════════════════════
            TAB 1: LIVE VITALS & TELEMETRY (Dual Column on PC, Single Column on Mobile)
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-12 sm:gap-16"
          >
            {/* Title (Big Minimal Header) */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
                Live Vitals &amp; Telemetry
              </h1>
            </div>

            {/* PC Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
              {/* ── Left Column: Hero HR Ring, SpO2/Battery Cards ── */}
              <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6">
                {/* Hero Heart Rate Ring Card */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '28px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <GlassIcon name="heart" size="md" variant="rose" />
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Heart Rate (PPG)
                        </span>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                        {status === 'irregular' ? 'PATTERN NOTICED' : 'NOMINAL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-around py-4">
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Ring
                          value={hrValue}
                          max={160}
                          size={160}
                          strokeWidth={15}
                          colour="#FF375F"
                          bgColour="rgba(255, 55, 95, 0.18)"
                          displayValue={String(hrValue)}
                          unit="BPM"
                          glowFilter="drop-shadow(0 0 20px rgba(255, 55, 95, 0.45))"
                        />
                      </motion.div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Resting Baseline</span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">68 - 74 BPM</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">24h Peak</span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-rose-400">118 BPM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dual Metrics: SpO2 & Battery Level */}
                <div className="grid grid-cols-2 gap-5">
                  {/* SpO2 Card */}
                  <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '24px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <GlassIcon name="oxygen" size="sm" variant="emerald" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SpO2</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white">{spo2Value}</span>
                        <span className="text-base font-bold text-slate-400">%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2.5 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, spo2Value)}%` }}
                        />
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold mt-1">Optimal Saturation</span>
                    </div>
                  </Card>

                  {/* Battery Level Card */}
                  <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '24px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <GlassIcon name="battery" size="sm" variant="amber" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Battery</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white">{batteryValue}</span>
                        <span className="text-base font-bold text-slate-400">%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2.5 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, batteryValue)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-semibold mt-1">Hardware ADC Nominal</span>
                    </div>
                  </Card>
                </div>
              </div>

              {/* ── Right Column: 60s Sparkline ── */}
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6">
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '28px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GlassIcon name="pulse" size="md" variant="cyan" />
                        <div>
                          <span className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                            PPG Pulse Waveform (Rolling 60 Seconds)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-mono text-cyan-400 font-bold">1 Hz Live</span>
                      </div>
                    </div>

                    {/* SVG Sparkline Graph */}
                    <div className="w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/6 p-3">
                      <svg
                        viewBox="0 0 420 120"
                        className="w-full h-36 sm:h-44"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="vgSparklineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={sparklineSvg.areaPath} fill="url(#vgSparklineGrad)" />
                        <path
                          d={sparklineSvg.linePath}
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex justify-between text-xs font-mono text-slate-500 px-2 pt-2">
                        <span>-60s</span>
                        <span>-45s</span>
                        <span>-30s</span>
                        <span>-15s</span>
                        <span className="text-cyan-400 font-bold">Now ({hrValue} BPM)</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: CLINICAL RECORDS & TRENDS (Integrated Native Tab)
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'trends' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-12 sm:gap-16"
          >
            {/* Title (Big Minimal Header) */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
                Clinical Records &amp; Medical Vitals
              </h1>
            </div>

            {/* Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
              {/* Left Column: Safety Score + Baseline Summary */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                <RiskScoreCard />
                <ClinicalSummaryCard />
              </div>

              {/* Right Column: Historical Trends Charts */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                <HistoricalTrends />
              </div>
            </div>


            {/* 30-Day Physiological Biometric Ledger Table */}
            <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '32px' }}>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GlassIcon name="records" size="sm" variant="cyan" />
                    <span className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Cardiovascular &amp; Physiological Daily Ledger (30 Days)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    FIFO Synchronized
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="pb-3.5 font-semibold">Date</th>
                        <th className="pb-3.5 font-semibold">Resting HR</th>
                        <th className="pb-3.5 font-semibold">SpO2 Mean</th>
                        <th className="pb-3.5 font-semibold">SVM Motion Index</th>
                        <th className="pb-3.5 font-semibold text-right">Clinical Stratification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {thirtyDayRecords.slice(0, 10).map((r, i) => (
                        <tr key={r.dateKey || i}>
                          <td className="py-4 font-bold text-slate-900 dark:text-white">{r.dateKey}</td>
                          <td className="py-4 font-mono text-slate-700 dark:text-slate-300">{r.avg_hr} BPM</td>
                          <td className="py-4 font-mono text-slate-700 dark:text-slate-300">{r.avg_spo2}%</td>
                          <td className="py-4 font-mono text-slate-700 dark:text-slate-300">1.04 G (Stable)</td>
                          <td className="py-4 text-right">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              PHYSIOLOGICALLY NOMINAL
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 3: FALL DETECTION (Replaces Sharing - 30-Day FIFO Report)
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'falls' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-12 sm:gap-16"
          >
            {/* Title (Big Minimal Header) */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
                Fall Detection &amp; Safety Report
              </h1>
            </div>

            {/* PC Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
              {/* ── Left Column: Live SVM Accelerometer & Test Fall Controls ── */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                {/* Live 3-Axis SVM Accelerometer Monitor */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '32px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <GlassIcon name="gauge" size="md" variant="amber" />
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Live 3-Axis SVM Accelerometer
                        </span>
                      </div>
                      {isCurrentlyFalling && (
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                          IMPACT DETECTED
                        </span>
                      )}
                    </div>

                    {/* Numerical G-Force Display */}
                    <div className="flex items-baseline justify-between py-3">
                      <div>
                        <span className="text-7xl sm:text-8xl font-black font-mono text-slate-900 dark:text-white">
                          {liveSvm.toFixed(2)}
                        </span>
                        <span className="text-2xl font-bold text-slate-400 ml-2">G</span>
                      </div>
                    </div>

                    {/* G-Force Range Bar */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>0.0G (Rest)</span>
                        <span>1.4G (Motion)</span>
                        <span className="text-rose-400 font-bold">&gt;3.0G (Fall Trigger)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-4 relative overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            liveSvm >= 3.0 ? 'bg-rose-500' : liveSvm >= 1.4 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, (liveSvm / 4.0) * 100)}%` }}
                        />
                        {/* Threshold mark at 3.0G (75%) */}
                        <div className="absolute top-0 bottom-0 left-[75%] w-1 bg-rose-400 shadow-[0_0_8px_#FF453A]" />
                      </div>
                    </div>

                    {/* 3-Axis Decomposition */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/6 text-center text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/6">
                        <span className="text-slate-400 block text-xs">X-Axis</span>
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1 block">0.04 G</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/6">
                        <span className="text-slate-400 block text-xs">Y-Axis</span>
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1 block">0.98 G</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/6">
                        <span className="text-slate-400 block text-xs">Z-Axis</span>
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1 block">0.12 G</span>
                      </div>
                    </div>

                    {/* Test Alarm Controls */}
                    <div className="pt-3 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setManualFallActive(true)}
                        className="w-full py-4 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-950/40 cursor-pointer"
                      >
                        <GlassIcon name="shield-alert" size={20} variant="rose" interactive={false} glow={false} />
                        <span>Trigger Test Fall Alarm (30s Countdown)</span>
                      </button>

                      {isCurrentlyFalling && (
                        <button
                          type="button"
                          onClick={() => {
                            dismissFall();
                            setManualFallActive(false);
                          }}
                          className="w-full py-3.5 rounded-2xl text-sm font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                          <GlassIcon name="refresh" size={18} variant="slate" interactive={false} glow={false} />
                          <span>Reset Sensor Alarm Baseline</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* ── Right Column: 30-Day FIFO Algorithm Report & Daily History ── */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                {/* FIFO Algorithm Architecture Card */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '28px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <GlassIcon name="database" size="sm" variant="blue" />
                        <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                          30-Day Rolling FIFO Ring Buffer
                        </span>
                      </div>
                    </div>

                    {/* KPI Scoreboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-xs text-slate-400">30-Day Falls</span>
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                          {totalFallsIn30Days}
                        </span>
                        <span className="text-xs text-emerald-400 mt-1 font-semibold">Isolated incidents</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-xs text-slate-400">Safe Days</span>
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                          {safeDaysCount}/30
                        </span>
                        <span className="text-xs text-cyan-400 mt-1 font-semibold">93.3% safe index</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-xs text-slate-400">Countdown Limit</span>
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">30s</span>
                        <span className="text-xs text-slate-400 mt-1 font-semibold">Verification window</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-xs text-slate-400">FIFO Rotation</span>
                        <span className="text-3xl font-black font-mono text-emerald-400 mt-1">Day 31+</span>
                        <span className="text-xs text-slate-400 mt-1 font-semibold">Auto-purge active</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Chronological 30-Day Daily Audit Log */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', padding: '28px', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Past 30 Days Audit Log
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {thirtyDayRecords.map((r, i) => {
                        const hasFall = (r.fall_count || 0) > 0;
                        return (
                          <div
                            key={r.dateKey || i}
                            className={`p-4 rounded-2xl flex items-center justify-between text-xs transition-colors border ${
                              hasFall
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : (isDark
                                    ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              {hasFall ? (
                                <GlassIcon name="shield-alert" size="sm" variant="rose" />
                              ) : (
                                <GlassIcon name="shield-check" size="sm" variant="emerald" />
                              )}
                              <div>
                                <span className={`font-bold text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.dateKey}</span>
                                <span className="text-slate-400 text-xs mt-0.5 block">
                                  Avg HR: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{r.avg_hr} BPM</strong> | SpO2: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{r.avg_spo2}%</strong>
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {hasFall ? (
                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  {r.fall_count} Fall Logged
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10">
                                  Safe Baseline
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════
          FLOATING BOTTOM NAVBAR (FIXED ON SCREEN - NEVER SCROLLS AWAY)
         ═════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Bottom Navigation Dock"
        style={{
          position: 'fixed',
          bottom: 'max(14px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: 'calc(100% - 24px)',
          maxWidth: 420,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: 'var(--dock-bg)',
            backdropFilter: 'blur(36px) saturate(190%)',
            WebkitBackdropFilter: 'blur(36px) saturate(190%)',
            border: '1px solid var(--dock-border)',
            borderRadius: 24,
            padding: '6px 10px 8px 10px',
            boxShadow: 'var(--dock-shadow)',
          }}
        >
          {/* Tab 1: Live Vitals */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('summary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              playHaptic('click');
            }}
            aria-label="Live Vitals"
            aria-selected={activeTab === 'summary'}
            role="tab"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '2px 0 0 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 62,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeTab === 'summary' && (
                <motion.div
                  layoutId="activeDockPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 17,
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(14, 165, 233, 0.16)',
                    border: isDark ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(14, 165, 233, 0.35)',
                    boxShadow: isDark
                      ? '0 2px 10px rgba(14, 165, 233, 0.30)'
                      : '0 2px 8px rgba(14, 165, 233, 0.18)',
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <GlassIcon
                  name="pulse"
                  size={32}
                  variant={activeTab === 'summary' ? 'cyan' : 'slate'}
                  interactive={false}
                  glow={activeTab === 'summary'}
                />
              </div>
              {/* Telemetry live status indicator */}
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  zIndex: 2,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: activeTab === 'summary' ? 700 : 500,
                letterSpacing: '0.01em',
                color: activeTab === 'summary' ? (isDark ? '#38BDF8' : '#0284C7') : (isDark ? '#94A3B8' : '#64748B'),
                transition: 'color 150ms ease',
              }}
            >
              Vitals
            </span>
          </button>

          {/* Tab 2: Clinical Records */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('trends');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              playHaptic('click');
            }}
            aria-label="Clinical Records and Trends"
            aria-selected={activeTab === 'trends'}
            role="tab"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '2px 0 0 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 62,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeTab === 'trends' && (
                <motion.div
                  layoutId="activeDockPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 17,
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(14, 165, 233, 0.16)',
                    border: isDark ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(14, 165, 233, 0.35)',
                    boxShadow: isDark
                      ? '0 2px 10px rgba(14, 165, 233, 0.30)'
                      : '0 2px 8px rgba(14, 165, 233, 0.18)',
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <GlassIcon
                  name="records"
                  size={32}
                  variant={activeTab === 'trends' ? 'cyan' : 'slate'}
                  interactive={false}
                  glow={activeTab === 'trends'}
                />
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: activeTab === 'trends' ? 700 : 500,
                letterSpacing: '0.01em',
                color: activeTab === 'trends' ? (isDark ? '#38BDF8' : '#0284C7') : (isDark ? '#94A3B8' : '#64748B'),
                transition: 'color 150ms ease',
              }}
            >
              Records
            </span>
          </button>

          {/* Tab 3: Fall Safety */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('falls');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              playHaptic('click');
            }}
            aria-label="Fall Safety and Dispatch"
            aria-selected={activeTab === 'falls'}
            role="tab"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '2px 0 0 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 62,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeTab === 'falls' && (
                <motion.div
                  layoutId="activeDockPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 17,
                    backgroundColor: isDark ? 'rgba(255, 69, 58, 0.22)' : 'rgba(239, 68, 68, 0.16)',
                    border: isDark ? '1px solid rgba(255, 69, 58, 0.45)' : '1px solid rgba(239, 68, 68, 0.35)',
                    boxShadow: isDark
                      ? '0 2px 10px rgba(255, 69, 58, 0.30)'
                      : '0 2px 8px rgba(239, 68, 68, 0.20)',
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <GlassIcon
                  name="shield-alert"
                  size={32}
                  variant={activeTab === 'falls' ? 'rose' : 'slate'}
                  interactive={false}
                  glow={activeTab === 'falls'}
                />
              </div>
              {/* Alert or armed badge */}
              {isCurrentlyFalling ? (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: 4,
                    padding: '1px 5px',
                    borderRadius: 9999,
                    fontSize: 9,
                    fontWeight: 800,
                    backgroundColor: '#FF453A',
                    color: '#FFFFFF',
                    boxShadow: '0 0 8px rgba(255, 69, 58, 0.8)',
                    zIndex: 2,
                  }}
                >
                  ALERT
                </span>
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                    zIndex: 2,
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: activeTab === 'falls' ? 700 : 500,
                letterSpacing: '0.01em',
                color: activeTab === 'falls' ? '#FF453A' : (isDark ? '#94A3B8' : '#64748B'),
                transition: 'color 150ms ease',
              }}
            >
              Safety
            </span>
          </button>
        </div>
      </nav>

      {/* ═════════════════════════════════════════════════════════════
          ACCOUNT & DEVICE APPLICATION SETTINGS SHEET
         ═════════════════════════════════════════════════════════════ */}
      <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen} title="Account & Application Settings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 4 }}>
          {/* Section: Interface Appearance with iOS 27 Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isDark ? colors.textSecondary : '#64748B',
                paddingLeft: 4,
              }}
            >
              Interface Appearance
            </span>

            <Card style={{ padding: '14px 16px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
                  </span>
                  <span style={{ fontSize: 12, color: isDark ? colors.textSecondary : '#64748B' }}>
                    {isDark ? 'Obsidian cyber glow baseline' : 'Pristine clinical health baseline'}
                  </span>
                </div>
                <ThemeToggle size="md" />
              </div>
            </Card>
          </div>
          {/* Top Bar: Title & Done Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>VitalGuard Profile</span>
            <button
              type="button"
              onClick={() => setIsAccountOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38BDF8',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Done
            </button>
          </div>

          {/* User Profile Card */}
          <Card style={{ backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 16px rgba(14, 165, 233, 0.35)',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>{initials}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>{displayName}</span>
                <span style={{ fontSize: 13, color: isDark ? colors.textSecondary : '#64748B' }}>
                  Primary Guardian • Band: {displayBandId}
                </span>
              </div>
            </div>
          </Card>

          {/* Section 1: Telemetry Stream Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.textSecondary,
                paddingLeft: 4,
              }}
            >
              Hardware &amp; Telemetry Stream
            </span>

            <Card style={{ padding: '8px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => handleModeChange('mock')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: transportMode === 'mock' ? (isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)') : 'transparent',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GlassIcon name="radio" size="sm" variant={transportMode === "mock" ? "cyan" : "slate"} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Mock 90s Loop</span>
                      <span style={{ fontSize: 12, color: isDark ? colors.textSecondary : '#64748B' }}>
                        Deterministic scenarios: calm, tachycardia, fall at t=40s
                      </span>
                    </div>
                  </div>
                  {transportMode === 'mock' && <Check size={18} color={isDark ? "#38BDF8" : "#0284C7"} strokeWidth={2.5} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('ble')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: transportMode === 'ble' ? (isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)') : 'transparent',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GlassIcon name="bluetooth" size="sm" variant={transportMode === "ble" ? "emerald" : "slate"} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Web Bluetooth (ESP32-C3)</span>
                      <span style={{ fontSize: 12, color: isDark ? colors.textSecondary : '#64748B' }}>
                        Direct GATT pairing to Seeed Studio XIAO hardware
                      </span>
                    </div>
                  </div>
                  {transportMode === 'ble' && <Check size={18} color={isDark ? "#38BDF8" : "#0284C7"} strokeWidth={2.5} />}
                </button>
              </div>
            </Card>

            {!isBleSupported && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 159, 10, 0.12)',
                  border: '1px solid rgba(255, 159, 10, 0.25)',
                }}
              >
                <span style={{ fontSize: 12, color: colors.irregular, lineHeight: '17px', display: 'block' }}>
                  <strong>iOS Note:</strong> Safari does not support Web Bluetooth. Use Chrome on Android, Windows, or Mac.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Original Application Feature Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.textSecondary,
                paddingLeft: 4,
              }}
            >
              Application Features
            </span>

            <Card style={{ padding: '4px 12px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link
                  href="/feel-lab"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GlassIcon name="sliders" size="md" variant="cyan" />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Feel Lab Calibration</span>
                  </div>
                  <ChevronRight size={18} color={isDark ? colors.textSecondary : '#64748B'} />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    setManualFallActive(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GlassIcon name="shield-alert" size="md" variant="rose" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Test Fall Alarm (30s Countdown)</span>
                      <span style={{ fontSize: 12, color: isDark ? colors.textSecondary : '#64748B' }}>
                        Trigger emergency verification &amp; slide rail
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color={isDark ? colors.textSecondary : '#64748B'} />
                </button>
              </div>
            </Card>
          </div>

          {/* Section: Log Out */}
          <div style={{ padding: '4px 0 24px 0' }}>
            <Card style={{ padding: '12px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsAccountOpen(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#FF453A',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <LogOut size={16} />
                Sign Out of VitalGuard C3
              </button>
            </Card>
          </div>
        </div>
      </Sheet>

      {/* ── Fall Alert Sheet Flow (Full-Screen Verification) ───── */}
      <FallAlertSheet
        open={status === 'fall' || manualFallActive}
        onConfirmSafe={() => {
          dismissFall();
          setManualFallActive(false);
        }}
      />
    </div>
  );
}
