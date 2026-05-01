import type { Archetype } from '@shared/types';

export interface ViewportPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const VIEWPORTS: ReadonlyArray<ViewportPreset> = [
  { id: 'mobile-s', label: 'Mobile · 375', width: 375, height: 720 },
  { id: 'mobile-l', label: 'Mobile L · 425', width: 425, height: 760 },
  { id: 'tablet', label: 'Tablet · 768', width: 768, height: 1024 },
  { id: 'laptop', label: 'Laptop · 1024', width: 1024, height: 760 },
  { id: 'desktop', label: 'Desktop · 1280', width: 1280, height: 800 },
  { id: 'wide', label: 'Wide · 1920', width: 1920, height: 1080 },
];

export const BREAKPOINTS = [
  { px: 320, label: 'sm-' },
  { px: 768, label: 'md' },
  { px: 1024, label: 'lg' },
  { px: 1280, label: 'xl' },
  { px: 1920, label: '2xl' },
] as const;

export function currentBreakpoint(width: number): string {
  if (width < 640) return 'sm';
  if (width < 768) return 'md (sm)';
  if (width < 1024) return 'lg (md)';
  if (width < 1280) return 'xl (lg)';
  if (width < 1920) return '2xl (xl)';
  return '3xl (2xl)';
}

export interface ViewportIssue {
  severity: 'err' | 'warn' | 'info';
  title: string;
  hint: string;
}

export function issuesAt(width: number, archetype: Archetype): ViewportIssue[] {
  const out: ViewportIssue[] = [];
  if (width < 480) {
    out.push({
      severity: 'warn',
      title: 'Fixed-width container detected',
      hint: 'min-w-[1024px] in components/AppShell may overflow on mobile',
    });
  }
  if (archetype === 'commerce.product-detail' && width < 768) {
    out.push({
      severity: 'info',
      title: 'Image gallery stacks vertically',
      hint: 'verify lazy-load + sizes prop',
    });
  }
  if (archetype === 'commerce.checkout' && width < 768) {
    out.push({
      severity: 'err',
      title: 'CTA button hidden behind sticky footer',
      hint: 'add bottom padding equal to footer height',
    });
  }
  if (archetype === 'dashboard' && width < 1024) {
    out.push({
      severity: 'warn',
      title: 'ChartPanel responsive variant missing',
      hint: 'add sm:/md: classes for chart container',
    });
  }
  if (out.length === 0) {
    out.push({
      severity: 'info',
      title: 'No layout issues detected',
      hint: 'breakpoint coverage looks healthy',
    });
  }
  return out;
}
