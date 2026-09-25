import asyncio
from datetime import datetime, timedelta, timezone
import random
import math
from db import init_db, get_db_connection

async def seed_data():
    await init_db()
    async with get_db_connection() as db:
        # Clear existing seeded data to avoid duplicates
        await db.execute("DELETE FROM vitals_daily_summary")
        await db.execute("DELETE FROM vitals_raw")
        await db.execute("DELETE FROM fall_incidents")
        await db.execute("DELETE FROM fall_alerts")
        
        print("Seeding 30 days of patient history...")
        now = datetime.now(timezone.utc)
        
        for day_offset in range(30, 0, -1):
            date = (now - timedelta(days=day_offset)).strftime("%Y-%m-%d")
            
            # Generate daily stats with some realistic variance
            hr_min = random.randint(45, 55)
            hr_max = random.randint(90, 120)
            hr_avg = round(random.uniform(65, 75), 1)
            
            spo2_min = random.randint(88, 94)
            spo2_max = random.randint(98, 100)
            spo2_avg = round(random.uniform(95, 98), 1)
            
            temp_min = round(random.uniform(36.0, 36.3), 1)
            temp_max = round(random.uniform(36.9, 37.5), 1)
            temp_avg = round(random.uniform(36.5, 36.8), 1)
            
            svm_max = round(random.uniform(1.2, 2.5), 2)
            
            anomaly_count = 1 if random.random() > 0.8 else 0
            
            await db.execute("""
                INSERT INTO vitals_daily_summary 
                (patient_id, date, hr_min, hr_max, hr_avg, spo2_min, spo2_max, spo2_avg, temp_min, temp_max, temp_avg, svm_max, anomaly_count, sample_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                1, date, hr_min, hr_max, hr_avg, spo2_min, spo2_max, spo2_avg, 
                temp_min, temp_max, temp_avg, svm_max, anomaly_count, 1440
            ))
            
            # Inject a fall on a couple random days
            if random.random() > 0.85:
                ts = (now - timedelta(days=day_offset, hours=random.randint(1, 23))).isoformat()
                peak_g = round(random.uniform(2.8, 4.5), 2)
                await db.execute("""
                    INSERT INTO fall_alerts (timestamp, peak_accel, severity, acknowledged)
                    VALUES (?, ?, 'high', 0)
                """, (ts, peak_g))
                
        # Generate 1000 rows of raw 1Hz data for the risk engine to score (about 16 minutes)
        print("Seeding recent raw telemetry...")
        base_time = now - timedelta(minutes=16)
        raw_rows = []
        for i in range(1000):
            ts = (base_time + timedelta(seconds=i)).isoformat()
            hr = random.randint(60, 100)
            spo2 = random.randint(95, 100)
            
            # Occasional dips for the risk score engine to find
            if i % 150 == 0: 
                hr = 45
                spo2 = 89
                
            temp = round(random.uniform(36.1, 37.2), 1)
            ax, ay, az = random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(0.9, 1.1)
            svm = round(math.sqrt(ax**2 + ay**2 + az**2), 2)
            
            # Occasional high agitation
            if i % 80 == 0: 
                svm = 2.8
                
            raw_rows.append((1, ts, hr, spo2, temp, ax, ay, az, svm))
            
        await db.executemany("""
            INSERT INTO vitals_raw 
            (patient_id, timestamp, heart_rate, spo2, body_temp, accel_x, accel_y, accel_z, svm)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, raw_rows)
        
        await db.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
