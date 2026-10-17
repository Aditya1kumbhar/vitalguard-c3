import { BandFrame, BandTransport } from './BandFrame';

export const VITALGUARD_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const VITALGUARD_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export class WebBluetoothBand implements BandTransport {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private characteristic: any = null;
  private listeners: { [event: string]: Set<Function> } = {
    frame: new Set(),
    disconnect: new Set(),
    reconnecting: new Set(),
  };

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!WebBluetoothBand.isSupported()) {
      throw new Error(
        'Web Bluetooth is not supported on this browser. iOS Safari does not support Web Bluetooth. Please use Google Chrome on Android, Windows, or macOS.'
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navBluetooth = (navigator as any).bluetooth;

      this.device = await navBluetooth.requestDevice({
        filters: [{ services: [VITALGUARD_SERVICE_UUID] }],
        optionalServices: [VITALGUARD_SERVICE_UUID],
      });

      if (!this.device) {
        throw new Error('No Bluetooth device selected.');
      }

      this.device.addEventListener('gattserverdisconnected', () => {
        this.emit('disconnect');
      });

      this.server = await this.device.gatt?.connect();
      if (!this.server) {
        throw new Error('Could not connect to GATT server.');
      }

      const service = await this.server.getPrimaryService(VITALGUARD_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(VITALGUARD_CHARACTERISTIC_UUID);

      await this.characteristic.startNotifications();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        try {
          const value: DataView = event.target.value;
          const decoder = new TextDecoder('utf-8');
          const jsonStr = decoder.decode(value);
          const parsed = JSON.parse(jsonStr);

          const frame: BandFrame = {
            hr: Number(parsed.hr) || 0,
            spo2: Number(parsed.spo2) || 0,
            battery: Number(parsed.battery) || 0,
            rhythmFlag: Boolean(parsed.rhythmFlag),
            fall: Boolean(parsed.fall),
            ts: Number(parsed.ts) || Date.now(),
          };

          this.emit('frame', frame);
        } catch (err) {
          console.warn('Failed to parse incoming BLE telemetry packet:', err);
        }
      });
    } catch (err) {
      this.emit('disconnect');
      throw err;
    }
  }

  disconnect(): void {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.emit('disconnect');
  }

  on(event: 'frame', cb: (f: BandFrame) => void): void;
  on(event: 'disconnect', cb: () => void): void;
  on(event: 'reconnecting', cb: () => void): void;
  on(event: string, cb: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(cb);
  }

  off(event: string, cb: Function): void {
    if (this.listeners[event]) {
      this.listeners[event].delete(cb);
    }
  }

  private emit(event: string, data?: unknown): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`WebBluetoothBand listener error on ${event}:`, err);
      }
    });
  }
}
