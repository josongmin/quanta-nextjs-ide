/**
 * Intent parser.
 *
 * Two paths:
 *   1. AI parse — when an Anthropic API key is configured, ask the model
 *      for a JSON-only Intent. We validate the response against the Zod
 *      schema and reject anything malformed (falling through to step 2).
 *   2. Heuristic parse — keyword extraction. Looks for known constraints
 *      ("preserve cache", "안전하게" → no-perf-regression, etc.), known
 *      flow keywords ("payment"/"결제", "auth"/"로그인"), and any
 *      tokens that look like file paths or routes.
 *
 * Both paths return a fully-validated `Intent`. The store keeps the
 * latest parse result + history.
 */

import { hasApiKey, runAgent } from '@shared/ai';
import {
  IntentSchema,
  type Intent,
  type IntentConstraint,
} from './schema';

const KEYWORD_TO_CONSTRAINT: ReadonlyArray<readonly [RegExp, IntentConstraint]> = [
  [/cache|캐시|캐싱/i, 'preserve-cache'],
  [/secret|비밀|시크릿|env\s*key/i, 'no-secret-leak'],
  [/auth|로그인|인증|세션/i, 'preserve-auth'],
  [/breaking|호환|api/i, 'no-breaking-api'],
  [/perf|성능|fast|속도|안전하게|safely/i, 'no-perf-regression'],
  [/type|타입|typescript/i, 'preserve-types'],
];

const FLOW_KEYWORDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/payment|결제|stripe|checkout/i, 'payment'],
  [/auth|로그인|회원|인증|signin|signup/i, 'auth'],
  [/admin|관리자/i, 'admin'],
  [/billing|청구|invoice/i, 'billing'],
  [/order|주문/i, 'order'],
  [/pii|개인정보/i, 'pii'],
];

const PATH_REGEX = /(?:^|[\s`'"])((?:src\/|app\/|lib\/|components\/)[\w./-]+)/g;
const ROUTE_REGEX = /\/(?:[a-z][\w-]*\/?){1,5}/gi;
const SYMBOL_REGEX = /\b([A-Z][a-zA-Z0-9]+|[a-z][a-zA-Z0-9]+(?=\())/g;

/** Heuristic fallback parser — runs purely client-side. */
export function heuristicParse(rawInput: string): Intent {
  const constraints = new Set<IntentConstraint>();
  for (const [re, c] of KEYWORD_TO_CONSTRAINT) {
    if (re.test(rawInput)) constraints.add(c);
  }
  let targetFlow: string | null = null;
  for (const [re, name] of FLOW_KEYWORDS) {
    if (re.test(rawInput)) { targetFlow = name; break; }
  }
  const files = uniq([...rawInput.matchAll(PATH_REGEX)].map((m) => m[1]).filter((v): v is string => Boolean(v)));
  const routes = uniq(
    [...rawInput.matchAll(ROUTE_REGEX)]
      .map((m) => m[0])
      .filter((r) => r && !files.some((f) => f.includes(r))),
  );
  const symbols = uniq([...rawInput.matchAll(SYMBOL_REGEX)].map((m) => m[1]).filter((v): v is string => Boolean(v)));

  return IntentSchema.parse({
    goal: rawInput.trim().slice(0, 200) || '(no goal stated)',
    scope: { routes: routes.slice(0, 8), files: files.slice(0, 8), symbols: symbols.slice(0, 8) },
    constraints: [...constraints],
    targetFlow,
    rawInput,
    parsedAt: Date.now(),
  });
}

function uniq<T>(arr: ReadonlyArray<T>): T[] {
  return [...new Set(arr)];
}

const AI_PROMPT = `You convert a developer's natural-language refactor intent into a strict JSON object.

Schema (JSON only — no prose, no markdown fence):
{
  "goal": string,                                    // one-sentence summary
  "scope": {
    "routes":  string[],                             // route paths like /checkout
    "files":   string[],                             // workspace-relative file paths
    "symbols": string[]                              // function/component names
  },
  "constraints": string[],                           // subset of:
                                                     //   "preserve-cache","no-secret-leak","preserve-auth",
                                                     //   "no-breaking-api","no-perf-regression","preserve-types"
  "targetFlow": string | null                        // e.g. "payment", "auth", "admin", "billing", "order", "pii", or null
}

Rules:
- Respond with the JSON object only.
- Use [] for empty arrays, never omit keys.
- Translate Korean keywords (e.g. 결제→payment, 캐시→preserve-cache, 안전하게→no-perf-regression).`;

/** Try an AI parse; return null on any failure so the caller can fall back. */
async function aiParse(rawInput: string): Promise<Intent | null> {
  if (!hasApiKey()) return null;
  try {
    const reply = await runAgent({
      userMessage: `${AI_PROMPT}\n\nInput: ${rawInput}`,
      conversation: [],
      maxIterations: 1,
    });
    const text = reply.text.trim();
    // Strip optional code-fence around the JSON.
    const json = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    const parsed = JSON.parse(json) as unknown;
    const validated = IntentSchema.parse({
      ...(parsed as object),
      rawInput,
      parsedAt: Date.now(),
    });
    return validated;
  } catch {
    return null;
  }
}

/**
 * Public API: parse the user's intent. Tries AI first when available,
 * falls back to the deterministic heuristic.
 */
export async function parseIntent(rawInput: string): Promise<Intent> {
  const ai = await aiParse(rawInput);
  if (ai) return ai;
  return heuristicParse(rawInput);
}
