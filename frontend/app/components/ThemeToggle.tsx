'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { playHaptic } from '../utils/haptics';

export interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({
  size = 'sm',
  showLabel = false,
  className = '',
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();

  const handleToggle = () => {
    playHaptic('click');
    toggleTheme();
  };

  // Dimensions
  const dimensions = {
    sm: { width: 58, height: 30, thumb: 22, pad: 4, iconSize: 13 },
    md: { width: 72, height: 36, thumb: 28, pad: 4, iconSize: 15 },
    lg: { width: 84, height: 42, thumb: 32, pad: 5, iconSize: 17 },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-400 select-none">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      <motion.button
        type="button"
        role="switch"
        aria-checked={!isDark}
        aria-label="Toggle between dark and light mode"
        onClick={handleToggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          padding: dimensions.pad,
          borderRadius: 9999,
          position: 'relative',
          cursor: 'pointer',
          border: isDark
            ? '1px solid rgba(56, 189, 248, 0.28)'
            : '1px solid rgba(2, 132, 199, 0.35)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 22, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(226, 232, 240, 0.85) 100%)',
          boxShadow: isDark
            ? 'inset 0 1px 2px rgba(255, 255, 255, 0.12), inset 0 -1px 2px rgba(0, 0, 0, 0.6), 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 16px rgba(14, 165, 233, 0.18)'
            : 'inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(0, 0, 0, 0.06), 0 4px 14px rgba(15, 23, 42, 0.08), 0 0 14px rgba(245, 158, 11, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isDark ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Specular Sheen Reflection Layer */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 9999,
            background: isDark
              ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, transparent 60%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Background Track Glyph: Sun (Left) */}
        <span
          style={{
            position: 'absolute',
            left: dimensions.pad + 3,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isDark ? 0.35 : 0.9,
            transition: 'opacity 250ms ease',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={dimensions.iconSize}
            height={dimensions.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDark ? '#94A3B8' : '#F59E0B'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" fill={isDark ? 'none' : '#F59E0B'} />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </span>

        {/* Background Track Glyph: Moon (Right) */}
        <span
          style={{
            position: 'absolute',
            right: dimensions.pad + 3,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isDark ? 0.9 : 0.35,
            transition: 'opacity 250ms ease',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={dimensions.iconSize}
            height={dimensions.iconSize}
            viewBox="0 0 24 24"
            fill={isDark ? '#38BDF8' : 'none'}
            stroke={isDark ? '#38BDF8' : '#64748B'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </span>

        {/* Floating Specular Glass Thumb with Spring Motion */}
        <motion.div
          layout
          transition={{
            type: 'spring',
            stiffness: 520,
            damping: 32,
          }}
          style={{
            width: dimensions.thumb,
            height: dimensions.thumb,
            borderRadius: '50%',
            position: 'relative',
            zIndex: 3,
            background: isDark
              ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)'
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.4)'
              : '1px solid rgba(2, 132, 199, 0.4)',
            boxShadow: isDark
              ? '0 0 14px rgba(14, 165, 233, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.6)'
              : '0 2px 8px rgba(15, 23, 42, 0.15), 0 0 12px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Active Thumb Glyph with micro-rotation animation */}
          {isDark ? (
            <motion.svg
              key="moon-thumb"
              initial={{ rotate: -45, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              width={dimensions.iconSize}
              height={dimensions.iconSize}
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun-thumb"
              initial={{ rotate: 45, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              width={dimensions.iconSize}
              height={dimensions.iconSize}
              viewBox="0 0 24 24"
              fill="#F59E0B"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" fill="#F59E0B" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </motion.svg>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
