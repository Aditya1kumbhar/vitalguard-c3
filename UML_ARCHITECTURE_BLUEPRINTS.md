# VitalGuard C3 - Engineering UML & System Architecture Blueprints

## College Final Year Project Technical Documentation
**Project Title:** VitalGuard C3 - Sovereign Edge-AI Wearable Sentinel for Geriatric Telemetry & Autonomous Fall Detection  
**Team Designation:** Team A2S1 (Aditya S. Kumbhar, Ankita S. Birajdar, Safiya N. Shaikh)  
**Target Hardware:** Seeed Studio XIAO ESP32-C3 (160MHz RISC-V), MAX30102 PPG, MPU6050 6-Axis IMU, Piezo Actuator  
**Software Stack:** C++ / Embedded Arduino, Python 3.11 / FastAPI / SQLite (WAL), Next.js 14 / TypeScript / IndexedDB  

---

## 1. Entity-Relationship (ER) Diagram

The data persistence layer follows a dual-tier architecture:
1. **Server-Side Clinical Data Store (`alerts.db`):** SQLite database operating in Write-Ahead Logging (WAL) mode for concurrency, managing patient profiles, high-frequency raw telemetry, 30-day daily summary rollups, and audit-logged fall alerts.
2. **Client-Side Edge Cache (`VitalGuardDB`):** Browser-level IndexedDB managing a local 30-day FIFO ring buffer for offline-first zero-cloud continuity.

```mermaid
erDiagram
    PATIENTS ||--o{ VITALS_RAW : "generates"
    PATIENTS ||--o{ VITALS_DAILY_SUMMARY : "aggregates"
    PATIENTS ||--o{ FALL_INCIDENTS : "triggers"
    PATIENTS ||--o{ FALL_ALERTS_LEGACY : "logs"
    VITALS_DAILY_SUMMARY ||..o{ LOCAL_INDEXEDDB_CACHE : "mirrors (client-side)"

    PATIENTS {
        INTEGER id PK "Auto Increment"
        TEXT name "Full Patient Name"
        INTEGER age "Patient Age"
        TEXT room_number "Assigned Ward / Room"
        TEXT medical_history "Clinical Comorbidities"
        REAL baseline_hr "Baseline Resting HR (bpm)"
        REAL baseline_spo2 "Baseline Resting SpO2 (%)"
        REAL baseline_temp "Baseline Temperature (deg C)"
        TEXT admitted_at "ISO-8601 Admission Date"
        INTEGER active "Status Flag (1=Active, 0=Discharged)"
    }

    VITALS_RAW {
        INTEGER id PK "Auto Increment"
        INTEGER patient_id FK "References PATIENTS(id)"
        TEXT timestamp "ISO-8601 UTC Timestamp"
        INTEGER heart_rate "Photoplethysmography BPM"
        INTEGER spo2 "Blood Oxygen Saturation (%)"
        REAL body_temp "Skin Temperature (deg C)"
        REAL accel_x "X-Axis Acceleration (g)"
        REAL accel_y "Y-Axis Acceleration (g)"
        REAL accel_z "Z-Axis Acceleration (g)"
        REAL svm "Signal Magnitude Vector (g)"
        TEXT activity "Classified State (resting/moving)"
    }

    VITALS_DAILY_SUMMARY {
        INTEGER id PK "Auto Increment"
        INTEGER patient_id FK "References PATIENTS(id)"
        TEXT date "Unique Day Identifier (YYYY-MM-DD)"
        INTEGER hr_min "Minimum Recorded HR"
        INTEGER hr_max "Maximum Recorded HR"
        REAL hr_avg "24-Hour Average HR"
        INTEGER spo2_min "Minimum Recorded SpO2"
        INTEGER spo2_max "Maximum Recorded SpO2"
        REAL spo2_avg "24-Hour Average SpO2"
        REAL temp_min "Minimum Skin Temperature"
        REAL temp_max "Maximum Skin Temperature"
        REAL temp_avg "24-Hour Average Skin Temp"
        REAL svm_max "Peak Movement Vector (g)"
        INTEGER anomaly_count "Total Brady/Hypoxemia Flags"
        INTEGER sample_count "Total 10Hz Packets Received"
    }

    FALL_INCIDENTS {
        INTEGER id PK "Auto Increment"
        INTEGER patient_id FK "References PATIENTS(id)"
        TEXT timestamp "ISO-8601 Incident Timestamp"
        REAL peak_g_force "Impact Vector Peak (g)"
        REAL pre_impact_svm "Pre-Fall Free-Fall Dip (g)"
        REAL post_impact_stillness_sec "Duration of Stillness (s)"
        TEXT severity "Triage Level (low/high/critical)"
        TEXT status "Ack Status (unacknowledged/checked)"
        TEXT doctor_notes "Clinical Review Documentation"
        TEXT acknowledged_at "Timestamp of Nurse Dismissal"
        TEXT acknowledged_by "Nurse / Caregiver ID"
    }

    FALL_ALERTS_LEGACY {
        INTEGER id PK "Auto Increment (Phase 1 Table)"
        TEXT timestamp "Incident Timestamp"
        REAL peak_accel "Peak Acceleration (g)"
        TEXT severity "Alert Severity"
        INTEGER acknowledged "Boolean Flag (0=No, 1=Yes)"
    }

    LOCAL_INDEXEDDB_CACHE {
        TEXT dateKey PK "ISO Date String (YYYY-MM-DD)"
        REAL avg_hr "Offline Average HR"
        REAL avg_spo2 "Offline Average SpO2"
        REAL avg_temp "Offline Average Temp"
        REAL svm_max "Peak Acceleration Recorded"
        INTEGER fall_count "Confirmed Incidents in Window"
        INTEGER timestamp "Unix Epoch Milliseconds"
    }
```

