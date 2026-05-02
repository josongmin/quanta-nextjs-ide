import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '0',
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: 'hsl(var(--bg))',
          subtle: 'hsl(var(--bg-subtle))',
          hover: 'hsl(var(--bg-hover))',
          selected: 'hsl(var(--bg-selected))',
          active: 'hsl(var(--bg-active))',
        },
        line: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
          faint: 'hsl(var(--border-faint))',
        },
        ink: {
          1: 'hsl(var(--text))',
          2: 'hsl(var(--text-2))',
          3: 'hsl(var(--text-3))',
          link: 'hsl(var(--text-link))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          soft: 'hsl(var(--accent-soft))',
        },
        sev: {
          err: 'hsl(var(--err))',
          'err-soft': 'hsl(var(--err-soft))',
          warn: 'hsl(var(--warn))',
          'warn-soft': 'hsl(var(--warn-soft))',
          info: 'hsl(var(--info))',
          'info-soft': 'hsl(var(--info-soft))',
          hint: 'hsl(var(--hint))',
        },
        sem: {
          static: 'hsl(var(--sem-static))',
          'static-soft': 'hsl(var(--sem-static-soft))',
          isr: 'hsl(var(--sem-isr))',
          'isr-soft': 'hsl(var(--sem-isr-soft))',
          dynamic: 'hsl(var(--sem-dynamic))',
          'dynamic-soft': 'hsl(var(--sem-dynamic-soft))',
          edge: 'hsl(var(--sem-edge))',
          'edge-soft': 'hsl(var(--sem-edge-soft))',
          client: 'hsl(var(--sem-client))',
          'client-soft': 'hsl(var(--sem-client-soft))',
          server: 'hsl(var(--sem-server))',
          'server-soft': 'hsl(var(--sem-server-soft))',
        },
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
      },
      letterSpacing: {
        caps: '0.04em',
        tightish: '-0.011em',
        tighter2: '-0.022em',
      },
      spacing: {
        '0.25': '1px',
        '0.75': '3px',
        '1.25': '5px',
        '1.75': '7px',
        '2.25': '9px',
        '2.75': '11px',
        '3.25': '13px',
        '3.75': '15px',
        '4.5': '18px',
        '5.5': '22px',
        '6.5': '26px',
        '7.5': '30px',
        '8.5': '34px',
        '9.5': '38px',
        '10.5': '42px',
        '11.5': '46px',
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        // Tiered elevation for hairline-first UI
        'e1': '0 1px 1px hsl(var(--text) / 0.04)',
        'e2': '0 1px 2px hsl(var(--text) / 0.04), 0 2px 6px hsl(var(--text) / 0.04)',
        'e3': '0 1px 2px hsl(var(--text) / 0.04), 0 6px 18px hsl(var(--text) / 0.06)',
        'e4': '0 2px 4px hsl(var(--text) / 0.05), 0 14px 36px hsl(var(--text) / 0.10)',
        'e5': '0 4px 8px hsl(var(--text) / 0.06), 0 22px 60px hsl(var(--text) / 0.14)',
        pop: '0 1px 2px hsl(var(--text) / 0.04), 0 8px 24px hsl(var(--text) / 0.06)',
        focus: '0 0 0 2px hsl(var(--accent) / 0.25)',
        // Inner highlights for dark themes (optional via dark: prefix)
        'inner-top': 'inset 0 1px 0 hsl(var(--bg) / 0.06)',
        'glow-accent': '0 0 0 1px hsl(var(--accent) / 0.4), 0 0 18px hsl(var(--accent) / 0.18)',
      },
      transitionTimingFunction: {
        // Industry-standard SOTA easings
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'swift-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'swift-in': 'cubic-bezier(0.55, 0, 0.55, 0.2)',
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        instant: '80ms',
        snappy: '140ms',
        moderate: '220ms',
        relaxed: '320ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'spring-up': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.985)' },
          '60%': { opacity: '1', transform: 'translateY(-1px) scale(1.005)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 hsl(var(--accent) / 0.45)' },
          '70%': { boxShadow: '0 0 0 8px hsl(var(--accent) / 0)' },
          '100%': { boxShadow: '0 0 0 0 hsl(var(--accent) / 0)' },
        },
        'underline-grow': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        'hairline-sweep': {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slide-up 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'spring-up': 'spring-up 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-in': 'scale-in 160ms cubic-bezier(0.22, 1, 0.36, 1)',
        'shimmer': 'shimmer 1.4s linear infinite',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'underline-grow': 'underline-grow 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
