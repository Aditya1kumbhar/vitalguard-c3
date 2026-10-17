'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type GlassIconName =
  | 'heart'
  | 'oxygen'
  | 'battery'
  | 'shield-check'
  | 'shield-alert'
  | 'activity'
  | 'pulse'
  | 'gauge'
  | 'temp'
  | 'brain'
  | 'records'
  | 'medical'
  | 'database'
  | 'users'
  | 'sliders'
  | 'bluetooth'
  | 'radio'
  | 'printer'
  | 'check'
  | 'alert'
  | 'refresh'
  | 'calendar';

export type GlassVariant = 'rose' | 'cyan' | 'emerald' | 'amber' | 'blue' | 'slate';

interface GlassIconProps {
  name: GlassIconName;
  variant?: GlassVariant;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  interactive?: boolean;
  glow?: boolean;
}

const variantStyles: Record<
  GlassVariant,
  {
    bg: string;
    border: string;
    glow: string;
    iconGradient: [string, string];
    highlight: string;
  }
> = {
  rose: {
    bg: 'linear-gradient(135deg, rgba(255, 55, 95, 0.28) 0%, rgba(255, 55, 95, 0.08) 100%)',
    border: 'rgba(255, 55, 95, 0.45)',
    glow: 'rgba(255, 55, 95, 0.35)',
    iconGradient: ['#FF375F', '#FF6482'],
    highlight: 'rgba(255, 140, 165, 0.6)',
  },
  cyan: {
    bg: 'linear-gradient(135deg, rgba(14, 165, 233, 0.28) 0%, rgba(14, 165, 233, 0.08) 100%)',
    border: 'rgba(56, 189, 248, 0.45)',
    glow: 'rgba(14, 165, 233, 0.35)',
    iconGradient: ['#38BDF8', '#0EA5E9'],
    highlight: 'rgba(186, 230, 253, 0.6)',
  },
  emerald: {
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(16, 185, 129, 0.08) 100%)',
    border: 'rgba(52, 211, 153, 0.45)',
    glow: 'rgba(16, 185, 129, 0.35)',
    iconGradient: ['#34D399', '#10B981'],
    highlight: 'rgba(167, 243, 208, 0.6)',
  },
  amber: {
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, rgba(245, 158, 11, 0.08) 100%)',
    border: 'rgba(251, 191, 36, 0.45)',
    glow: 'rgba(245, 158, 11, 0.35)',
    iconGradient: ['#FBBF24', '#F59E0B'],
    highlight: 'rgba(254, 243, 199, 0.6)',
  },
  blue: {
    bg: 'linear-gradient(135deg, rgba(2, 132, 199, 0.28) 0%, rgba(2, 132, 199, 0.08) 100%)',
    border: 'rgba(56, 189, 248, 0.45)',
    glow: 'rgba(2, 132, 199, 0.35)',
    iconGradient: ['#38BDF8', '#0284C7'],
    highlight: 'rgba(186, 230, 253, 0.6)',
  },
  slate: {
    bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.22) 0%, rgba(148, 163, 184, 0.05) 100%)',
    border: 'rgba(203, 213, 225, 0.35)',
    glow: 'rgba(148, 163, 184, 0.25)',
    iconGradient: ['#E2E8F0', '#94A3B8'],
    highlight: 'rgba(255, 255, 255, 0.5)',
  },
};

const defaultVariantMap: Record<GlassIconName, GlassVariant> = {
  heart: 'rose',
  oxygen: 'cyan',
  battery: 'emerald',
  'shield-check': 'emerald',
  'shield-alert': 'rose',
  activity: 'cyan',
  pulse: 'cyan',
  gauge: 'amber',
  temp: 'amber',
  brain: 'cyan',
  records: 'cyan',
  medical: 'cyan',
  database: 'cyan',
  users: 'cyan',
  sliders: 'cyan',
  bluetooth: 'emerald',
  radio: 'cyan',
  printer: 'slate',
  check: 'emerald',
  alert: 'rose',
  refresh: 'slate',
  calendar: 'cyan',
};

