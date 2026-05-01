/**
 * Anthropic SDK client wrapper for the Quanta agent.
 *
 * Responsibilities:
 *  - Lazy-instantiate the SDK with the user's API key (read from localStorage
 *    until a Tauri-stronghold/keychain pathway is wired up — see TODO below).
 *  - Always send the system prompt and tool definitions with
 *    `cache_control: { type: 'ephemeral' }` so prompt caching kicks in
 *    after the first request in a session.
 *  - Stream by default — long agentic loops with tool use can produce >16K
 *    output tokens, which would otherwise hit SDK timeouts (per claude-api).
 *  - Run in the renderer (browser/Tauri webview). Tauri 2's CSP defaults to
 *    null in this project; if a stricter policy is added later, ensure
 *    `connect-src` permits api.anthropic.com.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AGENT_TOOLS, type AgentToolDefinition } from './agent-tools';
import { QUANTA_SYSTEM_PROMPT } from './system-prompt';

/** Default model — claude-opus-4-7 per claude-api skill ("ALWAYS use claude-opus-4-7 unless the user explicitly names a different model"). */
export const DEFAULT_MODEL = 'claude-opus-4-7';

/** Fast fallback for low-cost / latency-sensitive sub-tasks. */
export const FAST_MODEL = 'claude-sonnet-4-6';

const API_KEY_STORAGE_KEY = 'quanta.ai.apiKey';

// TODO(stronghold): migrate API key storage from localStorage to Tauri
// stronghold or the macOS keychain. localStorage is acceptable for a
// local developer tool but not for any multi-user surface.
export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key);
    else localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

let cachedClient: Anthropic | null = null;
let cachedKey: string | null = null;

export function getAnthropicClient(): Anthropic {
  const key = getStoredApiKey();
  if (!key) {
    throw new Error('No Anthropic API key configured. Open AI Settings to add one.');
  }
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedClient = new Anthropic({
    apiKey: key,
    // Required to call directly from a browser context.
    dangerouslyAllowBrowser: true,
  });
  cachedKey = key;
  return cachedClient;
}

export function hasApiKey(): boolean {
  return getStoredApiKey().length > 0;
}

/**
 * The cached system block + tools list, marked with cache_control.
 * Tools render before system in the API; placing the breakpoint on the
 * last system block caches both layers together.
 */
export interface CachedPrefix {
  system: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;
  tools: Array<AgentToolDefinition & { cache_control?: { type: 'ephemeral' } }>;
}

export function buildCachedPrefix(): CachedPrefix {
  const tools = AGENT_TOOLS.map((t, i) => {
    // Mark the LAST tool with cache_control so the entire tools+system prefix is one cacheable unit.
    if (i === AGENT_TOOLS.length - 1) {
      return { ...t, cache_control: { type: 'ephemeral' as const } };
    }
    return t;
  });
  return {
    system: [
      {
        type: 'text',
        text: QUANTA_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools,
  };
}
