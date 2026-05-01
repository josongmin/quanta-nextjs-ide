/**
 * Heat-score model.
 *
 * Combines four cheap signals into a 0..1 score per file:
 *   - **diagnostics**: how many active diagnostics live on this file
 *   - **centrality**: fan-in + fan-out from the code graph (deg-centrality)
 *   - **complexity**: rough proxy via LOC (lines of code)
 *   - **coverage gap**: 1 - normalized test count
 *
 * Real production heat needs git-churn data; we expose the slot via a
 * `churn` factor and surface a "Connect git" placeholder in the UI.
 *
 * The output is small and stable: { score: 0..1, factors: { … } }, so the
 * UI can show how each contributor moved the score.
 */

export interface HeatFactors {
  diagnostics: number;
  centrality: number;
  complexity: number;
  coverageGap: number;
  churn: number;
}

export interface HeatedFile {
  file: string;
  score: number;
  /** Each factor contribution after weighting + normalization. */
  factors: HeatFactors;
  /** Raw signals so the UI can show "5 diagnostics, 3 fan-out…". */
  raw: {
    diagnosticCount: number;
    fanIn: number;
    fanOut: number;
    loc: number;
    testCount: number;
    churn: number;
  };
}

export interface HeatInputs {
  files: ReadonlyArray<{ file: string; loc: number }>;
  diagnosticCounts: ReadonlyMap<string, number>;
  /** file -> who imports it (fan-in). */
  fanIn: ReadonlyMap<string, number>;
  /** file -> what it imports (fan-out). */
  fanOut: ReadonlyMap<string, number>;
  /** file -> tests that cover it. */
  testCounts: ReadonlyMap<string, number>;
  /** Optional churn override; null when git is not connected. */
  churnCounts?: ReadonlyMap<string, number>;
}

const WEIGHTS = {
  diagnostics: 0.32,
  centrality: 0.22,
  complexity: 0.16,
  coverageGap: 0.18,
  churn: 0.12,
} as const;

/** Map a non-negative raw value to 0..1 by dividing by max (with floor). */
function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  if (value <= 0) return 0;
  if (value >= max) return 1;
  return value / max;
}

export function computeHeatScores(inputs: HeatInputs): HeatedFile[] {
  // Compute maxes for normalization.
  let maxDiag = 0;
  let maxCentrality = 0;
  let maxLoc = 0;
  let maxTest = 0;
  let maxChurn = 0;
  for (const f of inputs.files) {
    const d = inputs.diagnosticCounts.get(f.file) ?? 0;
    const fi = inputs.fanIn.get(f.file) ?? 0;
    const fo = inputs.fanOut.get(f.file) ?? 0;
    const t = inputs.testCounts.get(f.file) ?? 0;
    const ch = inputs.churnCounts?.get(f.file) ?? 0;
    if (d > maxDiag) maxDiag = d;
    const c = fi + fo;
    if (c > maxCentrality) maxCentrality = c;
    if (f.loc > maxLoc) maxLoc = f.loc;
    if (t > maxTest) maxTest = t;
    if (ch > maxChurn) maxChurn = ch;
  }

  const out: HeatedFile[] = [];
  for (const f of inputs.files) {
    const dCount = inputs.diagnosticCounts.get(f.file) ?? 0;
    const fIn = inputs.fanIn.get(f.file) ?? 0;
    const fOut = inputs.fanOut.get(f.file) ?? 0;
    const tCount = inputs.testCounts.get(f.file) ?? 0;
    const ch = inputs.churnCounts?.get(f.file) ?? 0;

    const factors: HeatFactors = {
      diagnostics: normalize(dCount, maxDiag) * WEIGHTS.diagnostics,
      centrality: normalize(fIn + fOut, maxCentrality) * WEIGHTS.centrality,
      complexity: normalize(f.loc, maxLoc) * WEIGHTS.complexity,
      // Coverage gap is "fewer tests = higher heat". We invert at the end.
      coverageGap: (1 - normalize(tCount, maxTest)) * WEIGHTS.coverageGap,
      churn: normalize(ch, maxChurn) * WEIGHTS.churn,
    };
    const score =
      factors.diagnostics +
      factors.centrality +
      factors.complexity +
      factors.coverageGap +
      factors.churn;

    out.push({
      file: f.file,
      score,
      factors,
      raw: {
        diagnosticCount: dCount,
        fanIn: fIn,
        fanOut: fOut,
        loc: f.loc,
        testCount: tCount,
        churn: ch,
      },
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/** Return a tailwind-friendly color band for a 0..1 score. */
export function heatBand(score: number): 'cool' | 'warm' | 'hot' | 'fire' {
  if (score >= 0.7) return 'fire';
  if (score >= 0.45) return 'hot';
  if (score >= 0.22) return 'warm';
  return 'cool';
}
