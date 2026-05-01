/**
 * Top-bar "Open Folder…" affordance.
 *
 * Triggers the native folder picker (Tauri dialog plugin) and feeds the
 * picked path into the workspace store, which in turn kicks off the file
 * watcher and the analyzer bus.
 *
 * On non-Tauri hosts the picker silently no-ops; the button still renders
 * so the chrome looks the same in Storybook.
 */

import { useState } from 'react';
import { Button, Icon, Tooltip } from '@shared/ui';
import { workspace, useWorkspaceStore } from '@shared/workspace';

export function OpenFolderButton() {
  const status = useWorkspaceStore((s) => s.status);
  const info = useWorkspaceStore((s) => s.info);
  const open = useWorkspaceStore((s) => s.openWorkspace);
  const [busy, setBusy] = useState(false);

  const handleClick = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await workspace.pickFolder();
      if (!picked) return;
      await open(picked);
    } finally {
      setBusy(false);
    }
  };

  const label = info?.name
    ? `Workspace: ${info.name}`
    : status === 'loading' || busy
      ? 'Opening…'
      : 'Open Folder…';

  return (
    <Tooltip content={label} side="bottom">
      <Button
        tone="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => void handleClick()}
        aria-label="Open project folder"
      >
        <Icon.Folder className="h-3.5 w-3.5" />
        <span className="max-w-[160px] truncate text-xs">
          {info?.name ?? 'Open Folder…'}
        </span>
      </Button>
    </Tooltip>
  );
}
