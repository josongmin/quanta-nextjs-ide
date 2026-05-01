import { type CSSProperties } from 'react';
import { ScrollArea } from '@shared/ui';
import {
  colorByName,
  radiusByName,
  spacingByName,
  typeByName,
  type TokenSet,
} from '../helpers';

interface PreviewPaneProps {
  tokens: TokenSet;
}

export function PreviewPane({ tokens }: PreviewPaneProps): JSX.Element {
  const c = (n: string) => colorByName(tokens, n);
  const s = (n: string) => `${spacingByName(tokens, n)}px`;
  const r = (n: string) => `${radiusByName(tokens, n)}px`;
  const t = (n: string) => typeByName(tokens, n);

  const previewBg: CSSProperties = { background: c('bg') };
  const cardStyle: CSSProperties = {
    background: c('bg'),
    border: `1px solid ${c('line')}`,
    borderRadius: r('r-md'),
    padding: s('s-4'),
    color: c('ink-1'),
  };
  const inputStyle: CSSProperties = {
    background: c('bg'),
    border: `1px solid ${c('line')}`,
    borderRadius: r('r-sm'),
    padding: `${s('s-2')} ${s('s-3')}`,
    color: c('ink-1'),
  };

  return (
    <main className="min-w-0">
      <ScrollArea className="max-h-[68vh]">
        <div className="px-3 py-3" style={previewBg}>
          <h4 className="text-caps text-ink-3">Buttons</h4>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              style={{
                background: c('accent'),
                color: '#ffffff',
                borderRadius: r('r-sm'),
                padding: `${s('s-2')} ${s('s-3')}`,
                fontSize: t('sm')?.fontSize,
                fontWeight: t('md')?.weight,
                border: 'none',
              }}
            >
              Primary
            </button>
            <button
              type="button"
              style={{
                background: c('bg'),
                color: c('ink-1'),
                border: `1px solid ${c('line')}`,
                borderRadius: r('r-sm'),
                padding: `${s('s-2')} ${s('s-3')}`,
                fontSize: t('sm')?.fontSize,
              }}
            >
              Secondary
            </button>
            <button
              type="button"
              style={{
                background: c('accent-soft'),
                color: c('accent'),
                borderRadius: r('r-full'),
                padding: `${s('s-1')} ${s('s-3')}`,
                fontSize: t('xs')?.fontSize,
                border: 'none',
              }}
            >
              Pill
            </button>
          </div>

          <h4 className="text-caps mt-4 text-ink-3">Card</h4>
          <div style={cardStyle} className="mt-2">
            <div className="flex items-center gap-2">
              <span
                style={{
                  background: c('accent-soft'),
                  color: c('accent'),
                  borderRadius: r('r-full'),
                  padding: `2px ${s('s-2')}`,
                  fontSize: 10,
                }}
              >
                new
              </span>
              <span style={{ fontSize: t('lg')?.fontSize, fontWeight: t('lg')?.weight }}>
                Studio launches Wave 8
              </span>
            </div>
            <div
              style={{
                color: c('ink-3'),
                fontSize: t('sm')?.fontSize,
                marginTop: s('s-2'),
              }}
            >
              Six creative overlays · per-route bundle simulation · SLO cockpit
            </div>
          </div>

          <h4 className="text-caps mt-4 text-ink-3">Inputs</h4>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              defaultValue="songmin@quanta.dev"
              style={inputStyle}
              className="w-56"
            />
            <input
              type="text"
              placeholder="search…"
              style={{ ...inputStyle, color: c('ink-3') }}
              className="w-40"
            />
          </div>

          <h4 className="text-caps mt-4 text-ink-3">Dialog</h4>
          <div
            className="mt-2"
            style={{
              background: c('bg'),
              border: `1px solid ${c('line')}`,
              borderRadius: r('r-md'),
              padding: s('s-4'),
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: t('lg')?.fontSize, fontWeight: t('lg')?.weight, color: c('ink-1') }}>
              Confirm rollout
            </div>
            <p style={{ marginTop: s('s-2'), color: c('ink-2'), fontSize: t('sm')?.fontSize }}>
              This will canary at 5% to internal users.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                style={{
                  background: c('bg'),
                  color: c('ink-2'),
                  border: `1px solid ${c('line')}`,
                  borderRadius: r('r-sm'),
                  padding: `${s('s-1')} ${s('s-3')}`,
                  fontSize: t('sm')?.fontSize,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: c('accent'),
                  color: '#fff',
                  borderRadius: r('r-sm'),
                  padding: `${s('s-1')} ${s('s-3')}`,
                  fontSize: t('sm')?.fontSize,
                  border: 'none',
                }}
              >
                Confirm
              </button>
            </div>
          </div>

          <h4 className="text-caps mt-4 text-ink-3">Routes</h4>
          <ul className="mt-2 space-y-1">
            {['/', '/products', '/products/[id]', '/pricing', '/blog'].map((rt) => (
              <li
                key={rt}
                style={{
                  background: c('bg-subtle'),
                  border: `1px solid ${c('line')}`,
                  borderRadius: r('r-sm'),
                  padding: `${s('s-1')} ${s('s-3')}`,
                  fontSize: t('sm')?.fontSize,
                  color: c('ink-1'),
                }}
              >
                {rt}
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </main>
  );
}
