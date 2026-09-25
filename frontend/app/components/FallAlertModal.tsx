"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface FallAlertModalProps {
  open: boolean;
  onDismiss: () => void;
}

export default function FallAlertModal({
  open,
  onDismiss,
}: FallAlertModalProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!open) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.15;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio autoplay policy may restrict unmuted audio before user gesture
    }

    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-red-600 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-emergency">
        <AlertTriangle className="mx-auto mb-4" size={56} color="white" />
        <h2 className="text-2xl font-bold text-white mb-2">FALL DETECTED</h2>
        <p className="text-red-100 mb-6">
          Impact and stillness pattern confirmed. Alert would fire on the
          device buzzer and LED in the real system.
        </p>
        <button
          onClick={onDismiss}
          className="bg-white text-red-600 font-semibold px-6 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
