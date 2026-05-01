import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  apiCards,
  peers,
  permissions,
  recentProbes,
  voices,
  type ApiId,
  type ProbeStatus,
} from './helpers';

const statusTone: Record<ProbeStatus, 'static' | 'warn' | 'err' | 'muted' | 'info'> = {
  granted: 'static',
  ok: 'static',
  prompt: 'warn',
  denied: 'err',
  idle: 'muted',
  unsupported: 'muted',
};

export function WebApisProbeOverlay() {
  const open = useUiStore((s) => s.overlays.webApisProbe.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [filter, setFilter] = useState<ApiId | 'all'>('all');
  const [voice, setVoice] = useState<string>(voices[0]?.name ?? '');
  const [text, setText] = useState<string>('Hello from Web Speech.');

  const visible = useMemo(() => {
    if (filter === 'all') return apiCards;
    return apiCards.filter((c) => c.id === filter);
  }, [filter]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('webApisProbe'))}
      title="Web APIs probe"
      subtitle="Permissions · Geolocation · MediaDevices · WebRTC · Speech"
      size="lg"
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Filter</span>
        <ToggleChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </ToggleChip>
        {apiCards.map((c) => (
          <ToggleChip
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </ToggleChip>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="grid grid-cols-2 gap-2 p-3">
          {visible.map((card) => (
            <div
              key={card.id}
              className="rounded-sm border border-line bg-bg p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink-1">{card.label}</span>
                <Chip tone={statusTone[card.status]} size="xs">
                  {card.status}
                </Chip>
              </div>

              {card.id === 'webrtc' ? (
                <div className="mt-2">
                  <svg
                    width={300}
                    height={80}
                    viewBox="0 0 300 80"
                    className="block"
                    role="img"
                    aria-label="webrtc peers"
                  >
                    <circle cx={50} cy={40} r={18} fill="rgb(99 102 241 / 0.15)" stroke="rgb(99 102 241)" />
                    <text x={50} y={44} textAnchor="middle" fontSize={10} fontFamily="ui-monospace">A</text>
                    <circle cx={250} cy={40} r={18} fill="rgb(20 184 166 / 0.15)" stroke="rgb(20 184 166)" />
                    <text x={250} y={44} textAnchor="middle" fontSize={10} fontFamily="ui-monospace">B</text>
                    <line x1={68} y1={40} x2={232} y2={40} stroke="rgb(99 102 241 / 0.5)" strokeWidth={2} strokeDasharray="4 4" />
                    <text x={150} y={28} textAnchor="middle" fontSize={9} fontFamily="ui-monospace" fill="rgb(75 85 99)">RTC</text>
                  </svg>
                  <ul className="mt-1 divide-y divide-line rounded-sm border border-line bg-bg text-[11px]">
                    {peers.map((p) => (
                      <li key={p.id} className="px-2 py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-ink-1">{p.id}</span>
                          <Chip tone={p.packetsLost > 10 ? 'warn' : 'static'} size="xs">
                            RTT {p.rtt}ms
                          </Chip>
                        </div>
                        <div className="mt-0.5 flex justify-between font-mono text-[10px] text-ink-3">
                          <span>jitter {p.jitter}ms</span>
                          <span>lost {p.packetsLost}</span>
                          <span>↑{(p.bytesSent / 1024).toFixed(0)}K</span>
                          <span>↓{(p.bytesRecv / 1024).toFixed(0)}K</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : card.id === 'speech' ? (
                <div className="mt-2 space-y-1.5">
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="h-6 w-full rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-1 focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} — {v.lang}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    className="w-full rounded-sm border border-line bg-bg p-1.5 text-[11px] text-ink-1 focus:outline-none"
                  />
                  <Button
                    size="xs"
                    tone="default"
                    onClick={() => toast(`Speak (mock): ${voice}`)}
                  >
                    Speak (mock)
                  </Button>
                </div>
              ) : card.id === 'permissions' ? (
                <ul className="mt-2 divide-y divide-line rounded-sm border border-line bg-bg text-[11px]">
                  {permissions.map((p) => (
                    <li
                      key={p.name}
                      className="flex items-center justify-between px-2 py-1"
                    >
                      <span className="font-mono text-ink-1">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Chip
                          tone={
                            p.state === 'granted'
                              ? 'static'
                              : p.state === 'denied'
                                ? 'err'
                                : 'warn'
                          }
                          size="xs"
                        >
                          {p.state}
                        </Chip>
                        <Button
                          size="xs"
                          tone="ghost"
                          onClick={() =>
                            toast(`Requested ${p.name} permission (mock)`)
                          }
                        >
                          Request
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <CodeBlock
                  className="mt-2"
                  code={card.result}
                  language="json"
                  showLineNumbers={false}
                  maxHeight={80}
                />
              )}

              <div className="mt-2">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Probed ${card.label}`)}
                >
                  Probe
                </Button>
              </div>
            </div>
          ))}
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Recent probes
          </div>
          <ul className="mt-1 space-y-1">
            {recentProbes.map((p) => (
              <li
                key={p.id}
                className={cn(
                  'rounded-sm border border-line bg-bg px-2 py-1 text-[11px]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-ink-1">{p.api}</span>
                  <span className="font-mono text-[10px] text-ink-3">{p.ts}</span>
                </div>
                <div className="text-[11px] text-ink-2">{p.message}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
