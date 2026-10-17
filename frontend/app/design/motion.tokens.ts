// ─────────────────────────────────────────────────────────────
// motion.tokens.ts: Pure Apple Dark Health Dashboard Token System
// ─────────────────────────────────────────────────────────────
// ZERO literal numbers in component files. Everything references this token sheet.

// ── Motion & Springs ──────────────────────────────────────────
export const spring = {
  default: { stiffness: 300, damping: 30, mass: 1 },
  ring:    { stiffness: 120, damping: 20, mass: 1 },
  snappy:  { stiffness: 300, damping: 30, mass: 1 },
  sheet:   { stiffness: 300, damping: 30, mass: 1 },
} as const;

export const press = {
  scale: 0.96,
} as const;

export const stagger = {
  cardDelay: 0.06,  // 60ms stagger between cards on entry
  translateY: 16,   // 16px -> 0px entry slide
} as const;

// ── Layout & Responsive Phone Frame ───────────────────────────
export const layout = {
  phoneMaxWidth: 430,       // mobile-first maximum container
  desktopPhoneWidth: 390,   // on >= 768px desktop frame
  desktopPhoneHeight: 844,
  desktopPhoneRadius: 44,
  pagePadding: 20,
  sectionGap: 16,
  rowGap: 12,
  gridUnit: 8,              // standard 8pt alignment grid
} as const;

// ── Colors (Pure Dark Apple Health System) ─────────────────────
export const colors = {
  bg:              'var(--bg-app, #000000)',
  card:            'var(--bg-card, #1C1C1E)',
  cardBorder:      'var(--border-card, rgba(255, 255, 255, 0.06))',
  textPrimary:     'var(--text-primary, #FFFFFF)',
  textSecondary:   'var(--text-secondary, #8E8E93)',
  heart:           '#FF375F',
  heartTrack:      'rgba(255, 55, 95, 0.20)',
  heartGlow:       'drop-shadow(0 0 24px rgba(255, 55, 95, 0.45))',
  heartPulseScale: 1.03,
  spo2:            '#30D158',
  spo2Track:       'rgba(48, 209, 88, 0.20)',
  battery:         '#FFD60A',
  batteryTrack:    'rgba(255, 214, 10, 0.20)',
  disconnect:      '#FF453A',
  fall:            '#FF453A',
  irregular:       '#FF9F0A',
  connectionDotOn: '#30D158',
  connectionDotOff:'#8E8E93',
  sheetOverlay:    'rgba(0, 0, 0, 0.72)',
} as const;

// ── Ambient Background Radial Overlays (600px radius, 1200ms ease) ──
export const ambientOverlay = {
  normal:       'radial-gradient(600px circle at 50% 0%, rgba(10, 132, 255, 0.25) 0%, transparent 100%)',
  irregular:    'radial-gradient(600px circle at 50% 0%, rgba(255, 159, 10, 0.30) 0%, transparent 100%)',
  fall:         'radial-gradient(600px circle at 50% 0%, rgba(255, 69, 58, 0.40) 0%, transparent 100%)',
  disconnected: 'radial-gradient(600px circle at 50% 0%, rgba(142, 142, 147, 0.15) 0%, transparent 100%)',
  normalStale:  'radial-gradient(600px circle at 50% 0%, rgba(142, 142, 147, 0.15) 0%, transparent 100%)',
  reconnecting: 'radial-gradient(600px circle at 50% 0%, rgba(14, 165, 233, 0.25) 0%, transparent 100%)',
  lowBattery:   'radial-gradient(600px circle at 50% 0%, rgba(255, 214, 10, 0.25) 0%, transparent 100%)',
  transition:   '1200ms ease',
} as const;

// ── Component Sizing & Radii ──────────────────────────────────
export const dimensions = {
  cardRadius: 24,
  pillRadius: 12,
  barRadius: 4,
  phoneRadius: 44,

  heroRingSize: 200,
  heroRingStroke: 16,

  smallRingSize: 88,
  smallRingStroke: 10,

  sparklineHeight: 72,
  sparklineStroke: 2,

  batteryBarHeight: 6,
  connectionDotSize: 8,
  disconnectButtonHeight: 48,

  iconSize: 20,
  iconStroke: 2,
} as const;

