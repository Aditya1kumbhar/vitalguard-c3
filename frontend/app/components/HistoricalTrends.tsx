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
import { getApiBase } from "../utils/api";
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
        // Attempt fetch from local ESP32 / Edge server
        const res = await fetch(`${getApiBase()}/analytics/daily?days=${daysRange}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json: DailySummary[] = await res.json();
        setData(json);
        setStorageSource("Live Bridge");

        // Sync into browser IndexedDB with automatic Day 31+ pruning
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
        // Offline Fallback: Load 30-day rolling log directly from local IndexedDB
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
      className="royal-card rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Header & Filter Range */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" aria-hidden="true" />
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>30-Day History</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-2.5 h-2.5" />
                {storageSource}
              </span>
            </h2>
          </div>
        </div>

        {/* Days Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setDaysRange(days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                daysRange === days
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <button
          onClick={() => setActiveTab("hr")}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "hr"
              ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Heart Beat</span>
        </button>

        <button
          onClick={() => setActiveTab("spo2")}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "spo2"
              ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-sm"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-sky-500" />
          <span>Oxygen</span>
        </button>

        <button
          onClick={() => setActiveTab("temp")}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "temp"
              ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
          <span>Body Temp</span>
        </button>

        <button
          onClick={() => setActiveTab("anomalies")}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "anomalies"
              ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
          <span>Alerts</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-52 sm:h-56 rounded-xl border border-slate-200 p-2 telemetry-grid-light relative overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-rose-600 text-xs">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "hr" ? (
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <YAxis domain={[40, 120]} stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px", color: "#0f172a" }}
                  formatter={(val: number) => [`${val} bpm`, ""]}
                />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Low (50 bpm)", fill: "#dc2626", fontSize: 9, position: "insideBottomLeft" }} />
                <Area type="monotone" dataKey="hr_avg" name="Average HR" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" />
                <Line type="monotone" dataKey="hr_min" name="Min" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="hr_max" name="Max" stroke="#64748b" strokeDasharray="2 2" strokeWidth={1} dot={false} />
              </AreaChart>
            ) : activeTab === "spo2" ? (
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <YAxis domain={[88, 100]} stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px", color: "#0f172a" }}
                  formatter={(val: number) => [`${val}%`, ""]}
                />
                <ReferenceLine y={92} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Low (92%)", fill: "#dc2626", fontSize: 9, position: "insideBottomLeft" }} />
                <Area type="monotone" dataKey="spo2_avg" name="Oxygen" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#spo2Grad)" />
              </AreaChart>
            ) : activeTab === "temp" ? (
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <YAxis domain={[35.5, 38.5]} stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px", color: "#0f172a" }}
                  formatter={(val: number) => [`${val} °C`, ""]}
                />
                <ReferenceLine y={37.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Fever (37.5°C)", fill: "#dc2626", fontSize: 9, position: "insideTopLeft" }} />
                <Area type="monotone" dataKey="temp_avg" name="Temp" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" />
              </AreaChart>
            ) : (
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 9, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px", color: "#0f172a" }}
                  formatter={(val: number) => [`${val} alerts`, "Alerts"]}
                />
                <Bar dataKey="anomaly_count" name="Alerts" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
