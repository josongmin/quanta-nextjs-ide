import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

export interface ImagePreviewInfo {
  filename: string;
  extension: string;
  /** Mock byte size for the preview card (bytes). */
  sizeBytes: number;
  /** Mock natural dimensions if known. */
  dimensions?: { width: number; height: number };
}

export function deriveImageInfo(filename: string): ImagePreviewInfo {
  const dot = filename.lastIndexOf('.');
  const extension = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : 'png';
  // Stable mock size derived from filename length.
  const sizeBytes = 18_000 + (filename.length * 1373) % 220_000;
  // Rotate through plausible dimensions.
  const dims = [
    { width: 1200, height: 630 },
    { width: 1024, height: 1024 },
    { width: 800, height: 600 },
    { width: 600, height: 400 },
  ];
  const dimensions = dims[filename.length % dims.length];
  return { filename, extension, sizeBytes, dimensions };
}

function formatSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

interface Props {
  info: ImagePreviewInfo;
}

const EXT_TONES: Record<
  string,
  'accent' | 'static' | 'isr' | 'dynamic' | 'edge' | 'client' | 'server' | 'muted'
> = {
  png: 'accent',
  jpg: 'static',
  jpeg: 'static',
  webp: 'isr',
  avif: 'edge',
  svg: 'dynamic',
  gif: 'client',
};

export function ImagePreviewCard({ info }: Props) {
  const tone = EXT_TONES[info.extension] ?? 'muted';
  return (
    <div className="w-[280px] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="truncate font-mono text-xs text-ink-1"
          title={info.filename}
        >
          {info.filename}
        </span>
        <Chip tone={tone} size="xs">
          {info.extension.toUpperCase()}
        </Chip>
      </div>
      <div
        className={cn(
          'flex h-32 items-center justify-center rounded-sm border border-dashed border-line bg-bg-subtle',
        )}
      >
        <span className="font-mono text-xl font-semibold uppercase tracking-caps text-ink-3">
          .{info.extension}
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        <dt className="text-ink-3">Size</dt>
        <dd className="text-right font-mono text-ink-2">
          {formatSize(info.sizeBytes)}
        </dd>
        {info.dimensions ? (
          <>
            <dt className="text-ink-3">Dimensions</dt>
            <dd className="text-right font-mono text-ink-2">
              {info.dimensions.width}×{info.dimensions.height}
            </dd>
          </>
        ) : null}
        <dt className="text-ink-3">Format</dt>
        <dd className="text-right font-mono text-ink-2">
          {info.extension.toUpperCase()}
        </dd>
      </dl>
    </div>
  );
}