// ── Typography ────────────────────────────────────────────────
export const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  appTitle: {
    size: 28,
    weight: 700,
    lineHeight: '34px',
    color: colors.textPrimary,
  },
  cardLabel: {
    size: 13,
    weight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: colors.textSecondary,
  },
  heroNumber: {
    size: 64,
    weight: 700,
    lineHeight: '64px',
    color: colors.textPrimary,
  },
  heroUnit: {
    size: 15,
    weight: 500,
    color: colors.textSecondary,
  },
  smallNumber: {
    size: 28,
    weight: 700,
    lineHeight: '34px',
    color: colors.textPrimary,
  },
  statusTitle: {
    size: 17,
    weight: 600,
    lineHeight: '22px',
    color: colors.textPrimary,
  },
  statusSubtitle: {
    size: 13,
    weight: 400,
    lineHeight: '18px',
    color: colors.textSecondary,
  },
  connectionChip: {
    size: 13,
    weight: 500,
    color: colors.textPrimary,
  },
  disconnectButton: {
    size: 17,
    weight: 500,
    color: colors.disconnect,
  },
} as const;

// ── Haptic Vibrations ─────────────────────────────────────────
export const feedback = {
  tick:    { vibrate: [6],                   pulseScale: 1.02 },
  confirm: { vibrate: [10, 30, 10],          pulseScale: 1.04 },
  warn:    { vibrate: [30, 40, 30],          pulseScale: 1.06 },
  alarm:   { vibrate: [100, 80, 100, 80, 200], pulseScale: 1.08 },
  settle:  { vibrate: [4],                   pulseScale: 0.98 },
} as const;

// ── Backward-Compatibility Aliases ────────────────────────────
export const radius = {
  sm: 8,
  md: 16,
  lg: dimensions.cardRadius,
  full: dimensions.pillRadius,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: layout.sectionGap,
  xl: layout.pagePadding,
  xxl: 48,
  safe: 34,
} as const;

export const duration = {
  normal: 1.2,
  staleData: 10,
} as const;

export const shadow = {
  card: 'none',
  sheet: '0 -8px 32px rgba(0,0,0,0.85)',
} as const;

export const ringDefaults = {
  size: dimensions.heroRingSize,
  strokeWidth: dimensions.heroRingStroke,
} as const;

export const palette = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlpha: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    hr: '#E11D48',
    hrBg: 'rgba(225, 29, 72, 0.12)',
    spo2: '#059669',
    spo2Bg: 'rgba(5, 150, 105, 0.12)',
    battery: '#D97706',
    batteryBg: 'rgba(217, 119, 6, 0.12)',
    fall: '#DC2626',
    fallBg: 'rgba(220, 38, 38, 0.12)',
    irregular: '#D97706',
    irregularBg: 'rgba(217, 119, 6, 0.12)',
    disconnect: '#DC2626',
    reconnecting: '#0284C7',
    activity: '#0284C7',
    activityBg: 'rgba(2, 132, 199, 0.12)',
    sheetOverlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    bg: '#000000',
    surface: '#1C1C1E',
    surfaceAlpha: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: 'rgba(255, 255, 255, 0.06)',
    hr: '#FF375F',
    hrBg: 'rgba(255, 55, 95, 0.20)',
    spo2: '#30D158',
    spo2Bg: 'rgba(48, 209, 88, 0.20)',
    battery: '#FFD60A',
    batteryBg: 'rgba(255, 214, 10, 0.20)',
    fall: '#FF453A',
    fallBg: 'rgba(255, 69, 58, 0.20)',
    irregular: '#FF9F0A',
    irregularBg: 'rgba(255, 159, 10, 0.20)',
    disconnect: '#FF453A',
    reconnecting: '#0EA5E9',
    activity: '#06B6D4',
    activityBg: 'rgba(6, 182, 212, 0.20)',
    sheetOverlay: 'rgba(0, 0, 0, 0.72)',
  },
} as const;

export const ambientGradient = ambientOverlay;
export const ambientGradientDark = ambientOverlay;

export const type = {
  caption: { size: 12, weight: 400, leading: 16 },
  body: { size: 15, weight: 400, leading: 22 },
  bodyBold: { size: 15, weight: 600, leading: 22 },
  title3: { size: 20, weight: 600, leading: 25 },
  title2: { size: 28, weight: 700, leading: 34 },
  title1: { size: 28, weight: 700, leading: 34 },
  large: { size: 64, weight: 700, leading: 64 },
} as const;

export const fallAlert = {
  dismissThreshold: 0.9,
  countdownSeconds: 30,
} as const;

export const zIndex = {
  sheet: 50,
} as const;

const tokens = {
  spring,
  press,
  stagger,
  layout,
  colors,
  ambientOverlay,
  dimensions,
  typography,
  feedback,
  radius,
  space,
  duration,
  shadow,
  ringDefaults,
  palette,
  type,
  fallAlert,
} as const;

export default tokens;
