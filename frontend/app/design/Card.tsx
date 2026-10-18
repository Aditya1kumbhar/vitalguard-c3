'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { colors, dimensions, layout, press, spring } from './motion.tokens';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  disabled = false,
  className = '',
  style = {},
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isInteractive = Boolean(onPress) && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive || !onPress) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPress();
    }
  };

  return (
    <motion.div
      role={onPress ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-disabled={disabled ? true : undefined}
      onClick={isInteractive ? onPress : undefined}
      onKeyDown={handleKeyDown}
      className={className}
      whileTap={
        isInteractive && !shouldReduceMotion
          ? { scale: press.scale }
          : undefined
      }
      transition={{
        type: 'spring',
        stiffness: spring.default.stiffness,
        damping: spring.default.damping,
        mass: spring.default.mass,
      }}
      style={{
        borderRadius: 24,
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transform: 'translateZ(0)',
        border: '1px solid var(--border-card)',
        boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.05) inset',
        padding: '24px',
        opacity: disabled ? 0.4 : 1,
        cursor: isInteractive ? 'pointer' : 'default',
        userSelect: isInteractive ? 'none' : 'auto',
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
};
