// ─────────────────────────────────────────────
// app/data/BandFrame.ts: Data Layer Contracts
// ─────────────────────────────────────────────

export type BandStatus =
  | 'normal'
  | 'normalStale'
  | 'irregular'
  | 'fall'
  | 'disconnected'
  | 'reconnecting'
  | 'lowBattery';

export interface BandFrame {
  hr: number;            // BPM, 0 = no reading
  spo2: number;          // %, 0 = no reading
  battery: number;       // 0-100
  rhythmFlag: boolean;   // true = irregular pattern noticed
  fall: boolean;         // true = fall detected by SVM
  ts: number;            // Date.now() epoch ms
}

export type BandEventType = 'frame' | 'disconnect' | 'reconnecting';

export interface BandTransport {
  connect(): Promise<void>;
  disconnect(): void;
  on(event: 'frame', cb: (f: BandFrame) => void): void;
  on(event: 'disconnect', cb: () => void): void;
  on(event: 'reconnecting', cb: () => void): void;
  off(event: string, cb: Function): void;
}
