import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  FORMAT_LABEL,
  FORMAT_TONE,
  type ImageEntry,
  type ImageFmt,
  images,
  totalSavings,
} from './helpers';

const FORMAT_FILTERS: ReadonlyArray<{ id: ImageFmt | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'jpeg', label: 'JPEG' },
  { id: 'png', label: 'PNG' },
  { id: 'webp', label: 'WebP' },
  { id: 'avif', label: 'AVIF' },
  { id: 'svg', label: 'SVG' },
  { id: 'gif', label: 'GIF' },
];

export function ImageFormatAuditOverlay() {
  const open = useUiStore((s) => s.overlays.imageFormatAudit.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [filter, setFilter] = useState<ImageFmt | 'all'>('all');

  const filtered = useMemo<ImageEntry[]>(() => {
    const raw = filter === 'all' ? [...images] : images.filter((x) => x.format === filter);
    return raw.sort((a, b) => b.estSavingsKb - a.estSavingsKb);
  }, [filter]);

  const total = totalSavings(filtered);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('imageFormatAudit'))}
      title="Image Format Audit"
      subtitle="avif / webp / jpeg recommendation"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Generate codemod (preview)')}
          >
            <Icon.Branch className="h-3 w-3" />
            Generate codemod
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() =>
              toast('Convert all (preview)', {
                description: `~${total} KB total savings`,
              })
            }
          >
            <Icon.Refresh className="h-3 w-3" />
            Convert all
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-10 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Format</span>
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {FORMAT_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-selected={filter === f.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                filter === f.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Chip size="xs" tone="muted">
            {filtered.length} images
          </Chip>
          <Chip size="xs" tone="static">
            ~{total} KB savings
          </Chip>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No images" description="No images match this filter." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="hairline-b bg-bg-subtle text-ink-3">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">src</th>
                <th className="px-2 py-1.5 text-left font-medium">format → recommended</th>
                <th className="px-2 py-1.5 text-right font-medium">width</th>
                <th className="px-2 py-1.5 text-center font-medium">lazy</th>
                <th className="px-2 py-1.5 text-center font-medium">srcset</th>
                <th className="px-2 py-1.5 text-right font-medium">est saving</th>
                <th className="px-2 py-1.5 text-right font-medium">actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((im) => (
                <tr
                  key={im.id}
                  className="hairline-b last:border-b-0 hover:bg-bg-hover"
                >
                  <td className="px-3 py-1.5 align-top">
                    <div className="font-mono text-ink-1">{im.src}</div>
                    <div className="mt-0.5 truncate text-[10px] text-ink-3">
                      {im.file}:{im.line}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <div className="flex items-center gap-1">
                      <Chip size="xs" tone={FORMAT_TONE[im.format]}>
                        {FORMAT_LABEL[im.format]}
                      </Chip>
                      <Icon.Right className="h-3 w-3 text-ink-3" />
                      <Chip size="xs" tone={FORMAT_TONE[im.recommendedFormat]}>
                        {FORMAT_LABEL[im.recommendedFormat]}
                      </Chip>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right align-top font-mono text-ink-2">
                    {im.widthHint}px
                  </td>
                  <td className="px-2 py-1.5 text-center align-top">
                    <span
                      className={cn(
                        'inline-flex h-4 w-4 items-center justify-center text-sm leading-none',
                        im.lazy ? 'text-sem-static' : 'text-sev-err',
                      )}
                    >
                      {im.lazy ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center align-top">
                    <span
                      className={cn(
                        'inline-flex h-4 w-4 items-center justify-center text-sm leading-none',
                        im.hasSrcSet ? 'text-sem-static' : 'text-sev-err',
                      )}
                    >
                      {im.hasSrcSet ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right align-top">
                    <span
                      className={cn(
                        'font-mono',
                        im.estSavingsKb > 100
                          ? 'text-sev-err'
                          : im.estSavingsKb > 40
                            ? 'text-sev-warn'
                            : 'text-ink-2',
                      )}
                    >
                      ~{im.estSavingsKb} KB
                    </span>
                  </td>
                  <td className="px-2 py-1.5 align-top text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="xs"
                        tone="ghost"
                        disabled={im.format === im.recommendedFormat}
                        onClick={() =>
                          toast(`Convert ${im.src}`, {
                            description: `${FORMAT_LABEL[im.format]} → ${FORMAT_LABEL[im.recommendedFormat]} (~${im.estSavingsKb} KB)`,
                          })
                        }
                      >
                        Convert
                      </Button>
                      <Button
                        size="xs"
                        tone="ghost"
                        disabled={im.lazy}
                        onClick={() =>
                          toast(`Add loading="lazy" to ${im.src}`)
                        }
                      >
                        Lazy
                      </Button>
                      <Button
                        size="xs"
                        tone="ghost"
                        disabled={im.hasSrcSet}
                        onClick={() =>
                          toast(`Add srcset to ${im.src}`)
                        }
                      >
                        srcset
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="hairline-t bg-bg-subtle px-3 py-2 text-[11px] text-ink-3">
        Total saving <span className="font-mono text-ink-1">~{total} KB</span>{' '}
        if all {filtered.length} converted.
      </div>
    </OverlayPanel>
  );
}
