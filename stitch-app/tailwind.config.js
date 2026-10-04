/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "secondary-fixed": "#72f9d5",
        "error": "#ba1a1a",
        "surface-dim": "#c8dee2",
        "surface-bright": "#eefcff",
        "on-tertiary-fixed": "#400012",
        "primary-container": "#01373d",
        "primary": "#002024",
        "on-background": "#0a1e22",
        "on-tertiary-fixed-variant": "#910033",
        "on-error-container": "#93000a",
        "secondary-container": "#72f9d5",
        "surface-container-low": "#e2f8fc",
        "tertiary": "#410012",
        "tertiary-fixed-dim": "#ffb2bb",
        "tertiary-container": "#680022",
        "surface-container": "#dcf2f6",
        "surface-container-high": "#d6ecf1",
        "on-error": "#ffffff",
        "surface-tint": "#39656b",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#a1ced5",
        "on-surface-variant": "#404849",
        "on-primary": "#ffffff",
        "inverse-surface": "#203337",
        "outline-variant": "#c0c8c9",
        "on-primary-fixed": "#001f23",
        "secondary": "#006b57",
        "surface": "#eefcff",
        "on-secondary-container": "#00725d",
        "on-primary-fixed-variant": "#1f4d53",
        "primary-fixed": "#bdeaf2",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed-dim": "#52dcba",
        "error-container": "#ffdad6",
        "on-secondary-fixed-variant": "#005141",
        "surface-variant": "#d1e6eb",
        "surface-container-highest": "#d1e6eb",
        "on-tertiary-container": "#ff6382",
        "on-primary-container": "#74a0a7",
        "on-surface": "#0a1e22",
        "background": "#eefcff",
        "outline": "#71787a",
        "inverse-on-surface": "#dff5f9",
        "tertiary-fixed": "#ffd9dd",
        "inverse-primary": "#a1ced5",
        "on-secondary-fixed": "#002019"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "space-xl": "2rem",
        "gutter": "1.5rem",
        "margin-mobile": "1rem",
        "space-sm": "0.5rem",
        "space-lg": "1.5rem",
        "space-md": "1rem",
        "gutter-mobile": "0.75rem",
        "space-xs": "0.25rem",
        "margin": "2rem"
      },
      "fontFamily": {
        "sans": ["'Plus Jakarta Sans'", "sans-serif"]
      },
      "fontSize": {
        "metric-xl": ["36px", { "lineHeight": "42px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "label-md": ["13px", { "lineHeight": "18px", "letterSpacing": "0.01em", "fontWeight": "600" }],
        "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "metric-md": ["24px", { "lineHeight": "30px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "label-sm": ["11px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "600" }],
        "display-lg": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.015em", "fontWeight": "700" }],
        "headline-lg-mobile": ["26px", { "lineHeight": "34px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }]
      }
    }
  }
}

