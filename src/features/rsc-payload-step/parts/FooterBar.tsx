import type { MutableRefObject } from 'react';
import type { PayloadSnapshot, RscChunk } from '@entities/rsc-payload';
import { Button, Chip } from '@shared/ui';

interface FooterBarProps {
  chunks: ReadonlyArray<RscChunk>;
  visibleChunks: ReadonlyArray<RscChunk>;
  streamMaxMs: number;
  aggregateBytes: number;
  statusLabel: string;
  statusTone: 'accent' | 'edge' | 'muted' | 'info';
  snapshots: ReadonlyArray<PayloadSnapshot>;
  onCapture: () => void;
  onReplay: () => void;
  onBatch: () => void;
  onExport: () => void;
  onImportClick: () => void;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
}

export function FooterBar({
  chunks,
  visibleChunks,
  streamMaxMs,
  aggregateBytes,
  statusLabel,
  statusTone,
  snapshots,
  onCapture,
  onReplay,
  onBatch,
  onExport,
  onImportClick,
  fileInputRef,
  onImportFile,
}: FooterBarProps) {
  return (
    <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
      <span>
        chunks: <span className="font-mono text-ink-1">{chunks.length}</span>
      </span>
      <span>
        visible: <span className="font-mono text-accent">{visibleChunks.length}</span>
      </span>
      <span>
        total: <span className="font-mono text-ink-1">{Math.round(streamMaxMs)}ms</span>
      </span>
      <span>
        size: <span className="font-mono text-ink-1">{aggregateBytes}B</span>
      </span>
      <Chip tone={statusTone} size="xs">
        {statusLabel}
      </Chip>
      <span className="ml-auto flex gap-1.5">
        <Button
          size="xs"
          tone="ghost"
          onClick={onCapture}
          disabled={chunks.length === 0}
        >
          Capture ({snapshots.length})
        </Button>
        <Button size="xs" tone="ghost" onClick={onReplay}>
          Replay
        </Button>
        <Button size="xs" tone="ghost" onClick={onBatch}>
          Batch
        </Button>
        <Button size="xs" tone="ghost" onClick={onExport}>
          Export
        </Button>
        <Button size="xs" tone="ghost" onClick={onImportClick}>
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = '';
          }}
        />
      </span>
    </span>
  );
}
