import { useMemo, useState } from 'react';
import { mockFileTree } from '@shared/mocks/file-tree';
import { TabHeader } from '../parts/tab-header';
import { SearchInput } from '../parts/search-input';
import { FileTree } from '../parts/file-tree';

const DEFAULT_EXPANDED = new Set<string>([
  'app',
  'app/(shop)',
  'app/(shop)/products',
  'app/admin',
  'components',
  'lib',
]);

export function FilesTab() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(DEFAULT_EXPANDED),
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stable root reference.
  const root = useMemo(() => mockFileTree, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search files"
        />
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <FileTree
          root={root}
          search={search}
          expanded={expanded}
          toggle={toggle}
        />
      </div>
    </div>
  );
}
