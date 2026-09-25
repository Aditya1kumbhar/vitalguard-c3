from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import math
import random
import time
from datetime import datetime, timedelta

app = FastAPI(title='VitalGuard-C3 Local Telemetry Bridge')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

active_connections: list[WebSocket] = []
fall_alert_active = False

alerts_db = [
    {
        "id": 1,
        "timestamp": datetime.now().isoformat(),
        "peak_accel": 28.4,
        "severity": "high",
        "acknowledged": False
    }
]

@app.websocket('/ws/telemetry')
async def telemetry_websocket(websocket: WebSocket):
    global fall_alert_active
    await websocket.accept()
    active_connections.append(websocket)
    t = 0.0
    try:
        while True:
            t += 0.1
            if fall_alert_active:
                ax = round(random.uniform(12.0, 16.0), 2)
                ay = round(random.uniform(22.0, 26.0), 2)
                az = round(random.uniform(10.0, 14.0), 2)
                accel_mag = round(math.sqrt(ax**2 + ay**2 + az**2), 2)
                status_str = 'CRITICAL_FALL'
                fall_flag = True
                hr = random.randint(110, 130)
                spo2 = 94
            else:
                ax = round(random.uniform(-0.15, 0.15), 2)
                ay = round(9.8 + random.uniform(-0.3, 0.3), 2)
                az = round(random.uniform(-0.15, 0.15), 2)
                accel_mag = round(math.sqrt(ax**2 + ay**2 + az**2), 2)
                hr = int(72 + 6 * math.sin(t * 0.2) + random.uniform(-1, 1))
                spo2 = int(98 + random.choice([0, 0, -1, 0]))
                fall_flag = False
                status_str = 'BRADYCARDIA' if hr < 50 else 'NORMAL'

            # Accel in g-forces (for AccelWaveform: 1.0g = 9.8 m/s²)
            gx = round(ax / 9.8, 2)
            gy = round(ay / 9.8, 2)
            gz = round(az / 9.8, 2)
            svm_g = round(accel_mag / 9.8, 2)

            packet = {
                'heart_rate': hr,
                'spo2': spo2,
                'body_temp': 36.6,
                'accel_magnitude': accel_mag,
                'accel_x': gx,
                'accel_y': gy,
                'accel_z': gz,
                'svm': svm_g,
                'fall_detected': fall_flag,
                'status': status_str,
                'timestamp': int(time.time() * 1000)
            }
            await websocket.send_text(json.dumps(packet))
            await asyncio.sleep(0.1)
    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post('/api/trigger-fall')
@app.post('/trigger-fall')
async def trigger_fall():
    global fall_alert_active
    fall_alert_active = True
    new_alert = {
        "id": len(alerts_db) + 1,
        "timestamp": datetime.now().isoformat(),
        "peak_accel": 28.4,
        "severity": "high",
        "acknowledged": False
    }
    alerts_db.insert(0, new_alert)
    return {'message': 'Fall simulation triggered', 'alert_id': new_alert["id"]}

@app.post('/api/reset-fall')
@app.post('/reset-fall')
async def reset_fall():
    global fall_alert_active
    fall_alert_active = False
    normal_packet = {
        'heart_rate': 72,
        'spo2': 98,
        'body_temp': 36.6,
        'accel_magnitude': 9.8,
        'accel_x': 0.02,
        'accel_y': 1.0,
        'accel_z': 0.02,
        'svm': 1.0,
        'fall_detected': False,
        'status': 'NORMAL',
        'timestamp': int(time.time() * 1000)
    }
    for ws in list(active_connections):
        try:
            await ws.send_text(json.dumps(normal_packet))
        except Exception:
            pass
    return {'message': 'Fall alert cleared'}

@app.get('/patient')
async def get_patient():
    return {
        "id": 1,
        "name": "Device .1",
        "age": 78,
        "room_number": "204",
        "medical_history": "Hypertension, Mild cognitive impairment",
        "baseline_hr": 72.0,
        "baseline_spo2": 97.0,
        "baseline_temp": 36.6
    }

@app.get('/analytics/risk-score')
async def get_risk_score():
    return {
        "overall_score": 34,
        "risk_level": "moderate",
        "factors": [
            {
                "name": "Past Fall Incident",
                "impact": 15,
                "description": "1 impact event logged in past 30 days"
            },
            {
                "name": "Nocturnal Bradycardia Dips",
                "impact": 10,
                "description": "3 night cycles with heart rate dipping below 50 BPM"
            },
            {
                "name": "Mild Gait Irregularity",
                "impact": 9,
                "description": "Minor asymmetry detected by MPU6050 6-axis sensor"
            }
        ],
        "recommendation": "Maintain night-time bed rails, schedule weekly sensor checks, and keep autonomous Code Blue alert enabled."
    }

@app.get('/analytics/daily')
async def get_daily_analytics(days: int = 30):
    results = []
    now = datetime.now()
    for i in range(days):
        d = now - timedelta(days=days - 1 - i)
        date_str = d.strftime("%Y-%m-%d")
        results.append({
            "date": date_str,
            "hr_min": random.randint(52, 60),
            "hr_max": random.randint(95, 115),
            "hr_avg": random.randint(70, 75),
            "spo2_min": random.randint(93, 95),
            "spo2_max": 99,
            "spo2_avg": random.randint(96, 98),
            "temp_min": 36.3,
            "temp_max": 37.1,
            "temp_avg": 36.6,
            "svm_max": 2.9 if i in [5, 18] else round(random.uniform(1.1, 1.5), 2),
            "anomaly_count": 1 if i in [5, 18] else 0,
            "sample_count": 86400
        })
    return results

@app.get('/alerts')
async def get_alerts(limit: int = 10):
    return alerts_db[:limit]

@app.post('/alerts/{alert_id}/acknowledge')
async def ack_alert(alert_id: int):
    for a in alerts_db:
        if a["id"] == alert_id:
            a["acknowledged"] = True
            return {"acknowledged": True, "id": alert_id}
    return {"acknowledged": False, "id": alert_id}

@app.post('/alerts/clear')
@app.delete('/alerts')
async def clear_alerts():
    global alerts_db
    alerts_db = []
    return {"status": "cleared", "deleted_count": len(alerts_db)}

@app.get('/api/records')
@app.get('/records')
async def get_records():
    base_time = int(time.time()) - (30 * 86400)
    records = []
    for day in range(30):
        records.append({
            'day': f'Day {day + 1}',
            'timestamp': base_time + (day * 86400),
            'avg_heart_rate': random.randint(68, 76),
            'avg_spo2': random.randint(96, 99),
            'fall_incidents': 1 if day in [5, 18] else 0
        })
    return records

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
