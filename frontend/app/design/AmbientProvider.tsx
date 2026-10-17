'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BandStatus } from '../data/BandFrame';
import { ambientOverlay, colors } from './motion.tokens';

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

  useEffect(() => {
    if (initialStatus) {
      setInternalStatus(initialStatus);
    }
  }, [initialStatus]);

  const activeStatus = overrideStatus ?? internalStatus;

  const getOverlayForStatus = (st: BandStatus) => {
    switch (st) {
      case 'fall':
        return ambientOverlay.fall;
      case 'irregular':
        return ambientOverlay.irregular;
      case 'disconnected':
      case 'normalStale':
        return ambientOverlay.disconnected;
      case 'normal':
      case 'reconnecting':
      case 'lowBattery':
      default:
        return ambientOverlay.normal;
    }
  };

  const overlayGradient = getOverlayForStatus(activeStatus);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.bg;
    }
  }, []);

  return (
    <AmbientContext.Provider
      value={{
        status: internalStatus,
        setStatus: setInternalStatus,
        overrideStatus,
        setOverrideStatus,
      }}
    >
      {/* Fixed top-center 600px radial gradient overlay with 1200ms ease transition */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: overlayGradient,
          transition: `background-image ${ambientOverlay.transition}`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </AmbientContext.Provider>
  );
};
