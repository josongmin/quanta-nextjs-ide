import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { editor as MonacoEditor } from 'monaco-editor';
import { match } from 'ts-pattern';
import { LensLine, Chip, RenderingChip, CostChip, Button, Icon } from '@shared/ui';
import type { FileSemantics, LineInfo } from '../use-line-semantics';
import { useUiStore } from '@entities/ui-shell';

interface LensSpec {
  id: string;
  /** Line number AFTER which lens is rendered (Monaco view zones go after a line). */
  afterLineNumber: number;
  line: LineInfo;
}

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  monaco: typeof import('monaco-editor') | null;
  semantics: FileSemantics;
  file: string;
}

interface ZoneRender {
  spec: LensSpec;
  domNode: HTMLDivElement;
  zoneId: string;
}

export function InlineLenses({ editor, monaco, semantics, file }: Props) {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);

  // Lens specs: route file top + 'use client' + 'use server'
  const specs = useMemo<LensSpec[]>(() => {
    const out: LensSpec[] = [];
    for (const line of semantics.lines) {
      if (line.kind === 'route-top') {
        // Render lens above line 1 → afterLineNumber 0 isn't allowed; use Monaco's
        // ability via afterLineNumber: 0 to insert at the very top.
        out.push({ id: `lens-route-${line.line}`, afterLineNumber: 0, line });
      } else if (line.kind === 'use-client') {
        out.push({
          id: `lens-client-${line.line}`,
          afterLineNumber: Math.max(0, line.line - 1),
          line,
        });
      } else if (line.kind === 'use-server') {
        out.push({
          id: `lens-server-${line.line}`,
          afterLineNumber: Math.max(0, line.line - 1),
          line,
        });
      }
    }
    return out;
  }, [semantics]);

  const [renders, setRenders] = useState<ZoneRender[]>([]);

  useEffect(() => {
    if (!editor || !monaco) {
      setRenders([]);
      return;
    }

    const created: ZoneRender[] = [];
    editor.changeViewZones((accessor) => {
      for (const spec of specs) {
        const domNode = document.createElement('div');
        domNode.className = 'nss-lens-zone';
        const zoneId = accessor.addZone({
          afterLineNumber: spec.afterLineNumber,
          heightInPx: 22,
          domNode,
        });
        created.push({ spec, domNode, zoneId });
      }
    });
    setRenders(created);

    return () => {
      editor.changeViewZones((accessor) => {
        for (const r of created) {
          accessor.removeZone(r.zoneId);
        }
      });
      setRenders([]);
    };
  }, [editor, monaco, specs]);

  return (
    <>
      {renders.map((r) => createPortal(
        <LensContent
          line={r.spec.line}
          file={file}
          route={semantics.route}
          onShowBlast={() => openOverlay('blastRadius', { sourceFile: file })}
          onShowRouteInspector={() => {
            if (semantics.route) {
              setInspectorContext({ kind: 'route', routeId: semantics.route.id });
            }
          }}
        />,
        r.domNode,
        r.spec.id,
      ))}
    </>
  );
}

interface LensContentProps {
  line: LineInfo;
  file: string;
  route: FileSemantics['route'];
  onShowBlast(): void;
  onShowRouteInspector(): void;
}

function LensContent({ line, route, onShowBlast, onShowRouteInspector }: LensContentProps) {
  return match(line.kind)
    .with('route-top', () => (
      <LensLine
        kind="route"
        label={route?.path ?? 'route'}
        trailing={
          <>
            {route ? <RenderingChip rendering={route.rendering} confidence={route.renderingConfidence} /> : null}
            {route?.riskCount ? (
              <Chip tone="warn" size="xs">↓ {route.riskCount} risks</Chip>
            ) : null}
            {route ? <CostChip cost={route.costClass} /> : null}
            {route?.clientKb ? (
              <Chip tone="muted" size="xs">{`client ${route.clientKb}KB`}</Chip>
            ) : null}
            <Button size="xs" tone="ghost" onClick={onShowRouteInspector}>
              <Icon.UpRight className="h-3 w-3" /> inspect
            </Button>
          </>
        }
      />
    ))
    .with('use-client', () => (
      <LensLine
        kind="client"
        label="CLIENT BOUNDARY"
        trailing={
          <>
            <Chip tone="client" size="xs">↑ 38 files</Chip>
            <Chip tone="muted" size="xs">~260KB</Chip>
            <Button size="xs" tone="ghost" onClick={onShowBlast}>
              <Icon.UpRight className="h-3 w-3" /> map
            </Button>
          </>
        }
      />
    ))
    .with('use-server', () => (
      <LensLine
        kind="action"
        label="ACTION"
        trailing={
          <>
            <Chip tone="server" size="xs">score 64/100</Chip>
            <Button size="xs" tone="ghost" onClick={onShowRouteInspector}>
              details →
            </Button>
          </>
        }
      />
    ))
    .otherwise(() => null);
}
