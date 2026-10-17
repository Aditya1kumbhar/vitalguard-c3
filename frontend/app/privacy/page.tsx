import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GlassIcon from '../components/GlassIcon';

export const metadata: Metadata = {
  title: 'Privacy Policy | VitalGuard C3',
  description: 'On-device data privacy policy and local FIFO retention architecture for the VitalGuard C3 clinical companion system.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0A0D12] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors w-fit px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3 mt-2">
            <img
              src="/logo-tight.png"
              alt="VitalGuard Logo"
              className="h-10 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Privacy Policy &amp; Data Architecture
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Effective Date: October 17, 2026 | Firmware: VitalGuard C3 rev 2.1
              </p>
            </div>
          </div>
        </div>

        {/* Core Guarantee Callout */}
        <div className="p-5 rounded-2xl bg-[#12161D] border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <GlassIcon name="shield-check" size="md" variant="cyan" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">Zero Cloud Telemetry Tracking</span>
              <span className="text-xs text-slate-300 leading-relaxed">
                VitalGuard C3 processes, evaluates, and retains physiological signals locally on your client device.
                No heart rate waveforms, pulse oximetry, or raw accelerometer telemetry are ever sold or transmitted to third-party ad networks.
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Architecture & On-Device Storage */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="database" size="sm" variant="cyan" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              1. Local On-Device Storage &amp; 30-Day FIFO Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All continuous physiological frames streamed from the Seeed Studio XIAO ESP32-C3 hardware band are stored exclusively inside your browser local IndexedDB storage layer.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>Rolling First-In, First-Out (FIFO) Algorithm:</strong> Daily health summaries are maintained for exactly 30 calendar days. Records that exceed 30 days are automatically purged from local storage on each telemetry cycle.
            </li>
            <li>
              <strong>Offline Resilience:</strong> Sensor data and local guardian configurations persist across device reboots and offline disconnects without requiring server connectivity.
            </li>
            <li>
              <strong>Complete Data Erasure:</strong> Guardians can immediately erase all cached telemetry and session keys by signing out or utilizing the local database clear function.
            </li>
          </ul>
        </section>

        {/* Section 2: Web Bluetooth Peer-to-Peer Telemetry */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="radio" size="sm" variant="emerald" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              2. Web Bluetooth GATT Communications
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Telemetry is exchanged directly between the wearable microcontroller and your personal web browser using the standard Web Bluetooth Low Energy (BLE) GATT API:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>Direct Local Link:</strong> No external cloud proxy or central telemetry broker mediates the Bluetooth link between the wristband and your device.
            </li>
            <li>
              <strong>Standard Service UUIDs:</strong> Sensor telemetry utilizes standard GATT service declarations including Heart Rate (0x180D) and custom clinical companion characteristics.
            </li>
            <li>
              <strong>Local User Authorization:</strong> Pairing requires deliberate user interaction via native browser permission dialogs.
            </li>
          </ul>
        </section>

        {/* Section 3: Emergency Fall Escalation Data Handling */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="shield-alert" size="sm" variant="rose" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              3. Emergency Fall Detection Escalation
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The MPU6050 sensor evaluates rapid Signal Vector Magnitude (SVM) transitions for fall impacts exceeding 3.0G. When a verified impact event occurs:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>30-Second Local Verification Window:</strong> A 30-second localized visual and audio countdown appears on screen. The wearer or guardian can dismiss the event immediately if unhurt.
            </li>
            <li>
              <strong>Emergency Dispatch Trigger:</strong> If unacknowledged at zero seconds, the system dispatches an urgent SMS alert payload exclusively to designated guardian phone numbers.
            </li>
            <li>
              <strong>Payload Contents:</strong> Emergency dispatch messages contain timestamp, maximum recorded impact G-force, and the most recent valid heart rate reading.
            </li>
          </ul>
        </section>

        {/* Section 4: Security & Passkey Authentication */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="shield-check" size="sm" variant="cyan" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              4. Authentication &amp; Hardware Identity
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Guardian access uses native WebAuthn (Passkeys, Windows Hello, Touch ID, device PIN) with local cryptographic salt verification. Session data remains bound to the authorized hardware and browser instance.
          </p>
        </section>

        {/* Section 5: Clinical Companion Scope & Contact */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="medical" size="sm" variant="slate" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              5. Non-Diagnostic Notice &amp; Inquiries
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            VitalGuard C3 is an investigational health companion and fall safety monitor. It is not an FDA-cleared diagnostic device. For privacy questions, firmware inquiries, or data export assistance, consult your local administrative portal or contact your systems engineer.
          </p>
        </section>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-white/8 text-xs text-slate-400">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Return to Dashboard
          </Link>
          <Link href="/terms" className="hover:text-cyan-400 transition-colors">
            View Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </main>
  );
}
