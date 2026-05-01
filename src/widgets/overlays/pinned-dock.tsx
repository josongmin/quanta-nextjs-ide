import { useUiStore } from '@entities/ui-shell';
import { Icon } from '@shared/ui';

export function PinnedDock() {
  const pinned = useUiStore((s) => s.overlays.pinned);
  const unpin = useUiStore((s) => s.unpin);

  if (pinned.length === 0) return null;

  return (
    <aside
      role="region"
      aria-label="Pinned"
      className="pointer-events-none fixed right-3 top-12 z-40 flex flex-col gap-2"
    >
      {pinned.map((p) => (
        <div
          key={p.id}
          className="pointer-events-auto w-[280px] rounded-md border border-line bg-bg shadow-pop"
        >
          <header className="flex items-start justify-between gap-2 px-2 py-1.5 hairline-b">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-ink-1">
                {p.title}
              </div>
              <div className="truncate text-[11px] text-ink-3">{p.meta}</div>
            </div>
            <button
              onClick={() => unpin(p.id)}
              className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1"
              aria-label="Unpin"
            >
              <Icon.X className="h-3 w-3" />
            </button>
          </header>
        </div>
      ))}
    </aside>
  );
}
