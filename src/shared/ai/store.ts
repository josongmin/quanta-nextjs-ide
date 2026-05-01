/**
 * Zustand store for the agent panel — conversation history, streaming state,
 * tool-use timeline, and the most recent patch candidate.
 */

import { create } from 'zustand';
import type {
  ChatMessage,
  PatchCandidate,
  ToolUseRecord,
} from './agent-types';

export interface UiToolEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
  startedAt: number;
  endedAt?: number;
  result?: string;
  is_error?: boolean;
}

interface AgentStoreState {
  conversation: ChatMessage[];
  /** Whether a run is currently in flight. */
  isStreaming: boolean;
  /** Text accumulated for the in-flight assistant turn. */
  streamingText: string;
  /** Tool events grouped per-turn. */
  toolEvents: UiToolEvent[];
  /** All patch candidates produced this session (newest last). */
  patches: PatchCandidate[];
  /** Last patch candidate (most recent), if any. */
  lastPatchId: string | null;
  /** Optional error message from the most recent run. */
  lastError: string | null;

  startTurn(userText: string): void;
  appendStreamChunk(delta: string): void;
  recordToolStart(record: { id: string; name: string; input: Record<string, unknown> }): void;
  recordToolEnd(record: ToolUseRecord): void;
  recordPatch(patch: PatchCandidate): void;
  finishTurn(assistantText: string, error?: string | null): void;
  clearConversation(): void;
  removePatch(id: string): void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  conversation: [],
  isStreaming: false,
  streamingText: '',
  toolEvents: [],
  patches: [],
  lastPatchId: null,
  lastError: null,

  startTurn: (userText) =>
    set((s) => ({
      conversation: [...s.conversation, { role: 'user', content: userText }],
      isStreaming: true,
      streamingText: '',
      toolEvents: [],
      lastError: null,
    })),

  appendStreamChunk: (delta) =>
    set((s) => ({ streamingText: s.streamingText + delta })),

  recordToolStart: (rec) =>
    set((s) => ({
      toolEvents: [
        ...s.toolEvents,
        {
          id: rec.id,
          name: rec.name,
          input: rec.input,
          startedAt: Date.now(),
        },
      ],
    })),

  recordToolEnd: (rec) =>
    set((s) => ({
      toolEvents: s.toolEvents.map((e) =>
        e.id === rec.id
          ? {
              ...e,
              endedAt: rec.endedAt,
              result: typeof rec.result === 'string' ? rec.result : JSON.stringify(rec.result),
              is_error: rec.is_error,
            }
          : e,
      ),
    })),

  recordPatch: (patch) =>
    set((s) => ({
      patches: [...s.patches, patch],
      lastPatchId: patch.id,
    })),

  finishTurn: (assistantText, error) =>
    set((s) => ({
      conversation: assistantText
        ? [...s.conversation, { role: 'assistant', content: assistantText }]
        : s.conversation,
      isStreaming: false,
      streamingText: '',
      lastError: error ?? null,
    })),

  clearConversation: () =>
    set({
      conversation: [],
      streamingText: '',
      toolEvents: [],
      lastError: null,
    }),

  removePatch: (id) =>
    set((s) => ({
      patches: s.patches.filter((p) => p.id !== id),
      lastPatchId: s.lastPatchId === id ? null : s.lastPatchId,
    })),
}));
