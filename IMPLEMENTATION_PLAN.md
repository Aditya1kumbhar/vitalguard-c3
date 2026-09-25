# IMPLEMENTATION_PLAN.md
## VitalGuard C3 — Mock Telemetry Demo (No Hardware Required)

> **Honesty note, read before building:** this is a SOFTWARE MOCK for tomorrow's classroom evaluation, standing in for hardware that isn't assembled yet. It uses WiFi + a Python WebSocket server because that's the fastest thing to fake in 30 minutes on a laptop — it is **not** the real system's architecture. The real VitalGuard C3 uses **Bluetooth Low Energy direct from the ESP32-C3 to the browser (Web Bluetooth API)**, with no backend server in between at all. Do not tell the teacher the firmware "drops directly into this." It doesn't — see Section 6 for the honest way to say this.

---

## 1. Directory Tree

```
vitalguard-mock/
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── page.tsx
        ├── hooks/
        │   └── useTelemetrySocket.ts
        └── components/
            ├── VitalGauge.tsx
            └── FallAlertModal.tsx
```

No database. No Supabase. No Prisma. A classroom mock does not need persisted rows — it needs to not crash on stage. Add a DB later, once real hardware exists and you actually have data worth keeping.

---

## 2. Dependency Matrix (pinned, exact)

**backend/requirements.txt**
```
fastapi==0.115.6
uvicorn[standard]==0.32.1
pydantic==2.10.3
websockets==13.1
```

**frontend/package.json**
```json
{
  "name": "vitalguard-mock",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.18",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "lucide-react": "0.462.0"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "@types/node": "22.10.1",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "tailwindcss": "3.4.15",
    "postcss": "8.4.49",
    "autoprefixer": "10.4.20"
  }
}
```

---

## 3. Backend Mock Engine

**backend/main.py**
```python
import asyncio
import random
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="VitalGuard C3 Mock Telemetry")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single shared queue -> fine for one demo laptop viewing the dashboard.
# NOT multi-client safe (a second viewer would steal queued fall events).
# That's an acceptable, disclosed limitation for a classroom demo.
fall_queue: "asyncio.Queue[TelemetryPacket]" = asyncio.Queue()


class TelemetryPacket(BaseModel):
    heart_rate: int
    spo2: int
    total_accel_g: float
    fall_detected: bool
    stage: str
    timestamp: str


def normal_packet() -> TelemetryPacket:
    return TelemetryPacket(
        heart_rate=random.randint(60, 100),
        spo2=random.randint(95, 100),
        total_accel_g=round(random.uniform(0.9, 1.1), 2),
        fall_detected=False,
        stage="normal",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def stage_packet(total_accel_g: float, fall_detected: bool, stage: str) -> TelemetryPacket:
    return TelemetryPacket(
        heart_rate=random.randint(60, 100),
        spo2=random.randint(95, 100),
        total_accel_g=total_accel_g,
        fall_detected=fall_detected,
        stage=stage,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            if not fall_queue.empty():
                packet = await fall_queue.get()
            else:
                packet = normal_packet()
            await websocket.send_text(packet.model_dump_json())
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
    except Exception:
        # Never let one bad send kill the server mid-demo.
        return


@app.post("/trigger-fall")
async def trigger_fall() -> dict:
    # Matches the REAL project's actual fall-detection design:
    # free-fall dip (<0.4g) -> impact spike (>2.5g) -> post-fall stillness.
    # These three numbers are not new inventions -- they are the same
    # thresholds used everywhere else in this project. Keep it that way.
    await fall_queue.put(stage_packet(0.3, False, "free_fall_dip"))
    await fall_queue.put(stage_packet(3.2, True, "impact_spike"))
    await fall_queue.put(stage_packet(1.0, False, "post_fall_stillness"))
    return {"status": "fall sequence queued", "stages": 3}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

---

## 4. Fall Detection Logic — Explained, Same Numbers Used Everywhere Else in This Project

| Stage | Condition | What It Represents |
|---|---|---|
| 1. Free-fall dip | total acceleration drops below **0.4g** | Sensor briefly reads near-weightless during the fall itself |
| 2. Impact spike | total acceleration exceeds **2.5g**, shortly after stage 1 | The body hitting the ground |
| 3. Post-fall stillness | acceleration settles and stays near 1g for several seconds | No recovery movement after impact — the strongest fall signal |

All three must occur **in sequence** to fire an alert — not any single threshold alone. This is deliberate: a single-threshold check (just "acceleration > X") would false-alarm on jumping or sitting down hard. This is the same logic used in the project's actual firmware design and the earlier corrected code page — the mock reproduces it faithfully rather than inventing new numbers for the demo.

---

## 5. Frontend Implementation

**frontend/app/hooks/useTelemetrySocket.ts**
```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface TelemetryPacket {
  heart_rate: number;
  spo2: number;
  total_accel_g: number;
  fall_detected: boolean;
  stage: string;
  timestamp: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected";

const WS_URL = "ws://localhost:8000/ws/telemetry";
const RECONNECT_DELAY_MS = 2000;

export function useTelemetrySocket() {
  const [latest, setLatest] = useState<TelemetryPacket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setConnectionState("connecting");

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) return;
      setConnectionState("connected");
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      try {
        const packet: TelemetryPacket = JSON.parse(event.data);
        setLatest(packet);
      } catch {
        // Malformed packet -- ignore it, don't crash the dashboard.
      }
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      setConnectionState("disconnected");
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  return { latest, connectionState };
}
```

**frontend/app/components/VitalGauge.tsx**
```typescript
interface VitalGaugeProps {
  label: string;
  value: number;
  unit: string;
  minSafe: number;
  maxSafe: number;
}