export function GlassIcon({
  name,
  variant,
  size = 'md',
  className = '',
  interactive = true,
  glow = true,
}: GlassIconProps) {
  const chosenVariant = variant || defaultVariantMap[name] || 'cyan';
  const v = variantStyles[chosenVariant];

  const dimensionMap: Record<string, number> = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 52,
  };

  const dim = typeof size === 'number' ? size : dimensionMap[size] || 36;
  const iconDim = Math.round(dim * 0.52);

  // SVG Paths for each medical & clinical icon
  const renderSvg = (gradId: string) => {
    switch (name) {
      case 'heart':
        return (
          <path
            d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'oxygen':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v5m4 4h5M7 12H2m13.5 3.5L19 19m-14 0l3.5-3.5" opacity="0.6" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="5" />
            <path d="M10 10a2 2 0 0 1 2-2" stroke="white" strokeWidth="1.5" opacity="0.8" />
          </g>
        );
      case 'battery':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="16" height="12" rx="3" />
            <path d="M6 10h4" strokeWidth="2" />
            <path d="M21 10v4" strokeWidth="2.5" />
          </g>
        );
      case 'shield-check':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a12 12 0 0 0 8.5 3.5A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6.5 12 12 0 0 0 12 3z" />
            <path d="M9 12l2 2 4-4" strokeWidth="2.2" />
          </g>
        );
      case 'shield-alert':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a12 12 0 0 0 8.5 3.5A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6.5 12 12 0 0 0 12 3z" />
            <path d="M12 8v5" strokeWidth="2.2" />
            <circle cx="12" cy="16" r="0.8" fill={`url(#${gradId})`} stroke="none" />
          </g>
        );
      case 'activity':
      case 'pulse':
        return (
          <path
            d="M3 12h4l2.5-6 4.5 13 3-9 2 4h5"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'gauge':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 14v-4" strokeWidth="2.4" />
            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
            <circle cx="12" cy="14" r="1.5" fill={`url(#${gradId})`} />
          </g>
        );
      case 'temp':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            <circle cx="11.5" cy="17.5" r="1.5" fill={`url(#${gradId})`} stroke="none" />
          </g>
        );
      case 'brain':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2a4.5 4.5 0 0 0-4.5 4.5v1a3 3 0 0 0-1 5.83V14a3 3 0 0 0 2.5 3v1a3.5 3.5 0 0 0 3 3.5" />
            <path d="M14.5 2a4.5 4.5 0 0 1 4.5 4.5v1a3 3 0 0 1 1 5.83V14a3 3 0 0 1-2.5 3v1a3.5 3.5 0 0 1-3 3.5" />
            <path d="M12 2v19" strokeWidth="1.5" opacity="0.6" />
          </g>
        );
      case 'records':
      case 'medical':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3" width="16" height="18" rx="2.5" />
            <path d="M8 8h8M8 12h8M8 16h5" strokeWidth="2.2" />
            <path d="M15 15l2 2 3-3" stroke="white" strokeWidth="1.8" opacity="0.9" />
          </g>
        );
      case 'database':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
            <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
          </g>
        );
      case 'users':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </g>
        );
      case 'sliders':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
            <circle cx="4" cy="12" r="2" fill={`url(#${gradId})`} />
            <circle cx="12" cy="10" r="2" fill={`url(#${gradId})`} />
            <circle cx="20" cy="14" r="2" fill={`url(#${gradId})`} />
          </g>
        );
      case 'bluetooth':
        return (
          <path
            d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'radio':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2.5" fill={`url(#${gradId})`} />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m12.72-4.24a10 10 0 0 1 0 14.14m-16.96 0a10 10 0 0 1 0-14.14" />
          </g>
        );
      case 'printer':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" rx="1.5" />
          </g>
        );
      case 'check':
        return (
          <path
            d="M20 6L9 17l-5-5"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'alert':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" strokeWidth="2.4" />
            <circle cx="12" cy="17" r="0.8" fill={`url(#${gradId})`} stroke="none" />
          </g>
        );
      case 'refresh':
        return (
          <path
            d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'calendar':
        return (
          <g fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
            <circle cx="8" cy="14" r="1" fill={`url(#${gradId})`} />
            <circle cx="12" cy="14" r="1" fill={`url(#${gradId})`} />
            <circle cx="16" cy="14" r="1" fill={`url(#${gradId})`} />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.07, y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
      }}
    >
      {/* ── Layer 1: Ambient Chromatic Refraction Glow ── */}
      {glow && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: Math.round(dim * 0.32),
            background: v.glow,
            filter: `blur(${Math.round(dim * 0.28)}px)`,
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* ── Layer 2: Multi-Layered Frosted Glass Capsule ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: Math.round(dim * 0.3),
          background: v.bg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1.2px solid ${v.border}`,
          boxShadow: `inset 0 1px 1px 0 ${v.highlight}, 0 4px 14px rgba(0, 0, 0, 0.45)`,
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Specular Diagonal Glass Sheen Reflection */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Layer 3: Crisp Foreground Icon Graphic with Gradient Depth ── */}
      <svg
        viewBox="0 0 24 24"
        style={{
          width: iconDim,
          height: iconDim,
          position: 'relative',
          zIndex: 2,
          filter: `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))`,
        }}
      >
        <defs>
          <linearGradient id={`glassGrad_${chosenVariant}_${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={v.iconGradient[0]} />
            <stop offset="100%" stopColor={v.iconGradient[1]} />
          </linearGradient>
        </defs>
        <g stroke={`url(#glassGrad_${chosenVariant}_${name})`} fill={`url(#glassGrad_${chosenVariant}_${name})`}>
          {renderSvg(`glassGrad_${chosenVariant}_${name}`)}
        </g>
      </svg>
    </motion.div>
  );
}

export default GlassIcon;
