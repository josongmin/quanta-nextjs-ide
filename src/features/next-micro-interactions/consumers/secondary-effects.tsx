/**
 * Secondary effects bundle — small DOM-poke consumers that don't need
 * dedicated React state. Keeps the file count manageable.
 *
 *  - env-secret-typed         → Monaco inline ghost decoration `🔒 server-only env`
 *                                or `⚠ NEXT_PUBLIC_ missing` (220ms fade-in).
 *  - dynamic-trigger-accepted → Animates `[data-route-mode-badge]` from
 *                                green-static → orange-dynamic via HSL
 *                                interpolation (300ms).
 *  - fetch-added-in-render    → Adds `data-nmi-wave-in` to
 *                                `[data-render-waterfall]` for 220ms.
 */

import { useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { on } from '../bus';
import { lerpHsl, prefersReducedMotion, tween } from '../utils/spring';

function fileFromModel(model: MonacoEditor.ITextModel): string {
  const raw = model.uri.path || model.uri.toString();
  try {
    return decodeURIComponent(raw).replace(/^\//, '');
  } catch {
    return raw.replace(/^\//, '');
  }
}

const ENV_GHOST_MS = 2400;
const ROUTE_BADGE_MS = 300;

export function SecondaryEffects(): JSX.Element {
  const monaco = useMonaco();

  // env-secret-typed → Monaco line decoration (after-content ghost).
  useEffect(() => {
    if (!monaco) return undefined;
    return on('env-secret-typed', (e) => {
      if (prefersReducedMotion()) return;
      const eds = monaco.editor.getEditors();
      let ed: MonacoEditor.ICodeEditor | undefined;
      for (const x of eds) {
        const m = x.getModel();
        if (m && fileFromModel(m) === e.file) {
          ed = x;
          break;
        }
      }
      if (!ed) return;
      const model = ed.getModel();
      if (!model) return;

      const className = e.isServer
        ? 'nmi-env-ghost-server'
        : 'nmi-env-ghost-client';
      const after = e.isServer
        ? '  🔒 server-only env'
        : '  ⚠ NEXT_PUBLIC_ missing';

      const collection = ed.createDecorationsCollection([
        {
          range: {
            startLineNumber: e.line,
            startColumn: model.getLineMaxColumn(e.line),
            endLineNumber: e.line,
            endColumn: model.getLineMaxColumn(e.line),
          },
          options: {
            after: {
              content: after,
              inlineClassName: className,
            },
          },
        },
      ]);
      window.setTimeout(() => {
        collection.clear();
      }, ENV_GHOST_MS);
    });
  }, [monaco]);

  // dynamic-trigger-accepted → animate route mode badge color (HSL lerp).
  useEffect(() => {
    return on('dynamic-trigger-accepted', () => {
      const reduced = prefersReducedMotion();
      const node = document.querySelector<HTMLElement>('[data-route-mode-badge]');
      if (!node) return;
      const fromHsl = { h: 142, s: 71, l: 45 }; // green-static
      const toHsl = { h: 28, s: 92, l: 55 }; // orange-dynamic
      if (reduced) {
        node.style.color = lerpHsl(fromHsl, toHsl, 1);
        node.style.borderColor = lerpHsl(fromHsl, toHsl, 1);
        node.setAttribute('data-route-mode', 'dynamic');
        return;
      }
      tween({
        durationMs: ROUTE_BADGE_MS,
        onUpdate: (t) => {
          const c = lerpHsl(fromHsl, toHsl, t);
          node.style.color = c;
          node.style.borderColor = c;
        },
        onDone: () => {
          node.setAttribute('data-route-mode', 'dynamic');
        },
      });
    });
  }, []);

  // fetch-added-in-render → wave-in on the waterfall preview.
  useEffect(() => {
    return on('fetch-added-in-render', () => {
      if (prefersReducedMotion()) return;
      const node = document.querySelector<HTMLElement>(
        '[data-render-waterfall]',
      );
      if (!node) return;
      node.setAttribute('data-nmi-wave-in', '1');
      window.setTimeout(() => {
        node.removeAttribute('data-nmi-wave-in');
      }, 240);
    });
  }, []);

  return (
    <style data-nmi="secondary-effects-style">{`
      .nmi-env-ghost-server {
        color: hsl(142 71% 38%) !important;
        font-style: italic;
        opacity: 0;
        animation: nmi-fade-in 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .nmi-env-ghost-client {
        color: hsl(0 72% 51%) !important;
        font-style: italic;
        opacity: 0;
        animation: nmi-fade-in 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      @keyframes nmi-fade-in { to { opacity: 0.95; } }

      [data-render-waterfall][data-nmi-wave-in] > :last-child {
        animation: nmi-wave-in 240ms cubic-bezier(0.22, 1, 0.36, 1) 1;
        filter: brightness(1.15);
      }
      @keyframes nmi-wave-in {
        from { transform: translateX(12px); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .nmi-env-ghost-server, .nmi-env-ghost-client { animation: none; opacity: 0.95; }
        [data-render-waterfall][data-nmi-wave-in] > :last-child { animation: none; }
      }
    `}</style>
  );
}
