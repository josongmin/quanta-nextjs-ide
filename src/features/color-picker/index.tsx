import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  hexToRgb,
  hslToRgb,
  rgbToHex,
  rgbToHsl,
  rgbaCss,
  type ColorMatch,
} from './helpers';

export type { ColorMatch, ColorFormat } from './helpers';
export {
  findColorsInLine,
  rgbToHex,
  hexToRgb,
  applyAlpha,
  hslToRgb,
  rgbToHsl,
  rgbaCss,
} from './helpers';

interface ColorPickerPopoverProps {
  initial: ColorMatch;
  onClose(): void;
  onReplace?(next: string): void;
}

const RECENT_DEFAULTS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function ColorPickerPopover({ initial, onClose, onReplace }: ColorPickerPopoverProps) {
  const [r, setR] = useState<number>(initial.r);
  const [g, setG] = useState<number>(initial.g);
  const [b, setB] = useState<number>(initial.b);
  const [alpha, setAlpha] = useState<number>(Math.round((initial.a ?? 1) * 100));
  const [hexInput, setHexInput] = useState<string>(rgbToHex(initial.r, initial.g, initial.b));

  const hsl = useMemo(() => rgbToHsl(r, g, b), [r, g, b]);
  const [hue, setHue] = useState<number>(hsl.h);
  const [sat, setSat] = useState<number>(hsl.s);
  const [light, setLight] = useState<number>(hsl.l);

  const hexCurrent = rgbToHex(r, g, b);
  const cssCurrent =
    alpha < 100
      ? rgbaCss(r, g, b, alpha / 100)
      : hexCurrent;

  const setRgb = (nr: number, ng: number, nb: number) => {
    const cr = clamp(Math.round(nr), 0, 255);
    const cg = clamp(Math.round(ng), 0, 255);
    const cb = clamp(Math.round(nb), 0, 255);
    setR(cr);
    setG(cg);
    setB(cb);
    setHexInput(rgbToHex(cr, cg, cb));
    const h = rgbToHsl(cr, cg, cb);
    setHue(h.h);
    setSat(h.s);
    setLight(h.l);
  };

  const onHexChange = (v: string) => {
    setHexInput(v);
    const parsed = hexToRgb(v);
    if (parsed) setRgb(parsed.r, parsed.g, parsed.b);
  };

  const onHslChange = (h: number, s: number, l: number) => {
    setHue(h);
    setSat(s);
    setLight(l);
    const rgb = hslToRgb(h, s, l);
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
    setHexInput(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cssCurrent);
      }
      toast('Color copied', { description: cssCurrent });
    } catch {
      toast('Color copied', { description: cssCurrent });
    }
  };

  const handleReplace = () => {
    onReplace?.(cssCurrent);
    toast('Color replaced (mock)', {
      description: `${initial.raw} → ${cssCurrent}`,
    });
    onClose();
  };

  return (
    <div className="w-[260px] p-3">
      <div className="flex items-center gap-2">
        <div
          aria-hidden
          className="h-9 w-9 rounded-sm border border-line"
          style={{ background: cssCurrent }}
        />
        <div className="min-w-0 flex-1">
          <label className="block text-[10px] font-medium uppercase tracking-caps text-ink-3">
            Hex
          </label>
          <input
            value={hexInput}
            onChange={(e) => onHexChange(e.target.value)}
            spellCheck={false}
            className={cn(
              'mt-0.5 w-full rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-xs text-ink-1',
              'focus:border-accent focus:outline-none',
            )}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <NumField label="R" value={r} max={255} onChange={(v) => setRgb(v, g, b)} />
        <NumField label="G" value={g} max={255} onChange={(v) => setRgb(r, v, b)} />
        <NumField label="B" value={b} max={255} onChange={(v) => setRgb(r, g, v)} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <NumField
          label="H"
          value={hue}
          max={360}
          onChange={(v) => onHslChange(v, sat, light)}
        />
        <NumField
          label="S"
          value={sat}
          max={100}
          onChange={(v) => onHslChange(hue, v, light)}
        />
        <NumField
          label="L"
          value={light}
          max={100}
          onChange={(v) => onHslChange(hue, sat, v)}
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-caps text-ink-3">
            Alpha
          </span>
          <span className="font-mono text-[11px] text-ink-2">{alpha}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))}
          className="mt-1 w-full accent-accent"
        />
      </div>

      <div className="mt-3">
        <div className="text-[10px] font-medium uppercase tracking-caps text-ink-3">
          Recent
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {RECENT_DEFAULTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Recent ${c}`}
              onClick={() => onHexChange(c)}
              className="h-5 w-5 rounded-sm border border-line opacity-80 hover:opacity-100"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
        <Button size="xs" tone="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button size="xs" tone="soft" onClick={handleCopy}>
          Copy
        </Button>
        <Button size="xs" tone="accent" onClick={handleReplace}>
          Replace
        </Button>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange(v: number): void;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-medium uppercase tracking-caps text-ink-3">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={0}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className={cn(
          'mt-0.5 w-full rounded-sm border border-line bg-bg px-1 py-0.5 font-mono text-[11px] text-ink-1',
          'focus:border-accent focus:outline-none',
        )}
      />
    </label>
  );
}
