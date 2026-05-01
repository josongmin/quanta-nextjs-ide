import { useEffect, useRef } from 'react';

export type AutoRefetchMode = 'off' | 'focus' | 'interval';

export function useAutoRefetch(
  mode: AutoRefetchMode,
  refetch: () => void,
  enabled: boolean,
  intervalMs = 5000,
): void {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled || mode === 'off') return;

    if (mode === 'focus') {
      const onFocus = () => refetchRef.current();
      const onVis = () => {
        if (document.visibilityState === 'visible') refetchRef.current();
      };
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVis);
      return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVis);
      };
    }

    if (mode === 'interval') {
      const handle = window.setInterval(() => refetchRef.current(), intervalMs);
      return () => window.clearInterval(handle);
    }
  }, [enabled, mode, intervalMs]);
}
