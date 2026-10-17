'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dimensions, spring, colors } from './motion.tokens';

export interface RingProps {
  value: number;          // 0-100 or actual HR reading
  max?: number;           // default 100
  colour: string;         // e.g. colors.heart (#FF375F)
  bgColour: string;       // e.g. colors.heartTrack
  size?: number;          // px, default dimensions.heroRingSize (200)
  strokeWidth?: number;   // px, default dimensions.heroRingStroke (16)
  glowFilter?: string;    // drop-shadow string
  label?: string;         // center top label
  displayValue?: string;  // center large number
  unit?: string;          // center bottom unit
  children?: React.ReactNode;
  'aria-label'?: string;
}

export const Ring: React.FC<RingProps> = ({
  value,
  max = 100,
  colour,
  bgColour,
  size = dimensions.heroRingSize,
  strokeWidth = dimensions.heroRingStroke,
  glowFilter,
  label,
  displayValue,
  unit,
  children,
  'aria-label': ariaLabelProp,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const clampedMax = max <= 0 ? 100 : max;
  const progressRatio = Math.max(0, Math.min(value / clampedMax, 1.5));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const calculatedAriaLabel =
    ariaLabelProp ??
    (label
      ? `${label}: ${displayValue ?? Math.round(value)}${unit ? ' ' + unit : ''}`
      : `${Math.round(value)} of ${clampedMax}`);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={clampedMax}
      aria-label={calculatedAriaLabel}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: glowFilter ?? 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      >
        {/* Track circle (20% opacity) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          fill="transparent"
          stroke={bgColour}
          strokeWidth={strokeWidth}
        />
        {/* Animated Sweep Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          fill="transparent"
          stroke={colour}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: spring.ring.stiffness, damping: spring.ring.damping }
          }
        />
      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
          maxWidth: size - strokeWidth * 2 - 4,
        }}
      >
        {children ? (
          children
        ) : (
          <>
            {label && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: colors.textSecondary,
                  marginBottom: 2,
                }}
              >
                {label}
              </span>
            )}
            <span
              style={{
                fontSize: size >= 150 ? 64 : 28,
                fontWeight: 700,
                lineHeight: size >= 150 ? '64px' : '34px',
                fontVariantNumeric: 'tabular-nums',
                color: colors.textPrimary,
              }}
            >
              {displayValue ?? Math.round(value)}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {unit}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
