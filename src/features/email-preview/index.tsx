import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea, Switch } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  EMAIL_TEMPLATES,
  applyVars,
  clientLabel,
  localeLabel,
  type EmailClient,
  type EmailLocale,
  type EmailTemplate,
  type EmailBlock,
} from './helpers';

const VARS: Record<string, string> = { name: 'Alex', id: '1284' };

function ClientFrame({
  client,
  template,
  locale,
  darkMode,
  imagesBlocked,
  previewOverride,
}: {
  client: EmailClient;
  template: EmailTemplate;
  locale: EmailLocale;
  darkMode: boolean;
  imagesBlocked: boolean;
  previewOverride: string;
}) {
  const variant = template.locales[locale];
  const subject = applyVars(variant.subject, VARS);
  const preview = previewOverride.length > 0 ? previewOverride : applyVars(variant.preview, VARS);
  const accent =
    client === 'gmail' ? '#1a73e8' : client === 'outlook' ? '#0078d4' : '#1d6dfd';
  const bg = darkMode ? '#1f1f1f' : '#ffffff';
  const ink = darkMode ? '#ececec' : '#1f1f1f';
  const muted = darkMode ? '#9b9b9b' : '#5f6368';
  const surface = darkMode ? '#2a2a2a' : '#f6f8fc';

  const width = 480;
  const height = 540;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className="rounded-sm border border-line bg-bg shadow-sm"
      role="img"
      aria-label={`${clientLabel(client)} preview`}
    >
      <rect x="0" y="0" width={width} height={height} fill={bg} />
      {/* client chrome */}
      <rect x="0" y="0" width={width} height={36} fill={surface} />
      <circle cx="14" cy="18" r="5" fill={accent} />
      <text x="26" y="22" fill={ink} fontSize="12" fontWeight="600" fontFamily="system-ui">
        {clientLabel(client)}
      </text>
      <text x={width - 14} y="22" fill={muted} fontSize="10" fontFamily="system-ui" textAnchor="end">
        Inbox · Now
      </text>
      {/* subject */}
      <text x="20" y="64" fill={ink} fontSize="14" fontWeight="700" fontFamily="system-ui">
        {subject.length > 56 ? `${subject.slice(0, 56)}…` : subject}
      </text>
      <text x="20" y="82" fill={muted} fontSize="11" fontFamily="system-ui">
        {preview.length > 70 ? `${preview.slice(0, 70)}…` : preview}
      </text>
      {/* content frame */}
      <rect
        x="20"
        y="100"
        width={width - 40}
        height={height - 120}
        fill={darkMode ? '#262626' : '#ffffff'}
        stroke={darkMode ? '#3a3a3a' : '#e6e8eb'}
      />
      <BlockSvg
        blocks={variant.blocks}
        accent={accent}
        ink={ink}
        muted={muted}
        x={32}
        y={120}
        width={width - 64}
        imagesBlocked={imagesBlocked}
      />
      {/* footer */}
      <text x={width / 2} y={height - 8} fill={muted} fontSize="9" fontFamily="system-ui" textAnchor="middle">
        Quanta Inc · {clientLabel(client)} render · {localeLabel(locale)}
      </text>
    </svg>
  );
}

function BlockSvg({
  blocks,
  accent,
  ink,
  muted,
  x,
  y,
  width,
  imagesBlocked,
}: {
  blocks: ReadonlyArray<EmailBlock>;
  accent: string;
  ink: string;
  muted: string;
  x: number;
  y: number;
  width: number;
  imagesBlocked: boolean;
}) {
  let cursor = y;
  const out: JSX.Element[] = [];
  blocks.forEach((b, i) => {
    if (b.kind === 'heading') {
      out.push(
        <text key={i} x={x} y={cursor} fill={ink} fontSize="16" fontWeight="700" fontFamily="system-ui">
          {b.text ?? ''}
        </text>,
      );
      cursor += 26;
    } else if (b.kind === 'paragraph') {
      const text = b.text ?? '';
      const wrap = wrapText(text, 56);
      wrap.forEach((line, k) => {
        out.push(
          <text
            key={`${i}-p-${k}`}
            x={x}
            y={cursor + k * 16}
            fill={ink}
            fontSize="11"
            fontFamily="system-ui"
          >
            {line}
          </text>,
        );
      });
      cursor += wrap.length * 16 + 8;
    } else if (b.kind === 'button') {
      out.push(
        <g key={i}>
          <rect
            x={x}
            y={cursor - 4}
            width={width - 32}
            height={32}
            rx={4}
            fill={accent}
          />
          <text
            x={x + (width - 32) / 2}
            y={cursor + 16}
            fill="#ffffff"
            fontSize="12"
            fontWeight="600"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {b.text ?? ''}
          </text>
        </g>,
      );
      cursor += 44;
    } else if (b.kind === 'divider') {
      out.push(
        <line key={i} x1={x} y1={cursor} x2={x + width - 32} y2={cursor} stroke={muted} strokeOpacity="0.3" />,
      );
      cursor += 12;
    } else if (b.kind === 'image') {
      if (imagesBlocked) {
        out.push(
          <g key={i}>
            <rect x={x} y={cursor} width={width - 32} height={60} fill="none" stroke={muted} strokeDasharray="3 3" />
            <text x={x + 8} y={cursor + 34} fill={muted} fontSize="10" fontFamily="system-ui">
              [image blocked]
            </text>
          </g>,
        );
      } else {
        out.push(
          <rect key={i} x={x} y={cursor} width={width - 32} height={60} fill={accent} fillOpacity="0.15" />,
        );
      }
      cursor += 70;
    } else if (b.kind === 'list') {
      const items = b.items ?? [];
      items.forEach((it, k) => {
        out.push(
          <g key={`${i}-l-${k}`}>
            <circle cx={x + 4} cy={cursor + k * 18 - 4} r={2} fill={muted} />
            <text x={x + 14} y={cursor + k * 18} fill={ink} fontSize="11" fontFamily="system-ui">
              {it}
            </text>
          </g>,
        );
      });
      cursor += items.length * 18 + 6;
    }
  });
  return <>{out}</>;
}

