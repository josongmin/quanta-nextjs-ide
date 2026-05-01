import { toast } from 'sonner';
import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { dependencyPath, type SbomPackage } from '../helpers';

interface PkgRowProps {
  pkg: SbomPackage;
  maxSize: number;
  expanded: boolean;
  onToggle(): void;
}

export function PkgRow({ pkg, maxSize, expanded, onToggle }: PkgRowProps) {
  const path = dependencyPath(pkg);
  const copyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      ?.writeText(pkg.hash)
      .then(() => toast('Copied'))
      .catch(() => toast('Copied'));
  };
  return (
    <>
      <tr
        className={cn(
          'hairline-b cursor-pointer hover:bg-bg-subtle/60',
          expanded && 'bg-bg-subtle/60',
        )}
        onClick={onToggle}
      >
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Icon.ChevRight
              className={cn(
                'h-3 w-3 text-ink-3 transition-transform',
                expanded && 'rotate-90',
              )}
            />
            <span className="font-mono text-ink-1">{pkg.name}</span>
          </div>
        </td>
        <td className="px-2 py-1.5 font-mono text-ink-3">{pkg.version}</td>
        <td className="px-2 py-1.5 text-ink-2">{pkg.supplier}</td>
        <td className="px-2 py-1.5">
          <Chip tone="muted" size="xs">
            {pkg.license}
          </Chip>
        </td>
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${Math.round((pkg.sizeKb / maxSize) * 100)}%`,
                }}
              />
            </div>
            <span className="font-mono text-[10px] text-ink-3">
              {pkg.sizeKb}KB
            </span>
          </div>
        </td>
        <td className="px-2 py-1.5">
          <button
            onClick={copyHash}
            className="font-mono text-[10px] text-ink-2 hover:text-ink-1"
          >
            {pkg.hash}
          </button>
        </td>
        <td className="px-2 py-1.5">
          <Chip tone="info" size="xs">
            <span className="font-mono">{pkg.introducedBy}</span>
          </Chip>
        </td>
      </tr>
      {expanded ? (
        <tr className="hairline-b bg-bg-subtle/30">
          <td colSpan={7} className="px-3 py-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-caps text-ink-3">Dependency path</div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {path.map((step, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Chip
                        tone={
                          i === 0
                            ? 'info'
                            : i === path.length - 1
                              ? 'static'
                              : 'muted'
                        }
                        size="xs"
                      >
                        <span className="font-mono">{step}</span>
                      </Chip>
                      {i < path.length - 1 ? (
                        <Icon.Right className="h-3 w-3 text-ink-3" />
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-caps text-ink-3">Origin</div>
                <div className="mt-1 font-mono text-[11px] text-ink-1">
                  {pkg.sourceUrl}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Chip tone="static" size="xs">
                    signed
                  </Chip>
                  <Chip tone="muted" size="xs">
                    no advisories
                  </Chip>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
