import { toast } from 'sonner';
import { cn } from '@shared/lib/cn';
import {
  KIND_LABEL,
  cacheBuckets,
  cookies,
  formatBytes,
  idbDbs,
  type KvEntry,
  type RecordView,
  type StoreKind,
} from '../helpers';

interface KvTableProps {
  kind: StoreKind;
  rows: ReadonlyArray<KvEntry>;
  selRecord: RecordView | null;
  onSelectRecord(r: RecordView): void;
}

export function KvTable({ kind, rows, selRecord, onSelectRecord }: KvTableProps) {
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-bg-subtle text-ink-3">
        <tr>
          <th className="px-2 py-1 text-left font-medium">key</th>
          <th className="px-2 py-1 text-left font-medium">value</th>
          <th className="px-2 py-1 text-right font-medium">bytes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr
            key={e.key}
            onClick={() =>
              onSelectRecord({
                title: e.key,
                json: e.value,
                meta: [
                  { k: 'bytes', v: String(e.bytes) },
                  { k: 'type', v: KIND_LABEL[kind] },
                ],
              })
            }
            className={cn(
              'cursor-pointer border-t border-line hover:bg-bg-subtle',
              selRecord?.title === e.key && 'bg-accent-soft',
            )}
          >
            <td className="px-2 py-1 font-mono text-ink-1">{e.key}</td>
            <td className="px-2 py-1 font-mono text-ink-2 truncate">
              <input
                defaultValue={e.value}
                onClick={(ev) => ev.stopPropagation()}
                onBlur={() => toast(`Saved ${e.key}`)}
                className="w-full bg-transparent focus:outline-none"
              />
            </td>
            <td className="px-2 py-1 text-right font-mono text-ink-3">
              {e.bytes}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface CookieTableProps {
  search: string;
  selRecord: RecordView | null;
  onSelectRecord(r: RecordView): void;
}

export function CookieTable({ search, selRecord, onSelectRecord }: CookieTableProps) {
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-bg-subtle text-ink-3">
        <tr>
          <th className="px-2 py-1 text-left">name</th>
          <th className="px-2 py-1 text-left">value</th>
          <th className="px-2 py-1 text-left">domain</th>
          <th className="px-2 py-1 text-left">path</th>
          <th className="px-2 py-1 text-left">expires</th>
          <th className="px-2 py-1 text-left">sameSite</th>
        </tr>
      </thead>
      <tbody>
        {cookies
          .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
          .map((c) => (
            <tr
              key={c.name}
              onClick={() =>
                onSelectRecord({
                  title: c.name,
                  json: JSON.stringify(c, null, 2),
                  meta: [
                    { k: 'bytes', v: String(c.bytes) },
                    { k: 'sameSite', v: c.sameSite },
                    { k: 'expires', v: c.expires },
                  ],
                })
              }
              className={cn(
                'cursor-pointer border-t border-line hover:bg-bg-subtle',
                selRecord?.title === c.name && 'bg-accent-soft',
              )}
            >
              <td className="px-2 py-1 font-mono text-ink-1">{c.name}</td>
              <td className="px-2 py-1 font-mono text-ink-2 truncate">
                {c.value}
              </td>
              <td className="px-2 py-1 font-mono text-ink-3">{c.domain}</td>
              <td className="px-2 py-1 font-mono text-ink-3">{c.path}</td>
              <td className="px-2 py-1 font-mono text-ink-3">{c.expires}</td>
              <td className="px-2 py-1 font-mono text-ink-3">{c.sameSite}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

interface IdbTableProps {
  idbSel: { db: string; store: string };
  search: string;
  selRecord: RecordView | null;
  onSelectRecord(r: RecordView): void;
}

export function IdbTable({ idbSel, search, selRecord, onSelectRecord }: IdbTableProps) {
  const records =
    idbDbs.find((d) => d.name === idbSel.db)?.stores.find((s) => s.name === idbSel.store)
      ?.records ?? [];
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-bg-subtle text-ink-3">
        <tr>
          <th className="px-2 py-1 text-left">key</th>
          <th className="px-2 py-1 text-left">value preview</th>
        </tr>
      </thead>
      <tbody>
        {records
          .filter((r) => r.key.toLowerCase().includes(search.toLowerCase()))
          .map((r) => (
            <tr
              key={r.key}
              onClick={() =>
                onSelectRecord({
                  title: r.key,
                  json: JSON.stringify(r.value, null, 2),
                  meta: [
                    { k: 'db', v: idbSel.db },
                    { k: 'store', v: idbSel.store },
                  ],
                })
              }
              className={cn(
                'cursor-pointer border-t border-line hover:bg-bg-subtle',
                selRecord?.title === r.key && 'bg-accent-soft',
              )}
            >
              <td className="px-2 py-1 font-mono text-ink-1">{r.key}</td>
              <td className="px-2 py-1 font-mono text-ink-3 truncate">
                {JSON.stringify(r.value)}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

interface CacheTableProps {
  cacheSel: string;
  search: string;
  selRecord: RecordView | null;
  onSelectRecord(r: RecordView): void;
}

export function CacheTable({ cacheSel, search, selRecord, onSelectRecord }: CacheTableProps) {
  const entries = cacheBuckets.find((b) => b.name === cacheSel)?.entries ?? [];
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-bg-subtle text-ink-3">
        <tr>
          <th className="px-2 py-1 text-left">URL</th>
          <th className="px-2 py-1 text-left">method</th>
          <th className="px-2 py-1 text-left">status</th>
          <th className="px-2 py-1 text-right">size</th>
        </tr>
      </thead>
      <tbody>
        {entries
          .filter((e) => e.url.toLowerCase().includes(search.toLowerCase()))
          .map((e) => (
            <tr
              key={e.url}
              onClick={() =>
                onSelectRecord({
                  title: e.url,
                  json: JSON.stringify(e, null, 2),
                  meta: [
                    { k: 'bucket', v: cacheSel },
                    { k: 'method', v: e.method },
                  ],
                })
              }
              className={cn(
                'cursor-pointer border-t border-line hover:bg-bg-subtle',
                selRecord?.title === e.url && 'bg-accent-soft',
              )}
            >
              <td className="px-2 py-1 font-mono text-ink-1 truncate">{e.url}</td>
              <td className="px-2 py-1 font-mono text-ink-3">{e.method}</td>
              <td className="px-2 py-1 font-mono text-ink-3">{e.status}</td>
              <td className="px-2 py-1 text-right font-mono text-ink-3">
                {formatBytes(e.bytes)}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