function wrapText(text: string, max: number): string[] {
  if (text.length <= max) return [text];
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
  }
  if (line) out.push(line);
  return out.slice(0, 6);
}

export function EmailPreviewOverlay() {
  const open = useUiStore((s) => s.overlays.emailPreview.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [templateId, setTemplateId] = useState<string>(EMAIL_TEMPLATES[0]?.id ?? '');
  const [locale, setLocale] = useState<EmailLocale>('en');
  const [client, setClient] = useState<EmailClient>('gmail');
  const [darkMode, setDarkMode] = useState(false);
  const [imagesBlocked, setImagesBlocked] = useState(false);
  const [linkTracking, setLinkTracking] = useState(true);
  const [previewText, setPreviewText] = useState('');

  const template = useMemo(
    () => EMAIL_TEMPLATES.find((t) => t.id === templateId) ?? EMAIL_TEMPLATES[0],
    [templateId],
  );

  if (!template) return null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('emailPreview')}
      title="Email preview"
      subtitle="Transactional templates · multi-client render"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Spam check: 1.2 / 10 (mock)')}>
            Run spam check
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('HTML exported (mock)')}>
            Export HTML
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast(`Test sent to ${client} (mock)`)}>
            Send test
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">template</span>
        <div className="flex flex-wrap gap-1">
          {EMAIL_TEMPLATES.map((t) => (
            <ToggleChip key={t.id} active={t.id === templateId} onClick={() => setTemplateId(t.id)}>
              {t.name}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">locale</span>
        <div className="flex gap-1">
          {(['en', 'ko', 'ja'] as const).map((l) => (
            <ToggleChip key={l} active={l === locale} onClick={() => setLocale(l)}>
              {localeLabel(l)}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">client</span>
        <div className="flex gap-1">
          {(['gmail', 'outlook', 'apple-mail'] as const).map((c) => (
            <ToggleChip key={c} active={c === client} onClick={() => setClient(c)}>
              {clientLabel(c)}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px_300px]">
        <div className="p-3 hairline-r">
          <div className="mb-2 flex items-center gap-2">
            <Chip tone="muted" size="xs">
              {template.clients.find((c) => c.client === client)?.width ?? 600}px
            </Chip>
            <span className="text-[11px] text-ink-3">
              {template.clients.find((c) => c.client === client)?.note}
            </span>
          </div>
          <ClientFrame
            client={client}
            template={template}
            locale={locale}
            darkMode={darkMode}
            imagesBlocked={imagesBlocked}
            previewOverride={previewText}
          />
        </div>

        <div className="hairline-r p-3">
          <div className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">
            A/B subject variants
          </div>
          <ul className="space-y-1.5">
            {template.abVariants.map((v) => (
              <li
                key={v.id}
                className="rounded-sm border border-line bg-bg p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Chip tone="accent" size="xs">{v.id.toUpperCase()}</Chip>
                  <span className="ml-auto font-mono text-[11px] text-ink-2">
                    {v.predictedOpenRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 truncate text-ink-1">{applyVars(v.subject, VARS)}</div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-subtle">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.min(v.predictedOpenRate, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              preview text
            </div>
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder={template.locales[locale].preview}
              className="h-16 w-full resize-none rounded-sm border border-line bg-bg p-2 text-xs text-ink-1"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-3">
            <div className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">audit</div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between rounded-sm border border-line bg-bg p-2">
                <span>Dark mode</span>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} label="Dark mode" />
              </label>
              <label className="flex items-center justify-between rounded-sm border border-line bg-bg p-2">
                <span>Images blocked</span>
                <Switch
                  checked={imagesBlocked}
                  onCheckedChange={setImagesBlocked}
                  label="Images blocked"
                />
              </label>
              <label className="flex items-center justify-between rounded-sm border border-line bg-bg p-2">
                <span>Link tracking</span>
                <Switch
                  checked={linkTracking}
                  onCheckedChange={setLinkTracking}
                  label="Link tracking"
                />
              </label>
            </div>

            <div className="mt-3 mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              tracking params
            </div>
            <div className="flex flex-wrap gap-1">
              {template.trackingLinks.length === 0 ? (
                <span className="text-[11px] text-ink-3">none (auth template)</span>
              ) : (
                template.trackingLinks.map((p) => (
                  <Chip key={p} tone="info" size="xs">
                    {p}
                  </Chip>
                ))
              )}
            </div>

            <div className="mt-3 rounded-sm border border-line bg-bg-subtle p-2 text-[11px] text-ink-2">
              <div className="mb-1 font-medium text-ink-1">Image-blocked fallback</div>
              <div className="text-ink-3">
                {imagesBlocked
                  ? 'Hero replaced with alt text. Buttons render as text links.'
                  : 'Toggle "Images blocked" to preview alt-text rendering.'}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}
