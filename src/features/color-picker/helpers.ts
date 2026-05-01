// Color helpers — parse `#hex`, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`
// tokens out of source text, plus tiny conversion utilities.

export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

export interface ColorMatch {
  line: number;
  column: number;
  raw: string;
  format: ColorFormat;
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;
const RGB_RE = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/g;
const HSL_RE = /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/g;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function pad2(n: number): string {
  const v = clamp(Math.round(n), 0, 255).toString(16);
  return v.length === 1 ? `0${v}` : v;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${pad2(r)}${pad2(g)}${pad2(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function applyAlpha(rgb: string, alpha: number): string {
  // `rgb` is either `#RRGGBB` or `r,g,b`. Always returns rgba(...).
  const a = clamp(alpha, 0, 1);
  if (rgb.startsWith('#')) {
    const parsed = hexToRgb(rgb);
    if (!parsed) return rgb;
    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`;
  }
  return `rgba(${rgb}, ${a})`;
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = ln - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function findColorsInLine(text: string, line: number): ColorMatch[] {
  const out: ColorMatch[] = [];
  // Reset lastIndex for global RegExps.
  HEX_RE.lastIndex = 0;
  RGB_RE.lastIndex = 0;
  HSL_RE.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = HEX_RE.exec(text)) !== null) {
    const raw = m[0];
    const parsed = hexToRgb(raw);
    if (!parsed) continue;
    out.push({
      line,
      column: m.index + 1,
      raw,
      format: 'hex',
      r: parsed.r,
      g: parsed.g,
      b: parsed.b,
      a: 1,
    });
  }
  while ((m = RGB_RE.exec(text)) !== null) {
    const raw = m[0];
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    const a = m[4] != null ? Number(m[4]) : 1;
    if ([r, g, b].some(Number.isNaN)) continue;
    out.push({
      line,
      column: m.index + 1,
      raw,
      format: m[4] != null ? 'rgba' : 'rgb',
      r: clamp(Math.round(r), 0, 255),
      g: clamp(Math.round(g), 0, 255),
      b: clamp(Math.round(b), 0, 255),
      a: Number.isFinite(a) ? clamp(a, 0, 1) : 1,
    });
  }
  while ((m = HSL_RE.exec(text)) !== null) {
    const raw = m[0];
    const h = Number(m[1]);
    const s = Number(m[2]);
    const l = Number(m[3]);
    const a = m[4] != null ? Number(m[4]) : 1;
    if ([h, s, l].some(Number.isNaN)) continue;
    const rgb = hslToRgb(h, s, l);
    out.push({
      line,
      column: m.index + 1,
      raw,
      format: m[4] != null ? 'hsla' : 'hsl',
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: Number.isFinite(a) ? clamp(a, 0, 1) : 1,
    });
  }

  // Sort left-to-right so the layer renders deterministically.
  out.sort((p, q) => p.column - q.column);
  return out;
}

export function rgbaCss(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}
