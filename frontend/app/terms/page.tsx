import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GlassIcon from '../components/GlassIcon';
import GlassLogo from '../components/GlassLogo';

export const metadata: Metadata = {
  title: 'Terms & Conditions | VitalGuard C3',
  description: 'Operating terms, safety guidelines, and clinical companion non-diagnostic disclaimer for the VitalGuard C3 wearable system.',
};

export default function TermsAndConditionsPage() {
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
            <GlassLogo size={42} showStatusDot={false} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Terms &amp; Conditions of Operation
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Effective Date: October 17, 2026 | System Version: VitalGuard C3 Hardware Companion
              </p>
            </div>
          </div>
        </div>

        {/* Essential Clinical Safety Notice */}
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <GlassIcon name="shield-alert" size="md" variant="rose" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-rose-300">Non-Diagnostic Clinical Disclaimer</span>
              <span className="text-xs text-rose-200/90 leading-relaxed">
                VitalGuard C3 is a non-diagnostic physiological companion and assistive fall detection platform.
                It is not an FDA-cleared Class II medical diagnostic instrument. In life-threatening emergencies or acute trauma, caregivers must contact emergency medical services (such as 911 or local emergency response) immediately.
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Scope of Service */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="pulse" size="sm" variant="cyan" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              1. Platform Scope &amp; Intended Use
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            VitalGuard C3 provides continuous pulse rate estimation (MAX30102 optical PPG), blood oxygen saturation approximation (SpO2), kinetic acceleration tracking (MPU6050 3-Axis SVM), and 30-day FIFO local audit logging for elderly individuals and assisted-living monitoring.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>Assistive Companion:</strong> Readings represent physiological approximations and are intended for trend observation and caregiver reassurance.
            </li>
            <li>
              <strong>Clinical Assessment:</strong> Do not adjust medication, dosage, or cardiac treatment regimens based solely on telemetry displayed in this dashboard without consulting a qualified medical doctor.
            </li>
          </ul>
        </section>

        {/* Section 2: Hardware Operating Requirements */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="gauge" size="sm" variant="emerald" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              2. Hardware Operating Conditions &amp; Maintenance
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Accurate telemetry requires strict adherence to physical operating criteria:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>Wearable Band Placement:</strong> The MAX30102 optical sensor must maintain steady skin contact on the dorsal or volar aspect of the wrist, approximately one finger width above the wrist joint.
            </li>
            <li>
              <strong>Bluetooth Proximity:</strong> The ESP32-C3 microcontroller must remain within Bluetooth Low Energy line-of-sight range (typically up to 10 meters in open interior spaces) of the companion browser host.
            </li>
            <li>
              <strong>Battery Integrity:</strong> The wearer must ensure sufficient lithium battery charge is maintained. Low battery states may result in telemetry throttling or intermittent connection drops.
            </li>
          </ul>
        </section>

        {/* Section 3: Fall Detection Boundaries & Slide Rail Verification */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="shield-alert" size="sm" variant="rose" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              3. Algorithmic Fall Detection Boundaries
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The MPU6050 algorithm flags high-G kinetic acceleration spikes followed by posture displacement. Users must acknowledge the following technical boundaries:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>No Universal Fall Guarantee:</strong> No wearable accelerometer platform can capture 100% of all fall variations. Slow, cushioned slides, soft seated descents, or gradual ground contacts may not generate the necessary 3.0G threshold spike.
            </li>
            <li>
              <strong>Verification Countdown:</strong> Every high-G impact trigger presents a 30-second localized slide verification countdown. Guardians and wearers must not rely solely on automated dispatch in acute distress situations.
            </li>
            <li>
              <strong>Carrier Network Dependent:</strong> Emergency SMS notifications rely on mobile network carriers, cellular signal strength, and recipient device availability.
            </li>
          </ul>
        </section>

        {/* Section 4: Data Sovereignty & Local Retention */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <GlassIcon name="database" size="sm" variant="cyan" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              4. Data Sovereignty &amp; FIFO Storage
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            VitalGuard C3 operates on an on-device architecture. All daily records, fall timestamps, and telemetry summaries are retained for 30 rolling calendar days in the local browser IndexedDB cache. You retain complete ownership and can purge all cached records at any time through the application settings.
          </p>
        </section>

        {/* Section 5: Limitation of Liability */}
        <section className="p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-4">
          <h2 className="text-base sm:text-lg font-bold text-white">
            5. Limitation of Liability &amp; Warranty
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The software, firmware protocols, and clinical companion dashboards are provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, whether express or implied. In no event shall the authors, hardware designers, or software engineers be held liable for any direct, indirect, incidental, or consequential damages resulting from hardware disconnection, sensor occlusion, or delayed emergency escalation.
          </p>
        </section>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-white/8 text-xs text-slate-400">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Return to Dashboard
          </Link>
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
