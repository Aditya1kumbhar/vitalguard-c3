'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { feedback, palette, press, radius, space, spring, type } from './motion.tokens';

export interface PressableButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  feedbackType?: keyof typeof feedback; // default 'tick'
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const PressableButton: React.FC<PressableButtonProps> = ({
  children,
  onPress,
  variant,
  disabled = false,
  feedbackType = 'tick',
  fullWidth = false,
  className = '',
  type: buttonType = 'button',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isPulsing, setIsPulsing] = useState(false);

  const fbConfig = feedback[feedbackType];

  const handlePress = () => {
    if (disabled) return;

    // Trigger haptic vibration if supported
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(fbConfig.vibrate as unknown as number[]);
      } catch {
        // Fallback silently if blocked by browser policy
      }
    }

    // Trigger visual pulse
    if (!shouldReduceMotion) {
      setIsPulsing(true);
    }

    onPress();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: palette.light.text,
          color: palette.light.surface,
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: palette.light.surface,
          color: palette.light.text,
          border: `1px solid ${palette.light.border}`,
        };
      case 'danger':
        return {
          backgroundColor: palette.light.fall,
          color: '#FFFFFF',
          border: 'none',
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <motion.button
      type={buttonType}
      disabled={disabled}
      onClick={handlePress}
      className={className}
      whileTap={
        !disabled && !shouldReduceMotion
          ? { scale: press.scale }
          : undefined
      }
      animate={
        isPulsing && !shouldReduceMotion
          ? { scale: [press.scale, fbConfig.pulseScale, 1] }
          : { scale: 1 }
      }
      onAnimationComplete={() => {
        if (isPulsing) setIsPulsing(false);
      }}
      transition={{
        type: 'spring',
        stiffness: spring.snappy.stiffness,
        damping: spring.snappy.damping,
        mass: spring.snappy.mass,
      }}
      style={{
        ...variantStyle,
        borderRadius: radius.full,
        padding: `${space.sm}px ${space.lg}px`,
        fontSize: type.bodyBold.size,
        fontWeight: type.bodyBold.weight,
        lineHeight: `${type.bodyBold.leading}px`,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </motion.button>
  );
};
