import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import { useLastTraceStore } from '@entities/rsc-payload';
import { Kbd } from '@shared/ui';
import { ConfidenceDot, RenderingChip, CostChip, SeverityDot } from '@shared/ui';
import { Icon } from '@shared/ui';
import {
  useRunnerStore,
  useBuildStatus,
  useTypeCheckStatus,
  useLintStatus,
  useTestStatus,
} from '@shared/runner';

export function StatusBar() {
  const cursor = useEditorStore((s) => s.cursor);
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const setBottomTab = useUiStore((s) => s.setBottomTab);
  const openOverlay = useUiStore((s) => s.openOverlay);

  // Live build / typecheck / lint / test status (Phase 3 runner).
  const ensureWired = useRunnerStore((s) => s.ensureWired);
  const startByLabel = useRunnerStore((s) => s.startByLabel);
  const build = useBuildStatus();
  const typecheck = useTypeCheckStatus();
  const lint = useLintStatus();
  const test = useTestStatus();
  useEffect(() => {
    void ensureWired();
  }, [ensureWired]);

  const file = cursor?.file;
  const route = file ? routes.find((r) => r.files.page === file || r.files.layout === file) : undefined;
  const fileDiagnostics = diagnostics.filter((d) => d.location.file === file);
  const errCount = fileDiagnostics.filter((d) => d.severity === 'err').length;
  const warnCount = fileDiagnostics.filter((d) => d.severity === 'warn').length;
  const hintCount = fileDiagnostics.filter((d) => d.severity === 'hint').length;

  return (
    <footer
      role="contentinfo"
      className="flex h-6 shrink-0 items-center gap-3 hairline-t bg-bg-subtle px-3 text-[11px] text-ink-2"
    >
      {route ? (
        <>
          <button
            className="flex items-center gap-1.5 hover:text-ink-1"
            aria-label="Route classification"
          >
            <RenderingChip
              rendering={route.rendering}
              confidence={route.renderingConfidence}
              showQuestion
            />
            <span className="font-mono text-ink-2">{route.path}</span>
          </button>
          <div className="h-3 w-px bg-line" aria-hidden />
          <button
            className="flex items-center gap-1 hover:text-ink-1"
            aria-label="Cost class"
          >
            <CostChip cost={route.costClass} />
          </button>
          {route.clientKb > 0 && (
            <>
              <div className="h-3 w-px bg-line" aria-hidden />
              <span className="flex items-center gap-1 text-sem-client">
                <Icon.Hex className="h-3 w-3" />
                client {route.clientKb}KB
              </span>
            </>
          )}
          {route.cacheTags.length > 0 && (
            <>
              <div className="h-3 w-px bg-line" aria-hidden />
              <span className="truncate text-ink-3">
                tags: {route.cacheTags.join(', ')}
              </span>
            </>
          )}
        </>
      ) : (
        <span className="text-ink-3">{file ?? 'no file'}</span>
      )}

      <div className="ml-auto flex items-center gap-3">
        <RunnerChip
          label="build"
          state={build?.state}
          durationMs={build?.durationMs ?? null}
          onClick={() => {
            setBottomTab('runner');
            if (!build || build.state !== 'running') void startByLabel('build');
          }}
        />
        <RunnerChip
          label="ts"
          state={typecheck?.state}
          count={typecheck?.typecheckErrors ?? null}
          onClick={() => {
            setBottomTab('runner');
            if (!typecheck || typecheck.state !== 'running')
              void startByLabel('typecheck');
          }}
        />
        <RunnerChip
          label="lint"
          state={lint?.state}
          count={lint?.lintErrors ?? null}
          warnCount={lint?.lintWarnings ?? null}
          onClick={() => {
            setBottomTab('runner');
            if (!lint || lint.state !== 'running') void startByLabel('lint');
          }}
        />
        <RunnerChip
          label="test"
          state={test?.state}
          count={test?.testsFailed ?? null}
          okCount={test?.testsPassed ?? null}
          onClick={() => {
            setBottomTab('runner');
            if (!test || test.state !== 'running') void startByLabel('test');
          }}
        />
        <button
          type="button"
          onClick={() => openOverlay('aiPanel')}
          className="flex items-center gap-1 hover:text-ink-1"
          aria-label="Open Quanta AI"
          title="Quanta AI — Probe + AST aware assistant"
        >
          <span className="text-[10px] uppercase tracking-caps text-ink-3">ai</span>
        </button>
        <ProbeChip />
        <button
          className="flex items-center gap-1 hover:text-ink-1"
          onClick={() => setBottomTab('problems')}
          aria-label="Problems for this file"
        >
          {errCount > 0 && (
            <span className="flex items-center gap-1 text-sev-err">
              <SeverityDot severity="err" /> {errCount}
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1 text-sev-warn">
              <SeverityDot severity="warn" /> {warnCount}
            </span>
          )}
          {hintCount > 0 && (
            <span className="flex items-center gap-1 text-ink-3">
              <SeverityDot severity="hint" /> {hintCount}
            </span>
          )}
          {errCount + warnCount + hintCount === 0 && (
            <span className="text-sem-static">no risks</span>
          )}
        </button>

        {route?.renderingConfidence && (
          <span className="flex items-center gap-1 text-ink-3">
            <ConfidenceDot confidence={route.renderingConfidence} />
            <span className="capitalize">{route.renderingConfidence}</span>
          </span>
        )}

        <button
          className="flex items-center gap-1 hover:text-ink-1"
          aria-label="Quick fix"
        >
          <Kbd>⌘</Kbd>
          <Kbd>.</Kbd>
        </button>
        <button
          className="flex items-center gap-1 hover:text-ink-1"
          onClick={() => openOverlay('commandPalette')}
          aria-label="Command palette"
        >
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>P</Kbd>
        </button>
      </div>
    </footer>
  );
}

