/**
 * Tool DEFINITIONS sent to Claude.
 *
 * Cached together with the system prompt — keep this list deterministic
 * and ordered. Adding/removing/reordering a tool invalidates the cache for
 * everything after `tools` (per claude-api skill).
 */

export interface AgentToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export const AGENT_TOOLS: AgentToolDefinition[] = [
  {
    name: 'read_file',
    description:
      'Read the contents of a file at the given workspace-relative path. Returns the literal text. Use this to ground claims in the actual code.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Workspace-relative file path, e.g. "app/products/page.tsx".' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'grep',
    description:
      'Search the workspace for a regex pattern (ripgrep-style). Returns matching lines with file paths and line numbers. Optional `path` glob narrows scope.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern.' },
        path: { type: 'string', description: 'Optional glob like "app/**/*.tsx".' },
      },
      required: ['pattern'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_files',
    description: 'List workspace files matching a glob.',
    input_schema: {
      type: 'object',
      properties: {
        glob: { type: 'string', description: 'Glob pattern. Defaults to all files.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'route_lookup',
    description:
      'Look up a Next.js App Router route. Returns the implementing files (page, layout, loading, error, route handlers).',
    input_schema: {
      type: 'object',
      properties: {
        routePath: { type: 'string', description: 'Route path like "/products/[id]".' },
      },
      required: ['routePath'],
      additionalProperties: false,
    },
  },
  {
    name: 'cache_graph_query',
    description:
      'Query the cache analysis graph. Without a tag, returns all known tags and revalidation pairs. With a tag, returns the read sites and revalidate sites for that tag.',
    input_schema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Optional cache tag.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'boundary_check',
    description:
      'Query the use-client / use-server boundary analysis for a file. Returns the directive (if any), files that import it, and whether it is reachable from a client tree.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Workspace-relative file path.' },
      },
      required: ['filePath'],
      additionalProperties: false,
    },
  },
  {
    name: 'server_actions_in_route',
    description:
      'List Server Actions that are reachable from a given route segment (transitively, via imports).',
    input_schema: {
      type: 'object',
      properties: {
        routePath: { type: 'string', description: 'Route path.' },
      },
      required: ['routePath'],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_patch',
    description:
      'Propose a code change. This DOES NOT write the file. The patch is returned to the IDE patch admission gate, which verifies cache pairs, secret reachability, and boundary invariants. The user reviews and may apply or discard. Always include a clear rationale tying the change to a Next.js invariant (cache pair, boundary, types, etc).',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Workspace-relative file path to change.' },
        newContent: { type: 'string', description: 'Full new contents of the file (not a diff).' },
        rationale: { type: 'string', description: 'One- or two-sentence explanation, citing the invariant addressed.' },
      },
      required: ['path', 'newContent', 'rationale'],
      additionalProperties: false,
    },
  },
];
