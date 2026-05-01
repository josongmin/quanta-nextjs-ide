import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { ALL_KINDS, ROUTE_DATA, type AssetKind } from '../helpers';

interface WaterfallToolbarProps {
  routeId: string;
  activeKinds: ReadonlyArray<AssetKind>;
  blockingOnly: boolean;
  onChangeRoute: (id: string) => void;
  onToggleKind: (k: AssetKind) => void;
  onToggleBlocking: (v: boolean) => void;
}

export function WaterfallToolbar({
  routeId,
  activeKinds,
  blockingOnly,
  onChangeRoute,
  onToggleKind,
  onToggleBlocking,
}: WaterfallToolbarProps): JSX.Element {
  return (
    <PanelHeader>
      {ROUTE_DATA.map((r) => (
        <ToggleChip
          key={r.routeId}
          active={r.routeId === routeId}
          onClick={() => onChangeRoute(r.routeId)}
        >
          {r.routeId}
        </ToggleChip>
      ))}
      <span className="h-4 w-px bg-line" aria-hidden />
      {ALL_KINDS.map((k) => {
        const active = activeKinds.includes(k);
        return (
          <ToggleChip key={k} active={active} onClick={() => onToggleKind(k)}>
            {k}
          </ToggleChip>
        );
      })}
      <label className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] text-ink-2">
        <input
          type="checkbox"
          checked={blockingOnly}
          onChange={(e) => onToggleBlocking(e.target.checked)}
          className="h-3 w-3"
        />
        blocking only
      </label>
    </PanelHeader>
  );
}
