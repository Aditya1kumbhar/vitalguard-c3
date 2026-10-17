'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  Heart,
  Activity,
  Bluetooth,
  Battery,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  WifiOff,
  Radio,
  Info,
} from 'lucide-react';
import { Ring } from './design/Ring';
import { Card } from './design/Card';
import { PressableButton } from './design/PressableButton';
import { FallAlertSheet } from './design/FallAlertSheet';
import { useAmbient } from './design/AmbientProvider';
import { MockBand } from './data/MockBand';
import { WebBluetoothBand } from './data/WebBluetoothBand';
import { useBand } from './data/useBand';
import {
  palette,
  space,
  type,
  radius,
  ringDefaults,
} from './design/motion.tokens';

export default function DashboardPage() {
  const [transportMode, setTransportMode] = useState<'mock' | 'ble'>('mock');
  const [isBleSupported, setIsBleSupported] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Instantiating transports
  const mockTransport = useMemo(() => new MockBand(), []);
  const bleTransport = useMemo(() => new WebBluetoothBand(), []);

  const activeTransport = transportMode === 'mock' ? mockTransport : bleTransport;
  const { frame, status, connect, disconnect, dismissFall } = useBand(activeTransport);
  const { setOverrideStatus } = useAmbient();

  // Detect Web Bluetooth support on client mount
  useEffect(() => {
    setIsBleSupported(WebBluetoothBand.isSupported());
  }, []);

  // Sync ambient background with state machine status
  useEffect(() => {
    setOverrideStatus(status);
  }, [status, setOverrideStatus]);

  // Auto-connect MockBand by default on initial mount
  useEffect(() => {
    if (transportMode === 'mock') {
      mockTransport.connect().then(() => setIsConnected(true));
      return () => {
        mockTransport.disconnect();
        setIsConnected(false);
      };
    }
  }, [mockTransport, transportMode]);

  const handleModeChange = (newMode: 'mock' | 'ble') => {
    if (newMode === transportMode) return;
    disconnect();
    setIsConnected(false);
    setConnectionError(null);
    setTransportMode(newMode);
  };

  const handleConnectionToggle = async () => {
    setConnectionError(null);
    if (isConnected) {
      disconnect();
      setIsConnected(false);
    } else {
      try {
        await connect();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
        const msg = err instanceof Error ? err.message : 'Failed to connect to device.';
        setConnectionError(msg);
      }
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'fall':
        return palette.light.fall;
      case 'irregular':
        return palette.light.irregular;
      case 'lowBattery':
        return palette.light.battery;
      case 'disconnected':
        return palette.light.disconnect;
      case 'reconnecting':
        return palette.light.reconnecting;
      case 'normalStale':
        return palette.light.disconnect;
      case 'normal':
      default:
        return palette.light.spo2;
    }
  };

  const hrValue = frame?.hr ?? 0;
  const spo2Value = frame?.spo2 ?? 0;
  const batteryValue = frame?.battery ?? 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: `${space.xl}px ${space.lg}px ${space.xxl}px ${space.lg}px`,
        maxWidth: 720,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: space.lg,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Top Safe-Area Header ───────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: space.sm,
          paddingTop: space.sm,
          paddingBottom: space.xs,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
            <div
              style={{
                width: space.sm + space.xs,
                height: space.sm + space.xs,
                borderRadius: radius.full,
                backgroundColor: getStatusColor(),
              }}
            />
            <span
              style={{
                fontSize: type.title3.size,
                fontWeight: type.title3.weight,
                lineHeight: `${type.title3.leading}px`,
                color: palette.light.text,
                letterSpacing: '-0.02em',
              }}
            >
              VitalGuard C3
            </span>
          </div>

          {/* Battery & Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: space.xs,
              backgroundColor: palette.light.surfaceAlpha,
              padding: `${space.xs}px ${space.sm}px`,
              borderRadius: radius.full,
              border: `1px solid ${palette.light.border}`,
            }}
          >
            <Battery
              size={type.body.size}
              color={batteryValue <= 15 ? palette.light.irregular : palette.light.textSecondary}
            />
            <span
              style={{
                fontSize: type.caption.size,
                fontWeight: type.caption.weight,
                color: palette.light.textSecondary,
              }}
            >
              {frame ? `${batteryValue}%` : '—'}
            </span>
          </div>
        </div>

        {/* ── Transport Mode Segmented Toggle ──────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: palette.light.surfaceAlpha,
            padding: space.xs,
            borderRadius: radius.full,
            border: `1px solid ${palette.light.border}`,
            gap: space.xs,
          }}
        >
          <button
            type="button"
            onClick={() => handleModeChange('mock')}
            style={{
              border: 'none',
              borderRadius: radius.full,
              padding: `${space.xs}px ${space.sm}px`,
              backgroundColor: transportMode === 'mock' ? palette.light.text : 'transparent',
              color: transportMode === 'mock' ? palette.light.surface : palette.light.textSecondary,
              fontSize: type.caption.size,
              fontWeight: type.bodyBold.weight,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: space.xs,
            }}
          >
            <Radio size={12} />
            Mock 90s Loop
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('ble')}
            style={{
              border: 'none',
              borderRadius: radius.full,
              padding: `${space.xs}px ${space.sm}px`,
              backgroundColor: transportMode === 'ble' ? palette.light.text : 'transparent',
              color: transportMode === 'ble' ? palette.light.surface : palette.light.textSecondary,
              fontSize: type.caption.size,
              fontWeight: type.bodyBold.weight,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: space.xs,
            }}
          >
            <Bluetooth size={12} />
            Web Bluetooth (ESP32)
          </button>
        </div>
      </header>

      {/* ── BLE Platform Guard (iOS Safari / Unsupported browser) ── */}
      {transportMode === 'ble' && !isBleSupported && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: space.md }}>
            <Info size={type.title2.size} color={palette.light.irregular} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
              <span
                style={{
                  fontSize: type.bodyBold.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.text,
                }}
              >
                Bluetooth not available on this browser
              </span>
              <p
                style={{
                  fontSize: type.caption.size,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
                  margin: 0,
                }}
              >
                Web Bluetooth is supported on Google Chrome (Android, Windows, macOS, ChromeOS).
                <strong> Note: iOS Safari does not support Web Bluetooth.</strong> Switch back to
                &quot;Mock 90s Loop&quot; to test the entire dashboard experience.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Connection error banner */}
      {connectionError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <AlertTriangle size={type.title2.size} color={palette.light.fall} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: type.bodyBold.size, fontWeight: type.bodyBold.weight, color: palette.light.fall }}>
                Connection Failed
              </span>
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                {connectionError}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ── State Machine Notice Banners ───────────────────────── */}
      {status === 'irregular' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <AlertTriangle size={type.title2.size} color={palette.light.irregular} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: type.bodyBold.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.text,
                }}
              >
                Irregular pattern noticed
              </span>
              <span
                style={{
                  fontSize: type.caption.size,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
                }}
              >
                Heart rate readings show unusual fluctuation while at rest. Take a relaxing breath.
              </span>
            </div>
          </div>
        </Card>
      )}

      {status === 'lowBattery' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <Battery size={type.title2.size} color={palette.light.battery} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: type.bodyBold.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.text,
                }}
              >
                Low battery alert
              </span>
              <span
                style={{
                  fontSize: type.caption.size,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
                }}
              >
                Band power is below 15%. Connect to charger to continue monitoring.
              </span>
            </div>
          </div>
        </Card>
      )}

      {status === 'disconnected' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <WifiOff size={type.title2.size} color={palette.light.disconnect} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: type.bodyBold.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.text,
                }}
              >
                Band disconnected
              </span>
              <span
                style={{
                  fontSize: type.caption.size,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
                }}
              >
                Ensure your wrist band is powered on and within Bluetooth range.
              </span>
            </div>
          </div>
        </Card>
      )}

      {status === 'reconnecting' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <RefreshCw size={type.title2.size} color={palette.light.reconnecting} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: type.bodyBold.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.text,
                }}
              >
                Reconnecting…
              </span>
              <span
                style={{
                  fontSize: type.caption.size,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
                }}
              >
                Attempting to re-establish secure telemetry with your wrist band.
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Two Large Rings Side-by-Side ──────────────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: space.lg,
        }}
      >
        {/* Heart Rate Ring */}
        <Card className="flex flex-col items-center justify-center">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: space.md,
              padding: space.sm,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
              <Heart size={type.body.size} color={palette.light.hr} />
              <span
                style={{
                  fontSize: type.caption.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.textSecondary,
                  letterSpacing: '0.04em',
                }}
              >
                HEART RATE
              </span>
            </div>
            <Ring
              value={hrValue}
              max={180}
              colour={palette.light.hr}
              bgColour={palette.light.hrBg}
              size={ringDefaults.size + space.lg}
              strokeWidth={ringDefaults.strokeWidth + space.xs}
              displayValue={hrValue > 0 ? String(hrValue) : '—'}
              unit="BPM"
            />
          </div>
        </Card>

        {/* Blood Oxygen SpO2 Ring */}
        <Card className="flex flex-col items-center justify-center">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: space.md,
              padding: space.sm,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
              <Activity size={type.body.size} color={palette.light.spo2} />
              <span
                style={{
                  fontSize: type.caption.size,
                  fontWeight: type.bodyBold.weight,
                  color: palette.light.textSecondary,
                  letterSpacing: '0.04em',
                }}
              >
                BLOOD OXYGEN
              </span>
            </div>
            <Ring
              value={spo2Value}
              max={100}
              colour={palette.light.spo2}
              bgColour={palette.light.spo2Bg}
              size={ringDefaults.size + space.lg}
              strokeWidth={ringDefaults.strokeWidth + space.xs}
              displayValue={spo2Value > 0 ? String(spo2Value) : '—'}
              unit="%"
            />
          </div>
        </Card>
      </section>

      {/* ── Telemetry & Wellness Card Grid ────────────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: space.md,
        }}
      >
        {/* Connection status card */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
              <Bluetooth size={type.body.size} color={palette.light.activity} />
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                CONNECTION
              </span>
            </div>
            <span
              style={{
                fontSize: type.bodyBold.size,
                fontWeight: type.bodyBold.weight,
                color: palette.light.text,
                textTransform: 'capitalize',
              }}
            >
              {status}
            </span>
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
              {isConnected ? `Active (${transportMode === 'mock' ? 'Mock' : 'BLE'})` : 'Offline'}
            </span>
          </div>
        </Card>

        {/* Activity & Rhythm status card */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
              <ShieldCheck size={type.body.size} color={palette.light.spo2} />
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                WELLNESS SUMMARY
              </span>
            </div>
            <span
              style={{
                fontSize: type.bodyBold.size,
                fontWeight: type.bodyBold.weight,
                color: palette.light.text,
              }}
            >
              {frame?.rhythmFlag ? 'Irregular notice' : 'Steady rhythm'}
            </span>
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
              Continuous sensor verification
            </span>
          </div>
        </Card>

        {/* Battery Detail card */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
              <Battery size={type.body.size} color={palette.light.battery} />
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                BATTERY DETAIL
              </span>
            </div>
            <span
              style={{
                fontSize: type.bodyBold.size,
                fontWeight: type.bodyBold.weight,
                color: palette.light.text,
              }}
            >
              {frame ? `${frame.battery}% Remaining` : '—'}
            </span>
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
              {batteryValue <= 15 ? 'Charge recommended' : 'Optimal charge level'}
            </span>
          </div>
        </Card>
      </section>

      {/* ── Bottom Action Control ─────────────────────────────── */}
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: space.md,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <PressableButton
          variant={isConnected ? 'secondary' : 'primary'}
          feedbackType="confirm"
          fullWidth
          disabled={transportMode === 'ble' && !isBleSupported}
          onPress={handleConnectionToggle}
        >
          {transportMode === 'ble' && !isBleSupported
            ? 'BLE Unsupported on this Browser'
            : isConnected
            ? 'Disconnect Band'
            : 'Connect Band'}
        </PressableButton>
      </footer>

      {/* Fall Alert Verification Flow */}
      <FallAlertSheet open={status === 'fall'} onConfirmSafe={dismissFall} />
    </div>
  );
}
