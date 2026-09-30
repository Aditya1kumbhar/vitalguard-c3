# VitalGuard C3 - Engineering Diagrams

**Project:** VitalGuard C3
**Team:** [TEAM_MEMBERS_PENDING_CONFIRMATION]
**Target Hardware:** ESP32-C3 [BOARD_NAME_PENDING], MAX30102 (I2C), MPU6050 (I2C, shared bus), Piezo Buzzer + LED (direct GPIO)
**Power:** 3.7V LiPo battery, charged via the board's own built-in charging circuit

---

## 1. Entity-Relationship (ER) Diagram

This diagram defines the seven data entities, their attributes, and the relationships between them using Chen notation.

> **Notation Disclosure:** Mermaid.js does not support true Chen ER notation. The following required Chen symbols cannot be rendered natively in Mermaid:
> - **Double-outline rectangle** for weak entity (VITAL_READING)
> - **Double-outline ellipse** for multi-valued attributes (guardian_contact, phone)
> - **Dashed-outline ellipse** for derived attribute (age)
> - **Dashed-underlined text** for partial key (seq_no)
> - **Double-outline diamond** for identifying relationship (RECORDS)
> - **Double line** for total participation (DEVICE-RECORDS-VITAL_READING, DEVICE-LOGS-MOTION_EVENT)
>
> The canonical Chen model is therefore described structurally in text below. A supplementary Mermaid erDiagram in **crow's-foot notation (not Chen)** is included afterward for machine-renderable reference only.

### Chen Notation Structural Description

**Entities**

| Entity | Shape | Type |
|:---|:---|:---|
| RESIDENT | Single Rectangle | Strong Entity |
| CARETAKER | Single Rectangle | Strong Entity |
| DEVICE | Single Rectangle | Strong Entity |
| VITAL_READING | Double Rectangle | Weak Entity (existence-dependent on DEVICE) |
| MOTION_EVENT | Single Rectangle | Strong Entity |
| ALERT | Single Rectangle | Strong Entity |
| GUARDIAN | Single Rectangle | Strong Entity (Phase 2 - Not Current Scope) |

**RESIDENT Attributes**
- `resident_id` - Ellipse, underlined (Primary Key)
- `full_name` - Ellipse
- `date_of_birth` - Ellipse
- `age` - Dashed-outline Ellipse (Derived from date_of_birth)
- `guardian_contact` - Double Ellipse (Multi-Valued)
- `room_no` - Ellipse

**CARETAKER Attributes**
- `caretaker_id` - Ellipse, underlined (Primary Key)
- `full_name` - Ellipse
- `email` - Ellipse
- `phone` - Double Ellipse (Multi-Valued)
- `role` - Ellipse

**DEVICE Attributes**
- `device_id` - Ellipse, underlined (Primary Key)
- `board_model` - Ellipse
- `mac_address` - Ellipse
- `battery_level` - Ellipse
- `status` - Ellipse

**VITAL_READING Attributes** (Weak Entity)
- `seq_no` - Ellipse, dashed-underlined (Partial Key)
- `heart_rate` - Ellipse
- `spo2` - Ellipse
- `recorded_at` - Ellipse

**MOTION_EVENT Attributes**
- `event_id` - Ellipse, underlined (Primary Key)
- `event_type` - Ellipse
- `confidence_score` - Ellipse
- `recorded_at` - Ellipse

**ALERT Attributes**
- `alert_id` - Ellipse, underlined (Primary Key)
- `alert_type` - Ellipse
- `severity` - Ellipse
- `status` - Ellipse
- `created_at` - Ellipse

**GUARDIAN Attributes** (Phase 2 - Not Current Scope)
- `guardian_id` - Ellipse, underlined (Primary Key)
- `full_name` - Ellipse
- `phone` - Ellipse
- `relationship` - Ellipse

**Relationships**

| Relationship | Diamond Shape | From | To | Cardinality | Participation |
|:---|:---|:---|:---|:---|:---|
| WEARS | Single Diamond | RESIDENT | DEVICE | 1 : 1 | Partial (Single Line) |
| RECORDS | Double Diamond (Identifying) | DEVICE | VITAL_READING | 1 : M | Total (Double Line) |
| LOGS | Single Diamond | DEVICE | MOTION_EVENT | 1 : M | Total (Double Line) |
| RAISES | Single Diamond | RESIDENT | ALERT | 1 : M | Partial (Single Line) |
| TRIGGERS | Single Diamond | MOTION_EVENT | ALERT | 1 : 0..1 | Partial (Single Line) |
| ACKNOWLEDGES | Single Diamond | CARETAKER | ALERT | 1 : M | Partial (Single Line) |
| REGISTERED_TO | Single Diamond | GUARDIAN | RESIDENT | M : 1 | Partial (Single Line) |
| NOTIFIED_OF | Single Diamond | GUARDIAN | ALERT | 1 : M | Partial (Single Line) |

