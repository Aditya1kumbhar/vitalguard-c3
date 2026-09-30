"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCircle, AlertTriangle, Trash2, Check } from "lucide-react";
import { playHaptic } from "../utils/haptics";
import { getApiBase } from "../utils/api";

interface FallAlert {
  id: number;
  timestamp: string;
  peak_accel: number;
  severity: string;
  acknowledged: number;
}

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<FallAlert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/alerts?limit=10`);
      if (res.ok) {
        const data: FallAlert[] = await res.json();
        setAlerts(data);
      }
    } catch {
      // Backend offline fallback
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const acknowledgeAlert = async (id: number) => {
    playHaptic("pop");
    try {
      await fetch(`${getApiBase()}/alerts/${id}/acknowledge`, {
        method: "POST",
      });
      fetchAlerts();
    } catch {
      // Ignore
    }
  };

  const clearAlerts = async () => {
    playHaptic("click");
    try {
      await fetch(`${getApiBase()}/alerts/clear`, {
        method: "POST",
      });
      setAlerts([]);
    } catch {
      // Ignore
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="royal-card rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between border-b border-[#01373D]/5 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#FE336A]" />
          <h2 className="text-base font-extrabold text-[#01373D] tracking-tight leading-none">
            Recent Alerts
          </h2>
        </div>

        {alerts.length > 0 && (
          <div className="flex items-center gap-2">
            {unackCount > 0 && (
              <span className="bg-[#FE336A]/10 text-[#FE336A] border border-[#FE336A]/20 text-xs font-bold px-2 py-0.5 rounded-md">
                {unackCount} Unchecked
              </span>
            )}
            <button
              onClick={clearAlerts}
              className="spring-btn text-xs text-[#44706A] hover:text-[#01373D] bg-[#F1F4F9] hover:bg-[#E5E9F0] px-2 py-1 rounded-lg transition-all"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs py-3 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>No Falls Recorded - All Clear</span>
        </div>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-2xl text-xs transition-colors ${
                alert.acknowledged
                  ? "bg-[#F1F4F9]/70 text-[#44706A] border border-[#01373D]/6"
                  : "bg-[#FE336A]/5 text-[#01373D] border border-[#FE336A]/15 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                {alert.acknowledged ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#FE336A] shrink-0" />
                )}
                <div>
                  <span className="font-bold text-[#01373D]">Fall Detected</span>
                  <span className="mx-1.5 text-[#01373D]/20">|</span>
                  <span className="font-mono text-[#44706A]">{formatTime(alert.timestamp)}</span>
                </div>
              </div>

              {!alert.acknowledged ? (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="spring-btn flex items-center gap-1 text-xs font-bold bg-[#FE336A] hover:bg-[#CE1A4D] text-white px-2.5 py-1 rounded-lg shadow-sm"
                >
                  <Check className="w-3 h-3" />
                  <span>Check</span>
                </button>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Checked
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
