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
        borderRadius: dimensions.cardRadius,
        backgroundColor: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: 'none',
        padding: layout.pagePadding,
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
