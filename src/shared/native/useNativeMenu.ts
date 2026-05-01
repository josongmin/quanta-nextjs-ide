import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { isNative, onNativeMenu, onDeepLink, nativeInvoke } from '.';
import { workspace, useWorkspaceStore } from '@shared/workspace';

/**
 * Wires the native macOS menu / tray events into IDE actions.
 *
 * Mount once at the app root. On web build it does nothing.
 * Native menu IDs are defined in `src-tauri/src/lib.rs#build_app_menu`.
 */
export function useNativeMenu(): void {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const setBottomTab = useUiStore((s) => s.setBottomTab);

  useEffect(() => {
    if (!isNative()) return;
    const unsubscribeMenu = onNativeMenu((action) => {
      switch (action) {
        case 'command-palette':
          openOverlay('commandPalette');
          break;
        case 'quick-open':
          openOverlay('recentFilesPopup');
          break;
        case 'open-rsc':
          openOverlay('rscPayloadStep');
          break;
        case 'open-ai':
          openOverlay('aiPanel');
          break;
        case 'open-plugins':
          openOverlay('pluginFindings');
          break;
        case 'open-git':
          openOverlay('gitStatus');
          break;
        case 'settings':
          openOverlay('settings');
          break;
        case 'open-folder': {
          // Native File → Open Folder…: pick a directory and route through
          // the workspace store so the watcher + analyzer bus boot.
          void (async () => {
            const picked = await workspace.pickFolder();
            if (!picked) return;
            await useWorkspaceStore.getState().openWorkspace(picked);
          })();
          break;
        }
        case 'toggle-bottom-panel':
          // Cycle to problems if no current; otherwise toggle visibility via tab.
          setBottomTab('problems');
          break;
        case 'capture-now':
          openOverlay('rscPayloadStep');
          break;
        case 'docs':
          window.open('https://quanta.dev/docs', '_blank');
          break;
        case 'report-issue':
          window.open('https://github.com/quanta/quanta-ide/issues/new', '_blank');
          break;
        default:
          // ignore
      }
    });

    const unsubscribeDeep = onDeepLink((url) => {
      // quanta://route?url=/__rsc/products/walnut-table
      try {
        const u = new URL(url);
        if (u.host === 'route') {
          const target = u.searchParams.get('url');
          if (target) {
            try {
              localStorage.setItem('quanta.rsc-payload-step.url', target);
            } catch {
              /* ignore */
            }
            openOverlay('rscPayloadStep');
          }
        } else if (u.host === 'ai') {
          openOverlay('aiPanel');
        }
      } catch {
        /* malformed deep link */
      }
    });

    // Drain any deep-link captured before the listener was attached.
    void nativeInvoke<string | null>('get_last_deep_link').then((last) => {
      if (last) {
        // Reuse the same handler by routing through onDeepLink consumers.
        // Simplest: dispatch a synthetic event by emitting through openOverlay
        // when it's clearly a quanta:// URL.
        try {
          const u = new URL(last);
          if (u.host === 'route') {
            const target = u.searchParams.get('url');
            if (target) {
              try {
                localStorage.setItem('quanta.rsc-payload-step.url', target);
              } catch {
                /* ignore */
              }
              openOverlay('rscPayloadStep');
            }
          }
        } catch {
          /* ignore */
        }
      }
    });

    return () => {
      unsubscribeMenu();
      unsubscribeDeep();
    };
  }, [openOverlay, setBottomTab]);
}
