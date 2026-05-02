import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  buildResolvedTree,
  exportTrace,
  parseTrace,
  useLastTraceStore,
  type RscChunk,
} from '@entities/rsc-payload';
import type { SourceConfig, SourceKind } from '@shared/rsc-sources';
import { useT } from '@shared/i18n';
import { OverlayPanel } from '@shared/ui';
import { usePayloadStream } from './model/usePayloadStream';
import { useSnapshotsStore } from './model/snapshots.store';
import { useAutoRefetch, type AutoRefetchMode } from './model/useAutoRefetch';
import { BoundaryView } from './ui/BoundaryView';
import { DiffView } from './ui/DiffView';
import { WaterfallView } from './ui/WaterfallView';
import { FooterBar } from './parts/FooterBar';
import { LiveView } from './parts/LiveView';
import { SnapshotsPanel } from './parts/SnapshotsPanel';
import { SourceToolbar } from './parts/SourceToolbar';
import { ViewTabs, type ViewMode } from './parts/ViewTabs';
import {
  buildBatchEntries,
  computeStatusLabel,
  computeStatusTone,
  downloadTraceFile,
  persistUrl,
  readStoredUrl,
} from './helpers';

interface RecordedTrace {
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  totalBytes: number;
  label?: string;
}

export function RscPayloadStepOverlay() {
  const open = useUiStore((s) => s.overlays.rscPayloadStep.open);
  const close = useUiStore((s) => s.closeOverlay);
  const t = useT('rsc');

  const [sourceKind, setSourceKind] = useState<SourceKind>('mock');
  const [url, setUrl] = useState<string>(() => readStoredUrl());
  const [pendingUrl, setPendingUrl] = useState<string>(() => readStoredUrl());
  const [time, setTime] = useState<number>(0);
  const [scrubbing, setScrubbing] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [view, setView] = useState<ViewMode>('live');
  const [autoMode, setAutoMode] = useState<AutoRefetchMode>('off');
  const [recordedTrace, setRecordedTrace] = useState<RecordedTrace | null>(null);
  const [batchEntries, setBatchEntries] = useState<ReadonlyArray<{ url: string }>>([]);

  const snapshots = useSnapshotsStore((s) => s.snapshots);
  const captureSnap = useSnapshotsStore((s) => s.capture);
  const removeSnap = useSnapshotsStore((s) => s.remove);
  const clearSnaps = useSnapshotsStore((s) => s.clear);
  const selectA = useSnapshotsStore((s) => s.selectA);
  const selectB = useSnapshotsStore((s) => s.selectB);
  const selectedAId = useSnapshotsStore((s) => s.selectedAId);
  const selectedBId = useSnapshotsStore((s) => s.selectedBId);

  const snapshotA = useMemo(
    () => snapshots.find((s) => s.id === selectedAId) ?? null,
    [snapshots, selectedAId],
  );
  const snapshotB = useMemo(
    () => snapshots.find((s) => s.id === selectedBId) ?? null,
    [snapshots, selectedBId],
  );

  const config = useMemo<SourceConfig>(() => {
    if (sourceKind === 'mock') return { kind: 'mock', speed: 1 };
    if (sourceKind === 'recorded' && recordedTrace) {
      return { kind: 'recorded', recorded: recordedTrace };
    }
    if (sourceKind === 'batch' && batchEntries.length > 0) {
      return { kind: 'batch', batch: batchEntries };
    }
    return { kind: 'fetch', url };
  }, [sourceKind, url, recordedTrace, batchEntries]);

  const { chunks, occurrences, status, error, totalMs, totalBytes, restart } =
    usePayloadStream(config, open);

  const streamMaxMs = useMemo(() => {
    if (totalMs > 0) return totalMs;
    return chunks.reduce((m, c) => (c.arrivedAtMs > m ? c.arrivedAtMs : m), 0);
  }, [chunks, totalMs]);

  const aggregateBytes = useMemo(() => {
    if (totalBytes > 0) return totalBytes;
    return chunks.reduce((acc, c) => acc + c.sizeBytes, 0);
  }, [chunks, totalBytes]);

  useEffect(() => {
    if (!open || scrubbing) return;
    if (status === 'streaming' || status === 'done') setTime(streamMaxMs);
    else if (status === 'idle' || status === 'error') setTime(0);
  }, [open, status, streamMaxMs, scrubbing]);

  useEffect(() => {
    if (selectedId) return;
    const first = chunks[0];
    if (first) setSelectedId(first.id);
  }, [chunks, selectedId]);

  useEffect(() => {
    setSelectedId('');
    setScrubbing(false);
  }, [sourceKind, url]);

  useAutoRefetch(autoMode, restart, open && sourceKind === 'fetch', 5000);

  const lastCapturedKey = useRef<string>('');
  const pendingBatchRef = useRef(false);
  const pendingImportRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleChunks = useMemo(
    () => chunks.filter((c) => c.arrivedAtMs <= time + 0.5),
    [chunks, time],
  );
  const selectedChunk = useMemo(
    () => chunks.find((c) => c.id === selectedId) ?? chunks[0] ?? null,
    [chunks, selectedId],
  );
  const tree = useMemo(() => buildResolvedTree(chunks, time + 0.5), [chunks, time]);

  const handleCapture = (auto = false) => {
    if (chunks.length === 0) {
      if (!auto) toast.error('No chunks to capture yet');
      return;
    }
    const sourceUrl = sourceKind === 'mock' ? '(mock)' : url;
    const snap = captureSnap({
      url: sourceUrl,
      chunks,
      totalMs: streamMaxMs,
      totalBytes: aggregateBytes,
      label: auto ? `auto · ${new Date().toLocaleTimeString()}` : undefined,
    });
    if (!auto) toast(`Captured ${snap.label}`);
  };

  const handleExportTrace = () => {
    if (chunks.length === 0) {
      toast.error('Nothing to export — fetch a route first');
      return;
    }
    const trace = exportTrace({
      url: sourceKind === 'mock' ? '(mock)' : url,
      chunks,
      totalMs: streamMaxMs,
      totalBytes: aggregateBytes,
    });
    downloadTraceFile(trace, sourceKind === 'mock' ? 'mock' : url);
    toast(`Exported ${chunks.length} chunks`);
  };

  const handleBatchCapture = () => {
    const raw = window.prompt(
      'Paste comma-separated routes (e.g. /, /static, /island, /products/walnut-table)',
      '/, /static, /island, /suspense, /action, /products/walnut-table',
    );
    if (!raw) return;
    const entries = buildBatchEntries(raw);
    if (entries.length === 0) {
      toast.error('No routes provided');
      return;
    }
    pendingBatchRef.current = true;
    setBatchEntries(entries);
    toast(`Batching ${entries.length} routes`);
  };

  const handleImportTrace = (file: File) => {
    void file.text().then((text) => {
      const result = parseTrace(text);
      if (!result.ok || !result.trace) {
        toast.error(`Import failed: ${result.error ?? 'unknown'}`);
        return;
      }
      pendingImportRef.current = true;
      setRecordedTrace({
        chunks: result.trace.chunks,
        totalMs: result.trace.totalMs,
        totalBytes: result.trace.totalBytes,
        label: `imported · ${result.trace.url}`,
      });
      toast(`Imported ${result.trace.chunks.length} chunks`);
    });
  };

  useEffect(() => {
    if (!pendingBatchRef.current || batchEntries.length === 0) return;
    pendingBatchRef.current = false;
    setSourceKind('batch');
    restart();
  }, [batchEntries, restart]);

  useEffect(() => {
    if (!pendingImportRef.current || !recordedTrace) return;
    pendingImportRef.current = false;
    setSourceKind('recorded');
    restart();
  }, [recordedTrace, restart]);

  const setLastTrace = useLastTraceStore((s) => s.set);
  useEffect(() => {
    if (status !== 'done' || chunks.length === 0) return;
    setLastTrace({
      url: sourceKind === 'mock' ? '(mock)' : url,
      chunks,
      totalMs: streamMaxMs,
      totalBytes: aggregateBytes,
    });
  }, [status, chunks, sourceKind, url, streamMaxMs, aggregateBytes, setLastTrace]);

  useEffect(() => {
    if (status !== 'done') return;
    if (autoMode === 'off' || sourceKind !== 'fetch') return;
    const key = `${url}|${chunks.length}|${Math.round(streamMaxMs)}|${aggregateBytes}`;
    if (lastCapturedKey.current === key) return;
    lastCapturedKey.current = key;
    handleCapture(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, autoMode, sourceKind, url, chunks.length, streamMaxMs, aggregateBytes]);

  const handleFetch = () => {
    const trimmed = pendingUrl.trim();
    if (!trimmed) {
      toast.error('Enter a URL');
      return;
    }
    persistUrl(trimmed);
    setUrl(trimmed);
    setSourceKind('fetch');
    restart();
  };

  const handleSourceToggle = (next: SourceKind) => {
    if (next === sourceKind) restart();
    else setSourceKind(next);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('rscPayloadStep')}
      title={t('title')}
      subtitle={t('subtitle')}
      size="xl"
      footer={
        <FooterBar
          chunks={chunks}
          visibleChunks={visibleChunks}
          streamMaxMs={streamMaxMs}
          aggregateBytes={aggregateBytes}
          statusLabel={computeStatusLabel(status)}
          statusTone={computeStatusTone(status)}
          snapshots={snapshots}
          onCapture={() => handleCapture(false)}
          onReplay={() => {
            setTime(0);
            setScrubbing(false);
            restart();
            toast(sourceKind === 'mock' ? 'Replay mock' : 'Re-fetch');
          }}
          onBatch={handleBatchCapture}
          onExport={handleExportTrace}
          onImportClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onImportFile={handleImportTrace}
        />
      }
    >
      <SourceToolbar
        sourceKind={sourceKind}
        pendingUrl={pendingUrl}
        onPendingUrlChange={setPendingUrl}
        onFetch={handleFetch}
        onSourceToggle={handleSourceToggle}
        error={error}
        autoMode={autoMode}
        onAutoModeChange={setAutoMode}
      />
      <ViewTabs
        view={view}
        onViewChange={setView}
        snapshots={snapshots}
        snapshotA={snapshotA}
        snapshotB={snapshotB}
        chunks={chunks}
        onClearSnapshots={() => {
          clearSnaps();
          toast('Cleared snapshots');
        }}
      />
      {view === 'waterfall' ? (
        <WaterfallView
          chunks={chunks}
          totalMs={streamMaxMs}
          occurrences={occurrences}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      ) : null}
      {view === 'boundary' ? (
        <BoundaryView chunks={chunks} totalMs={streamMaxMs} onSelect={setSelectedId} />
      ) : null}
      {view === 'snapshots' ? (
        <SnapshotsPanel
          snapshots={snapshots}
          selectedAId={selectedAId}
          selectedBId={selectedBId}
          onSelectA={selectA}
          onSelectB={selectB}
          onRemove={removeSnap}
          onOpenDiff={() => setView('diff')}
        />
      ) : null}
      {view === 'diff' && snapshotA && snapshotB ? (
        <DiffView before={snapshotA} after={snapshotB} />
      ) : view === 'diff' ? (
        <div className="flex h-[460px] items-center justify-center text-xs text-ink-3">
          Select A and B snapshots in the Snapshots tab to compare
        </div>
      ) : null}
      {view === 'live' ? (
        <LiveView
          chunks={chunks}
          visibleChunks={visibleChunks}
          streamMaxMs={streamMaxMs}
          time={time}
          onTimeChange={setTime}
          onScrubStart={() => setScrubbing(true)}
          onScrubEnd={() => setScrubbing(false)}
          status={status}
          occurrences={occurrences}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          selectedChunk={selectedChunk}
          tree={tree}
        />
      ) : null}
    </OverlayPanel>
  );
}
