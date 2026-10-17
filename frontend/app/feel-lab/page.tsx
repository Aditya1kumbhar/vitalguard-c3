'use client';

import React, { useState, useMemo } from 'react';
import { Ring } from '../design/Ring';
import { Card } from '../design/Card';
import { Sheet } from '../design/Sheet';
import { PressableButton } from '../design/PressableButton';
import { useAmbient } from '../design/AmbientProvider';
import {
  palette,
  space,
  type,
  radius,
  feedback,
  spring,
  duration,
  shadow,
  press,
  fallAlert,
} from '../design/motion.tokens';
import { MockBand } from '../data/MockBand';
import { useBand } from '../data/useBand';
import { BandStatus } from '../data/BandFrame';

export default function FeelLabPage() {
  const [interactiveRingVal, setInteractiveRingVal] = useState(75);
  const [clickCount, setClickCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string>('none');
  const [copiedTokens, setCopiedTokens] = useState(false);

  // Tunable spring state for experimentation
  const [customSprings, setCustomSprings] = useState({
    snappy: { ...spring.snappy },
    sheet: { ...spring.sheet },
    ring: { ...spring.ring },
  });

  const { setOverrideStatus, overrideStatus } = useAmbient();

  const feedbackKeys = ['tick', 'confirm', 'warn', 'alarm', 'settle'] as const;
  const statusList: BandStatus[] = [
    'normal',
    'normalStale',
    'irregular',
    'fall',
    'disconnected',
    'reconnecting',
    'lowBattery',
  ];

  // MockBand demonstration
  const mockTransport = useMemo(() => new MockBand(), []);
  const { frame, status: liveStatus, connect, disconnect, dismissFall } = useBand(mockTransport);
  const [isSimRunning, setIsSimRunning] = useState(false);

  // Sync ambient status with live mock data if no manual override is active
  React.useEffect(() => {
    if (isSimRunning && !overrideStatus) {
      setOverrideStatus(liveStatus);
    }
  }, [liveStatus, isSimRunning, overrideStatus, setOverrideStatus]);

  const toggleMockBand = async () => {
    if (isSimRunning) {
      disconnect();
      setIsSimRunning(false);
      setOverrideStatus(null);
    } else {
      await connect();
      setIsSimRunning(true);
    }
  };

  const copyTokensJson = () => {
    const tokensPayload = {
      spring: customSprings,
      radius,
      duration,
      shadow,
      space,
      press,
      palette,
      feedback,
      fallAlert,
    };
    navigator.clipboard.writeText(JSON.stringify(tokensPayload, null, 2));
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  return (
    <main
      style={{
        padding: space.xl,
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: space.xl,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: space.md }}>
          <div>
            <h1
              style={{
                fontSize: type.title1.size,
                fontWeight: type.title1.weight,
                lineHeight: `${type.title1.leading}px`,
                color: palette.light.text,
                marginBottom: space.xs,
              }}
            >
              Feel Lab
            </h1>
            <p
              style={{
                fontSize: type.body.size,
                fontWeight: type.body.weight,
                lineHeight: `${type.body.leading}px`,
                color: palette.light.textSecondary,
              }}
            >
              Interactive motion tokens, ambient background calibration, and tactile tuning lab.
            </p>
          </div>
          <PressableButton variant="secondary" onPress={copyTokensJson}>
            {copiedTokens ? 'Copied Tokens JSON!' : 'Copy Tokens as JSON'}
          </PressableButton>
        </div>
      </header>

      {/* ── Section 1: Ambient Background & Status Machine ────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          1. Ambient Background &amp; Status Override
        </h2>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space.sm }}>
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                  ACTIVE AMBIENT STATUS:
                </span>{' '}
                <strong style={{ fontSize: type.bodyBold.size, textTransform: 'uppercase', color: palette.light.text }}>
                  {overrideStatus ?? (isSimRunning ? liveStatus : 'Default (Normal)')}
                </strong>
              </div>
              {overrideStatus && (
                <PressableButton
                  variant="secondary"
                  feedbackType="settle"
                  onPress={() => setOverrideStatus(null)}
                >
                  Clear Status Override
                </PressableButton>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm }}>
              {statusList.map((st) => (
                <PressableButton
                  key={st}
                  variant={overrideStatus === st ? 'primary' : 'secondary'}
                  feedbackType="tick"
                  onPress={() => setOverrideStatus(st)}
                >
                  {st}
                </PressableButton>
              ))}
            </div>
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
              Tip: Click &quot;fall&quot; to test instant transition to red ambient gradient. Click &quot;normal&quot; to restore baseline.
            </span>
          </div>
        </Card>
      </section>

      {/* ── Section 2: MockBand 90s Loop ─────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          2. MockBand 90s Scenario Stream
        </h2>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space.sm }}>
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary, textTransform: 'uppercase' }}>
                  STATE MACHINE DERIVED STATUS
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: radius.full,
                      backgroundColor:
                        liveStatus === 'fall'
                          ? palette.light.fall
                          : liveStatus === 'irregular'
                          ? palette.light.irregular
                          : liveStatus === 'disconnected'
                          ? palette.light.disconnect
                          : liveStatus === 'reconnecting'
                          ? palette.light.reconnecting
                          : liveStatus === 'lowBattery'
                          ? palette.light.battery
                          : palette.light.spo2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: type.title3.size,
                      fontWeight: type.title3.weight,
                      color: palette.light.text,
                      textTransform: 'capitalize',
                    }}
                  >
                    {liveStatus}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: space.sm }}>
                <PressableButton
                  variant={isSimRunning ? 'danger' : 'primary'}
                  onPress={toggleMockBand}
                >
                  {isSimRunning ? 'Stop 90s Loop' : 'Start 90s Loop'}
                </PressableButton>
                {liveStatus === 'fall' && (
                  <PressableButton
                    variant="secondary"
                    feedbackType="confirm"
                    onPress={dismissFall}
                  >
                    Dismiss Fall
                  </PressableButton>
                )}
              </div>
            </div>

            {/* Live frame readout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: space.sm,
                backgroundColor: palette.light.bg,
                padding: space.md,
                borderRadius: radius.md,
              }}
            >
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>HEART RATE</span>
                <p style={{ fontSize: type.title3.size, fontWeight: type.title3.weight }}>{frame ? `${frame.hr} bpm` : '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>BLOOD OXYGEN</span>
                <p style={{ fontSize: type.title3.size, fontWeight: type.title3.weight }}>{frame ? `${frame.spo2} %` : '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>BATTERY</span>
                <p style={{ fontSize: type.title3.size, fontWeight: type.title3.weight }}>{frame ? `${frame.battery} %` : '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>IRREGULAR FLAG</span>
                <p style={{ fontSize: type.title3.size, fontWeight: type.title3.weight, color: frame?.rhythmFlag ? palette.light.irregular : palette.light.text }}>
                  {frame ? (frame.rhythmFlag ? 'NOTICE' : 'Clear') : '—'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>FALL FLAG</span>
                <p style={{ fontSize: type.title3.size, fontWeight: type.title3.weight, color: frame?.fall ? palette.light.fall : palette.light.text }}>
                  {frame ? (frame.fall ? 'FALL ACTIVE' : 'Clear') : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Section 3: Ring Variants ────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          3. Rings (0%, 50%, 100%, 110% Overdrive, Interactive 75%)
        </h2>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: space.lg,
            alignItems: 'center',
          }}
        >
          {/* 0% */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
            <Ring
              value={0}
              colour={palette.light.hr}
              bgColour={palette.light.hrBg}
              label="BPM"
              displayValue="0"
              unit="bpm"
            />
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>0%</span>
          </div>

          {/* 50% */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
            <Ring
              value={50}
              colour={palette.light.spo2}
              bgColour={palette.light.spo2Bg}
              label="SpO2"
              displayValue="50"
              unit="%"
            />
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>50%</span>
          </div>

          {/* 100% */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
            <Ring
              value={100}
              colour={palette.light.battery}
              bgColour={palette.light.batteryBg}
              label="Power"
              displayValue="100"
              unit="%"
            />
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>100%</span>
          </div>

          {/* 110% Overdrive */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
            <Ring
              value={110}
              colour={palette.light.activity}
              bgColour={palette.light.activityBg}
              label="Goal"
              displayValue="110"
              unit="%"
            />
            <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>110% (Overdrive)</span>
          </div>

          {/* Interactive 0 -> 75 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
            <Ring
              value={interactiveRingVal}
              colour={palette.light.hr}
              bgColour={palette.light.hrBg}
              label="Test"
              displayValue={String(interactiveRingVal)}
              unit="bpm"
            />
            <div style={{ display: 'flex', gap: space.xs }}>
              <button
                type="button"
                onClick={() => setInteractiveRingVal(0)}
                style={{
                  padding: `${space.xs}px ${space.sm}px`,
                  borderRadius: radius.sm,
                  backgroundColor: palette.light.surface,
                  border: `1px solid ${palette.light.border}`,
                  fontSize: type.caption.size,
                  cursor: 'pointer',
                }}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setInteractiveRingVal(75)}
                style={{
                  padding: `${space.xs}px ${space.sm}px`,
                  borderRadius: radius.sm,
                  backgroundColor: palette.light.surface,
                  border: `1px solid ${palette.light.border}`,
                  fontSize: type.caption.size,
                  cursor: 'pointer',
                }}
              >
                75
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Cards ─────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          4. Cards (Rest, Pressable, Disabled)
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: space.md,
          }}
        >
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>STATIC CARD</span>
              <span style={{ fontSize: type.bodyBold.size, fontWeight: type.bodyBold.weight }}>Rest State</span>
              <p style={{ fontSize: type.body.size, color: palette.light.textSecondary }}>
                Non-interactive card with standard shadow and radius tokens.
              </p>
            </div>
          </Card>

          <Card onPress={() => setClickCount((c) => c + 1)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>PRESSABLE CARD</span>
              <span style={{ fontSize: type.bodyBold.size, fontWeight: type.bodyBold.weight }}>
                Tap Me (Spring 0.96)
              </span>
              <p style={{ fontSize: type.body.size, color: palette.light.textSecondary }}>
                Clicks registered: {clickCount}. Shrinks to 0.96 scale on tap.
              </p>
            </div>
          </Card>

          <Card disabled onPress={() => {}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
              <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>DISABLED CARD</span>
              <span style={{ fontSize: type.bodyBold.size, fontWeight: type.bodyBold.weight }}>Disabled State</span>
              <p style={{ fontSize: type.body.size, color: palette.light.textSecondary }}>
                0.4 opacity with pointer events disabled.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Section 5: Buttons & Haptic Feedback ─────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          5. Pressable Buttons &amp; Tactile Feedback
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.md, alignItems: 'center' }}>
          <PressableButton
            variant="primary"
            feedbackType="confirm"
            onPress={() => setLastFeedback('primary (confirm)')}
          >
            Primary Action
          </PressableButton>

          <PressableButton
            variant="secondary"
            feedbackType="tick"
            onPress={() => setLastFeedback('secondary (tick)')}
          >
            Secondary
          </PressableButton>

          <PressableButton
            variant="danger"
            feedbackType="warn"
            onPress={() => setLastFeedback('danger (warn)')}
          >
            Critical Alert
          </PressableButton>

          <PressableButton
            variant="primary"
            disabled
            onPress={() => {}}
          >
            Disabled
          </PressableButton>
        </div>

        <div style={{ marginTop: space.sm }}>
          <span style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
            Last button trigger: <strong>{lastFeedback}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, marginTop: space.sm }}>
          <span style={{ fontSize: type.caption.size, fontWeight: type.bodyBold.weight, color: palette.light.textSecondary }}>
            FEEDBACK VOCABULARY TEST
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm }}>
            {feedbackKeys.map((key) => (
              <PressableButton
                key={key}
                variant="secondary"
                feedbackType={key}
                onPress={() =>
                  setLastFeedback(
                    `${key} (vibrate: [${feedback[key].vibrate.join(', ')}], scale: ${feedback[key].pulseScale})`
                  )
                }
              >
                {key}
              </PressableButton>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Vaul Sheet ─────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          6. Bottom Sheet (Vaul Drawer)
        </h2>

        <div>
          <PressableButton
            variant="primary"
            feedbackType="settle"
            onPress={() => setSheetOpen(true)}
          >
            Open Test Sheet
          </PressableButton>
        </div>

        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          snapPoints={[0.4, 0.85]}
          title="Feel Lab Test Sheet"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md, paddingTop: space.md }}>
            <h3
              style={{
                fontSize: type.title2.size,
                fontWeight: type.title2.weight,
                lineHeight: `${type.title2.leading}px`,
                color: palette.light.text,
              }}
            >
              Bottom Sheet Preview
            </h3>
            <p
              style={{
                fontSize: type.body.size,
                lineHeight: `${type.body.leading}px`,
                color: palette.light.textSecondary,
              }}
            >
              This sheet snaps to 40% and 85% height using vaul. Drag handle at the top is 36x5px.
            </p>
            <PressableButton
              variant="secondary"
              fullWidth
              onPress={() => setSheetOpen(false)}
            >
              Close Sheet
            </PressableButton>
          </div>
        </Sheet>
      </section>

      {/* ── Section 7: Spring Tuning Sliders ─────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <h2
          style={{
            fontSize: type.title3.size,
            fontWeight: type.title3.weight,
            lineHeight: `${type.title3.leading}px`,
            color: palette.light.text,
          }}
        >
          7. Spring Calibration (Stiffness, Damping, Mass)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: space.md }}>
          {(['snappy', 'sheet', 'ring'] as const).map((springKey) => (
            <Card key={springKey}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
                <span style={{ fontSize: type.bodyBold.size, fontWeight: type.bodyBold.weight, textTransform: 'uppercase' }}>
                  {springKey} spring
                </span>
                <div>
                  <label style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                    Stiffness: {customSprings[springKey].stiffness}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="800"
                    value={customSprings[springKey].stiffness}
                    onChange={(e) =>
                      setCustomSprings((prev) => ({
                        ...prev,
                        [springKey]: { ...prev[springKey], stiffness: Number(e.target.value) },
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                    Damping: {customSprings[springKey].damping}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={customSprings[springKey].damping}
                    onChange={(e) =>
                      setCustomSprings((prev) => ({
                        ...prev,
                        [springKey]: { ...prev[springKey], damping: Number(e.target.value) },
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: type.caption.size, color: palette.light.textSecondary }}>
                    Mass: {customSprings[springKey].mass}
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={customSprings[springKey].mass}
                    onChange={(e) =>
                      setCustomSprings((prev) => ({
                        ...prev,
                        [springKey]: { ...prev[springKey], mass: Number(e.target.value) },
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
