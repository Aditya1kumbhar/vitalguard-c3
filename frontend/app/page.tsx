'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Bluetooth, 
  Wifi, 
  RotateCcw, 
  Zap, 
  Radio, 
  Calendar,
  BatteryFull,
  Cpu,
  PersonStanding,
  CheckCircle2
} from 'lucide-react';
import { useVitalStream } from '../hooks/useVitalStream';
import { playHaptic } from './utils/haptics';
import DeviceSpecsModal from './components/DeviceSpecsModal';
import AccelWaveform from './components/AccelWaveform';
import RiskScoreCard from './components/RiskScoreCard';
import ClinicalSummaryCard from './components/ClinicalSummaryCard';
import HistoricalTrends from './components/HistoricalTrends';
import AlertHistory from './components/AlertHistory';
import type { TelemetryPacket } from './hooks/useTelemetrySocket';
import {
  DailyRecord,
  getDailyRecords,
  saveBulkDailyRecordsAndPrune,
  seedInitialDataIfEmpty,
} from './utils/localDatabase';

export default function VitalGuardDashboard() {
  const { data, mode, isAlertActive, connectBLE, connectWebSocket, dismissAlert } = useVitalStream();
  const [records, setRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'RECORDS'>('LIVE');
  const [showSpecs, setShowSpecs] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const getApiUrl = (endpoint: string) => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')}${endpoint}`;
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:8000${endpoint}`;
  };

  useEffect(() => {
    async function initRecords() {
      try {
        const res = await fetch(getApiUrl('/api/records'));
        if (res.ok) {
          const d = await res.json();
          setRecords(d);
          // Automatically sync into mobile browser IndexedDB with Day 31+ purge
          const dbRecords: DailyRecord[] = d.map((r: any) => ({
            dateKey: new Date(r.timestamp * 1000).toISOString().split('T')[0],
            avg_hr: r.avg_heart_rate,
            avg_spo2: r.avg_spo2,
            fall_count: r.fall_incidents ?? 0,
            timestamp: r.timestamp * 1000,
          }));
          await saveBulkDailyRecordsAndPrune(dbRecords);
          return;
        }
      } catch {
        // Edge/Bridge offline — proceed to IndexedDB fallback
      }

      // Offline-first fallback: Load directly from phone's local IndexedDB
      try {
        let cached = await getDailyRecords(30);
        if (cached.length === 0) {
          cached = await seedInitialDataIfEmpty();
        }
        setRecords(
          cached.map((r) => ({
            day: r.dateKey,
            timestamp: Math.floor(r.timestamp / 1000),
            avg_heart_rate: r.avg_hr,
            avg_spo2: r.avg_spo2,
            fall_incidents: r.fall_count,
          }))
        );
      } catch (err) {
        console.warn('IndexedDB fallback:', err);
      }
    }

    initRecords();
  }, []);

  const triggerMockFall = async () => {
    playHaptic('warning');
    setSimulating(true);
    try {
      await fetch(getApiUrl('/api/trigger-fall'), { method: 'POST' });
    } catch {
      // Backend offline fallback
    } finally {
      setTimeout(() => setSimulating(false), 800);
    }
  };

  const resetMockFall = () => {
    playHaptic('pop');
    dismissAlert();
    fetch(getApiUrl('/api/reset-fall'), { method: 'POST' }).catch(() => {});
  };

  // Real-time pulse interval in seconds for organic cardiovascular rhythm
  const hr = data.heart_rate || 72;
  const pulseSpeed = hr > 0 ? (60 / hr).toFixed(2) + 's' : '0.85s';
  const isConnected = mode !== 'DISCONNECTED';
  const isFall = data.fall_detected || data.status === 'CRITICAL_FALL';
  const isMoving = (data.svm ?? (data.accel_magnitude / 9.8)) >= 1.4 && !isFall;

  // Construct telemetry packet for 3-axis AccelWaveform
  const telemetryPacket: TelemetryPacket = {
    heart_rate: data.heart_rate,
    spo2: data.spo2,
    body_temp: 36.6,
    accel_x: data.accel_x ?? 0.02,
    accel_y: data.accel_y ?? 1.0,
    accel_z: data.accel_z ?? 0.02,
    svm: data.svm ?? Number((data.accel_magnitude / 9.8).toFixed(2)),
    fall_detected: data.fall_detected,
    stage: data.status,
    timestamp: new Date(data.timestamp).toISOString(),
  };

  return (
    <main className="min-h-[100dvh] overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-between">
      <div className="flex-1 w-full max-w-xl sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-3.5 sm:p-5 md:p-6 lg:p-8 responsive-adaptive flex flex-col gap-4 sm:gap-6">
        
        {/* Dynamic Island Capsule Header */}
        <header className="dynamic-island rounded-3xl p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shadow-sm">
              <Activity className="w-5 h-5" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                VitalGuard <span className="text-sky-600 font-extrabold">C3</span>
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Device .1 • Room 204
              </p>
            </div>
          </div>

          {/* Connection Mode Toggles & Specs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                playHaptic('pop');
                connectBLE();
              }}
              className={`spring-btn px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                mode === 'BLE'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
              }`}
              title="Connect via Bluetooth"
            >
              <Bluetooth className={`w-3.5 h-3.5 ${mode === 'BLE' ? 'text-white' : 'text-blue-600'}`} />
              <span className="hidden sm:inline">Bluetooth</span>
            </button>

            <button
              onClick={() => {
                playHaptic('pop');
                connectWebSocket();
              }}
              className={`spring-btn px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                mode === 'WEBSOCKET'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
              }`}
              title="Connect via Wi-Fi"
            >
              <Wifi className={`w-3.5 h-3.5 ${mode === 'WEBSOCKET' ? 'text-white' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">Wi-Fi</span>
            </button>

            <button
              onClick={() => {
                playHaptic('pop');
                setShowSpecs(true);
              }}
              className="spring-btn p-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs"
              title="Device Specs"
              aria-label="Device Specs"
            >
              <Cpu className="w-4 h-4 text-sky-600" />
            </button>
          </div>
        </header>

        {/* System Specs Modal */}
        <DeviceSpecsModal open={showSpecs} onClose={() => setShowSpecs(false)} />

        {/* Navigation Switcher */}
        <nav aria-label="Dashboard Tabs" className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => {
              playHaptic('pop');
              setActiveTab('LIVE');
            }}
            className={`spring-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base ${
              activeTab === 'LIVE'
                ? 'bg-white text-slate-900 font-black shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className={`w-4 h-4 ${activeTab === 'LIVE' ? 'text-sky-600 animate-pulse' : 'text-slate-500'}`} />
            <span>Live Monitor</span>
          </button>
          <button
            onClick={() => {
              playHaptic('pop');
              setActiveTab('RECORDS');
            }}
            className={`spring-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base ${
              activeTab === 'RECORDS'
                ? 'bg-white text-slate-900 font-black shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'RECORDS' ? 'text-sky-600' : 'text-slate-500'}`} />
            <span>Past Records</span>
          </button>
        </nav>

        {activeTab === 'LIVE' ? (
          <div className="flex flex-col gap-4 sm:gap-6">
            
            {/* Live Status Bar */}
            <div className="royal-card rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3 shrink-0">
                  {isConnected ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  )}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {isConnected ? 'Device Connected' : 'Device Offline'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200">
                <BatteryFull className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 text-xs">92%</span>
              </div>
            </div>

            {/* Visual Metrics Matrix: 2x2 on Mobile, 4 across on iPad / Laptop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full transition-all duration-300">
              
              {/* Card 1: Heart Rate */}
              <div
                onClick={() => playHaptic('soft')}
                style={{ '--pulse-speed': pulseSpeed } as React.CSSProperties}
                className={`royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px] sm:min-h-[150px] relative overflow-hidden ${
                  isConnected && hr > 0 ? 'animate-living-heart' : ''
                }`}
              >
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 shadow-xs">
                      <Heart className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">Heart Rate</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    hr < 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {hr < 50 ? 'Low' : 'Normal'}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5 z-10">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-mono">
                    {data.heart_rate || '--'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400">BPM</span>
                </div>

                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Steady Pulse</span>
                </div>
              </div>

              {/* Card 2: Blood Oxygen */}
              <div
                onClick={() => playHaptic('soft')}
                className="royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px] sm:min-h-[150px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 shadow-xs">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">Oxygen</span>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Good
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-mono">
                    {data.spo2 || '--'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400">%</span>
                </div>

                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Healthy Oxygen</span>
                </div>
              </div>

              {/* Card 3: Activity / Movement */}
              <div
                onClick={() => playHaptic('soft')}
                className="royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px] sm:min-h-[150px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl shadow-xs ${
                      isFall ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <PersonStanding className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">Movement</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    isFall 
                      ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                      : isMoving
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isFall ? 'Alert' : isMoving ? 'Moving' : 'Safe'}
                  </span>
                </div>

                <div className="mt-2">
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isFall ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {isFall ? 'FALL!' : isMoving ? 'Walking' : 'Resting'}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    isFall ? 'bg-rose-500' : isMoving ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <span>{isFall ? 'Fall Detected' : isMoving ? 'Active Body' : 'Calm & Still'}</span>
                </div>
              </div>

              {/* Card 4: Overall Health & Safety */}
              <div
                onClick={() => playHaptic('soft')}
                className="royal-card royal-card-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between min-h-[140px] sm:min-h-[150px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl shadow-xs ${
                      isFall ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">Status</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    isFall
                      ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isFall ? 'Danger' : 'Safe'}
                  </span>
                </div>

                <div className="mt-2">
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isFall ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {isFall ? 'HELP NEEDED' : 'SAFE & OKAY'}
                  </span>
                </div>

                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isFall ? 'Alarm Ringing' : 'All Clear'}</span>
                </div>
              </div>

            </div>

            {/* Split Command Layout: Responsive across Laptop, iPad Landscape, and Phones */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start transition-all duration-300">
              
              {/* Left Column: Live Waveform & Test Alarm Controls */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-6">
                {/* Live Movement Waveform */}
                <AccelWaveform latest={telemetryPacket} />

                {/* Test Fall Alarm Buttons */}
                <div className="royal-card rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Test Alarm</span>
                    <span className="text-xs text-slate-400">Trigger test fall warning sequence</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={triggerMockFall}
                      disabled={simulating}
                      className="spring-btn flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md"
                    >
                      <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                      <span>{simulating ? 'Testing...' : 'Test Fall'}</span>
                    </button>
                    <button
                      onClick={resetMockFall}
                      className="spring-btn p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl border border-slate-200 active:scale-95 transition-all"
                      title="Reset Alarm"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Alert History & Event Feed */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6">
                <AlertHistory />
              </div>

            </div>

          </div>
        ) : (
          /* Past Records View: Responsive Split Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start transition-all duration-300">
            
            {/* Left Column: Safety Score & Clinical Baseline */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6">
              <RiskScoreCard />
              <ClinicalSummaryCard />
            </div>

            {/* Right Column: 30-Day Trends & Daily Log */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-6">
              <HistoricalTrends />

              {/* Daily History List */}
              <div className="royal-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Past 30 Days Log
                  </h2>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    {records.length} Days
                  </span>
                </div>

                <div className="space-y-2 max-h-[40vh] lg:max-h-[380px] overflow-y-auto pr-1">
                  {records.map((r, i) => (
                    <div key={i} className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition-all">
                      <div>
                        <span className="font-bold text-slate-900 block">{r.day}</span>
                        <span className="text-slate-500 text-xs">
                          Heart: <strong className="text-slate-700">{r.avg_heart_rate}</strong> • Oxygen: <strong className="text-slate-700">{r.avg_spo2}%</strong>
                        </span>
                      </div>
                      <div>
                        {r.fall_incidents > 0 ? (
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold text-xs">
                            {r.fall_incidents} Fall
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-bold text-xs">
                            Safe
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Minimal Clean Footer */}
        <footer className="text-center py-5 border-t border-slate-200 text-xs text-slate-400 font-medium">
          VitalGuard C3 • Device .1 • Room 204
        </footer>

      </div>

      {/* Emergency Full-Screen Fall Dialog */}
      {isAlertActive && (
        <div 
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-rose-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-emergency-light"
        >
          <div className="max-w-md w-full my-auto flex flex-col justify-between py-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center mb-5 animate-bounce shadow-xl">
                <AlertTriangle className="w-14 h-14 text-rose-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">
                FALL DETECTED!
              </h2>
              <p className="text-rose-200 text-base mt-2 max-w-sm">
                Alarm is ringing. Caregiver has been alerted.
              </p>
              <div className="mt-3 px-3 py-1 rounded-full bg-rose-900/80 border border-rose-700 text-xs font-bold text-rose-300">
                Device .1 • Room 204
              </div>
            </div>

            <div className="space-y-3 pt-8 w-full">
              <button
                onClick={resetMockFall}
                className="spring-btn w-full py-4 bg-white hover:bg-slate-100 text-rose-950 rounded-2xl font-black text-lg active:scale-95 shadow-2xl transition-all"
              >
                I AM OKAY (CANCEL ALARM)
              </button>
              <button
                onClick={resetMockFall}
                className="spring-btn w-full py-3 bg-rose-900/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                Silence Alarm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
