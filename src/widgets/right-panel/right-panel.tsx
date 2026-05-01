import { match } from 'ts-pattern';
import { useUiStore } from '@entities/ui-shell';
import { RouteContractInspector } from './inspectors/route-contract-inspector';
import { ActionSafetyInspector } from './inspectors/action-safety-inspector';
import { FetchInspector } from './inspectors/fetch-inspector';
import { BoundaryInspector } from './inspectors/boundary-inspector';
import { ProjectHealthInspector } from './inspectors/project-health-inspector';
import { MigrationInspector } from './inspectors/migration-inspector';
import { CodeQualityInspector } from './inspectors/code-quality-inspector';
import { BundleInspector } from './inspectors/bundle-inspector';
import { AiInspector } from './inspectors/ai-inspector';
import { DbInspector } from './inspectors/db-inspector';
import { QueryInspector } from './inspectors/query-inspector';
import { LighthouseInspector } from './inspectors/lighthouse-inspector';

export function RightPanel() {
  const ctx = useUiStore((s) => s.inspectorContext);
  return match(ctx)
    .with({ kind: 'route' }, (c) => <RouteContractInspector routeId={c.routeId} />)
    .with({ kind: 'action' }, (c) => (
      <ActionSafetyInspector actionId={c.actionId} />
    ))
    .with({ kind: 'fetch' }, (c) => (
      <FetchInspector routeId={c.routeId} fetchId={c.fetchId} />
    ))
    .with({ kind: 'boundary' }, (c) => (
      <BoundaryInspector islandId={c.islandId} />
    ))
    .with({ kind: 'project' }, () => <ProjectHealthInspector />)
    .with({ kind: 'migration' }, () => <MigrationInspector />)
    .with({ kind: 'code-quality' }, () => <CodeQualityInspector />)
    .with({ kind: 'bundle' }, () => <BundleInspector />)
    .with({ kind: 'ai' }, () => <AiInspector />)
    .with({ kind: 'db' }, (c) => <DbInspector modelId={c.modelId} />)
    .with({ kind: 'query' }, (c) => <QueryInspector queryId={c.queryId} />)
    .with({ kind: 'lighthouse' }, (c) => <LighthouseInspector routeId={c.routeId} />)
    .exhaustive();
}
