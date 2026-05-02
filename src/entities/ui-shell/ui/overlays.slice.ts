import type { StateCreator } from 'zustand';

export interface OverlayState {
  evidenceTracer: { open: boolean; diagnosticId?: string };
  blastRadius: { open: boolean; sourceFile?: string };
  whatIf: { open: boolean; scenarioId?: string };
  commandPalette: { open: boolean };
  patchPreview: {
    open: boolean;
    fixId?: string;
    diagnosticId?: string;
    scope?: 'line' | 'file' | 'route' | 'project';
  };
  settings: { open: boolean; tab?: 'appearance' | 'density' | 'profile' | 'autofix' | 'rules' };
  shortcutHelp: { open: boolean };
  onboarding: { open: boolean; step: number };
  renderGraph: { open: boolean; rootFile?: string };
  typeFlow: { open: boolean; symbolId?: string };
  tailwindPalette: { open: boolean };
  a11yHeatmap: { open: boolean };
  routeFlowEditor: { open: boolean; rootRouteId?: string };
  componentPreview: { open: boolean; componentFile?: string; viewport?: string };
  mockDataGen: { open: boolean; targetType?: string };
  findReferences: { open: boolean; symbol?: string; kind?: 'route' | 'tag' | 'action' | 'symbol' };
  learnMore: { open: boolean; ruleId?: string };
  cspAdvisor: { open: boolean };
  scriptRisk: { open: boolean };
  coverageMap: { open: boolean };
  viewportSimulator: { open: boolean; routeId?: string };
  prSummary: { open: boolean };
  aiPatchGate: { open: boolean; patchId?: string };
  notifications: { open: boolean };
  wizardServerAction: { open: boolean };
  wizardRouteHandler: { open: boolean };
  wizardNewRoute: { open: boolean };
  // ── Full-stack / web tier ───────────────────────────────────
  authFlowTracer: { open: boolean; routeId?: string };
  formPipeline: { open: boolean; formId?: string };
  i18nCoverage: { open: boolean; locale?: string };
  apiContracts: { open: boolean };
  lighthouse: { open: boolean; routeId?: string };
  criticalCss: { open: boolean; routeId?: string };
  imageFormatAudit: { open: boolean };
  quickDocs: { open: boolean; symbol?: string };
  snapshotTimeline: { open: boolean };
  splitEditor: { open: boolean };
  livePreview: { open: boolean; routeId?: string };
  // ── Runtime observability ───────────────────────────────────
  hydrationInspector: { open: boolean; routeId?: string };
  streamingVisualizer: { open: boolean; routeId?: string };
  rscProfiler: { open: boolean; routeId?: string };
  cacheHeatmap: { open: boolean };
  actionReplay: { open: boolean; runId?: string };
  requestWaterfall: { open: boolean; routeId?: string };
  edgeColdWarm: { open: boolean };
  // ── Debug ───────────────────────────────────────────────────
  timeTravel: { open: boolean };
  renderReasoner: { open: boolean; component?: string };
  effectLog: { open: boolean };
  suspenseViz: { open: boolean; routeId?: string };
  breakpointManager: { open: boolean };
  consoleReplay: { open: boolean };
  // ── SOTA editor extras ──────────────────────────────────────
  workspaceSearch: { open: boolean; query?: string };
  // ── Collaboration tier ──────────────────────────────────────
  presenceRoster: { open: boolean };
  commentThread: { open: boolean; threadId?: string };
  conflictViz: { open: boolean; file?: string };
  reviewRequest: { open: boolean };
  // ── Test / Quality intelligence ─────────────────────────────
  testImpact: { open: boolean };
  flakyDetector: { open: boolean };
  snapshotDiff: { open: boolean; testId?: string };
  coverageInspector: { open: boolean; file?: string };
  mutationTesting: { open: boolean };
  // ── AI agent surfaces ───────────────────────────────────────
  agentQueue: { open: boolean };
  toolCallTimeline: { open: boolean; runId?: string };
  planCanvas: { open: boolean; planId?: string };
  diffApproval: { open: boolean; patchId?: string };
  tokenMeter: { open: boolean };
  // ── Data / API design ───────────────────────────────────────
  erDiagram: { open: boolean };
  migrationPlanner: { open: boolean };
  apiPlayground: { open: boolean; endpointId?: string };
  seedBuilder: { open: boolean; modelId?: string };
  // ── Wave 8 creative ─────────────────────────────────────────
  perfBudgetSimulator: { open: boolean };
  errorBudgetCockpit: { open: boolean };
  featureFlagOrchestrator: { open: boolean };
  realUserMonitor: { open: boolean };
  designTokenLab: { open: boolean };
  competitiveBenchmark: { open: boolean };
  // ── Wave 9 Code Intelligence Pro ───────────────────────────
  semanticCodeSearch: { open: boolean; query?: string };
  architectureMap: { open: boolean };
  deadCodeFinder: { open: boolean };
  apiSurfaceDiff: { open: boolean };
  symbolPopularity: { open: boolean };
  // ── Wave 9 Security Center ─────────────────────────────────
  secretScanner: { open: boolean };
  cveTimeline: { open: boolean; pkg?: string };
  supplyChainGraph: { open: boolean };
  sbomViewer: { open: boolean };
  licenseCompliance: { open: boolean };
  // ── Wave 9 Performance Forensics ───────────────────────────
  flameGraph: { open: boolean };
  memorySnapshotDiff: { open: boolean };
  longTaskTracker: { open: boolean };
  bundleEvolution: { open: boolean };
  assetWaterfall: { open: boolean; routeId?: string };
  // ── Wave 9 Developer Wellness ──────────────────────────────
  focusSession: { open: boolean };
  cognitiveLoadMap: { open: boolean };
  reviewFatigue: { open: boolean };
  pairQueue: { open: boolean };
  // ── Wave 10 IDE classics: editor / navigation ──────────────
  goToSymbol: { open: boolean };
  callHierarchy: { open: boolean; symbolId?: string };
  typeHierarchy: { open: boolean; symbolId?: string };
  peekDefinition: { open: boolean; symbolId?: string };
  renameRefactor: { open: boolean; symbolId?: string };
  // ── Wave 10 IDE classics: WebStorm-grade ───────────────────
  localHistory: { open: boolean; file?: string };
  httpClient: { open: boolean };
  runConfigurations: { open: boolean };
  recentFilesPopup: { open: boolean };
  databaseTool: { open: boolean };
  // ── Wave 10 IDE classics: VSCode-grade ─────────────────────
  notebook: { open: boolean };
  sourceControlGraph: { open: boolean };
  tasksRunner: { open: boolean };
  remoteSession: { open: boolean };
  profileSwitcher: { open: boolean };
  settingsSync: { open: boolean };
  // ── Wave 11 Refactor library (Next.js-flavored) ────────────
  extractFunction: { open: boolean };
  extractComponent: { open: boolean };
  inlineSymbol: { open: boolean };
  moveToFile: { open: boolean };
  convertToServer: { open: boolean };
  convertToClient: { open: boolean };
  extractServerAction: { open: boolean };
  wrapWithSuspense: { open: boolean };
  promoteToRoute: { open: boolean };
  refactorPalette: { open: boolean };
  // ── Wave 11 Live debugging (Node + Edge + RSC) ─────────────
  debugSession: { open: boolean };
  variablesScope: { open: boolean };
  watchExpressions: { open: boolean };
  rscPayloadStep: { open: boolean };
  probeInfo: { open: boolean };
  aiPanel: { open: boolean };
  gitStatus: { open: boolean };
  pluginFindings: { open: boolean };
  exceptionPause: { open: boolean };
  // ── Wave 11 AI inline assistant ────────────────────────────
  aiInlineExplain: { open: boolean; symbolId?: string };
  aiRefactorSuggest: { open: boolean };
  aiCommitMessage: { open: boolean };
  aiDocstring: { open: boolean };
  aiRouteScaffold: { open: boolean };
  // ── Wave 11 Diff / merge tools ─────────────────────────────
  threeWayMerge: { open: boolean; file?: string };
  semanticMerge: { open: boolean };
  patchStack: { open: boolean };
  interactiveRebase: { open: boolean };
  // ── Wave 12-A Web foundations ──────────────────────────────
  flexGridDebugger: { open: boolean };
  containerQueryInspector: { open: boolean };
  cascadeLayers: { open: boolean };
  viewTransitions: { open: boolean };
  animationTimeline: { open: boolean };
  storageExplorer: { open: boolean };
  serviceWorkerLab: { open: boolean };
  webApisProbe: { open: boolean };
  formPlayground: { open: boolean };
  // ── Wave 12-B Next.js config / runtime ─────────────────────
  nextConfigLab: { open: boolean };
  parallelRoutesViz: { open: boolean };
  middlewareMatrix: { open: boolean };
  serverOnlyTracker: { open: boolean };
  typedRoutingGraph: { open: boolean };
  /** Real-AST `'use cache'` directive analyzer (first PoC). */
  useCacheAnalyzer: { open: boolean };
  // ── Wave 12-C Content / SEO ────────────────────────────────
  ogImageGenerator: { open: boolean };
  sitemapBuilder: { open: boolean };
  draftModeViz: { open: boolean };
  hostingMatrix: { open: boolean };
  // ── Wave 12-D Tooling depth ────────────────────────────────
  turbopackGraph: { open: boolean };
  actionMiddlewareComposer: { open: boolean };
  streamingRum: { open: boolean };
  i18nRouteDiff: { open: boolean };
  // ── Wave 13-A Mobile + A11y + i18n deep ────────────────────
  touchSimulator: { open: boolean };
  deviceFramePreview: { open: boolean };
  screenReaderSim: { open: boolean };
  keyboardFlowViz: { open: boolean };
  rtlPreview: { open: boolean };
  pluralRulesTester: { open: boolean };
  // ── Wave 13-B Email + Realtime + Search ────────────────────
  emailPreview: { open: boolean };
  pushNotificationLab: { open: boolean };
  websocketInspector: { open: boolean };
  presenceDebugger: { open: boolean };
  searchPlayground: { open: boolean };
  rankingTuner: { open: boolean };
  // ── Wave 13-C Payment + Auth + CMS ─────────────────────────
  stripeCheckoutSim: { open: boolean };
  webhookTester: { open: boolean };
  oauthFlowViz: { open: boolean };
  rbacMatrix: { open: boolean };
  contentModelDesigner: { open: boolean };
  scheduledPublish: { open: boolean };
  // ── Wave 13-D DevOps + Privacy + Analytics + AI/ML ─────────
  deployPreviews: { open: boolean };
  envVarsDiff: { open: boolean };
  cookieConsentBuilder: { open: boolean };
  piiLineage: { open: boolean };
  funnelEditor: { open: boolean };
  promptTemplateLab: { open: boolean };
  ragContextViewer: { open: boolean };
  evalSuite: { open: boolean };
  // ── Phase 11 ───────────────────────────────────────────────
  layerViolation: { open: boolean };
  ownershipGraph: { open: boolean };
  safeRefactor: { open: boolean };
  intentCapture: { open: boolean };
  // ── Phase 10 Production-truth (error/hotspot/cost/otel) ────
  errorCodeMap: { open: boolean };
  hotspotDetector: { open: boolean };
  costPredictor: { open: boolean };
  otelTrace: { open: boolean };
  // ── Phase 14 Dev Loop Mastery ──────────────────────────────
  devLoop: {
    open: boolean;
    tab?:
      | 'devServer'
      | 'duplicateFetch'
      | 'errorBoundary'
      | 'fastRefresh'
      | 'compileHotspot'
      | 'playwright';
  };
  // ── Phase 15 Cockpit Start Screen ──────────────────────────
  cockpit: { open: boolean };
  // ── Phase 18 AI Governed Mode UI ──────────────────────────
  governedFlow: { open: boolean };
  // ── Phase 21 Ship-it Drawer ────────────────────────────────
  shipDrawer: { open: boolean };
  pinned: Array<{ id: string; title: string; meta: string }>;
}

