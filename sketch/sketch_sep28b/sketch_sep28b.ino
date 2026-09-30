void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000); // Wait for serial port to connect
  Serial.println("VitalGuard C3: XIAO ESP32-C3 is working properly!");
}

void loop() {
  Serial.println("System heartbeat alive...");
  delay(1000);
}
