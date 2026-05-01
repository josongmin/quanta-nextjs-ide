import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  OverlayPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import {
  SAVED_QUERIES,
  TABLES,
  type DbTable,
  type SavedQuery,
} from './helpers';
import { QueryTab } from './parts/query-tab';
import { SchemaTab } from './parts/schema-tab';
import { DataTab } from './parts/data-tab';
import { JoinTab } from './parts/join-tab';

type TabKey = 'query' | 'schema' | 'data' | 'join';

export function DatabaseToolOverlay() {
  const open = useUiStore((s) => s.overlays.databaseTool.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [tab, setTab] = useState<TabKey>('query');

  // Query tab state
  const [queryId, setQueryId] = useState<string>(SAVED_QUERIES[0]!.id);
  const [showPlan, setShowPlan] = useState(false);
  const selectedQuery: SavedQuery =
    SAVED_QUERIES.find((q) => q.id === queryId) ?? SAVED_QUERIES[0]!;
  const [editorSql, setEditorSql] = useState<string>(selectedQuery.sql);

  function chooseQuery(id: string): void {
    setQueryId(id);
    const q = SAVED_QUERIES.find((x) => x.id === id);
    if (q) setEditorSql(q.sql);
  }

  // Data tab state
  const [dataTable, setDataTable] = useState<string>(TABLES[0]!.name);
  const [sortCol, setSortCol] = useState<number | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dataFilter, setDataFilter] = useState('');

  const tableObj: DbTable =
    TABLES.find((t) => t.name === dataTable) ?? TABLES[0]!;

  const filteredRows = useMemo(() => {
    const q = dataFilter.trim().toLowerCase();
    let rows = tableObj.rows.filter((r) =>
      q.length === 0
        ? true
        : r.some((c) => String(c).toLowerCase().includes(q)),
    );
    if (sortCol !== undefined) {
      rows = rows.slice().sort((a, b) => {
        const ax = a[sortCol];
        const bx = b[sortCol];
        if (ax === undefined || bx === undefined) return 0;
        if (ax < bx) return sortDir === 'asc' ? -1 : 1;
        if (ax > bx) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [tableObj, dataFilter, sortCol, sortDir]);

  function toggleSort(idx: number): void {
    if (sortCol === idx) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(idx);
      setSortDir('asc');
    }
  }

  function selectDataTable(name: string): void {
    setDataTable(name);
    setSortCol(undefined);
    setDataFilter('');
  }

  // Join tab state
  const [joinA, setJoinA] = useState<string>('users');
  const [joinB, setJoinB] = useState<string>('orders');
  const tableA: DbTable = TABLES.find((t) => t.name === joinA) ?? TABLES[0]!;
  const tableB: DbTable = TABLES.find((t) => t.name === joinB) ?? TABLES[1]!;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('databaseTool')}
      title="Database Tool"
      subtitle="Query · Schema · Data · JOIN suggester"
      width={1240}
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            <Chip tone="info" size="sm">
              postgres://prod-replica
            </Chip>
            <span>
              latency:{' '}
              <span className="font-mono text-ink-1">12ms</span>
            </span>
            <span>
              tables:{' '}
              <span className="font-mono text-ink-1">{TABLES.length}</span>
            </span>
          </div>
          <Button size="xs" tone="ghost" onClick={() => close('databaseTool')}>
            Close
          </Button>
        </div>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="join">JOIN suggester</TabsTrigger>
        </TabsList>

        <TabsContent value="query">
          <QueryTab
            queryId={queryId}
            selectedQuery={selectedQuery}
            editorSql={editorSql}
            showPlan={showPlan}
            onChooseQuery={chooseQuery}
            onTogglePlan={() => setShowPlan((p) => !p)}
          />
        </TabsContent>

        <TabsContent value="schema">
          <SchemaTab />
        </TabsContent>

        <TabsContent value="data">
          <DataTab
            dataTable={dataTable}
            tableObj={tableObj}
            filteredRows={filteredRows}
            sortCol={sortCol}
            sortDir={sortDir}
            dataFilter={dataFilter}
            onSelectTable={selectDataTable}
            onFilterChange={setDataFilter}
            onToggleSort={toggleSort}
          />
        </TabsContent>

        <TabsContent value="join">
          <JoinTab
            joinA={joinA}
            joinB={joinB}
            tableA={tableA}
            tableB={tableB}
            onChangeA={setJoinA}
            onChangeB={setJoinB}
          />
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}
