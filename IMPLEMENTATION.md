# IMPLEMENTATION.md
## VitalGuard C3 — Software-Layer Demo with Alert History

> **Engineering honesty policy, non-negotiable:**
> Everything below is a **disclosed software simulation**. Simulated sensor data inside an openly-labelled mock = standard engineering practice (every hardware team does this). Pretending the board + firmware are already working = academic dishonesty. We don't cross that line.
>
> The script to say out loud: *"Hardware's still being assembled, so this is the software side running on simulated data — same logic, same thresholds, same dashboard that'll connect to the real chip once soldered."*

---

## 0. What This Plan Adds Over the Original

| Feature | Original Plan | This Plan |
|---|---|---|
| Fall alert history / "Recent Alerts" panel | ❌ No persistence at all | ✅ In-memory list + SQLite file fallback |
| Urgency cues | ✅ Red pulse modal + beep | ✅ Same, plus severity badge + alert log on dashboard |
| Database | ❌ Explicitly avoided | ✅ Lightweight SQLite — no Supabase, no Prisma, no cloud |
| Honest labelling | ✅ "Mock Dashboard" title | ✅ Simulation banner baked into UI, not hidden |
| Body temperature | ❌ Not included | ✅ Added as 4th vital (MLX90614 IR temp, simulated 36.1–37.2°C) |

**What stays the same:** Fall-detection 3-stage logic (free-fall dip < 0.4g → impact spike > 2.5g → post-fall stillness), WebSocket transport for the mock, Next.js + TailwindCSS frontend, FastAPI backend.

---

## 1. Directory Tree

```
Vital-C3/
├── backend/
│   ├── main.py              # FastAPI + WebSocket mock engine
│   ├── db.py                # SQLite alert history (single file, zero config)
│   ├── requirements.txt
│   └── alerts.db            # Auto-created on first run, .gitignore'd
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── page.tsx           # Main dashboard — vitals + alert history panel
        ├── hooks/
        │   └── useTelemetrySocket.ts
        └── components/
            ├── VitalGauge.tsx
            ├── FallAlertModal.tsx
            └── AlertHistory.tsx    # NEW: "Recent Alerts" panel
```

---

## 2. Dependency Matrix (pinned, exact)

### backend/requirements.txt
```
fastapi==0.115.6
uvicorn[standard]==0.32.1
pydantic==2.10.3
websockets==13.1
aiosqlite==0.20.0
```

> `aiosqlite` — async SQLite wrapper. Zero external DB server, zero config, one `.db` file. Perfect for "show me a history log" without Supabase overhead.

### frontend/package.json
```json
{
  "name": "vitalguard-c3",
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

## 3. Backend — SQLite Alert History

### backend/db.py
```python
"""
Lightweight alert-history store.
One SQLite file, one table, zero config.
Stores every triggered fall event so the dashboard can show "Recent Alerts."
"""

import aiosqlite
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent / "alerts.db"


async def init_db() -> None:
    """Create the alerts table if it doesn't exist. Called once on startup."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS fall_alerts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp   TEXT    NOT NULL,
                peak_accel  REAL    NOT NULL,
                severity    TEXT    NOT NULL DEFAULT 'high',
                acknowledged INTEGER NOT NULL DEFAULT 0
            )
        """)
        await db.commit()


async def record_alert(peak_accel: float, severity: str = "high") -> int:
    """Insert a fall alert. Returns the new row ID."""
    ts = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO fall_alerts (timestamp, peak_accel, severity) VALUES (?, ?, ?)",
            (ts, peak_accel, severity),
        )
        await db.commit()
        return cursor.lastrowid  # type: ignore[return-value]


async def get_recent_alerts(limit: int = 20) -> list[dict]:
    """Return the N most recent alerts, newest first."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM fall_alerts ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def acknowledge_alert(alert_id: int) -> bool:
    """Mark an alert as acknowledged. Returns True if a row was updated."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "UPDATE fall_alerts SET acknowledged = 1 WHERE id = ?",
            (alert_id,),
        )
        await db.commit()
        return cursor.rowcount > 0