### Supplementary Reference (Crow's-Foot Notation - NOT Chen)

> This Mermaid block uses crow's-foot notation for quick visual reference. It does **not** represent Chen notation and cannot express multi-valued attributes, derived attributes, partial keys, weak entities, identifying relationships, or total participation lines documented above.

```mermaid
erDiagram
    RESIDENT {
        string resident_id PK
        string full_name
        date date_of_birth
        string room_no
    }
    CARETAKER {
        string caretaker_id PK
        string full_name
        string email
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
        int seq_no "Partial Key - weak entity"
        int heart_rate
        int spo2
        datetime recorded_at
    }
    MOTION_EVENT {
        string event_id PK
        string event_type
        float confidence_score
        datetime recorded_at
    }
    ALERT {
        string alert_id PK
        string alert_type
        string severity
        string status
        datetime created_at
    }
    GUARDIAN {
        string guardian_id PK
        string full_name
        string phone
        string relationship
    }

    RESIDENT ||--|| DEVICE : "WEARS"
    DEVICE ||--|{ VITAL_READING : "RECORDS"
    DEVICE ||--|{ MOTION_EVENT : "LOGS"
    RESIDENT ||--|{ ALERT : "RAISES"
    MOTION_EVENT ||--o| ALERT : "TRIGGERS"
    CARETAKER ||--|{ ALERT : "ACKNOWLEDGES"
    GUARDIAN }|--|| RESIDENT : "REGISTERED_TO"
    GUARDIAN ||--|{ ALERT : "NOTIFIED_OF"
```

---

## 2. Class Diagram

This diagram defines the software class hierarchy with inheritance, composition, and association relationships.

```mermaid
classDiagram
    class Sensor {
        <<abstract>>
        #sensorType : string
        #isActive : bool
        +initialize() void
        +readData() void
    }

    class HeartRateSensor {
        -i2cAddress : uint8_t
        -heartRate : int
        -spo2 : int
        +readPPG() void
        +getHeartRate() int
        +getSpO2() int
    }

    class MotionSensor {
        -accelX : float
        -accelY : float
        -accelZ : float
        +readAcceleration() void
        +computeSVM() float
    }

    class WearableDevice {
        -deviceId : string
        -boardModel : string
        -batteryLevel : int
        -connectionState : string
        +initialize() void
        +run() void
    }

    class AIClassifier {
        -modelType : string
        -threshold : float
        +classifyFall(svm) bool
        +classifyVitalAnomaly(hr, spo2) bool
    }

    class BLEConnector {
        -serviceUUID : string
        -isConnected : bool
        +advertise() void
        +notify(data) void
    }

    class VitalReading {
        -seqNo : int
        -heartRate : int
        -spo2 : int
        -recordedAt : datetime
    }

    class MotionEvent {
        -eventId : string
        -eventType : string
        -confidenceScore : float
        -recordedAt : datetime
    }

    class Alert {
        -alertId : string
        -alertType : string
        -severity : string
        -status : string
        -createdAt : datetime
    }

    class Resident {
        -residentId : string
        -fullName : string
        -roomNo : string
    }

    class Caretaker {
        -caretakerId : string
        -fullName : string
        -role : string
        +acknowledgeAlert(alertId) void
    }

    class Guardian {
        <<Phase2>>
        -guardianId : string
        -fullName : string
        -phone : string
        -relationship : string
    }

    Sensor <|-- HeartRateSensor
    Sensor <|-- MotionSensor
    WearableDevice *-- HeartRateSensor
    WearableDevice *-- MotionSensor
    WearableDevice *-- AIClassifier
    WearableDevice *-- BLEConnector
    AIClassifier --> VitalReading : produces
    AIClassifier --> MotionEvent : produces
    MotionEvent --> Alert : triggers
    Resident --> WearableDevice : wears
    Resident --> VitalReading : has
    Resident --> MotionEvent : has
    Resident --> Alert : raises
    Caretaker --> Alert : acknowledges
    Guardian --> Resident : registered_to
    Guardian --> Alert : notified_of
```

---

## 3. Object Diagram (Runtime Snapshot)

This diagram shows concrete object instances at a specific moment in time: a fall has been detected and an alert is pending acknowledgment.

> **Notation Note:** Mermaid does not have a dedicated object diagram type. The classDiagram syntax is used here with stereotype annotations to represent named object instances.

