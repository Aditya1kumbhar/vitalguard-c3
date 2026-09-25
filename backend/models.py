from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TelemetryPacket(BaseModel):
    heart_rate: int
    spo2: int
    body_temp: float
    accel_x: float
    accel_y: float
    accel_z: float
    svm: float
    accel_magnitude: Optional[float] = None
    status: Optional[str] = None
    fall_detected: bool
    stage: str
    timestamp: str

class PatientInfo(BaseModel):
    id: int
    name: str
    age: int
    room_number: str
    medical_history: str
    baseline_hr: float
    baseline_spo2: float
    baseline_temp: float

class DailySummary(BaseModel):
    date: str
    hr_min: int
    hr_max: int
    hr_avg: float
    spo2_min: int
    spo2_max: int
    spo2_avg: float
    temp_min: float
    temp_max: float
    temp_avg: float
    svm_max: float
    anomaly_count: int
    sample_count: int

class RiskAssessment(BaseModel):
    overall_score: float
    risk_level: str
    factors: List[Dict[str, Any]]
    recommendation: str
