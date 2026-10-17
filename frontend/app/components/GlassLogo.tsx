'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface GlassLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  isFalling?: boolean;
  showStatusDot?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function GlassLogo({
  size = 'md',
  isFalling = false,
  showStatusDot = true,
  interactive = true,
  className = '',
  onClick,
}: GlassLogoProps) {
  const sizeMap: Record<string, number> = {
    sm: 36,
    md: 46,
    lg: 58,
    xl: 76,
  };

  const dim = typeof size === 'number' ? size : sizeMap[size] || 46;
  const dotSize = Math.max(7, Math.round(dim * 0.18));

  const glowColor = isFalling ? 'rgba(244, 63, 94, 0.45)' : 'rgba(20, 184, 166, 0.4)';
  const borderHighlight = isFalling
    ? 'rgba(255, 120, 140, 0.4)'
    : 'rgba(255, 255, 255, 0.28)';

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.06 } : undefined}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        width: dim,
        height: dim,
      }}
    >
      {/* ── Layer 1: Ambient Chromatic Glow ────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '26%',
          background: isFalling
            ? 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.45) 0%, rgba(14, 165, 233, 0.3) 50%, transparent 75%)',
          filter: 'blur(10px)',
          opacity: 0.85,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 2: Apple Squircle Frosted Glass Base Capsule ─── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '22.5%', // Authentic Apple iOS continuous squircle ratio
          background: isFalling
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.28) 0%, rgba(136, 19, 55, 0.4) 60%, rgba(18, 22, 29, 0.85) 100%)'
            : 'linear-gradient(135deg, rgba(20, 184, 166, 0.28) 0%, rgba(14, 165, 233, 0.18) 45%, rgba(18, 22, 29, 0.85) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${borderHighlight}`,
          boxShadow: `
            inset 0 1.5px 1.5px rgba(255, 255, 255, 0.55),
            inset 0 -1.5px 2px rgba(0, 0, 0, 0.5),
            0 8px 24px -4px rgba(0, 0, 0, 0.7),
            0 0 18px ${glowColor}
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* ── Layer 3: Specular Reflection Sheen (Glass Prism) ─── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '22.5%',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 65%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* ── Layer 4: Interlocking VG Logo ────────────────────── */}
        <img
          src="/logo-tight.png"
          alt="VitalGuard Logo"
          style={{
            width: '74%',
            height: '74%',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 3,
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.55))',
          }}
        />
      </div>

      {/* ── Layer 5: Live Status Indicator (Optional) ──────────── */}
      {showStatusDot && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: dotSize,
            height: dotSize,
            zIndex: 10,
            display: 'flex',
          }}
        >
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isFalling ? 'bg-rose-400' : 'bg-emerald-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-full w-full border border-black/40 ${
              isFalling ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E]' : 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
            }`}
          />
        </span>
      )}
    </motion.div>
  );
}
