#!/usr/bin/env node
/**
 * Quanta CI — batch RSC capture + JSON report.
 *
 * Usage:
 *   node scripts/quanta-ci.mjs --base http://localhost:3001 \
 *     --routes /,/static,/island,/suspense,/action,/products/walnut-table \
 *     [--out report.json] [--baseline baseline.json]
 *
 * For each route the tool:
 *   1. Fetches the RSC payload (RSC: 1 header)
 *   2. Parses every chunk using the same logic as the IDE's Probe
 *   3. Aggregates metrics (chunks, bytes, client modules, suspense boundaries)
 *
 * If `--baseline` points to a previous report, exit code is non-zero when
 * client-bundle bytes regressed > 5%. Suitable for GitHub Actions PR gates.
 */

import { argv, exit, stdout } from 'node:process';
import { writeFile, readFile } from 'node:fs/promises';

// --- Inlined parser (mirror of src/entities/rsc-payload/model/{parser,kind-detector}.ts)
const REF_PATTERN = /\$[LF@]?([0-9a-f]+)\b/g;
const MODULE_NAME = /I\["([^"]+)"/;
const MODULE_CHUNKS = /I\["[^"]+",\[([^\]]*)\]/;

function detectKind(payload) {
  if (!payload) return 'text';
  const c = payload[0];
  if (c === 'I') return 'module';
  if (c === 'M' || c === 'H') return 'hint';
  if (c === '[') return 'element';
  if (c === '$' || c === '@') return 'reference';
  if (c === '"' && /^"\$[A-Za-z@]/.test(payload)) return 'reference';
  if (c === 'D' && /^D"/.test(payload)) return 'reference';
  return 'text';
}

function detectEnvironment(payload) {
  const m = payload.match(MODULE_CHUNKS);
  const inner = m?.[1];
  if (!inner) return 'unknown';
  const lower = inner.toLowerCase();
  if (lower.includes('runtime') || lower.includes('rsc')) return 'unknown';
  return 'client';
}

function parseLine(line, arrivedAtMs) {
  const t = line.trim();
  if (!t) return null;
  const colon = t.indexOf(':');
  if (colon === -1) return null;
  const id = t.slice(0, colon);
  if (!/^[0-9a-fA-F]+$/.test(id)) return null;
  const payload = t.slice(colon + 1);
  if (!payload) return null;
  const kind = detectKind(payload);
  return {
    id: `${id}:`,
    kind,
    payload,
    arrivedAtMs,
    sizeBytes: Buffer.byteLength(t),
    environment: kind === 'module' ? detectEnvironment(payload) : undefined,
  };
}

async function fetchRoute(base, path) {
  const url = base.replace(/\/$/, '') + path;
  const t0 = performance.now();
  const res = await fetch(url, {
    headers: { RSC: '1', Accept: 'text/x-component' },
  });
  if (!res.ok || !res.body) {
    return { url, error: `HTTP ${res.status}`, chunks: [], totalMs: 0, totalBytes: 0 };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let buffer = '';
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) totalBytes += value.byteLength;
    const arrivedAtMs = performance.now() - t0;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const c = parseLine(line, arrivedAtMs);
      if (c) chunks.push(c);
    }
  }
  if (buffer.trim()) {
    const c = parseLine(buffer, performance.now() - t0);
    if (c) chunks.push(c);
  }
  return { url, chunks, totalMs: performance.now() - t0, totalBytes };
}

function summarize(routeResult) {
  const ch = routeResult.chunks;
  const ids = new Set(ch.map((c) => c.id));
  const clientModules = ch.filter((c) => c.kind === 'module' && c.environment === 'client');
  const clientBytes = clientModules.reduce((s, c) => s + c.sizeBytes, 0);
  const suspense = ch.filter(
    (c) => c.kind === 'reference' && c.payload.includes('react.suspense'),
  ).length;
  return {
    url: routeResult.url,
    chunks: ch.length,
    uniqueIds: ids.size,
    followUps: ch.length - ids.size,
    totalMs: Math.round(routeResult.totalMs),
    totalBytes: routeResult.totalBytes,
    clientBundleBytes: clientBytes,
    clientModuleCount: clientModules.length,
    suspenseBoundaries: suspense,
    error: routeResult.error,
  };
}

function parseArgs(argv) {
  const out = { base: '', routes: [], outFile: null, baseline: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') out.base = argv[++i];
    else if (a === '--routes') out.routes = argv[++i].split(',');
    else if (a === '--out') out.outFile = argv[++i];
    else if (a === '--baseline') out.baseline = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(argv);
  if (!args.base || args.routes.length === 0) {
    console.error('usage: quanta-ci --base <url> --routes /a,/b [--out file] [--baseline file]');
    exit(2);
  }

  const summaries = [];
  for (const route of args.routes) {
    const r = await fetchRoute(args.base, route.startsWith('/') ? route : '/' + route);
    summaries.push(summarize(r));
  }

  const report = {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    base: args.base,
    routes: summaries,
    totalClientBundleBytes: summaries.reduce((s, r) => s + (r.clientBundleBytes || 0), 0),
  };

  let regressed = 0;
  if (args.baseline) {
    try {
      const prev = JSON.parse(await readFile(args.baseline, 'utf-8'));
      const prevTotal = prev.totalClientBundleBytes ?? 0;
      const delta = report.totalClientBundleBytes - prevTotal;
      const pct = prevTotal > 0 ? (delta / prevTotal) * 100 : 0;
      report.baseline = { prevTotal, delta, pct: Number(pct.toFixed(2)) };
      if (pct > 5) regressed = 1;
    } catch (e) {
      report.baseline = { error: String(e) };
    }
  }

  const json = JSON.stringify(report, null, 2);
  if (args.outFile) {
    await writeFile(args.outFile, json);
    stdout.write(`wrote ${args.outFile}\n`);
  } else {
    stdout.write(json + '\n');
  }
  exit(regressed);
}

main().catch((e) => {
  console.error(e);
  exit(2);
});