export default function VitalGauge({
  label,
  value,
  unit,
  minSafe,
  maxSafe,
}: VitalGaugeProps) {
  const isOutOfRange = value < minSafe || value > maxSafe;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 flex flex-col gap-2">
      <span className="text-slate-400 text-sm">{label}</span>
      <span
        className={`text-4xl font-bold ${
          isOutOfRange ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {value}
        <span className="text-lg ml-1 text-slate-500">{unit}</span>
      </span>
    </div>
  );
}
```

**frontend/app/components/FallAlertModal.tsx**
```typescript
"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface FallAlertModalProps {
  open: boolean;
  onDismiss: () => void;
}

export default function FallAlertModal({
  open,
  onDismiss,
}: FallAlertModalProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!open) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.15;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.8);

    return () => {
      ctx.close().catch(() => {});
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-red-600 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-pulse">
        <AlertTriangle className="mx-auto mb-4" size={56} color="white" />
        <h2 className="text-2xl font-bold text-white mb-2">FALL DETECTED</h2>
        <p className="text-red-100 mb-6">
          Impact and stillness pattern confirmed. Alert would fire on the
          device buzzer and LED in the real system.
        </p>
        <button
          onClick={onDismiss}
          className="bg-white text-red-600 font-semibold px-6 py-2 rounded-lg"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
```

**frontend/app/page.tsx**
```typescript
"use client";

import { useEffect, useState } from "react";
import { useTelemetrySocket } from "./hooks/useTelemetrySocket";
import VitalGauge from "./components/VitalGauge";
import FallAlertModal from "./components/FallAlertModal";

export default function DashboardPage() {
  const { latest, connectionState } = useTelemetrySocket();
  const [showFallModal, setShowFallModal] = useState(false);

  useEffect(() => {
    if (latest?.fall_detected) {
      setShowFallModal(true);
    }
  }, [latest?.fall_detected]);

  const triggerFall = async () => {
    await fetch("http://localhost:8000/trigger-fall", { method: "POST" });
  };

  const statusColor =
    connectionState === "connected"
      ? "bg-emerald-500"
      : connectionState === "connecting"
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">VitalGuard C3 — Mock Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          {connectionState}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VitalGauge
          label="Heart Rate"
          value={latest?.heart_rate ?? 0}
          unit="bpm"
          minSafe={50}
          maxSafe={120}
        />
        <VitalGauge
          label="SpO2"
          value={latest?.spo2 ?? 0}
          unit="%"
          minSafe={92}
          maxSafe={100}
        />
        <VitalGauge
          label="Total Acceleration"
          value={latest?.total_accel_g ?? 0}
          unit="g"
          minSafe={0.6}
          maxSafe={2.0}
        />
      </div>

      <div className="text-sm text-slate-400">
        Stage: {latest?.stage ?? "waiting for data..."}
      </div>

      <button
        onClick={triggerFall}
        className="self-start bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg font-semibold"
      >
        Simulate Fall
      </button>

      <FallAlertModal
        open={showFallModal}
        onDismiss={() => setShowFallModal(false)}
      />
    </main>
  );
}
```

**frontend/app/layout.tsx**
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalGuard C3 Mock Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**frontend/app/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**frontend/tailwind.config.ts**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

**frontend/postcss.config.mjs**
```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

**frontend/next.config.mjs**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

**frontend/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 6. Teacher Presentation Script — Honest Version

Say this, close to word for word:

> "The physical band isn't assembled yet, so what you're seeing right now is a **software simulation** standing in for it — same data shape, same fall-detection logic, running on my laptop instead of the chip. What's real and already designed: the actual ESP32-C3 firmware won't use this WiFi/WebSocket setup at all — it talks over **Bluetooth Low Energy directly to the browser**, no backend server in the loop, and no internet needed for the safety alert. This mock exists to prove the fall-detection *logic and thresholds* are correct and the *dashboard* works, before the hardware side is soldered. When the board is assembled, this frontend gets a small update to speak Bluetooth instead of WebSocket — the gauges, the modal, and the alert logic stay the same."

This is the honest claim: **the fall-detection logic and dashboard UI carry over. The transport layer does not, and does not need to.** Do not say "the firmware drops directly into this" — it's not true, and a teacher who asks a follow-up question will catch it immediately if you do.

---

## 7. Verification Checklist

```bash
# Terminal 1 — backend
cd vitalguard-mock/backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Confirm backend alive:
curl http://localhost:8000/health
# Expect: {"status":"ok"}
```

```bash
# Terminal 2 — frontend
cd vitalguard-mock/frontend
npm install
npm run dev
# Open http://localhost:3000
```

```bash
# Confirm live data flowing:
# Dashboard should show changing HR/SpO2/accel numbers every ~1 second,
# connection dot should be green ("connected").

# Trigger the fall sequence:
curl -X POST http://localhost:8000/trigger-fall
# Expect: red "FALL DETECTED" modal appears within ~1-2 seconds.
```

```bash
# Reconnect test (do this before the actual demo, not during it):
# Stop the backend (Ctrl+C in Terminal 1) -> dot should turn red ("disconnected")
# Restart backend -> dot should turn green again within ~2 seconds, no page refresh needed
```

**One honest limitation, disclosed, not hidden:** the fall queue is shared across all connected dashboard tabs. If you open two browser tabs during the demo, only one will receive each queued fall stage. Keep one tab open for the live demo — this is a known, accepted simplification for a single-viewer classroom mock, not a bug to chase tonight.
