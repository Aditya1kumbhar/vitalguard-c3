
import React from 'react';

export default function App() {
  return (
    <>
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col selection:bg-secondary-fixed selection:text-on-secondary-fixed">
{/*  TOP APP BAR (Shared Component Execution)  */}
<header className="flex justify-between items-center w-full px-6 py-3 border-b border-outline-variant bg-surface shadow-sm sticky top-0 z-50">
<div className="flex items-center gap-6">
<div className="flex items-center gap-2">
<span className="p-2 rounded-xl bg-primary-container text-secondary-fixed flex items-center justify-center">
<span className="material-symbols-outlined" data-icon="monitor_heart" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
</span>
<div>
<span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight block leading-tight">Biofarma Telemetry Cockpit</span>
<span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary inline-block animate-ping"></span>
            Ward 4B • Telemetry Bed 02
          </span>
</div>
</div>
{/*  Navigation Links from JSON Anchor  */}
<nav className="hidden xl:flex items-center gap-6 ml-4">
<a className="border-b-2 border-secondary text-primary font-semibold pb-1 font-label-md text-label-md" href="#">Telemetry</a>
<a className="text-on-surface-variant hover:text-primary transition-colors pb-1 font-label-md text-label-md" href="#">Multi-Lead ECG</a>
<a className="text-on-surface-variant hover:text-primary transition-colors pb-1 font-label-md text-label-md" href="#">Diagnostics</a>
<a className="text-on-surface-variant hover:text-primary transition-colors pb-1 font-label-md text-label-md" href="#">Event Log</a>
<a className="text-on-surface-variant hover:text-primary transition-colors pb-1 font-label-md text-label-md" href="#">Protocol Review</a>
</nav>
</div>
{/*  Center/Trailing Patient Capsule  */}
<div className="hidden lg:flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant shadow-sm">
<div className="flex items-center gap-2 border-r border-outline-variant pr-3">
<span className="font-label-sm text-label-sm text-on-surface-variant">DEVICE</span>
<span className="font-label-md text-label-md font-bold text-primary">01</span>
<span className="text-outline-variant">•</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">ROOM</span>
<span className="font-label-md text-label-md font-bold text-primary">204</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary" data-icon="person">person</span>
<div>
<span className="font-label-md text-label-md font-bold text-on-surface block leading-tight">Pt: Vance, Jonathan</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">62y • Male • MRN #849-2091</span>
</div>
</div>
</div>
{/*  Trailing Icon Actions & Primary Call Action  */}
<div className="flex items-center gap-3">
{/*  Connection Modes  */}
<div className="hidden sm:flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
<div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-base" data-icon="wifi">wifi</span>
<span>Wi-Fi 5GHz</span>
</div>
<span className="text-outline-variant">|</span>
<div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-base" data-icon="bluetooth">bluetooth</span>
<span>BLE 5.2</span>
</div>
</div>
{/*  Quick Status Indicators from JSON  */}
<div className="flex items-center gap-1 text-on-surface-variant">
<button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors relative" title="Notifications">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container"></span>
</button>
<button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors" title="Battery: 92% Charging">
<span className="material-symbols-outlined text-secondary" data-icon="battery_charging_90">battery_charging_90</span>
</button>
<button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors" title="Settings">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</button>
</div>
{/*  JSON Action Execution: Calibrate Sensors (Secondary)  */}
<button className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline text-primary font-label-md text-label-md hover:bg-surface-container transition-colors active:scale-[0.98]">
<span className="material-symbols-outlined text-base" data-icon="tune">tune</span>
        Calibrate Sensors
      </button>
{/*  JSON Action Execution: Intervention Protocol (Primary / Emergency)  */}
<button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-md text-label-md font-bold shadow-sm transition-all duration-150 active:scale-[0.98]">
<span className="material-symbols-outlined text-base" data-icon="e911_emergency" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>e911_emergency</span>
<span>Intervention Protocol</span>
</button>
{/*  Nurse Profile Avatar  */}
<div className="w-9 h-9 rounded-full bg-primary-container text-secondary-fixed flex items-center justify-center font-bold text-xs ring-2 ring-outline-variant/60" title="Lead Clinical Nurse Vance Profile">
        JV
      </div>
</div>
</header>
{/*  MAIN WORKSPACE CANVAS  */}
<main className="flex-1 max-w-[1720px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
{/*  SUB-BANNER / ALERT BANNER (Vibrant Alert Feedback)  */}
<div className="bg-surface-container-lowest border-l-4 border-l-tertiary-container border border-outline-variant p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
<div className="flex items-center gap-3">
<div className="p-2 bg-error-container text-on-error-container rounded-lg">
<span className="material-symbols-outlined" data-icon="warning" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
</div>
<div>
<div className="flex items-center gap-2">
<span className="font-label-md text-label-md text-tertiary-container font-bold">PHYSIOLOGICAL ALERT MONITOR</span>
<span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Tachycardia Trend Warning</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Last acute acceleration flagged at 14:22:08 (HR peak: 106 bpm). Automatic waveform telemetry captured in 10-second diagnostic window.</p>
</div>
</div>
<div className="flex items-center gap-2 self-end md:self-auto">
<button className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors">
          Acknowledge
        </button>
<button className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="assignment_turned_in">assignment_turned_in</span>
          Review Lead Log
        </button>
</div>
</div>
{/*  PRIMARY ROW: REAL-TIME ECG & ACCELEROMETER COCKPIT  */}
<section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
{/*  Cockpit Bar Controls  */}
<div className="px-6 py-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-4 bg-surface-bright/50">
{/*  Tab selector  */}
<div className="flex items-center gap-2">
<button className="px-3.5 py-1.5 rounded-lg bg-primary-container text-white font-label-md text-label-md flex items-center gap-1.5 shadow-sm">
<span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
            Lead II (Primary)
          </button>
<button className="px-3.5 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors">
            Lead V5
          </button>
<button className="px-3.5 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="directions_walk">directions_walk</span>
            3-Axis Accelerometer (Activity/Posture)
          </button>
<button className="px-3.5 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors">
            Respiration
          </button>
</div>
{/*  Telemetry Parameters & Stream Controllers  */}
<div className="flex items-center gap-3">
<div className="hidden sm:flex items-center gap-3 text-on-surface-variant border-r border-outline-variant pr-4">
<div className="flex items-center gap-1 font-label-sm text-label-sm">
<span className="text-outline">SWEEP:</span>
<span className="font-bold text-primary">25 mm/s</span>
</div>
<div className="flex items-center gap-1 font-label-sm text-label-sm">
<span className="text-outline">GAIN:</span>
<span className="font-bold text-primary">10 mm/mV</span>
</div>
<div className="flex items-center gap-1 font-label-sm text-label-sm">
<span className="text-outline">FILTER:</span>
<span className="font-bold text-primary">0.05-40 Hz</span>
</div>
</div>
<button className="px-3 py-1.5 rounded-lg border border-outline text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="pause_circle">pause_circle</span>
            Freeze Strip
          </button>
<button className="px-3 py-1.5 rounded-lg border border-outline text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="picture_as_pdf">picture_as_pdf</span>
            Export PDF
          </button>
</div>
</div>
{/*  ECG Waveform Canvas Simulation Container  */}
<div className="relative w-full ecg-grid bg-[#FAFCFD] p-6 overflow-hidden min-h-[340px] flex flex-col justify-between">
{/*  Live Sweep Overlay Beam  */}
<div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-secondary/15 to-transparent pointer-events-none ecg-scanner z-10 border-r border-secondary/40"></div>
{/*  Lead Info & Telemetry Quick Readout Overlay  */}
<div className="flex items-start justify-between z-20">
<div className="flex items-center gap-3">
<span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">LEAD II (Standard Sinus Rhythm)</span>
<span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Live Synced (60 SPS)
            </span>
</div>
{/*  Dynamic Medical Intervals Capsule  */}
<div className="flex items-center gap-3 bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant px-3.5 py-2 rounded-xl shadow-sm">
<div className="text-center px-1">
<div className="font-label-sm text-label-sm text-outline">PR Interval</div>
<div className="font-label-md text-label-md font-bold text-primary">158 ms</div>
</div>
<div className="h-6 w-px bg-outline-variant"></div>
<div className="text-center px-1">
<div className="font-label-sm text-label-sm text-outline">QRS Duration</div>
<div className="font-label-md text-label-md font-bold text-primary">86 ms</div>
</div>
<div className="h-6 w-px bg-outline-variant"></div>
<div className="text-center px-1">
<div className="font-label-sm text-label-sm text-outline">QT / QTc</div>
<div className="font-label-md text-label-md font-bold text-primary">394 / 412 ms</div>
</div>
<div className="h-6 w-px bg-outline-variant"></div>
<div className="text-center px-1">
<div className="font-label-sm text-label-sm text-outline">ST Deviation</div>
<div className="font-label-md text-label-md font-bold text-secondary">+0.02 mV</div>
</div>
</div>
</div>
{/*  Simulated ECG Strip Vector Graphic (Medical High Fidelity)  */}
<div className="w-full my-4 relative">
<svg className="w-full h-36 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 120">
{/*  Normal Waveform repeating P-Q-R-S-T sequence with clinical fidelity  */}
<path d="
              M 0 60
              L 30 60
              C 35 56, 42 54, 48 60
              L 65 60
              L 70 66
              L 77 10
              L 85 92
              L 90 60
              L 110 60
              C 120 48, 140 48, 150 60
              L 200 60
              C 205 56, 212 54, 218 60
              L 235 60
              L 240 66
              L 247 12
              L 255 90
              L 260 60
              L 280 60
              C 290 48, 310 48, 320 60
              L 370 60
              C 375 56, 382 54, 388 60
              L 405 60
              L 410 66
              L 417 8
              L 425 94
              L 430 60
              L 450 60
              C 460 48, 480 48, 490 60
              L 540 60
              C 545 56, 552 54, 558 60
              L 575 60
              L 580 66
              L 587 14
              L 595 91
              L 600 60
              L 620 60
              C 630 48, 650 48, 660 60
              L 710 60
              C 715 56, 722 54, 728 60
              L 745 60
              L 750 66
              L 757 11
              L 765 93
              L 770 60
              L 790 60
              C 800 48, 820 48, 830 60
              L 880 60
              C 885 56, 892 54, 898 60
              L 915 60
              L 920 66
              L 927 10
              L 935 92
              L 940 60
              L 960 60
              C 970 48, 990 48, 1000 60
            " fill="none" stroke="#006b57" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
</svg>
</div>
{/*  SECONDARY CHANNEL: 3-Axis Accelerometer Waveform (Activity / Posture)  */}
<div className="border-t border-outline-variant/60 pt-3 mt-1">
<div className="flex items-center justify-between mb-2">
<div className="flex items-center gap-2">
<span className="font-label-md text-label-md font-bold text-primary">3-AXIS ACCELEROMETER KINETIC PROFILE</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Continuous Patient Motion Analysis (±2g Dynamic Range)</span>
</div>
<div className="flex items-center gap-4 text-xs font-semibold">
<span className="flex items-center gap-1.5 text-[#006b57]">
<span className="w-2.5 h-1 rounded-full bg-[#006b57]"></span> X-Axis (Lateral: 0.04g)
              </span>
<span className="flex items-center gap-1.5 text-secondary">
<span className="w-2.5 h-1 rounded-full bg-secondary"></span> Y-Axis (Longitudinal: 0.12g)
              </span>
<span className="flex items-center gap-1.5 text-[#400012]">
<span className="w-2.5 h-1 rounded-full bg-[#400012]"></span> Z-Axis (Vertical: 0.98g - Earth Gravity Normal)
              </span>
<span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-bold">Posture: Semi-Fowler (32°)</span>
</div>
</div>
{/*  Accelerometer Synchronous Waveform  */}
<div className="w-full relative h-14">
<svg className="w-full h-14" preserveAspectRatio="none" viewBox="0 0 1000 50">
{/*  X trace (Flat calm)  */}
<path d="M 0 25 Q 100 24 200 25 Q 350 26 400 25 Q 500 23 600 25 Q 750 25 850 24 L 1000 25" fill="none" opacity="0.8" stroke="#006b57" strokeWidth="1.4"></path>
{/*  Y trace (Slight motion perturbation)  */}
<path d="M 0 35 Q 150 36 240 34 L 250 42 L 260 28 L 270 36 Q 400 35 580 34 L 590 40 L 600 29 L 610 35 Q 800 35 1000 35" fill="none" opacity="0.9" stroke="#00725d" strokeWidth="1.4"></path>
{/*  Z trace (Slight respiration ripple)  */}
<path d="M 0 15 Q 60 12 120 15 Q 180 18 240 15 Q 300 12 360 15 Q 420 18 480 15 Q 540 12 600 15 Q 660 18 720 15 Q 780 12 840 15 Q 900 18 960 15 L 1000 15" fill="none" opacity="0.7" stroke="#680022" strokeWidth="1.4"></path>
</svg>
</div>
</div>
</div>
</section>
{/*  METRICS & CLINICAL ASSESSMENTS GRID  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
{/*  METRIC CARD 1: Heart Rate  */}
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md text-on-surface-variant font-medium">HEART RATE (ECG LEAD II)</span>
<span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold">Stable</span>
</div>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-metric-xl text-metric-xl text-primary font-bold tracking-tight">74</span>
<span className="font-label-md text-label-md text-on-surface-variant font-semibold">BPM</span>
</div>
<p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1">
<span className="material-symbols-outlined text-base" data-icon="check_circle" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Normal Sinus Rhythm
          </p>
</div>
<div className="mt-4 pt-3 border-t border-outline-variant/60">
<div className="flex justify-between items-center text-xs text-on-surface-variant mb-1">
<span>24h Range</span>
<span className="font-bold text-primary">58 - 104 BPM</span>
</div>
{/*  Sparkline representation  */}
<div className="w-full h-8 flex items-end gap-1">
<div className="w-1.5 h-3 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-4 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-3 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-5 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-6 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-7 bg-tertiary-container rounded-t" title="Spike: 104 bpm"></div>
<div className="w-1.5 h-4 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-4 bg-secondary-fixed-dim rounded-t"></div>
<div className="w-1.5 h-5 bg-secondary rounded-t"></div>
<div className="w-1.5 h-5 bg-secondary rounded-t"></div>
<div className="w-1.5 h-4 bg-secondary rounded-t"></div>
<div className="w-1.5 h-5 bg-secondary rounded-t"></div>
</div>
</div>
</div>
{/*  METRIC CARD 2: SpO2 Blood Oxygen  */}
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md text-on-surface-variant font-medium">SpO2 PULSE OXIMETRY</span>
<span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold">Optimal</span>
</div>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-metric-xl text-metric-xl text-primary font-bold tracking-tight">98</span>
<span className="font-label-md text-label-md text-on-surface-variant font-semibold">%</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="font-semibold text-primary">Target: &gt;95%</span>
<span>• Perfusion Idx (PI): 4.8%</span>
</p>
</div>
<div className="mt-4 pt-3 border-t border-outline-variant/60">
<div className="flex justify-between items-center text-xs text-on-surface-variant mb-1.5">
<span>Plethysmographic Signal</span>
<span className="text-secondary font-semibold">Good Quality (99.1%)</span>
</div>
{/*  Pulse wave miniature bar  */}
<div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
<div className="bg-secondary h-2 rounded-full" style={{ width: '98%' }}></div>
</div>
</div>
</div>
{/*  METRIC CARD 3: Blood Pressure & Core Temp  */}
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md text-on-surface-variant font-medium">NIBP &amp; TEMPERATURE</span>
<span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">Auto 15m</span>
</div>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-metric-xl text-metric-xl text-primary font-bold tracking-tight">118<span className="text-2xl text-outline font-normal">/</span>76</span>
<span className="font-label-md text-label-md text-on-surface-variant font-semibold">mmHg</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">MAP: 90 mmHg • Mean Target Met</p>
</div>
<div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary" data-icon="device_thermostat">device_thermostat</span>
<div>
<div className="font-label-sm text-label-sm text-on-surface-variant">Axillary Temp</div>
<div className="font-metric-md text-metric-md text-primary font-bold">36.8 °C</div>
</div>
</div>
<div className="text-right">
<span className="font-label-sm text-label-sm text-outline">Resp Rate</span>
<div className="font-label-md text-label-md font-bold text-primary">16 /min</div>
</div>
</div>
</div>
{/*  METRIC CARD 4: Battery & Sensor Leads Telemetry  */}
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md text-on-surface-variant font-medium">PATCH &amp; SENSOR HEALTH</span>
<span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold">Nominal</span>
</div>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-metric-xl text-metric-xl text-primary font-bold tracking-tight">92</span>
<span className="font-label-md text-label-md text-on-surface-variant font-semibold">%</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Wireless Charging Active • 18.4h left</p>
</div>
<div className="mt-4 pt-3 border-t border-outline-variant/60 space-y-1.5">
<div className="flex justify-between items-center text-xs">
<span className="text-on-surface-variant">Lead RA / LA / LL Impedance</span>
<span className="text-secondary font-bold">All &lt; 2.2 kΩ (Pass)</span>
</div>
<div className="flex justify-between items-center text-xs">
<span className="text-on-surface-variant">Bluetooth RSSI</span>
<span className="text-primary font-bold">-54 dBm (Strong)</span>
</div>
</div>
</div>
</div>
{/*  LOWER SECTION: RISK SCORE (NEWS2) & CLINICAL EVENT LOG AUDIT  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  LEFT: NATIONAL EARLY WARNING SCORE (NEWS2) (5 cols)  */}
<section className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<div>
<h2 className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">Clinical Risk Index (NEWS2)</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">National Early Warning Deterioration Assessment</p>
</div>
<span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary font-label-md text-label-md font-bold">
              Low Risk
            </span>
</div>
{/*  Score Radial Visualizer Simulation  */}
<div className="bg-surface-container-low p-4 rounded-xl mb-5 flex items-center gap-5">
<div className="relative w-24 h-24 flex items-center justify-center shrink-0">
<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
{/*  Background Circle  */}
<path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
{/*  Value Circle: 2 out of 20 = 10%  */}
<path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="10, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="absolute text-center">
<span className="font-metric-xl text-metric-xl font-bold text-primary leading-none block">2</span>
<span className="font-label-sm text-label-sm text-outline">/ 20</span>
</div>
</div>
<div>
<div className="font-label-md text-label-md font-bold text-primary">Score: 2 • Ward Monitoring Routine</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Clinical observation schedule recommended every 4-6 hours unless sudden trajectory shift occurs.</p>
<div className="flex items-center gap-1 text-xs text-secondary font-semibold mt-1">
<span className="material-symbols-outlined text-sm" data-icon="trending_down">trending_down</span>
<span>Risk decreased by 1 pt over last 4 hours</span>
</div>
</div>
</div>
{/*  Parameter Breakdown Checklist  */}
<div className="space-y-2.5">
<div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60 font-body-sm text-body-sm">
<span className="text-on-surface font-medium">Respiration Rate (16 bpm)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold font-label-sm text-label-sm">0 pts</span>
</div>
<div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60 font-body-sm text-body-sm">
<span className="text-on-surface font-medium">SpO2 Scale 1 (98% on Room Air)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold font-label-sm text-label-sm">0 pts</span>
</div>
<div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60 font-body-sm text-body-sm">
<span className="text-on-surface font-medium">Systolic Blood Pressure (118 mmHg)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold font-label-sm text-label-sm">0 pts</span>
</div>
<div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60 font-body-sm text-body-sm">
<span className="text-on-surface font-medium">Heart Rate (74 bpm with 104 peak)</span>
<span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold font-label-sm text-label-sm">1 pt</span>
</div>
<div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60 font-body-sm text-body-sm">
<span className="text-on-surface font-medium">Consciousness Alert (AVPU = Alert)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold font-label-sm text-label-sm">0 pts</span>
</div>
<div className="flex justify-between items-center py-1.5 font-body-sm text-body-sm">
<span className="text-on-surface font-medium">Body Temperature (36.8 °C)</span>
<span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold font-label-sm text-label-sm">1 pt</span>
</div>
</div>
</div>
<div className="mt-6 pt-4 border-t border-outline-variant/60">
<button className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-base" data-icon="history_edu">history_edu</span>
            Recalculate Protocol Thresholds
          </button>
</div>
</section>
{/*  RIGHT: RECENT ACTIVITY & DAILY EVENT LOG (7 cols)  */}
<section className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<div>
<h2 className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">Recent Activity &amp; Daily Event Log</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Continuous telemetry timestamp audit trail</p>
</div>
<button className="px-3 py-1.5 rounded-lg border border-outline text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span>
              Filter Events
            </button>
</div>
{/*  Chronological Timeline List  */}
<div className="space-y-4">
{/*  Event 1: Critical Burst  */}
<div className="flex items-start gap-3.5 p-3 rounded-xl bg-error-container/40 border border-error-container">
<div className="p-2 rounded-lg bg-tertiary-container text-on-tertiary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base" data-icon="bolt">bolt</span>
</div>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-bold text-tertiary-container">Brief Tachycardia Burst detected (&gt;105 bpm for 4s)</span>
<span className="font-label-sm text-label-sm text-outline font-semibold">14:22:08</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Lead II detected momentary rate spike of 106 bpm during physical adjustment. Sinus rhythm re-established autonomously.</p>
<div className="flex items-center gap-2 mt-2">
<span className="px-2 py-0.5 rounded bg-tertiary-container text-white font-label-sm text-label-sm font-bold">FE336A Alert</span>
<a className="font-label-sm text-label-sm text-tertiary-container font-semibold hover:underline" href="#">View 10s Rhythm Strip</a>
</div>
</div>
</div>
{/*  Event 2: Postural Shift  */}
<div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/60">
<div className="p-2 rounded-lg bg-surface-container-highest text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base" data-icon="airline_seat_recline_normal">airline_seat_recline_normal</span>
</div>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-bold text-primary">Postural Shift: Supine to Fowler's Position</span>
<span className="font-label-sm text-label-sm text-outline font-semibold">13:45:10</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Kinetic accelerometer registered torso angle tilt change from 8° to 34°. Torso stabilization confirmed.</p>
<div className="flex items-center gap-2 mt-2">
<span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">Info / Posture</span>
</div>
</div>
</div>
{/*  Event 3: Scheduled Sync  */}
<div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/60">
<div className="p-2 rounded-lg bg-secondary/20 text-secondary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base" data-icon="sync">sync</span>
</div>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-bold text-primary">Scheduled Vital Signs Recorded &amp; Synchronized</span>
<span className="font-label-sm text-label-sm text-outline font-semibold">12:00:00</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Automated 4-hour clinical assessment batch transmitted securely to Hospital EHR via FHIR API gateway.</p>
<div className="flex items-center gap-2 mt-2">
<span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Success Sync</span>
</div>
</div>
</div>
{/*  Event 4: Calibration  */}
<div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/60">
<div className="p-2 rounded-lg bg-primary-container text-on-primary-container shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base" data-icon="settings_suggest">settings_suggest</span>
</div>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-bold text-primary">Sensor Lead Impedance Auto-Calibration Completed</span>
<span className="font-label-sm text-label-sm text-outline font-semibold">10:15:32</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Baseline impedance check confirmed normal electrical skin coupling across all three clinical gel leads.</p>
<div className="flex items-center gap-2 mt-2">
<span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">System Routine</span>
</div>
</div>
</div>
</div>
</div>
<div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Showing latest 4 of 48 captured events</span>
<button className="px-4 py-2 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg transition-colors flex items-center gap-1.5 active:scale-[0.98]">
<span>View Complete 24h Event Audit Log</span>
<span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</section>
</div>
</main>
{/*  FOOTER (Shared Component Exact Execution)  */}
<footer className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-4 border-t border-outline-variant bg-surface-container-lowest gap-4 mt-auto">
<div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
<span className="font-label-md text-label-md font-semibold text-primary">Biofarma Clinical Systems</span>
<span className="hidden sm:inline text-outline-variant">•</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">
        © 2025 Biofarma Clinical Systems. FDA 510(k) Class II Cleared | IEC 60601-1-8 Certified Medical Telemetry. End-to-End TLS 1.3 Encrypted.
      </span>
</div>
{/*  Mandatory Footer Links from Shared Components JSON  */}
<div className="flex flex-wrap items-center gap-5">
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors duration-150 active:opacity-80" href="#">
        Emergency Rapid Response Hotline
      </a>
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors duration-150 active:opacity-80" href="#">
        System Diagnostics Log
      </a>
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors duration-150 active:opacity-80" href="#">
        Audit Compliance
      </a>
<a className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors duration-150 active:opacity-80" href="#">
        Clinician User Guide
      </a>
</div>
</footer>
</div>
    </>
  );
}
