'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import GlassIcon from '../components/GlassIcon';
import { Sheet } from './Sheet';
import {
  colors,
  dimensions,
  fallAlert,
  feedback,
  layout,
  spring,
  typography,
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

  useEffect(() => {
    if (!open) {
      setSecondsLeft(fallAlert.countdownSeconds);
      dragX.set(0);
      return;
    }

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
      animate(dragX, 0, {
        type: 'spring',
        stiffness: spring.default.stiffness,
        damping: spring.default.damping,
        mass: spring.default.mass,
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
      snapPoints={[0.88]}
      title="Safety Verification Alert"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: layout.sectionGap,
          paddingBottom: layout.pagePadding,
          gap: layout.sectionGap,
        }}
      >
        {/* Pulsing Alert Icon */}
        <GlassIcon name="shield-alert" size="lg" variant="rose" glow={true} />

        {/* Heading & Wellness Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: layout.gridUnit / 2 }}>
          <h2
            style={{
              fontSize: typography.appTitle.size,
              fontWeight: typography.appTitle.weight,
              lineHeight: typography.appTitle.lineHeight,
              color: colors.fall,
              margin: 0,
            }}
          >
            Are you okay?
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: '22px',
              color: colors.textSecondary,
              maxWidth: 300,
              margin: '0 auto',
            }}
          >
            A sudden movement or impact pattern was noticed. Please confirm you are safe.
          </p>
        </div>

        {/* Countdown Escalation Pill */}
        <div
          style={{
            backgroundColor: 'rgba(255, 69, 58, 0.15)',
            padding: `${layout.gridUnit}px ${layout.sectionGap}px`,
            borderRadius: dimensions.pillRadius,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.fall,
            }}
          >
            {labelText}
          </span>
        </div>

        {/* Slide-to-Confirm Rail */}
        <div style={{ width: '100%', maxWidth: 350, marginTop: layout.gridUnit }}>
          <div
            ref={railRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 56,
              borderRadius: dimensions.pillRadius,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.textSecondary,
                letterSpacing: '0.04em',
                pointerEvents: 'none',
              }}
            >
              Slide to confirm safe &gt;&gt;
            </span>

            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 56,
                height: 56,
                borderRadius: dimensions.pillRadius,
                backgroundColor: colors.fall,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                x: dragX,
                zIndex: 2,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 294 }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
              whileTap={{ cursor: 'grabbing' }}
            >
              <ChevronRight size={24} color="#FFFFFF" strokeWidth={2.5} />
            </motion.div>
          </div>
        </div>
      </div>
    </Sheet>
  );
};
