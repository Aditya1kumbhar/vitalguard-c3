import { BandFrame, BandTransport } from './BandFrame';

export class MockBand implements BandTransport {
  private listeners: { [event: string]: Set<Function> } = {
    frame: new Set(),
    disconnect: new Set(),
    reconnecting: new Set(),
  };

  private timer: NodeJS.Timeout | null = null;
  private currentSecond = 0;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;
    this.isConnected = true;
    this.currentSecond = 0;

    // Start emitting 1 frame per second
    this.timer = setInterval(() => {
      this.tick();
    }, 1000);

    // Initial immediate tick
    this.tick();
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isConnected = false;
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
        console.error(`MockBand listener error on ${event}:`, err);
      }
    });
  }

  private tick(): void {
    const t = this.currentSecond % 90;

    // Scenario logic per spec:
    // 75-78s: Disconnect
    if (t === 75) {
      this.emit('disconnect');
      this.currentSecond++;
      return;
    }

    if (t > 75 && t < 78) {
      // Still disconnected, emit no frames
      this.currentSecond++;
      return;
    }

    // 78s: Reconnecting
    if (t === 78) {
      this.emit('reconnecting');
      this.currentSecond++;
      return;
    }

    // Generate frame according to scenario
    let hr = 70;
    let spo2 = 98;
    let battery = 85;
    let rhythmFlag = false;
    let fall = false;

    if (t >= 0 && t < 15) {
      // 0-15s: Calm baseline (68-72 bpm)
      hr = 68 + (t % 5);
      spo2 = 98;
      battery = 85;
    } else if (t >= 15 && t < 25) {
      // 15-25s: HR rising (72 -> 95)
      const ratio = (t - 15) / 10;
      hr = Math.round(72 + ratio * (95 - 72));
      spo2 = 97;
      battery = 83;
    } else if (t >= 25 && t < 35) {
      // 25-35s: Irregular pattern (88-105, rhythmFlag true)
      hr = 88 + ((t * 7) % 18);
      spo2 = 96;
      battery = 80;
      rhythmFlag = true;
    } else if (t >= 35 && t < 38) {
      // 35-38s: Pre-fall
      hr = 110;
      spo2 = 95;
      battery = 78;
    } else if (t >= 38 && t < 40) {
      // 38-40s: FALL
      hr = 118;
      spo2 = 94;
      battery = 78;
      fall = true;
    } else if (t >= 40 && t < 55) {
      // 40-55s: Post-fall (persists until dismissed or t=55)
      hr = 105;
      spo2 = 93;
      battery = 76;
      fall = true;
    } else if (t >= 55 && t < 65) {
      // 55-65s: SpO2 dropout
      hr = 80;
      spo2 = 0;
      battery = 74;
    } else if (t >= 65 && t < 75) {
      // 65-75s: Low battery (<= 15)
      hr = 72;
      spo2 = 97;
      battery = 12;
    } else if (t >= 78 && t < 90) {
      // 78-90s: Reconnected & calm
      hr = 70;
      spo2 = 98;
      battery = 11;
    }

    const frame: BandFrame = {
      hr,
      spo2,
      battery,
      rhythmFlag,
      fall,
      ts: Date.now(),
    };

    this.emit('frame', frame);
    this.currentSecond++;
  }
}
