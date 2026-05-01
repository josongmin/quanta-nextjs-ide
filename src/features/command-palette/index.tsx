import { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { useActionStore } from '@entities/server-action';
import { useCacheTagStore } from '@entities/cache-tag';
import {
  mockClientIslands,
  mockLayoutInfos,
  mockServerActions,
} from '@shared/mocks';
import { Icon, Kbd, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { GlobalKeybindings } from '@features/keybindings';
import {
  collectFiles,
  commandCategoryOrder,
  jumpTabId,
  nssCommands,
  shortFile,
  type FileRow,
  type IconCmp,
  type NssCommandSpec,
} from './helpers';
import { KeybindingsHelp } from './keybindings-help';

// ─────────────────────────────────────────────────────────────────────────────
// Top-level component
// ─────────────────────────────────────────────────────────────────────────────

export function CommandPaletteOverlay() {
  const open = useUiStore((s) => s.overlays.commandPalette.open);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);

  return (
    <>
      <GlobalKeybindings />
      <KeybindingsHelp />
      <OverlayPanel
        open={open}
        onOpenChange={(o) =>
          o ? openOverlay('commandPalette') : close('commandPalette')
        }
        title="Command Palette"
        subtitle={
          <>
            Type a command, file, route — or <span className="font-mono">{'>'}NSS:</span> to filter
          </>
        }
        width={620}
      >
        {open ? <PaletteBody onClose={() => close('commandPalette')} /> : null}
      </OverlayPanel>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Body
// ─────────────────────────────────────────────────────────────────────────────

interface BodyProps {
  onClose(): void;
}

function PaletteBody({ onClose }: BodyProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  // store actions / state we need to dispatch from items
  const setSelectedRoute = useRouteStore((s) => s.setSelected);
  const setSelectedTag = useCacheTagStore((s) => s.setSelected);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const setLeftTab = useUiStore((s) => s.setLeftTab);
  const setBottomTab = useUiStore((s) => s.setBottomTab);
  const bottomPanelOpen = useUiStore((s) => s.bottomPanelOpen);
  const toggleBottom = useUiStore((s) => s.toggleBottom);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const openTab = useEditorStore((s) => s.openTab);

  const routes = useRouteStore((s) => s.routes);
  const actions = useActionStore((s) => s.actions);
  const tags = useCacheTagStore((s) => s.tags);

  // Auto-focus input on open. cmdk's <Command.Input> renders an <input>;
  // we use a ref to be sure it grabs focus across re-renders.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, []);

  // Build the file list once per mount (deterministic from mocks).
  const files = useMemo<FileRow[]>(
    () =>
      collectFiles({
        routes,
        islandFiles: mockClientIslands.map((i) => ({ id: i.id, file: i.file })),
        layoutFiles: mockLayoutInfos.map((l) => ({ id: l.id, file: l.file })),
        actionFiles: mockServerActions.map((a) => ({ id: a.id, file: a.file })),
      }),
    [routes],
  );

  // ── Symbol mode: the user typed `#…` ────────────────────────────────────
  // We pass the raw value (incl. `#`) to cmdk; our row `value` strings include
  // the `#` separator-style keywords ("route /x", "tag products") so the leading
  // `#` is naturally tolerated by command-score's substring fuzziness.
  const isSymbolMode = search.startsWith('#');

  // ── Action runner ───────────────────────────────────────────────────────
  const runCommand = (cmd: NssCommandSpec) => {
    switch (cmd.action.kind) {
      case 'toast':
        toast(cmd.action.message);
        break;
      case 'open-overlay':
        openOverlay(cmd.action.key);
        break;
      case 'set-bottom-tab':
        setBottomTab(cmd.action.tab);
        if (!bottomPanelOpen) toggleBottom();
        break;
      case 'set-inspector-project':
        setInspectorContext({ kind: 'project' });
        break;
      case 'set-left-tab':
        setLeftTab(cmd.action.tab);
        break;
    }
    onClose();
  };

  return (
    <Command
      label="Command Palette"
      shouldFilter
      className={cn(
        'flex flex-col',
        '[&_[cmdk-input]]:outline-none',
      )}
    >
      {/* ── Input row ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 hairline-b">
        {isSymbolMode ? (
          <Icon.Hash className="h-4 w-4 shrink-0 text-ink-3" />
        ) : (
          <Icon.Search className="h-4 w-4 shrink-0 text-ink-3" />
        )}
        <Command.Input
          ref={inputRef}
          value={search}
          onValueChange={setSearch}
          // cmdk uses its own filter; we pass the (potentially #-prefixed)
          // raw value for display, but cmdk doesn't see the prefix because
          // we mirror to a hidden input via `search` directly.
          // — easiest: just give cmdk the stripped form via key trick below.
          placeholder={
            isSymbolMode
              ? 'Symbol search — routes, actions, tags…'
              : 'Type a command — try "NSS:" or # for symbols'
          }
          className="w-full bg-transparent text-sm text-ink-1 placeholder:text-ink-3"
        />
        {isSymbolMode ? (
          <span className="shrink-0 rounded-sm border border-line bg-bg-subtle px-1.5 py-0.5 text-2xs text-ink-2">
            symbol mode
          </span>
        ) : null}
        <Kbd className="ml-1">Esc</Kbd>
      </div>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <Command.List className="max-h-[60vh] overflow-y-auto py-1">
        <Command.Empty className="px-4 py-6 text-center text-xs text-ink-3">
          No matches
        </Command.Empty>

        {/* ── Routes ─────────────────────────────────────────────────── */}
        <PaletteGroup heading="Routes">
          {routes.map((r) => (
            <PaletteRow
              key={r.id}
              icon={Icon.Globe}
              value={`route ${r.path} ${r.archetype} ${r.id}`}
              onSelect={() => {
                setSelectedRoute(r.id);
                setInspectorContext({ kind: 'route', routeId: r.id });
                if (r.files.page) {
                  openTab({
                    id: jumpTabId(r.files.page),
                    file: r.files.page,
                    label: shortFile(r.files.page),
                  });
                }
                onClose();
              }}
            >
              <span className="font-mono text-ink-1">{r.path}</span>
              <span className="ml-2 text-ink-3 truncate">{r.archetype}</span>
            </PaletteRow>
          ))}
        </PaletteGroup>

        {/* ── Server Actions ─────────────────────────────────────────── */}
        <PaletteGroup heading="Server Actions">
          {actions.map((a) => {
            const route = routes.find((r) => r.id === a.routeId);
            return (
              <PaletteRow
                key={a.id}
                icon={Icon.Zap}
                value={`action ${a.name} ${route?.path ?? ''} ${a.id}`}
                onSelect={() => {
                  setInspectorContext({ kind: 'action', actionId: a.id });
                  onClose();
                }}
              >
                <span className="font-mono text-ink-1">{a.name}()</span>
                <span className="ml-2 text-ink-3 truncate">
                  {route?.path ?? a.file}
                </span>
              </PaletteRow>
            );
          })}
        </PaletteGroup>

        {/* ── Cache Tags ─────────────────────────────────────────────── */}
        <PaletteGroup heading="Cache Tags">
          {tags.map((t) => (
            <PaletteRow
              key={t.id}
              icon={Icon.Tag}
              value={`tag ${t.name} ${t.id}`}
              onSelect={() => {
                setLeftTab('tags');
                setSelectedTag(t.id);
                onClose();
              }}
            >
              <span className="font-mono text-ink-1">{t.name}</span>
              <span className="ml-2 text-ink-3 truncate">
                {t.producers.length}P · {t.invalidators.length}I
              </span>
            </PaletteRow>
          ))}
        </PaletteGroup>

        {/* ── Files (hidden in symbol mode) ──────────────────────────── */}
        {isSymbolMode ? null : (
          <PaletteGroup heading="Files">
            {files.map((f) => (
              <PaletteRow
                key={f.id}
                icon={Icon.File}
                value={`file ${f.path} ${f.kind}`}
                onSelect={() => {
                  openTab({
                    id: jumpTabId(f.path),
                    file: f.path,
                    label: shortFile(f.path),
                  });
                  onClose();
                }}
              >
                <span className="font-mono text-ink-1 truncate">{f.path}</span>
                <span className="ml-2 text-ink-3">{f.kind}</span>
              </PaletteRow>
            ))}
          </PaletteGroup>
        )}

        {/* ── NSS Commands (hidden in symbol mode) ───────────────────── */}
        {isSymbolMode
          ? null
          : commandCategoryOrder.map((cat) => {
              const items = nssCommands.filter((c) => c.category === cat);
              if (items.length === 0) return null;
              return (
                <PaletteGroup key={cat} heading={cat}>
                  {items.map((c) => (
                    <PaletteRow
                      key={c.id}
                      icon={c.icon}
                      value={`NSS ${c.label} ${c.category}`}
                      shortcut={c.shortcut}
                      onSelect={() => runCommand(c)}
                    >
                      <span className="text-ink-2">
                        <span className="text-ink-3">NSS:</span> {c.label}
                      </span>
                    </PaletteRow>
                  ))}
                </PaletteGroup>
              );
            })}
      </Command.List>
    </Command>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group / Row primitives
// ─────────────────────────────────────────────────────────────────────────────

interface PaletteGroupProps {
  heading: string;
  children: React.ReactNode;
}

function PaletteGroup({ heading, children }: PaletteGroupProps) {
  return (
    <Command.Group
      heading={heading}
      className={cn(
        'px-1 py-1',
        // group heading styling — cmdk renders the heading via [cmdk-group-heading]
        '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2',
        '[&_[cmdk-group-heading]]:text-caps [&_[cmdk-group-heading]]:text-ink-3',
        // hairline separator under heading row
        '[&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-line/60 [&_[cmdk-group-heading]]:mb-1',
      )}
    >
      {children}
    </Command.Group>
  );
}

interface PaletteRowProps {
  icon: IconCmp;
  value: string;
  shortcut?: string[];
  onSelect(): void;
  children: React.ReactNode;
}

function PaletteRow({
  icon: IconCmp,
  value,
  shortcut,
  onSelect,
  children,
}: PaletteRowProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'group relative flex h-8 cursor-pointer items-center gap-2 px-3 text-xs',
        'rounded-none',
        // hover/selected use bg-bg-selected. cmdk sets data-selected on the
        // currently-active item.
        'data-[selected=true]:bg-bg-selected',
        // 2px accent vertical line on left when selected
        'data-[selected=true]:before:absolute data-[selected=true]:before:left-0',
        'data-[selected=true]:before:top-0 data-[selected=true]:before:h-full',
        'data-[selected=true]:before:w-[2px] data-[selected=true]:before:bg-accent',
        'aria-disabled:opacity-50',
      )}
    >
      <IconCmp className="h-3.5 w-3.5 shrink-0 text-ink-3 group-data-[selected=true]:text-ink-2" />
      <span className="flex min-w-0 flex-1 items-center truncate">{children}</span>
      {shortcut ? (
        <span className="ml-2 flex shrink-0 items-center gap-0.5">
          {shortcut.map((k, i) => (
            <Kbd key={`${value}-${i}-${k}`}>{k}</Kbd>
          ))}
        </span>
      ) : null}
    </Command.Item>
  );
}