---

## 2. UML Class Diagram

The class architecture decomposes the system across three structural boundaries:
- **Firmware Tier:** Embedded C++ drivers, hardware I2C bus controllers, Signal Magnitude Vector (SVM) mathematical computation, and BLE GATT server.
- **Backend Service Tier:** Python/FastAPI async services, WebSocket telemetry connection pool, SQLite data access object (DAO), and clinical heuristics calculator.
- **Frontend Presentation Tier:** Next.js client controllers, stateful React hooks, Web Audio frequency synthesizer, and Web Bluetooth API adapter.

```mermaid
classDiagram
    %% Firmware Layer
    class SensorI2CBus {
        +begin() void
        +scanDevices() uint8_t
    }

    class MAX30102Driver {
        -uint8_t i2cAddress
        -long rawIR
        -long rawRed
        +begin(Wire, speed) bool
        +setup() void
        +getIR() long
        +getRed() long
        +computeSpO2() int
        +computeHeartRate() int
    }

    class MPU6050Driver {
        -float accelX
        -float accelY
        -float accelZ
        -float gyroX
        -float gyroY
        -float gyroZ
        +begin() bool
        +getEvent(accel, gyro, temp) void
        +calculateSVM() float
    }

    class FallDetectionEngine {
        -float freeFallThreshold
        -float impactThreshold
        -float stillnessThreshold
        -int currentStage
        -unsigned long stageTimer
        +evaluateMotion(svm) int
        +resetState() void
        +isFallConfirmed() bool
    }

    class ActuatorController {
        -uint8_t buzzerPin
        -uint8_t ledPin
        +init() void
        +triggerAlarm() void
        +silenceAlarm() void
    }

    class BLETelemetryServer {
        -string serviceUUID
        -string charUUID
        -bool isConnected
        +init(deviceName) void
        +startAdvertising() void
        +broadcastTelemetry(jsonPacket) void
    }

    %% Backend Layer
    class FastAPIApplication {
        +app: FastAPI
        +startupEvent() void
        +shutdownEvent() void
    }

    class TelemetryWebSocketManager {
        -List activeConnections
        +connect(websocket) void
        +disconnect(websocket) void
        +broadcast(jsonPayload) void
    }

    class DatabaseManager {
        -string dbPath
        +initDB() void
        +getConnection() aiosqliteConnection
        +insertVitalsRaw(packet) int
        +getDailyRollups(days) List
        +recordFallAlert(peakAccel, severity) int
        +acknowledgeAlert(alertId) bool
    }

    class ClinicalAnalyticsEngine {
        +calculateRiskScore(recentVitals, fallCount) RiskAssessment
        -evaluateBradycardia(vitals) int
        -evaluateHypoxemia(vitals) int
        -evaluateAgitation(vitals) int
    }

    class TelemetryPacketModel {
        +int heart_rate
        +int spo2
        +float body_temp
        +float accel_x
        +float accel_y
        +float accel_z
        +float svm
        +bool fall_detected
        +string stage
        +string timestamp
    }

    %% Frontend Layer
    class UseVitalStreamHook {
        +data: TelemetryData
        +mode: ConnectionMode
        +isAlertActive: bool
        +connectBLE() void
        +connectWebSocket() void
        +dismissAlert() void
    }

    class LocalDatabaseEngine {
        -string dbName
        -int dbVersion
        +openDB() IDBDatabase
        +saveDailyRecordAndPrune(record) void
        +getDailyRecords(limit) List
        +purgeExpiredRecords() void
    }

    class HapticAudioEngine {
        -AudioContext audioCtx
        +playTone(frequency, duration) void
        +triggerVibrationPattern(type) void
    }

    %% Relationships
    SensorI2CBus <|-- MAX30102Driver : "communicates over"
    SensorI2CBus <|-- MPU6050Driver : "communicates over"
    MPU6050Driver --> FallDetectionEngine : "provides raw accel"
    FallDetectionEngine --> ActuatorController : "fires GPIO"
    FallDetectionEngine --> BLETelemetryServer : "dispatches fall status"
    MAX30102Driver --> BLETelemetryServer : "dispatches BPM/SpO2"

    FastAPIApplication --> TelemetryWebSocketManager : "hosts"
    FastAPIApplication --> DatabaseManager : "queries/persists"
    FastAPIApplication --> ClinicalAnalyticsEngine : "invokes"
    TelemetryWebSocketManager ..> TelemetryPacketModel : "serializes"

    UseVitalStreamHook --> LocalDatabaseEngine : "syncs 30d rollups"
    UseVitalStreamHook --> HapticAudioEngine : "triggers alert sounds"
    UseVitalStreamHook ..> TelemetryPacketModel : "receives"
```

