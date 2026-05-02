/**
 * Viewzone manager for the Live Route Spec card.
 *
 * Mirrors the inline-lenses pattern: a Monaco viewZone reserves vertical
 * space at afterLineNumber=0 and we render React via a portal into the
 * zone's DOM node. Height transitions between the collapsed (64) and
 * expanded (200) states are tweened by repeatedly invoking
 * `viewZoneAccessor.layoutZone()` on each rAF tick.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { editor as MonacoEditor } from 'monaco-editor';
import { RouteSpecCard } from './card';
import type { RouteSpec } from './types';

export const COLLAPSED_HEIGHT = 64;
export const EXPANDED_HEIGHT = 220;
const ANIM_MS = 240;

interface ViewZoneProps {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  monaco: typeof import('monaco-editor') | null;
  spec: RouteSpec;
  collapsed: boolean;
  firstReveal: boolean;
  onToggle(): void;
  onJumpEvidence(file: string, line: number): void;
  onOpenInspector(): void;
  onSeeAllRisks(): void;
  onShipNow(): void;
  onTraceFullstack(): void;
}

interface MountedZone {
  zoneId: string;
  domNode: HTMLDivElement;
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export function LiveRouteSpecViewZone({
  editor,
  monaco,
  spec,
  collapsed,
  firstReveal,
  onToggle,
  onJumpEvidence,
  onOpenInspector,
  onSeeAllRisks,
  onShipNow,
  onTraceFullstack,
}: ViewZoneProps) {
  const [zone, setZone] = useState<MountedZone | null>(null);
  const animRef = useRef<number | null>(null);

  // Mount the viewzone once per (editor, route).
  useEffect(() => {
    if (!editor || !monaco) {
      setZone(null);
      return;
    }
    let mounted: MountedZone | null = null;
    const domNode = document.createElement('div');
    domNode.className = 'nss-route-spec-zone';
    domNode.style.boxSizing = 'border-box';
    domNode.style.width = '100%';
    domNode.style.height = '100%';

    editor.changeViewZones((accessor) => {
      const zoneId = accessor.addZone({
        afterLineNumber: 0,
        heightInPx: collapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT,
        domNode,
      });
      mounted = { zoneId, domNode };
    });
    if (mounted) setZone(mounted);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      if (mounted && editor) {
        editor.changeViewZones((accessor) => {
          accessor.removeZone(mounted!.zoneId);
        });
      }
      setZone(null);
    };
    // We intentionally do not depend on `collapsed` here — height changes are
    // animated via the second effect so we don't recreate the zone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, monaco, spec.routeId]);

  // Animate height when `collapsed` changes.
  useEffect(() => {
    if (!editor || !zone) return;
    const target = collapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
    // Read the current actual height by quickly poking `layoutZone` with the
    // value we last set; since Monaco doesn't expose a getter, we keep the
    // last value on the DOM node.
    const fromAttr = (zone.domNode.dataset.h as string | undefined) ?? String(target);
    const from = Number(fromAttr) || target;
    if (from === target) {
      // Still mark current.
      zone.domNode.dataset.h = String(target);
      return;
    }
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIM_MS);
      const h = Math.round(from + (target - from) * easeOut(t));
      try {
        editor.changeViewZones((accessor) => {
          // We must rebuild the zone to change height; layoutZone only
          // recomputes positions (not heightInPx). The cheaper API is to
          // remove + re-add — but that destroys our portal target. Instead
          // we keep the same node and rely on `accessor.layoutZone` after
          // mutating the underlying data via remove/add path. For broad
          // compatibility we use `removeZone` + `addZone` while preserving
          // the same DOM node so React's portal stays mounted.
          accessor.removeZone(zone.zoneId);
          const newId = accessor.addZone({
            afterLineNumber: 0,
            heightInPx: h,
            domNode: zone.domNode,
          });
          zone.zoneId = newId;
        });
      } catch {
        /* editor disposed mid-animation */
      }
      zone.domNode.dataset.h = String(h);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };

    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [collapsed, editor, zone]);

  const portalKey = useMemo(() => `route-spec-${spec.routeId}`, [spec.routeId]);

  if (!zone) return null;

  return createPortal(
    <RouteSpecCard
      spec={spec}
      collapsed={collapsed}
      firstReveal={firstReveal}
      onToggle={onToggle}
      onJumpEvidence={onJumpEvidence}
      onOpenInspector={onOpenInspector}
      onSeeAllRisks={onSeeAllRisks}
      onShipNow={onShipNow}
      onTraceFullstack={onTraceFullstack}
    />,
    zone.domNode,
    portalKey,
  );
}
