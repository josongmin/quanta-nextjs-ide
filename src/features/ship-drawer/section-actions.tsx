/**
 * Ship-it Drawer / Footer actions.
 *
 * Two primary buttons:
 *   - Ship via Vercel (gradient-accent + glow shadow)
 *   - Open PR (soft tone)
 *
 * The Ship button supports a confirm step ("⌘↵ to confirm"); the second
 * click (or Cmd+Enter) commits the deploy. Successful deploy renders a
 * "Shipped ✓" pill with a tiny confetti burst.
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Kbd, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { deployToVercel } from './vercel-adapter';
import { openPullRequest } from './pr-adapter';
import { useShipDrawerStore } from './store';
import { countBlockers } from './aggregator';
import type { ShipReadiness } from './types';

interface Props {
  readiness: ShipReadiness;
  /** When true, both action buttons are disabled. */
  disabled: boolean;
}

function Confetti() {
  // 6 dots fanning out via CSS keyframes, total ≤500ms.
  const dots = Array.from({ length: 6 });
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      {dots.map((_, i) => {
        return (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'][i],
              animation: `shipConfetti${i} 480ms cubic-bezier(.2,1,.3,1) forwards`,
            }}
          />
        );
      })}
      <style>{`
        ${dots
          .map((_, i) => {
            const angle = (i / dots.length) * Math.PI * 2;
            const dx = Math.cos(angle) * 28;
            const dy = Math.sin(angle) * 18;
            return `@keyframes shipConfetti${i} {
              0% { transform: translate(0,0); opacity: 1; }
              100% { transform: translate(${dx}px, ${dy}px); opacity: 0; }
            }`;
          })
          .join('\n')}
      `}</style>
    </span>
  );
}

export function SectionActions({ readiness, disabled }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [shipped, setShipped] = useState<{ url?: string } | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [prState, setPrState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');
  const isShipping = useShipDrawerStore((s) => s.isShipping);
  const setShippingFlag = useShipDrawerStore((s) => s.setShipping);
  const markShipped = useShipDrawerStore((s) => s.markShipped);
  const lastUrl = useShipDrawerStore((s) => s.lastShipUrl);
  const blockers = countBlockers(readiness);

  const ref = useRef<HTMLButtonElement>(null);

  const startShip = async () => {
    setShippingFlag(true);
    const result = await deployToVercel({ prod: true });
    markShipped(result);
    if (result.ok) {
      setShipped({ url: result.url });
      setConfetti(true);
      setTimeout(() => setConfetti(false), 520);
    } else {
      setShipped(null);
    }
    setShippingFlag(false);
    setConfirming(false);
  };

  const onShipClick = () => {
    if (disabled || isShipping) return;
    if (!confirming) {
      setConfirming(true);
      // Auto-cancel confirm state after 5s.
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    void startShip();
  };

  // Cmd+Enter to confirm ship.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (disabled || isShipping) return;
        e.preventDefault();
        if (confirming) void startShip();
        else {
          setConfirming(true);
          setTimeout(() => setConfirming(false), 5000);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirming, disabled, isShipping]);

  const onPr = async () => {
    if (prState === 'busy') return;
    setPrState('busy');
    const r = await openPullRequest(readiness);
    setPrState(r.ok ? 'done' : 'failed');
    setTimeout(() => setPrState('idle'), 3000);
  };

  const tooltipMsg = disabled ? `Resolve ${blockers} issue${blockers === 1 ? '' : 's'} to ship` : null;

  if (shipped) {
    return (
      <div className="relative flex items-center justify-between gap-2 px-4 py-3 hairline-t bg-bg-subtle/50">
        {confetti ? <Confetti /> : null}
        <span
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md border border-sem-static/40 bg-sem-static-soft px-2 text-xs font-semibold text-sem-static',
          )}
          style={{ animation: 'shipColorSweep 600ms ease-out' }}
        >
          ✓ Shipped
        </span>
        {shipped.url ? (
          <a
            href={shipped.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center rounded-md border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 hover:bg-bg-hover hover:shadow-e1"
          >
            {shipped.url.replace(/^https?:\/\//, '')}
          </a>
        ) : null}
        <Button
          tone="ghost"
          size="sm"
          onClick={() => {
            setShipped(null);
          }}
        >
          Ship again
        </Button>
        <style>{`
          @keyframes shipColorSweep {
            0% { background-color: rgba(34,197,94,0.05); }
            50% { background-color: rgba(34,197,94,0.35); }
            100% { background-color: rgba(34,197,94,0.15); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 hairline-t bg-bg-subtle/50">
      <Tooltip content={tooltipMsg ?? (confirming ? '⌘↵ to confirm' : 'Deploy to Vercel production')}>
        <Button
          ref={ref}
          tone="accent"
          size="md"
          disabled={disabled || isShipping}
          onClick={onShipClick}
          className={cn(
            'flex-1 gap-2 gradient-accent shadow-glow-accent',
            confirming && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
          )}
          data-testid="ship-button-vercel"
        >
          {isShipping ? (
            <>
              <span className="animate-spin">◐</span>
              Shipping…
            </>
          ) : confirming ? (
            <>
              Confirm <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
            </>
          ) : (
            <>Ship via Vercel</>
          )}
        </Button>
      </Tooltip>
      <Tooltip content={tooltipMsg ?? 'Open pull request'}>
        <Button
          tone="soft"
          size="md"
          disabled={disabled || prState === 'busy'}
          onClick={onPr}
          className="gap-1"
          data-testid="ship-button-pr"
        >
          {prState === 'busy' ? (
            <>
              <span className="animate-spin">◐</span> PR…
            </>
          ) : prState === 'done' ? (
            <>✓ PR</>
          ) : prState === 'failed' ? (
            <>PR ✗</>
          ) : (
            <>Open PR</>
          )}
        </Button>
      </Tooltip>
      {lastUrl && !shipped ? (
        <a
          href={lastUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto truncate font-mono text-[10px] text-ink-3 hover:text-ink-1"
        >
          {lastUrl.replace(/^https?:\/\//, '').slice(0, 32)}
        </a>
      ) : null}
    </div>
  );
}
