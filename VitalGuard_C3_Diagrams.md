# VitalGuard C3 - Engineering Diagrams

**Project:** VitalGuard C3
**Team:** [TEAM_MEMBERS_PENDING_CONFIRMATION]
**Target Hardware:** ESP32-C3 [BOARD_NAME_PENDING], MAX30102 (I2C), MPU6050 (I2C, shared bus), Piezo Buzzer + LED (direct GPIO)
**Power:** 3.7V LiPo battery, charged via the board's own built-in charging circuit

---

## 1. Entity-Relationship (ER) Diagram

This section defines the data architecture, entity specifications, and cardinalities aligned with both academic **Chen Notation** (for theoretical schema defense) and **Relational Crow's-Foot Notation** (for database implementation).

![VitalGuard C3 Chen Entity-Relationship Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Chen_ER.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_Chen_ER.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Chen_ER.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_Chen_ER.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Chen_ER.png).

---

### Conceptual Architecture & Academic Evaluation

Based on the hand-drawn system design:
1. **User Wearable Binding (`USER` — `WEARS` — `DEVICE`)**:
   - A 1:1 relationship between an elderly resident/user and their assigned IoT wearable device (ESP32-C3 band/watch).
2. **Identifying Weak Relationship (`DEVICE` — `RECORDS` — `VITAL_READING` & `MOTION_EVENT`)**:
   - Both continuous vital telemetry (Heart Rate, SpO2) and motion telemetry (MPU6050 accelerometer events) cannot exist independently of the generating hardware device.
   - In Chen notation, `RECORDS` is an **identifying relationship (Double Diamond)**, and both `VITAL_READING` and `MOTION_EVENT` are **Weak Entities (Double Rectangles)** with partial discriminators (`seq_no` / `timestamp`).
3. **Event Anomaly Detection (`TRIGGERS` — `ALERT`)**:
   - **Normal Motion vs Fall Detection**: Normal motion telemetry is stored as continuous time-series logs. Only when the motion classification engine detects a fall (`event_type == 'FALL_DETECTED'`) or vital threshold breaches (tachycardia/hypoxia) is an `ALERT` entity instantiated via the `TRIGGERS` relationship (cardinality `0..1`).
4. **Caretaker / Guardian Escalation (`ALERT` — `NOTIFIES` / `ACKNOWLEDGES` — `CARETAKER`)**:
   - Once an emergency alert is triggered, it is dispatched to the Caretaker / Guardian dashboard and devices. The caretaker performs an `ACKNOWLEDGES` transaction, logging the resolution timestamp and status.

---

### Chen Notation Structural Specification

#### Entities

| Entity | Shape in Chen | Classification | Description |
|:---|:---|:---|:---|
| **USER** | Single Rectangle | Strong Entity | Elderly resident or monitored patient. |
| **DEVICE** | Single Rectangle | Strong Entity | Wearable hardware unit (ESP32-C3 watch/band). |
| **VITAL_READING** | Double Rectangle | Weak Entity | Periodic sensor readings (MAX30102). Existence-dependent on `DEVICE`. |
| **MOTION_EVENT** | Double Rectangle | Weak Entity | Motion telemetry & fall classification (MPU6050). Existence-dependent on `DEVICE`. |
| **ALERT** | Single Rectangle | Strong Entity | Critical system notification generated upon anomaly detection. |
| **CARETAKER** | Single Rectangle | Strong Entity | Healthcare professional / nurse attending to residents. |
| **GUARDIAN** | Single Rectangle | Strong Entity | Family member / legal guardian linked to the user for emergency escalation. |

#### Attributes

- **USER**:
  - `user_id` — Ellipse, solid underline (**Primary Key**)
  - `full_name` — Ellipse
  - `date_of_birth` — Ellipse
  - `age` — Dashed Ellipse (**Derived Attribute**, calculated from `date_of_birth`)
  - `room_no` — Ellipse
  - `emergency_contact` — Double Ellipse (**Multi-Valued Attribute**)

- **DEVICE (Watch / Band)**:
  - `device_id` — Ellipse, solid underline (**Primary Key**)
  - `board_model` — Ellipse (e.g., `ESP32-C3 SuperMini`)
  - `mac_address` — Ellipse
  - `battery_level` — Ellipse
  - `status` — Ellipse (`ONLINE`, `CHARGING`, `OFFLINE`)

- **VITAL_READING** *(Weak Entity)*:
  - `seq_no` — Ellipse, dashed underline (**Partial Key / Discriminator**)
  - `heart_rate` — Ellipse (BPM)
  - `spo2` — Ellipse (%)
  - `recorded_at` — Ellipse (Timestamp)

- **MOTION_EVENT** *(Weak Entity)*:
  - `event_id` — Ellipse, dashed underline (**Partial Key / Discriminator**)
  - `event_type` — Ellipse (`NORMAL_MOTION`, `FALL_DETECTED`)
  - `accel_magnitude` — Ellipse (Total acceleration vector $g$)
  - `confidence_score` — Ellipse (%)
  - `recorded_at` — Ellipse (Timestamp)

