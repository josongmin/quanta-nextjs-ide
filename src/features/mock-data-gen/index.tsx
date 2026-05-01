import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  PRISMA_OPTIONS,
  TYPE_OPTIONS,
  ZOD_OPTIONS,
  formatJson,
  generateFromPrisma,
  generateFromRoute,
  generateFromType,
  generateFromZod,
  type Source,
} from './helpers';

const SOURCES: ReadonlyArray<{ id: Source; label: string }> = [
  { id: 'type', label: 'TS type' },
  { id: 'zod', label: 'Zod schema' },
  { id: 'prisma', label: 'Prisma model' },
  { id: 'route', label: 'Route params' },
];

export function MockDataGenOverlay() {
  const open = useUiStore((s) => s.overlays.mockDataGen.open);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [source, setSource] = useState<Source>('type');
  const [pickId, setPickId] = useState('User');
  const [count, setCount] = useState(5);
  const [seed, setSeed] = useState('default');

  const opts = match(source)
    .with('type', () => TYPE_OPTIONS)
    .with('zod', () => ZOD_OPTIONS)
    .with('prisma', () => PRISMA_OPTIONS)
    .with('route', () => routes.map((r) => ({ id: r.id, label: r.path })))
    .exhaustive();

  // Reset pickId when source changes (or on first mount)
  if (!opts.some((o) => o.id === pickId)) {
    setPickId(opts[0]?.id ?? '');
  }

  const generated = useMemo(() => {
    const c = Math.max(1, Math.min(1000, count));
    const fn = match(source)
      .with('type', () => generateFromType(pickId, c, seed))
      .with('zod', () => generateFromZod(pickId, c, seed))
      .with('prisma', () => generateFromPrisma(pickId, c, seed))
      .with('route', () => generateFromRoute(pickId, c, seed))
      .exhaustive();
    return fn;
  }, [source, pickId, count, seed]);

  const json = useMemo(() => formatJson(generated), [generated]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('mockDataGen'))}
      title="Mock Data Generator"
      subtitle={`from ${source} · ${pickId || '—'} · ${count} item${count === 1 ? '' : 's'}`}
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Save to fixtures (preview)')}>
            Save to file
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Insert into test (preview)')}>
            Insert into test
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => {
              navigator.clipboard
                ?.writeText(json)
                .then(() => toast('JSON copied to clipboard'))
                .catch(() => toast('Clipboard unavailable'));
            }}
          >
            <Icon.Doc className="h-3 w-3" />
            Copy JSON
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Source</span>
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              aria-selected={source === s.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                source === s.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          value={pickId}
          onChange={(e) => setPickId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {opts.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[10px] text-ink-3">
          count
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
            className="w-16 rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-ink-3">
          seed
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-24 rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
          />
        </label>
        <Chip tone="muted" size="xs" className="ml-auto">
          {(json.length / 1024).toFixed(1)} KB
        </Chip>
      </div>

      <div className="grid grid-cols-2">
        <div className="hairline-r p-4">
          <div className="mb-2 text-caps text-ink-3">Source</div>
          <pre className="overflow-x-auto rounded-sm border border-line bg-bg-subtle p-3 font-mono text-[11px] leading-relaxed text-ink-1">
            <code>{describeSchema(source, pickId)}</code>
          </pre>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between text-caps text-ink-3">
            <span>Generated · JSON</span>
            <span className="text-[10px]">
              {Array.isArray(generated) ? generated.length : 0} items
            </span>
          </div>
          <pre className="max-h-[420px] overflow-y-auto rounded-sm border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink-1">
            <code>{json}</code>
          </pre>
        </div>
      </div>
    </OverlayPanel>
  );
}

function describeSchema(source: Source, id: string): string {
  return match(source)
    .with('type', () => {
      if (id === 'User')
        return `interface User {\n  id: string\n  email: string\n  name: string\n  createdAt: string\n}`;
      if (id === 'Product')
        return `interface Product {\n  id: string\n  name: string\n  price: number\n  stock: number\n  slug: string\n}`;
      if (id === 'Order')
        return `interface Order {\n  id: string\n  userId: string\n  total: number\n  items: Array<{ productId: string; quantity: number }>\n}`;
      if (id === 'Review')
        return `interface Review {\n  id: string\n  productId: string\n  rating: 1 | 2 | 3 | 4 | 5\n  body: string\n}`;
      return `// type ${id}`;
    })
    .with('zod', () => `import { z } from 'zod'\n\nexport const ${id} = z.object({\n  // ...\n})`)
    .with('prisma', () => `model ${id} {\n  id   String  @id @default(cuid())\n  // ...\n}`)
    .with('route', () => `// route ${id}\ntype Params = { id: string }\ntype Search = { page?: number; sort?: 'price'|'rating' }`)
    .exhaustive();
}
