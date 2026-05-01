/**
 * AI tools that the model can invoke against the live IDE state.
 *
 * Stub provider: deterministic tool dispatch on keyword match.
 * Anthropic provider: passed via the `tools` parameter; model picks one and
 * we run it locally then replay the result.
 */

import {
  analyzeBoundaryChain,
  analyzeClientModules,
  analyzeServerActions,
  computeStreamMetrics,
  type RscChunk,
} from '@entities/rsc-payload';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolContext {
  chunks: ReadonlyArray<RscChunk>;
  url: string | null;
}

export const QUANTA_TOOLS: ReadonlyArray<ToolDefinition> = [
  {
    name: 'getProbeMetrics',
    description: 'Returns current Probe stream metrics (chunks, bytes, kinds, follow-ups).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'listClientModules',
    description: 'Returns the list of modules the RSC stream shipped to the client.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'listServerActions',
    description: 'Returns server-action descriptors detected in the trace.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'listBoundaryChunks',
    description: 'Returns Next.js boundary infrastructure chunks (layout-router, error-boundary, etc).',
    inputSchema: { type: 'object', properties: {} },
  },
];

export function runTool(name: string, ctx: ToolContext): unknown {
  switch (name) {
    case 'getProbeMetrics':
      return { url: ctx.url, ...computeStreamMetrics(ctx.chunks) };
    case 'listClientModules':
      return analyzeClientModules(ctx.chunks);
    case 'listServerActions':
      return analyzeServerActions(ctx.chunks);
    case 'listBoundaryChunks':
      return analyzeBoundaryChain(ctx.chunks);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
