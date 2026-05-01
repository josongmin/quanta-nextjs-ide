import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  DEVICE_TARGETS,
  PUSH_KINDS,
  RECENT_SENDS,
  VAPID_PUBLIC_KEY,
  buildPayload,
  deviceLabel,
  type DeviceTarget,
  type PushKind,
  type PushNotificationDef,
} from './helpers';

interface DraftState {
  title: string;
  body: string;
  iconUrl: string;
  actions: ReadonlyArray<{ action: string; title: string }>;
}

function DeviceFrame({
  device,
  draft,
  base,
}: {
  device: DeviceTarget;
  draft: DraftState;
  base: PushNotificationDef;
}) {
  const w = 360;
  const h = 156;
  if (device === 'ios-safari') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" className="rounded-md">
        <defs>
          <linearGradient id="ios-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a3a3c" stopOpacity="0.95" />
            <stop offset="1" stopColor="#1c1c1e" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={w} height={h} rx={20} fill="url(#ios-bg)" />
        <rect x="14" y="14" width="22" height="22" rx="5" fill="#ffffff" fillOpacity="0.15" />
        <text x="44" y="24" fill="#fff" fontSize="10" fontWeight="600" fontFamily="system-ui">QUANTA</text>
        <text x={w - 14} y="24" fill="#9b9b9b" fontSize="10" textAnchor="end" fontFamily="system-ui">now</text>
        <text x="14" y="56" fill="#fff" fontSize="13" fontWeight="600" fontFamily="system-ui">
          {truncate(draft.title, 40)}
        </text>
        {wrapLines(draft.body, 50, 2).map((line, i) => (
          <text key={i} x="14" y={76 + i * 16} fill="#e6e6e6" fontSize="11" fontFamily="system-ui">
            {line}
          </text>
        ))}
        <text x="14" y={h - 14} fill="#7a7a7a" fontSize="9" fontFamily="system-ui">
          Lock screen · iOS
        </text>
        {base.actions.length > 0 ? (
          <text x={w - 14} y={h - 14} fill="#0a84ff" fontSize="10" textAnchor="end" fontFamily="system-ui">
            Press for actions
          </text>
        ) : null}
      </svg>
    );
  }
  if (device === 'android-chrome') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" className="rounded-md">
        <rect x="0" y="0" width={w} height={h} rx={4} fill="#ffffff" stroke="#dcdcdc" />
        <rect x="14" y="14" width="20" height="20" rx="10" fill="#1a73e8" />
        <text x="40" y="24" fill="#5f6368" fontSize="10" fontFamily="Roboto, system-ui">
          Chrome · quanta.app · now
        </text>
        <text x="14" y="52" fill="#202124" fontSize="13" fontWeight="600" fontFamily="Roboto, system-ui">
          {truncate(draft.title, 42)}
        </text>
        {wrapLines(draft.body, 56, 2).map((line, i) => (
          <text key={i} x="14" y={70 + i * 16} fill="#3c4043" fontSize="11" fontFamily="Roboto, system-ui">
            {line}
          </text>
        ))}
        <line x1="14" y1={h - 32} x2={w - 14} y2={h - 32} stroke="#e6e6e6" />
        {base.actions.slice(0, 2).map((a, i) => (
          <text
            key={a.action}
            x={14 + i * 110}
            y={h - 14}
            fill="#1a73e8"
            fontSize="11"
            fontWeight="600"
            fontFamily="Roboto, system-ui"
          >
            {a.title.toUpperCase()}
          </text>
        ))}
      </svg>
    );
  }
  if (device === 'desktop-chrome') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" className="rounded-md">
        <rect x="0" y="0" width={w} height={h} rx={6} fill="#fafafa" stroke="#d0d0d0" />
        <text x="14" y="22" fill="#5f6368" fontSize="10" fontFamily="system-ui">
          Google Chrome · quanta.app
        </text>
        <rect x="14" y="32" width="32" height="32" rx="3" fill="#1a73e8" fillOpacity="0.15" />
        <text x="56" y="46" fill="#202124" fontSize="13" fontWeight="600" fontFamily="system-ui">
          {truncate(draft.title, 36)}
        </text>
        {wrapLines(draft.body, 40, 2).map((line, i) => (
          <text key={i} x="56" y={64 + i * 14} fill="#3c4043" fontSize="11" fontFamily="system-ui">
            {line}
          </text>
        ))}
        <line x1="14" y1={h - 30} x2={w - 14} y2={h - 30} stroke="#e6e6e6" />
        {base.actions.slice(0, 2).map((a, i) => (
          <g key={a.action}>
            <rect x={14 + i * 110} y={h - 24} width="100" height="18" rx="3" fill="none" stroke="#dadce0" />
            <text
              x={14 + i * 110 + 50}
              y={h - 12}
              fill="#1a73e8"
              fontSize="10"
              fontFamily="system-ui"
              textAnchor="middle"
            >
              {a.title}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  // desktop-firefox
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" className="rounded-md">
      <rect x="0" y="0" width={w} height={h} rx={4} fill="#1f1f1f" />
      <text x="14" y="22" fill="#a3a3a3" fontSize="10" fontFamily="system-ui">
        Firefox · quanta.app
      </text>
      <rect x="14" y="32" width="28" height="28" rx="2" fill="#ff7139" fillOpacity="0.2" />
      <text x="50" y="46" fill="#fff" fontSize="13" fontWeight="600" fontFamily="system-ui">
        {truncate(draft.title, 36)}
      </text>
      {wrapLines(draft.body, 42, 2).map((line, i) => (
        <text key={i} x="50" y={62 + i * 14} fill="#cdcdcd" fontSize="11" fontFamily="system-ui">
          {line}
        </text>
      ))}
      <text x={w - 14} y={h - 14} fill="#9b9b9b" fontSize="9" textAnchor="end" fontFamily="system-ui">
        Notification Center
      </text>
    </svg>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function wrapLines(text: string, max: number, maxLines: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      out.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
    if (out.length >= maxLines) break;
  }
  if (line && out.length < maxLines) out.push(line);
  return out.slice(0, maxLines);
}

export function PushNotificationLabOverlay() {
  const open = useUiStore((s) => s.overlays.pushNotificationLab.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kindId, setKindId] = useState<PushKind>('transactional');
  const [target, setTarget] = useState<DeviceTarget>('ios-safari');
  const base = useMemo(
    () => PUSH_KINDS.find((k) => k.id === kindId) ?? PUSH_KINDS[0]!,
    [kindId],
  );
  const [draft, setDraft] = useState<DraftState>({
    title: base.title,
    body: base.body,
    iconUrl: base.iconUrl,
    actions: base.actions,
  });

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('pushNotificationLab')}
      title="Push notification lab"
      subtitle="Web push & in-app banner builder"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('VAPID copied (mock)')}>
            Copy VAPID
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast(`Push sent to ${deviceLabel(target)} (mock)`)}>
            Send push
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">kind</span>
        <div className="flex flex-wrap gap-1">
          {PUSH_KINDS.map((k) => (
            <ToggleChip
              key={k.id}
              active={k.id === kindId}
              onClick={() => {
                setKindId(k.id);
                setDraft({ title: k.title, body: k.body, iconUrl: k.iconUrl, actions: k.actions });
              }}
            >
              {k.label}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">target</span>
        <div className="flex gap-1">
          {DEVICE_TARGETS.map((d) => (
            <ToggleChip key={d} active={d === target} onClick={() => setTarget(d)}>
              {deviceLabel(d)}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_260px]">
        <div className="hairline-r p-3">
          <div className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">payload editor</div>
          <div className="space-y-2 text-xs">
            <Field label="title">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="h-7 w-full rounded-sm border border-line bg-bg px-2 text-xs"
              />
            </Field>
            <Field label="body">
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                className="h-16 w-full resize-none rounded-sm border border-line bg-bg px-2 py-1 text-xs"
              />
            </Field>
            <Field label="icon URL">
              <input
                value={draft.iconUrl}
                onChange={(e) => setDraft((d) => ({ ...d, iconUrl: e.target.value }))}
                className="h-7 w-full rounded-sm border border-line bg-bg px-2 font-mono text-[11px]"
              />
            </Field>
            <Field label="actions">
              <div className="space-y-1">
                {draft.actions.map((a, i) => (
                  <div key={i} className="flex gap-1">
                    <input
                      value={a.action}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          actions: d.actions.map((x, j) => (j === i ? { ...x, action: e.target.value } : x)),
                        }))
                      }
                      placeholder="action"
                      className="h-7 w-1/3 rounded-sm border border-line bg-bg px-2 font-mono text-[11px]"
                    />
                    <input
                      value={a.title}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          actions: d.actions.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                        }))
                      }
                      placeholder="title"
                      className="h-7 flex-1 rounded-sm border border-line bg-bg px-2 text-xs"
                    />
                  </div>
                ))}
              </div>
            </Field>
            <div className="flex gap-2 text-[11px]">
              <Chip tone="info" size="xs">ttl {base.ttl}s</Chip>
              <Chip tone={base.urgency === 'high' ? 'err' : base.urgency === 'normal' ? 'accent' : 'muted'} size="xs">
                {base.urgency}
              </Chip>
              <Chip tone="muted" size="xs">badge {base.badge}</Chip>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">previews</div>
          <div className="space-y-2">
            {DEVICE_TARGETS.map((d) => (
              <div
                key={d}
                className={`rounded-md ${d === target ? 'ring-1 ring-accent' : ''}`}
              >
                <div className="mb-1 text-[10px] text-ink-3">{deviceLabel(d)}</div>
                <DeviceFrame device={d} draft={draft} base={base} />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">payload</div>
            <CodeBlock
              code={buildPayload({ ...base, title: draft.title, body: draft.body, iconUrl: draft.iconUrl, actions: draft.actions })}
              language="json"
              maxHeight={180}
              showLineNumbers={false}
            />
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">VAPID public</div>
            <button
              type="button"
              onClick={() => toast('VAPID key copied (mock)')}
              className="block w-full break-all rounded-sm border border-line bg-bg-subtle p-2 text-left font-mono text-[10px] text-ink-2 hover:bg-bg-hover"
            >
              {VAPID_PUBLIC_KEY}
            </button>
            <div className="mt-3 mb-1 text-[10px] uppercase tracking-caps text-ink-3">permission</div>
            <Chip tone="static" size="sm">granted</Chip>

            <div className="mt-3 mb-1 text-[10px] uppercase tracking-caps text-ink-3">recent sends</div>
            <ul className="space-y-1">
              {RECENT_SENDS.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-1.5 rounded-sm border border-line bg-bg p-1.5 text-[11px]"
                >
                  <Chip
                    tone={r.status === 'delivered' ? 'static' : r.status === 'failed' ? 'err' : 'warn'}
                    size="xs"
                  >
                    {r.status}
                  </Chip>
                  <span className="truncate text-ink-1">{r.kind}</span>
                  <span className="ml-auto text-ink-3">{r.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] uppercase tracking-caps text-ink-3">{label}</div>
      {children}
    </div>
  );
}
