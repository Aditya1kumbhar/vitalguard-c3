"use client";

import { useEffect } from "react";
import { AlertOctagon, PhoneCall, UserCheck } from "lucide-react";
import { playHaptic } from "../utils/haptics";

interface FallModalProps {
  open: boolean;
  onDismiss: () => void;
}

export default function FallModal({ open, onDismiss }: FallModalProps) {
  useEffect(() => {
    if (open) {
      playHaptic("emergency");
    }
  }, [open]);

  if (!open) return null;

  const handleDismiss = () => {
    playHaptic("pop");
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white border-2 border-rose-500 rounded-3xl w-full max-w-sm flex flex-col p-6 sm:p-8 animate-emergency-light shadow-2xl">
        
        <div className="flex flex-col items-center text-center space-y-2 mb-6 mt-1">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
            <AlertOctagon className="w-10 h-10 animate-pulse" aria-hidden="true" />
          </div>

          <h2 id="modal-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight pt-2">
            Fall Detected!
          </h2>
          <p className="text-sm font-bold text-rose-600">
            Device .1 • Room 204
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-auto">
          <button 
            onClick={handleDismiss}
            className="spring-btn flex items-center justify-center gap-2.5 w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-base min-h-[52px] rounded-2xl shadow-md"
            aria-label="Call Nurse"
          >
            <PhoneCall className="w-5 h-5" aria-hidden="true" />
            <span>Call Nurse Immediately</span>
          </button>
          
          <button 
            onClick={handleDismiss}
            className="spring-btn flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm min-h-[48px] rounded-2xl border border-slate-200"
            aria-label="Dismiss"
          >
            <UserCheck className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>False Alarm (OK)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