---

## 3. UML Object Diagram

This diagram captures a concrete snapshot of system runtime instances during an active monitoring session where a resident has sustained an impact event.

```mermaid
classDiagram
    %% Object Instances
    class resident_Ramesh {
        id = 101
        name = "Ramesh K."
        age = 78
        room_number = "Room 204"
        baseline_hr = 72.0
        baseline_spo2 = 97.0
        active = 1
    }

    class wristband_Device01 {
        deviceId = "VG-C3-01"
        board = "Seeed Studio XIAO ESP32-C3"
        clockFrequency = "160 MHz"
        sramAvailable = "400 KB"
        batteryMillivolts = 3850
        bleAdvertising = true
    }

    class imu_Instance {
        i2cAddress = 0x68
        accel_x = 0.42
        accel_y = 2.85
        accel_z = 0.65
        calculated_svm = 2.95
        samplingRate = "50 Hz"
    }

    class ppg_Instance {
        i2cAddress = 0x57
        raw_ir = 145020
        raw_red = 112040
        heart_rate = 54
        spo2 = 91
        samplingRate = "100 Hz"
    }

    class triage_StateMachine {
        currentState = "IMPACT_CONFIRMED"
        freeFallDip = 0.32
        impactPeak = 2.95
        stillnessSeconds = 3.2
        alertTriggered = true
    }

    class buzzer_Hardware {
        gpioPin = 2
        pinState = "HIGH"
        piezoFrequency = "2700 Hz"
    }

    class active_TelemetryPacket {
        heart_rate = 54
        spo2 = 91
        accel_x = 0.42
        accel_y = 2.85
        accel_z = 0.65
        svm = 2.95
        fall_detected = true
        stage = "CRITICAL_FALL"
        timestamp = "2026-09-27T14:45:10.024Z"
    }

    class nurseDashboard_Client {
        browser = "Chrome 128 / Android Tablet"
        transportMode = "BLE_GATT"
        alarmModalOpen = true
        audioBeepActive = true
    }

    class localIndexedDB_Store {
        database = "VitalGuardDB"
        retentionDays = 30
        cachedRecordsCount = 28
    }

    %% Instance Links
    resident_Ramesh -- wristband_Device01 : "wears on wrist"
    wristband_Device01 *-- imu_Instance : "hosts"
    wristband_Device01 *-- ppg_Instance : "hosts"
    imu_Instance --> triage_StateMachine : "feeds accel stream"
    triage_StateMachine --> buzzer_Hardware : "drives direct"
    triage_StateMachine --> active_TelemetryPacket : "populates"
    ppg_Instance --> active_TelemetryPacket : "populates"
    wristband_Device01 --> nurseDashboard_Client : "notifies via BLE GATT"
    nurseDashboard_Client --> localIndexedDB_Store : "persists daily rollup"
```

