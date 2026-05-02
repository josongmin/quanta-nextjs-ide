/**
 * Admission producer: subscribes to the evidence store and translates new
 * verdict packets into bus events. Emits exactly one event per packet id.
 */

import { useEvidenceStore } from '@entities/evidence';
import { emit } from '../bus';

export interface AdmissionWatcherHandle {
  dispose(): void;
}

export function startAdmissionWatcher(): AdmissionWatcherHandle {
  // Snapshot the ids we've already announced so existing packets at boot
  // don't fire on first subscription.
  const seen = new Set<string>(
    useEvidenceStore.getState().packets.map((p) => p.id),
  );

  const unsub = useEvidenceStore.subscribe((state) => {
    for (const packet of state.packets) {
      if (seen.has(packet.id)) continue;
      seen.add(packet.id);
      const decision = packet.verdict.decision;
      if (decision === 'admit') {
        emit({ kind: 'admission-admit', packetId: packet.id });
      } else if (decision === 'reject') {
        emit({
          kind: 'admission-reject',
          packetId: packet.id,
          reasons: packet.verdict.reasons,
        });
      }
      // 'review' has no micro-moment by design — it's the calm path.
    }
  });

  return {
    dispose() {
      unsub();
    },
  };
}
