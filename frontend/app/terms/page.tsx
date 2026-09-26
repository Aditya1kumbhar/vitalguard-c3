"use client";

import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function TermsPage() {
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
              Version 1.4
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Effective: September 2026
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="royal-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                VitalGuard C3 Terms &amp; Conditions
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Clinical Operational Terms, Hardware Guidelines, and Non-Diagnostic Disclaimer
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mt-4">
            These Terms and Conditions govern the deployment, testing, and operation of the VitalGuard C3 sovereign wearable sentinel system, including the embedded firmware, telemetry bridge, and monitoring interface.
          </p>
        </div>

        {/* Clinical Disclaimer Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-950 leading-relaxed">
            <span className="font-black uppercase tracking-wide block">
              Important Medical &amp; Safety Disclaimer
            </span>
            <p>
              VitalGuard C3 is an assistive wearable telemetry instrument developed for research, educational, and assistive caregiver awareness. It is not an FDA-cleared, CE-marked, or CDSCO-certified medical device. It is not designed, marketed, or certified for diagnosing, treating, curing, or preventing any cardiovascular, respiratory, or neuromuscular disease.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="royal-card rounded-2xl p-6 sm:p-8 flex flex-col gap-6 text-slate-800">
          
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              1. Scope of Use
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              The VitalGuard C3 system provides real-time telemetry streaming (heart rate, estimated SpO2, and 3-axis motion) and algorithmic fall impact alerting. The system is designed to supplement, not replace, direct human caregiver supervision and institutional patient safety protocols.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              2. Emergency Response Limitations
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              VitalGuard C3 does not connect directly to municipal emergency dispatch services (such as 911, 112, or local fire/ambulance departments). In the event of a critical fall or severe acute medical emergency, caregivers and users must immediately contact certified medical responders through standard telephony or designated alarm systems.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              3. Sensor Operational Realities
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              Users acknowledge that optical PPG and MEMS inertial sensors operate within physical limitations:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
              <li>MAX30102 optical readings require proper skin contact and can be impacted by movement artifacts, severe hypothermia, low perfusion, or ambient light leakage.</li>
              <li>MPU6050 fall detection uses a deterministic 3-stage physics threshold pipeline. While designed to minimize false positives, unusual biomechanical motions (such as dropping the band or jumping onto soft mattresses) may trigger alerts, and slow sliding falls may not exceed peak g-force thresholds.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              4. Hardware Maintenance &amp; Wireless Environment
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              Continuous monitoring requires maintaining battery charge (3.7V LiPo) and remaining within the physical range of the Bluetooth Low Energy (BLE) receiver or local 2.4GHz Wi-Fi network. The developers assume no liability for missed alerts arising from battery exhaustion, signal attenuation, or browser background process suspension.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              5. Intellectual Property &amp; Open Source Terms
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              VitalGuard C3 is authored by Team A2S1 (Aditya S. Kumbhar, Ankita S. Birajdar, Safiya N. Shaikh) and licensed under the permissive MIT Open Source License. You are free to modify, inspect, and deploy the firmware and interface in accordance with the license conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-sky-600"></span>
              6. Limitation of Liability
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              To the maximum extent permitted by applicable law, the developers, contributors, and affiliated institutions disclaim all warranties, express or implied, including fitness for a particular purpose or non-infringement. Under no circumstances shall the authors be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this system.
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
            <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
