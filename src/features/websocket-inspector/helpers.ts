export type WSStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type FrameKind = 'text' | 'binary' | 'ping' | 'pong' | 'close';
export type FrameDirection = 'in' | 'out';

export interface WSFrame {
  id: string;
  kind: FrameKind;
  direction: FrameDirection;
  size: number;
  ts: number;
  payloadPreview: string;
  payload: string;
  latencyMs?: number;
  roomId?: string;
}

export interface WSConnection {
  id: string;
  url: string;
  status: WSStatus;
  protocol: string;
  pingMs: number;
  openedAt: string;
  frameCount: number;
  frames: ReadonlyArray<WSFrame>;
}

export interface WSRoom {
  id: string;
  name: string;
  members: ReadonlyArray<string>;
}

export const WS_ROOMS: ReadonlyArray<WSRoom> = [
  { id: 'r-design', name: 'design-team', members: ['alex', 'sam', 'priya', 'kim'] },
  { id: 'r-deploy', name: 'deploy-bot', members: ['alex', 'CI', 'cd-runner'] },
  { id: 'r-cs', name: 'cs-pulse', members: ['alex', 'priya', 'jin', 'rui', 'theo'] },
  { id: 'r-perf', name: 'perf-dash', members: ['alex'] },
];

function genFrames(seed: number, count: number): WSFrame[] {
  const out: WSFrame[] = [];
  let t = 0;
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >>> 0) / 0x80000000;
  };
  const kinds: FrameKind[] = ['text', 'text', 'text', 'text', 'binary', 'ping', 'pong'];
  const rooms = WS_ROOMS.map((r) => r.id);
  for (let i = 0; i < count; i++) {
    t += Math.round(rng() * 2200) + 80;
    const kind = kinds[Math.floor(rng() * kinds.length)] ?? 'text';
    const direction: FrameDirection = rng() > 0.5 ? 'in' : 'out';
    const size = kind === 'ping' || kind === 'pong' ? 0 : Math.round(rng() * 1800) + 24;
    const room = rooms[Math.floor(rng() * rooms.length)];
    const payload =
      kind === 'text'
        ? JSON.stringify(
            {
              type: ['cursor.move', 'doc.patch', 'presence.heartbeat', 'chat.message'][
                Math.floor(rng() * 4)
              ],
              roomId: room,
              data: { x: Math.round(rng() * 800), y: Math.round(rng() * 600), seq: i },
            },
            null,
            2,
          )
        : kind === 'binary'
          ? `<Binary ${size} bytes>`
          : kind === 'close'
            ? '{"code": 1000, "reason": "client closed"}'
            : '';
    out.push({
      id: `f-${seed}-${i}`,
      kind,
      direction,
      size,
      ts: t,
      payloadPreview:
        kind === 'text'
          ? (payload.split('\n')[1] ?? payload).slice(0, 56)
          : kind === 'binary'
            ? `binary ${size}B`
            : kind,
      payload,
      latencyMs: kind === 'pong' ? Math.round(rng() * 60) + 10 : undefined,
      roomId: room,
    });
  }
  return out;
}

export const WS_CONNECTIONS: ReadonlyArray<WSConnection> = [
  {
    id: 'ws-1',
    url: 'wss://realtime.quanta.app/v1/socket',
    status: 'connected',
    protocol: 'phoenix.v2',
    pingMs: 18,
    openedAt: '12:04:31',
    frameCount: 30,
    frames: genFrames(42, 30),
  },
  {
    id: 'ws-2',
    url: 'wss://collab.quanta.app/yjs',
    status: 'connecting',
    protocol: 'yjs',
    pingMs: 92,
    openedAt: '12:11:08',
    frameCount: 30,
    frames: genFrames(91, 30),
  },
  {
    id: 'ws-3',
    url: 'wss://logs.quanta.app/tail',
    status: 'error',
    protocol: 'plain',
    pingMs: 350,
    openedAt: '11:58:02',
    frameCount: 30,
    frames: genFrames(7, 30),
  },
];

export function frameKindTone(k: FrameKind): 'accent' | 'info' | 'warn' | 'err' | 'muted' {
  if (k === 'text') return 'accent';
  if (k === 'binary') return 'info';
  if (k === 'ping' || k === 'pong') return 'muted';
  return 'err';
}

export function statusTone(s: WSStatus): 'static' | 'warn' | 'muted' | 'err' {
  if (s === 'connected') return 'static';
  if (s === 'connecting') return 'warn';
  if (s === 'error') return 'err';
  return 'muted';
}
