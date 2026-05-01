import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { OverlayPanel } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import {
  KIND_LABEL,
  cacheBuckets,
  cookies,
  formatBytes,
  idbDbs,
  localKv,
  sessionKv,
  totalBytesCache,
  totalBytesCookies,
  totalBytesIdb,
  totalBytesLocal,
  totalBytesSession,
  type RecordView,
  type StoreKind,
} from './helpers';
import {
  CacheTable,
  CookieTable,
  IdbTable,
  KvTable,
} from './parts/RecordTables';
import { RecordRail } from './parts/RecordRail';
import { StoreSidebar } from './parts/StoreSidebar';

export function StorageExplorerOverlay() {
  const open = useUiStore((s) => s.overlays.storageExplorer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kind, setKind] = useState<StoreKind>('local');
  const [search, setSearch] = useState('');
  const [idbSel, setIdbSel] = useState<{ db: string; store: string }>({
    db: idbDbs[0]?.name ?? '',
    store: idbDbs[0]?.stores[0]?.name ?? '',
  });
  const [cacheSel, setCacheSel] = useState<string>(cacheBuckets[0]?.name ?? '');
  const [selRecord, setSelRecord] = useState<RecordView | null>(null);

  const counts: Record<StoreKind, number> = {
    local: localKv.length,
    session: sessionKv.length,
    cookie: cookies.length,
    idb: idbDbs.reduce(
      (a, d) => a + d.stores.reduce((b, s) => b + s.records.length, 0),
      0,
    ),
    cache: cacheBuckets.reduce((a, b) => a + b.entries.length, 0),
  };
  const bytes: Record<StoreKind, number> = {
    local: totalBytesLocal(),
    session: totalBytesSession(),
    cookie: totalBytesCookies(),
    idb: totalBytesIdb(),
    cache: totalBytesCache(),
  };
  const totalBytes =
    bytes.local + bytes.session + bytes.cookie + bytes.idb + bytes.cache;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (kind === 'local') return localKv.filter((e) => e.key.toLowerCase().includes(q));
    if (kind === 'session') return sessionKv.filter((e) => e.key.toLowerCase().includes(q));
    return [];
  }, [kind, search]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('storageExplorer'))}
      title="Storage explorer"
      subtitle="LocalStorage · SessionStorage · Cookies · IndexedDB · Cache API"
      size="xl"
      footer={
        <span className="text-[10px] text-ink-3">
          {counts.local + counts.session + counts.cookie + counts.idb + counts.cache} items
          · {formatBytes(totalBytes)}
        </span>
      }
    >
      <div className="grid grid-cols-[260px_1fr_300px] divide-x divide-line">
        <StoreSidebar
          kind={kind}
          onKindChange={(k) => {
            setKind(k);
            setSelRecord(null);
          }}
          counts={counts}
          idbSel={idbSel}
          onIdbSelChange={setIdbSel}
          cacheSel={cacheSel}
          onCacheSelChange={setCacheSel}
        />

        <section className="flex min-h-0 flex-col">
          <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">
              {KIND_LABEL[kind]}
            </span>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Filter ${KIND_LABEL[kind]}…`}
              className="ml-auto w-56"
            />
          </div>
          <div className="overflow-auto p-2">
            {kind === 'local' || kind === 'session' ? (
              <KvTable
                kind={kind}
                rows={filtered}
                selRecord={selRecord}
                onSelectRecord={setSelRecord}
              />
            ) : null}

            {kind === 'cookie' ? (
              <CookieTable
                search={search}
                selRecord={selRecord}
                onSelectRecord={setSelRecord}
              />
            ) : null}

            {kind === 'idb' ? (
              <IdbTable
                idbSel={idbSel}
                search={search}
                selRecord={selRecord}
                onSelectRecord={setSelRecord}
              />
            ) : null}

            {kind === 'cache' ? (
              <CacheTable
                cacheSel={cacheSel}
                search={search}
                selRecord={selRecord}
                onSelectRecord={setSelRecord}
              />
            ) : null}
          </div>
        </section>

        <RecordRail selRecord={selRecord} counts={counts} bytes={bytes} />
      </div>
    </OverlayPanel>
  );
}