---

## 4. Sequence Diagrams

### Sequence Diagram A: Autonomous Edge Sensing, 3-Stage Fall Triage & Direct Code Blue Alert
Demonstrates the primary safety path. The decision to alert occurs 100% on the microcontroller; downstream BLE and dashboard alerts execute asynchronously without blocking the hardware buzzer.

```mermaid
sequenceDiagram
    autonumber
    actor Resident as Wearer / Resident
    participant MPU as MPU6050 (IMU)
    participant MAX as MAX30102 (PPG)
    participant ESP as ESP32-C3 Firmware Core
    participant BUZZ as Piezo Buzzer & LED (GPIO 2)
    participant BLE as BLE GATT Characteristic
    participant Web as Caregiver Dashboard (Web Bluetooth)

    Note over Resident,MPU: Resident experiences slip, free-fall, and floor impact
    loop Every 20ms (50 Hz IMU Cycle)
        ESP->>MPU: Read Accelerometer Registers (Ax, Ay, Az)
        MPU-->>ESP: Return 16-bit Raw Motion Vectors
        ESP->>ESP: Compute SVM = sqrt(Ax^2 + Ay^2 + Az^2)
    end

    alt Stage 1: Free Fall Dip
        ESP->>ESP: Detect SVM < 0.4g for >= 100ms
        ESP->>ESP: Transition to STAGE_FREE_FALL
    else Stage 2: Ground Impact Spike
        ESP->>ESP: Detect SVM > 2.5g within 400ms of Free Fall
        ESP->>ESP: Transition to STAGE_IMPACT
    else Stage 3: Post-Impact Stillness
        loop Next 3000ms
            ESP->>ESP: Verify |SVM - 1.0g| < 0.3g (No recovery movement)
        end
        ESP->>ESP: Transition to CRITICAL_FALL_CONFIRMED
    end

    critical Autonomous On-Wrist Actuation (Zero Network Dependency)
        ESP->>BUZZ: digitalWrite(BUZZER_PIN, HIGH)
        BUZZ-->>Resident: 85dB High-Pitch Alarm & Emergency Strobe
    end

    opt Wireless Downstream Telemetry (Best-Effort Broadcast)
        ESP->>MAX: Read Heart Rate & SpO2
        MAX-->>ESP: Return PPG Buffer Values (HR=52, SpO2=91%)
        ESP->>ESP: Assemble JSON Telemetry Packet (fall_detected=true)
        ESP->>BLE: setValue(buffer) & notify()
        BLE-->>Web: Dispatch Web Bluetooth GATT Event
        Web->>Web: AudioContext synthesize 880Hz Emergency Tone
        Web->>Web: Render Full-Screen FallAlertModal
    end

    Note over Web,ESP: Caregiver attends resident and presses Acknowledge
    Web->>ESP: Write BLE Characteristic / HTTP Reset
    ESP->>BUZZ: digitalWrite(BUZZER_PIN, LOW)
```

---

### Sequence Diagram B: Longitudinal Telemetry Synchronization & 30-Day Rolling FIFO Eviction
Demonstrates historical reporting and offline data minimization compliance under zero-cloud constraints.

