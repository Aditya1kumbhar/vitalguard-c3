from typing import List, Dict, Any

def calculate_risk_score(recent_vitals: List[Dict[str, Any]], recent_falls: int) -> dict:
    """
    Computes a heuristic risk score (0-100) based on recent telemetry and events.
    Follows Phase 2 blueprint scoring metrics.
    """
    score = 0
    factors = []
    
    # 1. Fall Recurrence (25 points per fall)
    if recent_falls > 0:
        pts = min(50, recent_falls * 25)
        score += pts
        factors.append({
            "name": "Fall Recurrence",
            "impact": pts,
            "description": f"{recent_falls} falls detected in the last 30 days."
        })
        
    # 2. Nocturnal Bradycardia (HR < 50)
    brady_events = sum(1 for v in recent_vitals if v.get('heart_rate', 60) < 50)
    if brady_events >= 3:
        score += 25
        factors.append({
            "name": "Nocturnal Bradycardia",
            "impact": 25,
            "description": f"Heart rate dipped below 50 bpm {brady_events} times."
        })
        
    # 3. Persistent SpO2 Dips (< 92%)
    spo2_dips = sum(1 for v in recent_vitals if v.get('spo2', 98) < 92)
    if spo2_dips >= 5:
        score += 20
        factors.append({
            "name": "SpO2 Dips",
            "impact": 20,
            "description": f"Oxygen levels dropped below 92% {spo2_dips} times."
        })
        
    # 4. Agitation / High SVM
    high_svm_events = sum(1 for v in recent_vitals if v.get('svm', 1.0) > 2.5)
    if high_svm_events > 10:
        score += 15
        factors.append({
            "name": "High Agitation (SVM)",
            "impact": 15,
            "description": "Frequent high-acceleration movements detected outside of falls."
        })
        
    overall_score = min(100.0, float(score))
    
    if overall_score <= 20:
        risk_level = "low"
        rec = "Routine monitoring."
    elif overall_score <= 45:
        risk_level = "moderate"
        rec = "Schedule a routine check-up to review vital trends."
    elif overall_score <= 70:
        risk_level = "high"
        rec = "Immediate review recommended. High risk of clinical deterioration."
    else:
        risk_level = "critical"
        rec = "URGENT INTERVENTION REQUIRED."
        
    return {
        "overall_score": overall_score,
        "risk_level": risk_level,
        "factors": factors,
        "recommendation": rec
    }
