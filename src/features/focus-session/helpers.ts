export type FocusStatus = 'idle' | 'running' | 'paused' | 'break';

export interface FocusMode {
  id: string;
  label: string;
  workSec: number;
  breakSec: number;
  hint: string;
}

export const FOCUS_MODES: ReadonlyArray<FocusMode> = [
  {
    id: 'pomodoro',
    label: 'Pomodoro 25/5',
    workSec: 25 * 60,
    breakSec: 5 * 60,
    hint: 'Classic short cycle',
  },
  {
    id: 'long',
    label: '52/17',
    workSec: 52 * 60,
    breakSec: 17 * 60,
    hint: 'Deep focus rhythm',
  },
  {
    id: 'sprint',
    label: '90 min sprint',
    workSec: 90 * 60,
    breakSec: 20 * 60,
    hint: 'Single ultradian cycle',
  },
  {
    id: 'review',
    label: 'Daily review 15',
    workSec: 15 * 60,
    breakSec: 3 * 60,
    hint: 'Plan & reflect',
  },
  {
    id: 'custom',
    label: 'Custom',
    workSec: 30 * 60,
    breakSec: 6 * 60,
    hint: 'Tweak as needed',
  },
];

export interface BreakSuggestion {
  id: string;
  title: string;
  body: string;
}

export const BREAK_SUGGESTIONS: ReadonlyArray<BreakSuggestion> = [
  { id: 's1', title: 'Stand & stretch', body: 'Roll shoulders, open hips, twist gently for 60 seconds.' },
  { id: 's2', title: 'Drink water', body: 'A full glass. Hydration drops focus before you feel it.' },
  { id: 's3', title: 'Look 6m away (20-20-20)', body: 'Every 20 min, gaze 20 feet away for 20 seconds.' },
  { id: 's4', title: 'Walk 2 minutes', body: 'Move blood to the brain, even just down the hall.' },
  { id: 's5', title: 'Note one win', body: 'Write the smallest thing you accomplished. Receipts matter.' },
  { id: 's6', title: 'Close one tab', body: 'Trim ambient context. Pick the least useful one.' },
  { id: 's7', title: 'Box-breathe x4', body: 'Inhale 4, hold 4, exhale 4, hold 4. Four rounds.' },
  { id: 's8', title: 'Tidy the desk', body: 'One sweep. Pens to cup, mug to sink, screen wipe.' },
  { id: 's9', title: 'Re-read the goal', body: 'What outcome were you working toward this session?' },
  { id: 's10', title: 'Send one nudge', body: 'A short async ping unblocks future-you.' },
];

export function pickSuggestion(seed: number): BreakSuggestion {
  const idx = seed % BREAK_SUGGESTIONS.length;
  return BREAK_SUGGESTIONS[idx] ?? BREAK_SUGGESTIONS[0]!;
}

export function fmtTime(sec: number): string {
  const m = Math.max(0, Math.floor(sec / 60));
  const s = Math.max(0, sec - m * 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const INITIAL_TODAY_SESSIONS = 3;
export const INITIAL_TODAY_MINUTES = 78;