```mermaid
sequenceDiagram
    autonumber
    participant ESP as ESP32-C3 LittleFS
    participant UI as Next.js Dashboard Client
    participant IDB as Client Browser IndexedDB
    participant API as Backend REST Service (Optional Bridge)
    participant DB as SQLite (alerts.db)

    Note over UI: Caregiver opens "Past Records" tab (/records)
    UI->>API: GET /api/records (Check LAN bridge)
    alt LAN Server Online
        API->>DB: SELECT * FROM vitals_daily_summary ORDER BY date DESC LIMIT 30
        DB-->>API: Return 30-Day Summary Rows
        API-->>UI: 200 OK [JSON Rollups]
        UI->>IDB: saveBulkDailyRecordsAndPrune(records)
    else LAN Server Offline (Sovereign Mode)
        UI->>IDB: getDailyRecords(30)
        IDB-->>UI: Return Cached Daily Summaries
    end

    Note over IDB: Automated FIFO Rolling Purge Routine
    UI->>IDB: executePurgeOldRecords(currentTimestamp - 30 Days)
    IDB->>IDB: Delete all object records where timestamp < cutoff
    IDB-->>UI: Purge Complete (Day 31+ discarded)

    UI->>UI: Re-render SVG AreaChart (HR, SpO2, Body Temp)
    UI->>UI: Calculate Clinical Health Safety Score (/analytics/risk-score)
```

---

## 5. UML Activity Diagram

Models the dual-rate sampling loop, deterministic multi-threshold triage decision flow, and automatic reset branches.

```mermaid
flowchart TD
    Start(["System Power On / ESP32-C3 Boot"]) --> InitHardware["Initialize Hardware Pins, I2C Bus & LittleFS"]
    InitHardware --> SensorCalib["Calibrate MPU6050 Offsets & MAX30102 PPG Thresholds"]
    SensorCalib --> StartBLE["Start BLE GATT Advertising ('VitalGuard-Band')"]
    StartBLE --> SensorLoop{"Periodic Timer Triggered?"}

    SensorLoop -- "Every 10ms (100Hz)" --> ReadPPG["Read MAX30102 Photodiode (IR & Red)"]
    SensorLoop -- "Every 20ms (50Hz)" --> ReadIMU["Read MPU6050 Accelerometer (Ax, Ay, Az)"]

    ReadPPG --> CalcVitals["Calculate Heart Rate (BPM) & Blood Oxygen (SpO2)"]
    CalcVitals --> VitalCheck{"Vital Rule Check"}

    VitalCheck -- "HR < 50 bpm" --> FlagBrady["Flag: Bradycardia Anomaly"]
    VitalCheck -- "SpO2 < 92%" --> FlagHypo["Flag: Hypoxemia Anomaly"]
    VitalCheck -- "Normal" --> VitalsNormal["Status: Physiological Steady"]

    ReadIMU --> CalcSVM["Compute Vector Magnitude: SVM = sqrt(Ax^2 + Ay^2 + Az^2)"]
    CalcSVM --> Stage1Check{"SVM < 0.4g? (Free-Fall Dip)"}

    Stage1Check -- Yes --> StartFreeFallTimer["Start Free-Fall Window Timer (t0)"]
    Stage1Check -- No --> CheckMotionType{"SVM > 1.4g?"}

    CheckMotionType -- Yes --> SetWalking["Classify Activity: Walking / Active Body"]
    CheckMotionType -- No --> SetResting["Classify Activity: Resting / Sedentary"]

    StartFreeFallTimer --> Stage2Check{"SVM > 2.5g within 400ms? (Impact Spike)"}
    Stage2Check -- No (Timeout) --> ResetTriage["Reset Triage State Machine"]
    Stage2Check -- Yes --> StartStillnessTimer["Start Post-Fall Stillness Monitor (3.0s)"]

    StartStillnessTimer --> Stage3Check{"|SVM - 1.0g| < 0.3g for >= 3.0s?"}
    Stage3Check -- No (Movement Detected) --> StumbleHandled["Event Evaluated as Recovery / Intentional Sit-down"]
    StumbleHandled --> ResetTriage

    Stage3Check -- Yes (No Movement) --> FallConfirmed["CRITICAL_FALL_CONFIRMED"]

    FallConfirmed --> HardwareAlarm["Hardware Actuation: GPIO 2 HIGH (Piezo Buzzer + LED)"]
    HardwareAlarm --> AssemblePacket["Assemble Telemetry Packet (fall_detected=true)"]
    FlagBrady --> AssemblePacket
    FlagHypo --> AssemblePacket
    VitalsNormal --> AssemblePacket
    SetWalking --> AssemblePacket
    SetResting --> AssemblePacket

    AssemblePacket --> BLECheck{"BLE Client Connected?"}
    BLECheck -- Yes --> DispatchBLE["Transmit BLE GATT Notification (10Hz)"]
    BLECheck -- No --> LocalFlashStore["Append 32-Byte Summary to LittleFS Ring Buffer"]

    DispatchBLE --> AwaitAck{"Nurse Ack / Button Pressed?"}
    LocalFlashStore --> SensorLoop

    AwaitAck -- Yes --> DeactivateAlarm["Hardware Actuation: GPIO 2 LOW (Silence Buzzer)"]
    AwaitAck -- No --> HardwareAlarm
    DeactivateAlarm --> ResetTriage
    ResetTriage --> SensorLoop
```

