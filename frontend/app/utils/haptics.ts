"use client";

export type HapticType = "click" | "soft" | "pop" | "warning" | "emergency";

const VIBRATE_PATTERNS: Record<HapticType, number | number[]> = {
  soft: 5,
  click: 8,
  pop: 15,
  warning: [30, 40, 30],
  emergency: [100, 80, 100, 80, 200],
};

export function playHaptic(type: HapticType = "click") {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(VIBRATE_PATTERNS[type]);
    } catch {
      // Ignore vibration error
    }
  }
}
