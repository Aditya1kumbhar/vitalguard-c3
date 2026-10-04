#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <Wire.h>
#include <esp_mac.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define DEVICE_ID_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a9"
#define BUZZER_PIN          2

BLECharacteristic *pCharacteristic;
BLECharacteristic *pDeviceIdCharacteristic;
bool deviceConnected = false;
char deviceBandId[24] = "VG-C3-0001";

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) { 
        deviceConnected = true; 
        // PRIVACY ENFORCEMENT: Stop advertising while actively connected.
        // Invisible to other phones while in use by the patient/guardian!
        pServer->getAdvertising()->stop();
    };
    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        // Resume advertising when disconnected
        pServer->getAdvertising()->start();
    }
};

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Derive unique hardware band ID from ESP32 factory-burned MAC address
  uint8_t mac[6];
  esp_efuse_mac_get_default(mac);
  snprintf(deviceBandId, sizeof(deviceBandId), "VG-C3-%02X%02X", mac[4], mac[5]);

  char bleName[32];
  snprintf(bleName, sizeof(bleName), "VitalGuard-%02X%02X", mac[4], mac[5]);
  Serial.printf("Initializing BLE Sentinel: %s (Advertised: %s)\n", deviceBandId, bleName);

  BLEDevice::init(bleName);
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // 1. High-frequency telemetry stream
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());

  // 2. Read-only Hardware Identity Characteristic for account binding verification
  pDeviceIdCharacteristic = pService->createCharacteristic(
                              DEVICE_ID_CHAR_UUID,
                              BLECharacteristic::PROPERTY_READ
                            );
  pDeviceIdCharacteristic->setValue(deviceBandId);

  pService->start();
  pServer->getAdvertising()->start();
}

void loop() {
  // Hardware sensor readings are simulated here pending physical assembly
  float ax = 0.2, ay = 0.3, az = 9.8;
  float totalAccel = sqrt((ax * ax) + (ay * ay) + (az * az));
  int heartRate = 72;
  int spo2 = 98;
  bool fall = (totalAccel > 25.0);

  if (fall) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  if (deviceConnected) {
    char buffer[220];
    snprintf(buffer, sizeof(buffer),
      "{\"band_id\":\"%s\",\"heart_rate\":%d,\"spo2\":%d,\"accel_magnitude\":%.2f,\"fall_detected\":%s,\"status\":\"%s\",\"timestamp\":%lu}",
      deviceBandId, heartRate, spo2, totalAccel, fall ? "true" : "false", fall ? "CRITICAL_FALL" : "NORMAL", millis());

    pCharacteristic->setValue(buffer);
    pCharacteristic->notify();
  }
  delay(100); // 10Hz transmission
}
