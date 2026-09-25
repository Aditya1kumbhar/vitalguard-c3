"""
Lightweight alert-history and analytics store.
Implements the 4-table schema for the Phase 2 upgrade while
maintaining backward compatibility for Phase 1 code.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import math
from pathlib import Path
from typing import AsyncGenerator, Optional, List, Dict, Any
import aiosqlite

DB_PATH = (Path(__file__).parent / "alerts.db").resolve()

@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Context manager providing an aiosqlite connection with:
      - WAL mode enabled (concurrency support)
      - busy_timeout set per-connection (prevents 'database is locked' errors)
      - synchronous=NORMAL (safe and fast with WAL)
      - row_factory configured for dictionary-style access
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH, timeout=10.0) as db:
        await db.execute("PRAGMA busy_timeout=5000;")
        await db.execute("PRAGMA synchronous=NORMAL;")
        db.row_factory = aiosqlite.Row
        yield db

async def init_db() -> None:
    """Create the 4-table schema and indices if they do not exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with get_db_connection() as db:
        # WAL mode persists in the database file once set
        await db.execute("PRAGMA journal_mode=WAL;")
        
        # 1. Patient Registry
        await db.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                name            TEXT    NOT NULL,
                age             INTEGER NOT NULL,
                room_number     TEXT    NOT NULL,
                medical_history TEXT    DEFAULT '',
                baseline_hr     REAL    DEFAULT 72.0,
                baseline_spo2   REAL    DEFAULT 97.0,
                baseline_temp   REAL    DEFAULT 36.6,
                admitted_at     TEXT    NOT NULL,
                active          INTEGER NOT NULL DEFAULT 1
            )
        """)
        
        # 2. High-Frequency Vitals (time-series)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS vitals_raw (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id   INTEGER NOT NULL REFERENCES patients(id),
                timestamp    TEXT    NOT NULL,
                heart_rate   INTEGER NOT NULL,
                spo2         INTEGER NOT NULL,
                body_temp    REAL    NOT NULL,
                accel_x      REAL    NOT NULL DEFAULT 0.0,
                accel_y      REAL    NOT NULL DEFAULT 0.0,
                accel_z      REAL    NOT NULL DEFAULT 0.0,
                svm          REAL    NOT NULL DEFAULT 1.0,
                activity     TEXT    NOT NULL DEFAULT 'resting'
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_vitals_patient_ts ON vitals_raw (patient_id, timestamp DESC)")
        
        # 3. Daily Summary Rollups
        await db.execute("""
            CREATE TABLE IF NOT EXISTS vitals_daily_summary (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id   INTEGER NOT NULL REFERENCES patients(id),
                date         TEXT    NOT NULL,
                hr_min       INTEGER, hr_max   INTEGER, hr_avg REAL,
                spo2_min     INTEGER, spo2_max INTEGER, spo2_avg REAL,
                temp_min     REAL,    temp_max REAL,    temp_avg REAL,
                svm_max      REAL,
                anomaly_count INTEGER NOT NULL DEFAULT 0,
                sample_count  INTEGER NOT NULL DEFAULT 0,
                UNIQUE(patient_id, date)
            )
        """)
        
        # 4. Fall Incidents
        await db.execute("""
            CREATE TABLE IF NOT EXISTS fall_incidents (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id           INTEGER NOT NULL REFERENCES patients(id),
                timestamp            TEXT    NOT NULL,
                peak_g_force         REAL    NOT NULL,
                pre_impact_svm       REAL,
                post_impact_stillness_sec REAL,
                severity             TEXT    NOT NULL DEFAULT 'high',
                status               TEXT    NOT NULL DEFAULT 'unacknowledged',
                doctor_notes         TEXT    DEFAULT '',
                acknowledged_at      TEXT,
                acknowledged_by      TEXT
            )
        """)

        # --- Phase 1 Legacy Table for Backward Compatibility ---
        await db.execute("""
            CREATE TABLE IF NOT EXISTS fall_alerts (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp    TEXT    NOT NULL,
                peak_accel   REAL    NOT NULL,
                severity     TEXT    NOT NULL DEFAULT 'high',
                acknowledged INTEGER NOT NULL DEFAULT 0
            )
        """)
        
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_fall_alerts_ack_id
            ON fall_alerts (acknowledged, id DESC)
        """)
        
        await db.commit()

# =====================================================================
# Phase 1 Legacy Functions (Maintained so main.py doesn't break yet)
# =====================================================================

async def record_alert(peak_accel: float, severity: str = "high") -> int:
    """Insert a fall alert. Used by Phase 1 code."""
    try:
        val = float(peak_accel)
        if not math.isfinite(val) or val < 0:
            val = 2.5
    except (TypeError, ValueError):
        val = 2.5

    clean_severity = str(severity).lower().strip()
    if clean_severity not in ("low", "medium", "high", "critical"):
        clean_severity = "high"

    ts = datetime.now(timezone.utc).isoformat()
    async with get_db_connection() as db:
        cursor = await db.execute(
            "INSERT INTO fall_alerts (timestamp, peak_accel, severity) VALUES (?, ?, ?)",
            (ts, round(val, 2), clean_severity),
        )
        await db.commit()
        return int(cursor.lastrowid or 0)

async def get_recent_alerts(limit: int = 20) -> list[dict]:
    """Return recent alerts from Phase 1 table."""
    try:
        safe_limit = max(1, min(int(limit), 100))
    except (TypeError, ValueError):
        safe_limit = 20

    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT id, timestamp, peak_accel, severity, acknowledged FROM fall_alerts ORDER BY id DESC LIMIT ?",
            (safe_limit,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

async def get_alert_by_id(alert_id: int) -> Optional[dict]:
    """Retrieve an alert by ID from Phase 1 table."""
    try:
        clean_id = int(alert_id)
        if clean_id <= 0: return None
    except (TypeError, ValueError): return None

    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT id, timestamp, peak_accel, severity, acknowledged FROM fall_alerts WHERE id = ?",
            (clean_id,),
        )
        row = await cursor.fetchone()
        return dict(row) if row else None

async def acknowledge_alert(alert_id: int) -> bool:
    """Acknowledge Phase 1 alert."""
    try:
        clean_id = int(alert_id)
        if clean_id <= 0: return False
    except (TypeError, ValueError): return False

    async with get_db_connection() as db:
        cursor = await db.execute(
            "UPDATE fall_alerts SET acknowledged = 1 WHERE id = ?",
            (clean_id,),
        )
        await db.commit()
        return cursor.rowcount > 0

async def clear_all_alerts() -> int:
    """Clear Phase 1 alerts."""
    async with get_db_connection() as db:
        cursor = await db.execute("DELETE FROM fall_alerts")
        await db.commit()
        return cursor.rowcount

# =====================================================================
# Phase 2 New Functions
# =====================================================================

async def get_patient(patient_id: int = 1) -> Optional[dict]:
    """Get patient details."""
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None

async def record_vital_sample(
    patient_id: int, hr: int, spo2: int, temp: float, 
    ax: float, ay: float, az: float, svm: float
) -> None:
    """Record a 1Hz telemetry reading."""
    ts = datetime.now(timezone.utc).isoformat()
    async with get_db_connection() as db:
        await db.execute("""
            INSERT INTO vitals_raw (patient_id, timestamp, heart_rate, spo2, body_temp, accel_x, accel_y, accel_z, svm)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (patient_id, ts, hr, spo2, temp, ax, ay, az, svm))
        await db.commit()
