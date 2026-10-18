# VitalGuard C3 — Architectural Codemap

## Backend (`backend/`)
- `main.py`: FastAPI app, lifespan seed, WS broadcaster. Routes: `GET/POST /alerts`, `POST /alerts/trigger`, `POST /alerts/{id}/dismiss`, `WS /ws/telemetry`. Tables: `alerts`.
- `auth.py`: WebAuthn & PIN auth, JWT creation/verify, password hashing. Routes: `/auth/register`, `/auth/login`, `/auth/verify`. Tables: `guardians`, `passkeys`.
- `db.py`: `aiosqlite` WAL connection pool, short transactions, schema migrations (`init_db`). Queries `alerts`, `guardians`, `passkeys`.
- `models.py`: Pydantic V2 schemas (`extra='forbid'`): `AlertCreate`, `AlertResponse`, `TelemetryFrame`, `AuthRequest`.
- `analytics.py`: Physiological risk engine (`compute_risk_score`, baseline deviation, SVM impact evaluation).
- `limiter.py`: SlowAPI IP & user rate limiting instances (`5/minute` on auth, `60/minute` on API).

## Frontend Core (`frontend/app/`)
- `page.tsx`: Clinical HUD dashboard. 3 tabs (Vitals, Records, Safety), 3D canvas background, settings drawer, mock/BLE toggle.
- `layout.tsx`: Root layout wrapping `AuthProvider`, `ThemeProvider`, `AmbientProvider`. PWA metadata.
- `login/page.tsx`: Passkey (WebAuthn) biometric login with numeric PIN fallback and offline resilience.
- `records/page.tsx`: 30-day FIFO local audit log viewer with CSV/JSON export and emergency log trace.
- `terms/page.tsx` & `privacy/page.tsx`: FDA Class II non-diagnostic clinical companion disclaimers & on-device zero-cloud policy.

## Frontend State & Telemetry (`frontend/app/context/` & `data/`)
- `AuthContext.tsx`: Guardian session state, route guard (`/login` redirect), auto-seed fallback.
- `authDatabase.ts`: IndexedDB `VitalGuardAuthDB` (`sessions`, `credentials` stores). Offline demo seed credentials.
- `ThemeContext.tsx`: Dark/light dual-mode theme provider syncing `data-theme` attribute and CSS custom properties.
- `telemetryStorage.ts`: IndexedDB `VitalGuardDB` cursor-based 30-day FIFO storage with bound validation.
- `localDatabase.ts`: Daily aggregate record generator and FIFO 30-day rolling eviction transaction.
- `useBand.ts`: Telemetry hook interfacing `MockBand` and `WebBluetoothBand` with component lifecycle.
- `MockBand.ts`: 90s physiological simulation loop (sinus rhythm 68–74 BPM, 3.82G fall event, recovery).
- `WebBluetoothBand.ts`: Web Bluetooth GATT driver (Heart Rate `0x180D`, kinetic impact SVM characteristics).
- `api.ts`: Typed REST client with automatic fallback for offline and local operation.

## UI Components & Tokens (`frontend/app/components/` & `design/`)
- `RiskScoreCard.tsx`, `ClinicalSummaryCard.tsx`, `HistoricalTrends.tsx`: Clinical analytical metric cards.
- `ThemeToggle.tsx`, `VitalGuardCanvasBackground.tsx`: Interactive dual-theme switcher & 3D WebGL background.
- `motion.tokens.ts`, `Card.tsx`, `Ring.tsx`, `Sheet.tsx`, `FallAlertSheet.tsx`: Fluid design tokens, haptics, slide-to-cancel fall rail.

## Firmware (`firmware/`)
- `VitalGuard_ESP32.ino`: ESP32-C3 firmware sampling MAX30102 (PPG/SpO2) and MPU6050 (50Hz SVM), BLE GATT advertising.
