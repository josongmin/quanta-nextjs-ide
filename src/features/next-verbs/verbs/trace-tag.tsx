/**
 * Verb 3 — "Trace cache for tag…"
 *
 * Pick a cache tag from a quick list; on confirm, sets the selected tag
 * and switches to the tags side-tab.
 */

import { useState } from 'react';
import { Icon } from '@shared/ui';
import { useCacheTagStore } from '@entities/cache-tag';
import { useUiStore } from '@entities/ui-shell';
import { showVerbPreview, useVerbPreviewStore } from '../preview-shell';
import type { NextVerb } from '../types';

function TraceTagBody({ onPick }: { onPick: (id: string) => void }) {
  const tags = useCacheTagStore((s) => s.tags);
  const [filter, setFilter] = useState('');
  const matches = tags.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter tags…"
        className="w-full rounded-sm border border-line bg-bg-subtle px-2 py-1 text-xs text-ink-1 placeholder:text-ink-3 focus:outline-none focus:border-accent"
      />
      <ul className="max-h-[40vh] space-y-1 overflow-y-auto">
        {matches.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs hover:bg-bg-selected"
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon.Tag className="h-3 w-3 text-ink-3" />
                <span className="font-mono">{t.name}</span>
              </span>
              <span className="text-2xs text-ink-3">
                {t.producers.length}P · {t.invalidators.length}I
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 ? (
          <li className="px-2 py-2 text-2xs text-ink-3">No matching tags.</li>
        ) : null}
      </ul>
    </div>
  );
}

export const traceTagVerb: NextVerb = {
  id: 'trace-tag',
  title: 'Trace cache for tag…',
  description: 'Pick a cache tag and open its lineage in the tags panel.',
  hotkey: ['⌘', '⇧', 'T'],
  category: 'cache',
  icon: Icon.Tag,
  shouldShow: () => true,
  run: () => {
    const onPick = (id: string): void => {
      useCacheTagStore.getState().setSelected(id);
      useUiStore.getState().setLeftTab('tags');
      useVerbPreviewStore.getState().close();
    };
    showVerbPreview({
      verbId: 'trace-tag',
      title: 'Trace cache for tag',
      body: <TraceTagBody onPick={onPick} />,
      secondaryLabel: 'Cancel',
    });
  },
};
