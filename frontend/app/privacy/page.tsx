"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, ServerOff, Database, EyeOff, FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-between">
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 responsive-adaptive flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link
            href="/"
            className="spring-btn inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Policy Revision 1.4
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Effective: September 2026
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="royal-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                VitalGuard C3 Privacy Policy
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Privacy-First Architecture & Sovereign Local Telemetry Policy
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mt-4">
            VitalGuard C3 is engineered on the principle of sovereign patient privacy. Unlike commercial smartwatches that stream biometric telemetry to proprietary corporate clouds, VitalGuard C3 operates with zero required cloud infrastructure.
          </p>
        </div>

        {/* Key Architecture Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <ServerOff className="w-4 h-4" />
              <span>Zero Cloud Reliance</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Biometric signals are calculated locally on the microcontroller. Zero raw optical or acceleration data is uploaded to remote data centers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>Local 30-Day FIFO</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Historical summaries are stored inside the client browser IndexedDB and LittleFS flash memory. Day 31+ telemetry is purged automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>P2P Direct Wireless</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time monitoring communicates directly via Web Bluetooth API (BLE GATT) or local isolated WebSocket bridges.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="royal-card rounded-2xl p-6 sm:p-8 flex flex-col gap-6 text-slate-800">
          
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              1. Information We Do Not Collect
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              We do not collect, sell, monetize, or transmit:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
              <li>Personally Identifiable Information (PII) such as full legal names, government IDs, or phone numbers.</li>
              <li>Continuous GPS coordinates or location tracking history.</li>
              <li>Audio recordings, ambient noise transcripts, or video surveillance.</li>
              <li>Advertising identifiers, marketing tracking cookies, or behavioral telemetry.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              2. On-Wrist Telemetry Processing
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              Raw sensor streams from the MAX30102 pulse oximeter (100 Hz photoplethysmography) and MPU6050 6-axis IMU (50 Hz accelerometer and gyroscope) are processed directly inside the ESP32-C3 microcontroller using edge algorithms. Decisions regarding fall detection thresholds (Free-Fall &lt;0.4g, Impact &gt;2.5g, Post-Fall Stillness ~1.0g) are executed on-chip within 200 milliseconds.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              3. Data Retention &amp; Automatic Eviction
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              To support clinical trend reviews while minimizing retention risk, the system summarizes each 24-hour cycle into a 32-byte clinical rollup struct containing daily average heart rate, oxygen saturation, and confirmed fall events. This rolling window is maintained for exactly 30 calendar days. Records on Day 31 are overwritten in hardware flash and deleted from client browser storage without residual retention.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              4. User Control &amp; Data Deletion
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              Because storage resides on the user device, users maintain absolute control. Clearing browser site data or executing the alert purge function deletes all local records immediately. No remote backups or cloud logs exist to retrieve.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              5. Security Practices
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              All browser communications utilize encrypted Web Bluetooth GATT protocol or secure WebSocket (WSS) transport when deployed over HTTPS networks. The firmware incorporates hardware watchdog timers and memory safety guardrails to prevent buffer overflow vulnerabilities.
            </p>
          </section>

        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-slate-200/80 text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">VitalGuard C3</span>
            <span className="text-slate-300">|</span>
            <span>Device 01</span>
            <span className="text-slate-300">|</span>
            <span>Room 204</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-sky-600 transition-colors">Live Dashboard</Link>
            <span className="text-slate-300">|</span>
            <Link href="/terms" className="hover:text-sky-600 transition-colors">Terms of Use</Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