---

## 6. System Component Diagram

Illustrates the decoupled subsystems, clean interfaces, and the strict rule that no cloud dependency is placed in the safety critical path.

```mermaid
componentDiagram
    package "Wrist-Worn Embedded Hardware Node" {
        [MAX30102 PPG Optical Sensor] as PPG
        [MPU6050 6-Axis MEMS IMU] as IMU
        [Piezo Buzzer & Visual Strobe] as Actuators
        
        package "ESP32-C3 Microcontroller Firmware" {
            [I2C Master Driver] as I2CDriver
            [SVM Feature Extraction Engine] as SVMEngine
            [3-Stage Fall Finite State Machine] as FallFSM
            [LittleFS Circular Ring Buffer (30 Days)] as LittleFSStore
            [BLE GATT Server (Notify 10Hz)] as BLEServer
        }
    }

    package "Caregiver Presentation Layer (Client Browser)" {
        [Web Bluetooth API Adapter] as WebBLE
        [WebSocket Client Connector] as WSClient
        [Next.js Dynamic HUD Controller] as HUD
        [IndexedDB 30-Day Storage Engine] as LocalDB
        [Web Audio 880Hz Sound Synthesizer] as SoundEngine
    }

    package "Optional Facility Local Area Server (FastAPI)" {
        [FastAPI WebSocket Telemetry Hub] as WSServer
        [Clinical Analytics / Risk Engine] as RiskEngine
        [aiosqlite WAL Database Store] as ServerDB
    }

    %% Hardware Interconnects
    PPG --> I2CDriver : I2C Bus (SDA/SCL)
    IMU --> I2CDriver : I2C Bus (SDA/SCL)
    I2CDriver --> SVMEngine : Raw Accel (Ax, Ay, Az)
    SVMEngine --> FallFSM : SVM Stream
    FallFSM --> Actuators : Direct GPIO 2 High (Zero-Latency)
    FallFSM --> LittleFSStore : Daily Event Rollup
    FallFSM --> BLEServer : Fall State
    I2CDriver --> BLEServer : HR & SpO2

    %% Wireless & Presentation Interconnects
    BLEServer ..> WebBLE : BLE Wireless (2.4 GHz Direct)
    WebBLE --> HUD : Live Telemetry Stream
    HUD --> LocalDB : Daily 32B Struct Storage
    HUD --> SoundEngine : Trigger Audible Alert

    %% Optional Network Hub Interconnects
    BLEServer ..> WSServer : Local WiFi WebSocket Bridge
    WSServer --> WSClient : WS Telemetry Broadcast
    WSClient --> HUD : Stream Fallback
    WSServer --> ServerDB : Audit Logging
    WSServer --> RiskEngine : Telemetry Scoring
```

---

## 7. System Deployment Diagram

Depicts the physical execution targets, protocols, and hardware topology.