- **ALERT**:
  - `alert_id` — Ellipse, solid underline (**Primary Key**)
  - `alert_type` — Ellipse (`FALL_DETECTED`, `CRITICAL_VITALS`, `PROLONGED_INACTIVITY`)
  - `severity` — Ellipse (`CRITICAL`, `WARNING`, `INFO`)
  - `status` — Ellipse (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`)
  - `created_at` — Ellipse
  - `resolved_at` — Ellipse (Nullable)

- **CARETAKER**:
  - `caretaker_id` — Ellipse, solid underline (**Primary Key**)
  - `full_name` — Ellipse
  - `role` — Ellipse (`Nurse`, `Doctor`, `Supervisor`)
  - `phone` — Double Ellipse (**Multi-Valued Attribute**)
  - `email` — Ellipse

- **GUARDIAN**:
  - `guardian_id` — Ellipse, solid underline (**Primary Key**)
  - `full_name` — Ellipse
  - `relationship` — Ellipse (`Son`, `Daughter`, `Spouse`)
  - `phone` — Ellipse

#### Relationships

| Relationship | Shape | From | To | Cardinality | Participation | Description |
|:---|:---|:---|:---|:---|:---|:---|
| **WEARS** | Single Diamond | USER | DEVICE | 1 : 1 | Partial (USER) - Total (DEVICE) | A resident wears exactly one device; each active device is worn by one user. |
| **RECORDS** | Double Diamond (Identifying) | DEVICE | VITAL_READING | 1 : M | Total (Double Line) | Device continuously records vitals. Vitals cannot exist without a device. |
| **RECORDS** | Double Diamond (Identifying) | DEVICE | MOTION_EVENT | 1 : M | Total (Double Line) | Device continuously records motion states. Cannot exist without a device. |
| **TRIGGERS** | Single Diamond | VITAL_READING | ALERT | 1 : 0..1 | Partial | Triggered only when HR or SpO2 exceeds safe medical limits. |
| **TRIGGERS** | Single Diamond | MOTION_EVENT | ALERT | 1 : 0..1 | Partial | Triggered only when `event_type == 'FALL_DETECTED'`. Normal motion does not trigger an alert. |
| **NOTIFIES** | Single Diamond | ALERT | CARETAKER | M : 1..N | Total (ALERT) | Alerts are instantly pushed via WebSocket / SMS to registered caretakers. |
| **ACKNOWLEDGES** | Single Diamond | CARETAKER | ALERT | 1 : M | Partial | Caretaker reviews and acknowledges the active alert. |
| **REGISTERED_TO**| Single Diamond | GUARDIAN | USER | M : 1 | Partial | Guardians are linked to their respective family member/user. |
| **ESCALATES_TO** | Single Diamond | ALERT | GUARDIAN | M : 0..N | Partial | Critical unacknowledged alerts escalate to family guardians. |

---

### Visual Chen-Notation Diagram (Conceptual Graph)

This flowchart diagram renders the exact Chen semantic shapes: single rectangles for strong entities, double rectangles `[[ ]]` for weak entities, diamonds `{ }` for relationships, and double diamonds for identifying relationships.

```mermaid
graph TD
    %% Entities
    USER["[ USER / RESIDENT ]"]:::strongEntity
    DEVICE["[ DEVICE (Watch / Band) ]"]:::strongEntity
    VITAL[["[[ VITAL_READING ]]"]]:::weakEntity
    MOTION[["[[ MOTION_EVENT ]]"]]:::weakEntity
    ALERT["[ ALERT ]"]:::strongEntity
    CARETAKER["[ CARETAKER ]"]:::strongEntity
    GUARDIAN["[ GUARDIAN ]"]:::strongEntity

    %% Relationships
    WEARS{"wears"}:::relSingle
    RECORDS{{"records (identifying)"}}:::relDouble
    TRIG_V{"triggers"}:::relSingle
    TRIG_M{"triggers"}:::relSingle
    NOTIF{"notifies / sends to"}:::relSingle
    ACK{"acknowledges"}:::relSingle
    REG{"registered to"}:::relSingle

    %% Connections
    USER ---|1| WEARS
    WEARS ---|1| DEVICE

    DEVICE ===|1| RECORDS
    RECORDS ===|M| VITAL
    RECORDS ===|M| MOTION

    VITAL -.-|if abnormal HR/SpO2| TRIG_V
    TRIG_V -->|1| ALERT

    MOTION -.-|if fall detected| TRIG_M
    TRIG_M -->|1| ALERT

    ALERT ---|M| NOTIF
    NOTIF --->|N| CARETAKER
    NOTIF -.->|escalation| GUARDIAN

    CARETAKER ---|1| ACK
    ACK ---|M| ALERT

    GUARDIAN ---|M| REG
    REG ---|1| USER

    classDef strongEntity fill:#f8fafc,stroke:#0f172a,stroke-width:2px,color:#0f172a;
    classDef weakEntity fill:#f1f5f9,stroke:#0f172a,stroke-width:3px,color:#0f172a;
    classDef relSingle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef relDouble fill:#e0e7ff,stroke:#4f46e5,stroke-width:3px,color:#3730a3;
```

---

### Relational Schema Diagram (Crow's-Foot Notation)

For direct translation to PostgreSQL / SQLite database tables and foreign keys:

```mermaid
erDiagram
    USER {
        string user_id PK
        string full_name
        date date_of_birth
        int age "Derived"
        string room_no
        string emergency_contact
    }
    CARETAKER {
        string caretaker_id PK
        string full_name
        string email
        string phone
        string role
    }
    DEVICE {
        string device_id PK
        string board_model
        string mac_address
        int battery_level
        string status
    }
    VITAL_READING {
        int seq_no PK "Partial Key"
        string device_id FK "Identifying Owner"
        int heart_rate
        int spo2
        datetime recorded_at
    }
    MOTION_EVENT {
        string event_id PK "Partial Key"
        string device_id FK "Identifying Owner"
        string event_type "NORMAL_MOTION | FALL_DETECTED"
        float accel_magnitude
        float confidence_score
        datetime recorded_at
    }
    ALERT {
        string alert_id PK
        string trigger_source "VITAL | MOTION"
        string alert_type "FALL | HIGH_HR | LOW_SPO2"
        string severity "CRITICAL | WARNING | INFO"
        string status "ACTIVE | ACKNOWLEDGED | RESOLVED"
        datetime created_at
        datetime resolved_at
    }
    GUARDIAN {
        string guardian_id PK
        string user_id FK
        string full_name
        string phone
        string relationship
    }

    USER ||--|| DEVICE : "WEARS"
    DEVICE ||--|{ VITAL_READING : "RECORDS (identifying)"
    DEVICE ||--|{ MOTION_EVENT : "RECORDS (identifying)"
    VITAL_READING ||--o| ALERT : "TRIGGERS (on threshold breach)"
    MOTION_EVENT ||--o| ALERT : "TRIGGERS (on fall detection)"
    CARETAKER ||--|{ ALERT : "ACKNOWLEDGES"
    ALERT }|--|| CARETAKER : "NOTIFIES"
    USER ||--|{ GUARDIAN : "ASSOCIATED_WITH"
    ALERT }o--o| GUARDIAN : "ESCALATES_TO"
```

---

## 2. Class Diagram (Black Book Section 4.2)

This section defines the software class hierarchy, data attributes, member operations (methods), and UML object relationships (Association, Composition, Cardinality) adhering strictly to the academic UML standards approved by university examiners.

![VitalGuard C3 Class Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Class_Diagram.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_Class_Diagram.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Class_Diagram.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_Class_Diagram.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Class_Diagram.png).

---

### Class Specifications & Academic Semantics

Following standard 3-compartment UML specification (Class Name, Attributes with explicit types and `{PK}`, Member Methods):

1. **`CARETAKER` (Admin / Healthcare Provider)**:
   - **Attributes**: `+ caretaker_id : int {PK}`, `+ name : string`, `+ email : string`, `+ phone : string`, `+ role : string`
   - **Operations**: `+ addResident()`, `+ removeResident()`, `+ monitorTelemetry()`, `+ acknowledgeAlert()`
   - **Role**: Manages elderly residents and reviews real-time anomaly alerts.

2. **`RESIDENT` (Monitored Subject)**:
   - **Attributes**: `+ resident_id : int {PK}`, `+ name : string`, `+ age : int`, `+ room_no : string`, `+ emergency_contact : string`
   - **Operations**: `+ wearDevice()`, `+ getHealthHistory()`, `+ triggerSOS()`, `+ viewAlerts()`
   - **Role**: The central subject bound to a single wearable IoT device.

3. **`DEVICE` (ESP32-C3 Wearable Hardware)**:
   - **Attributes**: `+ device_id : int {PK}`, `+ mac_address : string`, `+ battery_level : int`, `+ status : string`, `+ board_model : string`
   - **Operations**: `+ readSensors()`, `+ processMotion()`, `+ sendTelemetry()`, `+ soundBuzzer()`
   - **Role**: Edge computing node executing sensor acquisition and local fall detection.

4. **`VITAL_READING` (MAX30102 Telemetry Entity)**:
   - **Attributes**: `+ reading_id : int {PK}`, `+ heart_rate : int`, `+ spo2 : int`, `+ temperature : float`, `+ recorded_at : datetime`
   - **Operations**: `+ checkThreshold()`, `+ logReading()`, `+ getVitalsStream()`
   - **Semantics**: Composed inside `DEVICE` (filled diamond `◆`). Existence ceases if device data stream is destroyed.

5. **`MOTION_EVENT` (MPU6050 Accelerometer Telemetry Entity)**:
   - **Attributes**: `+ event_id : int {PK}`, `+ event_type : string`, `+ accel_magnitude : float`, `+ confidence : float`, `+ recorded_at : datetime`
   - **Operations**: `+ computeSVM()`, `+ detectFall()`, `+ logEvent()`
   - **Semantics**: Composed inside `DEVICE` (filled diamond `◆`). Distinguishes `NORMAL_MOTION` from `FALL_DETECTED`.

6. **`ALERT` (Emergency Notification Dispatch)**:
   - **Attributes**: `+ alert_id : int {PK}`, `+ alert_type : string`, `+ severity : string`, `+ status : string`, `+ created_at : datetime`
   - **Operations**: `+ triggerAlarm()`, `+ sendNotification()`, `+ markAcknowledged()`, `+ escalateAlert()`
   - **Semantics**: Instantiated when `VITAL_READING` or `MOTION_EVENT` crosses safety boundaries; acknowledged by `CARETAKER`.

---

### Class Diagram (Mermaid Representation)

```mermaid
classDiagram
    class CARETAKER {
        +int caretaker_id PK
        +string name
        +string email
        +string phone
        +string role
        +addResident() void
        +removeResident() void
        +monitorTelemetry() void
        +acknowledgeAlert() void
    }

    class RESIDENT {
        +int resident_id PK
        +string name
        +int age
        +string room_no
        +string emergency_contact
        +wearDevice() void
        +getHealthHistory() void
        +triggerSOS() void
        +viewAlerts() void
    }

    class DEVICE {
        +int device_id PK
        +string mac_address
        +int battery_level
        +string status
        +string board_model
        +readSensors() void
        +processMotion() void
        +sendTelemetry() void
        +soundBuzzer() void
    }

    class VITAL_READING {
        +int reading_id PK
        +int heart_rate
        +int spo2
        +float temperature
        +datetime recorded_at
        +checkThreshold() bool
        +logReading() void
        +getVitalsStream() void
    }

    class MOTION_EVENT {
        +int event_id PK
        +string event_type
        +float accel_magnitude
        +float confidence
        +datetime recorded_at
        +computeSVM() float
        +detectFall() bool
        +logEvent() void
    }

    class ALERT {
        +int alert_id PK
        +string alert_type
        +string severity
        +string status
        +datetime created_at
        +triggerAlarm() void
        +sendNotification() void
        +markAcknowledged() void
        +escalateAlert() void
    }

    CARETAKER "1" --> "0..*" RESIDENT : manages
    RESIDENT "1" --> "1" DEVICE : wears
    DEVICE "1" *-- "0..*" VITAL_READING : contains (composition)
    DEVICE "1" *-- "0..*" MOTION_EVENT : contains (composition)
    VITAL_READING "0..1" --> "0..*" ALERT : triggers
    MOTION_EVENT "0..1" --> "0..*" ALERT : triggers
    CARETAKER "1" --> "0..*" ALERT : acknowledges
```

---

## 3. Object Diagram (Black Book Section 4.3)

In accordance with **SPPU (Savitribai Phule Pune University) System Design standards**, the Object Diagram serves as a **concrete runtime snapshot** of the Class Diagram (Section 4.2). It illustrates the exact state of instantiated objects, attribute values, and inter-object links at a critical moment in execution: **A high-severity fall incident detected in progress and actively dispatched to the Guardian**.

![VitalGuard C3 Object Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Object_Diagram.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_Object_Diagram.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Object_Diagram.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_Object_Diagram.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Object_Diagram.png).

---

### Runtime Snapshot Specifications (T = 21:14:03 IST)

Following standard UML 2-compartment object box notation with underlined identifiers (`instance_name : ClassName`):

1. **`caretaker_1 : CARETAKER`**:
   - `caretaker_id = 201`, `name = "Priya Sharma"`, `email = "priya@care.in"`, `phone = "+91-9876543210"`, `role = "Family Guardian"`
   - *State*: Actively viewing Next.js clinical dashboard; received emergency push notification.
2. **`resident_1 : RESIDENT`**:
   - `resident_id = 101`, `name = "Ramesh Sharma"`, `age = 74`, `room_no = "A-204"`, `emergency_contact = "Priya S."`
   - *State*: Experienced sudden slip and impact in room A-204.
3. **`device_1 : DEVICE`**:
   - `device_id = 501`, `mac_address = "E4:65:B8:1A:2F:3C"`, `battery_level = 82%`, `status = "CONNECTED"`, `board_model = "ESP32-C3 SuperMini"`
   - *State*: Worn on wrist; continuous 50Hz sensor acquisition active.
4. **`reading_1 : VITAL_READING`**:
   - `reading_id = 9021`, `heart_rate = 118 BPM`, `spo2 = 91%`, `temperature = 37.1 C`, `recorded_at = 21:14:02.105`
   - *State*: Tachycardia spike observed immediately post-impact.
5. **`motion_1 : MOTION_EVENT`**:
   - `event_id = 4402`, `event_type = "FALL_DETECTED"`, `accel_magnitude = 2.85g`, `confidence = 0.946`, `recorded_at = 21:14:02.820`
   - *State*: Freefall (<0.4g) followed by 2.85g impact and sustained post-impact stillness.
6. **`alert_1 : ALERT`**:
   - `alert_id = 8801`, `alert_type = "FALL_DETECTED"`, `severity = "CRITICAL"`, `status = "TRIGGERED"`, `created_at = 21:14:03.010`
   - *State*: Active buzzer alarm on wrist; emergency modal popped up on Guardian screen.

---

### Object Diagram (Mermaid Representation)

```mermaid
classDiagram
    class caretaker_1 {
        <<CARETAKER>>
        caretaker_id = 201
        name = "Priya Sharma"
        phone = "+91-9876543210"
        role = "Family Guardian"
    }

    class resident_1 {
        <<RESIDENT>>
        resident_id = 101
        name = "Ramesh Sharma"
        age = 74
        room_no = "A-204"
    }

    class device_1 {
        <<DEVICE>>
        device_id = 501
        mac_address = "E4:65:B8:1A:2F:3C"
        battery_level = 82
        status = "CONNECTED"
    }

    class reading_1 {
        <<VITAL_READING>>
        reading_id = 9021
        heart_rate = 118
        spo2 = 91
        recorded_at = "21:14:02"
    }

    class motion_1 {
        <<MOTION_EVENT>>
        event_id = 4402
        event_type = "FALL_DETECTED"
        accel_magnitude = 2.85
        confidence = 0.946
    }

    class alert_1 {
        <<ALERT>>
        alert_id = 8801
        alert_type = "FALL_DETECTED"
        severity = "CRITICAL"
        status = "TRIGGERED"
    }

    caretaker_1 -- resident_1 : manages
    resident_1 -- device_1 : wears
    device_1 -- reading_1 : records
    device_1 -- motion_1 : records
    reading_1 -- alert_1 : triggers
    motion_1 -- alert_1 : triggers
    caretaker_1 -- alert_1 : notified_of
```

---

## 4. Sequence Diagram (Black Book Section 4.4)

In accordance with **Academic System Design & University Black Book standards (SPPU / MU Final Year B.E. Examination)**, the Sequence Diagram visualizes the **dynamic chronological interactions, partitioned control flows, and message exchanges** across two interconnected operational perspectives:
1. **Flow 1: Guardian Onboarding, Biometric Passkey Registration & Hardware Auto-Binding Flow (Option B: Web Bluetooth Tap-to-Discover & Factory eFuse MAC Binding)**.
2. **Flow 2: Real-Time Edge Vital Telemetry, 3-Stage SVM Fall Detection, Local 85dB Wrist Siren Actuation & Remote Emergency Triage Escalation**.

![VitalGuard C3 Sequence Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Sequence_Diagram.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_Sequence_Diagram.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Sequence_Diagram.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_Sequence_Diagram.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Sequence_Diagram.png).

---

### Partitioned Lifeline & Message Architecture

The sequence diagram is compartmentalized into two distinct operational flows separated by a structural dividing demarcation:

#### Flow 1: Guardian Authentication & Hardware Auto-Binding Flow (`GUARDIAN FLOW`)
- **`Guardian (User/Caretaker)`** [«Actor»]: Signs up using Mobile No. or Email, performs device-native biometric passkey registration (FIDO2 / WebAuthn), and taps "Detect My Wristband".
- **`Portal (PWA)`** [«Boundary»]: Next.js 14 Web Application managing WebAuthn challenges, Web Bluetooth GATT discovery, and persistent 30-day authenticated sessions.
- **`FastAPI Backend`** [«Controller»]: Asynchronous REST API orchestrating cryptographic challenge issuance, credential verification, and account provisioning.
- **`Database`** [«Entity»]: SQLite persistence engine enforcing strict `UNIQUE` constraints on guardian identifiers, credentials, and registered wristband hardware MACs.
- **`ESP32 Sentinel`** [«Device»]: Physical smart band exposing factory-burned eFuse MAC address via read-only Identity Characteristic (`DEVICE_ID_CHAR_UUID`).

#### Flow 2: Edge Fall Detection & Emergency Triage Flow (`EMERGENCY FLOW`)
- **`Patient (Elderly Resident)`** [«Actor»]: Wearer undergoing kinetic slip/fall event resulting in sudden high-G impact.
- **`Sensors / IMU`** [«Device»]: High-frequency I2C bus peripherals (MAX30102 PPG sensor and MPU6050 6-DOF IMU) streaming inertial acceleration and vital telemetry.
- **`ESP32 Firmware`** [«Controller»]: RISC-V SoC executing continuous signal vector magnitude ($\text{SVM} = \sqrt{A_x^2 + A_y^2 + A_z^2}$) classification, edge inference, and autonomous GPIO pin 2 buzzer actuation.
- **`Buzzer Actuator`** [«Device»]: High-decibel wristband piezo alarm delivering instant audible local warning with zero internet or cloud dependency.
- **`Portal & Server`** [«Boundary»]: FastAPI WebSocket telemetry pipeline broadcasting urgent `CRITICAL_FALL` emergency payload.
- **`Guardian UI`** [«Boundary»]: Full-screen red alert modal with audible siren, patient risk telemetry, and one-tap alarm silencing acknowledgment.

---

### Sequence Diagram (Mermaid Representation)

```mermaid
sequenceDiagram
    autonumber

    %% ==========================================
    %% FLOW 1: GUARDIAN ONBOARDING & HARDWARE BINDING
    %% ==========================================
    actor Guardian as Guardian (User/Caretaker)
    participant Portal as Portal (PWA WebApp)
    participant Backend as FastAPI Backend
    participant DB as Database (SQLite)
    participant ESP_HW as ESP32 Sentinel (Wristband HW)

    rect rgb(248, 250, 252)
    Note over Guardian,ESP_HW: GUARDIAN FLOW: Biometric Passkey Registration & Option B Auto-Pairing
    Guardian->>Portal: 1. signup(mobile_or_email, name, band_id)
    Portal->>Backend: 2. requestPasskeyChallenge(identifier)
    Backend-->>Portal: 3. returnWebAuthnOptions(challenge)
    Portal-->>Guardian: 4. promptBiometricPasskey()
    Guardian->>Portal: 5. submitBiometricSignature()
    Portal->>ESP_HW: 6. detectMyWristband(Web Bluetooth Scan)
    ESP_HW-->>Portal: 7. returnFactoryMAC("VG-C3-XXXX")
    Portal->>Backend: 8. registerAccountAndBind(identifier, band_id, passkey)
    Backend->>DB: 9. insertGuardianRecord(identifier, band_id, key)
    DB-->>Backend: 10. recordSaved(UNIQUE_ENFORCED)
    Backend-->>Portal: 11. authSuccess(30_day_persistent_token)
    Portal-->>Guardian: 12. renderDashboard(guardianName, bandId)
    end

    %% ==========================================
    %% FLOW 2: EDGE FALL DETECTION & EMERGENCY TRIAGE
    %% ==========================================
    actor Patient as Patient (Elderly Resident)
    participant Sensors as Sensors/IMU (MAX30102 / MPU6050)
    participant ESP_FW as ESP32 Firmware (Edge AI Classifier)
    participant Buzzer as Buzzer Actuator (GPIO 2)
    participant Server as Portal & Server (FastAPI / WebSocket)
    participant GuardUI as Guardian UI (Recipient / Modal)

    rect rgb(254, 242, 242)
    Note over Patient,GuardUI: EMERGENCY FLOW: Edge Fall Classification, Local Actuation & Remote Triage
    Patient->>Sensors: 13. physicalFallImpact(sudden slip / high-G shock)
    Sensors-->>ESP_FW: 14. rawTelemetry(accel_mag > 25.0 m/s², SVM spike)
    ESP_FW->>ESP_FW: 15. classifyFallEvent() -> CONFIRMED (94.6%)
    ESP_FW->>Buzzer: 16. triggerSiren(digitalWrite(BUZZER_PIN, HIGH))
    Buzzer--)Patient: 17. emitLocal85dBSiren()
    ESP_FW->>Server: 18. streamAlert(FALL_CONFIRMED, telemetry_packet)
    Server->>GuardUI: 19. pushEmergencyModal(audioSiren, highRiskScore)
    GuardUI->>Server: 20. acknowledgeAndSilenceAlarm()
    Server->>ESP_FW: 21. dispatchSilenceCmd(SILENCE_BUZZER)
    ESP_FW->>Buzzer: 22. silenceBuzzer(digitalWrite(BUZZER_PIN, LOW))
    Buzzer-->>ESP_FW: 23. buzzerSilencedACK()
    ESP_FW-->>Server: 24. updateStatus(RESOLVED, assistance_en_route)
    Server-->>GuardUI: 25. refreshDashboardModal(STATUS_NORMAL)
    end
```

---

## 5. Activity Diagram (Black Book Section 4.5)

In accordance with **SPPU (Savitribai Phule Pune University) System Design standards**, the Activity Diagram models the **workflow control logic, concurrent execution threads, decision nodes, and synchronization points** across distinct system partitions (Swimlanes).

![VitalGuard C3 Activity Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Activity_Diagram.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_Activity_Diagram.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Activity_Diagram.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_Activity_Diagram.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Activity_Diagram.png).

---

### Swimlane Structural Partitions

1. **Swimlane 1: `Resident (Wearer)` (Physical Domain & Local Intervention)**:
   - Tracks the elderly resident wearing the smart band during daily routines (walking, resting, sleeping).
   - In the event of a sudden slip / freefall, kinetic impact spikes are registered.
   - Upon local buzzer alarm activation, provides a 15-second grace window allowing the resident to press the false-alarm cancel button to silence the siren (`[Yes: Cancelled]`) or sustain emergency beaconing if injured (`[No: Injured / Idle]`).
2. **Swimlane 2: `ESP32-C3 Edge Firmware` (Edge Processing & Embedded Telemetry)**:
   - Boots system: initializes I2C bus, FreeRTOS tasks, and WiFi / BLE GATT stack.
   - Continuously acquires 50Hz acceleration (MPU6050) and optical PPG vitals (MAX30102).
   - Computes Signal Vector Magnitude: $\text{SVM} = \sqrt{A_x^2 + A_y^2 + A_z^2}$.
   - Evaluates decision diamond: `Fall Threshold Exceeded?` (Freefall $< 0.4g$ & Impact $> 2.5g$).
     - If normal motion (`[No: Normal Motion]`), loops back to continuous sensor acquisition.
     - If threshold exceeded (`[Yes: Threshold Exceeded]`), confirms fall incident (confidence score $> 90\%$).
   - Passes control to the **UML «Fork» Concurrency Bar** to bifurcate execution simultaneously into local on-wrist actuation (Swimlane 1) and remote cloud telemetry dispatch (Swimlane 3).
   - Receives synchronized execution from the **UML «Join» Synchronization Bar**, logs an audit record in SQLite and the cloud, and terminates cleanly at the **Activity Final Node (`◉`)** centered in Swimlane 2.
3. **Swimlane 3: `Guardian Web Dashboard` (Remote Cloud Triage & Monitoring)**:
   - Guardian establishes an authenticated live session and continuously streams real-time heart rate and $\text{SpO}_2$.
   - Concurrently receives emergency telemetry packets dispatched over BLE GATT / WebSockets.
   - Immediately renders an urgent full-screen red modal and sounds an audible browser alert.
   - Guardian inspects vitals, clicks "Acknowledge & Silence", and logs emergency assistance dispatch ETA.

---

### Activity Diagram (Mermaid Representation)

```mermaid
flowchart TD
    subgraph sw1["SWIMLANE 1: RESIDENT (WEARER)"]
        direction TB
        ActWear["Resident Wears Smart Wristband<br/>& Conducts Normal Daily Activity"]
        ActMotion["Continuous Ambulatory Motion<br/>(Walking, Resting, Sleeping)"]
        ActSlip["Sudden Slip / Freefall & High-G Impact<br/>(Elderly Resident Falls)"]
        ActBuzz["Autonomous Local Actuation:<br/>Drive 85dB Buzzer & Red Flashing LED"]
        DecCancel{"Resident Presses False-Alarm<br/>Cancel Button within 15s?"}
        ActSilence["Silence Buzzer<br/>(False Alarm Dismissed)"]
        ActSustain["Sustain 85dB Siren<br/>& Red LED Strobe"]
        MergeCancel{" "}

        ActWear --> ActMotion
        ActMotion --> ActSlip
        ActBuzz --> DecCancel
        DecCancel -- "[Yes: Cancelled]" --> ActSilence
        DecCancel -- "[No: Injured / Idle]" --> ActSustain
        ActSilence --> MergeCancel
        ActSustain --> MergeCancel
    end

    subgraph sw2["SWIMLANE 2: ESP32-C3 EDGE FIRMWARE"]
        direction TB
        StartNode(("● Start"))
        ActBoot["Initialize I2C, FreeRTOS Tasks<br/>& WiFi / BLE GATT Stack"]
        ActSample["Acquire 50Hz Accel (MPU6050)<br/>& Optical PPG (MAX30102)"]
        ActSVM["Compute Signal Vector Magnitude (SVM):<br/>SVM = sqrt(Ax² + Ay² + Az²)"]
        DecFall{"Fall Threshold Exceeded?<br/>(Freefall < 0.4g & Impact > 2.5g)"}
        ActConf["CONFIRM FALL INCIDENT<br/>(Confidence Score > 90%)"]
        ActResolved["Log Incident Audit Trail in SQLite & Cloud<br/>Update Patient Status to 'Resolved'"]
        EndNode((("◉ Final State")))

        StartNode --> ActBoot
        ActBoot --> ActSample
        ActSample --> ActSVM
        ActSVM --> DecFall
        DecFall -- "[No: Normal Motion]" --> ActSample
        DecFall -- "[Yes: Threshold Exceeded]" --> ActConf
        ActResolved --> EndNode
    end

    subgraph sw3["SWIMLANE 3: GUARDIAN WEB DASHBOARD"]
        direction TB
        ActDashConnect["Guardian Connects to Dashboard<br/>& Authenticates Session Token"]
        ActDashStream["Stream & Render Live Telemetry<br/>(Real-Time Heart Rate & SpO2)"]
        ActTelemetry["Transmit Emergency Telemetry Packet<br/>via BLE GATT / WiFi WebSockets"]
        ActModal["Display Urgent Full-Screen Red Modal<br/>& Trigger Audio Siren on Dashboard"]
        ActAck["Guardian Clicks 'Acknowledge & Silence'<br/>& Dispatches Emergency Assistance"]

        ActDashConnect --> ActDashStream
        ActTelemetry --> ActModal
        ActModal --> ActAck
    end

    ActSlip -- "Kinetic Impact Spike" --> ActConf

    ForkBar["════════════ «Fork» Concurrency Bar (Parallel Local Actuation & Remote Triage) ════════════"]
    ActConf ==> ForkBar
    ForkBar ==> ActBuzz
    ForkBar ==> ActTelemetry

    JoinBar["════════════ «Join» Synchronization Bar (Both Wrist & Dashboard Resolved) ════════════"]
    MergeCancel ==> JoinBar
    ActAck ==> JoinBar
    JoinBar ==> ActResolved
```

---

## 6. System Flowchart

This diagram models the detailed sequential execution from power-on through normal monitoring and the three-stage fall detection loop.

```mermaid
flowchart TD
    Boot(["System Boot / Hardware Reset"]) --> SetupHW["Initialize GPIO, I2C Bus, Serial"]
    SetupHW --> InitSensors["Initialize MAX30102 and MPU6050 Drivers"]
    InitSensors --> CheckI2C{"Sensors Responding on I2C?"}
    CheckI2C -- No --> LogError["Log I2C Error, Retry Scan"]
    LogError --> InitSensors
    CheckI2C -- Yes --> InitBLE["Initialize BLE GATT Server"]
    InitBLE --> StartAdv["Start BLE Advertising"]

    StartAdv --> MainLoop["Enter Main Operational Loop"]
    MainLoop --> ReadIMU["Acquire MPU6050 Sample (Ax, Ay, Az)"]
    MainLoop --> ReadPPG["Acquire MAX30102 Sample (IR, Red)"]

    ReadIMU --> CalcSVM["Compute SVM = sqrt(Ax^2 + Ay^2 + Az^2)"]
    ReadPPG --> CalcVitals["Extract Heart Rate (BPM) and SpO2 (%)"]

    CalcSVM --> CheckFreeFall{"SVM below 0.4g? (Free-Fall Dip)"}
    CheckFreeFall -- Yes --> CheckImpact{"SVM above 2.5g shortly after? (Impact)"}
    CheckFreeFall -- No --> BuildPacket["Assemble Telemetry Packet"]

    CheckImpact -- No --> ResetTriage["Reset Fall State Machine"]
    CheckImpact -- Yes --> CheckStillness{"SVM within 0.3g of 1.0g, sustained for several seconds? (Stillness)"}

    CheckStillness -- No --> ResetTriage
    CheckStillness -- Yes --> FallConfirmed["FALL CONFIRMED"]

    FallConfirmed --> AlarmOn["Activate Buzzer and LED (GPIO HIGH)"]

    CalcVitals --> CheckHRV{"Irregular HRV Pattern Detected?"}
    CheckHRV -- Yes --> VitalFlag["Vital Anomaly Flagged"]
    CheckHRV -- No --> BuildPacket

    VitalFlag --> AlarmOn
    AlarmOn --> BuildPacket

    ResetTriage --> BuildPacket

    BuildPacket --> CheckBLE{"BLE Client Connected?"}
    CheckBLE -- Yes --> SendBLE["Transmit BLE GATT Notification"]
    CheckBLE -- No --> LoopDelay["Delay, Return to Loop"]

    SendBLE --> CheckAck{"Alarm Dismissal Received?"}
    CheckAck -- Yes --> AlarmOff["Silence Buzzer and LED (GPIO LOW), Reset State"]
    CheckAck -- No --> AlarmOn

    AlarmOff --> LoopDelay
    LoopDelay --> MainLoop
```

---

## 7. Data Flow Diagram (DFD)

### 7.1 DFD Level 0 (Context Diagram)

This diagram defines the system boundary and interactions with external entities.

> **Notation Note:** Traditional DFD uses circles for processes, open-ended rectangles for data stores, and squares for external entities. Mermaid does not have a native DFD diagram type; the flowchart syntax is used here with circles for the process and rectangles for external entities as an approximation.

```mermaid
graph LR
    Resident["Resident (External Entity)"]
    Caretaker["Caretaker (External Entity)"]
    Guardian["Guardian (Phase 2, External Entity)"]
    P0(("P0: VitalGuard C3 System"))

    Resident -- "Body signals (optical PPG, motion)" --> P0
    P0 -- "Buzzer/LED alarm" --> Resident
    P0 -- "Alert notification" --> Caretaker
    Caretaker -- "Acknowledgment / Dismiss" --> P0
    P0 -. "Alert notification (Phase 2 - not current scope)" .-> Guardian
```

### 7.2 DFD Level 1 (Functional Decomposition)

This diagram maps data movement between sub-processes, data stores, and external entities.

> **Critical Design Rule:** P6 (Local Actuation) receives direct data flows from P3 and P4 with zero dependency on P5 or P7. P7 (Display Sync) is a separate, parallel, optional branch. This enforces the same zero-network-dependency principle documented in the Sequence Diagram and Flowchart above.

```mermaid
graph TD
    Resident["Resident"]
    Caretaker["Caretaker"]
    Guardian["Guardian (Phase 2)"]

    P1(("P1: Acquire Vitals"))
    P2(("P2: Acquire Motion"))
    P3(("P3: Classify Fall"))
    P4(("P4: Classify Vital Anomaly"))
    P5(("P5: Generate Alert"))
    P6(("P6: Local Actuation"))
    P7(("P7: Display Sync (Optional)"))

    D1[(D1: Vital Readings)]
    D2[(D2: Motion Events)]
    D3[(D3: Alerts)]

    Resident -- "Optical PPG signals" --> P1
    Resident -- "Body motion signals" --> P2

    P1 -- "Raw vital readings" --> D1
    P1 -- "Vital data stream" --> P4

    P2 -- "Motion vectors" --> P3
    P3 -- "Classified motion events" --> D2

    P3 -- "Fall confirmed (direct)" --> P6
    P4 -- "Vital anomaly (direct)" --> P6

    P3 -- "Fall classification" --> P5
    P4 -- "Anomaly classification" --> P5

    P5 -- "Generated alert" --> D3
    P5 -- "Alert data" --> P7

    P6 -- "Buzzer/LED alarm" --> Resident
    Caretaker -- "Acknowledge / Dismiss" --> P6

    P7 -. "BLE notification (optional)" .-> Caretaker
    P7 -. "Alert notification (Phase 2)" .-> Guardian
```

### DFD Level 1 Process Descriptions

| Process | Input | Output | Description |
|:---|:---|:---|:---|
| P1: Acquire Vitals | Optical PPG signals from MAX30102 | Raw vital readings (HR, SpO2) | Reads MAX30102 I2C registers and extracts heart rate and blood oxygen values |
| P2: Acquire Motion | Body motion from MPU6050 | Raw acceleration vectors (Ax, Ay, Az) | Reads MPU6050 I2C registers for 3-axis acceleration data |
| P3: Classify Fall | Motion vectors from P2 | Fall classification, motion event record | Runs 3-stage SVM check: free-fall (below 0.4g), impact (above 2.5g), stillness (within 0.3g of 1.0g) |
| P4: Classify Vital Anomaly | Vital data from P1 | Anomaly classification | Detects irregular patterns via HRV features (separate from fall detection, never fused) |
| P5: Generate Alert | Classifications from P3 and P4 | Alert record | Creates and stores an alert entry with type, severity, and status |
| P6: Local Actuation | Direct signal from P3 or P4, dismiss from Caretaker | Buzzer/LED output | Drives GPIO to activate or silence the on-wrist alarm. Has zero dependency on P5 or P7 |
| P7: Display Sync (Optional) | Alert data from P5 | BLE notification | Transmits alert to connected web dashboard via BLE GATT. Entirely optional, not part of safety-critical path |

---

## 8. Use Case Diagram (Black Book Section 4.6)

This section models the functional behavior of the **VitalGuard C3** platform from the perspective of external actors, defining the system boundary, primary user roles, and operational use cases. 

Following the user's system architecture and feedback, the **Caretaker, Admin, Guardian, and Family Member are unified into ONE single primary stakeholder (`Caretaker / Guardian (Admin / Family)`)**, directly managing the resident, receiving emergency alerts, and configuring the IoT wearable band.

![VitalGuard C3 Use Case Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_UseCase_Diagram.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_UseCase_Diagram.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_UseCase_Diagram.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_UseCase_Diagram.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_UseCase_Diagram.png).

---

### System Boundary & Actors

- **System Boundary**: `VitalGuard C3 - Eldercare & Fall Monitoring System`
- **Primary Actors**:
  1. **Caretaker / Guardian (Admin / Family) [Left]**:
     - The single unified supervisory stakeholder (family member, on-duty nurse, or system admin).
     - Interacts via the Next.js web dashboard to authenticate, register elderly resident profiles, pair ESP32-C3 wearable devices, stream real-time vitals and accelerometer motion, triage and acknowledge fall alerts, configure safety thresholds, and download clinical export reports.
  2. **Elderly Resident (Monitored Subject) [Right]**:
     - The monitored individual wearing the wristband hardware.
     - Wears the smart band, views live vitals and battery status on the on-wrist OLED display, receives local buzzer/LED alert warnings, triggers the physical manual SOS distress button, cancels false alarms with the local reset button, and receives scheduled medication reminders.

---

### Use Case Functional Specifications

| Use Case ID | Use Case Name | Primary Actor | Pre-condition | Post-condition | Description |
|:---|:---|:---|:---|:---|:---|
| **UC-01** | Login / Authenticate | Caretaker / Guardian (Admin) | Valid credentials | Auth session established | Secure access to the VitalGuard web portal. |
| **UC-02** | Register Resident Profile | Caretaker / Guardian (Admin) | Caretaker logged in | Resident profile stored | Creates elderly patient record with medical history, room number, and emergency details. |
| **UC-03** | Pair & Manage IoT Band | Caretaker / Guardian (Admin) | ESP32-C3 band active | MAC address linked | Binds wearable device hardware to the registered resident profile. |
| **UC-04** | Monitor Live Telemetry (HR & SpO2) | Caretaker / Guardian (Admin) | Active BLE/WiFi stream | Dashboard updated | Displays real-time heart rate, blood oxygen, and battery percentage via WebSockets. |
| **UC-05** | View Motion Activity Stream | Caretaker / Guardian (Admin) | MPU6050 streaming | Activity waveform updated | Visualizes SVM acceleration waveforms and continuous motion classification. |
| **UC-06** | Receive Fall & Anomaly Alerts | Caretaker / Guardian (Admin) | Critical threshold or fall | Alert modal & sound triggered | Dispatches instant visual banner, audio alarm, and automated emergency notification. |
| **UC-07** | Acknowledge & Silence Alarms | Caretaker / Guardian (Admin) | Fall alert active | Alert state = `ACKNOWLEDGED` | Caretaker verifies emergency, silences the on-wrist buzzer remotely, and logs response time. |
| **UC-08** | Configure Thresholds & Export Reports | Caretaker / Guardian (Admin) | Caretaker logged in | Settings saved / File exported | Sets custom vital thresholds and exports historical clinical health reports (PDF/CSV). |
| **UC-09** | Wear Smart Wearable Band | Elderly Resident | Device charged | Continuous sampling started | Resident secures the lightweight ESP32-C3 wristband for continuous monitoring. |
| **UC-10** | View Vitals on Device OLED | Elderly Resident | Device running | Local OLED displayed | Resident directly checks their current pulse, SpO2, and device battery level. |
| **UC-11** | Trigger Manual SOS Alarm | Elderly Resident | Distress button long-pressed | Buzzer + Emergency alert raised | Long-pressing hardware button triggers immediate emergency assistance. |
| **UC-12** | Receive On-Wrist Buzzer Alarm | Elderly Resident | Fall detected by SVM | Audible & visual buzzer active | Immediate feedback alerting the resident and nearby bystanders of detected fall. |
| **UC-13** | Cancel False Alarm (Local Reset) | Elderly Resident | Local buzzer sounding | Alarm cancelled before timeout | Short-pressing reset button within 15 seconds cancels accidental fall triggers. |
| **UC-14** | Receive Medication Reminders | Elderly Resident | Scheduled time reached | Gentle vibration & audio tone | Prompts resident to take prescription medicines and stay hydrated. |
| **UC-15** | Perform Daily Physical Activity | Elderly Resident | Device worn | Step/motion logs recorded | Resident conducts daily routines while continuous motion metrics are analyzed. |

---

### Use Case Diagram (Mermaid Representation)

```mermaid
graph LR
    subgraph System["VitalGuard C3 - Eldercare & Fall Monitoring System"]
        UC1(["Login / Authenticate"])
        UC2(["Register Resident Profile"])
        UC3(["Pair & Manage IoT Band"])
        UC4(["Monitor Live Telemetry (HR & SpO2)"])
        UC5(["View Motion Activity Stream"])
        UC6(["Receive Fall & Anomaly Alerts"])
        UC7(["Acknowledge & Silence Alarms"])
        UC8(["Configure Thresholds & Export Reports"])

        UC9(["Wear Smart Wearable Band"])
        UC10(["View Vitals on Device OLED"])
        UC11(["Trigger Manual SOS Alarm"])
        UC12(["Receive On-Wrist Buzzer Alarm"])
        UC13(["Cancel False Alarm (Local Reset)"])
        UC14(["Receive Medication Reminders"])
        UC15(["Perform Daily Physical Activity"])
    end

    Caretaker["👤 Caretaker / Guardian<br/>(Admin / Family)"]
    Resident["👤 Elderly Resident<br/>(Monitored Subject)"]

    Caretaker --- UC1
    Caretaker --- UC2
    Caretaker --- UC3
    Caretaker --- UC4
    Caretaker --- UC5
    Caretaker --- UC6
    Caretaker --- UC7
    Caretaker --- UC8

    Resident --- UC9
    Resident --- UC10
    Resident --- UC11
    Resident --- UC12
    Resident --- UC13
    Resident --- UC14
    Resident --- UC15
```

---

## 9. Component Diagram (Black Book Section 4.7)

In accordance with **SPPU (Savitribai Phule Pune University) System Design standards**, the Component Diagram documents the **high-level modular software architecture, physical boundaries, and interface contracts** among the subsystems of **VitalGuard C3**.

![VitalGuard C3 Component Diagram](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Component_Diagram.png)

> **Vector Asset:** Vector SVG source available at [VitalGuard_Component_Diagram.svg](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Component_Diagram.svg). Ultra-high resolution 300 DPI raster available at [VitalGuard_Component_Diagram.png](file:///c:/Users/hp/Desktop/NXT/Vital-C3/VitalGuard_Component_Diagram.png).

---

### Component Breakdown Across 3 Tiers

#### Tier 1: Embedded IoT Wearable Package (`ESP32-C3 Firmware`)
* **`Sensor Acquisition Module`**:
  * Directly queries the I2C bus registers of the **MAX30102** optical pulse oximeter and **MPU6050** 6-axis IMU.
  * *Provides*: `ISensorData` interface (raw acceleration vectors and photoplethysmogram samples).
* **`Edge Fall Detection Engine`**:
  * Implements the 3-stage SVM state machine (free-fall dip, dynamic impact, post-fall stillness filter).
  * *Requires*: `ISensorData`.
  * *Provides*: `IFallAlert` interface with incident confidence metrics.
* **`Local Actuation Module`**:
  * Directly interfaces with the onboard GPIO hardware pins to trigger the 85dB piezo buzzer and flashing emergency LED with **zero network dependency**. Monitors the local reset button for false-alarm cancellation.
  * *Requires*: `IFallAlert` (autonomous link) and `IRemoteSilence` (from Guardian web client).

#### Tier 2: Backend Relay & Database Package (`FastAPI / SQLite`)
* **`Telemetry Ingestion & BLE Relay Service`**:
  * Serves as the real-time bridge receiving data streams via BLE GATT notifications or WiFi HTTP/WebSocket packets.
  * *Provides*: `ITelemetryRelay` interface for real-time subscribers.
* **`Time-Series Data Store`**:
  * Handles asynchronous persistence of historical heart rates, blood oxygen levels, and motion events in a local SQLite / TimescaleDB database.
  * *Provides*: `IDataPersistence` interface.
* **`Alert Escalation Service`**:
  * Maintains state machine for active emergencies, logs triage response times, and dispatches automated SMS alerts via Twilio if unacknowledged.
  * *Provides*: `IAlertState` interface.

#### Tier 3: Guardian Client Application Package (`Next.js / TypeScript`)
* **`Live Vitals Charting Engine`**:
  * High-performance canvas-based visualization rendering continuous heart rate, SpO2, and acceleration SVM waveforms.
  * *Requires*: `ITelemetryRelay`.
* **`Guardian Web Dashboard UI`**:
  * Responsive clinical interface for patient administration, status overview, device pairing, and historical report exports.
* **`Emergency Alarm Modal & Triage Service`**:
  * High-priority browser modal triggering audible alarm sirens and visual red alerts; allows the Guardian to send a remote silence command back to the wristband hardware.

---

### Interface Contracts Table

| Interface Name | Provided By | Required By | Protocol / Data Contract |
|:---|:---|:---|:---|
| **`ISensorData`** | Sensor Acquisition Module | Edge Fall Detection Engine | I2C Bus (`0x57`, `0x68`) / Raw 16-bit register structs |
| **`IFallAlert`** | Edge Fall Detection Engine | Local Actuation Module | Internal FreeRTOS EventQueue (`CONFIRMED`, confidence `float`) |
| **`IBLEStream` / `IWiFiStream`** | Embedded Firmware Tier | Telemetry Ingestion Service | BLE GATT Characteristic / HTTP POST (`JSON`) |
| **`ITelemetryRelay`** | Telemetry Ingestion Service | Web Dashboard & Charting | WebSocket Full-Duplex Stream (`ws://...`) |
| **`IDataPersistence`** | Time-Series Data Store | Alert Escalation Service | SQL ORM / ACID SQLite Transaction |
| **`IRemoteSilence`** | Emergency Alarm Modal | Local Actuation Module | WebSocket / BLE Write Command (`SILENCE_ALARM`) |

---

### Component Diagram (Mermaid Representation)

```mermaid
graph TD
    subgraph Firmware["Package: Embedded IoT Wearable (ESP32-C3)"]
        C_Sensor["<<component>><br/><b>Sensor Acquisition Module</b><br/>(MAX30102 & MPU6050)"]
        C_SVM["<<component>><br/><b>Edge Fall Detection Engine</b><br/>(3-Stage SVM Classifier)"]
        C_Act["<<component>><br/><b>Local Actuation Module</b><br/>(Buzzer, LED & Reset Button)"]
    end

    subgraph Backend["Package: Backend Relay & Database (FastAPI / SQLite)"]
        C_Comm["<<component>><br/><b>Telemetry Ingestion Service</b><br/>(WebSocket & BLE Relay)"]
        C_DB["<<component>><br/><b>Time-Series Data Store</b><br/>(SQLite Database)"]
        C_Triage["<<component>><br/><b>Alert Escalation Service</b><br/>(Triage & Status Manager)"]
    end

    subgraph Frontend["Package: Guardian Client Application (Next.js / React)"]
        C_Chart["<<component>><br/><b>Live Vitals Charting Engine</b><br/>(Real-time Canvas / Recharts)"]
        C_UI["<<component>><br/><b>Guardian Web Dashboard</b><br/>(Next.js App Router UI)"]
        C_Modal["<<component>><br/><b>Emergency Alarm Modal</b><br/>(Audio Siren & Triage UI)"]
    end

    C_Sensor -. "ISensorData" .-> C_SVM
    C_SVM -. "IFallAlert (Autonomous)" .-> C_Act

    C_SVM -. "BLE / WiFi Telemetry" .-> C_Comm
    C_Comm -. "IDataPersistence" .-> C_DB
    C_DB -. "IAlertState" .-> C_Triage

    C_Comm -. "WebSocket Live Stream" .-> C_Chart
    C_Chart -. "IVitalsProps" .-> C_UI
    C_Triage -. "WebSocket Emergency Push" .-> C_Modal
    C_UI -. "IModalState" .-> C_Modal

    C_Modal -. "Remote Alarm Silence Command" .-> C_Act
```
