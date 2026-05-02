/**
 * Locale-aware Intl helpers.
 *
 * All accept the active locale as the first arg so they can be called from
 * inside React components (`useLocale()`) or from Probe analyzers (passed
 * explicitly).
 */

import type { Locale } from './types';

export function formatBytes(locale: Locale, bytes: number): string {
  // Compact + binary-ish display: 1.2 KB / 482 B / 3.4 MB.
  if (bytes < 1024) return `${formatNumber(locale, bytes)} B`;
  if (bytes < 1024 * 1024) return `${formatNumber(locale, bytes / 1024, 1)} KB`;
  return `${formatNumber(locale, bytes / (1024 * 1024), 2)} MB`;
}

export function formatNumber(locale: Locale, n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

export function formatPercent(locale: Locale, ratio: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(ratio);
}

export function formatRelativeTime(locale: Locale, fromMs: number, nowMs = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffSec = Math.round((fromMs - nowMs) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  return rtf.format(Math.round(diffSec / 86400), 'day');
}

export function formatDateTime(locale: Locale, ms: number): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ms));
}

export function formatTime(locale: Locale, ms: number): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'medium' }).format(new Date(ms));
}