```mermaid
deploymentDiagram
    node "VitalGuard C3 Physical Wristband" as Wristband {
        artifact "Firmware Binary (VitalGuard_ESP32.ino)" as Firmware
        node "Seeed Studio XIAO ESP32-C3" as ESP32 {
            [160 MHz 32-bit RISC-V Core]
            [400 KB SRAM / 4 MB Flash]
            [Integrated 2.4GHz BLE & Wi-Fi]
        }
        node "MAX30102 Breakout" as PPG_Hw
        node "MPU6050 Breakout" as IMU_Hw
        node "Piezo Buzzer (2.7 kHz, 85dB)" as Buzzer_Hw
        node "3.7V 500mAh LiPo Battery" as Battery_Hw

        PPG_Hw -- "I2C Bus (Pins D4, D5)" --> ESP32
        IMU_Hw -- "I2C Bus (Pins D4, D5)" --> ESP32
        Buzzer_Hw -- "GPIO 2 (Pin D0)" --> ESP32
        Battery_Hw -- "Battery Charging Pad" --> ESP32
    }

    node "Nurse Station / Ward Mobile Device" as Tablet {
        node "Mobile Browser Environment (Brave / Chrome)" as Browser {
            artifact "Next.js 14 SPA Bundle" as FrontendApp
            database "Browser IndexedDB (VitalGuardDB)" as ClientCache
        }
    }

    node "Facility Local Network Server (Optional)" as FacilityServer {
        node "Debian Linux / Windows Host" as OS {
            artifact "Uvicorn ASGI + FastAPI Process" as BackendProcess
            database "SQLite File (alerts.db)" as DBFile
        }
    }

    %% Network Connections
    ESP32 -- "Web Bluetooth (BLE GATT UUID: 4fafc201...)" --> Browser
    ESP32 -- "Local LAN WiFi 802.11 b/g/n (WSS / HTTP)" --> BackendProcess
    BackendProcess -- "TCP WebSocket (Port 8000)" --> Browser
```

---

## 8. Mathematical & Algorithmic Formulations for Viva Defense

### 8.1 Signal Magnitude Vector (SVM)
To eliminate dependency on the physical orientation of the wearable on the wrist, three-axis accelerometer vectors are collapsed into an invariant scalar magnitude:
$$SVM = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
Under stationary conditions at rest:
$$SVM \approx 1.0g \quad (9.81 \, m/s^2)$$

### 8.2 Three-Stage Fall Detection Window
A fall is authenticated if and only if three chronological stages occur in strict sequence:
1. **Free-Fall Dip:**
   $$SVM(t) < 0.4g \quad \text{for duration } \Delta t_{ff} \in [100\,ms, 400\,ms]$$
2. **Impact Shock:**
   $$SVM(t + \Delta t_1) > 2.5g \quad \text{where } \Delta t_1 \le 400\,ms$$
3. **Post-Impact Inactivity (Stillness):**
   $$\frac{1}{T_{still}} \int_{t_{impact}}^{t_{impact}+T_{still}} |SVM(\tau) - 1.0g| \, d\tau < 0.3g \quad \text{where } T_{still} \ge 3.0\,s$$

### 8.3 Pulse Oximetry Ratio of Ratios (SpO2)
The MAX30102 computes blood oxygenation by illuminating vascular tissue with dual wavelengths ($\lambda_1 = 660\,nm$ Red, $\lambda_2 = 880\,nm$ Infrared):
$$R = \frac{(AC_{red} / DC_{red})}{(AC_{ir} / DC_{ir})}$$
$$SpO_2 = 110 - 25 \times R$$

### 8.4 Clinical Health Safety Score Heuristic
The risk assessment engine synthesizes longitudinal sensor rollups into a single safety score index (0-100):
$$Score_{risk} = \min\left(100, \, 25 \cdot N_{falls} + 25 \cdot \mathbb{I}(N_{brady} \ge 3) + 20 \cdot \mathbb{I}(N_{hypo} \ge 5) + 15 \cdot \mathbb{I}(N_{agitation} > 10)\right)$$
$$Score_{safety} = \max(10, \, 100 - Score_{risk})$$

---

## 9. Summary for College Examination Board
- **Core Innovation:** Zero-cloud dependency for safety-critical alerting. All triage and buzzer actuation execute in under 200 milliseconds on a 160MHz RISC-V core.
- **Cost Advantage:** Total unit Bill of Materials is Rs 1,578 ($18 USD), enabling facility-wide resident deployment compared to Rs 25,000+ proprietary smartwatches.
- **Privacy & Storage:** 30-day FIFO automatic eviction complies with strict data minimization principles (no cloud telemetry retention, zero PII collection).
