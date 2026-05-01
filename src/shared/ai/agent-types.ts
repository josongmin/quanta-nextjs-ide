/**
 * Phase 4 — Anthropic SDK agent types.
 *
 * These are kept in a separate file from the legacy provider-agnostic
 * `types.ts` to avoid breaking existing surfaces that import the older
 * AiProvider interface. The agent loop in `agent.ts` consumes these types.
 */

export type ChatRole = 'user' | 'assistant';

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface ChatMessage {
  role: ChatRole;
  content: string | ContentBlock[];
}

/** Record of a single tool invocation, kept as evidence for patches. */
export interface ToolUseRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
  /** JSON-serializable result. */
  result: unknown;
  is_error?: boolean;
  startedAt: number;
  endedAt: number;
}

/** Candidate patch emitted by the agent — never written until verdict admits it. */
export interface PatchCandidate {
  id: string;
  filePath: string;
  /** May be empty if the file does not yet exist. */
  oldContent: string;
  newContent: string;
  rationale: string;
  evidence: ToolUseRecord[];
  createdAt: number;
}

export interface AssistantMessage {
  text: string;
  /** Patch candidates surfaced during this turn (collected from propose_patch tool calls). */
  patches: PatchCandidate[];
  /** All tool uses, in order. Useful for evidence panels and replay. */
  toolUses: ToolUseRecord[];
  /** Stop reason from the API. */
  stopReason: string | null;
  /** Iterations of the agent loop consumed. */
  iterations: number;
}

export interface AgentRunHooks {
  /** Streamed text deltas for the current iteration. */
  onChunk?: (delta: string) => void;
  /** Fired when a tool starts; receives the tool name and input. */
  onToolUse?: (record: { id: string; name: string; input: Record<string, unknown> }) => void;
  /** Fired when a tool finishes; receives the completed record. */
  onToolResult?: (record: ToolUseRecord) => void;
  /** Fired when a patch candidate is proposed. */
  onPatch?: (patch: PatchCandidate) => void;
}

export interface AgentRunRequest {
  userMessage: string;
  /** Conversation history in canonical Anthropic block form. */
  conversation: ChatMessage[];
  hooks?: AgentRunHooks;
  /** Override the default model for this run. */
  model?: string;
  /** Cap loop iterations (defaults to 10). */
  maxIterations?: number;
}
