"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Calendar, Heart, Droplets, Thermometer, AlertTriangle, RefreshCw, Database } from "lucide-react";
import { GlassIcon } from "./GlassIcon";
import { getApiBase, authFetch } from "../utils/api";
import {
  DailyRecord,
  getDailyRecords,
  saveBulkDailyRecordsAndPrune,
  seedInitialDataIfEmpty,
} from "../utils/localDatabase";

export interface DailySummary {
  date: string;
  hr_min: number;
  hr_max: number;
  hr_avg: number;
  spo2_min: number;
  spo2_max: number;
  spo2_avg: number;
  temp_min: number;
  temp_max: number;
  temp_avg: number;
  svm_max: number;
  anomaly_count: number;
  sample_count: number;
}

type MetricTab = "hr" | "spo2" | "temp" | "anomalies";

export default function HistoricalTrends() {
  const [data, setData] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRange, setDaysRange] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<MetricTab>("hr");
  const [storageSource, setStorageSource] = useState<"Live Bridge" | "IndexedDB (Offline)">("IndexedDB (Offline)");

  useEffect(() => {
    async function loadTrends() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${getApiBase()}/analytics/daily?days=${daysRange}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json: DailySummary[] = await res.json();
        setData(json);
        setStorageSource("Live Bridge");

        const dbRecords: DailyRecord[] = json.map((item) => ({
          dateKey: item.date,
          avg_hr: Math.round(item.hr_avg),
          min_hr: item.hr_min,
          max_hr: item.hr_max,
          avg_spo2: Math.round(item.spo2_avg),
          min_spo2: item.spo2_min,
          max_spo2: item.spo2_max,
          avg_temp: item.temp_avg,
          svm_max: item.svm_max,
          fall_count: item.anomaly_count,
          sample_count: item.sample_count,
          timestamp: new Date(item.date).getTime(),
        }));
        await saveBulkDailyRecordsAndPrune(dbRecords);
      } catch {
        try {
          let cached = await getDailyRecords(daysRange);
          if (cached.length === 0) {
            cached = await seedInitialDataIfEmpty();
          }

          const mapped: DailySummary[] = cached.map((r) => ({
            date: r.dateKey,
            hr_min: r.min_hr ?? 54,
            hr_max: r.max_hr ?? 102,
            hr_avg: r.avg_hr,
            spo2_min: r.min_spo2 ?? 93,
            spo2_max: r.max_spo2 ?? 99,
            spo2_avg: r.avg_spo2,
            temp_min: 36.2,
            temp_max: 37.0,
            temp_avg: r.avg_temp ?? 36.6,
            svm_max: r.svm_max ?? 1.2,
            anomaly_count: r.fall_count,
            sample_count: r.sample_count ?? 86400,
          }));

          setData(mapped.slice(-daysRange));
          setStorageSource("IndexedDB (Offline)");
        } catch {
          setError("Failed to load local offline database");
        }
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, [daysRange]);

  const formattedData = data.map((d) => {
    const parts = d.date.split("-");
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      ...d,
      displayDate: label,
    };
  });

  return (
    <section
      aria-label="30-Day Trends"
      className="p-5 sm:p-6 rounded-2xl bg-[#12161D] border border-white/8 flex flex-col gap-5"
    >
      {/* Header & Filter Range */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3.5 flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <GlassIcon name="calendar" size="md" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Historical Trends</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-2.5 h-2.5" />
                {storageSource}
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Continuous telemetry aggregate</span>
          </div>
        </div>

        {/* Days Filter Buttons */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/8 p-1 rounded-xl">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDaysRange(days)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                daysRange === days
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("hr")}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === "hr"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm"
              : "bg-white/4 text-slate-400 border-white/6 hover:bg-white/8 hover:text-white"
          }`}
        >
          <GlassIcon name="heart" size={20} interactive={false} glow={false} />
          <span>Heart Beat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("spo2")}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === "spo2"
              ? "bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm"
              : "bg-white/4 text-slate-400 border-white/6 hover:bg-white/8 hover:text-white"
          }`}
        >
          <GlassIcon name="oxygen" size={20} interactive={false} glow={false} />
          <span>Oxygen (SpO2)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("temp")}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === "temp"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm"
              : "bg-white/4 text-slate-400 border-white/6 hover:bg-white/8 hover:text-white"
          }`}
        >
          <GlassIcon name="temp" size={20} interactive={false} glow={false} />
          <span>Body Temp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("anomalies")}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === "anomalies"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm"
              : "bg-white/4 text-slate-400 border-white/6 hover:bg-white/8 hover:text-white"
          }`}
        >
          <GlassIcon name="shield-alert" size={20} interactive={false} glow={false} />
          <span>Fall Alerts</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72 rounded-xl border border-white/8 bg-black/40 p-2 sm:p-3 relative overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="text-xs">Loading telemetry records...</span>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-rose-400 text-xs">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "hr" ? (
              <AreaChart data={formattedData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrDarkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF375F" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FF375F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[40, 120]}
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12161D",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  }}
                  formatter={(val: number) => [`${val} BPM`, "Heart Rate"]}
                />
                <ReferenceLine
                  y={50}
                  stroke="#FF375F"
                  strokeDasharray="3 3"
                  label={{ value: "Bradycardia (50 BPM)", fill: "#FF375F", fontSize: 9, position: "insideBottomLeft" }}
                />
                <Area
                  type="monotone"
                  dataKey="hr_avg"
                  name="Average HR"
                  stroke="#FF375F"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hrDarkGrad)"
                />
                <Line type="monotone" dataKey="hr_min" name="Min" stroke="#64748b" strokeDasharray="2 2" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="hr_max" name="Max" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={1} dot={false} />
              </AreaChart>
            ) : activeTab === "spo2" ? (
              <AreaChart data={formattedData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spo2DarkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[88, 100]}
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12161D",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  }}
                  formatter={(val: number) => [`${val}%`, "Oxygen Saturation"]}
                />
                <ReferenceLine
                  y={92}
                  stroke="#FF375F"
                  strokeDasharray="3 3"
                  label={{ value: "Hypoxia (<92%)", fill: "#FF375F", fontSize: 9, position: "insideBottomLeft" }}
                />
                <Area
                  type="monotone"
                  dataKey="spo2_avg"
                  name="Oxygen"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spo2DarkGrad)"
                />
              </AreaChart>
            ) : activeTab === "temp" ? (
              <AreaChart data={formattedData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempDarkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[35.5, 38.5]}
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12161D",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  }}
                  formatter={(val: number) => [`${val} °C`, "Body Temp"]}
                />
                <ReferenceLine
                  y={37.5}
                  stroke="#FF375F"
                  strokeDasharray="3 3"
                  label={{ value: "Fever (>37.5°C)", fill: "#FF375F", fontSize: 9, position: "insideTopLeft" }}
                />
                <Area
                  type="monotone"
                  dataKey="temp_avg"
                  name="Temp"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tempDarkGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={formattedData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12161D",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  }}
                  formatter={(val: number) => [`${val} Incident(s)`, "Fall Alerts"]}
                />
                <Bar dataKey="anomaly_count" name="Alerts" fill="#FF375F" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
