'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Users,
  LayoutGrid,
  Search,
  Mic,
  Flame,
  User,
  Sun,
  Ear,
  Pill,
  Brain,
  MoveHorizontal,
  Apple,
  Wind,
  Bell,
  X,
  Radio,
  Bluetooth,
  ChevronRight,
  ShieldAlert,
  FileText,
  Sliders,
  LogOut,
  Cpu,
  Check,
} from 'lucide-react';
import { Ring } from './design/Ring';
import { Card } from './design/Card';
import { Sheet } from './design/Sheet';
import { FallAlertSheet } from './design/FallAlertSheet';
import { MockBand } from './data/MockBand';
import { WebBluetoothBand } from './data/WebBluetoothBand';
import { useBand } from './data/useBand';
import { useAuth } from './context/AuthContext';
import {
  colors,
  dimensions,
  layout,
  press,
  spring,
  typography,
} from './design/motion.tokens';

export default function AppleHealthDashboard() {
  const { guardianName, bandId, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'summary' | 'sharing' | 'browse'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [transportMode, setTransportMode] = useState<'mock' | 'ble'>('mock');
  const [isBleSupported, setIsBleSupported] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [manualFallActive, setManualFallActive] = useState<boolean>(false);
  const [dismissedCards, setDismissedCards] = useState<{ [key: string]: boolean }>({});

  // Rolling 60s heart rate history for the sparkline
  const [hrHistory, setHrHistory] = useState<number[]>([
    70, 71, 70, 69, 70, 72, 71, 70, 69, 70, 71, 72, 73, 72, 71, 70, 69, 70, 71, 72,
    70, 69, 70, 71, 72, 71, 70, 69, 70, 71, 70, 71, 72, 71, 70, 69, 70, 71, 72, 70,
  ]);

  // Transports
  const mockTransport = useMemo(() => new MockBand(), []);
  const bleTransport = useMemo(() => new WebBluetoothBand(), []);
  const activeTransport = transportMode === 'mock' ? mockTransport : bleTransport;

  const { frame, status, connect, disconnect, dismissFall } = useBand(activeTransport);

  useEffect(() => {
    setIsBleSupported(WebBluetoothBand.isSupported());
  }, []);

  // Connect mock on mount
  useEffect(() => {
    if (transportMode === 'mock') {
      mockTransport.connect().then(() => setIsConnected(true));
      return () => {
        mockTransport.disconnect();
      };
    }
  }, [mockTransport, transportMode]);

  // Push HR updates to sparkline
  useEffect(() => {
    if (frame?.hr && frame.hr > 0) {
      setHrHistory((prev) => [...prev.slice(1), frame.hr]);
    }
  }, [frame?.hr, frame?.ts]);

  const hrValue = frame?.hr ?? 70;
  const spo2Value = frame?.spo2 ?? 98;
  const batteryValue = frame?.battery ?? 85;
  const pulseDuration = Math.max(0.4, 60 / (hrValue || 70));

  // Compute Sparkline SVG
  const sparklineSvg = useMemo(() => {
    const width = 320;
    const height = dimensions.sparklineHeight;
    const pts = hrHistory;
    const minVal = Math.min(...pts) - 5;
    const maxVal = Math.max(...pts) + 5;
    const range = maxVal - minVal || 1;

    const coords = pts.map((val, idx) => ({
      x: (idx / (pts.length - 1)) * width,
      y: height - ((val - minVal) / range) * (height - 16) - 8,
    }));

    const linePath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return { linePath, areaPath };
  }, [hrHistory]);

  const handleConnectionToggle = async () => {
    if (isConnected) {
      disconnect();
      setIsConnected(false);
    } else {
      try {
        await connect();
        setIsConnected(true);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleModeChange = (mode: 'mock' | 'ble') => {
    if (mode === transportMode) return;
    disconnect();
    setIsConnected(false);
    setTransportMode(mode);
    setIsAccountOpen(false);
  };

  // Browse Health Categories (Exact match to screenshot 1)
  const healthCategories = [
    { title: 'Activity', icon: <Flame size={30} color="#000000" />, bg: '#FF6436' },
    { title: 'Body Measurements', icon: <User size={30} color="#000000" />, bg: '#DF43C6' },
    { title: 'Cycle Tracking', icon: <Sun size={30} color="#000000" />, bg: '#8B9BFE' },
    { title: 'Hearing', icon: <Ear size={30} color="#000000" />, bg: '#38A3FF' },
    { title: 'Heart', icon: <Heart size={30} color="#000000" fill="#000000" />, bg: '#FF335C' },
    { title: 'Medications', icon: <Pill size={30} color="#000000" />, bg: '#38E1FF' },
    { title: 'Mental Wellbeing', icon: <Brain size={30} color="#000000" />, bg: '#42E2B8' },
    { title: 'Mobility', icon: <MoveHorizontal size={30} color="#000000" />, bg: '#FFA733' },
    { title: 'Nutrition', icon: <Apple size={30} color="#000000" />, bg: '#4ADE80' },
    { title: 'Respiratory', icon: <Wind size={30} color="#000000" />, bg: '#67E8F9' },
  ];

  const filteredCategories = healthCategories.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = guardianName && guardianName !== 'Guardian' ? guardianName : 'Aditya Kumbhar';
  const displayBandId = bandId || 'VG-C3-0001';

  const initials = useMemo(() => {
    if (!displayName) return 'AK';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase() || 'AK';
  }, [displayName]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily,
        overflowX: 'hidden',
        color: '#FFFFFF',
      }}
    >
      {/* ── Mobile-First Responsive Container (Clean max-width 430px, no faux phone borders) ── */}
      <div
        className="w-full flex flex-col relative bg-black mx-auto"
        style={{
          maxWidth: layout.phoneMaxWidth,
          minHeight: '100dvh',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Radial Warm Ambient Glow (From Screenshot 2) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 320,
            pointerEvents: 'none',
            background:
              status === 'fall'
                ? 'radial-gradient(ellipse 390px 220px at 50% 0%, rgba(255, 69, 58, 0.45) 0%, transparent 100%)'
                : status === 'irregular'
                ? 'radial-gradient(ellipse 390px 220px at 50% 0%, rgba(255, 159, 10, 0.35) 0%, transparent 100%)'
                : 'radial-gradient(ellipse 390px 220px at 50% 0%, rgba(180, 75, 20, 0.38) 0%, transparent 100%)',
            transition: 'background 1200ms ease',
            zIndex: 0,
          }}
        />

        {/* ── Scrollable Screen Body (Natural top safe-area padding, NO fake clock/battery) ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: `max(20px, env(safe-area-inset-top)) 18px 96px 18px`,
            display: 'flex',
            flexDirection: 'column',
            gap: layout.sectionGap,
          }}
        >
          {/* ═══════════════════════════════════════════════════════
              TAB 1: SUMMARY (Exact Match to Screenshot 2)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'summary' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: layout.sectionGap }}
            >
              {/* Summary Header with Profile Avatar "AK" */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                <h1
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: '41px',
                    margin: 0,
                    letterSpacing: '-0.03em',
                  }}
                >
                  Summary
                </h1>

                {/* Profile Circle Avatar ("AK") -> Taps open Apple Health Account Sheet */}
                <motion.button
                  type="button"
                  onClick={() => setIsAccountOpen(true)}
                  whileTap={{ scale: press.scale }}
                  aria-label="Open Account & Application Settings"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: dimensions.pillRadius,
                    background: 'linear-gradient(135deg, #7AA5F8 0%, #D88277 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    padding: 0,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{initials}</span>
                </motion.button>
              </div>

              {/* 1. NOTIFICATIONS CARD (Screenshot 2) */}
              {!dismissedCards['notifications'] && (
                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: colors.textSecondary,
                        }}
                      >
                        Notifications
                      </span>
                      <button
                        type="button"
                        onClick={() => setDismissedCards((prev) => ({ ...prev, notifications: true }))}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: dimensions.pillRadius,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: colors.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: dimensions.pillRadius,
                          backgroundColor: '#FF3B30',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Bell size={22} color="#FFFFFF" fill="#FFFFFF" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '21px', color: '#FFFFFF' }}>
                          Health notifications are currently active for VitalGuard C3.
                        </span>
                        <div>
                          <motion.button
                            type="button"
                            onClick={() => setIsAccountOpen(true)}
                            whileTap={{ scale: press.scale }}
                            style={{
                              backgroundColor: '#1A3B66',
                              color: '#2997FF',
                              border: 'none',
                              borderRadius: dimensions.pillRadius,
                              padding: '8px 16px',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Open Health Settings
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 2. HERO CARD: HEART RATE 200px RING (Screenshot specifications) */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Heart size={18} color={colors.heart} fill={colors.heart} />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: colors.textSecondary,
                        }}
                      >
                        Heart Rate
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Live</span>
                  </div>

                  {/* Pulsing Glow 200px HR Ring */}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                    <motion.div
                      animate={{ scale: [1, colors.heartPulseScale, 1] }}
                      transition={{ repeat: Infinity, duration: pulseDuration, ease: 'easeInOut' }}
                      style={{ filter: colors.heartGlow }}
                    >
                      <Ring
                        value={hrValue}
                        max={180}
                        colour={colors.heart}
                        bgColour={colors.heartTrack}
                        size={dimensions.heroRingSize}
                        strokeWidth={dimensions.heroRingStroke}
                        displayValue={hrValue > 0 ? String(hrValue) : '—'}
                        unit="BPM"
                      />
                    </motion.div>
                  </div>
                </div>
              </Card>

              {/* 3. ROW OF 2 SMALL CARDS (GAP 12PX) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: layout.rowGap }}>
                {/* SpO2 Small Ring Card */}
                <Card style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: colors.textSecondary,
                      }}
                    >
                      Blood Oxygen
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                      <Ring
                        value={spo2Value}
                        max={100}
                        colour={colors.spo2}
                        bgColour={colors.spo2Track}
                        size={dimensions.smallRingSize}
                        strokeWidth={dimensions.smallRingStroke}
                        displayValue={`${spo2Value}%`}
                      />
                    </div>
                  </div>
                </Card>

                {/* Battery Card (85% + 6px rounded yellow bar) */}
                <Card style={{ padding: '16px 14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: colors.textSecondary,
                      }}
                    >
                      Battery
                    </span>

                    <div style={{ margin: '14px 0 6px 0' }}>
                      <span
                        style={{
                          fontSize: 32,
                          fontWeight: 700,
                          lineHeight: '38px',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#FFFFFF',
                        }}
                      >
                        {batteryValue}%
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: dimensions.batteryBarHeight,
                          backgroundColor: colors.batteryTrack,
                          borderRadius: dimensions.barRadius,
                          marginTop: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, batteryValue))}%`,
                            height: '100%',
                            backgroundColor: colors.battery,
                            borderRadius: dimensions.barRadius,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 4. HEART RATE, LAST 60S (SPARKLINE) */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: colors.textSecondary,
                      }}
                    >
                      Heart rate, last 60s
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.heart }}>{hrValue} BPM</span>
                  </div>

                  <div style={{ width: '100%', height: dimensions.sparklineHeight }}>
                    <svg
                      viewBox={`0 0 320 ${dimensions.sparklineHeight}`}
                      style={{ width: '100%', height: '100%', overflow: 'visible' }}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="appleSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.heart} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={colors.heart} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <path d={sparklineSvg.areaPath} fill="url(#appleSparklineGrad)" />
                      <path
                        d={sparklineSvg.linePath}
                        fill="none"
                        stroke={colors.heart}
                        strokeWidth={dimensions.sparklineStroke}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              {/* 5. MENTAL WELLBEING CARD (Screenshot 2) */}
              {!dismissedCards['mental'] && (
                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: colors.textSecondary,
                        }}
                      >
                        Mental Wellbeing
                      </span>
                      <button
                        type="button"
                        onClick={() => setDismissedCards((prev) => ({ ...prev, mental: true }))}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: dimensions.pillRadius,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: colors.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: dimensions.cardRadius / 2,
                          border: '2px solid #2DD4BF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Brain size={24} color="#2DD4BF" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
                          Mental Health Questionnaire
                        </span>
                        <p style={{ fontSize: 14, color: colors.textSecondary, margin: 0, lineHeight: '20px' }}>
                          Along with regular reflection, assessing your current risk for common conditions can be an important part of caring for your mental health.
                        </p>
                        <div style={{ marginTop: 6 }}>
                          <motion.button
                            type="button"
                            whileTap={{ scale: press.scale }}
                            style={{
                              backgroundColor: '#1A3B66',
                              color: '#2997FF',
                              border: 'none',
                              borderRadius: dimensions.pillRadius,
                              padding: '8px 16px',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Take Questionnaire
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 6. HEALTH CHECKLIST CARD (Screenshot 2) */}
              {!dismissedCards['checklist'] && (
                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: colors.textSecondary,
                        }}
                      >
                        Health Checklist
                      </span>
                      <button
                        type="button"
                        onClick={() => setDismissedCards((prev) => ({ ...prev, checklist: true }))}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: dimensions.pillRadius,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: colors.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: '#FF2D55',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={24} color="#FFFFFF" strokeWidth={3} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', lineHeight: '21px' }}>
                          Make sure the Health features on your wrist band are set up the way you want them.
                        </span>
                        <div style={{ marginTop: 6 }}>
                          <motion.button
                            type="button"
                            onClick={() => setIsAccountOpen(true)}
                            whileTap={{ scale: press.scale }}
                            style={{
                              backgroundColor: '#1A3B66',
                              color: '#2997FF',
                              border: 'none',
                              borderRadius: dimensions.pillRadius,
                              padding: '8px 16px',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Review
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 7. DISCONNECT TEXT BUTTON (Screenshot specification) */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <motion.button
                  type="button"
                  onClick={handleConnectionToggle}
                  whileTap={{ scale: press.scale }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isConnected ? colors.disconnect : colors.spo2,
                    fontSize: 17,
                    fontWeight: 500,
                    height: dimensions.disconnectButtonHeight,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {isConnected ? 'Disconnect' : 'Connect Band'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: BROWSE (Exact Match to Screenshot 1)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'browse' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: layout.sectionGap }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                <h1
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: '41px',
                    margin: 0,
                    letterSpacing: '-0.03em',
                  }}
                >
                  Browse
                </h1>

                {/* Profile Circle Avatar ("AK") -> Taps open Apple Health Account Sheet */}
                <motion.button
                  type="button"
                  onClick={() => setIsAccountOpen(true)}
                  whileTap={{ scale: press.scale }}
                  aria-label="Open Account & Application Settings"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: dimensions.pillRadius,
                    background: 'linear-gradient(135deg, #7AA5F8 0%, #D88277 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    padding: 0,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{initials}</span>
                </motion.button>
              </div>

              {/* Pill Search Input with Mic Icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1C1C1E',
                  borderRadius: dimensions.pillRadius,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '8px 16px',
                  gap: 10,
                }}
              >
                <Search size={18} color="#8E8E93" />
                <input
                  type="text"
                  placeholder="Health"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: 16,
                  }}
                />
                <Mic size={18} color="#8E8E93" />
              </div>

              {/* Health Categories Title */}
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: '8px 0 0 0',
                }}
              >
                Health Categories
              </h2>

              {/* 2-Column Grid of Vibrant Colorful Squircle Tiles */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                {filteredCategories.map((cat) => (
                  <motion.div
                    key={cat.title}
                    whileTap={{ scale: press.scale }}
                    style={{
                      height: 124,
                      backgroundColor: cat.bg,
                      borderRadius: 24,
                      padding: '16px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div>{cat.icon}</div>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#000000',
                        lineHeight: '20px',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {cat.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: SHARING (Guardian & Emergency Escalation)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'sharing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: layout.sectionGap }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                <h1
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: '41px',
                    margin: 0,
                    letterSpacing: '-0.03em',
                  }}
                >
                  Sharing
                </h1>

                <motion.button
                  type="button"
                  onClick={() => setIsAccountOpen(true)}
                  whileTap={{ scale: press.scale }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: dimensions.pillRadius,
                    background: 'linear-gradient(135deg, #7AA5F8 0%, #D88277 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{initials}</span>
                </motion.button>
              </div>

              {/* Guardian Sharing Card */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: colors.textSecondary,
                    }}
                  >
                    You Are Sharing With
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: dimensions.pillRadius,
                        backgroundColor: '#5E5CE6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={22} color="#FFFFFF" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
                        {displayName} (Primary Guardian)
                      </span>
                      <span style={{ fontSize: 13, color: colors.textSecondary }}>
                        Continuous fall alerts &amp; rhythm notifications active
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Fall Escalation Auto-Dispatch Status */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: colors.textSecondary,
                    }}
                  >
                    Automated Fall Escalation
                  </span>

                  <p style={{ fontSize: 14, color: colors.textSecondary, margin: 0, lineHeight: '20px' }}>
                    If an impact is detected by the ESP32-C3 band and not dismissed within 30 seconds, an automated SMS alert and GPS coordinates will be dispatched to your emergency contact.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            FLOATING GLASS PILL NAVIGATION DOCK (Exact from Screenshots)
           ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 40,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(28, 28, 30, 0.82)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: dimensions.pillRadius,
              padding: '4px',
              gap: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
            }}
          >
            {/* Tab 1: Summary */}
            <motion.button
              type="button"
              onClick={() => setActiveTab('summary')}
              whileTap={{ scale: press.scale }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 20px',
                borderRadius: dimensions.pillRadius,
                border: 'none',
                backgroundColor: activeTab === 'summary' ? 'rgba(41, 151, 255, 0.22)' : 'transparent',
                color: activeTab === 'summary' ? '#2997FF' : '#8E8E93',
                cursor: 'pointer',
                gap: 2,
                transition: 'all 0.2s ease',
              }}
            >
              <Heart size={20} fill={activeTab === 'summary' ? '#2997FF' : 'none'} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Summary</span>
            </motion.button>

            {/* Tab 2: Sharing */}
            <motion.button
              type="button"
              onClick={() => setActiveTab('sharing')}
              whileTap={{ scale: press.scale }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 20px',
                borderRadius: dimensions.pillRadius,
                border: 'none',
                backgroundColor: activeTab === 'sharing' ? 'rgba(41, 151, 255, 0.22)' : 'transparent',
                color: activeTab === 'sharing' ? '#2997FF' : '#8E8E93',
                cursor: 'pointer',
                gap: 2,
                transition: 'all 0.2s ease',
              }}
            >
              <Users size={20} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Sharing</span>
            </motion.button>

            {/* Tab 3: Browse */}
            <motion.button
              type="button"
              onClick={() => setActiveTab('browse')}
              whileTap={{ scale: press.scale }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 20px',
                borderRadius: dimensions.pillRadius,
                border: 'none',
                backgroundColor: activeTab === 'browse' ? 'rgba(41, 151, 255, 0.22)' : 'transparent',
                color: activeTab === 'browse' ? '#2997FF' : '#8E8E93',
                cursor: 'pointer',
                gap: 2,
                transition: 'all 0.2s ease',
              }}
            >
              <LayoutGrid size={20} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Browse</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          APPLE HEALTH ACCOUNT & APPLICATION SETTINGS SHEET
          (Triggered on tapping the "AK" avatar)
         ═══════════════════════════════════════════════════════ */}
      <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen} title="Account & Application Settings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          {/* Top Bar: Title & Done Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Account</span>
            <button
              type="button"
              onClick={() => setIsAccountOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2997FF',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Done
            </button>
          </div>

          {/* User Profile Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: dimensions.pillRadius,
                  background: 'linear-gradient(135deg, #7AA5F8 0%, #D88277 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>{initials}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>{displayName}</span>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>
                  Primary Guardian • Band: {displayBandId}
                </span>
              </div>
            </div>
          </Card>

          {/* Section 1: Telemetry Stream Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.textSecondary,
                paddingLeft: 4,
              }}
            >
              Hardware &amp; Telemetry Stream
            </span>

            <Card style={{ padding: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => handleModeChange('mock')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: transportMode === 'mock' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Radio size={18} color={transportMode === 'mock' ? colors.heart : colors.textSecondary} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Mock 90s Loop</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Deterministic scenarios: calm, tachycardia, fall at t=40s
                      </span>
                    </div>
                  </div>
                  {transportMode === 'mock' && <Check size={18} color="#2997FF" strokeWidth={2.5} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('ble')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: transportMode === 'ble' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Bluetooth size={18} color={transportMode === 'ble' ? colors.spo2 : colors.textSecondary} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Web Bluetooth (ESP32-C3)</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Connect direct to Seeed Studio XIAO wrist hardware
                      </span>
                    </div>
                  </div>
                  {transportMode === 'ble' && <Check size={18} color="#2997FF" strokeWidth={2.5} />}
                </button>
              </div>
            </Card>

            {!isBleSupported && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 159, 10, 0.12)',
                  border: '1px solid rgba(255, 159, 10, 0.25)',
                }}
              >
                <span style={{ fontSize: 12, color: colors.irregular, lineHeight: '17px', display: 'block' }}>
                  <strong>iOS Note:</strong> Safari does not support the Web Bluetooth API. Use Chrome on Android, Windows, or Mac.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Original Application Feature Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.textSecondary,
                paddingLeft: 4,
              }}
            >
              Features &amp; Clinical Data
            </span>

            <Card style={{ padding: '4px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Path 1: Clinical Records & Historical Trends */}
                <Link
                  href="/records"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#30D158',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} color="#000000" />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Clinical Records &amp; Trends</span>
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </Link>

                {/* Path 2: Feel Lab Token Calibration */}
                <Link
                  href="/feel-lab"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#5E5CE6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sliders size={18} color="#FFFFFF" />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Feel Lab Calibration</span>
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </Link>

                {/* Path 3: Test Fall Alarm Emergency Sequence */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    setManualFallActive(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#FF453A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShieldAlert size={18} color="#FFFFFF" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Test Fall Alarm (30s Sequence)</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        Trigger emergency countdown and slide-to-confirm rail
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </button>
              </div>
            </Card>
          </div>

          {/* Section 3: Hardware & Safety Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.textSecondary,
                paddingLeft: 4,
              }}
            >
              Hardware Configuration
            </span>

            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: colors.textSecondary }}>Microcontroller</span>
                  <span style={{ fontWeight: 600 }}>Seeed Studio XIAO ESP32-C3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: colors.textSecondary }}>Biometric Sensor</span>
                  <span style={{ fontWeight: 600 }}>MAX30102 (HR + SpO2)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: colors.textSecondary }}>Motion &amp; Fall Sensor</span>
                  <span style={{ fontWeight: 600 }}>MPU6050 (3-Axis SVM)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: colors.textSecondary }}>Fall Escalation Auto-SMS</span>
                  <span style={{ fontWeight: 600, color: '#30D158' }}>Armed (30s countdown)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 4: Log Out */}
          <div style={{ padding: '4px 0 24px 0' }}>
            <Card style={{ padding: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsAccountOpen(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#FF453A',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <LogOut size={16} />
                Sign Out of VitalGuard C3
              </button>
            </Card>
          </div>
        </div>
      </Sheet>

      {/* ── Fall Alert Sheet Flow (Full-Screen Verification) ───── */}
      <FallAlertSheet
        open={status === 'fall' || manualFallActive}
        onConfirmSafe={() => {
          dismissFall();
          setManualFallActive(false);
        }}
      />
    </div>
  );
}