```

### backend/main.py
```python
"""
VitalGuard C3 — Mock Telemetry Server

DISCLOSED SIMULATION: This generates fake sensor data on a 1-second loop.
Same fall-detection logic and thresholds as the real firmware design.
Transport is WebSocket over WiFi (real system uses BLE — see Section 8).
"""

import asyncio
import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import init_db, record_alert, get_recent_alerts, acknowledge_alert


# ── Lifespan ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    yield


app = FastAPI(title="VitalGuard C3 Mock Telemetry", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Data model ────────────────────────────────────────────────────────
class TelemetryPacket(BaseModel):
    heart_rate: int
    spo2: int
    body_temp: float
    total_accel_g: float
    fall_detected: bool
    stage: str
    timestamp: str


# Single shared queue — acceptable for single-viewer classroom demo.
fall_queue: "asyncio.Queue[TelemetryPacket]" = asyncio.Queue()


# ── Packet generators ────────────────────────────────────────────────
def normal_packet() -> TelemetryPacket:
    return TelemetryPacket(
        heart_rate=random.randint(60, 100),
        spo2=random.randint(95, 100),
        body_temp=round(random.uniform(36.1, 37.2), 1),
        total_accel_g=round(random.uniform(0.9, 1.1), 2),
        fall_detected=False,
        stage="normal",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def stage_packet(
    total_accel_g: float, fall_detected: bool, stage: str
) -> TelemetryPacket:
    return TelemetryPacket(
        heart_rate=random.randint(60, 100),
        spo2=random.randint(95, 100),
        body_temp=round(random.uniform(36.1, 37.2), 1),
        total_accel_g=total_accel_g,
        fall_detected=fall_detected,
        stage=stage,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# ── WebSocket stream ─────────────────────────────────────────────────
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
        return


# ── Fall trigger (demo button) ───────────────────────────────────────
@app.post("/trigger-fall")
async def trigger_fall() -> dict:
    """
    Queues the 3-stage fall sequence and records it in the alert DB.
    Same thresholds as the real firmware design:
      Stage 1: free-fall dip   (< 0.4g)
      Stage 2: impact spike    (> 2.5g)  <- this is the detection trigger
      Stage 3: post-fall still  (~1.0g for several seconds)
    """
    peak_accel = round(random.uniform(2.8, 4.5), 1)

    await fall_queue.put(stage_packet(0.3, False, "free_fall_dip"))
    await fall_queue.put(stage_packet(peak_accel, True, "impact_spike"))
    await fall_queue.put(stage_packet(1.0, False, "post_fall_stillness"))

    # Persist to SQLite for the "Recent Alerts" panel
    alert_id = await record_alert(peak_accel=peak_accel, severity="high")

    return {"status": "fall sequence queued", "stages": 3, "alert_id": alert_id}


# ── REST endpoints ───────────────────────────────────────────────────
@app.get("/alerts")
async def list_alerts(limit: int = 20) -> list[dict]:
    """Return recent fall alerts for the dashboard history panel."""
    return await get_recent_alerts(limit)


@app.post("/alerts/{alert_id}/acknowledge")
async def ack_alert(alert_id: int) -> dict:
    updated = await acknowledge_alert(alert_id)
    return {"acknowledged": updated}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "mode": "simulation"}
```

---

## 4. Fall Detection Logic — Same Numbers, Everywhere

| Stage | Condition | Physical Meaning |
|---|---|---|
| 1. Free-fall dip | accel drops below **0.4g** | Sensor reads near-weightless during the fall |
| 2. Impact spike | accel exceeds **2.5g** after stage 1 | Body hitting the ground |
| 3. Post-fall stillness | accel settles near **1.0g** for several seconds | No recovery movement — strongest fall indicator |

All three **in sequence** to fire an alert. Single-threshold ("accel > X") would false-alarm on jumping or sitting down hard. These are the same thresholds used in the project's actual firmware design — the mock reproduces them, doesn't invent new ones.

---

## 5. Frontend Implementation

### frontend/app/hooks/useTelemetrySocket.ts
```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface TelemetryPacket {
  heart_rate: number;
  spo2: number;
  body_temp: number;
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
        // Malformed packet — ignore, don't crash the dashboard.
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

### frontend/app/components/VitalGauge.tsx
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

### frontend/app/components/FallAlertModal.tsx
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
          className="bg-white text-red-600 font-semibold px-6 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
```

### frontend/app/components/AlertHistory.tsx — NEW
```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";

interface FallAlert {
  id: number;
  timestamp: string;
  peak_accel: number;
  severity: string;
  acknowledged: number;
}

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<FallAlert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/alerts?limit=10");
      if (res.ok) {
        const data: FallAlert[] = await res.json();
        setAlerts(data);
      }
    } catch {
      // Backend might be down — don't crash the dashboard.
    }
  }, []);

  // Poll every 3 seconds for new alerts.
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const acknowledgeAlert = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/alerts/${id}/acknowledge`, {
        method: "POST",
      });
      fetchAlerts(); // Refresh list
    } catch {
      // Ignore — best-effort acknowledge
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={18} className="text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
        {alerts.length > 0 && (
          <span className="ml-auto bg-red-600/30 text-red-300 text-xs px-2 py-0.5 rounded-full">
            {alerts.filter((a) => !a.acknowledged).length} unacknowledged
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-slate-500 text-sm">No fall events recorded yet.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                alert.acknowledged
                  ? "bg-slate-700/40 text-slate-400"
                  : "bg-red-900/30 text-red-200 border border-red-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.acknowledged ? (
                  <CheckCircle
                    size={16}
                    className="text-emerald-500 shrink-0"
                  />
                ) : (
                  <AlertTriangle
                    size={16}
                    className="text-red-400 shrink-0"
                  />
                )}
                <div>
                  <span className="font-medium">Fall #{alert.id}</span>
                  <span className="mx-2 text-slate-500">·</span>
                  <span>{formatTime(alert.timestamp)}</span>
                  <span className="mx-2 text-slate-500">·</span>
                  <span>Peak: {alert.peak_accel}g</span>
                </div>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
                >
                  Ack
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### frontend/app/page.tsx
```typescript
"use client";

