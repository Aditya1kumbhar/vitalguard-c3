"use client";

import { getSession } from "../context/authDatabase";

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

// Authenticated fetch wrapper
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const session = await getSession();
  const headers = new Headers(options.headers || {});
  
  // Note: For a fully integrated backend, session.token would be the JWT returned by /api/auth/login.
  // We attach a dummy token here if not present so backend passes if it's relaxed, 
  // or we expect the user to have acquired the token during the PIN setup in login.
  if (session && session.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
