import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useBoundaryStore } from '@entities/boundary';
import { Button, Chip, Inspector, Section } from '@shared/ui';
import { EmptyState, KvRow, StateIcon } from '../parts';

interface Props {
  islandId: string;
}

interface OptimalIsland {
  name: string;
  reason: string;
}

interface BoundaryImport {
  file: string;
  status: 'safe' | 'leak';
  note: string;
}

const OPTIMAL_ISLANDS: OptimalIsland[] = [
  { name: 'SearchBox', reason: 'useState, onChange handler' },
  { name: 'UserMenu', reason: 'useRouter, click handlers' },
  { name: 'ThemeToggle', reason: 'useEffect (localStorage / matchMedia)' },
];

const BOUNDARY_IMPORTS: BoundaryImport[] = [
  { file: 'lib/format-date.ts', status: 'safe', note: 'pure utility' },
  { file: 'lib/url.ts', status: 'safe', note: 'string helpers' },
  {
    file: 'lib/auth.ts',
    status: 'leak',
    note: 'server-only — uses cookies()',
  },
  {
    file: 'lib/db.ts',
    status: 'leak',
    note: 'server-only — direct DB driver',
  },
];

export function BoundaryInspector({ islandId }: Props) {
  const island = useBoundaryStore((s) =>
    s.islands.find((i) => i.id === islandId),
  );
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const openOverlay = useUiStore((s) => s.openOverlay);

  if (!island) {
    return (
      <Inspector
        title="CLIENT BOUNDARY"
        meta={islandId}
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>Island not found.</EmptyState>
      </Inspector>
    );
  }

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">
            CLIENT BOUNDARY
          </span>
          <span className="font-mono text-sm text-ink-1">{island.file}</span>
          <Chip tone="client" size="xs">
            {island.name}
          </Chip>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          <span className="text-ink-3">island</span>
          <span className="mx-1 text-ink-3">·</span>
          <span className="text-ink-2">{island.estimatedKb}KB est.</span>
          {island.isRoot ? (
            <>
              <span className="mx-1 text-ink-3">·</span>
              <span className="text-sev-warn">root</span>
            </>
          ) : null}
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Reason -------------------------------------------------------- */}
      <Section title="Reason" defaultOpen>
        {island.reasons.length === 0 ? (
          <EmptyState>No reasons recorded.</EmptyState>
        ) : (
          <ul className="space-y-0.5 text-xs">
            {island.reasons.map((reason, i) => (
              <li key={`${reason}-${i}`} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-ink-3" aria-hidden />
                <span className="font-mono text-ink-2">{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Blast --------------------------------------------------------- */}
      <Section title="Blast" defaultOpen>
        <div className="space-y-0">
          <KvRow label="Files">
            <span className="font-mono text-xs text-ink-2">
              {island.affectedRouteIds.length} files in boundary
            </span>
          </KvRow>
          <KvRow label="Size">
            <span className="font-mono text-xs text-ink-2">
              ~{island.estimatedKb}KB estimated
            </span>
          </KvRow>
          {island.excessive ? (
            <KvRow label="Status">
              <span className="inline-flex items-center gap-1.5 text-xs text-sev-warn">
                <StateIcon state="warn" />
                <span>excessive — consider splitting</span>
              </span>
            </KvRow>
          ) : null}
        </div>
      </Section>

      {/* Optimal islands ---------------------------------------------- */}
      <Section title="Optimal islands (3)" defaultOpen>
        <div className="space-y-0">
          {OPTIMAL_ISLANDS.map((opt) => (
            <div
              key={opt.name}
              className="grid min-h-[28px] grid-cols-[120px_1fr] items-center gap-2 py-0.5 text-xs"
            >
              <span className="font-mono text-ink-2">{opt.name}</span>
              <span className="truncate font-mono text-ink-3">{opt.reason}</span>
            </div>
          ))}
          <div className="pt-2">
            <Button
              size="xs"
              tone="accent"
              onClick={() =>
                openOverlay('blastRadius', { sourceFile: island.file })
              }
            >
              Preview refactor
            </Button>
          </div>
        </div>
      </Section>

      {/* Imports brought into client ---------------------------------- */}
      <Section
        title="Imports brought into client"
        defaultOpen={false}
      >
        <div className="space-y-0">
          {BOUNDARY_IMPORTS.map((imp) => (
            <div
              key={imp.file}
              className="grid min-h-[28px] grid-cols-[1fr_auto] items-center gap-2 py-0.5 text-xs"
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                {imp.status === 'leak' ? (
                  <StateIcon state="warn" />
                ) : (
                  <StateIcon state="ok" />
                )}
                <span className="truncate font-mono text-ink-2">{imp.file}</span>
              </span>
              <span
                className={
                  imp.status === 'leak'
                    ? 'text-sev-warn'
                    : 'text-sem-static'
                }
              >
                {imp.status === 'leak' ? (
                  <Chip tone="warn" size="xs">
                    server-only — leak?
                  </Chip>
                ) : (
                  <Chip tone="muted" size="xs">
                    server-safe
                  </Chip>
                )}
              </span>
            </div>
          ))}
          <div className="pt-1">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Run server-only leak audit (preview)')}
            >
              Run leak audit
            </Button>
          </div>
        </div>
      </Section>
    </Inspector>
  );
}
