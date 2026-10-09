"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { Activity } from "lucide-react";
import type { TelemetryPacket } from "../hooks/useTelemetrySocket";

interface AccelWaveformProps {
  latest: TelemetryPacket | null;
}

interface WaveformPoint {
  time: string;
  motion: number;
}

const MAX_POINTS = 30;

export default function AccelWaveform({ latest }: AccelWaveformProps) {
  const [data, setData] = useState<WaveformPoint[]>([]);
  const countRef = useRef(0);

  useEffect(() => {
    if (!latest) return;

    countRef.current += 1;
    const timeLabel = latest.timestamp ? latest.timestamp.slice(14, 19) : `${countRef.current}s`;

    // Visual motion magnitude
    const svm = latest.svm || 1.0;

    const newPoint: WaveformPoint = {
      time: timeLabel,
      motion: Number(svm.toFixed(2)),
    };

    setData((prev) => {
      const updated = [...prev, newPoint];
      if (updated.length > MAX_POINTS) {
        return updated.slice(updated.length - MAX_POINTS);
      }
      return updated;
    });
  }, [latest]);

  const svmValue = latest?.svm ?? 1.0;
  const isFall = Boolean(latest?.fall_detected) || latest?.stage === "CRITICAL_FALL" || svmValue >= 2.5;
  const isMoving = svmValue >= 1.4 && !isFall;

  return (
    <section
      aria-label="Live Movement Waveform"
      className="royal-card rounded-3xl p-5 sm:p-6 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#01373D]/5 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#01373D]" />
          <h2 className="text-base sm:text-lg font-extrabold text-[#01373D] tracking-tight">
            Live Movement
          </h2>
        </div>

        <span className={`text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wide border shadow-xs ${
          isFall
            ? "bg-[#FE336A]/10 text-[#FE336A] border-[#FE336A]/30 animate-pulse"
            : isMoving
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          {isFall ? "FALL DETECTED!" : isMoving ? "Walking" : "Resting"}
        </span>
      </div>

      {/* Clean, Expressive Waveform Canvas */}
      <div className="w-full h-36 sm:h-44 md:h-52 lg:h-60 pt-1 rounded-2xl border border-[#01373D]/8 telemetry-grid-light relative overflow-hidden transition-all duration-300">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-[#44706A] text-xs font-medium">
            Monitoring...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 4]} hide />
              
              {/* Fall Warning Threshold Line */}
              <ReferenceLine
                y={2.5}
                stroke="#FE336A"
                strokeDasharray="3 3"
                label={{
                  value: "Danger Level",
                  fill: "#FE336A",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />

              <Line
                type="monotone"
                dataKey="motion"
                stroke={isFall ? "#FE336A" : "#01373D"}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
