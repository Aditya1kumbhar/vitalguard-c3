'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BandStatus } from '../data/BandFrame';
import { ambientGradient, ambientGradientDark, duration } from './motion.tokens';

interface AmbientContextValue {
  status: BandStatus;
  setStatus: (status: BandStatus) => void;
  overrideStatus: BandStatus | null;
  setOverrideStatus: (status: BandStatus | null) => void;
}

const AmbientContext = createContext<AmbientContextValue>({
  status: 'normal',
  setStatus: () => {},
  overrideStatus: null,
  setOverrideStatus: () => {},
});

export const useAmbient = () => useContext(AmbientContext);

export interface AmbientProviderProps {
  status?: BandStatus;
  children: React.ReactNode;
}

export const AmbientProvider: React.FC<AmbientProviderProps> = ({
  status: initialStatus = 'normal',
  children,
}) => {
  const [internalStatus, setInternalStatus] = useState<BandStatus>(initialStatus);
  const [overrideStatus, setOverrideStatus] = useState<BandStatus | null>(null);

  // Sync when prop updates
  useEffect(() => {
    if (initialStatus) {
      setInternalStatus(initialStatus);
    }
  }, [initialStatus]);

  const activeStatus = overrideStatus ?? internalStatus;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyGradient = () => {
      const isDark = mediaQuery.matches;
      const gradient = isDark
        ? ambientGradientDark[activeStatus]
        : ambientGradient[activeStatus];

      document.body.style.setProperty('--ambient-speed', `${duration.normal}s`);
      document.body.style.setProperty('--ambient-gradient', gradient);
    };

    applyGradient();

    const handler = () => applyGradient();
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [activeStatus]);

  return (
    <AmbientContext.Provider
      value={{
        status: internalStatus,
        setStatus: setInternalStatus,
        overrideStatus,
        setOverrideStatus,
      }}
    >
      {children}
    </AmbientContext.Provider>
  );
};
