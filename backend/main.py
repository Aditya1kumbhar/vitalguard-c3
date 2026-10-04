"""
VitalGuard C3 - Mock Telemetry Server
DISCLOSED SIMULATION: Generates simulated sensor data.
Features Phase 2 upgrade: 3-axis accelerometer simulation, SVM computation,
and data persistence for longitudinal analytics.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import random
import math
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from models import TelemetryPacket, PatientInfo, DailySummary, RiskAssessment
from db import (
    init_db,
    record_alert,
    get_recent_alerts,
    get_alert_by_id,
    acknowledge_alert,
    clear_all_alerts,
    record_vital_sample,
    get_patient,
    get_db_connection
)
from analytics import calculate_risk_score
import auth


# ── Packet generators ────────────────────────────────────────────────
def normal_packet() -> TelemetryPacket:
    # Simulate normal movement (near 1.0g resting)
    ax, ay, az = random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(0.9, 1.1)
    svm = round(math.sqrt(ax**2 + ay**2 + az**2), 2)
    hr = random.randint(60, 100)
    return TelemetryPacket(
        heart_rate=hr,
        spo2=random.randint(95, 100),
        body_temp=round(random.uniform(36.1, 37.2), 1),
        accel_x=round(ax, 2),
        accel_y=round(ay, 2),
        accel_z=round(az, 2),
        svm=svm,
        accel_magnitude=round(svm * 9.81, 2),
        status="BRADYCARDIA" if hr < 50 else "NORMAL",
        fall_detected=False,
        stage="normal",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def stage_packet(total_accel_g: float, fall_detected: bool, stage: str) -> TelemetryPacket:
    hr = random.randint(105, 125) if fall_detected else random.randint(60, 100)
    ax = random.uniform(0, total_accel_g * 0.5)
    ay = random.uniform(0, total_accel_g * 0.5)
    az = math.sqrt(abs(total_accel_g**2 - ax**2 - ay**2))
    
    # Randomly flip signs for realism
    if random.choice([True, False]): ax = -ax
    if random.choice([True, False]): ay = -ay
    if random.choice([True, False]): az = -az
    
    svm = round(math.sqrt(ax**2 + ay**2 + az**2), 2)
    status_str = "CRITICAL_FALL" if fall_detected else ("BRADYCARDIA" if hr < 50 else "NORMAL")
    
    return TelemetryPacket(
        heart_rate=hr,
        spo2=random.randint(95, 100),
        body_temp=round(random.uniform(36.1, 37.2), 1),
        accel_x=round(ax, 2),
        accel_y=round(ay, 2),
        accel_z=round(az, 2),
        svm=svm,
        accel_magnitude=round(svm * 9.81, 2),
        status=status_str,
        fall_detected=fall_detected,
        stage=stage,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# ── Telemetry Broadcaster (Multi-Client & Concurrency Safe) ─────────
class TelemetryBroadcaster:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[TelemetryPacket]]] = {}
        self.fall_sequence_queue: "asyncio.Queue[tuple[str, TelemetryPacket]]" = asyncio.Queue()
        self._latest_packet: dict[str, TelemetryPacket] = {}
        self._task: Optional[asyncio.Task] = None

    def get_latest(self, band_id: str) -> TelemetryPacket:
        return self._latest_packet.get(band_id) or normal_packet()

    @property
    def subscriber_count(self) -> int:
        return sum(len(s) for s in self._subscribers.values())

    def register(self, band_id: str) -> asyncio.Queue[TelemetryPacket]:
        if band_id not in self._subscribers:
            self._subscribers[band_id] = set()
        client_queue: asyncio.Queue[TelemetryPacket] = asyncio.Queue(maxsize=30)
        self._subscribers[band_id].add(client_queue)
        return client_queue

    def unregister(self, band_id: str, client_queue: asyncio.Queue[TelemetryPacket]) -> None:
        if band_id in self._subscribers:
            self._subscribers[band_id].discard(client_queue)
            if not self._subscribers[band_id]:
                del self._subscribers[band_id]

    def broadcast(self, band_id: str, packet: TelemetryPacket) -> None:
        self._latest_packet[band_id] = packet
        if band_id in self._subscribers:
            for q in list(self._subscribers[band_id]):
                try:
                    q.put_nowait(packet)
                except asyncio.QueueFull:
                    try:
                        q.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                    try:
                        q.put_nowait(packet)
                    except asyncio.QueueFull:
                        pass

    async def _run_loop(self) -> None:
        while True:
            try:
                # We can broadcast to all active band_ids
                for band_id in list(self._subscribers.keys()):
                    packet = normal_packet()
                    self.broadcast(band_id, packet)
            except Exception:
                pass
            
            try:
                while not self.fall_sequence_queue.empty():
                    band_id, packet = self.fall_sequence_queue.get_nowait()
                    self.broadcast(band_id, packet)
            except Exception:
                pass
            
            await asyncio.sleep(1)

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run_loop())

    def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()

broadcaster = TelemetryBroadcaster()

# ── Lifespan ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    # Seed a default patient if one doesn't exist
    async with get_db_connection() as db:
        res = await db.execute("SELECT COUNT(*) FROM patients")
        count = (await res.fetchone())[0]
        if count == 0:
            ts = datetime.now(timezone.utc).isoformat()
            await db.execute("""
                INSERT INTO patients (name, age, room_number, medical_history, admitted_at)
                VALUES ('Ramesh K.', 78, '204', 'Hypertension, Mild cognitive impairment', ?)
            """, (ts,))
            await db.commit()

        # Seed 30-day baseline history if empty so trend charts and risk score work immediately
        res_vitals = await db.execute("SELECT COUNT(*) FROM vitals_daily_summary")
        vitals_count = (await res_vitals.fetchone())[0]
        if vitals_count == 0:
            from seed import seed_data
            await seed_data()
            
    broadcaster.start()
    yield
    broadcaster.stop()


app = FastAPI(title="VitalGuard C3 Mock Telemetry", lifespan=lifespan)

app.include_router(auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket stream ─────────────────────────────────────────────────
@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket, token: Optional[str] = Query(None)) -> None:
    band_id = "VG-C3-0001"
    if token:
        try:
            guardian = await auth.get_current_guardian(token)
            band_id = guardian.get("band_id", "VG-C3-0001")
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await websocket.accept()
    client_queue = broadcaster.register(band_id)
    try:
        await websocket.send_text(broadcaster.get_latest(band_id).model_dump_json())
        while True:
            packet = await client_queue.get()
            await websocket.send_text(packet.model_dump_json())
    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        return
    except Exception:
        return
    finally:
        broadcaster.unregister(band_id, client_queue)


# ── Fall trigger (demo button) ───────────────────────────────────────
@app.post("/api/trigger-fall")
@app.post("/trigger-fall")
async def trigger_fall(guardian: dict = Depends(auth.get_current_guardian)) -> dict:
    peak_accel = round(random.uniform(2.8, 4.5), 1)

    await broadcaster.fall_sequence_queue.put((guardian["band_id"], stage_packet(0.3, False, "free_fall_dip")))
    await broadcaster.fall_sequence_queue.put((guardian["band_id"], stage_packet(peak_accel, True, "impact_spike")))
    await broadcaster.fall_sequence_queue.put((guardian["band_id"], stage_packet(1.0, False, "post_fall_stillness")))

    alert_id = await record_alert(band_id=guardian["band_id"], peak_accel=peak_accel, severity="high")

    return {
        "status": "fall sequence queued",
        "stages": 3,
        "alert_id": alert_id,
        "peak_accel": peak_accel,
    }


@app.post("/api/reset-fall")
@app.post("/reset-fall")
async def reset_fall(guardian: dict = Depends(auth.get_current_guardian)) -> dict:
    while not broadcaster.fall_sequence_queue.empty():
        try:
            broadcaster.fall_sequence_queue.get_nowait()
        except asyncio.QueueEmpty:
            break
    packet = normal_packet()
    broadcaster.broadcast(guardian["band_id"], packet)
    return {"status": "cleared", "message": "Fall alert cleared"}


@app.get("/api/records")
@app.get("/records")
async def get_records(days: int = 30, guardian: dict = Depends(auth.get_current_guardian)) -> list[dict]:
    """
    30-day summary rollups as stored in ESP32 LittleFS or local edge hub.
    Each day is ~32 bytes (avg HR, avg SpO2, fall incidents, timestamp).
    """
    import time
    base_time = int(time.time()) - (days * 86400)
    records = []
    for day in range(days):
        records.append({
            "day": f"Day {day + 1}",
            "timestamp": base_time + (day * 86400),
            "avg_heart_rate": random.randint(68, 76),
            "avg_spo2": random.randint(96, 99),
            "fall_incidents": 1 if day in [5, 18] else 0,
        })
    return records


# ── REST endpoints (Legacy & New Phase 2) ────────────────────────────

@app.get("/alerts")
async def list_alerts(limit: int = Query(default=20, ge=1, le=100), guardian: dict = Depends(auth.get_current_guardian)) -> list[dict]:
    return await get_recent_alerts(band_id=guardian["band_id"], limit=limit)

@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: int, guardian: dict = Depends(auth.get_current_guardian)) -> dict:
    alert = await get_alert_by_id(band_id=guardian["band_id"], alert_id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@app.post("/alerts/{alert_id}/acknowledge")
async def ack_alert(alert_id: int, guardian: dict = Depends(auth.get_current_guardian)) -> dict:
    updated = await acknowledge_alert(band_id=guardian["band_id"], alert_id=alert_id)
    return {"acknowledged": updated, "id": alert_id}

@app.delete("/alerts")
@app.post("/alerts/clear")
async def clear_alerts(guardian: dict = Depends(auth.get_current_guardian)) -> dict:
    deleted_count = await clear_all_alerts(band_id=guardian["band_id"])
    return {"status": "cleared", "deleted_count": deleted_count}

@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "mode": "simulation",
        "active_clients": broadcaster.subscriber_count,
    }

# ── New Phase 2 Analytics Endpoints ──

@app.get("/patient", response_model=PatientInfo)
async def get_patient_info(guardian: dict = Depends(auth.get_current_guardian)):
    patient = await get_patient(1)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.get("/analytics/daily")
async def get_daily_analytics(days: int = Query(default=30, ge=1, le=90), guardian: dict = Depends(auth.get_current_guardian)) -> list[DailySummary]:
    """Returns aggregated daily summaries for trend charts."""
    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT * FROM vitals_daily_summary WHERE patient_id = 1 ORDER BY date ASC LIMIT ?",
            (days,)
        )
        rows = await cursor.fetchall()
        return [DailySummary(**dict(r)) for r in rows]

@app.get("/analytics/risk-score", response_model=RiskAssessment)
async def get_risk_score(guardian: dict = Depends(auth.get_current_guardian)):
    """Computes a heuristic risk score based on the last 30 days of data."""
    async with get_db_connection() as db:
        # Get raw vitals from the last day for the scoring engine (to simulate recent check)
        cursor = await db.execute(
            "SELECT heart_rate, spo2, body_temp, svm FROM vitals_raw WHERE patient_id = 1 ORDER BY id DESC LIMIT 1000"
        )
        vitals = [dict(r) for r in await cursor.fetchall()]
        
        # Get fall count for this band
        cursor = await db.execute("SELECT COUNT(*) FROM fall_alerts WHERE band_id = ?", (guardian["band_id"],))
        fall_count = (await cursor.fetchone())[0]
        
    score_data = calculate_risk_score(vitals, fall_count)
    return RiskAssessment(**score_data)
