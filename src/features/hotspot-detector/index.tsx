import { useMemo } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useCodeGraphStore } from '@entities/code-graph';
import { useDiagnosticStore } from '@entities/diagnostic';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { computeHeatScores, heatBand, type HeatedFile } from './score';
import { useHotspotStore } from './store';
import { Heatmap } from './heatmap';

const IMPORT_RE = /import\s+[^'"]*from\s+["']([^"']+)["']/g;

const SAMPLE_TESTS_BY_FILE: Record<string, number> = {
  'app/page.tsx': 2,
  'app/layout.tsx': 1,
};

const SAMPLE_CHURN: Record<string, number> = {
  'app/page.tsx': 14,
  'app/layout.tsx': 6,
};

const tabId = (file: string): string => `hotspot-${file}`;
const shortName = (file: string): string => {
  const segs = file.split('/');
  return segs[segs.length - 1] ?? file;
};

const BAND_TONE: Record<ReturnType<typeof heatBand>, 'static' | 'info' | 'warn' | 'err'> = {
  cool: 'static',
  warm: 'info',
  hot: 'warn',
  fire: 'err',
};

const BAND_LABEL: Record<ReturnType<typeof heatBand>, string> = {
  cool: 'cool',
  warm: 'warm',
  hot: 'hot',
  fire: 'fire',
};

function fileBasenameOnly(p: string): string {
  return p.replace(/\.(tsx|ts|jsx|js)$/, '');
}

export function HotspotDetectorOverlay() {
  const open = useUiStore((s) => s.overlays.hotspotDetector.open);
  const close = useUiStore((s) => s.closeOverlay);
  const view = useHotspotStore((s) => s.view);
  const setView = useHotspotStore((s) => s.setView);
  const filter = useHotspotStore((s) => s.filter);
  const setFilter = useHotspotStore((s) => s.setFilter);
  const selected = useHotspotStore((s) => s.selectedFile);
  const setSelected = useHotspotStore((s) => s.setSelected);
  const gitConnected = useHotspotStore((s) => s.gitConnected);
  const setGitConnected = useHotspotStore((s) => s.setGitConnected);

  const files = useCodeGraphStore((s) => s.files);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const openTab = useEditorStore((s) => s.openTab);

  const heated = useMemo<HeatedFile[]>(() => {
    // LOC + fan-in/out from source.
    const fanOut = new Map<string, number>();
    const fanIn = new Map<string, number>();
    const inputs: Array<{ file: string; loc: number }> = [];
    const fileSet = new Set(files.map((f) => f.file));

    for (const f of files) {
      const loc = f.source.split(/\r?\n/).length;
      inputs.push({ file: f.file, loc });
      let fo = 0;
      const re = new RegExp(IMPORT_RE.source, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(f.source)) !== null) {
        const target = m[1]!;
        if (!target.startsWith('.') && !target.startsWith('@/')) continue;
        fo += 1;
        // Best-effort fan-in: try to suffix-match against known file names.
        for (const candidate of fileSet) {
          if (candidate === f.file) continue;
          if (
            candidate.endsWith(target.replace(/^\.\//, '')) ||
            fileBasenameOnly(candidate).endsWith(target.replace(/^\.\//, ''))
          ) {
            fanIn.set(candidate, (fanIn.get(candidate) ?? 0) + 1);
            break;
          }
        }
      }
      fanOut.set(f.file, fo);
    }

    const diagCounts = new Map<string, number>();
    for (const d of diagnostics) {
      diagCounts.set(d.location.file, (diagCounts.get(d.location.file) ?? 0) + 1);
    }
    const testCounts = new Map<string, number>(
      Object.entries(SAMPLE_TESTS_BY_FILE),
    );
    const churnCounts = gitConnected
      ? new Map<string, number>(Object.entries(SAMPLE_CHURN))
      : undefined;

    return computeHeatScores({
      files: inputs,
      diagnosticCounts: diagCounts,
      fanIn,
      fanOut,
      testCounts,
      ...(churnCounts ? { churnCounts } : {}),
    });
  }, [files, diagnostics, gitConnected]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return heated;
    return heated.filter((h) => h.file.toLowerCase().includes(q));
  }, [heated, filter]);

  const selectedHeat = useMemo(
    () => filtered.find((h) => h.file === selected) ?? null,
    [filtered, selected],
  );

  const counts = useMemo(() => {
    let fire = 0;
    let hot = 0;
    let warm = 0;
    let cool = 0;
    for (const h of heated) {
      const b = heatBand(h.score);
      if (b === 'fire') fire += 1;
      else if (b === 'hot') hot += 1;
      else if (b === 'warm') warm += 1;
      else cool += 1;
    }
    return { fire, hot, warm, cool };
  }, [heated]);

  const handleJump = (file: string) => {
    openTab({ id: tabId(file), file, label: shortName(file) });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('hotspotDetector'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Zap className="h-4 w-4 text-sev-warn" />
          <span>Hotspot Detector</span>
        </span>
      }
      subtitle="risk × centrality × complexity · per-file heatmap"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <Chip tone="err" size="xs">
            fire {counts.fire}
          </Chip>
          <Chip tone="warn" size="xs">
            hot {counts.hot}
          </Chip>
          <Chip tone="info" size="xs">
            warm {counts.warm}
          </Chip>
          <Chip tone="static" size="xs">
            cool {counts.cool}
          </Chip>
          <span className="ml-auto flex items-center gap-2">
            {gitConnected ? (
              <Chip tone="static" size="xs">
                git: connected
              </Chip>
            ) : (
              <Button
                size="xs"
                tone="ghost"
                onClick={() => {
                  setGitConnected(true);
                  toast('Connected (mock) — churn factored into score');
                }}
              >
                Connect git for churn
              </Button>
            )}
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <div className="w-44">
          <SearchInput value={filter} onChange={setFilter} placeholder="filter files" />
        </div>
        <div className="ml-1 flex items-center gap-1">
          <ToggleChip active={view === 'treemap'} onClick={() => setView('treemap')}>
            treemap
          </ToggleChip>
          <ToggleChip active={view === 'list'} onClick={() => setView('list')}>
            list
          </ToggleChip>
        </div>
        <span className="ml-auto text-[11px] text-ink-3">
          {filtered.length} files
        </span>
      </div>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="bg-bg p-2">
          {view === 'treemap' ? (
            <Heatmap
              items={filtered}
              width={620}
              height={420}
              selected={selected}
              onSelect={(f) =>
                setSelected(selected === f ? null : f)
              }
            />
          ) : (
            <ul className="max-h-[440px] overflow-y-auto">
              {filtered.map((h) => {
                const band = heatBand(h.score);
                const tone = BAND_TONE[band];
                const isSelected = selected === h.file;
                return (
                  <li key={h.file}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(isSelected ? null : h.file)
                      }
                      onDoubleClick={() => handleJump(h.file)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1 text-left font-mono text-[11px] hover:bg-bg-hover',
                        isSelected && 'bg-bg-hover',
                      )}
                    >
                      <span className="w-12 shrink-0 text-right text-ink-3">
                        {(h.score * 100).toFixed(0)}%
                      </span>
                      <span
                        className={cn(
                          'inline-block h-2 shrink-0 rounded-sm',
                          tone === 'err' && 'bg-sev-err',
                          tone === 'warn' && 'bg-sev-warn',
                          tone === 'info' && 'bg-sev-info',
                          tone === 'static' && 'bg-sem-static',
                        )}
                        style={{ width: `${Math.max(4, h.score * 80)}px` }}
                      />
                      <span className="flex-1 truncate text-ink-1">
                        {h.file}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink-3">
                        {h.raw.diagnosticCount}d · {h.raw.fanIn + h.raw.fanOut}c · {h.raw.loc}L
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DetailsPane
          heated={selectedHeat}
          onJump={handleJump}
        />
      </div>
    </OverlayPanel>
  );
}

function DetailsPane({
  heated,
  onJump,
}: {
  heated: HeatedFile | null;
  onJump(file: string): void;
}) {
  if (!heated) {
    return (
      <div className="p-4 text-[11px] text-ink-3">
        Click a tile or row to see its heat breakdown.
      </div>
    );
  }
  const band = heatBand(heated.score);
  const factors = [
    { key: 'diagnostics', label: 'diagnostics', value: heated.factors.diagnostics, raw: `${heated.raw.diagnosticCount}` },
    { key: 'centrality', label: 'centrality', value: heated.factors.centrality, raw: `fan-in ${heated.raw.fanIn} · fan-out ${heated.raw.fanOut}` },
    { key: 'complexity', label: 'complexity', value: heated.factors.complexity, raw: `${heated.raw.loc} LOC` },
    { key: 'coverageGap', label: 'coverage gap', value: heated.factors.coverageGap, raw: `${heated.raw.testCount} tests` },
    { key: 'churn', label: 'churn', value: heated.factors.churn, raw: heated.raw.churn > 0 ? `${heated.raw.churn} commits` : 'no git' },
  ];
  const tone = BAND_TONE[band];
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Chip tone={tone} size="sm">
          {BAND_LABEL[band]}
        </Chip>
        <span className="font-mono text-[12px] text-ink-1">
          {(heated.score * 100).toFixed(0)}%
        </span>
        <Button
          size="xs"
          tone="ghost"
          className="ml-auto"
          onClick={() => onJump(heated.file)}
        >
          Open
        </Button>
      </div>
      <div className="break-all font-mono text-[11px] text-ink-2">
        {heated.file}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-caps text-ink-3">factors</div>
        {factors.map((f) => (
          <div key={f.key} className="text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-2">{f.label}</span>
              <span className="font-mono text-ink-3">
                +{(f.value * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-0.5 h-1 rounded-sm bg-bg-subtle">
              <div
                className={cn(
                  'h-1 rounded-sm',
                  f.key === 'diagnostics' && 'bg-sev-err',
                  f.key === 'centrality' && 'bg-sev-info',
                  f.key === 'complexity' && 'bg-sem-server',
                  f.key === 'coverageGap' && 'bg-sev-warn',
                  f.key === 'churn' && 'bg-sem-isr',
                )}
                style={{ width: `${Math.min(100, f.value * 200)}%` }}
              />
            </div>
            <div className="mt-0.5 text-[10px] text-ink-3">{f.raw}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
