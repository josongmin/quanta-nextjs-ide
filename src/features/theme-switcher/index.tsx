/**
 * Theme switcher — gorgeous popover with live-preview swatches.
 *
 * - 8 themes (3 light + 5 dark/warm), grouped
 * - each option renders a tiny mock window so the user "sees" the theme
 *   before committing
 * - keyboard: Cmd/Ctrl+J toggles, Up/Down/Left/Right navigates,
 *   Enter applies, Esc closes
 * - apply is instant (CSS variables) with a 250ms cross-fade transition
 *   handled by ThemeBridge
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useUiStore } from '@entities/ui-shell';
import type { ColorMode } from '@entities/ui-shell';
import { cn } from '@shared/lib/cn';
import { Kbd } from '@shared/ui';

interface ThemeOption {
  id: ColorMode;
  name: string;
  tagline: string;
  group: 'light' | 'dark';
  swatches: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
    border: string;
  };
}

const THEMES: ThemeOption[] = [
  {
    id: 'light',
    name: 'Daybreak',
    tagline: 'Cream-leaning whites',
    group: 'light',
    swatches: { bg: '#FCFCFB', surface: '#F8F7F4', accent: '#4F46E5', text: '#211F1B', border: '#E8E6E1' },
  },
  {
    id: 'light-hc',
    name: 'High Contrast',
    tagline: 'Sharper hairlines',
    group: 'light',
    swatches: { bg: '#FCFCFB', surface: '#F8F7F4', accent: '#4F46E5', text: '#1C1A18', border: '#A8A6A0' },
  },
  {
    id: 'mac',
    name: 'Macintosh',
    tagline: 'System 7 platinum',
    group: 'light',
    swatches: { bg: '#F5F0E6', surface: '#ECE4D6', accent: '#1F5BAE', text: '#272421', border: '#C9C0B0' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    tagline: 'Late-afternoon rose',
    group: 'light',
    swatches: { bg: '#FFF5EC', surface: '#FCE8D9', accent: '#E0561C', text: '#2A1A10', border: '#E5C8B5' },
  },
  {
    id: 'dark',
    name: 'Carbon',
    tagline: 'Modern neutral dark',
    group: 'dark',
    swatches: { bg: '#15171C', surface: '#1B1E25', accent: '#8E83F4', text: '#EEF1F5', border: '#2E323B' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Deep indigo focus',
    group: 'dark',
    swatches: { bg: '#0E1124', surface: '#13172E', accent: '#9C8CFF', text: '#EDEEFB', border: '#272D4D' },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    tagline: 'Phosphor green CRT',
    group: 'dark',
    swatches: { bg: '#0B130E', surface: '#10180F', accent: '#5EE57A', text: '#CCEFD2', border: '#1F2A22' },
  },
  {
    id: 'dim',
    name: 'Dim',
    tagline: 'Warm low-glare dark',
    group: 'dark',
    swatches: { bg: '#272320', surface: '#2E2A26', accent: '#E29A55', text: '#ECE6DF', border: '#3D3833' },
  },
];

interface MiniPreviewProps {
  theme: ThemeOption;
  selected: boolean;
  focused: boolean;
}

function MiniPreview({ theme, selected, focused }: MiniPreviewProps) {
  const { swatches } = theme;
  return (
    <div
      className={cn(
        'relative h-[68px] w-full overflow-hidden rounded-lg transition-all duration-200',
        'ring-1',
        selected
          ? 'ring-accent shadow-[0_0_0_2px_hsl(var(--accent)/0.18)]'
          : focused
            ? 'ring-line-strong'
            : 'ring-line',
      )}
      style={{ background: swatches.bg }}
    >
      {/* fake titlebar */}
      <div
        className="flex h-3 items-center gap-[3px] px-[6px]"
        style={{ background: swatches.surface, borderBottom: `1px solid ${swatches.border}` }}
      >
        <span className="h-[5px] w-[5px] rounded-full" style={{ background: '#FF5F57' }} />
        <span className="h-[5px] w-[5px] rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="h-[5px] w-[5px] rounded-full" style={{ background: '#28C840' }} />
      </div>
      {/* fake sidebar */}
      <div className="flex h-[calc(100%-12px)]">
        <div
          className="w-[24%] py-1.5 px-1"
          style={{ background: swatches.surface, borderRight: `1px solid ${swatches.border}` }}
        >
          <div className="mb-1 h-[3px] w-3/4 rounded" style={{ background: swatches.border }} />
          <div className="mb-1 h-[3px] w-1/2 rounded" style={{ background: swatches.border }} />
          <div className="h-[3px] w-2/3 rounded" style={{ background: swatches.accent, opacity: 0.8 }} />
        </div>
        {/* fake editor lines */}
        <div className="flex-1 px-1.5 py-1.5">
          <div className="mb-[3px] flex items-center gap-1">
            <span className="h-[3px] w-2 rounded" style={{ background: swatches.accent }} />
            <span className="h-[3px] flex-1 rounded" style={{ background: swatches.border }} />
          </div>
          <div className="mb-[3px] flex items-center gap-1 pl-2">
            <span className="h-[3px] w-3 rounded" style={{ background: swatches.text, opacity: 0.65 }} />
            <span className="h-[3px] flex-1 rounded" style={{ background: swatches.border }} />
          </div>
          <div className="mb-[3px] flex items-center gap-1 pl-2">
            <span className="h-[3px] w-2 rounded" style={{ background: swatches.text, opacity: 0.65 }} />
            <span className="h-[3px] w-3/4 rounded" style={{ background: swatches.border }} />
          </div>
          <div className="flex items-center gap-1 pl-1">
            <span className="h-[3px] w-1 rounded" style={{ background: swatches.accent }} />
            <span className="h-[3px] w-1/2 rounded" style={{ background: swatches.border }} />
          </div>
        </div>
      </div>
      {selected ? (
        <span className="absolute right-1 top-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
          ✓
        </span>
      ) : null}
    </div>
  );
}

