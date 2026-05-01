export type RefactorKind =
  | 'extract'
  | 'rsc'
  | 'split'
  | 'memo'
  | 'dead-branch'
  | 'derived';

export type RefactorRisk = 'safe' | 'review' | 'risky';

export interface RefactorSuggestion {
  id: string;
  title: string;
  reason: string;
  confidence: number;
  kind: RefactorKind;
  risk: RefactorRisk;
  beforeSnippet: string;
  afterSnippet: string;
  language: string;
  file: string;
}

const fmt = (s: string): string => s.replace(/^\n/, '').replace(/\n$/, '');

export const KIND_LABEL: Record<RefactorKind, string> = {
  extract: 'Extract',
  rsc: 'Convert RSC',
  split: 'Split',
  memo: 'Memoize',
  'dead-branch': 'Dead branch',
  derived: 'Derive state',
};

export const KIND_TONE: Record<
  RefactorKind,
  'accent' | 'info' | 'static' | 'hint' | 'warn' | 'neutral'
> = {
  extract: 'accent',
  rsc: 'static',
  split: 'info',
  memo: 'hint',
  'dead-branch': 'warn',
  derived: 'neutral',
};

export const RISK_TONE: Record<RefactorRisk, 'static' | 'warn' | 'err'> = {
  safe: 'static',
  review: 'warn',
  risky: 'err',
};

export const REFACTORS: ReadonlyArray<RefactorSuggestion> = [
  {
    id: 'r-1',
    title: 'Extract conditional into helper',
    reason:
      'The nested ternary in render() obscures intent and is reused in two places.',
    confidence: 86,
    kind: 'extract',
    risk: 'safe',
    file: 'src/features/route-row/index.tsx',
    language: 'tsx',
    beforeSnippet: fmt(`
return (
  <span className={
    sizeKb > 200 ? 'text-sev-err' :
    sizeKb > 100 ? 'text-sev-warn' :
    'text-ink-2'
  }>
    {sizeKb.toFixed(1)} kB
  </span>
);
`),
    afterSnippet: fmt(`
function sizeTone(kb: number) {
  if (kb > 200) return 'text-sev-err';
  if (kb > 100) return 'text-sev-warn';
  return 'text-ink-2';
}

return (
  <span className={sizeTone(sizeKb)}>{sizeKb.toFixed(1)} kB</span>
);
`),
  },
  {
    id: 'r-2',
    title: 'Convert to React Server Component',
    reason:
      'No state, effects, or browser APIs used. Removing "use client" eliminates a hydration boundary.',
    confidence: 78,
    kind: 'rsc',
    risk: 'review',
    file: 'src/app/(public)/landing/Hero.tsx',
    language: 'tsx',
    beforeSnippet: fmt(`
'use client';
import { Card } from '@shared/ui';

export function Hero({ title, body }: Props) {
  return (
    <Card>
      <h1>{title}</h1>
      <p>{body}</p>
    </Card>
  );
}
`),
    afterSnippet: fmt(`
import { Card } from '@shared/ui';

export function Hero({ title, body }: Props) {
  return (
    <Card>
      <h1>{title}</h1>
      <p>{body}</p>
    </Card>
  );
}
`),
  },
  {
    id: 'r-3',
    title: 'Split component into list + row',
    reason:
      'Component is 220 lines; extracting Row keeps map() readable and stabilizes memo.',
    confidence: 64,
    kind: 'split',
    risk: 'review',
    file: 'src/widgets/route-list/index.tsx',
    language: 'tsx',
    beforeSnippet: fmt(`
export function RouteList({ routes }: Props) {
  return (
    <ul>
      {routes.map((r) => (
        <li key={r.path} className="...">
          {/* 60+ lines of inline row markup */}
        </li>
      ))}
    </ul>
  );
}
`),
    afterSnippet: fmt(`
function RouteRow({ route }: { route: Route }) {
  /* extracted row markup */
}

export function RouteList({ routes }: Props) {
  return (
    <ul>
      {routes.map((r) => (
        <RouteRow key={r.path} route={r} />
      ))}
    </ul>
  );
}
`),
  },
  {
    id: 'r-4',
    title: 'Memoize expensive computation',
    reason:
      'computeRouteCost() runs on every render but only depends on routes and model.',
    confidence: 72,
    kind: 'memo',
    risk: 'safe',
    file: 'src/widgets/cost-summary/index.tsx',
    language: 'tsx',
    beforeSnippet: fmt(`
export function CostSummary({ routes, model }: Props) {
  const total = computeRouteCost(routes, model);
  return <Readout value={total} />;
}
`),
    afterSnippet: fmt(`
export function CostSummary({ routes, model }: Props) {
  const total = useMemo(
    () => computeRouteCost(routes, model),
    [routes, model],
  );
  return <Readout value={total} />;
}
`),
  },
  {
    id: 'r-5',
    title: 'Remove dead branch',
    reason:
      'env.DEV check is unreachable in this build target — TS narrows it to never.',
    confidence: 91,
    kind: 'dead-branch',
    risk: 'safe',
    file: 'src/shared/lib/log.ts',
    language: 'ts',
    beforeSnippet: fmt(`
export function log(msg: string) {
  if (import.meta.env.DEV) {
    console.debug('[dev]', msg);
  } else if (import.meta.env.PROD) {
    sendToBackend(msg);
  } else {
    // unreachable: neither DEV nor PROD
    console.warn('unknown env', msg);
  }
}
`),
    afterSnippet: fmt(`
export function log(msg: string) {
  if (import.meta.env.DEV) {
    console.debug('[dev]', msg);
  } else {
    sendToBackend(msg);
  }
}
`),
  },
  {
    id: 'r-6',
    title: 'Replace useEffect with derived state',
    reason:
      'totalKb is computed from props in an effect — derive it during render to avoid a re-render cycle.',
    confidence: 81,
    kind: 'derived',
    risk: 'risky',
    file: 'src/features/bundle-summary/index.tsx',
    language: 'tsx',
    beforeSnippet: fmt(`
const [totalKb, setTotalKb] = useState(0);
useEffect(() => {
  setTotalKb(routes.reduce((a, r) => a + r.sizeKb, 0));
}, [routes]);
`),
    afterSnippet: fmt(`
const totalKb = useMemo(
  () => routes.reduce((a, r) => a + r.sizeKb, 0),
  [routes],
);
`),
  },
];

export function refactorById(id: string): RefactorSuggestion {
  return REFACTORS.find((r) => r.id === id) ?? REFACTORS[0]!;
}
