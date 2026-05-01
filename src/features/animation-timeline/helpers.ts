export interface KeyframeStop {
  id: string;
  pct: number;
  props: ReadonlyArray<{ name: string; value: string }>;
}

export interface AnimationDef {
  id: string;
  name: string;
  duration: number;
  easing: string;
  stops: KeyframeStop[];
}

export const easings: ReadonlyArray<{
  id: string;
  label: string;
  cubic: [number, number, number, number];
}> = [
  { id: 'linear', label: 'linear', cubic: [0, 0, 1, 1] },
  { id: 'ease', label: 'ease', cubic: [0.25, 0.1, 0.25, 1] },
  { id: 'ease-in', label: 'ease-in', cubic: [0.42, 0, 1, 1] },
  { id: 'ease-out', label: 'ease-out', cubic: [0, 0, 0.58, 1] },
  { id: 'ease-in-out', label: 'ease-in-out', cubic: [0.42, 0, 0.58, 1] },
  { id: 'spring', label: 'cubic-bezier(.4,0,.2,1)', cubic: [0.4, 0, 0.2, 1] },
];

const stops = (
  prefix: string,
  per: ReadonlyArray<ReadonlyArray<[string, string]>>,
): KeyframeStop[] =>
  [0, 25, 50, 75, 100].map((pct, i) => ({
    id: `${prefix}-${pct}`,
    pct,
    props: (per[i] ?? []).map(([name, value]) => ({ name, value })),
  }));

export const animations: ReadonlyArray<AnimationDef> = [
  {
    id: 'slide-up',
    name: 'slide-up',
    duration: 400,
    easing: 'ease-out',
    stops: stops('su', [
      [['transform', 'translateY(20px)'], ['opacity', '0']],
      [['transform', 'translateY(15px)'], ['opacity', '0.25']],
      [['transform', 'translateY(8px)'], ['opacity', '0.6']],
      [['transform', 'translateY(2px)'], ['opacity', '0.9']],
      [['transform', 'translateY(0)'], ['opacity', '1']],
    ]),
  },
  {
    id: 'pulse',
    name: 'pulse',
    duration: 1000,
    easing: 'ease-in-out',
    stops: stops('p', [
      [['transform', 'scale(1)'], ['opacity', '1']],
      [['transform', 'scale(1.05)'], ['opacity', '0.9']],
      [['transform', 'scale(1.1)'], ['opacity', '0.8']],
      [['transform', 'scale(1.05)'], ['opacity', '0.9']],
      [['transform', 'scale(1)'], ['opacity', '1']],
    ]),
  },
  {
    id: 'spin',
    name: 'spin',
    duration: 800,
    easing: 'linear',
    stops: stops('sp', [
      [['transform', 'rotate(0deg)']],
      [['transform', 'rotate(90deg)']],
      [['transform', 'rotate(180deg)']],
      [['transform', 'rotate(270deg)']],
      [['transform', 'rotate(360deg)']],
    ]),
  },
  {
    id: 'shake',
    name: 'shake',
    duration: 500,
    easing: 'ease-in-out',
    stops: stops('sh', [
      [['transform', 'translateX(0)']],
      [['transform', 'translateX(-6px)']],
      [['transform', 'translateX(6px)']],
      [['transform', 'translateX(-3px)']],
      [['transform', 'translateX(0)']],
    ]),
  },
];

export function toCss(a: AnimationDef): string {
  const body = a.stops
    .map(
      (s) =>
        `  ${s.pct}% { ${s.props.map((p) => `${p.name}: ${p.value};`).join(' ')} }`,
    )
    .join('\n');
  return `@keyframes ${a.name} {\n${body}\n}\n.target {\n  animation: ${a.name} ${a.duration}ms ${a.easing};\n}`;
}