export function ThemeSwitcherButton() {
  const colorMode = useUiStore((s) => s.colorMode);
  const setColorMode = useUiStore((s) => s.setColorMode);
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState<number>(() =>
    Math.max(0, THEMES.findIndex((t) => t.id === colorMode)),
  );
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Cmd/Ctrl+J keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j' && !e.shiftKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sync focus when current colorMode changes externally
  useEffect(() => {
    const idx = THEMES.findIndex((t) => t.id === colorMode);
    if (idx >= 0) setFocusIdx(idx);
  }, [colorMode]);

  const onKeyNav = (e: React.KeyboardEvent) => {
    if (!open) return;
    const cols = 2; // grid is 2 columns
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(THEMES.length - 1, i + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(THEMES.length - 1, i + cols));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(0, i - cols));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const t = THEMES[focusIdx];
      if (t) setColorMode(t.id);
      setOpen(false);
    }
  };

  const groups = useMemo(() => {
    const light = THEMES.filter((t) => t.group === 'light');
    const dark = THEMES.filter((t) => t.group === 'dark');
    return { light, dark };
  }, []);

  const current = THEMES.find((t) => t.id === colorMode) ?? THEMES[0]!;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label={`Switch theme (current: ${current.name})`}
          className={cn(
            'group inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-xs',
            'border border-line bg-bg-subtle hover:bg-bg-hover',
            'transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-accent',
          )}
        >
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full ring-1 ring-line"
            style={{
              background: `linear-gradient(135deg, ${current.swatches.bg} 0%, ${current.swatches.bg} 50%, ${current.swatches.accent} 50%, ${current.swatches.accent} 100%)`,
            }}
          />
          <span className="font-medium text-ink-1">{current.name}</span>
          <Kbd>⌘J</Kbd>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-[440px] rounded-2xl p-3',
            'glass-strong shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]',
            'animate-in fade-in-0 zoom-in-95 duration-200 ease-out',
          )}
          onKeyDown={onKeyNav}
        >
          <div className="px-2 pb-2 pt-1">
            <div className="text-caps text-ink-3">Appearance</div>
            <div className="mt-0.5 text-[13px] font-medium text-ink-1">Pick a theme</div>
          </div>

          <Section label="Light" themes={groups.light} startIdx={0} />
          <div className="my-2 h-px bg-line-faint" />
          <Section label="Dark" themes={groups.dark} startIdx={groups.light.length} />

          <div className="mt-2 flex items-center justify-between border-t border-line-faint pt-2 px-1">
            <div className="text-[10px] uppercase tracking-wider text-ink-3">
              <span className="opacity-70">↑↓←→</span> navigate
              <span className="ml-2 opacity-70">Enter</span> apply
              <span className="ml-2 opacity-70">Esc</span> close
            </div>
            <span
              aria-hidden="true"
              className="h-3 w-12 rounded-full gradient-accent opacity-80"
            />
          </div>

          <div ref={gridRef} className="sr-only" aria-live="polite">
            Focused: {THEMES[focusIdx]?.name}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );

  function Section({
    label,
    themes,
    startIdx,
  }: {
    label: string;
    themes: ThemeOption[];
    startIdx: number;
  }) {
    return (
      <div>
        <div className="px-1 pb-1.5 text-caps text-ink-3">{label}</div>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t, i) => {
            const idx = startIdx + i;
            const focused = idx === focusIdx;
            const selected = t.id === colorMode;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setColorMode(t.id);
                  setOpen(false);
                }}
                onMouseEnter={() => setFocusIdx(idx)}
                className={cn(
                  'group flex flex-col gap-1.5 rounded-xl p-1.5 text-left transition-all duration-150',
                  focused ? 'bg-bg-hover' : 'hover:bg-bg-hover/70',
                )}
              >
                <MiniPreview theme={t} selected={selected} focused={focused} />
                <div className="px-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-1">{t.name}</span>
                    {selected ? (
                      <span className="rounded-full bg-accent/15 px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-accent">
                        active
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-ink-3">{t.tagline}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}
