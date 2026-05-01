import { analyzeClientModules } from '@entities/rsc-payload';
import type { PluginFinding, QuantaPlugin } from './types';

/**
 * First-party example plugins.
 *
 * Each is a self-contained `QuantaPlugin` so users can read them as
 * templates. They demonstrate how Probe + AST data become opinionated
 * lint rules without touching the IDE core.
 */

const heavyClientModule: QuantaPlugin = {
  id: '@quanta/no-heavy-client-module',
  label: 'No heavy client module',
  analyze({ chunks }) {
    const out: PluginFinding[] = [];
    for (const m of analyzeClientModules(chunks)) {
      if (m.isNextInternal || m.isThirdParty) continue;
      if (m.sizeBytes > 200) {
        out.push({
          ruleId: this.id,
          severity: 'warn',
          message: `Client module ${m.label} ships ${m.sizeBytes}B (>200B threshold)`,
          chunkId: m.id,
        });
      }
    }
    return out;
  },
};

const useClientWithoutShipping: QuantaPlugin = {
  id: '@quanta/use-client-but-not-shipped',
  label: 'use-client declared but not shipped',
  analyze({ files, chunks }) {
    const out: PluginFinding[] = [];
    const probeModules = analyzeClientModules(chunks);
    for (const f of files) {
      const directive = f.source
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0 && !l.startsWith('//'));
      if (directive !== "'use client'" && directive !== '"use client"') continue;
      const matched = probeModules.some((m) =>
        m.modulePath.includes(f.file),
      );
      if (!matched) {
        out.push({
          ruleId: this.id,
          severity: 'hint',
          message: `${f.file} declares 'use client' but Probe didn't see it ship — possibly dead code`,
          file: f.file,
        });
      }
    }
    return out;
  },
};

export const BUILTIN_PLUGINS: ReadonlyArray<QuantaPlugin> = [
  heavyClientModule,
  useClientWithoutShipping,
];
