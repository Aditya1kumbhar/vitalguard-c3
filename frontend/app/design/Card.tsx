'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { radius, shadow, palette, press, spring, space } from './motion.tokens';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  disabled = false,
  className = '',
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
        stiffness: spring.snappy.stiffness,
        damping: spring.snappy.damping,
        mass: spring.snappy.mass,
      }}
      style={{
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        backgroundColor: palette.light.surface,
        padding: space.md,
        opacity: disabled ? 0.4 : 1,
        cursor: isInteractive ? 'pointer' : 'default',
        userSelect: isInteractive ? 'none' : 'auto',
        outline: 'none',
      }}
    >
      {children}
    </motion.div>
  );
};
