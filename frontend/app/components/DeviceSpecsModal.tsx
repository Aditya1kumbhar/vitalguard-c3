"use client";

import React from "react";
import { X, Cpu, ShieldCheck, Activity, Bell, Battery, Radio, CheckCircle2, Zap } from "lucide-react";
import { playHaptic } from "../utils/haptics";

interface DeviceSpecsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DeviceSpecsModal({ open, onClose }: DeviceSpecsModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Device Specifications and System Architecture"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playHaptic("pop");
          onClose();
        }
      }}
    >
      <div className="royal-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/90 flex flex-col gap-4 text-slate-900">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  VitalGuard-C3
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  Team A2S1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                The Sovereign Sentinel • Device .1
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playHaptic("pop");
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Philosophy Banner */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/70 text-xs">
          <div className="flex items-center gap-2 font-bold text-sky-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Core Philosophy: Zero Cloud Dependence</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Privacy-First Edge Wearable with zero cloud dependence and autonomous on-wrist triage. Sub-second (&lt;200ms) decision latency and zero biometric bytes leaving the wrist.
          </p>
        </div>

        {/* Authors */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Project Authors (Team A2S1)
          </span>
          <div className="text-xs font-bold text-slate-800 flex flex-wrap gap-x-3 gap-y-1">
            <span>• Aditya S. Kumbhar</span>
            <span>• Ankita S. Birajdar</span>
            <span>• Safiya N. Shaikh</span>
          </div>
        </div>

        {/* Hardware Bill of Materials (BOM) */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-2">
            Hardware Bill of Materials (BOM)
          </span>
          <div className="space-y-2 text-xs">
            
            <div className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-sky-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Seeed XIAO ESP32-C3</div>
                  <div className="text-[11px] text-slate-500">160MHz RISC-V, 400KB SRAM, 44µA Deep Sleep</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-700">₹679</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-rose-500 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">MAX30102 Pulse Oximeter</div>
                  <div className="text-[11px] text-slate-500">Heart Rate (BPM) &amp; SpO2 (%) via I2C at 100 Hz</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-700">₹199</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">MPU6050 6-Axis Motion Sensor</div>
                  <div className="text-[11px] text-slate-500">Accelerometer &amp; Gyroscope via I2C at 50 Hz</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-700">₹200</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-start gap-2">
                <Bell className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Code Blue Alarm Actuator</div>
                  <div className="text-[11px] text-slate-500">Instant Piezo Buzzer &amp; LED Physical Alerts</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-700">₹250</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-start gap-2">
                <Battery className="w-4 h-4 text-slate-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">3.7V LiPo Battery (500mAh)</div>
                  <div className="text-[11px] text-slate-500">Ultra-low power multi-day endurance</div>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-700">₹250</span>
            </div>

            {/* Total BOM */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-300 font-bold">
              <span className="text-slate-800">Total Unit Estimated Cost</span>
              <span className="text-emerald-700 font-black">₹1,500 – ₹2,500 ($18 – $27 USD)</span>
            </div>

          </div>
        </div>

        {/* Edge AI Triage Engine */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
            Edge Triage Engine Pipeline
          </span>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Throughput: 150 data points/s (100 Hz PPG + 50 Hz IMU)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Vector Math: SVM = √(ax² + ay² + az²)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>3-Stage Fall: Free-Fall (&lt;0.4g) → Impact (&gt;2.5g) → Stillness</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Decision Latency: &lt;200ms on-device execution (20KB model in SRAM)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Vital Rules: Bradycardia (&lt;50 BPM) &amp; Hypoxemia Desaturation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Direct Hardware Override: Fires GPIO HIGH to Buzzer/LED without cloud</span>
            </div>
          </div>
        </div>

        {/* 30-Day Zero-Cloud Storage Architecture */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
            30-Day Zero-Cloud Storage Architecture
          </span>
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-emerald-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span>Clinical Edge Rollups (150Hz → 32B/Day)</span>
                <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                  Raw 150Hz data (~1GB/month) is aggregated on the ESP32 into a 32-byte daily summary struct (Avg HR, Min/Max SpO2, Fall Count). 30 days = &lt;1KB total.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                <span className="font-bold text-slate-900 block">1. ESP32 Flash (LittleFS)</span>
                <span className="text-slate-600 block mt-0.5">
                  Fixed 30-slot circular ring buffer. Day 31 wraps around and overwrites Day 1 locally.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                <span className="font-bold text-slate-900 block">2. Browser (IndexedDB)</span>
                <span className="text-slate-600 block mt-0.5">
                  Zero-cloud client database. Auto-purges records older than 30 days on every write.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-100/70 text-[11px] font-semibold text-emerald-900">
              <span>BLE GATT Split</span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-emerald-800">
                Live: Notify (10Hz) • History: Read Burst (&lt;1s)
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            playHaptic("pop");
            onClose();
          }}
          className="spring-btn w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md mt-1"
        >
          Close Specifications
        </button>

      </div>
    </div>
  );
}
