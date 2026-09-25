"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getWsUrl } from "../utils/api";

export interface TelemetryPacket {
  heart_rate: number;
  spo2: number;
  body_temp: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  svm: number;
  fall_detected: boolean;
  stage: string;
  timestamp: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected";

const RECONNECT_DELAY_MS = 2000;

export function useTelemetrySocket() {
  const [latest, setLatest] = useState<TelemetryPacket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setConnectionState("connecting");

    const socket = new WebSocket(getWsUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) return;
      setConnectionState("connected");
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      try {
        const packet: TelemetryPacket = JSON.parse(event.data);
        setLatest(packet);
      } catch {
        // Malformed packet — ignore, don't crash the dashboard.
      }
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      setConnectionState("disconnected");
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  return { latest, connectionState };
}