/**
 * Runner status chip (build / typecheck / lint / test).
 *
 * - State dot reflects last/current run: ✓ succeeded · ✗ failed · ⏳ running.
 * - Clicking the chip switches to the Runner tab and (re-)triggers the
 *   matching runner unless one is already running.
 */
function RunnerChip(props: {
  label: string;
  state: 'running' | 'succeeded' | 'failed' | 'stopped' | undefined;
  durationMs?: number | null;
  count?: number | null;
  warnCount?: number | null;
  okCount?: number | null;
  onClick: () => void;
}) {
  const { label, state, durationMs, count, warnCount, okCount, onClick } = props;
  const glyph =
    state === 'succeeded'
      ? '✓'
      : state === 'failed'
        ? '✗'
        : state === 'running'
          ? '⏳'
          : '·';
  const tone =
    state === 'succeeded'
      ? 'text-sem-static'
      : state === 'failed'
        ? 'text-sev-err'
        : state === 'running'
          ? 'text-accent'
          : 'text-ink-3';

  const title =
    state === 'running'
      ? `${label}: running…`
      : state === 'succeeded'
        ? `${label}: passed${durationMs ? ` in ${(durationMs / 1000).toFixed(1)}s` : ''}`
        : state === 'failed'
          ? `${label}: failed`
          : `${label}: not run yet — click to run`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center gap-1 hover:text-ink-1"
    >
      <span className="text-[10px] uppercase tracking-caps text-ink-3">{label}</span>
      <span className={`font-mono ${tone}`}>{glyph}</span>
      {durationMs != null && state === 'succeeded' && (
        <span className="font-mono text-ink-3">{(durationMs / 1000).toFixed(1)}s</span>
      )}
      {count != null && count > 0 && (
        <span className="font-mono text-sev-err">{count}</span>
      )}
      {warnCount != null && warnCount > 0 && (
        <span className="font-mono text-sev-warn">{warnCount}</span>
      )}
      {okCount != null && okCount > 0 && (
        <span className="font-mono text-sem-static">{okCount}</span>
      )}
    </button>
  );
}

/**
 * Quanta Probe status chip.
 *
 * Shows whether the IDE has any RSC trace data available. Clicking opens the
 * RSC payload step overlay so the user can fetch a route or learn what Probe
 * does. (See `ProbeInfoOverlay` for the explanatory panel.)
 */
function ProbeChip() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const active = !!url && chunks.length > 0;
  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => openOverlay('rscPayloadStep')}
        className="flex items-center gap-1 hover:text-ink-1"
        aria-label="Quanta Probe status"
        title={
          active
            ? `Quanta Probe: ${chunks.length} chunks captured from ${url}`
            : 'Quanta Probe: no RSC trace yet — click to capture'
        }
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-accent' : 'bg-ink-3'}`}
        />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">probe</span>
        {active ? (
          <span className="font-mono text-ink-2">{chunks.length}</span>
        ) : (
          <span className="text-ink-3">idle</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => openOverlay('probeInfo')}
        aria-label="What is Quanta Probe?"
        title="What is Quanta Probe?"
        className="flex h-3 w-3 items-center justify-center rounded-full border border-line text-[8px] text-ink-3 hover:border-accent hover:text-accent"
      >
        ?
      </button>
    </span>
  );
}
