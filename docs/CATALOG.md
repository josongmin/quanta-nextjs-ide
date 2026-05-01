# Next Static Studio — 기능 카탈로그 v1

> 모든 표면(panel · inspector · overlay · diagnostic · primitive · keybinding · setting)을 한 곳에 관리.
> 각 항목은 **이름 · 트리거 · 위치(파일) · 한 줄 설명**의 4필드 카드. 문서가 곧 진실의 원천.

목차:
1. [좌측 패널 — 13 탭](#1-좌측-패널-app-map)
2. [우측 패널 — 11 인스펙터](#2-우측-패널-inspector)
3. [하단 패널 — 7 탭](#3-하단-패널-bottom-panel)
4. [오버레이 — 30](#4-오버레이-overlays)
5. [에디터 표면](#5-에디터-표면-editor-surfaces)
6. [진단 규칙 카탈로그 — 116 ruleIds](#6-진단-규칙-카탈로그-rule-ids)
7. [도메인 모델 / Stores](#7-도메인-모델-stores)
8. [Shared UI primitives — 25+](#8-shared-ui-primitives)
9. [키바인딩](#9-키바인딩)
10. [설정 (persisted)](#10-설정-persisted)
11. [테마](#11-테마)
12. [Command Palette commands](#12-command-palette-commands)

---

## 0. 색인 규약

```
ID                     short slug used in this doc
TRIGGER                ⌘⇧X / 메뉴 / 좌패널 클릭 / 자동 / API
LOCATION               src/path/to/file.tsx
ENTITY                 어떤 zustand store/도메인을 읽는가
DEPENDS                필요한 prerequisite (다른 카탈로그 항목)
NOTE                   v 표 / TODO / 주의
```

---

## 1. 좌측 패널 (App Map)

> Tabs in `src/widgets/left-panel/left-panel.tsx`. 13개. 좌측 사이드바 상단의 segmented bar로 전환.

| ID | TRIGGER | LOCATION | ENTITY | 한 줄 |
|----|---------|----------|--------|-------|
| `files` | tab click | `widgets/left-panel/tabs/files-tab.tsx` | `mockFileTree` | 프로젝트 전체 파일 트리 (route convention과 무관) |
| `routes` | tab click | `widgets/left-panel/tabs/routes-tab.tsx` | `routeStore` | App Router 트리 + 분류칩 (resting=신호만, hover/select=full chips) |
| `actions` | tab click | `widgets/left-panel/tabs/actions-tab.tsx` | `actionStore` | Server Actions, route별 그룹, score chip + closure 토글 |
| `handlers` | tab click | `widgets/left-panel/tabs/handlers-tab.tsx` | `actionStore.handlers` | Route Handlers (method/runtime/auth/cache/rate/idem) |
| `tags` | tab click | `widgets/left-panel/tabs/tags-tab.tsx` | `cacheTagStore` | Cache tags · list + graph view + inconsistency cluster |
| `islands` | tab click | `widgets/left-panel/tabs/islands-tab.tsx` | `boundaryStore` | Client islands (KB · routes · reasons · root flag) |
| `layouts` | tab click | `widgets/left-panel/tabs/layouts-tab.tsx` | `boundaryStore.layouts` | Layouts + pollution score |
| `meta` | tab click | `widgets/left-panel/tabs/metadata-tab.tsx` | `routeStore` | Metadata coverage matrix (title/desc/canon/og/robots) |
| `env` | tab click | `widgets/left-panel/tabs/env-tab.tsx` | `boundaryStore.envVars` | Env vars + scope + leak risk |
| `mid` | tab click | `widgets/left-panel/tabs/mid-tab.tsx` | `boundaryStore.middleware` | Middleware capabilities + warnings |
| `quality` | tab click | `widgets/left-panel/tabs/quality-tab.tsx` | `diagnosticStore` | TS / React / CSS / A11y 통합 |
| `db` | tab click | `widgets/left-panel/tabs/db-tab.tsx` | `databaseStore` | Prisma models · Queries · Transactions |
| `apis` | tab click | `widgets/left-panel/tabs/apis-tab.tsx` | `databaseStore.endpoints` | Handlers + actions + tRPC + GraphQL surface |
| `i18n` | tab click | `widgets/left-panel/tabs/i18n-tab.tsx` | i18n helpers | locale picker + namespace coverage |

---

## 2. 우측 패널 (Inspector)

> Contextual switching via `useUiStore().inspectorContext`. `pinned` 상태에서는 자동 전환 안 됨. 기본 `route_products_id`로 시작.

| ID `kind` | 트리거 (어떻게 진입) | LOCATION | 핵심 섹션 |
|-----------|--------------------|----------|-----------|
| `route` | route 선택 | `widgets/right-panel/inspectors/route-contract-inspector.tsx` | Rendering · Cache · Boundaries · SEO · Auth · Data · Islands · Risks |
| `action` | action 클릭 | `inspectors/action-safety-inspector.tsx` | Score · Checklist · Closure capture · Surface · Quick scaffold |
| `fetch` | fetch 라인 클릭 | `inspectors/fetch-inspector.tsx` | Cache · Recommendation · Pair check · Inside |
| `boundary` | island 클릭 | `inspectors/boundary-inspector.tsx` | Reason · Blast · Optimal islands · Imports |
| `project` | top-bar snapshot 클릭 | `inspectors/project-health-inspector.tsx` | Routes · Cost classes · Risks · Hotspots · Cost regression |
| `migration` | command palette / Next 버전 감지 | `inspectors/migration-inspector.tsx` | Async APIs · serverExternalPackages · cacheHandlers |
| `code-quality` | Quality tab → inspect | `inspectors/code-quality-inspector.tsx` | 4분면 점수 · per-category · Hot files · Suggested cleanups |
| `bundle` | Bundle tab / 인스펙터 진입 | `inspectors/bundle-inspector.tsx` | Composition · Per-route · Vitals · Budget · Suggestions |
| `ai` | command palette | `inspectors/ai-inspector.tsx` | Conversation · Suggested prompts · Compose · Model picker |
| `db` | DB tab 모델 클릭 | `inspectors/db-inspector.tsx` | Schema · Callers · Suggested indices · Hot paths |
| `query` | DB tab query 클릭 | `inspectors/query-inspector.tsx` | Shape · Risks · Reachability · Suggested rewrite |
| `lighthouse` | Lighthouse overlay → inspector | `inspectors/lighthouse-inspector.tsx` | Scores · Top opportunities · Vitals · Recent runs |

> Helper parts in `widgets/right-panel/parts/`: `Inspector` wrapper · `KvRow` · `StateIcon` · `EmptyState` · `QualitySection`.

---

## 3. 하단 패널 (Bottom Panel)

> Tabs in `src/widgets/bottom-panel/bottom-panel.tsx`. 8개.

| ID | LOCATION | 한 줄 |
|----|----------|-------|
| `problems` | `tabs/problems-tab.tsx` | 그룹별 진단 트리 + 멀티셀렉트 + bulk fix + 검색 |
| `semantic-diff` | `tabs/semantic-diff-tab.tsx` | base/head behavior diff + PR comment 생성 |
| `routes` | `tabs/routes-tab.tsx` | 17 routes 정렬 가능 테이블 |
| `cache-lineage` | `tabs/cache-lineage-tab.tsx` | tag별 producers/invalidators/coverage matrix · list/graph 뷰 |
| `bundle` | `tabs/bundle-tab.tsx` | Treemap (drill-down) · Vitals dial · Budget rows |
| `live` | `tabs/live-tab.tsx` → `features/runtime-logs` | 실시간 로그 stream (live mode 600ms tick) · route/level/source 필터 · request-id chip → waterfall |
| `output` | `tabs/output-tab.tsx` | 분석기 로그 (timestamp · channel · level · message) |
| `terminal` | `tabs/terminal-tab.tsx` | Mock 셸 (`help · routes · tags · diff · clear`) + history |

---

## 4. 오버레이 (Overlays)

> 등록 위치: `src/widgets/overlays/overlays-host.tsx`. 모두 `useUiStore().overlays.<key>.open` 으로 토글.

### 4.1 핵심 / Evidence
| KEY | 트리거 | LOCATION | 한 줄 |
|-----|-------|----------|-------|
| `evidenceTracer` | EvidenceCard "Show trace" / Problems 진단 | `features/evidence-tracer/index.tsx` | 진단 cause trace 트리 + affected routes |
| `blastRadius` | use-client lens "↗ map" / Islands 우클릭 | `features/blast-radius/index.tsx` | 클라이언트 boundary 영향 그래프 + 권장 islands |
| `whatIf` | Top-bar snapshot / `⌘⇧W` | `features/what-if/index.tsx` | 4 시나리오 가정 시뮬레이션 |
| `patchPreview` | EvidenceCard "Quick fix" | `features/patch-preview/index.tsx` | diff + behavior diff + 4단계 mute scope |

### 4.2 Workspace / Search
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `commandPalette` | `features/command-palette/index.tsx` | cmdk 기반 multi-source (routes/actions/tags/files/commands) + `#` symbol mode |
| `findReferences` | `features/find-references/index.tsx` | 라우트/태그/액션/심볼 reference grouping |
| `routeFlowEditor` | `features/route-flow-editor/index.tsx` | SVG canvas + pan/zoom + archetype layout (Android Nav editor 영감) |

### 4.3 Wizards / Generators
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `wizardServerAction` | `features/wizards/server-action/index.tsx` | schema · auth · revalidate 입력 → action 코드 생성 |
| `wizardRouteHandler` | `features/wizards/route-handler/index.tsx` | method · runtime · webhook signature → handler 코드 생성 |
| `wizardNewRoute` | `features/wizards/new-route/index.tsx` | archetype별 default → 5개 파일 묶음 생성 |
| `componentPreview` | `features/component-preview/index.tsx` | 6 mock components × 6 states × 4 viewports |
| `mockDataGen` | `features/mock-data-gen/index.tsx` | TS/zod/Prisma/route → deterministic JSON (xorshift32) |

### 4.4 Visualization
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `renderGraph` | `features/render-graph/index.tsx` | 컴포넌트 트리 SVG · re-render hotspots |
| `typeFlow` | `features/type-flow/index.tsx` | DB → Server → Client 직렬화 추적 |
| `tailwindPalette` | `features/tailwind-palette/index.tsx` | Color/Spacing/Radius/Shadow/Typography 5탭 |
| `a11yHeatmap` | `features/a11y-heatmap/index.tsx` | routes × 8 a11y rules 매트릭스 |

### 4.5 AI / Docs / Review
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `learnMore` | `features/learn-more/index.tsx` | rule-doc (what/why/examples/suppression/refs) |
| `prSummary` | `features/pr-summary/index.tsx` | Concise/Standard/Verbose × 5 sections, 라이브 마크다운 |
| `aiPatchGate` | `features/ai-patch-gate/index.tsx` | AI patch admission verdict + reasons + proof obligations |
| `notifications` | `features/notifications/index.tsx` | Today/Earlier 그룹, mark all read |
| `quickDocs` | `features/quick-docs/index.tsx` | 35 keywords (Next/React/TS/CSS) signature + example + caveats |

### 4.6 Settings / Onboarding
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `settings` | `features/settings-panel/index.tsx` | Appearance · Density · Profile · Autofix · Rules (5 tabs) |
| `shortcutHelp` | `features/shortcut-help/index.tsx` | 검색 가능한 키바인딩 카탈로그 (4 sections) |
| `onboarding` | `features/onboarding/index.tsx` | 4-step 첫방문 투어 (auto-open once) |

### 4.7 Security / Compliance
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `cspAdvisor` | `features/csp-advisor/index.tsx` | CSP profile (Strict/Standard/Loose) + 외부 sources + 헤더 생성 |
| `scriptRisk` | `features/script-risk/index.tsx` | 3rd-party script strategy/privacy/perf 분석 |
| `coverageMap` | `features/coverage-map/index.tsx` | unit/integration/e2e 매트릭스 (heatmap) |
| `viewportSimulator` | `features/viewport-simulator/index.tsx` | 6 viewport × archetype mockup |

### 4.8 Full-stack flow
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `authFlowTracer` | `features/auth-flow-tracer/index.tsx` | cookie → jwt → DB → render timeline + cookie/CSRF/session 패널 |
| `formPipeline` | `features/form-pipeline/index.tsx` | field → schema → action → response → UI 5-stage pipeline |
| `i18nCoverage` | `features/i18n-coverage/index.tsx` | 26 keys × 5 locales 매트릭스 + RTL 토글 + orphans |
| `apiContracts` | `features/api-contracts/index.tsx` | handlers/actions/tRPC/GraphQL 통합, in/out CodeBlock, OpenAPI export |

### 4.9 Web platform perf
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `lighthouse` | `features/lighthouse/index.tsx` | 5 SVG arc gauges + opportunities + Web Vitals |
| `criticalCss` | `features/critical-css/index.tsx` | render waterfall + above-fold CSS extractor |
| `imageFormatAudit` | `features/image-format-audit/index.tsx` | format → recommended + lazy/srcset + 합계 saving |

### 4.10 DX 도구
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `snapshotTimeline` | `features/snapshot-timeline/index.tsx` | 6 mock snapshots A vs B compare + SVG mini-charts |
| `splitEditor` | `features/split-editor/index.tsx` | sync-scroll + line-by-line diff |
| `livePreview` | `features/live-preview/index.tsx` | browser-frame chrome + archetype mockup + console mock |
| `workspaceSearch` | `features/workspace-search/index.tsx` | 1080px overlay · regex/case/word · glob include/exclude · replace + per-file groups |

### 4.11 Runtime observability (Wave 6)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `hydrationInspector` | `features/hydration-inspector/index.tsx` | 3 routes 트리 (S/C kind chip · ✓/⚠/−/+) · 320px detail · server vs client diff CodeBlock + suggested fixes |
| `streamingVisualizer` | `features/streaming-visualizer/index.tsx` | SVG timeline 760×280 · 6 chunks ~2s · play/pause · ms scrubber · "@ now" 우측 패널 |
| `rscProfiler` | `features/rsc-profiler/index.tsx` | 14 components × 3 routes · render/payload bars · cache HIT-MISS · SVG dep graph · suggested memoize |
| `cacheHeatmap` | `features/cache-heatmap/index.tsx` | 12 fetches × 24 buckets (5m/15m/1h) · hit ratio · p50–p95 ages · recommendation CodeBlock |
| `actionReplay` | `features/action-replay/index.tsx` | 6 mock runs · SVG timeline · ok/fail filter · replay & compare toasts |
| `requestWaterfall` | `features/request-waterfall/index.tsx` | 4 routes (dashboard 31 entries) · TTFB+download segments · 3p dot · LCP marker · TBT 합계 |
| `edgeColdWarm` | `features/edge-cold-warm/index.tsx` | 8 functions · sortable warmRatio · regions cluster · scatter (bundleKB × coldP50) |

### 4.12 Debug tier (Wave 6)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `timeTravel` | `features/time-travel/index.tsx` | 25 actions · play/pause/1×/2×/4× · 3-pane diff (before/after/patch) |
| `renderReasoner` | `features/render-reasoner/index.tsx` | 32 events · 5 reasons · SVG histogram · prop/state delta tables · memoize suggestion |
| `effectLog` | `features/effect-log/index.tsx` | 25 entries · phase chips · stale-deps detection · deps `CodeBlock` + suggested fix |
| `suspenseViz` | `features/suspense-viz/index.tsx` | 3 route trees · 시간 scrubber · pending pulse · fallback CodeBlock |
| `breakpointManager` | `features/breakpoint-manager/index.tsx` | 8 breakpoints · 4 kinds (line/cond/log/trace) · inline add form · enable/hits/actions popover |
| `consoleReplay` | `features/console-replay/index.tsx` | 41 entries · regex 검증 · 듀얼 time-range · stack frame click · export JSON |

### 4.13 Collaboration tier (Wave 7)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `presenceRoster` | `features/presence-roster/index.tsx` | 6 mock teammates · live cursors · file-grouped where-everyone-is map · follow/huddle |
| `commentThread` | `features/comment-thread/index.tsx` | 8 line-anchored threads · open/resolved/mine 필터 · markdown posts · reactions · suggested AI reply |
| `conflictViz` | `features/conflict-viz/index.tsx` | yours/base/theirs 3-column diff · hand-rolled SVG connectors · Apply mine/theirs/merge |
| `reviewRequest` | `features/review-request/index.tsx` | reviewer 8명 score 랭킹 · expertise tags · availability · 5-item 체크리스트 |

### 4.14 Test / Quality intelligence (Wave 7)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `testImpact` | `features/test-impact/index.tsx` | 25 tests · changed-files → impacted-tests SVG dep graph · minutes-saved 합계 |
| `flakyDetector` | `features/flaky-detector/index.tsx` | 12 tests × 30 runs sparkline · flakeScore · stable/sus/flaky/broken · quarantine |
| `snapshotDiff` | `features/snapshot-diff/index.tsx` | 6 snapshots (jsx/json/image) · 사이드바이사이드 lineDiff · image diff regions |
| `coverageInspector` | `features/coverage-inspector/index.tsx` | per-line gutter dots (green/amber/red) · 4 radial summary arcs · weak chip |
| `mutationTesting` | `features/mutation-testing/index.tsx` | 6 files mutation score · survived mutants · mutator breakdown sparkline |

### 4.15 AI agent surfaces (Wave 7)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `agentQueue` | `features/agent-queue/index.tsx` | 5 parents × 3-7 child tasks 트리 · status/agent 필터 · KvRow detail · cost meter |
| `toolCallTimeline` | `features/tool-call-timeline/index.tsx` | 24 calls SVG swimlane · per-tool row · args/output CodeBlock · parallelism % |
| `planCanvas` | `features/plan-canvas/index.tsx` | 8-node SVG graph + pan · per-node editor (title/kind/deps/eta/notes) · total ETA |
| `diffApproval` | `features/diff-approval/index.tsx` | 5 patches queue · Diff/Risk/Proof tabs · X of N proofs gate · Approve/Block/Defer |
| `tokenMeter` | `features/token-meter/index.tsx` | 14d × 3 model SVG stacked · 4 KPI · agent breakdown · budget setter |

### 4.16 Data / API design (Wave 7)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `erDiagram` | `features/er-diagram/index.tsx` | 7 모델 SVG canvas + pan · PK/FK/nullable 아이콘 · cardinality 1/∞ |
| `migrationPlanner` | `features/migration-planner/index.tsx` | 8 ops · Shadow→Dual-write→Cutover→Backfill 타임라인 · per-stage risk meter |
| `apiPlayground` | `features/api-playground/index.tsx` | 12 endpoints REST/GraphQL/tRPC · param form (string/enum/bool) · Body/Headers/zod/cURL tabs |
| `seedBuilder` | `features/seed-builder/index.tsx` | 5 모델 per-field strategy · live JSON preview · FK strategy · dependency-order graph |

### 4.17 Wave 8 creative
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `perfBudgetSimulator` | `features/perf-budget-simulator/index.tsx` | 12 candidate adds · per-route current vs simulated bar chart · 예산 초과 빨강 |
| `errorBudgetCockpit` | `features/error-budget-cockpit/index.tsx` | 4 SLO · 2×2 burn-down (actual + dashed projection) · headroom + days-to-zero |
| `featureFlagOrchestrator` | `features/feature-flag-orchestrator/index.tsx` | 6 flags · 0-100% slider + 5/25/50/100 presets · risk gate checklist · dep SVG graph |
| `realUserMonitor` | `features/real-user-monitor/index.tsx` | LCP/INP/CLS 14d × 8 routes · p50/p75/p95 area band · device donut · country flags |
| `designTokenLab` | `features/design-token-lab/index.tsx` | inline-edit token tree · live preview gallery · WCAG-AA pair report · token usage |
| `competitiveBenchmark` | `features/competitive-benchmark/index.tsx` | 6 routes × you+3 competitors heatmap (tertile colored) · auto opportunity list |

### 4.18 Code Intelligence Pro (Wave 9)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `semanticCodeSearch` | `features/semantic-code-search/index.tsx` | 24 indexed snippets · vector-style 검색 · distance bar + reason chip · facets · recent queries |
| `architectureMap` | `features/architecture-map/index.tsx` | 6 layered rows · edges Q-curve thickness=log(count) · circular-dep red bidirectional · ADR 생성 |
| `deadCodeFinder` | `features/dead-code-finder/index.tsx` | 30 dead exports/files/branches · safe-only toggle · usage chain · removal PR |
| `apiSurfaceDiff` | `features/api-surface-diff/index.tsx` | v1.0 vs HEAD · Added/Removed/Changed/Deprecated tabs · semver verdict · auto changelog |
| `symbolPopularity` | `features/symbol-popularity/index.tsx` | top-30 symbol heat · 8-week sparkline · cold symbol detector |

### 4.19 Security Center (Wave 9)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `secretScanner` | `features/secret-scanner/index.tsx` | 18 findings · entropy bar · masked evidence · rotation playbook |
| `cveTimeline` | `features/cve-timeline/index.tsx` | 24-week install bars + CVE swimlane · per-CVE exposure window · update PR |
| `supplyChainGraph` | `features/supply-chain-graph/index.tsx` | 24 packages SVG dep graph · 크기=log(downloads) · provenance 색 · 1/2/3 hop |
| `sbomViewer` | `features/sbom-viewer/index.tsx` | 60-pkg SBOM · sortable · dependency path · license donut · CycloneDX export |
| `licenseCompliance` | `features/license-compliance/index.tsx` | 12-license × 12 heatmap · violators · suggested replacement · NOTICE.md 생성 |

### 4.20 Performance Forensics (Wave 9)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `flameGraph` | `features/flame-graph/index.tsx` | 80 frames depth-6 SVG · click 포커스 · dbl-click 줌 · self/total ms · top children |
| `memorySnapshotDiff` | `features/memory-snapshot-diff/index.tsx` | 4 snapshots · 22-constructor delta · retainer chain · leak hint chips |
| `longTaskTracker` | `features/long-task-tracker/index.tsx` | 60s 타임라인 · 50-500ms 슬라이더 · TBT 기여 per kind · top-10 worst |
| `bundleEvolution` | `features/bundle-evolution/index.tsx` | 12-week stacked area + per-route 4×2 mini-line · 변화 callout · Export PNG |
| `assetWaterfall` | `features/asset-waterfall/index.tsx` | TTFB+download 분리 bar · cached hatch · 3p badge · FCP/LCP/TTI marker |

### 4.21 Developer Wellness (Wave 9)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `focusSession` | `features/focus-session/index.tsx` | 5 presets · SVG progress ring · 자동 break + 10 suggestions · 일일 stats |
| `cognitiveLoadMap` | `features/cognitive-load-map/index.tsx` | 40 files complexity × edit-freq scatter · risk tier 색 · top-10 위험 · refactor plan |
| `reviewFatigue` | `features/review-fatigue/index.tsx` | 8 reviewer fatigue ring · 8-week sparkline · pause/helper 추천 · radial team gauge |
| `pairQueue` | `features/pair-queue/index.tsx` | 6 available · 4 active pairs (live duration) · smart match (expertise + energy) |

### 4.22 Editor + Navigation classics (Wave 10)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `goToSymbol` | `features/go-to-symbol/index.tsx` | 30 symbols × 4 files · 7 kind chips · Outline mode (tree) |
| `callHierarchy` | `features/call-hierarchy/index.tsx` | Callers/Callees 탭 · 재귀 트리 (depth 1/2/3/all) · body preview |
| `typeHierarchy` | `features/type-hierarchy/index.tsx` | 14 types · SVG 트리 · Supertypes/Subtypes/Both · members table |
| `peekDefinition` | `features/peek-definition/index.tsx` | line-numbered code view · 1 of N (overload nav) · symbol metadata rail |
| `renameRefactor` | `features/rename-refactor/index.tsx` | 14 occurrences × 6 files · scope select · conflicts · old strike + new underline |

### 4.23 WebStorm-grade (Wave 10)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `localHistory` | `features/local-history/index.tsx` | git 무관 자동 snapshot · 4 files × 12 snapshots · before/after diff · restore 부분/전체 |
| `httpClient` | `features/http-client/index.tsx` | `.http` 스크래치 + env (dev/staging) · 8 saved · 10 history · cURL/.http export |
| `runConfigurations` | `features/run-configurations/index.tsx` | 8 configs · last-8-runs sparkline · parallel popover · 즐겨찾기 일괄 실행 |
| `recentFilesPopup` | `features/recent-files-popup/index.tsx` | `⌃E` style · 10 recent + 5 changed · ↑↓ nav · ⌘↵ split / ⇧↵ peek |
| `databaseTool` | `features/database-tool/index.tsx` | 4 tabs (Query/Schema/Data/JOIN) · SQL 토큰 색상 · A↔B diff · FK SVG |

### 4.24 VSCode-grade (Wave 10)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `notebook` | `features/notebook/index.tsx` | 10 cells (md/code/output) · drag reorder · kernel · table/text/error renderer |
| `sourceControlGraph` | `features/source-control-graph/index.tsx` | 28 commits × 4 branch DAG · 직선/Q-curve · merge double-circle · cherry-pick |
| `tasksRunner` | `features/tasks-runner/index.tsx` | 12 npm tasks · 3-col card grid · "Run quickly" combobox · timestamped output |
| `remoteSession` | `features/remote-session/index.tsx` | 6 SSH/container/codespace · status-aware action · uptime · port forward |
| `profileSwitcher` | `features/profile-switcher/index.tsx` | 5 profiles (Frontend/Backend/Data/Lite/Default) · ext list · settings overrides |
| `settingsSync` | `features/settings-sync/index.tsx` | 4 devices · 카테고리별 diff · per-entry Keep mine/Take theirs · 일괄 resolve |

### 4.25 Refactor library — Next.js flavored (Wave 11)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `extractFunction` | `features/extract-function/index.tsx` | 8-line block · 3 candidate names · param drag-handle ordering · before/after |
| `extractComponent` | `features/extract-component/index.tsx` | 15-line JSX · placement (same/colocated/shared) · props table · 4 detected adoptable usages |
| `inlineSymbol` | `features/inline-symbol/index.tsx` | 9 callsites × 5 files · per-line before/after · 2 extra-formatting warnings |
| `moveToFile` | `features/move-to-file/index.tsx` | source/destination side-by-side · 6 caller imports · rename-on-move |
| `convertToServer` | `features/convert-to-server/index.tsx` | client→server preview · 5 client-only flags 검증 · "why safe" reason chips |
| `convertToClient` | `features/convert-to-client/index.tsx` | server→client preview · +18.4KB blast warning · leaf-island 추천 |
| `extractServerAction` | `features/extract-server-action/index.tsx` | inline fetch → `'use server'` action · 자동 zod schema · revalidate-tag |
| `wrapWithSuspense` | `features/wrap-with-suspense/index.tsx` | fallback select (Spinner/Skeleton/Empty/Custom) · LCP −320ms 추정 |
| `promoteToRoute` | `features/promote-to-route/index.tsx` | segment path · archetype chips (page/layout/loading/error) · 3 redirect site |
| `refactorPalette` | `features/refactor-palette/index.tsx` | cmdk-style · 24 refactors · 6 kind chips · ↑↓/↵ kbd · recently-used pinned |

### 4.26 Live debugging — Node + Edge + RSC (Wave 11)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `debugSession` | `features/debug-session/index.tsx` | 8 frames · runtime switcher (Node/Edge/Browser) · step controls · breakpoint dot · threads + scripts |
| `variablesScope` | `features/variables-scope/index.tsx` | 4 scope tree (Local/Closure/Module/Global) depth 4 · stringified value · mock setter |
| `watchExpressions` | `features/watch-expressions/index.tsx` | 8 expressions · history sparkline · suggested watches · err/stale 상태 |
| `rscPayloadStep` | `features/rsc-payload-step/index.tsx` | 18 Flight chunks · ms scrubber · @now reconstructed tree · raw payload CodeBlock |
| `exceptionPause` | `features/exception-pause/index.tsx` | TypeError 카드 · 3-level cause chain · red squiggle · 3 suggested fix |

### 4.27 AI inline assistant (Wave 11)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `aiInlineExplain` | `features/ai-inline-explain/index.tsx` | streaming explanation (45ms tick) · pulsing cursor · Q&A follow-up · model picker |
| `aiRefactorSuggest` | `features/ai-refactor-suggest/index.tsx` | 6 candidates · confidence threshold slider · risk chip · scope popover (line/file/project) |
| `aiCommitMessage` | `features/ai-commit-message/index.tsx` | Concise/Detailed/Verbose × Conventional Commits scope · streaming + refine prompt |
| `aiDocstring` | `features/ai-docstring/index.tsx` | JSDoc/TSDoc/Markdown · include toggles re-stream · update-all toast |
| `aiRouteScaffold` | `features/ai-route-scaffold/index.tsx` | 4 archetype intents · streaming file tree · runtime/cache/auth options |

### 4.28 Diff / merge tools (Wave 11)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `threeWayMerge` | `features/three-way-merge/index.tsx` | 4-pane Local/Base/Incoming/Result · 6 conflict regions · navigator · progress gating Apply |
| `semanticMerge` | `features/semantic-merge/index.tsx` | 5×5 collision heatmap · cache directive / use-client / route-segment 충돌 인지 |
| `patchStack` | `features/patch-stack/index.tsx` | jj-style 6 patches · drag reorder · Push/Reword/Split/Squash/Drop · stack-health checklist |
| `interactiveRebase` | `features/interactive-rebase/index.tsx` | 8 commits · pick/reword/edit/squash/fixup/drop · projected log · conflict prediction |

### 4.29 Web foundations (Wave 12-A)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `flexGridDebugger` | `features/flex-grid-debugger/index.tsx` | Flex/Grid container · track lines · line numbers · gap fills · cell hover · CSS cause |
| `containerQueryInspector` | `features/container-query-inspector/index.tsx` | `@container` · width slider 0-1000 · breakpoint timeline · live-resized preview |
| `cascadeLayers` | `features/cascade-layers/index.tsx` | `@layer` 우선순위 SVG stack · winner ✓ · specificity calculator · reorder hint |
| `viewTransitions` | `features/view-transitions/index.tsx` | 3 presets · 5-frame filmstrip · scrubber · `::view-transition-*` CSS · reduce-motion |
| `animationTimeline` | `features/animation-timeline/index.tsx` | keyframe pin drag · cubic-bezier playground (200×200) · per-stop property table |
| `storageExplorer` | `features/storage-explorer/index.tsx` | LocalStorage/SessionStorage/Cookies/IndexedDB/Cache API 통합 뷰 · per-type bytes |
| `serviceWorkerLab` | `features/service-worker-lab/index.tsx` | Lifecycle SVG state machine · Caches · Push (VAPID) · Sync queue |
| `webApisProbe` | `features/web-apis-probe/index.tsx` | Permissions · Geolocation · WebRTC stats · Speech · MediaDevices · 8 API probe |
| `formPlayground` | `features/form-playground/index.tsx` | Zod schema → form 자동 생성 · a11y checker · validation events log |

### 4.30 Next.js config / runtime (Wave 12-B)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `nextConfigLab` | `features/next-config-lab/index.tsx` | 24 옵션 · 6 카테고리 · live impact chips · 3 preset bundle (Production/Edge/DX) |
| `parallelRoutesViz` | `features/parallel-routes-viz/index.tsx` | `@modal/@tabs` + `(.)intercept` 파일 트리 SVG · 4-step 전환 시뮬레이터 |
| `middlewareMatrix` | `features/middleware-matrix/index.tsx` | 14 routes × 4 header presets matrix · pass/redirect/block/rewrite · rule lineage tooltip |
| `serverOnlyTracker` | `features/server-only-tracker/index.tsx` | 4 kind 위반 · import-chain trace SVG · before/after suggested fix |
| `typedRoutingGraph` | `features/typed-routing-graph/index.tsx` | typed `<Link>` 그래프 · 4 타입 에러 (red edges) · expected vs actual TS message |

### 4.31 Content / SEO (Wave 12-C)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `ogImageGenerator` | `features/og-image-generator/index.tsx` | 4 templates × 4 locales × 4 sizes · live SVG preview · `opengraph-image.tsx` 자동 생성 |
| `sitemapBuilder` | `features/sitemap-builder/index.tsx` | 18 routes · per-row frequency/priority · live `sitemap.xml` · alternates locale |
| `draftModeViz` | `features/draft-mode-viz/index.tsx` | Production vs Draft 사이드바이사이드 · per-fetch cache 적용 · `enableDraftMode` 핸들러 |
| `hostingMatrix` | `features/hosting-matrix/index.tsx` | Vercel/Netlify/Cloudflare/Self-host × 16 features heatmap · `Score your stack` |

### 4.32 Tooling depth (Wave 12-D)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `turbopackGraph` | `features/turbopack-graph/index.tsx` | 40 modules / 70 edges 모듈 그래프 · Turbopack vs Webpack diff · tree-shaking trace |
| `actionMiddlewareComposer` | `features/action-middleware-composer/index.tsx` | auth/rate-limit/csrf/audit · drag-drop pipeline · 컴파일된 wrapped action CodeBlock |
| `streamingRum` | `features/streaming-rum/index.tsx` | streaming chunk별 vital 매핑 · p50/p75-p95 history band · per-chunk 귀속 |
| `i18nRouteDiff` | `features/i18n-route-diff/index.tsx` | 4 locale × 4 route · diff-tinted blocks · 길이/누락/RTL · re-translate 추천 |

### 4.33 Mobile + A11y deep + i18n deep (Wave 13-A)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `touchSimulator` | `features/touch-simulator/index.tsx` | 8 gestures · 640×360 SVG canvas · gesture record · tap target audit (≥44px) |
| `deviceFramePreview` | `features/device-frame-preview/index.tsx` | 8 device frames · safe-area inset · viewport meta auditor · `env(safe-area-inset-*)` CSS |
| `screenReaderSim` | `features/screen-reader-sim/index.tsx` | NVDA/VoiceOver/TalkBack 스크립트 · landmark 컬러링 · landmark/h-order 이슈 |
| `keyboardFlowViz` | `features/keyboard-flow-viz/index.tsx` | 14 focusables · tab order SVG (skip/loop/unreachable) · 2 modal trap inspector |
| `rtlPreview` | `features/rtl-preview/index.tsx` | LTR vs RTL 사이드바이사이드 · `margin-left → margin-inline-start` 추천 · 3 RTL 언어 sample |
| `pluralRulesTester` | `features/plural-rules-tester/index.tsx` | 8 CLDR locales × ICU MessageFormat · n=0/1/2/3/5/10/21/100/1.5 · missing-category warning |

### 4.34 Email + Realtime + Search (Wave 13-B)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `emailPreview` | `features/email-preview/index.tsx` | 6 templates · Gmail/Outlook/Apple Mail 클라이언트 chrome · A/B subject · dark-mode toggle |
| `pushNotificationLab` | `features/push-notification-lab/index.tsx` | 5 kinds × 4 device · platform-native preview · web-push payload CodeBlock · VAPID |
| `websocketInspector` | `features/websocket-inspector/index.tsx` | 3 connections × 30 frames · 60s SVG timeline · in/out 색상 · room/channel inspector |
| `presenceDebugger` | `features/presence-debugger/index.tsx` | 6 peers · optimistic ops timeline · sent→acked window · 충돌 빨강 · 강제 ack/rollback |
| `searchPlayground` | `features/search-playground/index.tsx` | 60 docs · `+required -excluded "phrase"` parser · facets bar · synonyms editor |
| `rankingTuner` | `features/ranking-tuner/index.tsx` | 6 signals × 2 profiles · weight slider · current vs experimental · rank shift (↑n/↓n/=) |

### 4.35 Payment + Auth + CMS (Wave 13-C)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `stripeCheckoutSim` | `features/stripe-checkout-sim/index.tsx` | 6 outcomes × 4 currency × 5 jurisdiction · 3DS 단계 · refund flow |
| `webhookTester` | `features/webhook-tester/index.tsx` | 12 events · idempotency · signature 검증 · replay form |
| `oauthFlowViz` | `features/oauth-flow-viz/index.tsx` | Google/GitHub/Apple/Naver · 7-step SVG · request/response · PKCE/state |
| `rbacMatrix` | `features/rbac-matrix/index.tsx` | 18 permissions × 5 roles heatmap · allow/conditional/deny · evidence file:line |
| `contentModelDesigner` | `features/content-model-designer/index.tsx` | 5 types · field editor · relationship SVG · zod + GraphQL schema 생성 |
| `scheduledPublish` | `features/scheduled-publish/index.tsx` | 14 items · 24h timeline · 의존성 · prerelease check · ICS export |

### 4.36 DevOps + Privacy + Analytics + AI/ML (Wave 13-D)
| KEY | LOCATION | 한 줄 |
|-----|----------|-------|
| `deployPreviews` | `features/deploy-previews/index.tsx` | 12 envs · uptime sparkline · canary traffic split · promote/rollback |
| `envVarsDiff` | `features/env-vars-diff/index.tsx` | 4 envs × 22 vars matrix · masked secret reveal · rotation date |
| `cookieConsentBuilder` | `features/cookie-consent-builder/index.tsx` | 3 banner styles × 4 region · 16 trackers · TCF/IAB/GDPR-K snippets |
| `piiLineage` | `features/pii-lineage/index.tsx` | 8 PII fields · sources→processors→3p flow · right-to-erasure simulator |
| `funnelEditor` | `features/funnel-editor/index.tsx` | 6-step funnel trapezoid · drop-off 누적 막대 · 8×12 cohort retention heatmap |
| `promptTemplateLab` | `features/prompt-template-lab/index.tsx` | 6 templates · `{{vars}}` · model/token/cost · 4-version history |
| `ragContextViewer` | `features/rag-context-viewer/index.tsx` | top-K + token-budget slider · 12 chunks rank · similarity histogram + threshold |
| `evalSuite` | `features/eval-suite/index.tsx` | 18 cases × 3 models · pass/fail matrix · hallucination chip · regression set |

### 4.37 Floating / 고정 dock
| 위젯 | LOCATION | 한 줄 |
|------|----------|-------|
| Pinned dock | `widgets/overlays/pinned-dock.tsx` | 우상단 floating Why? 패널 핀 |
| Activity Feed | `features/activity-feed/index.tsx` | 우하단 280×200 dockable 분석기 로그 (focus mode에서 hide) |
| Annotation pins | `features/annotations/annotations-pins.tsx` + `widgets/editor/parts/annotations-layer.tsx` | 에디터 라인에 핀 메모, Monaco scroll-synced |

---

## 5. 에디터 표면 (Editor Surfaces)

> `src/widgets/editor/`

| 표면 | LOCATION | 한 줄 |
|------|----------|-------|
| `EditorTabs` | `editor-tabs.tsx` | 파일 탭 + dirty dot + diagnostic 배지 |
| `EditorBreadcrumb` | `editor-breadcrumb.tsx` | semantic 경로 (group / parallel / dynamic 색상) |
| `EditorSticky` | `parts/editor-sticky.tsx` | 위쪽 22px sticky context line |
| `EditorSurface` | `editor-surface.tsx` | Monaco 본체 (custom theme `nss-light`, TS service 비활성, inlay hints provider) |
| `EditorGutter` | `parts/editor-gutter.tsx` | 5컬럼 (line# · severity dot · classification · blast↓ · breakpoint) |
| `EditorLightbulb` | `parts/editor-lightbulb.tsx` | 진단 라인의 quick-fix 라이트벌브 + Popover |
| `EditorDiffGutter` | `parts/editor-diff-gutter.tsx` | semantic-diff 컬러 strip → 클릭 시 하단 패널로 점프 |
| `EditorTabBadge` | `parts/editor-tab-badge.tsx` | 탭 옆 err/warn/hint 배지 |
| `EditorMinimap` | `parts/editor-minimap.tsx` | floating 우측 미니맵 (resting 30%, hover 100%, 클릭 점프) |
| `InlineLenses` | `parts/inline-lenses.tsx` | route/action/use-client 위 LensLine view-zone (portal) |
| `SelectionActionBar` | `parts/selection-action-bar.tsx` | 선택 위 floating action bar (context-aware) |
| `DiagnosticHover` | `parts/diagnostic-hover.tsx` | EvidenceCard floating popover (라인 anchor, scroll 시 close) |
| `EditorContextMenu` | `parts/editor-context-menu.tsx` | 우클릭 (Understand/Navigate/Refactor/Policy 4 그룹) |
| `AnnotationsLayer` | `parts/annotations-layer.tsx` | 사용자 annotation pins 레이어 |
| `InlineBlameLayer` | `parts/inline-blame-layer.tsx` | GitLens-style ghost-row blame (현재 라인 끝 author·age·sha) |
| `ColorPickerLayer` | `parts/color-picker-layer.tsx` | CSS color 12×12 swatch + popover (hex/RGB/HSL · alpha · recent · Copy/Replace) |
| `ImagePreviewLayer` | `parts/image-preview-layer.tsx` | 이미지 경로 hover 시 floating preview card (placeholder + filename/size/dim) |
| `LinkedEditingLayer` | `parts/linked-editing-layer.tsx` | JSX tag pair underline + closing 태그 옆 `linked` chip |
| `StickyScrollLayer` | `parts/sticky-scroll-layer.tsx` | 외부 스코프 헤더 라인 (function/class/if/for) 최대 3 pinned + 클릭 reveal |
| `BracketColorizationLayer` | `parts/bracket-colorization-layer.tsx` | `{}()[]` depth-cycle 5색 · 커서 enclosing pair 세로 가이드 |
| `InlineParamHintsLayer` | `parts/inline-param-hints-layer.tsx` | `paramName:` 고스트 텍스트 (cn/match/useEffect/useMemo/useState/setTimeout) cap 6 |
| `CodeLensLayer` | `parts/code-lens-layer.tsx` | declaration 위 [N refs] [N impls] [author · age] chip bar (toast) |
| `useLineSemantics` | `use-line-semantics.ts` | 라인별 LineKind / ghost text / classification mark 도출 |
| `useMonacoDecorations` | `use-monaco-decorations.ts` | squiggle wave/dashed/dotted + after-line ghost annotation |

---

## 6. 진단 규칙 카탈로그 (Rule IDs)

> `src/shared/types/diagnostic.ts`의 `ruleIdZ` enum. 카테고리별 정리. 116개.

### 6.1 Next.js — Rendering / Why-Dynamic
`why-dynamic` · `static-feasibility` · `cost-regression` · `ppr-shell`

### 6.2 Next.js — Migration
`async-request-api` · `use-cache-analyzer` · `cache-handler-migrate` · `server-external-pkg-rename`

### 6.3 Next.js — Server/Client Boundary
`use-client-blast` · `server-only-leak` · `browser-api-in-server` · `non-serializable-prop` · `can-be-server`

### 6.4 Next.js — Cache / Revalidation
`fetch-policy` · `revalidate-pair` · `tag-taxonomy` · `data-classification` · `react-cache-advisor`

### 6.5 Next.js — Server Actions
`action-safety` · `action-closure` · `special-throw-guard` · `form-action-link` · `csrf-allowed-origins`

### 6.6 Next.js — Route Conventions
`boundary-coverage` · `parallel-default-missing` · `intercepting-validity` · `notfound-correctness`

### 6.7 Next.js — Metadata
`metadata-base` · `static-meta-dynamic-params` · `metadata-coverage` · `meta-file-convention`

### 6.8 Next.js — Image / Font / Script
`image-misuse` · `image-blur` · `font-weight-waste` · `script-strategy`

### 6.9 Next.js — Security
`secret-flow` · `pii-boundary` · `auth-detector` · `open-redirect`

### 6.10 PPR / Suspense / Streaming
`suspense-search-params` · `sequential-fetch` · `post-stream-special`

### 6.11 Hydration
`hydration-mismatch` · `theme-fouc`

### 6.12 Diff / Review
`behavior-change` · `pr-comment` · `pre-commit-gate` · `ai-patch-gate`

### 6.13 Route Handler 전용
`webhook-route-guard` · `rate-limit-missing` · `cors-policy` · `response-cache-header`

### 6.14 TypeScript
`ts-any-usage` · `ts-as-assertion` · `ts-ignore-comment` · `ts-unused-export` · `ts-missing-return-type` · `ts-type-complexity` · `ts-strict-gap` · `ts-import-type-mix` · `ts-conditional-explosion`

### 6.15 React
`react-missing-key` · `react-hook-deps` · `react-conditional-hook` · `react-effect-cleanup` · `react-context-memo` · `react-rerender-hotspot` · `react-children-typing` · `react-forward-ref` · `react-suspense-placement` · `react-error-boundary` · `react-19-action-state`

### 6.16 CSS / Tailwind
`css-tailwind-drift` · `css-raw-color` · `css-raw-spacing` · `css-zindex-inflation` · `css-important` · `css-dark-mode-gap` · `css-responsive-gap` · `css-module-unused` · `css-token-violation`

### 6.17 Accessibility
`a11y-missing-alt` · `a11y-form-label` · `a11y-heading-order` · `a11y-button-name` · `a11y-color-contrast` · `a11y-focus-order` · `a11y-aria-misuse` · `a11y-tabindex-abuse`

### 6.18 Performance
`perf-heavy-package` · `perf-bundle-bloat` · `perf-image-optimization` · `perf-long-task` · `perf-lcp-candidate` · `perf-cls-source` · `perf-network-waterfall` · `perf-budget-violation`

### 6.19 Database / ORM
`db-n-plus-one` · `db-missing-index` · `db-no-transaction` · `db-large-result` · `db-unbounded-query` · `db-select-star` · `db-raw-sql-injection`

### 6.20 API contracts
`api-contract-drift` · `api-missing-version` · `api-missing-types` · `api-trpc-misuse`

### 6.21 Auth flow
`auth-flow-cookie-leak` · `auth-flow-missing-csrf` · `auth-flow-session-refresh` · `auth-flow-jwt-rotate`

### 6.22 Form pipeline
`form-schema-drift` · `form-progressive-enhancement` · `form-error-mapping` · `form-server-state`

### 6.23 i18n
`i18n-missing-key` · `i18n-orphan-key` · `i18n-locale-coverage` · `i18n-rtl-support`

### 6.24 Lighthouse-class web perf
`lh-lcp-candidate` · `lh-cls-source` · `lh-tbt-source` · `lh-render-blocking` · `lh-unused-css` · `lh-unused-js`

### 6.25 Critical CSS / 렌더 경로
`css-critical-missing` · `css-render-blocking-font` · `css-layout-thrash` · `css-animation-cost`

### 6.26 Image / asset
`img-format-suboptimal` · `img-lazy-missing` · `img-srcset-missing` · `asset-preload-advisor`

### 진단 카테고리 (`category` 필드)
`rendering` · `cache` · `boundary` · `action` · `metadata` · `security` · `ppr` · `hydration` · `migration` · `convention` · `review` · `typescript` · `react` · `css` · `a11y` · `perf` · `dx` · `db` · `api-contract` · `auth-flow` · `form` · `i18n` · `lighthouse` · `asset`

---

## 7. 도메인 모델 / Stores

> Zustand stores, FSD `entities/<slice>/store.ts`.

| Store | 위치 | 노출 |
|-------|------|------|
| `useUiStore` | `app/store/ui.store.ts` | panel sizes · tabs · inspectorContext · density/profile/colorMode/autofix · overlays · recents · bookmarks · focusMode · annotations (persist v2) |
| `useEditorStore` | `app/store/editor.store.ts` | tabs · activeTabId · cursor · selection |
| `useRouteStore` | `entities/route/store.ts` | routes · tree · selectedRouteId · filter · search |
| `useDiagnosticStore` | `entities/diagnostic/store.ts` | diagnostics · groupBy · filters · mutedRuleIds · mutedDiagnosticIds · ruleSeverityOverrides · selectedDiagnosticIds |
| `useCacheTagStore` | `entities/cache-tag/store.ts` | tags · selectedTagId · view (list/graph) |
| `useActionStore` | `entities/server-action/store.ts` | actions · handlers + selection |
| `useBoundaryStore` | `entities/boundary/store.ts` | islands · layouts · envVars · middleware |
| `useSemanticDiffStore` | `entities/semantic-diff/store.ts` | diff · selectedEntryId |
| `usePerformanceStore` | `entities/performance/store.ts` | bundle · vitals · budgets · selectedNodeId · sideFilter · unit |
| `useNotificationStore` | `entities/notification/store.ts` | list · unreadCount + mark/push |
| `useDatabaseStore` | `entities/database/store.ts` | models · queries · transactions · endpoints + selectors |

### 도메인 타입 (`src/shared/types/`)
- `severity.ts` — `Severity` · `Confidence` · `RenderingClass` · `CostClass` · `Runtime` · `Archetype`
- `code-location.ts`
- `route.ts` — `Route` · `RouteTreeNode` · `BoundaryState` · `RouteMetadataCoverage` · `RouteAuth` · `DataSource` · `ClientIslandRef`
- `server-action.ts` — `ServerAction` · `ActionChecklistItem` · `RouteHandler`
- `cache.ts` — `CacheTag` · `CacheTagSite` · `FetchSite`
- `boundary.ts` — `ClientIsland` · `LayoutInfo` · `EnvVar` · `MiddlewareInfo` · `ImportLeak`
- `diagnostic.ts` — `Diagnostic` · `EvidenceItem` · `QuickFix` · `RuleId`
- `semantic-diff.ts` — `SemanticDiff` · `SemanticDiffEntry`
- `performance.ts` — `BundleNode` · `WebVitalsScore` · `RouteVitals` · `PerfBudget`
- `database.ts` — `PrismaModel` · `PrismaField` · `PrismaIndex` · `DbQuery` · `DbTransaction`
- `api-surface.ts` — `ApiEndpoint` · `ApiEndpointKind`

### Mock 데이터 (`src/shared/mocks/`)
17 routes · 8 cache tags · 3 server actions · 3 route handlers · 5 client islands · 5 layouts · 6 env vars · middleware · 9 semantic diff entries · 6 mock source files · 6 Prisma models · 16 queries · 26 endpoints · 4 auth flows · 3 forms · 26 i18n keys × 5 locales · 17 LH reports · 20 image entries · 6 snapshots · 13 mock notifications · plus diagnostic suites: `mockDiagnostics` (20) + `*-typescript` (9) + `*-react` (11) + `*-css` (9) + `*-a11y` (8) + `*-perf` (10) + `*-db` (13) + `*-flow` (12) + `*-web` (14) = **106+ diagnostics**.

---

## 8. Shared UI primitives

`src/shared/ui/`

| Primitive | 용도 |
|-----------|------|
| `Button` | tone (default/ghost/accent/soft/warn/err) × size (xs/sm/md/lg/icon) |
| `Chip` | 13 tones, pill shape, soft-tinted backgrounds |
| `ConfidenceDot` | high (filled) / medium (60%) / low (outline) — uses `currentColor` |
| `CostChip` | A→E pill + Tooltip |
| `RenderingChip` | STATIC/ISR/DYNAMIC/UNKNOWN + 풍부한 Tooltip |
| `SeverityDot` / `SeverityLabel` | err/warn/info/hint dot 또는 caps 라벨 |
| `Kbd` | 작은 키 캡 |
| `Section` | Collapsible 섹션 with title/trailing |
| `Inspector` | 우측 패널 wrapper (header + scrollable body + pin) |
| `OverlayPanel` | Radix Dialog wrapper (centered via flex wrapper, fade+zoom no-jitter) |
| `EvidenceCard` | hover popover (Title · Evidence · Impact · Confidence · Footer actions) |
| `PatchPreview` | before/after + behavior diff |
| `LensLine` | inline codelens row |
| `GhostAnnotation` | 라인 끝 italic ghost text |
| `SignBar` | gutter vertical accent line |
| `RouteRow` | route 트리 행 (resting=신호만, hover/selected=풀 칩) |
| `Popover` / `Tooltip` | Radix wrappers (no-jitter fade+zoom) |
| `Tabs` | Radix wrapper (bottom-line indicator) |
| `ContextMenu*` | Radix |
| `ScrollArea` | Radix `type="scroll"` overlay style — 1.5px 두께, 스크롤 시에만 fade-in |
| `Icon` / `IconBox` | lucide 통합 + 사각 letter badge (P/L/⟳/!/?/D/T/R/⊳/[/]/(.)/(...)) |
| `EmptyState` | title + description + icon + action (NO children prop) |
| `Skeleton` | N-line animate-pulse |
| `CodeBlock` | mono pre with line numbers + diff coloring |

> 디자인 원칙: light + hairline (1px) + single accent + no shadows beyond `shadow-pop`. Animations are fade+zoom only (no slide that conflicts with Radix translate centering).

---

## 9. 키바인딩

`src/features/keybindings/keybindings.tsx` — `useGlobalKeybindings()` 등록.

| 키 | 동작 |
|----|------|
| `⌘P` / `Ctrl+P` | Command Palette |
| `⌘⇧P` | Command Palette (commands 모드) |
| `⌘⇧Y` | Why Dynamic? (커서 파일의 첫 진단으로 evidence tracer) |
| `⌘⇧B` | Blast Radius (커서 파일 sourceFile) |
| `⌘⇧E` | Evidence Tracer |
| `⌘⇧W` | What-if |
| `⌘⇧M` | Make this route production-ready (toast preview) |
| `⌘⇧D` | Open Semantic Diff (하단 패널) |
| `⌘⇧K` | Open Cache Lineage (하단 패널) |
| `⌘⇧L` | Open Boundary Optimizer (toast) |
| `⌘⇧F` | Focus mode 토글 |
| `⌘\` | toggleRight |
| `⌘B` | toggleLeft (input 포커스 시 무시) |
| `⌘J` | toggleBottom |
| `Esc` | 활성 overlay close (또는 focus mode exit) |

---

## 10. 설정 (persisted)

LocalStorage `nss-ui` (zustand persist v2). 다음 필드만 persist:

```
leftPanelOpen / rightPanelOpen / bottomPanelOpen
leftPanelWidth / rightPanelWidth / bottomPanelHeight
leftTab / bottomTab
density (minimal | default | rich)
profile (startup | commerce | dashboard | enterprise | taleban | custom)
colorMode (light | light-hc | mac)
autofixPolicy (off | suggest | on-save)
onboardingComplete (boolean)
recents (12개 max, kind/id/label/at)
bookmarks (string[])
focusMode (boolean)
annotations (id/file/line/body/at[])
```

Settings 패널 5탭: **Appearance · Density · Inspection Profile · Autofix · Rules**.

---

## 11. 테마

`src/app/styles/tokens.css`

- **light** (기본) — pure white/cream tokens
- **light-hc** — 강한 ink + 진한 border
- **mac** — Macintosh Edition. 평탄한 platinum cream `#F5F0E6`, Aqua blue `#1F4FA8` 액센트, 4px stippled radial dot 패턴이 body 배경에 깔림. Top bar에 traffic-light controls (red/yellow/green = right/bottom/left 토글).

ThemeBridge (App.tsx) — `<html data-theme>` 으로 적용.
ScrollFadeBridge — 스크롤 동안만 `<html data-scrolling="true">` 토글, 800ms idle 후 unset → 스크롤바 overlay fade-in/out.

---

## 12. Command Palette commands

`src/features/command-palette/helpers.ts` — `nssCommands` 카탈로그.

### 카테고리 (38 commands)
- **Understand** (6) — Why dynamic? · Show client blast · Explain this file · Show route contract · Show cache lineage · Show server action safety
- **Find** (9) — untagged fetches · missing revalidate pairs · raw fetches · sequential fetches · 'use client' boundaries · server-only leaks · missing error/loading boundaries · non-serializable props · missing auth on /admin
- **Refactor** (7) — Make production-ready · Extract client island · Convert to Server · Move 'use client' down · Add cache policy · Generate boundary · Run boundary optimizer
- **Migration** (3) — Next 14→15 · unstable_cache → 'use cache' · cacheHandler → cacheHandlers
- **Diff/Review** (3) — Show semantic diff · Generate PR comment · Run pre-commit gate
- **Project** (8) — Open Project Health · Open Inspection Profile · Open What-if · Open Route Flow Editor · Open Boundary Optimizer · Open Cache Lineage · Snapshot semantic state · Compare snapshots
- **Policy** (3) — Edit route contract · Edit team rulebook · Set inspection profile

### 기타 multi-source 결과
- Routes (모든 path) · Server Actions · Cache Tags · Files (route + island + layout + action 통합)
- `#` prefix → Symbol mode (Files / Commands 숨김, Routes/Actions/Tags만)

---

## 13. 외부 패키지 (SOTA 스택)

```
core:        vite 6 · react 18 · react-router 7 · typescript 5.7 (strict++) · tailwind 3
state:       zustand 5 (persist) · zod 3
ui prim:     radix-ui (12+ packages) · cmdk · @floating-ui/react · sonner
icons:       lucide-react
editor:      monaco-editor + @monaco-editor/react
class:       class-variance-authority · clsx · tailwind-merge
patterns:    ts-pattern
virtual:     @tanstack/react-virtual
```

---

## 14. 빌드 / Lint

```
npm run typecheck   tsc -b 0 errors
npm run build       vite build · 1932 modules · ~2.5s · main 791KB / gzip 198KB
npm run lint        eslint v9 flat config (eslint.config.js)
npm run dev         vite dev server (port 5173)
```

manualChunks: monaco · radix · icons · react-vendor · zod · zustand · floating · cmdk · sonner · ts-pattern · tanstack 모두 분리.

---

## 15. v 후보 / TODO

- [ ] **Editor: split editor를 실제 Monaco 두 개로** (현재는 mock CodeBlock 두 개)
- [ ] **Live Preview를 진짜 iframe**으로 (현재 archetype mockup)
- [ ] **AI Pane streaming**을 진짜 SSE / WebSocket
- [ ] **Annotation drag-to-move**
- [ ] **Activity Feed live stream** (entity store + push from analyzer events)
- [ ] **Diff 알고리즘** — 현재 Split editor의 line-equality 기반 diff를 myers diff로
- [ ] **PPR shell map** 시각화
- [ ] **`use cache` directive** 분석 (Next 15+) — ruleId만 등록되어 있음
- [ ] **Real codemod runner** (현재 모든 fix는 toast)
- [ ] **lint config refinement** — react-refresh / @typescript-eslint 추가 룰

---

## 한줄 정리

```
13 left tabs · 11 right inspectors · 8 bottom tabs · 176 overlays · 116 rule IDs ·
~106 mock diagnostics · 25+ shared primitives · 12 zustand stores · 3 themes ·
14 keybindings · 38 NSS commands · 20 editor surfaces (incl. 8 SOTA layers).
build: ~3.7s · main 528KB / gzip 134KB · 176 lazy chunks (overlay당 split).
audit: docs/AUDIT.md — bundle 73% 감소, lazy mount, store 핫패스 fix.

Wave 6 added: hydration inspector · streaming visualizer · RSC profiler ·
cache heatmap · action replay · request waterfall · edge cold/warm ·
time travel · render reasoner · effect log · suspense viz · breakpoint manager ·
console replay · workspace search · runtime logs (live tab) ·
inline blame · color picker · image preview · linked editing.

Wave 7 added (collab+test+ai-agent+data): presence roster · comment thread ·
conflict viz · review request · test impact · flaky detector · snapshot diff ·
coverage inspector · mutation testing · agent queue · tool-call timeline ·
plan canvas · diff approval · token meter · ER diagram · migration planner ·
API playground · seed builder.

Wave 8 creative: perf budget simulator · error budget cockpit ·
feature flag orchestrator · real user monitor · design token lab ·
competitive benchmark.

Wave 9 added (code-intel + security + perf-forensics + wellness):
semantic code search · architecture map · dead code finder · API surface diff ·
symbol popularity · secret scanner · CVE timeline · supply-chain graph ·
SBOM viewer · license compliance · flame graph · memory snapshot diff ·
long-task tracker · bundle evolution · asset waterfall · focus session ·
cognitive load map · review fatigue · pair queue.

Wave 10 added (IDE classics from VSCode/WebStorm):
go-to-symbol · call hierarchy · type hierarchy · peek definition ·
rename refactor · local history · http client · run configurations ·
recent files popup · database tool · notebook · source control graph ·
tasks runner · remote session · profile switcher · settings sync ·
sticky scroll · bracket colorization · inline param hints · code lens.

Wave 11 added (Next.js-flavored: refactor + debug + AI inline + diff/merge):
extract function · extract component · inline symbol · move to file ·
convert to server · convert to client · extract server action ·
wrap with Suspense · promote to route · refactor palette ·
debug session (Node/Edge/Browser) · variables scope · watch expressions ·
RSC payload step · exception pause · ai inline explain · ai refactor suggest ·
ai commit message · ai docstring · ai route scaffold ·
three-way merge · semantic merge (Next.js-aware) · patch stack ·
interactive rebase.

Wave 12 added (web foundations + Next.js depth + content/SEO + tooling depth):
flex/grid debugger · container query inspector · cascade layers ·
view transitions · animation timeline · storage explorer ·
service worker lab · web APIs probe · form playground ·
next.config lab · parallel routes viz · middleware matrix ·
server-only tracker · typed routing graph ·
OG image generator · sitemap builder · draft mode viz · hosting matrix ·
Turbopack graph · action middleware composer · streaming RUM ·
i18n route diff.

Wave 13 added (mobile + a11y deep + i18n deep + email/realtime/search +
payment/auth/cms + devops/privacy/analytics/AI-ML):
touch simulator · device frame preview · screen reader sim · keyboard flow viz ·
RTL preview · plural rules tester · email preview · push notification lab ·
websocket inspector · presence debugger · search playground · ranking tuner ·
stripe checkout sim · webhook tester · OAuth flow viz · RBAC matrix ·
content model designer · scheduled publish · deploy previews · env vars diff ·
cookie consent builder · PII lineage · funnel editor · prompt template lab ·
RAG context viewer · eval suite.

Wave 13 architecture audit applied:
- 176 overlay imports converted to React.lazy + Suspense gate
- main bundle 2072KB → 528KB raw / 507KB → 134KB gzip (~73% reduction)
- keybindings.tsx whole-overlay subscription removed (avoids re-binding listener
  on every overlay open/close)
- annotations capped at 200 entries (persistence bloat guard)
- See docs/AUDIT.md for full findings + open recommendations.

Wave 17 SOTA++ deep refactor (5 parallel agents, 3 fully + 2 partial):
- @app/store codemod COMPLETE: 237 import sites rewritten to @entities/ui-shell
  or @entities/editor; back-compat shim deleted; src/app/ has only App.tsx +
  router.tsx + styles/.
- ts-morph isolated to Web Worker (use-cache.worker.ts + use-cache-client.ts):
  ts-morph chunk no longer in main graph. Vite confirms via "Generated empty
  chunk: ts-morph". Worker fetched only when use-cache analyzer opens or
  ts-strict seed runs in dev.
- Real ts-strict analyzer (src/shared/analyzer/ts-strict.ts): scans e2e fixture
  via import.meta.glob raw text, emits 14 real diagnostics (3 ts-as-assertion
  warn + 11 ts-missing-return-type hint) into useDiagnosticStore alongside
  mocks. Reuses existing RuleIds.
- E2E smoke tests (e2e/analyzers.spec.ts): 3 new passing tests verifying
  routes-tab fixture routes, use-cache analyzer findings, and real ts-strict
  diagnostics in problems tab. 10/10 passing.
- 12 oversized features split (rate-limited mid-flight): rsc-payload-step
  868 → split, all features ≤438 LOC remaining; remaining 12 mid-band can be
  picked up next wave.
- Cleanup: removed orphan plugin-findings feature, dead PluginFindingsBanner
  references, vite.config externals for @tauri-apps/plugin-{fs,shell,dialog}.
- main bundle 535 → 553KB / gzip 137 → 142KB (+5KB for codemod surface area
  but no new ts-morph in main graph).

Wave 16 SOTA++ refactor (6 parallel agents, 4 fully complete + 2 hit rate limit
mid-completion):
- app/store demoted → entities/ui-shell + entities/editor + back-compat shim
  (~280 imports continue working via @app/store re-export). Public API +
  persist `nss-ui` v2 partialize byte-identical.
- 7 entities de-anemized: route/diagnostic/server-action/boundary/cache-tag/
  database/performance — 22 store methods + 33 standalone selectors added
  (selectByArchetype/selectDiagnosticById/selectIslandsForRoute etc.).
  3 callers migrated as examples (render-graph/evidence-tracer/patch-preview).
- First REAL static analyzer: src/shared/analyzer/use-cache.ts (ts-morph 28).
  Scans e2e/fixtures/next-app/app/** via import.meta.glob + raw text → reports
  has-directive/candidate/unsafe per function. Backed by entities/cache-directive
  + features/use-cache-analyzer overlay. ts-morph lazy chunk 1.6MB gzip,
  loaded only when overlay opens.
- Routes tab seeded from REAL Next.js fixture in dev: src/shared/analyzer/routes.ts
  detects 8 routes from app/** including dynamic/parallel/intercepting segments.
  Mock data preserved as production fallback.
- Storybook 10 (@storybook/react-vite) added with 8 stories: Button/Chip/Switch/
  OverlayPanel/CodeBlock/Tooltip + 2 feature stories (notifications/shortcut-help).
  npm run storybook + build-storybook scripts.
- 12 additional oversized features split (rate-limited mid-flight; flame-graph
  manually completed): parts/* extraction continued.
- main bundle 523KB → 535KB / gzip 134KB → 137KB (+3KB for analyzer wiring,
  ts-morph in own lazy chunk).

Wave 15 P1 architecture polish (7 parallel refactors):
- overlays-host.tsx 226 → 152 LOC via `import.meta.glob` self-registering
  registry (4 manual fallbacks: settings + 3 wizards)
- 10 entity barrels added (boundary/cache-tag/database/diagnostic/notification/
  performance/route/runtime/semantic-diff/server-action) → 63 deep imports
  rewritten to bare `@entities/X`
- 11 shared/mocks upward hops eliminated: 11 new shared types
  (auth-flow/form-flow/i18n/image-format/render-path/lighthouse/hydration/
  streaming/rsc-component/notification/rsc-payload) + helper inversions
- Notification.action.onClick (UI leak) → discriminated union NotificationAction
  (open-overlay | open-route | toast | noop); runAction helper at UI boundary
- Switch primitive added (shared/ui/switch.tsx) + 4 features migrated
  (email-preview/rule-manager/breakpoint-manager/extract-component); 4 raw
  bg-white violations tokenized to bg-bg
- OverlayPanel size scale (sm 720 / md 960 / lg 1080 / xl 1180 / full 1280) +
  181 callsites migrated; 3 unique outliers kept literal
- 8 oversized features split (database-tool 718→172, http-client 534→214,
  asset-waterfall 532→142, notebook 530→135, cookie-consent-builder 519→134,
  design-token-lab 496→114, plan-canvas 484→92, streaming-rum 483→140);
  4296 → 1143 LOC (-73% in indexes), 36 parts/* files extracted
- main bundle 528 → 523KB (~5KB savings, 134KB gzip stable)

Wave 14 SOLID + FSD + Domain refactor (P0 applied):
- ui.store.ts (663 LOC, 12 concerns) split into 6 zustand slices:
  layout / prefs / inspector / overlays / recents / annotations.
  Public API + persist `nss-ui` v2 shape byte-identical → 234 importers untouched.
- 4 toolbar primitives (PanelHeader / SearchInput / SelectControl / ToggleChip)
  moved widgets/bottom-panel/parts/* → shared/ui/* — 106 import sites rewritten,
  ~190 FSD upward hops eliminated.
- entities/code-symbol/ created → 4 features (peek-definition, go-to-symbol,
  symbol-popularity, type-flow) now share canonical CodeSymbolKind via
  `Extract&lt;...&gt;` (no breakage). zod schemas included.
- entities/module/ created → turbopack-graph's ModuleEdge aliased to canonical
  ImportEdge; ModuleKind re-exported. architecture-map's Layer + dead-code-finder's
  DeadEntry intentionally not migrated (different concepts; documented).
- src/features/ai-pane/ removed (empty orphan, 0 references).
- src/vite-env.d.ts added (`import.meta.env.DEV` types).
- 4 react-hooks/exhaustive-deps warnings resolved.
- typecheck 0 errors · build green · main bundle stable at 528KB / gzip 134KB.
- See docs/AUDIT-SUMMARY.md + AUDIT-{FSD,SOLID,DOMAIN,UI,*}.md.
```
