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
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const connectWebSocket = async () => {
    if (!isMountedRef.current) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

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

    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setMode('WEBSOCKET');
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          let parsed: TelemetryData = JSON.parse(event.data);

          if (isSilencedRef.current) {
            // User clicked "I AM OKAY" — neutralize any delayed/buffered fall packets
            if (parsed.fall_detected || parsed.status === 'CRITICAL_FALL') {
              parsed = {
                ...parsed,
                fall_detected: false,
                status: 'NORMAL',
                accel_magnitude: 9.81,
                svm: 1.0,
                heart_rate: parsed.heart_rate > 100 ? 74 : parsed.heart_rate,
              };
            } else {
              // A clean normal packet arrived from the server; re-arm for future falls
              isSilencedRef.current = false;
            }
          }

          setData(parsed);

          if (parsed.fall_detected || parsed.status === 'CRITICAL_FALL') {
            if (!isSilencedRef.current) {
              setIsAlertActive(true);
            }
          }
        } catch (err) {
          console.error('Failed to parse telemetry', err);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setMode('DISCONNECTED');
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = () => {
        try { ws.close(); } catch {}
      };

      wsRef.current = ws;
    } catch (e) {
      setMode('DISCONNECTED');
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
      }
    }
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
          let parsed: TelemetryData = JSON.parse(rawText);
          if (isSilencedRef.current) {
            if (parsed.fall_detected || parsed.status === 'CRITICAL_FALL') {
              parsed = {
                ...parsed,
                fall_detected: false,
                status: 'NORMAL',
                accel_magnitude: 9.81,
                svm: 1.0,
                heart_rate: parsed.heart_rate > 100 ? 74 : parsed.heart_rate,
              };
            } else {
              isSilencedRef.current = false;
            }
          }
          setData(parsed);
          if (parsed.fall_detected || parsed.status === 'CRITICAL_FALL') {
            if (!isSilencedRef.current) {
              setIsAlertActive(true);
            }
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

  const triggerFallAlert = () => {
    isSilencedRef.current = false;
    setIsAlertActive(true);
    setData((prev) => ({
      ...prev,
      heart_rate: 118,
      accel_magnitude: 38.2,
      svm: 3.9,
      fall_detected: true,
      status: 'CRITICAL_FALL',
      timestamp: Date.now(),
    }));
  };

  const dismissAlert = () => {
    isSilencedRef.current = true;
    setIsAlertActive(false);
    setData((prev) => ({
      ...prev,
      heart_rate: prev.heart_rate > 100 ? 74 : prev.heart_rate,
      fall_detected: false,
      status: 'NORMAL',
      accel_magnitude: 9.81,
      svm: 1.0,
      timestamp: Date.now(),
    }));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') 
      : (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000');
    
    import('../app/utils/api').then(({ authFetch }) => {
      authFetch(`${apiUrl}/api/reset-fall`, { method: 'POST' }).catch(() => {});
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();
    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
      if (bleDeviceRef.current?.gatt?.connected) bleDeviceRef.current.gatt.disconnect();
    };
  }, []);

  return { data, mode, isAlertActive, connectBLE, connectWebSocket, dismissAlert, triggerFallAlert };
}
