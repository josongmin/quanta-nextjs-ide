/**
 * Server-side execution of tool calls emitted by the Anthropic agent loop.
 *
 * Each handler receives the parsed `input` object (already JSON-decoded) and
 * returns a JSON-serializable result (string is fine; we stringify objects
 * when sending to the API).
 *
 * `propose_patch` is special — it does not return a normal result; it emits
 * a `PatchCandidate` via the `onPatch` hook and returns a confirmation string
 * the model can read.
 */

import type { PatchCandidate, ToolUseRecord } from './agent-types';
import {
  getCacheFindings,
  getDirectiveFindings,
  getRoutes,
  getServerActions,
} from './shims/analyzer-shim';
import {
  grepWorkspace,
  listWorkspaceFiles,
  readWorkspaceFile,
} from './shims/workspace-shim';

export interface ToolExecutionContext {
  /** Called when a propose_patch tool is invoked; the agent loop tracks the candidate. */
  onPatch: (patch: PatchCandidate) => void;
}

export interface ToolExecutionResult {
  text: string;
  is_error: boolean;
}

function toJsonText(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  try {
    switch (name) {
      case 'read_file': {
        const path = String(input['path'] ?? '');
        if (!path) return { text: 'Error: path is required', is_error: true };
        const text = await readWorkspaceFile(path);
        // Cap to avoid blowing up the context window on huge files.
        const capped = text.length > 64_000 ? text.slice(0, 64_000) + '\n…[truncated]' : text;
        return { text: capped, is_error: false };
      }
      case 'grep': {
        const pattern = String(input['pattern'] ?? '');
        const path = input['path'] ? String(input['path']) : undefined;
        if (!pattern) return { text: 'Error: pattern is required', is_error: true };
        const matches = await grepWorkspace(pattern, path);
        const formatted = matches.map((m) => `${m.file}:${m.line}: ${m.text}`).join('\n');
        return { text: formatted || '(no matches)', is_error: false };
      }
      case 'list_files': {
        const glob = input['glob'] ? String(input['glob']) : undefined;
        const files = await listWorkspaceFiles(glob);
        return { text: files.join('\n') || '(no files)', is_error: false };
      }
      case 'route_lookup': {
        const routePath = String(input['routePath'] ?? '');
        const routes = await getRoutes();
        const match = routes.find((r) => r.routePath === routePath);
        if (!match) {
          return {
            text: `Route not found: ${routePath}\nAvailable: ${routes.map((r) => r.routePath).slice(0, 20).join(', ')}`,
            is_error: false,
          };
        }
        return { text: toJsonText(match), is_error: false };
      }
      case 'cache_graph_query': {
        const tag = input['tag'] ? String(input['tag']) : undefined;
        const findings = await getCacheFindings();
        if (!tag) {
          const summary = findings.map((f) => ({ file: f.file, kind: f.kind, scope: f.scope }));
          return { text: toJsonText(summary), is_error: false };
        }
        const filtered = findings.filter((f) => JSON.stringify(f).includes(tag));
        return { text: toJsonText(filtered), is_error: false };
      }
      case 'boundary_check': {
        const filePath = String(input['filePath'] ?? '');
        const directives = await getDirectiveFindings();
        const finding = directives.find((d) => d.file === filePath);
        if (!finding) {
          return { text: `No directive on ${filePath}. (Either Server Component by default, or file not analyzed.)`, is_error: false };
        }
        return { text: toJsonText(finding), is_error: false };
      }
      case 'server_actions_in_route': {
        const routePath = String(input['routePath'] ?? '');
        const actions = await getServerActions();
        const filtered = actions.filter((a) => !a.routePath || a.routePath === routePath);
        return { text: toJsonText(filtered), is_error: false };
      }
      case 'propose_patch': {
        const path = String(input['path'] ?? '');
        const newContent = String(input['newContent'] ?? '');
        const rationale = String(input['rationale'] ?? '');
        if (!path || !newContent) return { text: 'Error: path and newContent are required', is_error: true };
        let oldContent = '';
        try {
          oldContent = await readWorkspaceFile(path);
        } catch {
          oldContent = '';
        }
        const patch: PatchCandidate = {
          id: `patch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          filePath: path,
          oldContent,
          newContent,
          rationale,
          evidence: [],
          createdAt: Date.now(),
        };
        ctx.onPatch(patch);
        return {
          text: `Patch candidate created: ${patch.id} for ${path}. The user will review through the patch admission gate before any file is written.`,
          is_error: false,
        };
      }
      default:
        return { text: `Unknown tool: ${name}`, is_error: true };
    }
  } catch (err) {
    return { text: `Tool error: ${(err as Error).message}`, is_error: true };
  }
}

export function makeToolUseRecord(
  id: string,
  name: string,
  input: Record<string, unknown>,
  result: ToolExecutionResult,
  startedAt: number,
  endedAt: number,
): ToolUseRecord {
  return {
    id,
    name,
    input,
    result: result.text,
    is_error: result.is_error,
    startedAt,
    endedAt,
  };
}