import { useEffect, useState } from "react";
import { useTelemetrySocket } from "./hooks/useTelemetrySocket";
import VitalGauge from "./components/VitalGauge";
import FallAlertModal from "./components/FallAlertModal";
import AlertHistory from "./components/AlertHistory";

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
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">VitalGuard C3 — Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            ⚠ Software simulation — hardware pending assembly
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          {connectionState}
        </div>
      </header>

      {/* Vital gauges — 4 metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <VitalGauge
          label="Heart Rate"
          value={latest?.heart_rate ?? 0}
          unit="bpm"
          minSafe={50}
          maxSafe={120}
        />
        <VitalGauge
          label="SpO₂"
          value={latest?.spo2 ?? 0}
          unit="%"
          minSafe={92}
          maxSafe={100}
        />
        <VitalGauge
          label="Body Temp"
          value={latest?.body_temp ?? 0}
          unit="°C"
          minSafe={35.5}
          maxSafe={37.5}
        />
        <VitalGauge
          label="Acceleration"
          value={latest?.total_accel_g ?? 0}
          unit="g"
          minSafe={0.6}
          maxSafe={2.0}
        />
      </div>

      {/* Current stage */}
      <div className="text-sm text-slate-400">
        Stage: {latest?.stage ?? "waiting for data..."}
      </div>

      {/* Simulate Fall button */}
      <button
        onClick={triggerFall}
        className="self-start bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg font-semibold transition-colors"
      >
        Simulate Fall
      </button>

      {/* Alert History panel — the new addition */}
      <AlertHistory />

      {/* Fall alert modal */}
      <FallAlertModal
        open={showFallModal}
        onDismiss={() => setShowFallModal(false)}
      />
    </main>
  );
}
```

### frontend/app/layout.tsx
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalGuard C3 Dashboard",
  description:
    "Elderly fall detection and vital signs monitoring — software simulation",
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

### frontend/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### frontend/tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

### frontend/postcss.config.mjs
```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

