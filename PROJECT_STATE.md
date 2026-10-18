# VITALGUARD C3 — LIVING ARCHITECTURE & STATE MAP

## 1. Executive Architecture
- **Backend:** FastAPI (Python 3.11) + Uvicorn on Render (`backend/main.py`)
- **Database:** `aiosqlite` WAL mode (`backend/alerts.db`), tables: `alerts`, `guardians`, `passkeys`
- **Streaming:** WebSockets (`/ws/telemetry`) with decoupled, non-blocking broadcast queues
- **Local DB:** IndexedDB (`VitalGuardDB` for 30-day FIFO telemetry; `VitalGuardAuthDB` for WebAuthn passkeys)
- **Hardware Link:** Web Bluetooth Low Energy GATT (`WebBluetoothBand.ts` / `firmware/VitalGuard_ESP32.ino`) @ 100 Hz MPU6050 + MAX30102 PPG
- **Frontend:** Next.js 14 App Router, dual-mode theme system (dark/light), PWA enabled on Vercel

## 2. File & Symbol Map (Zero-Scan Index)
- `backend/main.py`: FastAPI app factory, lifespan auto-seed, WS `/ws/telemetry`, REST `/alerts`, `/alerts/trigger`, `/alerts/{id}/dismiss`
- `backend/auth.py`: WebAuthn & PIN authentication, JWT issuance/validation, password hashing
- `backend/db.py`: `aiosqlite` WAL connection pool, short async transactions, schema migrations (`init_db`)
- `backend/models.py`: Pydantic V2 schemas with `extra='forbid'` (`AlertCreate`, `AlertResponse`, `TelemetryFrame`, `AuthRequest`)
- `backend/limiter.py`: SlowAPI rate limiting (5/min on auth endpoints, 60/min on API)
- `frontend/app/page.tsx`: Clinical HUD dashboard (Vitals, Records, Safety tabs), 3D canvas background, settings sheet
- `frontend/app/login/page.tsx`: Passkey (WebAuthn) biometric login with numeric PIN fallback and offline resilience
- `frontend/app/records/page.tsx`: 30-Day FIFO local audit log viewer with CSV/JSON export
- `frontend/app/data/MockBand.ts`: 90-second realistic physiological simulation loop (68–74 BPM, 3.82G fall event, recovery)
- `frontend/app/data/WebBluetoothBand.ts`: Web Bluetooth GATT client (Heart Rate `0x180D`, kinetic impact SVM characteristics)
- `frontend/app/context/telemetryStorage.ts`: Rolling IndexedDB persistence for 100 Hz MPU6050 and MAX30102 frames
- `frontend/app/context/authDatabase.ts`: IndexedDB `VitalGuardAuthDB` (`sessions`, `credentials` stores) with auto-seed fallback
- `firmware/VitalGuard_ESP32.ino`: XIAO ESP32-C3 firmware; I2C MAX30102 + MPU6050, 3-stage SVM fall algorithm, BLE GATT advertising

## 3. Database Schema Overview
- `alerts`: `(id INTEGER PRIMARY KEY, guardian_id TEXT, patient_id TEXT, event_type TEXT, impact_g REAL, heart_rate INTEGER, spo2 INTEGER, status TEXT, created_at TEXT)`
- `guardians`: `(id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, phone TEXT, hashed_pin TEXT, created_at TEXT)`
- `passkeys`: `(id TEXT PRIMARY KEY, guardian_id TEXT, credential_id TEXT UNIQUE, public_key TEXT, counter INTEGER, created_at TEXT)`
- `VitalGuardDB` (IndexedDB): Object store `dailyRecords` with 30-day FIFO cursor eviction
- `VitalGuardAuthDB` (IndexedDB): Object stores `sessions` and `credentials` for local offline authentication

## 4. Active Invariants & Security Hardening
- **Zero-Trust Security:** Pydantic `extra='forbid'`, strict parameterization with `?` in all SQL queries, 0 dynamic execution.
- **SQLite Concurrency:** Short async transactions, never hold transactions across WebSockets or network calls.
- **Fail-Closed Auth:** WebAuthn + PIN authentication required; `/ws/telemetry` frame size capped at 16KB.
- **No Full-Codebase Scans:** Rely on `CODEMAP.md` and this file for context.

## 5. Active Session Status & Immediate Next Steps
- **Current Milestone:** All clean code committed and pushed to GitHub; dual-mode theme, auth gate, auto-seed trick, and token saver rules deployed.
- **Last Modified Files:** `.antigravityignore`, `.geminiignore`, `CODEMAP.md`, `opus-engine.md`, `PROJECT_STATE.md`, `GEMINI.md`
- **Current Status:** App live and returning 200 OK on Vercel (`vitalguard-c3.vercel.app`).
- **Next Immediate Step:** Optional Red-Team audit of backend route parameterization or BLE packet fuzzing validation in `MockBand.ts`/`telemetryStorage.ts`.
