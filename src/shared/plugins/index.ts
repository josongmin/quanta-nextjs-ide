import { BUILTIN_PLUGINS } from './builtin';
import type { PluginContext, PluginFinding, QuantaPlugin } from './types';

export type { PluginContext, PluginFinding, QuantaPlugin, FindingSeverity } from './types';
export { BUILTIN_PLUGINS } from './builtin';

const registered: QuantaPlugin[] = [...BUILTIN_PLUGINS];

export function registerPlugin(plugin: QuantaPlugin): () => void {
  if (registered.some((p) => p.id === plugin.id)) return () => undefined;
  registered.push(plugin);
  return () => {
    const i = registered.indexOf(plugin);
    if (i >= 0) registered.splice(i, 1);
  };
}

export function listPlugins(): ReadonlyArray<QuantaPlugin> {
  return registered;
}

export function runAllPlugins(ctx: PluginContext): ReadonlyArray<PluginFinding> {
  const out: PluginFinding[] = [];
  for (const p of registered) {
    try {
      out.push(...p.analyze(ctx));
    } catch (e) {
      out.push({
        ruleId: p.id,
        severity: 'err',
        message: `Plugin crashed: ${(e as Error).message}`,
      });
    }
  }
  return out;
}