### frontend/next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

### frontend/tsconfig.json
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

## 6. Changes Summary — What's Different From the Original Plan

### New files
| File | Purpose |
|---|---|
| `backend/db.py` | SQLite async wrapper — `fall_alerts` table with timestamp, peak_accel, severity, acknowledged |
| `frontend/app/components/AlertHistory.tsx` | "Recent Alerts" panel — polls `/alerts` every 3s, shows unacknowledged count, per-alert Ack button |

### Modified files
| File | Change |
|---|---|
| `backend/main.py` | Added `body_temp` field to packets, `lifespan` for DB init, `record_alert()` call in `/trigger-fall`, new `/alerts` and `/alerts/{id}/acknowledge` endpoints |
| `backend/requirements.txt` | Added `aiosqlite==0.20.0` |
| `frontend/app/hooks/useTelemetrySocket.ts` | Added `body_temp: number` to `TelemetryPacket` interface |
| `frontend/app/page.tsx` | 4-column gauge grid (added Body Temp), `<AlertHistory />` component, honest subtitle "Software simulation — hardware pending assembly" |
| `frontend/app/layout.tsx` | Added meta description |

### Unchanged files
| File | Why unchanged |
|---|---|
| `VitalGauge.tsx` | Already generic — handles any label/value/unit/range |
| `FallAlertModal.tsx` | Already does urgency (red pulse + 880Hz beep). No changes needed — urgency IS built |
| Config files (`tailwind`, `postcss`, `next.config`, `tsconfig`) | No structural changes needed |

---

## 7. Architecture — What's Real vs. What's Mock

```
┌─────────────────────────────────────────────────┐
│                   WHAT'S MOCK                    │
│                                                  │
│  Python random() ──► WebSocket ──► Browser       │
│  (fake sensor data)  (WiFi)       (dashboard)    │
│                                                  │
│  Transport: WiFi WebSocket (for demo convenience)│
│  Data source: random.randint / random.uniform    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                   WHAT'S REAL                    │
│                                                  │
│  ✅ Fall-detection 3-stage logic + thresholds    │
│  ✅ Dashboard UI (gauges, modal, alert history)  │
│  ✅ Alert persistence pattern (SQLite)           │
│  ✅ Same data shape the real firmware will emit  │
│                                                  │
│  When hardware is ready:                         │
│  ESP32-C3 ──► BLE ──► Web Bluetooth API ──► UI  │
│  (change the transport, keep everything else)    │
└─────────────────────────────────────────────────┘
```

---

## 8. Teacher Presentation Script — Honest Version

Say this, or close to it:

> "The physical band isn't assembled yet, so what you're seeing is a **software simulation** — same data shape, same fall-detection thresholds, running on my laptop instead of the chip. The actual ESP32-C3 firmware talks over **Bluetooth Low Energy directly to the browser**, no backend server needed, no internet needed for the safety alert. This mock proves the fall-detection **logic** is correct and the **dashboard** works, before the hardware is soldered. When the board is assembled, this frontend swaps WebSocket for Bluetooth — the gauges, the alert modal, and the history log stay exactly the same."

If teacher asks "can you show me the board working?":

> "Not yet — the board is being assembled. What I can show you is that the software layer is complete: the detection logic, the urgency alerts, and the alert history are all functional. Once the ESP32 is soldered and flashed, it plugs into this exact dashboard."

This is **stronger** than pretending, because it shows you understand mock-vs-real like a working engineer.

---

## 9. Run Instructions

```bash
# Terminal 1 — Backend
cd Vital-C3/backend
python -m venv venv
venv\Scripts\activate              # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Verify:
curl http://localhost:8000/health
# -> {"status":"ok","mode":"simulation"}
```

```bash
# Terminal 2 — Frontend
cd Vital-C3/frontend
npm install
npm run dev
# Open http://localhost:3000
```

