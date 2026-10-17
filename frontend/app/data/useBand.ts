'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BandFrame, BandStatus, BandTransport } from './BandFrame';
import { duration } from '../design/motion.tokens';

export function useBand(transport: BandTransport) {
  const [frame, setFrame] = useState<BandFrame | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [fallDismissed, setFallDismissed] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const lastFrameTimeRef = useRef<number>(0);
  const transportRef = useRef(transport);
  transportRef.current = transport;

  // Stale check interval
  useEffect(() => {
    const staleInterval = setInterval(() => {
      if (connectionState === 'connected' && lastFrameTimeRef.current > 0) {
        const elapsedSec = (Date.now() - lastFrameTimeRef.current) / 1000;
        setIsStale(elapsedSec >= duration.staleData);
      } else {
        setIsStale(false);
      }
    }, 1000);

    return () => clearInterval(staleInterval);
  }, [connectionState]);

  // Connect & listen to transport events
  useEffect(() => {
    const currentTransport = transportRef.current;

    const handleFrame = (newFrame: BandFrame) => {
      lastFrameTimeRef.current = Date.now();
      setIsStale(false);
      setConnectionState('connected');

      // If fall has cleared on device, reset dismissal flag
      if (!newFrame.fall) {
        setFallDismissed(false);
      }

      setFrame(newFrame);
    };

    const handleDisconnect = () => {
      setConnectionState('disconnected');
    };

    const handleReconnecting = () => {
      setConnectionState('reconnecting');
    };

    currentTransport.on('frame', handleFrame);
    currentTransport.on('disconnect', handleDisconnect);
    currentTransport.on('reconnecting', handleReconnecting);

    return () => {
      currentTransport.off('frame', handleFrame);
      currentTransport.off('disconnect', handleDisconnect);
      currentTransport.off('reconnecting', handleReconnecting);
    };
  }, [transport]);

  const connect = useCallback(async () => {
    setConnectionState('connecting');
    try {
      await transportRef.current.connect();
      setConnectionState('connected');
    } catch (err) {
      setConnectionState('disconnected');
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    transportRef.current.disconnect();
    setConnectionState('disconnected');
    setFrame(null);
  }, []);

  const dismissFall = useCallback(() => {
    setFallDismissed(true);
  }, []);

  // Compute status by strict priority:
  // fall > disconnected > reconnecting > irregular > lowBattery > normalStale > normal
  let status: BandStatus = 'normal';

  if (frame?.fall && !fallDismissed) {
    status = 'fall';
  } else if (connectionState === 'disconnected') {
    status = 'disconnected';
  } else if (connectionState === 'reconnecting') {
    status = 'reconnecting';
  } else if (frame?.rhythmFlag) {
    status = 'irregular';
  } else if (frame && frame.battery <= 15) {
    status = 'lowBattery';
  } else if (isStale) {
    status = 'normalStale';
  } else {
    status = 'normal';
  }

  return {
    frame,
    status,
    connect,
    disconnect,
    dismissFall,
  };
}
