/**
 * Agent loop — drives the Anthropic Messages API in a tool-use loop.
 *
 *  1. Send (system, tools, conversation + new user message) — system + tools
 *     carry cache_control so subsequent iterations within a session reuse
 *     the cached prefix.
 *  2. Stream the response; collect text deltas via onChunk and tool_use
 *     blocks for execution.
 *  3. If `stop_reason === 'tool_use'`, execute each tool, append a
 *     `tool_result` user-turn, and loop. Otherwise return.
 *  4. Hard cap iterations at 10 (configurable) so a model that loops
 *     forever cannot drain the API budget.
 *
 * Per claude-api skill: we use streaming + finalMessage() to avoid
 * HTTP timeouts on long outputs, and route through stream events to
 * surface text chunks to the UI as they arrive.
 */

import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import type {
  AgentRunRequest,
  AssistantMessage,
  ChatMessage,
  ContentBlock,
  PatchCandidate,
  ToolUseBlock,
  ToolUseRecord,
} from './agent-types';
import { buildCachedPrefix, DEFAULT_MODEL, getAnthropicClient } from './client';
import { executeTool, makeToolUseRecord } from './tool-handlers';

const MAX_ITERATIONS_DEFAULT = 10;

function toApiMessage(m: ChatMessage): MessageParam {
  if (typeof m.content === 'string') {
    return { role: m.role, content: m.content };
  }
  // The agent-types ContentBlock subset is structurally compatible with the SDK shape.
  return { role: m.role, content: m.content as unknown as MessageParam['content'] };
}

export async function runAgent(req: AgentRunRequest): Promise<AssistantMessage> {
  const client = getAnthropicClient();
  const prefix = buildCachedPrefix();
  const model = req.model ?? DEFAULT_MODEL;
  const maxIterations = req.maxIterations ?? MAX_ITERATIONS_DEFAULT;

  // Working conversation: copy + append new user message.
  const conversation: ChatMessage[] = [
    ...req.conversation,
    { role: 'user', content: req.userMessage },
  ];

  const allToolUses: ToolUseRecord[] = [];
  const allPatches: PatchCandidate[] = [];
  const onPatch = (p: PatchCandidate): void => {
    allPatches.push(p);
    req.hooks?.onPatch?.(p);
  };

  let iterations = 0;
  let lastStopReason: string | null = null;
  let assistantText = '';

  while (iterations < maxIterations) {
    iterations += 1;

    const messagesForApi: MessageParam[] = conversation.map(toApiMessage);

    const stream = client.messages.stream({
      model,
      max_tokens: 16_000,
      system: prefix.system,
      tools: prefix.tools as unknown as Parameters<typeof client.messages.stream>[0]['tools'],
      messages: messagesForApi,
    });

    let iterationText = '';
    stream.on('text', (delta) => {
      iterationText += delta;
      req.hooks?.onChunk?.(delta);
    });

    const finalMessage = await stream.finalMessage();
    lastStopReason = finalMessage.stop_reason;
    assistantText += iterationText;

    // Capture the assistant turn — must include tool_use blocks for the next request.
    const assistantBlocks = finalMessage.content as unknown as ContentBlock[];
    conversation.push({ role: 'assistant', content: assistantBlocks });

    if (finalMessage.stop_reason !== 'tool_use') {
      break;
    }

    // Execute tools.
    const toolUses: ToolUseBlock[] = assistantBlocks.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use',
    );

    const toolResults: ContentBlock[] = [];
    for (const tu of toolUses) {
      const startedAt = Date.now();
      req.hooks?.onToolUse?.({ id: tu.id, name: tu.name, input: tu.input });
      const result = await executeTool(tu.name, tu.input, { onPatch });
      const endedAt = Date.now();
      const record = makeToolUseRecord(tu.id, tu.name, tu.input, result, startedAt, endedAt);
      allToolUses.push(record);
      req.hooks?.onToolResult?.(record);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: result.text,
        is_error: result.is_error,
      });
    }
    conversation.push({ role: 'user', content: toolResults });
  }

  // Attach evidence to any patches (last 8 tool uses give recent context).
  for (const p of allPatches) {
    p.evidence = allToolUses.slice(-8);
  }

  return {
    text: assistantText,
    patches: allPatches,
    toolUses: allToolUses,
    stopReason: lastStopReason,
    iterations,
  };
}

/** Convenience: same as runAgent but returns the trailing conversation for storage. */
export async function runAgentWithHistory(
  req: AgentRunRequest,
): Promise<{ assistant: AssistantMessage; conversation: ChatMessage[] }> {
  const conversation: ChatMessage[] = [
    ...req.conversation,
    { role: 'user', content: req.userMessage },
  ];
  const assistant = await runAgent(req);
  conversation.push({ role: 'assistant', content: assistant.text });
  return { assistant, conversation };
}
