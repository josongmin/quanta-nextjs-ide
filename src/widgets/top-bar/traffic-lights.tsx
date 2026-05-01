import { useUiStore } from '@entities/ui-shell';
import { cn } from '@shared/lib/cn';

/**
 * Macintosh-style window controls. Three circular buttons (close / minimize /
 * maximize) — purely decorative when not on `mac` theme but always rendered as
 * a visual flourish on the top bar to nod at the Macintosh edition.
 *
 * On hover the dots reveal subtle glyphs (×, −, +) like macOS native controls.
 */
export function TrafficLights() {
  const colorMode = useUiStore((s) => s.colorMode);
  const toggleLeft = useUiStore((s) => s.toggleLeft);
  const toggleBottom = useUiStore((s) => s.toggleBottom);
  const toggleRight = useUiStore((s) => s.toggleRight);

  const isMac = colorMode === 'mac';

  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 pl-0.5',
        isMac ? 'opacity-100' : 'opacity-90 hover:opacity-100',
      )}
      aria-hidden
    >
      <Light
        color="bg-[#FF5F57] border-[#E0443E]"
        glyph="×"
        title="Close right panel"
        onClick={toggleRight}
      />
      <Light
        color="bg-[#FEBC2E] border-[#DEA123]"
        glyph="−"
        title="Toggle bottom panel"
        onClick={toggleBottom}
      />
      <Light
        color="bg-[#28C840] border-[#1AAB29]"
        glyph="+"
        title="Toggle left panel"
        onClick={toggleLeft}
      />
    </div>
  );
}

function Light({
  color,
  glyph,
  title,
  onClick,
}: {
  color: string;
  glyph: string;
  title: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'relative inline-flex h-3 w-3 items-center justify-center rounded-full border',
        color,
        'shadow-[inset_0_-1px_1px_rgba(0,0,0,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        'transition-transform hover:scale-110',
      )}
    >
      <span className="text-[8px] font-bold leading-none text-black/55 opacity-0 group-hover:opacity-100">
        {glyph}
      </span>
    </button>
  );
}