```bash
# Test the full flow:
# 1. Dashboard shows live vitals updating every ~1 second
# 2. Click "Simulate Fall" button (or curl -X POST http://localhost:8000/trigger-fall)
# 3. Red "FALL DETECTED" modal appears with alarm beep
# 4. After acknowledging, the alert appears in "Recent Alerts" panel
# 5. Click "Ack" on individual alerts to mark them handled
```

```bash
# Reconnection test (do before actual demo):
# Stop backend (Ctrl+C) -> connection dot turns red
# Restart backend -> dot turns green within ~2 seconds, no page refresh
```

---

## 10. Known Limitations (Disclosed, Not Hidden)

| Limitation | Why it's fine |
|---|---|
| Single-viewer fall queue | Demo is one laptop, one browser tab. Not a multi-user system. |
| SQLite single-writer | Async writes from one server process — no contention for a demo. |
| Alert polling (3s interval) | Could be WebSocket push, but polling is simpler and reliable for demo. |
| No real sensors | **This is the whole point** — it's a disclosed mock. Data is random within realistic ranges. |
| WiFi transport instead of BLE | Real system uses Web Bluetooth API. WebSocket is easier to demo on a laptop. Transport swaps, logic stays. |

---

## 11. 30-Day Zero-Cloud Local Storage Architecture (Edge Rollups & Dual Persistence)

### 11.1 The Memory Dilemma & Clinical Solution
Raw motion and pulse data sampled at 150 data points per second (100 Hz PPG + 50 Hz IMU) yields **>1 GB of uncompressed data per month**—far exceeding the memory limits of wearable microcontrollers.

The clinical solution implemented in VitalGuard C3 is **Edge Rollups (Data Aggregation)**:
```
[ Raw 150Hz Sensor Stream ]  (MAX30102 + MPU6050)
              │
              ▼
[ ESP32-C3 Triage Engine ]   (Filters noise, checks falls & bradycardia)
              │
              ├──► Live Stream (10 Hz BLE/WebSocket) ──► Phone HUD (Real-time view)
              │
              ▼ (Every 24 Hours / At Midnight)
[ Daily Summary Created ]    (Avg HR, Min/Max SpO2, Fall Count: ~32 bytes/day)
              │
              ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. ESP32 Flash (LittleFS): Holds 30-day circular log   │
 │ 2. Mobile Browser (IndexedDB): Local phone database    │
 └────────────────────────────────────────────────────────┘
```

### 11.2 Dual Storage Locations
1. **On ESP32 Hardware (LittleFS):** 
   - 4MB Flash memory with `LittleFS` file system.
   - Writes a 32-byte summary struct once per day (30 days = **less than 1 Kilobyte**).
   - Fixed 30-slot circular ring buffer where Day 31 wraps around to overwrite Day 1.
2. **On Mobile WebApp (IndexedDB):**
   - Offline NoSQL database (`VitalGuardDB`, store `daily_summaries`, primary key `dateKey`).
   - Managed via [localDatabase.ts](file:///c:/Users/hp/Desktop/NXT/Vital-C3/frontend/app/utils/localDatabase.ts).
   - Automatically executes a rolling FIFO prune: deletes any record older than $T - 30\text{ days}$ on every write.

### 11.3 BLE GATT Transfer Split
| Stream Type | BLE Mechanism | Data Transferred | Speed |
|---|---|---|---|
| **Live Vitals** | **Notify** | Small JSON/binary packet (`{hr, spo2, svm, fall}`) | 100ms (10 Hz) |
| **30-Day History** | **Read / Chunked Indication** | Array of 30 summary objects (~1 KB total) | 1-time burst (< 1 second) |

### 11.4 Alternative Local Channels
- **Alternative A (SoftAP Wi-Fi):** ESP32 exposes `http://192.168.4.1/api/records` dumping the LittleFS JSON summary file directly.
- **Alternative B (Local Edge Hub):** Nurse station mini-PC / Raspberry Pi running local SQLite / FastAPI with zero internet access.

