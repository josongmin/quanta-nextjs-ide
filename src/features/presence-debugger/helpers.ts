export type OpStatus = 'pending' | 'acked' | 'conflict';

export interface OptimisticOp {
  id: string;
  kind: string;
  sentAt: number;
  ackedAt: number | null;
  status: OpStatus;
  payload: string;
  expectedAckMs: number;
  conflictReason?: string;
}

export interface PresencePeer {
  id: string;
  name: string;
  color: string;
  lastSeenAgoSec: number;
  currentRoute: string;
  cursor: { x: number; y: number };
  ops: ReadonlyArray<OptimisticOp>;
}

export interface PresenceSession {
  id: string;
  name: string;
  peers: ReadonlyArray<PresencePeer>;
  reconciliationLog: ReadonlyArray<ReconcileEntry>;
}

export interface ReconcileEntry {
  id: string;
  agoSec: number;
  cause: string;
  resolution: string;
  peerId: string;
}

function mkOp(
  id: string,
  kind: string,
  sentAt: number,
  ackedAt: number | null,
  payload: string,
  conflict?: string,
): OptimisticOp {
  return {
    id,
    kind,
    sentAt,
    ackedAt,
    status: conflict ? 'conflict' : ackedAt === null ? 'pending' : 'acked',
    payload,
    expectedAckMs: 200,
    ...(conflict ? { conflictReason: conflict } : {}),
  };
}

export const PRESENCE_SESSION: PresenceSession = {
  id: 'sess-1',
  name: 'design-doc/2024-q1-launch',
  peers: [
    {
      id: 'p-alex',
      name: 'Alex (you)',
      color: '#1d6dfd',
      lastSeenAgoSec: 0,
      currentRoute: '/docs/launch',
      cursor: { x: 412, y: 188 },
      ops: [
        mkOp('o-1', 'text.insert', 1200, 1340, '{"path":"$.title","text":"Q1 Launch"}'),
        mkOp('o-2', 'text.insert', 2400, 2510, '{"path":"$.body","text":"Hero section..."}'),
        mkOp('o-3', 'block.move', 3800, null, '{"from":3,"to":1}'),
        mkOp('o-4', 'comment.add', 4600, null, '{"thread":"t-12","text":"LGTM"}'),
      ],
    },
    {
      id: 'p-sam',
      name: 'Sam',
      color: '#dc2626',
      lastSeenAgoSec: 4,
      currentRoute: '/docs/launch',
      cursor: { x: 220, y: 240 },
      ops: [
        mkOp('o-5', 'text.delete', 1100, 1250, '{"path":"$.body","range":[10,20]}'),
        mkOp('o-6', 'text.insert', 2100, null, '{"path":"$.body","text":"Updated"}', 'concurrent edit on $.body'),
        mkOp('o-7', 'cursor.move', 3000, 3060, '{"x":220,"y":240}'),
      ],
    },
    {
      id: 'p-priya',
      name: 'Priya',
      color: '#1f9d55',
      lastSeenAgoSec: 12,
      currentRoute: '/pricing',
      cursor: { x: 600, y: 100 },
      ops: [
        mkOp('o-8', 'text.insert', 800, 980, '{"path":"$.subtitle","text":"v2"}'),
        mkOp('o-9', 'block.add', 2200, 2330, '{"type":"image","src":"/h.png"}'),
        mkOp('o-10', 'cursor.move', 3500, 3590, '{"x":600,"y":100}'),
      ],
    },
    {
      id: 'p-kim',
      name: 'Kim',
      color: '#9333ea',
      lastSeenAgoSec: 30,
      currentRoute: '/docs/launch',
      cursor: { x: 320, y: 412 },
      ops: [
        mkOp('o-11', 'block.move', 1500, null, '{"from":1,"to":3}', 'rebased onto Alex op-3'),
        mkOp('o-12', 'text.insert', 2700, 2820, '{"path":"$.body","text":" 🎉"}'),
        mkOp('o-13', 'comment.resolve', 4000, 4080, '{"thread":"t-9"}'),
      ],
    },
    {
      id: 'p-jin',
      name: 'Jin',
      color: '#f59e0b',
      lastSeenAgoSec: 90,
      currentRoute: '/billing',
      cursor: { x: 80, y: 80 },
      ops: [
        mkOp('o-14', 'cursor.move', 600, 680, '{"x":80,"y":80}'),
        mkOp('o-15', 'comment.add', 1800, 1900, '{"thread":"t-13","text":"check this"}'),
        mkOp('o-16', 'cursor.move', 3200, null, '{"x":120,"y":140}'),
      ],
    },
    {
      id: 'p-rui',
      name: 'Rui',
      color: '#06b6d4',
      lastSeenAgoSec: 240,
      currentRoute: '/docs/launch',
      cursor: { x: 540, y: 320 },
      ops: [
        mkOp('o-17', 'text.insert', 900, 1010, '{"path":"$.title","text":" 2024"}'),
        mkOp('o-18', 'block.move', 2300, 2400, '{"from":2,"to":4}'),
        mkOp('o-19', 'text.delete', 3800, null, '{"path":"$.title","range":[0,2]}', 'conflict with Alex op-1'),
      ],
    },
  ],
  reconciliationLog: [
    { id: 'l-1', agoSec: 1, cause: 'Concurrent text.insert on $.body', resolution: 'Merged via OT (Sam later)', peerId: 'p-sam' },
    { id: 'l-2', agoSec: 5, cause: 'block.move conflict', resolution: 'Rebased Kim op-11 onto Alex op-3', peerId: 'p-kim' },
    { id: 'l-3', agoSec: 12, cause: 'cursor.move stale', resolution: 'Dropped (older than 2s)', peerId: 'p-jin' },
    { id: 'l-4', agoSec: 18, cause: 'text.delete vs text.insert', resolution: 'Conflict — needs manual merge', peerId: 'p-rui' },
    { id: 'l-5', agoSec: 24, cause: 'Heartbeat missed', resolution: 'Marked Kim away', peerId: 'p-kim' },
    { id: 'l-6', agoSec: 38, cause: 'Reconnect', resolution: 'Replayed 4 ops successfully', peerId: 'p-priya' },
    { id: 'l-7', agoSec: 60, cause: 'Server clock skew detected', resolution: 'Re-synced offsets (-12ms)', peerId: 'p-alex' },
    { id: 'l-8', agoSec: 90, cause: 'Comment thread conflict', resolution: 'Auto-merged (last-write-wins)', peerId: 'p-sam' },
  ],
};

export function relTime(s: number): string {
  if (s < 5) return 'now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function opTone(s: OpStatus): 'static' | 'warn' | 'err' {
  if (s === 'acked') return 'static';
  if (s === 'pending') return 'warn';
  return 'err';
}
