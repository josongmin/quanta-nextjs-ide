import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useDiagnosticStore } from '@entities/diagnostic';
import { Button, Icon, Kbd, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { RecentsButton } from '@features/recents';
import { FocusModeIndicator, useFocusModeKeybinding } from '@features/focus-mode';
import { AskCodebaseButton } from '@features/full-context-hover/ask-codebase';
import { GovernedFlowButton } from '@features/ai-governed-mode/integration';
import { ThemeSwitcherButton } from '@features/theme-switcher';
import { ShipButton, useShipDrawerKeybinding } from '@features/ship-drawer/integration';
import { ShipDrawer } from '@features/ship-drawer';
import { TrafficLights } from './traffic-lights';
import { OpenFolderButton } from './open-folder-button';

export function TopBar() {
  // Wire ⌘⇧F + Esc focus-mode keybindings here so the studio shell always
  // includes them even before any other feature is mounted.
  useFocusModeKeybinding();
  // ⌘⇧P opens the Ship-it Drawer (Phase 21).
  useShipDrawerKeybinding();
  const openOverlay = useUiStore((s) => s.openOverlay);
  const colorMode = useUiStore((s) => s.colorMode);
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);

  const total = routes.length;
  const staticCount = routes.filter(
    (r) => r.rendering === 'static' || r.rendering === 'isr',
  ).length;
  const dynamicCount = routes.filter((r) => r.rendering === 'dynamic').length;
  const risks = diagnostics.filter(
    (d) => d.severity === 'err' || d.severity === 'warn',
  ).length;

  return (
    <header
      role="banner"
      className={cn(
        'flex h-10 shrink-0 items-center gap-3 hairline-b bg-bg px-3',
        'mi-sticky-shadow',
        'data-[mac=true]:bg-gradient-to-b data-[mac=true]:from-bg data-[mac=true]:to-bg-subtle',
      )}
      data-mac={colorMode === 'mac'}
    >
      <TrafficLights />
      <div className="flex items-center gap-2 pl-1 select-none">
        <span
          aria-hidden
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold text-white',
            'gradient-accent shadow-e1',
            'transition-transform duration-snappy ease-spring hover:scale-110',
          )}
        >
          N
        </span>
        <span className="text-sm font-semibold tracking-tighter2 text-ink-1">
          Next Static Studio
        </span>
        {colorMode === 'mac' && (
          <span className="ml-1 rounded-full border border-line bg-bg-subtle px-1.5 py-0 text-[10px] font-medium tracking-caps text-ink-3 animate-fade-in">
            Macintosh Edition
          </span>
        )}
      </div>

      <nav className="flex items-center gap-0 text-sm text-ink-2">
        {['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((m) => (
          <button
            key={m}
            className={cn(
              'mi-press mi-underline rounded-md px-2 py-1',
              'hover:bg-bg-hover hover:text-ink-1',
              'mi-focus-ring',
            )}
          >
            {m}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <OpenFolderButton />
        <Tooltip content="Open Cockpit — project pulse" side="bottom">
          <Button
            tone="ghost"
            size="sm"
            aria-label="Open Cockpit"
            className="mi-press gap-1.5"
            onClick={() => openOverlay('cockpit')}
          >
            <span aria-hidden className="text-[12px]">🚀</span>
            <span className="text-ink-2">Cockpit</span>
          </Button>
        </Tooltip>
        <Button
          tone="soft"
          size="sm"
          className="mi-press gap-2 pr-1"
          onClick={() => openOverlay('commandPalette')}
        >
          <Icon.Search className="h-3.5 w-3.5 text-ink-3" />
          <span className="text-ink-3">Search · Commands</span>
          <span className="flex items-center gap-0.5 text-ink-3">
            <Kbd>⌘</Kbd>
            <Kbd>P</Kbd>
          </span>
        </Button>

        <AskCodebaseButton />
        <GovernedFlowButton iconOnly />

        <ThemeSwitcherButton />

        <div className="flex items-center gap-0.5">
          <RecentsButton />
          <FocusModeIndicator />
          <Tooltip content="Settings" side="bottom">
            <Button
              tone="ghost"
              size="icon"
              aria-label="Open settings"
              className="mi-press"
              onClick={() => openOverlay('settings')}
            >
              <Icon.Settings className="h-3.5 w-3.5 transition-transform duration-relaxed ease-spring-soft hover:rotate-45" />
            </Button>
          </Tooltip>
          <Tooltip content="Keyboard shortcuts" side="bottom">
            <Button
              tone="ghost"
              size="icon"
              aria-label="Keyboard shortcuts"
              className="mi-press"
              onClick={() => openOverlay('shortcutHelp')}
            >
              <span className="font-mono text-xs leading-none">?</span>
            </Button>
          </Tooltip>
        </div>

        <button
          className={cn(
            'mi-press mi-focus-ring nums-tabular',
            'flex h-7 items-center gap-2.5 rounded-md border border-line bg-bg px-2.5 text-xs',
            'hover:bg-bg-hover hover:border-line-strong hover:shadow-e1',
          )}
          onClick={() => openOverlay('whatIf')}
          aria-label="Project snapshot"
        >
          <span className="text-ink-2">{total} routes</span>
          <span className="text-ink-3">·</span>
          <span className="text-sem-static">{staticCount} static</span>
          <span className="text-ink-3">·</span>
          <span className="text-sem-dynamic">{dynamicCount} dyn</span>
          <span className="text-ink-3">·</span>
          <span className="text-sev-warn">{risks} risks</span>
        </button>

        <ShipButton />

        <span className="text-xs text-ink-3 select-none">web · Next 15.0</span>
      </div>
      <ShipDrawer />
    </header>
  );
}
