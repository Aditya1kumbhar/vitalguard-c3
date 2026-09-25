'use client';

import { useState, useEffect, useRef } from 'react';

export interface TelemetryData {
  heart_rate: number;
  spo2: number;
  accel_magnitude: number;
  fall_detected: boolean;
  status: 'NORMAL' | 'BRADYCARDIA' | 'CRITICAL_FALL';
  timestamp: number;
  accel_x?: number;
  accel_y?: number;
  accel_z?: number;
  svm?: number;
}

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export function useVitalStream(defaultWsUrl?: string) {
  const getDynamicWsUrl = () => {
    if (defaultWsUrl) return defaultWsUrl;
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
    if (typeof window === 'undefined') return 'ws://localhost:8000/ws/telemetry';
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:8000/ws/telemetry`;
  };

  const [data, setData] = useState<TelemetryData>({
    heart_rate: 72,
    spo2: 98,
    accel_magnitude: 9.81,
    fall_detected: false,
    status: 'NORMAL',
    timestamp: Date.now(),
  });
  const [mode, setMode] = useState<'DISCONNECTED' | 'BLE' | 'WEBSOCKET'>('DISCONNECTED');
  const [isAlertActive, setIsAlertActive] = useState(false);
  const isSilencedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bleDeviceRef = useRef<any>(null);

  const connectWebSocket = () => {
    if (wsRef.current) wsRef.current.close();
    const wsUrl = getDynamicWsUrl();
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setMode('WEBSOCKET');
    ws.onmessage = (event) => {
      try {
        const parsed: TelemetryData = JSON.parse(event.data);
        setData(parsed);
        if (parsed.fall_detected) {
          if (!isSilencedRef.current) {
            setIsAlertActive(true);
          }
        } else {
          isSilencedRef.current = false;
          setIsAlertActive(false);
        }
      } catch (err) {
        console.error('Failed to parse telemetry', err);
      }
    };
    ws.onclose = () => setMode('DISCONNECTED');
    wsRef.current = ws;
  };

  const connectBLE = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        alert('Web Bluetooth is not supported on this browser. Use Chrome (Desktop/Android) or Bluefy on iOS.');
        return;
      }
      const device = await nav.bluetooth.requestDevice({
        filters: [{ name: 'VitalGuard-Band' }],
        optionalServices: [SERVICE_UUID],
      });
      bleDeviceRef.current = device;
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      await characteristic.startNotifications();
      setMode('BLE');
      characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
        const rawText = new TextDecoder().decode(e.target.value);
        try {
          const parsed: TelemetryData = JSON.parse(rawText);
          setData(parsed);
          if (parsed.fall_detected) {
            if (!isSilencedRef.current) {
              setIsAlertActive(true);
            }
          } else {
            isSilencedRef.current = false;
            setIsAlertActive(false);
          }
        } catch (err) {
          console.error('BLE Decode error:', err);
        }
      });
      device.addEventListener('gattserverdisconnected', () => setMode('DISCONNECTED'));
    } catch (error) {
      console.error('BLE Connection Failed', error);
    }
  };

  const dismissAlert = () => {
    isSilencedRef.current = true;
    setIsAlertActive(false);
    setData((prev) => ({
      ...prev,
      fall_detected: false,
      status: 'NORMAL',
      accel_magnitude: 9.81,
      svm: 1.0,
    }));
    if (typeof window !== 'undefined') {
      const host = window.location.hostname || 'localhost';
      fetch(`http://${host}:8000/api/reset-fall`, { method: 'POST' }).catch(() => {});
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (bleDeviceRef.current?.gatt?.connected) bleDeviceRef.current.gatt.disconnect();
    };
  }, []);

  return { data, mode, isAlertActive, connectBLE, connectWebSocket, dismissAlert };
}
