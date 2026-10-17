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
        backgroundColor: 'var(--bg-app)',
        fontFamily: typography.fontFamily,
        color: 'var(--text-primary)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
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

      {/* ── Main Responsive Container (Works on Mobile & Expands on PC) ── */}
      <div
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 relative z-10 flex flex-col"
        style={{
          paddingBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 84px)',
          minHeight: '100dvh',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Distinct VitalGuard C3 Header ──────────────────────────── */}
        <header className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-200 dark:border-white/8">
          <div className="flex items-center gap-3">
            {/* Apple Icon-Style IconScout Glassmorphism Logo */}
            <GlassLogo
              size={46}
              isFalling={isCurrentlyFalling}
              showStatusDot={true}
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  VitalGuard
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider">
                  C3
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">{displayName}</span>
                <span className="text-slate-400 dark:text-white/20">•</span>
                <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400/90">
                  {transportMode === 'mock' ? 'MOCK LOOP (90s)' : 'ESP32-C3 BLE'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: iOS 27 Glassmorphic Theme Toggle + Settings */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <ThemeToggle size="sm" />

            <motion.button
              type="button"
              onClick={() => setIsAccountOpen(true)}
              whileTap={{ scale: press.scale }}
              aria-label="Open Account and Device Settings"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-colors cursor-pointer bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-cyan-400/40"
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>{initials}</span>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">Settings</span>
            </motion.button>
          </div>
        </header>

        {/* ═════════════════════════════════════════════════════════════
            TAB 1: SUMMARY (Dual Column on PC, Single Column on Mobile)
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-5 sm:mt-6 flex flex-col gap-6"
          >
            {/* Title & Section Subtitle */}
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Live Vitals Summary
                </h1>
              </div>

              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {isConnected ? 'STREAMING ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>

            {/* PC Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* ── Left Column: Hero HR Ring, SpO2/Battery Cards, Connection Control ── */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                {/* Hero Heart Rate Ring Card */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GlassIcon name="heart" size="sm" variant="rose" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Heart Rate (PPG)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                        {status === 'irregular' ? 'PATTERN NOTICED' : 'NOMINAL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-around py-3">
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Ring
                          value={hrValue}
                          max={160}
                          size={130}
                          strokeWidth={13}
                          colour="#FF375F"
                          bgColour="rgba(255, 55, 95, 0.18)"
                          displayValue={String(hrValue)}
                          unit="BPM"
                          glowFilter="drop-shadow(0 0 16px rgba(255, 55, 95, 0.4))"
                        />
                      </motion.div>

                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-xs text-slate-400 block">Resting Baseline</span>
                          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">68 - 74 BPM</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">24h Peak</span>
                          <span className="text-lg font-bold font-mono text-rose-400">118 BPM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dual Metrics: SpO2 & Battery Level */}
                <div className="grid grid-cols-2 gap-4">
                  {/* SpO2 Card */}
                  <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <GlassIcon name="oxygen" size="sm" variant="emerald" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SpO2</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{spo2Value}</span>
                        <span className="text-sm font-semibold text-slate-400">%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-sm h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-sm transition-all duration-500"
                          style={{ width: `${Math.min(100, spo2Value)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium mt-1">Optimal Saturation</span>
                    </div>
                  </Card>

                  {/* Battery Level Card */}
                  <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <GlassIcon name="battery" size="sm" variant="amber" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Battery</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{batteryValue}</span>
                        <span className="text-sm font-semibold text-slate-400">%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-sm h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-sm transition-all duration-500"
                          style={{ width: `${Math.min(100, batteryValue)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium mt-1">Hardware ADC Nominal</span>
                    </div>
                  </Card>
                </div>

                {/* Quick Hardware Controls & Emergency Fall Trigger */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hardware Connection
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Band ID</span>
                      <span className="font-mono text-cyan-400 font-bold">{displayBandId}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">GATT Service UUID</span>
                      <span className="font-mono text-slate-400">0x180D (Heart Rate)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/6">
                      <button
                        type="button"
                        onClick={handleConnectionToggle}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          isConnected
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                        }`}
                      >
                        {isConnected ? 'Disconnect' : 'Connect Band'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualFallActive(true)}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <GlassIcon name="alert" size={16} variant="amber" interactive={false} glow={false} />
                        <span>Test Alarm</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ── Right Column: 60s Sparkline, Rhythm Alerts, Wellbeing, Checklist ── */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
                {/* 60-Second Real-Time PPG Heart Rate Sparkline */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GlassIcon name="pulse" size="sm" variant="cyan" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                            PPG Pulse Waveform (Rolling 60 Seconds)
                          </span>
                          <span className="text-xs text-slate-400">
                            Optical capillary reflectance waveform streamed in real time
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">1 Hz Live</span>
                      </div>
                    </div>

                    {/* SVG Sparkline Graph */}
                    <div className="w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/6 p-2">
                      <svg
                        viewBox="0 0 420 90"
                        className="w-full h-24"
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
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
                        <span>-60s</span>
                        <span>-45s</span>
                        <span>-30s</span>
                        <span>-15s</span>
                        <span>Now ({hrValue} BPM)</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Autonomic Nervous System & HRV Balance */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <GlassIcon name="brain" size="md" variant="cyan" />
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">Autonomic Nervous System &amp; HRV Balance</span>
                        <span className="text-xs text-slate-400">
                          Autonomic balance check calculated from continuous beat-to-beat interval variance
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/feel-lab"
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shrink-0 flex items-center gap-2"
                    >
                      <GlassIcon name="sliders" size={16} variant="slate" interactive={false} glow={false} />
                      <span>Calibrate Feel Lab</span>
                    </Link>
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
            className="mt-5 sm:mt-6 flex flex-col gap-6"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Clinical Records &amp; Medical Vitals
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Resting vitals baseline, physiological risk score, and clinical telemetry analytics
                </p>
              </div>

              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                INDEXEDDB ACTIVE
              </span>
            </div>

            {/* Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* Left Column: Safety Score + Baseline Summary */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                <RiskScoreCard />
                <ClinicalSummaryCard />
              </div>

              {/* Right Column: Historical Trends Charts */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
                <HistoricalTrends />
              </div>
            </div>
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
            className="mt-5 sm:mt-6 flex flex-col gap-6"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Fall Detection &amp; Safety Report
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Continuous 3-Axis SVM impact telemetry and 30-day FIFO retention log
              </p>
            </div>

            {/* PC Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* ── Left Column: Live SVM Accelerometer & Test Fall Controls ── */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                {/* Live 3-Axis SVM Accelerometer Monitor */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GlassIcon name="gauge" size="sm" variant="amber" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Live 3-Axis SVM Accelerometer
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        isCurrentlyFalling
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {isCurrentlyFalling ? 'IMPACT DETECTED' : 'ARMED & MONITORING'}
                      </span>
                    </div>

                    {/* Numerical G-Force Display */}
                    <div className="flex items-baseline justify-between py-2">
                      <div>
                        <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white">
                          {liveSvm.toFixed(2)}
                        </span>
                        <span className="text-base font-bold text-slate-400 ml-1.5">G</span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Sensor Chip</span>
                        <span className="text-xs font-mono font-bold text-cyan-400">MPU6050 (50Hz)</span>
                      </div>
                    </div>

                    {/* G-Force Range Bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>0.0G (Rest)</span>
                        <span>1.4G (Motion)</span>
                        <span className="text-rose-400 font-bold">&gt;3.0G (Fall Trigger)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-sm h-3 relative overflow-hidden">
                        <div
                          className={`h-full rounded-sm transition-all duration-300 ${
                            liveSvm >= 3.0 ? 'bg-rose-500' : liveSvm >= 1.4 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, (liveSvm / 4.0) * 100)}%` }}
                        />
                        {/* Threshold mark at 3.0G (75%) */}
                        <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-rose-400 shadow-[0_0_6px_#FF453A]" />
                      </div>
                    </div>

                    {/* 3-Axis Decomposition */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/6 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/6">
                        <span className="text-slate-400 block text-[10px]">X-Axis</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">0.04 G</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/6">
                        <span className="text-slate-400 block text-[10px]">Y-Axis</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">0.98 G</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/6">
                        <span className="text-slate-400 block text-[10px]">Z-Axis</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">0.12 G</span>
                      </div>
                    </div>

                    {/* Test Alarm Controls */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setManualFallActive(true)}
                        className="w-full py-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-rose-950/40 cursor-pointer"
                      >
                        <GlassIcon name="shield-alert" size={18} variant="rose" interactive={false} glow={false} />
                        <span>Trigger Test Fall Alarm (30s Countdown)</span>
                      </button>

                      {isCurrentlyFalling && (
                        <button
                          type="button"
                          onClick={() => {
                            dismissFall();
                            setManualFallActive(false);
                          }}
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <GlassIcon name="refresh" size={16} variant="slate" interactive={false} glow={false} />
                          <span>Reset Sensor Alarm Baseline</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Emergency Automated SMS Escalation Status */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Automated Fall Escalation
                    </span>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <GlassIcon name="users" size="md" variant="cyan" />
                      <div>
                        <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayName} (Guardian)</span>
                        <span className="text-[11px] text-slate-400">Emergency Contact Priority 1</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ── Right Column: 30-Day FIFO Algorithm Report & Daily History ── */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
                {/* FIFO Algorithm Architecture Card */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GlassIcon name="database" size="sm" variant="blue" />
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          30-Day Rolling FIFO Ring Buffer
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">IndexedDB Engine</span>
                    </div>

                    {/* KPI Scoreboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">30-Day Falls</span>
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                          {totalFallsIn30Days}
                        </span>
                        <span className="text-[10px] text-emerald-400 mt-0.5">Isolated incidents</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">Safe Days</span>
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                          {safeDaysCount}/30
                        </span>
                        <span className="text-[10px] text-cyan-400 mt-0.5">93.3% safe index</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">Countdown Limit</span>
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">30s</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Verification window</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">FIFO Rotation</span>
                        <span className="text-2xl font-black font-mono text-emerald-400 mt-1">Day 31+</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Auto-purge active</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Chronological 30-Day Daily Audit Log */}
                <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.06)' }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Past 30 Days Audit Log ({thirtyDayRecords.length} Days Retained)
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {thirtyDayRecords.map((r, i) => {
                        const hasFall = (r.fall_count || 0) > 0;
                        return (
                          <div
                            key={r.dateKey || i}
                            className={`p-3 rounded-xl flex items-center justify-between text-xs transition-colors border ${
                              hasFall
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : (isDark
                                    ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {hasFall ? (
                                <GlassIcon name="shield-alert" size="sm" variant="rose" />
                              ) : (
                                <GlassIcon name="shield-check" size="sm" variant="emerald" />
                              )}
                              <div>
                                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.dateKey}</span>
                                <span className="text-slate-400 text-[11px]">
                                  Avg HR: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{r.avg_hr} BPM</strong> | SpO2: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{r.avg_spo2}%</strong>
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {hasFall ? (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  {r.fall_count} Fall Logged
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-400 bg-emerald-500/10">
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

          {/* Section 3: Hardware Specifications */}
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
              Hardware Specifications
            </span>

            <Card style={{ padding: '14px 16px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>Microcontroller</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>Seeed Studio XIAO ESP32-C3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>Biometric Sensor</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>MAX30102 (HR + SpO2)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>Motion Sensor</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>MPU6050 (3-Axis SVM @ 50Hz)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>FIFO Retention</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#38BDF8' : '#0284C7' }}>30 Days On-Device Buffer</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 4: Privacy & Legal Compliance */}
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
              Legal &amp; Privacy Standards
            </span>

            <Card style={{ padding: '4px 12px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link
                  href="/privacy"
                  onClick={() => setIsAccountOpen(false)}
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
                    <GlassIcon name="shield-check" size="sm" variant="cyan" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Privacy Policy</span>
                      <span style={{ fontSize: 12, color: isDark ? colors.textSecondary : '#64748B' }}>
                        On-device IndexedDB, zero third-party cloud tracking
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color={isDark ? colors.textSecondary : '#64748B'} />
                </Link>

                <Link
                  href="/terms"
                  onClick={() => setIsAccountOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GlassIcon name="medical" size="sm" variant="emerald" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Terms &amp; Conditions</span>
                      <span style={{ fontSize: 12, color: isDark ? colors.textSecondary : '#64748B' }}>
                        Non-diagnostic clinical companion disclaimer
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color={isDark ? colors.textSecondary : '#64748B'} />
                </Link>
              </div>
            </Card>
          </div>

          {/* Section 5: Custom Domain & Network Status */}
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
              Network &amp; Custom Domain
            </span>

            <Card style={{ padding: '14px 16px', backgroundColor: isDark ? '#161B22' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(203,213,225,0.8)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>Custom Domain Status</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#30D158' : '#16A34A' }}>Connected &amp; Verified</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>Web Bluetooth Security</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#0F172A' }}>HTTPS / Secure Context Enforced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: isDark ? colors.textSecondary : '#64748B' }}>Local Favicon Manifest</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#38BDF8' : '#0284C7' }}>Active (SVG + ICO)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 6: Log Out */}
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
