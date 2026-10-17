'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ringDefaults, spring, type, palette } from './motion.tokens';

export interface RingProps {
  value: number;          // 0–100 (or beyond for overdrive)
  max?: number;           // default 100
  colour: string;         // token colour key, e.g. palette.light.hr
  bgColour: string;       // ring track colour
  size?: number;          // px, default ringDefaults.size
  strokeWidth?: number;   // px, default ringDefaults.strokeWidth
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
  size = ringDefaults.size,
  strokeWidth = ringDefaults.strokeWidth,
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
  const progressRatio = value / clampedMax;
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
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          fill="transparent"
          stroke={bgColour}
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress circle */}
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
              : { type: 'spring', stiffness: spring.ring.stiffness, damping: spring.ring.damping, mass: spring.ring.mass }
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
          maxWidth: size - strokeWidth * 2 - 8,
        }}
      >
        {children ? (
          children
        ) : (
          <>
            {label && (
              <span
                style={{
                  fontSize: type.caption.size,
                  fontWeight: type.caption.weight,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            )}
            <span
              style={{
                fontSize: type.title2.size,
                fontWeight: type.title2.weight,
                lineHeight: `${type.title2.leading}px`,
                color: palette.light.text,
              }}
            >
              {displayValue ?? Math.round(value)}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: type.caption.size,
                  fontWeight: type.caption.weight,
                  lineHeight: `${type.caption.leading}px`,
                  color: palette.light.textSecondary,
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
