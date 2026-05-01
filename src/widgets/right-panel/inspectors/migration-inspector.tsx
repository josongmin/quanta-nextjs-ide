import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDiagnosticStore } from '@entities/diagnostic';
import { Button, Chip, Inspector, Section } from '@shared/ui';
import { KvRow } from '../parts';

export function MigrationInspector() {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);

  const asyncApiCount = diagnostics.filter(
    (d) => d.ruleId === 'async-request-api',
  ).length;

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">
            MIGRATION
          </span>
          <span className="font-mono text-sm text-ink-1">Next 14 → 15</span>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          codemods · config rewrites · cache handler
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Async Request APIs ------------------------------------------- */}
      <Section title="Async Request APIs" defaultOpen>
        <div className="space-y-2">
          <div className="text-xs text-ink-2">
            Found{' '}
            <span className="font-mono text-sev-warn">{asyncApiCount}</span> sync
            usage{asyncApiCount === 1 ? '' : 's'} of{' '}
            <span className="font-mono">cookies / headers / params / searchParams</span>.
          </div>
          <div className="flex flex-wrap gap-1">
            <Chip tone="warn" size="xs">
              <span className="font-mono">cookies()</span>
            </Chip>
            <Chip tone="warn" size="xs">
              <span className="font-mono">headers()</span>
            </Chip>
            <Chip tone="warn" size="xs">
              <span className="font-mono">params</span>
            </Chip>
            <Chip tone="warn" size="xs">
              <span className="font-mono">searchParams</span>
            </Chip>
          </div>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast('Run codemod: async request APIs (preview)')}
          >
            Run codemod (preview)
          </Button>
        </div>
      </Section>

      {/* Server external packages ------------------------------------- */}
      <Section title="Server external packages" defaultOpen>
        <div className="space-y-2">
          <KvRow label="Before" mono>
            <span className="text-sev-warn">
              experimental.serverComponentsExternalPackages
            </span>
          </KvRow>
          <KvRow label="After" mono>
            <span className="text-sem-static">serverExternalPackages</span>
          </KvRow>
          <Button
            size="xs"
            tone="soft"
            onClick={() => toast('Update next.config (preview)')}
          >
            Update next.config
          </Button>
        </div>
      </Section>

      {/* Cache handler ------------------------------------------------- */}
      <Section title="Cache handler" defaultOpen>
        <div className="space-y-2">
          <KvRow label="Before" mono>
            <span className="text-sev-warn">
              experimental.incrementalCacheHandlerPath
            </span>
          </KvRow>
          <KvRow label="After" mono>
            <span className="text-sem-static">cacheHandlers</span>
          </KvRow>
          <Button
            size="xs"
            tone="soft"
            onClick={() => toast('Migrate cache handler config (preview)')}
          >
            Migrate
          </Button>
        </div>
      </Section>
    </Inspector>
  );
}