```mermaid
classDiagram
    class resident1["resident_1 : Resident"] {
        residentId : R001
        fullName : SAMPLE_NAME
        roomNo : 12B
    }

    class device1["device_1 : WearableDevice"] {
        deviceId : D001
        boardModel : ESP32-C3
        batteryLevel : 78
        connectionState : connected
    }

    class motionSensor1["motionSensor_1 : MotionSensor"] {
        accelX : 0.02
        accelY : neg0.01
        accelZ : 0.30
    }

    class aiClassifier1["aiClassifier_1 : AIClassifier"] {
        modelType : DecisionTree
        threshold : 2.5
    }

    class motionEvent1["motionEvent_1 : MotionEvent"] {
        eventId : ME001
        eventType : fall
        confidenceScore : 0.91
    }

    class alert1["alert_1 : Alert"] {
        alertId : A001
        alertType : Fall
        severity : High
        status : Unacknowledged
    }

    class caretaker1["caretaker_1 : Caretaker"] {
        caretakerId : C001
        fullName : SAMPLE_NAME
        role : DutyNurse
    }

    resident1 --> device1 : wears
    device1 *-- motionSensor1 : contains
    device1 *-- aiClassifier1 : contains
    aiClassifier1 --> motionEvent1 : produced
    motionEvent1 --> alert1 : triggered
    caretaker1 ..> alert1 : not_yet_acknowledged
```

---

## 4. Sequence Diagram (Fall Detection and Alert Path)

This diagram traces the message flow during a fall event, from sensor sampling through autonomous on-device actuation and optional remote notification.

```mermaid
sequenceDiagram
    autonumber
    actor Resident
    participant MPU as MPU6050
    participant ESP as ESP32-C3
    participant BUZZ as BuzzerLED
    participant BLE as BLE GATT
    participant WebApp as Web Dashboard

    loop Periodic Sensor Sampling
        ESP->>MPU: Read acceleration registers (Ax, Ay, Az)
        MPU-->>ESP: Return motion vectors
        ESP->>ESP: Compute SVM = sqrt(Ax^2 + Ay^2 + Az^2)
    end

    alt Stage 1: Free-Fall Detected
        ESP->>ESP: SVM drops below 0.4g
    else Stage 2: Impact Detected
        ESP->>ESP: SVM exceeds 2.5g shortly after Stage 1
    else Stage 3: Post-Impact Stillness
        ESP->>ESP: SVM stays within 0.3g of 1.0g for several seconds
    end

    critical Autonomous Local Actuation (Zero Network Dependency)
        ESP->>BUZZ: Drive GPIO HIGH (activate buzzer and LED)
        BUZZ-->>Resident: Audible alarm and visual warning
    end

    opt Best-Effort Remote Notification
        ESP->>BLE: Transmit telemetry via GATT notification
        BLE-->>WebApp: Dispatch BLE event
        WebApp->>WebApp: Render emergency alert modal
    end

    Note over WebApp,ESP: Caretaker checks resident and dismisses alarm
    WebApp->>ESP: Send alarm dismissal command
    ESP->>BUZZ: Drive GPIO LOW (silence buzzer and LED)
```

---

## 5. Activity Diagram

This diagram models the system's operational workflow split across two swimlanes, distinguishing on-device logic from optional network-dependent display.

> **Notation Disclosure:** Mermaid.js does not support native UML activity diagram elements (filled-circle initial/final nodes, fork/join bars, or formal swimlane partitions). Subgraphs are used to approximate swimlanes, and standard flowchart shapes substitute for UML activity notation elements.

```mermaid
flowchart TD
    subgraph fw["Swimlane: ESP32-C3 Firmware"]
        direction TB
        Init(("Start")) --> ReadMotion["Read MPU6050 (Ax, Ay, Az)"]
        Init --> ReadVitals["Read MAX30102 (IR, Red)"]
        ReadMotion --> ComputeSVM["Compute SVM = sqrt of Ax^2 + Ay^2 + Az^2"]
        ReadVitals --> ExtractHR["Extract Heart Rate and SpO2"]
        ComputeSVM --> D1{"[SVM below 0.4g?]"}
        D1 -- Yes --> D2{"[SVM above 2.5g shortly after?]"}
        D1 -- No --> Normal["Normal State"]
        D2 -- Yes --> D3{"[SVM within 0.3g of 1.0g, sustained?]"}
        D2 -- No --> Reset["Reset Triage State"]
        D3 -- Yes --> FallConfirmed["Fall Confirmed"]
        D3 -- No --> Reset
        ExtractHR --> VCheck{"[Irregular HRV Pattern?]"}
        VCheck -- Yes --> VAnomaly["Vital Anomaly Flagged"]
        VCheck -- No --> Normal
        FallConfirmed --> Alarm["Activate Buzzer and LED via GPIO"]
        VAnomaly --> Alarm
        Alarm --> Packet["Assemble Telemetry Packet"]
        Normal --> Packet
        Reset --> Packet
        Silence["Silence Buzzer and LED"] --> ReturnLoop(("Return to Loop"))
        Packet --> ReturnLoop
    end

    subgraph web["Swimlane: Web Dashboard (Optional)"]
        direction TB
        ReceiveBLE["Receive BLE Notification"] --> RenderAlert["Display Alert on Dashboard"]
        RenderAlert --> Dismiss["Caretaker Dismisses Alert"]
    end

    Packet -. "BLE GATT Notification (optional)" .-> ReceiveBLE
    Dismiss -. "Dismiss Command via BLE" .-> Silence
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
