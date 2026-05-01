/**
 * Quanta AI — provider-agnostic interface.
 *
 * The IDE never imports a vendor SDK directly. Instead, surfaces ask for an
 * `AiProvider` and call `complete(messages, context)`. Implementations:
 *  - `StubProvider` (default): deterministic, no network. Useful for tests
 *    and to make the AI panel work out-of-the-box without a key.
 *  - `AnthropicProvider`: real Claude API call, user-supplied key.
 *  - (future) `OpenAiProvider`, `LocalProvider`.
 */

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiContext {
  /** Probe trace summary in plain text. */
  probeSummary?: string;
  /** AST findings summary. */
  astSummary?: string;
  /** Relevant source snippets (file → snippet). */
  sources?: ReadonlyArray<{ file: string; snippet: string }>;
}

export interface AiCompleteRequest {
  messages: ReadonlyArray<AiMessage>;
  context?: AiContext;
}

export interface AiCompleteResponse {
  text: string;
  /** Provider id, for telemetry. */
  provider: string;
  /** True if the response was deterministic (no network). */
  stub: boolean;
}

export interface AiProvider {
  readonly id: string;
  readonly label: string;
  complete(req: AiCompleteRequest): Promise<AiCompleteResponse>;
  /** Optional: yield text fragments as they arrive. Falls back to complete(). */
  streamComplete?(req: AiCompleteRequest): AsyncIterable<string>;
}
