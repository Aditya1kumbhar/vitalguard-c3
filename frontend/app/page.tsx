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
  ShieldAlert,
  FileText,
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
import {
  colors,
  dimensions,
  layout,
  press,
  spring,
  typography,
} from './design/motion.tokens';

// ── Browse Category Contract ──────────────────────────────────────────
interface BrowseCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgGradient: string;
  accentColor: string;
  liveMetric: string;
  liveLabel: string;
  statusBadge: string;
  baseline: string;
  sensorInfo: string;
  clinicalExplanation: string;
  recommendations: string[];
}

export default function VitalGuardCompanionDashboard() {
  const { guardianName, bandId, logout } = useAuth();

  // Navigation tab state: 'summary' | 'browse' | 'falls'
  const [activeTab, setActiveTab] = useState<'summary' | 'browse' | 'falls'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [transportMode, setTransportMode] = useState<'mock' | 'ble'>('mock');
  const [isBleSupported, setIsBleSupported] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<BrowseCategory | null>(null);
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

  // ── Curated Health Categories for Browse & One-Tap Popup ─────────────
  const healthCategories: BrowseCategory[] = useMemo(
    () => [
      {
        id: 'activity',
        title: 'Activity & Motion',
        subtitle: 'Continuous 3-axis IMU kinematics',
        icon: <Flame size={28} color="#FF9500" />,
        bgGradient: 'linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 59, 48, 0.05) 100%)',
        accentColor: '#FF9500',
        liveMetric: `${liveSvm.toFixed(2)} G`,
        liveLabel: 'Real-Time SVM Acceleration',
        statusBadge: isCurrentlyFalling ? 'HIGH IMPACT' : 'Nominal Kinetic Baseline',
        baseline: '0.80 - 1.60 G daily baseline variance',
        sensorInfo:
          'MPU6050 6-Axis Inertial Measurement Unit sampled at 50Hz over I2C (0x68). Calculates continuous Signal Vector Magnitude (SVM = √(ax² + ay² + az²) / 9.8) to distinguish sedentary rest from ambulatory movement.',
        clinicalExplanation:
          'Continuous kinetic tracking measures physical exertion, posture shifts, and involuntary acceleration spikes. A sudden acceleration spike above 3.0G coupled with post-impact stillness signifies an incapacitating fall.',
        recommendations: [
          'Target at least 30 minutes of low-impact ambulatory movement daily.',
          'Ensure the wrist strap is fastened snugly 1 finger width above the wrist bone.',
          'Sudden changes in gait symmetry can indicate fatigue or musculoskeletal strain.',
        ],
      },
      {
        id: 'body',
        title: 'Body Measurements',
        subtitle: 'Epidermal thermometry & posture',
        icon: <User size={28} color="#AF52DE" />,
        bgGradient: 'linear-gradient(135deg, rgba(175, 82, 222, 0.15) 0%, rgba(88, 86, 214, 0.05) 100%)',
        accentColor: '#AF52DE',
        liveMetric: '36.6 °C',
        liveLabel: 'Wrist Surface Temperature',
        statusBadge: 'Thermal Homeostasis',
        baseline: '36.1 °C - 37.2 °C circadian range',
        sensorInfo:
          'MAX30102 on-die calibrated temperature sensor with ±0.5°C clinical accuracy. Monitors surface thermometry and ambient delta.',
        clinicalExplanation:
          'Peripheral skin temperature reflects circadian rhythm transitions, peripheral perfusion, and thermal regulation. Nighttime temperature dips correlate directly with deep sleep cycles.',
        recommendations: [
          'Consistent wrist temperature confirms active, snug sensor skin contact.',
          'Sudden cold drops can indicate peripheral vasoconstriction or improper sensor placement.',
          'Track morning versus evening temperature variance for circadian health assessment.',
        ],
      },
      {
        id: 'heart',
        title: 'Heart & Cardiovascular',
        subtitle: 'Optical PPG pulse rate & rhythm',
        icon: <Heart size={28} color="#FF375F" fill="#FF375F" />,
        bgGradient: 'linear-gradient(135deg, rgba(255, 55, 95, 0.15) 0%, rgba(255, 69, 58, 0.05) 100%)',
        accentColor: '#FF375F',
        liveMetric: `${hrValue} BPM`,
        liveLabel: 'Live Cardiovascular Pulse',
        statusBadge: status === 'irregular' ? 'Irregular Pattern Noticed' : 'Nominal Sinus Rhythm',
        baseline: '60 - 100 BPM resting adult standard',
        sensorInfo:
          'MAX30102 high-sensitivity reflective photoplethysmography (PPG). Uses 525nm Green LED absorption through microvascular capillary beds with 18-bit ADC resolution.',
        clinicalExplanation:
          'Measures pulsatile blood flow volume in wrist arterioles. Real-time peak-to-peak interval algorithms monitor heart rate variability (HRV) and flag abnormal pattern spikes without diagnostic over-reach.',
        recommendations: [
          'Resting heart rates between 60 and 80 BPM indicate healthy cardiovascular baseline.',
          'Elevated resting pulse across consecutive hours may warrant rest and hydration.',
          'Consult a physician if you notice prolonged palpitations or dizziness.',
        ],
      },
      {
        id: 'respiratory',
        title: 'Respiratory & Oxygenation',
        subtitle: 'Dual-wavelength pulse oximetry',
        icon: <Wind size={28} color="#30D158" />,
        bgGradient: 'linear-gradient(135deg, rgba(48, 209, 88, 0.15) 0%, rgba(52, 199, 89, 0.05) 100%)',
        accentColor: '#30D158',
        liveMetric: `${spo2Value}%`,
        liveLabel: 'Functional SpO2 Saturation',
        statusBadge: spo2Value >= 95 ? 'Optimal Saturation' : 'Mild Desaturation Notice',
        baseline: '95% - 100% room air standard',
        sensorInfo:
          'Dual Red (660nm) and Infrared (880nm) LED ratio absorption (R-curve). Compares oxygenated vs deoxygenated hemoglobin absorption.',
        clinicalExplanation:
          'Peripheral capillary oxygen saturation (SpO2) measures the fraction of oxygen-saturated hemoglobin relative to total hemoglobin in arterial blood. Values below 93% flag possible hypoxemia.',
        recommendations: [
          'Values between 95% and 100% are standard at sea level to moderate altitudes.',
          'Avoid excessive wrist movement during oximetry measurement for optimal SNR.',
          'If readings fall below 92% persistently, verify sensor snugness and seek medical guidance.',
        ],
      },
      {
        id: 'mobility',
        title: 'Mobility & Gait Stability',
        subtitle: 'Cadence & stumble vulnerability',
        icon: <MoveHorizontal size={28} color="#0EA5E9" />,
        bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(2, 132, 199, 0.05) 100%)',
        accentColor: '#0EA5E9',
        liveMetric: '1.18 m/s',
        liveLabel: 'Estimated Gait Velocity',
        statusBadge: 'High Stability Baseline',
        baseline: 'Gait speed > 1.0 m/s indicates low fall risk',
        sensorInfo:
          '3-axis gyroscope and accelerometer data analyzed with a kinematic cadence algorithm to measure gait symmetry, step regularity, and deceleration smoothness.',
        clinicalExplanation:
          'Gait speed and stride variability are primary clinical markers for fall risk in older adults. Steady cadences correlate with low fall probability.',
        recommendations: [
          'Keep home hallways illuminated and free from loose throw rugs.',
          'Practice balance exercises like single-leg stands or gentle tai chi.',
          'Use supportive footwear with non-slip soles during outdoor walking.',
        ],
      },
      {
        id: 'sleep',
        title: 'Sleep & Circadian Baseline',
        subtitle: 'Overnight resting recovery',
        icon: <Sun size={28} color="#6366F1" />,
        bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)',
        accentColor: '#6366F1',
        liveMetric: '7h 24m',
        liveLabel: 'Rest Window Duration',
        statusBadge: 'Restorative Nocturnal Dip',
        baseline: '7 - 9 hours recommended nightly rest',
        sensorInfo:
          'Actigraphy combined with photoplethysmography pulse rate dipping (-14%) tracks periods of sustained nocturnal immobility.',
        clinicalExplanation:
          'A healthy sleep cycle features a 10-20% drop in heart rate (nocturnal dipping), reflecting parasympathetic autonomic recovery and tissue restoration.',
        recommendations: [
          'Maintain consistent bedtimes and wake times across weekdays and weekends.',
          'Avoid heavy caffeine consumption within 6 hours of scheduled sleep.',
          'Ensure the wristband is comfortable and charged before turning in for the night.',
        ],
      },
    ],
    [hrValue, spo2Value, liveSvm, isCurrentlyFalling, status]
  );

  const filteredCategories = healthCategories.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        backgroundColor: '#0A0D12',
        fontFamily: typography.fontFamily,
        color: '#FFFFFF',
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
        <header className="flex items-center justify-between pb-4 sm:pb-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            {/* Live telemetry pulsating beacon */}
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isCurrentlyFalling ? 'bg-rose-400' : 'bg-emerald-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  isCurrentlyFalling ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  VitalGuard
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider">
                  C3
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{displayName}</span>
                <span className="text-white/20">•</span>
                <span className="font-mono text-[11px] text-cyan-400/90">
                  {transportMode === 'mock' ? 'MOCK LOOP (90s)' : 'ESP32-C3 BLE'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Profile Avatar AK button with cyan glow border */}
          <motion.button
            type="button"
            onClick={() => setIsAccountOpen(true)}
            whileTap={{ scale: press.scale }}
            aria-label="Open Account and Device Settings"
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/40 transition-colors cursor-pointer"
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>{initials}</span>
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Settings</span>
          </motion.button>
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
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Live Vitals Summary
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Continuous wearable telemetry streamed over Web Bluetooth GATT
                </p>
              </div>

              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {isConnected ? 'STREAMING ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>

            {/* PC Responsive 12-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* ── Left Column: Hero HR Ring, SpO2/Battery Cards, Connection Control ── */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                {/* Hero Heart Rate Ring Card */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart size={18} color="#FF375F" fill="#FF375F" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
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
                          <span className="text-lg font-bold font-mono text-white">68 - 74 BPM</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">24h Peak</span>
                          <span className="text-lg font-bold font-mono text-rose-400">118 BPM</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/6 flex items-center justify-between text-xs text-slate-400">
                      <span>Sampling: 100 Hz MAX30102</span>
                      <span className="text-emerald-400 font-medium">99.8% Signal Quality</span>
                    </div>
                  </div>
                </Card>

                {/* Dual Metrics: SpO2 & Battery Level */}
                <div className="grid grid-cols-2 gap-4">
                  {/* SpO2 Card */}
                  <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Wind size={16} color="#30D158" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SpO2</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold font-mono text-white">{spo2Value}</span>
                        <span className="text-sm font-semibold text-slate-400">%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, spo2Value)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium mt-1">Optimal Saturation</span>
                    </div>
                  </Card>

                  {/* Battery Level Card */}
                  <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Cpu size={16} color="#FFD60A" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Battery</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold font-mono text-white">{batteryValue}</span>
                        <span className="text-sm font-semibold text-slate-400">%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, batteryValue)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium mt-1">~14 hrs Remaining</span>
                    </div>
                  </Card>
                </div>

                {/* Quick Hardware Controls & Emergency Fall Trigger */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
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
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap size={14} />
                        <span>Test Alarm</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ── Right Column: 60s Sparkline, Rhythm Alerts, Wellbeing, Checklist ── */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
                {/* 60-Second Real-Time PPG Heart Rate Sparkline */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                          PPG Pulse Waveform (Rolling 60 Seconds)
                        </span>
                        <span className="text-xs text-slate-400">
                          Optical capillary reflectance waveform streamed in real time
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">1 Hz Live</span>
                      </div>
                    </div>

                    {/* SVG Sparkline Graph */}
                    <div className="w-full overflow-hidden rounded-xl bg-black/40 border border-white/6 p-2">
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

                {/* Notifications & Rhythm Flag Card */}
                {!dismissedCards['notifications'] && (
                  <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={16} color="#0EA5E9" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Clinical Rhythm Notification
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDismissedCards((prev) => ({ ...prev, notifications: true }))}
                          className="text-slate-400 hover:text-white p-1 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-white">
                            {status === 'irregular'
                              ? 'Irregular Rhythm Pattern Noticed'
                              : 'Nominal Cardiac Rhythm Active'}
                          </span>
                          <span className="text-xs text-slate-300 leading-relaxed">
                            {status === 'irregular'
                              ? 'The wristband noticed an elevated pulse variation during the last evaluation epoch. No diagnostic claim is made.'
                              : 'Continuous pulse checks show steady beat-to-beat intervals within normal baseline.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Mental Wellbeing & Cognitive Readiness */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                        <Brain size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">Mental Wellbeing &amp; Balance</span>
                        <span className="text-xs text-slate-400">
                          Autonomic balance check based on HRV and resting stability
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/feel-lab"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Sliders size={14} />
                      <span>Calibrate Feel Lab</span>
                    </Link>
                  </div>
                </Card>

                {/* Daily Checklist */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Companion Safety Checklist
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/4 border border-white/6 text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className="text-slate-300 font-medium">Wearable Wristband Contact Verified</span>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/4 border border-white/6 text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className="text-slate-300 font-medium">Automated Fall Dispatch Escalation</span>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold">ARMED (30s)</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/4 border border-white/6 text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-cyan-400" />
                          <span className="text-slate-300 font-medium">30-Day FIFO Local Rolling Buffer</span>
                        </div>
                        <span className="text-cyan-400 font-mono font-bold">30/30 DAYS</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 2: BROWSE (Curated Categories with One-Tap Popup Windows)
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'browse' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-5 sm:mt-6 flex flex-col gap-6"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Biometric Categories
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tap any category to open one-tap scrollable clinical sensor telemetry &amp; science
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#12161D] border border-white/10 max-w-md">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search health categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-slate-500"
              />
              <Mic size={18} className="text-slate-500" />
            </div>

            {/* Responsive Category Grid: 2 on mobile, 3 on tablet, 4 on PC */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredCategories.map((cat) => (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="p-5 rounded-2xl cursor-pointer border border-white/8 hover:border-cyan-500/30 transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden"
                  style={{
                    background: cat.bgGradient,
                    backgroundColor: '#12161D',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.accentColor}20` }}
                    >
                      {cat.icon}
                    </div>
                    <ArrowUpRight size={18} className="text-slate-500" />
                  </div>

                  <div className="mt-4 flex flex-col">
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: cat.accentColor }}>
                      {cat.liveLabel}
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
                      {cat.liveMetric}
                    </span>
                    <span className="text-sm font-bold text-slate-200 mt-1">{cat.title}</span>
                  </div>
                </motion.div>
              ))}
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
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
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
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge size={18} color="#FF9F0A" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
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
                        <span className="text-4xl sm:text-5xl font-black font-mono text-white">
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
                      <div className="w-full bg-white/10 rounded-full h-3 relative overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
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
                      <div className="p-2 rounded-lg bg-black/30 border border-white/6">
                        <span className="text-slate-400 block text-[10px]">X-Axis</span>
                        <span className="font-mono font-bold text-white">0.04 G</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30 border border-white/6">
                        <span className="text-slate-400 block text-[10px]">Y-Axis</span>
                        <span className="font-mono font-bold text-white">0.98 G</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30 border border-white/6">
                        <span className="text-slate-400 block text-[10px]">Z-Axis</span>
                        <span className="font-mono font-bold text-white">0.12 G</span>
                      </div>
                    </div>

                    {/* Test Alarm Controls */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setManualFallActive(true)}
                        className="w-full py-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
                      >
                        <ShieldAlert size={16} />
                        <span>Trigger Test Fall Alarm (30s Countdown)</span>
                      </button>

                      {isCurrentlyFalling && (
                        <button
                          type="button"
                          onClick={() => {
                            dismissFall();
                            setManualFallActive(false);
                          }}
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={14} />
                          <span>Reset Sensor Alarm Baseline</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Emergency Automated SMS Escalation Status */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Automated Fall Escalation
                    </span>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6">
                      <Users size={20} className="text-cyan-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">{displayName} (Guardian)</span>
                        <span className="text-[11px] text-slate-400">Emergency Contact Priority 1</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed m-0">
                      If impact exceeds 3.0G and the slide rail is not verified within 30 seconds, an automated SMS alert and GPS coordinates will be dispatched.
                    </p>
                  </div>
                </Card>
              </div>

              {/* ── Right Column: 30-Day FIFO Algorithm Report & Daily History ── */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
                {/* FIFO Algorithm Architecture Card */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database size={16} color="#0EA5E9" />
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          30-Day Rolling FIFO Ring Buffer
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">IndexedDB Engine</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed m-0">
                      VitalGuard C3 operates an on-device First-In, First-Out (FIFO) retention window. As daily telemetry frames arrive, records older than 30 days are automatically pruned from local IndexedDB storage.
                    </p>

                    {/* KPI Scoreboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">30-Day Falls</span>
                        <span className="text-2xl font-black font-mono text-white mt-1">
                          {totalFallsIn30Days}
                        </span>
                        <span className="text-[10px] text-emerald-400 mt-0.5">Isolated incidents</span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">Safe Days</span>
                        <span className="text-2xl font-black font-mono text-white mt-1">
                          {safeDaysCount}/30
                        </span>
                        <span className="text-[10px] text-cyan-400 mt-0.5">93.3% safe index</span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">Mean Reaction</span>
                        <span className="text-2xl font-black font-mono text-white mt-1">14s</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">&lt;30s safe threshold</span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/6 flex flex-col">
                        <span className="text-[11px] text-slate-400">FIFO Rotation</span>
                        <span className="text-2xl font-black font-mono text-emerald-400 mt-1">Day 31+</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Auto-purge active</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Chronological 30-Day Daily Audit Log */}
                <Card style={{ backgroundColor: '#12161D', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Past 30 Days Audit Log ({thirtyDayRecords.length} Days Retained)
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">Chronological (Newest First)</span>
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
                                : 'bg-white/3 border-white/6 hover:bg-white/6'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  hasFall ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'
                                }`}
                              >
                                {hasFall ? <AlertTriangle size={16} /> : <Check size={16} />}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{r.dateKey}</span>
                                <span className="text-slate-400 text-[11px]">
                                  Avg HR: <strong className="text-white">{r.avg_hr} BPM</strong> | SpO2: <strong className="text-white">{r.avg_spo2}%</strong>
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
          FLOATING BOTTOM NAVBAR (FIXED ON SCREEN — NEVER SCROLLS AWAY)
         ═════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Bottom Navigation Dock"
        style={{
          position: 'fixed',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: 'calc(100% - 32px)',
          maxWidth: 440,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 22, 29, 0.92)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(56, 189, 248, 0.22)',
            borderRadius: 9999,
            padding: '6px 8px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(14, 165, 233, 0.15)',
          }}
        >
          {/* Tab 1: Summary */}
          <motion.button
            type="button"
            onClick={() => setActiveTab('summary')}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: activeTab === 'summary' ? 'rgba(14, 165, 233, 0.25)' : 'transparent',
              color: activeTab === 'summary' ? '#38BDF8' : '#8E8E93',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <Activity size={17} color={activeTab === 'summary' ? '#38BDF8' : '#8E8E93'} />
            <span>Summary</span>
          </motion.button>

          {/* Tab 2: Browse */}
          <motion.button
            type="button"
            onClick={() => setActiveTab('browse')}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: activeTab === 'browse' ? 'rgba(14, 165, 233, 0.25)' : 'transparent',
              color: activeTab === 'browse' ? '#38BDF8' : '#8E8E93',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <LayoutGrid size={17} color={activeTab === 'browse' ? '#38BDF8' : '#8E8E93'} />
            <span>Browse</span>
          </motion.button>

          {/* Tab 3: Fall Safety (Replaced Sharing) */}
          <motion.button
            type="button"
            onClick={() => setActiveTab('falls')}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: activeTab === 'falls' ? 'rgba(255, 69, 58, 0.25)' : 'transparent',
              color: activeTab === 'falls' ? '#FF453A' : '#8E8E93',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <ShieldAlert size={17} color={activeTab === 'falls' ? '#FF453A' : '#8E8E93'} />
            <span>Fall Safety</span>
          </motion.button>
        </div>
      </nav>

      {/* ═════════════════════════════════════════════════════════════
          ONE-TAP POPUP WINDOW FOR BROWSE CATEGORIES
         ═════════════════════════════════════════════════════════════ */}
      <Sheet
        open={Boolean(selectedCategory)}
        onOpenChange={(open) => {
          if (!open) setSelectedCategory(null);
        }}
        title={selectedCategory?.title || 'Category Details'}
      >
        {selectedCategory && (
          <div className="flex flex-col gap-4 pt-2">
            {/* Header with Done button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedCategory.accentColor}25` }}
                >
                  {selectedCategory.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{selectedCategory.title}</h3>
                  <span className="text-xs text-slate-400">{selectedCategory.subtitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1"
              >
                Done
              </button>
            </div>

            {/* Card 1: Real-Time Sensor Telemetry */}
            <Card style={{ backgroundColor: '#161B22', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  {selectedCategory.liveLabel}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-white">
                    {selectedCategory.liveMetric}
                  </span>
                  <span
                    className="text-xs font-bold font-mono px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${selectedCategory.accentColor}20`,
                      color: selectedCategory.accentColor,
                    }}
                  >
                    {selectedCategory.statusBadge}
                  </span>
                </div>
              </div>
            </Card>

            {/* Card 2: 30-Day Clinical Baseline */}
            <Card style={{ backgroundColor: '#161B22', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  30-Day Reference Baseline
                </span>
                <span className="text-sm font-bold text-white">{selectedCategory.baseline}</span>
              </div>
            </Card>

            {/* Card 3: Sensor Hardware Mechanism */}
            <Card style={{ backgroundColor: '#161B22', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Sensor Hardware &amp; Methodology
                </span>
                <p className="text-xs text-slate-300 leading-relaxed m-0">
                  {selectedCategory.sensorInfo}
                </p>
              </div>
            </Card>

            {/* Card 4: Clinical Guidance & Recommendations */}
            <Card style={{ backgroundColor: '#161B22', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Clinical Recommendations
                </span>
                <div className="space-y-1.5">
                  {selectedCategory.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Action: Open Historical Records */}
            <Link
              href="/records"
              onClick={() => setSelectedCategory(null)}
              className="w-full py-3 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              <span>View 30-Day Historical Trends &amp; Baseline</span>
            </Link>
          </div>
        )}
      </Sheet>

      {/* ═════════════════════════════════════════════════════════════
          ACCOUNT & DEVICE APPLICATION SETTINGS SHEET
         ═════════════════════════════════════════════════════════════ */}
      <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen} title="Account & Application Settings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 4 }}>
          {/* Top Bar: Title & Done Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>VitalGuard Profile</span>
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
          <Card style={{ backgroundColor: '#161B22' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: dimensions.pillRadius,
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #6366F1 100%)',
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
                <span style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF' }}>{displayName}</span>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>
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

            <Card style={{ padding: '8px', backgroundColor: '#161B22' }}>
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
                    backgroundColor: transportMode === 'mock' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Radio size={18} color={transportMode === 'mock' ? '#38BDF8' : colors.textSecondary} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Mock 90s Loop</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Deterministic scenarios: calm, tachycardia, fall at t=40s
                      </span>
                    </div>
                  </div>
                  {transportMode === 'mock' && <Check size={18} color="#38BDF8" strokeWidth={2.5} />}
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
                    backgroundColor: transportMode === 'ble' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Bluetooth size={18} color={transportMode === 'ble' ? '#30D158' : colors.textSecondary} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Web Bluetooth (ESP32-C3)</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Direct GATT pairing to Seeed Studio XIAO hardware
                      </span>
                    </div>
                  </div>
                  {transportMode === 'ble' && <Check size={18} color="#38BDF8" strokeWidth={2.5} />}
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

            <Card style={{ padding: '4px 12px', backgroundColor: '#161B22' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link
                  href="/records"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#30D158',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} color="#000000" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Clinical Records &amp; Trends</span>
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </Link>

                <Link
                  href="/feel-lab"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#5E5CE6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sliders size={18} color="#FFFFFF" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Feel Lab Calibration</span>
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} />
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
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#FF453A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShieldAlert size={18} color="#FFFFFF" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Test Fall Alarm (30s Countdown)</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Trigger emergency verification &amp; slide rail
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} />
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

            <Card style={{ padding: '14px 16px', backgroundColor: '#161B22' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: colors.textSecondary }}>Microcontroller</span>
                  <span style={{ fontWeight: 600 }}>Seeed Studio XIAO ESP32-C3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: colors.textSecondary }}>Biometric Sensor</span>
                  <span style={{ fontWeight: 600 }}>MAX30102 (HR + SpO2)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: colors.textSecondary }}>Motion Sensor</span>
                  <span style={{ fontWeight: 600 }}>MPU6050 (3-Axis SVM @ 50Hz)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: colors.textSecondary }}>FIFO Retention</span>
                  <span style={{ fontWeight: 600, color: '#38BDF8' }}>30 Days On-Device Buffer</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 4: Log Out */}
          <div style={{ padding: '4px 0 24px 0' }}>
            <Card style={{ padding: '12px', backgroundColor: '#161B22' }}>
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
