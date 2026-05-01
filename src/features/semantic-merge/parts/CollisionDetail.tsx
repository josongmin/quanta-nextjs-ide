import { Chip, CodeBlock, Icon } from '@shared/ui';
import {
  PRS,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  type Collision,
} from '../helpers';

interface CollisionDetailProps {
  collision: Collision;
}

export function CollisionDetail({ collision }: CollisionDetailProps) {
  const a = PRS.find((p) => p.id === collision.prA);
  const b = PRS.find((p) => p.id === collision.prB);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Chip tone={SEVERITY_TONE[collision.severity]} size="xs">
          {SEVERITY_LABEL[collision.severity]}
        </Chip>
        <span className="font-mono text-[10px] text-ink-3">{collision.file}</span>
      </div>
      <div className="rounded-sm border border-line bg-bg-subtle/40 p-2 text-[11px] leading-snug text-ink-1">
        {collision.description}
      </div>

      <section>
        <header className="mb-1 flex items-center gap-2 text-caps text-ink-3">
          <span>#{a?.number ?? '?'}</span>
          <span className="font-mono text-[10px] text-ink-3">{a?.branch}</span>
        </header>
        <CodeBlock
          code={collision.hunkA.diffBefore}
          language="ts"
          showLineNumbers={false}
          diff="before"
          maxHeight={120}
        />
        <CodeBlock
          code={collision.hunkA.diffAfter}
          language="ts"
          showLineNumbers={false}
          diff="after"
          maxHeight={120}
          className="mt-1"
        />
      </section>

      <section>
        <header className="mb-1 flex items-center gap-2 text-caps text-ink-3">
          <span>#{b?.number ?? '?'}</span>
          <span className="font-mono text-[10px] text-ink-3">{b?.branch}</span>
        </header>
        <CodeBlock
          code={collision.hunkB.diffBefore}
          language="ts"
          showLineNumbers={false}
          diff="before"
          maxHeight={120}
        />
        <CodeBlock
          code={collision.hunkB.diffAfter}
          language="ts"
          showLineNumbers={false}
          diff="after"
          maxHeight={120}
          className="mt-1"
        />
      </section>

      <section className="rounded-sm border border-line bg-bg p-2">
        <header className="mb-1 text-caps text-ink-3">Interpretation</header>
        <p className="text-[11px] leading-snug text-ink-1">
          {collision.interpretation}
        </p>
      </section>

      <section className="rounded-sm border border-line bg-accent-soft/40 p-2">
        <header className="mb-1 flex items-center gap-1 text-caps text-accent">
          <Icon.Bulb className="h-3 w-3" /> Suggested merge
        </header>
        <p className="text-[11px] leading-snug text-ink-1">
          {collision.suggestedResolver}
        </p>
      </section>
    </div>
  );
}
