"use client";

export const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window === "undefined") return "http://localhost:8000";
  return `http://${window.location.hostname}:8000`;
};

export const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window === "undefined") return "ws://localhost:8000/ws/telemetry";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8000/ws/telemetry`;
};

