'use client';

import { useState, useEffect, useRef } from 'react';
import { getSession } from '../app/context/authDatabase';

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
const DEVICE_ID_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

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

  const connectWebSocket = async () => {
    if (wsRef.current) wsRef.current.close();
    let wsUrl = getDynamicWsUrl();
    try {
      const session = await getSession();
      if (session && session.token) {
        const sep = wsUrl.includes('?') ? '&' : '?';
        wsUrl = `${wsUrl}${sep}token=${encodeURIComponent(session.token)}`;
      }
    } catch (e) {
      console.warn('Could not retrieve session for WebSocket:', e);
    }
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

      const session = await getSession();
      const userBandId = session?.bandId;

      const device = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: 'VitalGuard' }],
        optionalServices: [SERVICE_UUID],
      });
      bleDeviceRef.current = device;
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      // Enforce 1-to-1 Hardware Privacy: Validate this band belongs to this logged-in account
      try {
        const idChar = await service.getCharacteristic(DEVICE_ID_CHAR_UUID);
        const idVal = await idChar.readValue();
        const hardwareBandId = new TextDecoder().decode(idVal);

        if (userBandId && hardwareBandId && hardwareBandId.toLowerCase() !== userBandId.toLowerCase()) {
          device.gatt.disconnect();
          alert(`Access Denied: This wristband (${hardwareBandId}) is bound to another user's account.\n\nYour registered band: ${userBandId}. Privacy protection active.`);
          setMode('DISCONNECTED');
          return;
        }
      } catch (idErr) {
        // Name fallback check
        if (userBandId && device.name && device.name.includes('-')) {
          const suffix = device.name.split('-')[1];
          if (!userBandId.toLowerCase().includes(suffix.toLowerCase())) {
            device.gatt.disconnect();
            alert(`Access Denied: This wristband (${device.name}) does not match your registered device (${userBandId}).`);
            setMode('DISCONNECTED');
            return;
          }
        }
      }

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
    } catch (error: any) {
      console.warn('BLE Connection notice:', error);
      if (error?.name === 'NotFoundError') {
        alert("No 'VitalGuard-Band' found nearby.\n\nNote: If you don't have the hardware yet, you don't need Bluetooth! The dashboard is already streaming live telemetry via Cloud WebSocket.");
      } else if (error?.name === 'SecurityError') {
        alert("Bluetooth permission denied. Please allow Bluetooth access in your browser settings.");
      }
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') 
      : (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000');
    
    import('../app/utils/api').then(({ authFetch }) => {
      authFetch(`${apiUrl}/api/reset-fall`, { method: 'POST' }).catch(() => {});
    });
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
