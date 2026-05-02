/**
 * Bridges bus events that should manifest as toasts to the existing sonner
 * Toaster (mounted in `App.tsx`). This is a non-rendering component.
 *
 * Mapping:
 *  - `dynamic-trigger-accepted`     → "This call forces this route to dynamic. ⌘Z to revert."
 *  - `env-secret-typed` (server)    → "🔒 server-only env"
 *  - `env-secret-typed` (client)    → "⚠ NEXT_PUBLIC_ missing"
 *  - `revalidate-tag-typed`         → "Tag '<tag>' will revalidate cached routes"
 *  - `admission-admit`              → success "Admitted — ⌘↵ to ship"
 *  - `admission-reject`             → error    "Rejected — see ship drawer"
 *
 * Click handlers fire custom window events so other phases can react
 * without import coupling.
 */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { on } from '../bus';

export function ToastBridge(): null {
  useEffect(() => {
    const offDynamic = on('dynamic-trigger-accepted', (e) => {
      toast(`This call forces ${prettyApi(e.api)} to dynamic. ⌘Z to revert.`, {
        duration: 4500,
        action: {
          label: 'Reveal',
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent('nmi:reveal-line', {
                detail: { file: e.file, line: e.line },
              }),
            );
          },
        },
      });
    });

    const offSecret = on('env-secret-typed', (e) => {
      if (e.isServer) {
        toast(`🔒 server-only env · ${e.name}`, {
          duration: 3500,
          description: 'Reads here stay on the server.',
        });
      } else {
        toast.error(`⚠ NEXT_PUBLIC_ missing on ${e.name}`, {
          duration: 5000,
          description:
            'Client code can only read env vars prefixed with NEXT_PUBLIC_.',
        });
      }
    });

    const offTag = on('revalidate-tag-typed', (e) => {
      toast(`Revalidating tag '${e.tag}'`, {
        duration: 3000,
        description: 'Affected routes will refresh on next request.',
      });
    });

    const offAdmit = on('admission-admit', () => {
      toast.success('Admitted — ⌘↵ to ship', { duration: 4000 });
    });

    const offReject = on('admission-reject', (e) => {
      toast.error('Admission rejected', {
        duration: 5000,
        description: e.reasons.slice(0, 2).join(' · ') || undefined,
      });
    });

    return () => {
      offDynamic();
      offSecret();
      offTag();
      offAdmit();
      offReject();
    };
  }, []);

  return null;
}

function prettyApi(api: 'cookies' | 'headers' | 'searchParams'): string {
  if (api === 'searchParams') return 'this route';
  return `${api}()`;
}
