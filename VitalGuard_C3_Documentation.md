# VitalGuard C3 Documentation

**Project Name:** VitalGuard C3
**Team Members:** [TEAM_MEMBERS_PENDING_CONFIRMATION]

## 1. Hardware Architecture

*   **Microcontroller:** ESP32-C3 [BOARD_NAME_PENDING]
*   **Sensors:** 
    *   MAX30102 (heart rate + SpO2, I2C)
    *   MPU6050 (6-axis motion, I2C, shared bus)
*   **Actuator:** Piezo buzzer + LED, direct GPIO
*   **Power:** 3.7V LiPo battery, charged via the board's OWN BUILT-IN charging circuit. 

## 2. Entity-Relationship (ER) Architecture (Chen Notation)

*Note: Standard Mermaid.js does not support true Chen ER notation (it lacks native support for double-ellipses for multi-valued attributes, double-rectangles for weak entities, double-diamonds for identifying relationships, and double-lines for total participation). Below is the exact structural description conforming to strict Chen notation standards.*

### Entities and Attributes
*   **RESIDENT** (Rectangle, Strong Entity)
    *   `resident_id` (Ellipse, Underlined - Primary Key)
    *   `full_name` (Ellipse)
    *   `date_of_birth` (Ellipse)
    *   `age` (Dashed-outline Ellipse - Derived Attribute from `date_of_birth`)
    *   `guardian_contact` (Double Ellipse - Multi-Valued Attribute)
    *   `room_no` (Ellipse)
*   **CARETAKER** (Rectangle, Strong Entity)
    *   `caretaker_id` (Ellipse, Underlined - Primary Key)
    *   `full_name` (Ellipse)
    *   `email` (Ellipse)
    *   `phone` (Double Ellipse - Multi-Valued Attribute)
    *   `role` (Ellipse)
*   **DEVICE** (Rectangle, Strong Entity)
    *   `device_id` (Ellipse, Underlined - Primary Key)
    *   `board_model` (Ellipse)
    *   `mac_address` (Ellipse)
    *   `battery_level` (Ellipse)
    *   `status` (Ellipse)
*   **VITAL_READING** (Double Rectangle, Weak Entity)
    *   `seq_no` (Ellipse, Dashed-underlined - Partial Key)
    *   `heart_rate` (Ellipse)
    *   `spo2` (Ellipse)
    *   `recorded_at` (Ellipse)
*   **MOTION_EVENT** (Rectangle, Strong Entity)
    *   `event_id` (Ellipse, Underlined - Primary Key)
    *   `event_type` (Ellipse)
    *   `confidence_score` (Ellipse)
    *   `recorded_at` (Ellipse)
*   **ALERT** (Rectangle, Strong Entity)
    *   `alert_id` (Ellipse, Underlined - Primary Key)
    *   `alert_type` (Ellipse)
    *   `severity` (Ellipse)
    *   `status` (Ellipse)
    *   `created_at` (Ellipse)
*   **GUARDIAN** (Rectangle, Strong Entity - Phase 2 Scope)
    *   `guardian_id` (Ellipse, Underlined - Primary Key)
    *   `full_name` (Ellipse)
    *   `phone` (Ellipse)
    *   `relationship` (Ellipse)

### Relationships and Participation
*   **RESIDENT - WEARS - DEVICE**
    *   `WEARS` (Single Diamond)
    *   Cardinality: 1 to 1
    *   Participation: Partial (Single line)
*   **DEVICE - RECORDS - VITAL_READING**
    *   `RECORDS` (Double Diamond - Identifying Relationship)
    *   Cardinality: 1 to M
    *   Participation: Total participation from DEVICE to VITAL_READING (Double line)
*   **DEVICE - LOGS - MOTION_EVENT**
    *   `LOGS` (Single Diamond)
    *   Cardinality: 1 to M
    *   Participation: Total participation from DEVICE to MOTION_EVENT (Double line)
*   **RESIDENT - RAISES - ALERT**
    *   `RAISES` (Single Diamond)
    *   Cardinality: 1 to M
    *   Participation: Partial (Single line)
*   **MOTION_EVENT - TRIGGERS - ALERT**
    *   `TRIGGERS` (Single Diamond)
    *   Cardinality: 1 to (0..1)
    *   Participation: Partial (Single line)
*   **CARETAKER - ACKNOWLEDGES - ALERT**
    *   `ACKNOWLEDGES` (Single Diamond)
    *   Cardinality: 1 to M
    *   Participation: Partial (Single line)
*   **GUARDIAN - REGISTERED_TO - RESIDENT**
    *   `REGISTERED_TO` (Single Diamond)
    *   Cardinality: M to 1
    *   Participation: Partial (Single line)
*   **GUARDIAN - NOTIFIED_OF - ALERT**
    *   `NOTIFIED_OF` (Single Diamond)
    *   Cardinality: 1 to M
    *   Participation: Partial (Single line)

## 3. Fall Detection Logic

The fall detection algorithm utilizes a three-stage sequence based purely on the Signal Magnitude Vector (SVM) derived from the 6-axis motion sensor. This logic operates completely independently from the heart rate and SpO2 monitoring paths.

1.  **Stage 1 - Free-Fall:** Total acceleration (SVM) < 0.4g.
2.  **Stage 2 - Impact:** SVM > 2.5g, occurring shortly after Stage 1.
3.  **Stage 3 - Stillness:** |SVM - 1.0g| < 0.3g sustained for several seconds.

All three stages must occur in order to confirm a fall. Heart rate and SpO2 readings are processed as a separate, independent alert path (for irregular patterns via HRV features) and are never fused into a single diagnosis with the motion event.

## 4. Software & Network Topology

The system components strictly adhere to the scope of a resident and caretaker environment, with Guardian notifications planned for Phase 2.

*   **Primary Safety Path:** Firmware running directly on the ESP32-C3 [BOARD_NAME_PENDING] executes fall triage and vital anomaly detection natively, driving the direct GPIO piezo buzzer/LED actuator.
*   **Optional / Development Mock:** FastAPI backend, WebSocket bridge, and SQLite logging are designated as optional development mocks for demonstration and are not part of the core safety path.
