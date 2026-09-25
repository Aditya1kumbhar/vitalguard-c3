#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <Wire.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BUZZER_PIN          2

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) { deviceConnected = true; };
    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        pServer->getAdvertising()->start();
    }
};

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  BLEDevice::init("VitalGuard-Band");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
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
    char buffer[180];
    snprintf(buffer, sizeof(buffer),
      "{\"heart_rate\":%d,\"spo2\":%d,\"accel_magnitude\":%.2f,\"fall_detected\":%s,\"status\":\"%s\",\"timestamp\":%lu}",
      heartRate, spo2, totalAccel, fall ? "true" : "false", fall ? "CRITICAL_FALL" : "NORMAL", millis());

    pCharacteristic->setValue(buffer);
    pCharacteristic->notify();
  }
  delay(100); // 10Hz transmission
}
