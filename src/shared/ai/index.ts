import { AnthropicProvider } from './anthropic-provider';
import { StubProvider } from './stub-provider';
import type { AiProvider } from './types';

// --- Legacy provider-agnostic surface (kept for existing callers) ---
export type {
  AiCompleteRequest,
  AiCompleteResponse,
  AiContext,
  AiMessage,
  AiProvider,
} from './types';
export { AnthropicProvider } from './anthropic-provider';
export { StubProvider } from './stub-provider';

export interface AiProviderConfig {
  kind: 'stub' | 'anthropic';
  apiKey?: string;
  model?: string;
}

export function createAiProvider(config: AiProviderConfig): AiProvider {
  switch (config.kind) {
    case 'anthropic':
      if (!config.apiKey) return new StubProvider();
      return new AnthropicProvider(config.apiKey, config.model);
    case 'stub':
    default:
      return new StubProvider();
  }
}

// --- Phase 4 agent surface ---
export type {
  AgentRunHooks,
  AgentRunRequest,
  AssistantMessage,
  ChatMessage,
  ContentBlock,
  PatchCandidate,
  TextBlock,
  ToolResultBlock,
  ToolUseBlock,
  ToolUseRecord,
} from './agent-types';
export { runAgent, runAgentWithHistory } from './agent';
export {
  buildCachedPrefix,
  DEFAULT_MODEL,
  FAST_MODEL,
  getAnthropicClient,
  getStoredApiKey,
  hasApiKey,
  setStoredApiKey,
} from './client';
export { AGENT_TOOLS } from './agent-tools';
export type { AgentToolDefinition } from './agent-tools';
export { executeTool } from './tool-handlers';
export { useAgentStore } from './store';
export type { UiToolEvent } from './store';
export { QUANTA_SYSTEM_PROMPT } from './system-prompt';
export {
  getWorkspaceRoot,
  setWorkspaceRoot,
  writeWorkspaceFile,
} from './shims/workspace-shim';
