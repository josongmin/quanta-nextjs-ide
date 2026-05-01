import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Icon, OverlayPanel } from '@shared/ui';
import {
  FILES,
  applyDecision,
  buildResultText,
  type MergeFile,
  type ResolutionDefault,
} from './helpers';
import { Navigator } from './parts/Navigator';
import { ResultPane } from './parts/ResultPane';
import { SidePane } from './parts/SidePane';
import { Toolbar } from './parts/Toolbar';

export type { ConflictRegion, MergeFile, ResolutionDefault } from './helpers';

export function ThreeWayMergeOverlay() {
  const open = useUiStore((s) => s.overlays.threeWayMerge.open);
  const initialFile = useUiStore((s) => s.overlays.threeWayMerge.file);
  const close = useUiStore((s) => s.closeOverlay);

  const [fileName, setFileName] = useState<string>(
    initialFile ?? FILES[0]?.file ?? '',
  );

  const file = useMemo<MergeFile>(
    () => FILES.find((f) => f.file === fileName) ?? FILES[0]!,
    [fileName],
  );

  const [decisions, setDecisions] = useState<Record<string, ResolutionDefault>>(
    () => Object.fromEntries(file.regions.map((r) => [r.id, r.resolutionDefault])),
  );
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [resultText, setResultText] = useState<string>(() =>
    buildResultText(file, {}, {}),
  );
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  useEffect(() => {
    const initialDecisions = Object.fromEntries(
      file.regions.map((r) => [r.id, r.resolutionDefault]),
    );
    setDecisions(initialDecisions);
    setResolved({});
    setResultText(buildResultText(file, {}, {}));
    setActiveRegion(null);
  }, [file]);

  const fileOptions = useMemo(
    () =>
      FILES.map((f) => ({
        value: f.file,
        label: `${f.file} · ${f.regions.length}`,
      })),
    [],
  );

  const total = file.regions.length;
  const resolvedCount = file.regions.filter((r) => resolved[r.id]).length;
  const progressPct = total === 0 ? 0 : (resolvedCount / total) * 100;

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function registerRow(regionId: string, el: HTMLDivElement | null) {
    rowRefs.current[regionId] = el;
  }

  function focusRegion(regionId: string) {
    setActiveRegion(regionId);
    const el = rowRefs.current[regionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function applyKeep(regionId: string, side: 'local' | 'incoming') {
    const region = file.regions.find((r) => r.id === regionId);
    if (!region) return;
    setDecisions((prev) => ({ ...prev, [regionId]: side }));
    setResolved((prev) => ({ ...prev, [regionId]: true }));
    const next = buildResultText(file, { ...decisions, [regionId]: side }, {});
    setResultText(next);
    toast(`Kept ${side} for ${regionId}`);
  }

  function acceptAll(side: 'local' | 'incoming') {
    const next: Record<string, ResolutionDefault> = {};
    const resolvedNext: Record<string, boolean> = {};
    for (const r of file.regions) {
      next[r.id] = side;
      resolvedNext[r.id] = true;
    }
    setDecisions(next);
    setResolved(resolvedNext);
    setResultText(buildResultText(file, next, {}));
    toast(`Accepted all ${side === 'local' ? 'local' : 'incoming'}`, {
      description: `${file.regions.length} regions`,
    });
  }

  function autoMergeNonOverlapping() {
    const next: Record<string, ResolutionDefault> = { ...decisions };
    const resolvedNext: Record<string, boolean> = { ...resolved };
    let count = 0;
    for (const r of file.regions) {
      if (r.resolutionDefault === 'both') {
        next[r.id] = 'both';
        resolvedNext[r.id] = true;
        count += 1;
      }
    }
    setDecisions(next);
    setResolved(resolvedNext);
    setResultText(buildResultText(file, next, {}));
    toast(`Auto-merged ${count} non-overlapping region${count === 1 ? '' : 's'}`);
  }

  function markResolved(regionId: string) {
    setResolved((prev) => ({ ...prev, [regionId]: !prev[regionId] }));
    toast(resolved[regionId] ? 'Marked unresolved' : 'Marked resolved', {
      description: regionId,
    });
  }

  function applyMerge() {
    if (resolvedCount < total) {
      toast.error('Resolve all conflicts before applying');
      return;
    }
    toast.success('Merge applied (mock)', {
      description: `${file.file} · ${total} regions`,
    });
  }

  function abort() {
    toast('Merge aborted', { description: 'Working tree restored.' });
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('threeWayMerge')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Branch className="h-4 w-4 text-ink-3" />
          <span>Three-Way Merge</span>
        </span>
      }
      subtitle="local · base · incoming · result"
      size="full"
      footer={
        <>
          <div className="mr-auto flex items-center gap-2">
            <span className="text-[11px] text-ink-3">
              {resolvedCount}/{total} resolved
            </span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <Button size="sm" tone="ghost" onClick={abort}>
            Abort
          </Button>
          <Button
            size="sm"
            tone={resolvedCount === total ? 'accent' : 'soft'}
            onClick={applyMerge}
          >
            Apply merge
          </Button>
        </>
      }
    >
      <Toolbar
        fileName={fileName}
        onFileNameChange={setFileName}
        fileOptions={fileOptions}
        total={total}
        onAcceptAllLocal={() => acceptAll('local')}
        onAcceptAllIncoming={() => acceptAll('incoming')}
        onAutoMerge={autoMergeNonOverlapping}
      />

      <div className="grid grid-cols-[300px_300px_300px_1fr_240px] divide-x divide-line">
        <div className="min-w-0 p-2">
          <SidePane
            title="Local (yours)"
            tone="local"
            file={file}
            regions={file.regions}
            onKeep={(id) => applyKeep(id, 'local')}
            activeRegionId={activeRegion}
            registerRow={registerRow}
          />
        </div>
        <div className="min-w-0 p-2">
          <SidePane
            title="Base"
            tone="base"
            file={file}
            regions={file.regions}
            activeRegionId={activeRegion}
          />
        </div>
        <div className="min-w-0 p-2">
          <SidePane
            title="Incoming"
            tone="incoming"
            file={file}
            regions={file.regions}
            onKeep={(id) => applyKeep(id, 'incoming')}
            activeRegionId={activeRegion}
          />
        </div>

        <ResultPane
          resultText={resultText}
          onResultTextChange={setResultText}
          onRegenerate={() => {
            setResultText(buildResultText(file, decisions, {}));
            toast('Result regenerated');
          }}
        />

        <Navigator
          regions={file.regions}
          resolved={resolved}
          decisions={decisions}
          activeRegion={activeRegion}
          onFocusRegion={focusRegion}
          onMarkResolved={markResolved}
        />
      </div>
    </OverlayPanel>
  );
}

export { applyDecision };
