// ─────────────────────────────────────────────
// motion.tokens.ts — single source of truth
// ─────────────────────────────────────────────
// Every visual / motion property in the app is a named token.
// Flash may ONLY import from this file. No literal numbers elsewhere.

// ── Springs (framer-motion transition: { type:"spring", ... }) ───
export const spring = {
  snappy:  { stiffness: 400, damping: 28, mass: 0.8 },
  sheet:   { stiffness: 260, damping: 34, mass: 1.0 },
  ring:    { stiffness: 180, damping: 22, mass: 1.2 },
} as const;

// ── Radii ────────────────────────────────────
export const radius = {
  sm:   8,
  md:  16,
  lg:  24,
  full: 9999,
} as const;

// ── Durations (seconds) ─────────────────────
export const duration = {
  instant:   0.08,
  fast:      0.15,
  normal:    0.3,
  slow:      0.5,
  staleData: 10,      // seconds before "no packet" → grey state
} as const;

// ── Shadows ─────────────────────────────────
export const shadow = {
  card:     '0 2px 12px -2px rgba(0,0,0,0.08)',
  cardHover:'0 8px 24px -4px rgba(0,0,0,0.12)',
  sheet:    '0 -4px 32px -4px rgba(0,0,0,0.18)',
} as const;

// ── Spacing (8pt grid) ──────────────────────
export const space = {
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  ring: 64,   // ring component outer margin
  safe: 34,   // iOS safe-area bottom estimate
} as const;

// ── Press feedback ──────────────────────────
export const press = {
  scale: 0.96,
} as const;

// ── Ring defaults ───────────────────────────
export const ringDefaults = {
  strokeWidth: 10,
  size: 120,
  bgOpacity: 0.15,
} as const;

// ── Colours (light / dark) ──────────────────
export const palette = {
  light: {
    bg:           '#F5F5F7',
    surface:      '#FFFFFF',
    surfaceAlpha: 'rgba(255,255,255,0.82)',
    text:         '#1D1D1F',
    textSecondary:'#6E6E73',
    border:       'rgba(0,0,0,0.06)',
    hr:           '#FF2D55',
    hrBg:         'rgba(255,45,85,0.15)',
    spo2:         '#30D158',
    spo2Bg:       'rgba(48,209,88,0.15)',
    battery:      '#FFD60A',
    batteryBg:    'rgba(255,214,10,0.15)',
    activity:     '#5E5CE6',
    activityBg:   'rgba(94,92,230,0.15)',
    fall:         '#FF3B30',
    fallBg:       'rgba(255,59,48,0.12)',
    disconnect:   '#8E8E93',
    irregular:    '#FF9500',
    irregularBg:  'rgba(255,149,0,0.12)',
    sheetOverlay: 'rgba(0,0,0,0.4)',
    reconnecting: '#AF52DE',
  },
  dark: {
    bg:           '#000000',
    surface:      '#1C1C1E',
    surfaceAlpha: 'rgba(28,28,30,0.82)',
    text:         '#F5F5F7',
    textSecondary:'#98989D',
    border:       'rgba(255,255,255,0.08)',
    hr:           '#FF375F',
    hrBg:         'rgba(255,55,95,0.20)',
    spo2:         '#30D158',
    spo2Bg:       'rgba(48,209,88,0.20)',
    battery:      '#FFD60A',
    batteryBg:    'rgba(255,214,10,0.20)',
    activity:     '#5E5CE6',
    activityBg:   'rgba(94,92,230,0.20)',
    fall:         '#FF453A',
    fallBg:       'rgba(255,69,58,0.18)',
    disconnect:   '#636366',
    irregular:    '#FF9F0A',
    irregularBg:  'rgba(255,159,10,0.18)',
    sheetOverlay: 'rgba(0,0,0,0.6)',
    reconnecting: '#BF5AF2',
  },
} as const;

// ── Ambient background gradients (CSS variable values) ──
// Applied to <body> via --ambient-gradient
export const ambientGradient = {
  normal:       'linear-gradient(170deg, #F5F5F7 0%, #E8E8ED 100%)',
  normalStale:  'linear-gradient(170deg, #E5E5EA 0%, #D1D1D6 100%)',
  irregular:    'linear-gradient(170deg, #FFF4E6 0%, #FFE8CC 100%)',
  fall:         'linear-gradient(170deg, #FFE5E5 0%, #FFCCCC 100%)',
  disconnected: 'linear-gradient(170deg, #E5E5EA 0%, #C7C7CC 100%)',
  lowBattery:   'linear-gradient(170deg, #FFFDE5 0%, #FFF9CC 100%)',
  reconnecting: 'linear-gradient(170deg, #F3E8FF 0%, #E9D5FF 100%)',
} as const;

// Dark-mode ambient variants
export const ambientGradientDark = {
  normal:       'linear-gradient(170deg, #000000 0%, #1C1C1E 100%)',
  normalStale:  'linear-gradient(170deg, #1C1C1E 0%, #2C2C2E 100%)',
  irregular:    'linear-gradient(170deg, #1A1200 0%, #2D1F00 100%)',
  fall:         'linear-gradient(170deg, #1A0000 0%, #2D0000 100%)',
  disconnected: 'linear-gradient(170deg, #1C1C1E 0%, #2C2C2E 100%)',
  lowBattery:   'linear-gradient(170deg, #1A1700 0%, #2D2800 100%)',
  reconnecting: 'linear-gradient(170deg, #120026 0%, #1F004D 100%)',
} as const;

// ── Feedback vocabulary ─────────────────────
// Each entry: vibrate pattern (ms[]), visual pulse scale, pulse duration token
export const feedback = {
  tick:    { vibrate: [6],                   pulseScale: 1.02, pulseDuration: 'instant' as const },
  confirm: { vibrate: [10, 30, 10],          pulseScale: 1.04, pulseDuration: 'fast'    as const },
  warn:    { vibrate: [30, 40, 30],          pulseScale: 1.06, pulseDuration: 'normal'  as const },
  alarm:   { vibrate: [100, 80, 100, 80, 200], pulseScale: 1.08, pulseDuration: 'normal'  as const },
  settle:  { vibrate: [4],                   pulseScale: 0.98, pulseDuration: 'fast'    as const },
} as const;

// ── Fall alert ──────────────────────────────
export const fallAlert = {
  dismissThreshold: 0.9,    // slide-to-confirm past 90%
  countdownSeconds: 30,
  escalationSeconds: 60,
} as const;

// ── Breakpoints (px) ────────────────────────
export const breakpoint = {
  sm: 390,
  md: 744,
  lg: 1024,
} as const;

// ── Typography scale ────────────────────────
export const type = {
  caption: { size: 12, weight: 400, leading: 16 },
  body:    { size: 15, weight: 400, leading: 22 },
  bodyBold:{ size: 15, weight: 600, leading: 22 },
  title3:  { size: 20, weight: 600, leading: 25 },
  title2:  { size: 28, weight: 700, leading: 34 },
  title1:  { size: 34, weight: 700, leading: 41 },
  large:   { size: 48, weight: 700, leading: 52 },
} as const;

// ── z-index layers ──────────────────────────
export const zIndex = {
  base:     0,
  card:     1,
  header:  10,
  sheet:   50,
  fallAlert:100,
  overlay: 999,
} as const;

// ── Export all as single namespace ──────────
const tokens = {
  spring, radius, duration, shadow, space, press, ringDefaults,
  palette, ambientGradient, ambientGradientDark,
  feedback, fallAlert, breakpoint, type, zIndex,
} as const;

export default tokens;
