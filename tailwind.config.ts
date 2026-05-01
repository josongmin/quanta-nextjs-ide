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
      },
      spacing: {
        '4.5': '18px',
        '7.5': '30px',
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        pop: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        focus: '0 0 0 2px hsl(var(--accent) / 0.25)',
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
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'slide-up': 'slide-up 140ms ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
