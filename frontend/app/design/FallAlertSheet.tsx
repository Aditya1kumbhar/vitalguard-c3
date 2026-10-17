'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { Sheet } from './Sheet';
import {
  fallAlert,
  feedback,
  palette,
  radius,
  space,
  spring,
  type,
} from './motion.tokens';

export interface FallAlertSheetProps {
  open: boolean;
  onConfirmSafe: () => void;
}

export const FallAlertSheet: React.FC<FallAlertSheetProps> = ({
  open,
  onConfirmSafe,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(fallAlert.countdownSeconds);
  const railRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  // Countdown timer & recurring alarm feedback every 2s
  useEffect(() => {
    if (!open) {
      setSecondsLeft(fallAlert.countdownSeconds);
      dragX.set(0);
      return;
    }

    // Alarm haptic loop
    const triggerAlarm = () => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(feedback.alarm.vibrate as unknown as number[]);
        } catch {
          // Fallback safely
        }
      }
    };

    triggerAlarm();
    const alarmInterval = setInterval(triggerAlarm, 2000);

    // Countdown interval
    const countdownInterval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(alarmInterval);
      clearInterval(countdownInterval);
    };
  }, [open, dragX]);

  const handleDragEnd = () => {
    if (!railRef.current) return;
    const railWidth = railRef.current.clientWidth;
    const thumbWidth = 56;
    const maxDistance = railWidth - thumbWidth;

    const currentDistance = dragX.get();
    const ratio = currentDistance / maxDistance;

    if (ratio >= fallAlert.dismissThreshold) {
      // Confirmed safe!
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(feedback.confirm.vibrate as unknown as number[]);
        } catch {
          // Fallback safely
        }
      }
      onConfirmSafe();
      dragX.set(0);
    } else {
      // Snap back with snappy spring
      animate(dragX, 0, {
        type: 'spring',
        stiffness: spring.snappy.stiffness,
        damping: spring.snappy.damping,
        mass: spring.snappy.mass,
      });
    }
  };

  const labelText =
    secondsLeft > 0
      ? `Notifying emergency contact in ${secondsLeft}s`
      : `Emergency escalation active (${Math.abs(secondsLeft)}s)`;

  return (
    <Sheet
      open={open}
      onOpenChange={() => {}}
      dismissible={false}
      snapPoints={[0.92]}
      title="Safety Verification Alert"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: space.md,
          paddingBottom: space.xl,
          gap: space.lg,
        }}
      >
        {/* Pulsing Alert Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: radius.full,
            backgroundColor: palette.light.fallBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={36} color={palette.light.fall} />
        </div>

        {/* Heading & Wellness Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
          <h2
            style={{
              fontSize: type.large.size,
              fontWeight: type.large.weight,
              lineHeight: `${type.large.leading}px`,
              color: palette.light.fall,
              margin: 0,
            }}
          >
            Are you okay?
          </h2>
          <p
            style={{
              fontSize: type.body.size,
              lineHeight: `${type.body.leading}px`,
              color: palette.light.textSecondary,
              maxWidth: 320,
              margin: '0 auto',
            }}
          >
            A sudden movement or impact pattern was noticed. Please confirm you are safe.
          </p>
        </div>

        {/* Countdown Escalation Label */}
        <div
          style={{
            backgroundColor: palette.light.fallBg,
            padding: `${space.xs}px ${space.md}px`,
            borderRadius: radius.full,
          }}
        >
          <span
            style={{
              fontSize: type.caption.size,
              fontWeight: type.bodyBold.weight,
              color: palette.light.fall,
            }}
          >
            {labelText}
          </span>
        </div>

        {/* ── Slide-to-Confirm Rail ────────────────────────────── */}
        <div style={{ width: '100%', maxWidth: 360, marginTop: space.md }}>
          <div
            ref={railRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 56,
              borderRadius: radius.full,
              backgroundColor: palette.light.surfaceAlpha,
              border: `1px solid ${palette.light.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            {/* Background Hint Text */}
            <span
              style={{
                fontSize: type.bodyBold.size,
                fontWeight: type.bodyBold.weight,
                color: palette.light.textSecondary,
                letterSpacing: '0.02em',
                pointerEvents: 'none',
              }}
            >
              Slide to confirm safe &gt;&gt;
            </span>

            {/* Draggable Slider Thumb */}
            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 56,
                height: 56,
                borderRadius: radius.full,
                backgroundColor: palette.light.fall,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                x: dragX,
                zIndex: 2,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 304 }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
              whileTap={{ cursor: 'grabbing' }}
            >
              <ChevronRight size={24} color="#FFFFFF" />
            </motion.div>
          </div>
        </div>
      </div>
    </Sheet>
  );
};