export interface OverlaysSlice {
  overlays: OverlayState;
  openOverlay<K extends keyof OverlayState>(
    key: K,
    state?: Partial<OverlayState[K]>,
  ): void;
  closeOverlay(key: keyof OverlayState): void;
  pin(item: { id: string; title: string; meta: string }): void;
  unpin(id: string): void;
}

export const initialOverlays: OverlayState = {
  evidenceTracer: { open: false },
  blastRadius: { open: false },
  whatIf: { open: false },
  commandPalette: { open: false },
  patchPreview: { open: false },
  settings: { open: false },
  shortcutHelp: { open: false },
  onboarding: { open: false, step: 0 },
  renderGraph: { open: false },
  typeFlow: { open: false },
  tailwindPalette: { open: false },
  a11yHeatmap: { open: false },
  routeFlowEditor: { open: false },
  componentPreview: { open: false },
  mockDataGen: { open: false },
  findReferences: { open: false },
  learnMore: { open: false },
  cspAdvisor: { open: false },
  scriptRisk: { open: false },
  coverageMap: { open: false },
  viewportSimulator: { open: false },
  prSummary: { open: false },
  aiPatchGate: { open: false },
  notifications: { open: false },
  wizardServerAction: { open: false },
  wizardRouteHandler: { open: false },
  wizardNewRoute: { open: false },
  authFlowTracer: { open: false },
  formPipeline: { open: false },
  i18nCoverage: { open: false },
  apiContracts: { open: false },
  lighthouse: { open: false },
  criticalCss: { open: false },
  imageFormatAudit: { open: false },
  quickDocs: { open: false },
  snapshotTimeline: { open: false },
  splitEditor: { open: false },
  livePreview: { open: false },
  hydrationInspector: { open: false },
  streamingVisualizer: { open: false },
  rscProfiler: { open: false },
  cacheHeatmap: { open: false },
  actionReplay: { open: false },
  requestWaterfall: { open: false },
  edgeColdWarm: { open: false },
  timeTravel: { open: false },
  renderReasoner: { open: false },
  effectLog: { open: false },
  suspenseViz: { open: false },
  breakpointManager: { open: false },
  consoleReplay: { open: false },
  workspaceSearch: { open: false },
  presenceRoster: { open: false },
  commentThread: { open: false },
  conflictViz: { open: false },
  reviewRequest: { open: false },
  testImpact: { open: false },
  flakyDetector: { open: false },
  snapshotDiff: { open: false },
  coverageInspector: { open: false },
  mutationTesting: { open: false },
  agentQueue: { open: false },
  toolCallTimeline: { open: false },
  planCanvas: { open: false },
  diffApproval: { open: false },
  tokenMeter: { open: false },
  erDiagram: { open: false },
  migrationPlanner: { open: false },
  apiPlayground: { open: false },
  seedBuilder: { open: false },
  // Wave 8 creative
  perfBudgetSimulator: { open: false },
  errorBudgetCockpit: { open: false },
  featureFlagOrchestrator: { open: false },
  realUserMonitor: { open: false },
  designTokenLab: { open: false },
  competitiveBenchmark: { open: false },
  // Wave 9
  semanticCodeSearch: { open: false },
  architectureMap: { open: false },
  deadCodeFinder: { open: false },
  apiSurfaceDiff: { open: false },
  symbolPopularity: { open: false },
  secretScanner: { open: false },
  cveTimeline: { open: false },
  supplyChainGraph: { open: false },
  sbomViewer: { open: false },
  licenseCompliance: { open: false },
  flameGraph: { open: false },
  memorySnapshotDiff: { open: false },
  longTaskTracker: { open: false },
  bundleEvolution: { open: false },
  assetWaterfall: { open: false },
  focusSession: { open: false },
  cognitiveLoadMap: { open: false },
  reviewFatigue: { open: false },
  pairQueue: { open: false },
  // Wave 10
  goToSymbol: { open: false },
  callHierarchy: { open: false },
  typeHierarchy: { open: false },
  peekDefinition: { open: false },
  renameRefactor: { open: false },
  localHistory: { open: false },
  httpClient: { open: false },
  runConfigurations: { open: false },
  recentFilesPopup: { open: false },
  databaseTool: { open: false },
  notebook: { open: false },
  sourceControlGraph: { open: false },
  tasksRunner: { open: false },
  remoteSession: { open: false },
  profileSwitcher: { open: false },
  settingsSync: { open: false },
  // Wave 11
  extractFunction: { open: false },
  extractComponent: { open: false },
  inlineSymbol: { open: false },
  moveToFile: { open: false },
  convertToServer: { open: false },
  convertToClient: { open: false },
  extractServerAction: { open: false },
  wrapWithSuspense: { open: false },
  promoteToRoute: { open: false },
  refactorPalette: { open: false },
  debugSession: { open: false },
  variablesScope: { open: false },
  watchExpressions: { open: false },
  rscPayloadStep: { open: false },
  probeInfo: { open: false },
  aiPanel: { open: false },
  gitStatus: { open: false },
  pluginFindings: { open: false },
  exceptionPause: { open: false },
  aiInlineExplain: { open: false },
  aiRefactorSuggest: { open: false },
  aiCommitMessage: { open: false },
  aiDocstring: { open: false },
  aiRouteScaffold: { open: false },
  threeWayMerge: { open: false },
  semanticMerge: { open: false },
  patchStack: { open: false },
  interactiveRebase: { open: false },
  // Wave 12
  flexGridDebugger: { open: false },
  containerQueryInspector: { open: false },
  cascadeLayers: { open: false },
  viewTransitions: { open: false },
  animationTimeline: { open: false },
  storageExplorer: { open: false },
  serviceWorkerLab: { open: false },
  webApisProbe: { open: false },
  formPlayground: { open: false },
  nextConfigLab: { open: false },
  parallelRoutesViz: { open: false },
  middlewareMatrix: { open: false },
  serverOnlyTracker: { open: false },
  typedRoutingGraph: { open: false },
  useCacheAnalyzer: { open: false },
  ogImageGenerator: { open: false },
  sitemapBuilder: { open: false },
  draftModeViz: { open: false },
  hostingMatrix: { open: false },
  turbopackGraph: { open: false },
  actionMiddlewareComposer: { open: false },
  streamingRum: { open: false },
  i18nRouteDiff: { open: false },
  // Wave 13
  touchSimulator: { open: false },
  deviceFramePreview: { open: false },
  screenReaderSim: { open: false },
  keyboardFlowViz: { open: false },
  rtlPreview: { open: false },
  pluralRulesTester: { open: false },
  emailPreview: { open: false },
  pushNotificationLab: { open: false },
  websocketInspector: { open: false },
  presenceDebugger: { open: false },
  searchPlayground: { open: false },
  rankingTuner: { open: false },
  stripeCheckoutSim: { open: false },
  webhookTester: { open: false },
  oauthFlowViz: { open: false },
  rbacMatrix: { open: false },
  contentModelDesigner: { open: false },
  scheduledPublish: { open: false },
  deployPreviews: { open: false },
  envVarsDiff: { open: false },
  cookieConsentBuilder: { open: false },
  piiLineage: { open: false },
  funnelEditor: { open: false },
  promptTemplateLab: { open: false },
  ragContextViewer: { open: false },
  evalSuite: { open: false },
  // Phase 11
  layerViolation: { open: false },
  ownershipGraph: { open: false },
  safeRefactor: { open: false },
  intentCapture: { open: false },
  // Phase 10
  errorCodeMap: { open: false },
  hotspotDetector: { open: false },
  costPredictor: { open: false },
  otelTrace: { open: false },
  // Phase 14 Dev Loop Mastery
  devLoop: { open: false },
  // Phase 15 Cockpit Start Screen
  cockpit: { open: false },
  // Phase 18 AI Governed Mode UI
  governedFlow: { open: false },
  // Phase 21 Ship-it Drawer
  shipDrawer: { open: false },
  pinned: [],
};

export const createOverlaysSlice: StateCreator<
  OverlaysSlice,
  [],
  [],
  OverlaysSlice
> = (set) => ({
  overlays: initialOverlays,
  openOverlay: (key, state) =>
    set((s) => ({
      overlays: {
        ...s.overlays,
        [key]: { ...(s.overlays[key] as object), open: true, ...(state ?? {}) },
      } as OverlayState,
    })),
  closeOverlay: (key) =>
    set((s) => ({
      overlays: {
        ...s.overlays,
        [key]: { ...(s.overlays[key] as object), open: false } as never,
      },
    })),
  pin: (item) =>
    set((s) => ({
      overlays: {
        ...s.overlays,
        pinned: s.overlays.pinned.some((p) => p.id === item.id)
          ? s.overlays.pinned
          : [...s.overlays.pinned, item],
      },
    })),
  unpin: (id) =>
    set((s) => ({
      overlays: {
        ...s.overlays,
        pinned: s.overlays.pinned.filter((p) => p.id !== id),
      },
    })),
});
