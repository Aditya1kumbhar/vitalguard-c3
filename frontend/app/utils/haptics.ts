"use client";

/**
 * iOS-inspired Tactile & Acoustic Micro-Feedback Engine
 * Uses Web Vibration API and synthesized Web Audio (zero external asset files needed)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type HapticType = "click" | "soft" | "pop" | "warning" | "emergency";

export function playHaptic(type: HapticType = "click") {
  if (typeof window === "undefined") return;

  // 1. Hardware Vibration Haptics
  if ("vibrate" in navigator) {
    try {
      switch (type) {
        case "click":
          navigator.vibrate(8);
          break;
        case "soft":
          navigator.vibrate(5);
          break;
        case "pop":
          navigator.vibrate(15);
          break;
        case "warning":
          navigator.vibrate([30, 40, 30]);
          break;
        case "emergency":
          navigator.vibrate([400, 200, 400, 200, 600]);
          break;
      }
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Synthesized Physical Micro-Acoustics
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case "click":
        // Crisp iOS-style mechanical spring tap (800Hz -> 200Hz in 25ms)
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.025);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.03);
        break;

      case "soft":
        // Subtle soft bubble tap
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.02);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.025);
        break;

      case "pop":
        // Satisfying spring pop
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.04);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.045);
        break;

      case "warning":
        // Dual gentle chime
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
        break;

      case "emergency":
        // High urgency tone
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
    }
  } catch {
    // Ignore audio errors
  }
}
