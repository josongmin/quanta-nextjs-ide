import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __quanta?: {
      ui: {
        getState: () => {
          setLeftTab: (tab: string) => void;
          setBottomTab: (tab: string) => void;
          openOverlay: (key: string, state?: { open?: boolean }) => void;
          closeOverlay: (key: string) => void;
          overlays: { useCacheAnalyzer: { open: boolean } };
        };
      };
    };
  }
}

async function openRscOverlay(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__quanta?.ui?.getState), null, {
    timeout: 15_000,
  });
  await page.evaluate(() => {
    window.__quanta!.ui.getState().openOverlay('rscPayloadStep', { open: true });
  });
  await expect(page.getByText('RSC payload step-through')).toBeVisible({
    timeout: 10_000,
  });
}

async function waitForStreamDone(page: Page) {
  // Status chip in the footer turns into "done" when the stream completes.
  await expect(page.locator('text=/^done$/').first()).toBeVisible({ timeout: 10_000 });
}

async function waitForChunkCount(page: Page, n: number) {
  await expect
    .poll(async () => Number(await readFooterMetric(page, 'chunks')), {
      timeout: 10_000,
      intervals: [100, 200, 300, 500],
    })
    .toBe(n);
}

async function readFooterMetric(page: Page, label: 'chunks' | 'visible' | 'total' | 'size'): Promise<string> {
  // Footer renders each metric as: <span>label: <span class="font-mono">value</span></span>
  // Walk the DOM and pick the first span whose entire text is exactly
  // "<label>: <value>" (i.e. it does NOT contain a second metric label).
  return await page.evaluate((needle) => {
    const otherLabels = ['chunks', 'visible', 'total', 'size'].filter((l) => l !== needle);
    for (const span of Array.from(document.querySelectorAll('span'))) {
      const text = (span.textContent ?? '').trim();
      if (!text.startsWith(`${needle}:`)) continue;
      if (otherLabels.some((l) => text.includes(`${l}:`))) continue;
      return text.replace(`${needle}:`, '').trim();
    }
    return '';
  }, label);
}

test.describe('RSC payload step overlay', () => {
  test('mock source streams 18 chunks automatically', async ({ page }) => {
    await openRscOverlay(page);
    // Wait for chunk count first (more deterministic than the status chip),
    // then confirm the stream finished.
    await waitForChunkCount(page, 18);
    await waitForStreamDone(page);

    // Reconstructed tree shows the root MainLayout module.
    await expect(page.getByText('MainLayout', { exact: false }).first()).toBeVisible();
  });

  test('live mode does NOT auto-fetch on toggle (regression)', async ({ page }) => {
    await openRscOverlay(page);
    await waitForStreamDone(page);

    // Toggle to Live — must remain idle until user clicks Fetch.
    await page.getByRole('button', { name: 'Live', exact: true }).first().click();

    // No "done" anywhere; status chip should read "idle".
    await expect(page.locator('text=/^idle$/')).toBeVisible();
    // No chunks rendered.
    await expect(page.getByText('No chunks yet')).toBeVisible();
  });

  test('live fetch streams real RSC payload (variant A → 13 chunks)', async ({ page }) => {
    await openRscOverlay(page);
    await page.getByRole('button', { name: 'Live', exact: true }).first().click();

    const urlInput = page.locator('input[placeholder*="__rsc"]');
    await urlInput.fill('/__rsc/products/walnut-table?v=a');
    await page.getByRole('button', { name: /Fetch/ }).click();

    await waitForStreamDone(page);

    // Should have parsed 13 chunks from the fake server.
    expect(Number(await readFooterMetric(page, 'chunks'))).toBe(13);

    // Footer size should match the streamed body (>700 bytes for variant A).
    const sizeText = await readFooterMetric(page, 'size');
    expect(Number(sizeText.replace('B', ''))).toBeGreaterThan(700);
  });

  test('capture A, fetch B, diff shows ±1/~1 changes', async ({ page }) => {
    await openRscOverlay(page);
    await page.getByRole('button', { name: 'Live', exact: true }).first().click();

    const urlInput = page.locator('input[placeholder*="__rsc"]');
    const fetchBtn = page.getByRole('button', { name: /Fetch/ });
    const captureBtn = page.getByRole('button', { name: /^Capture/ });

    // Snapshot A: variant=a (13 chunks)
    await urlInput.fill('/__rsc/products/walnut-table?v=a');
    await fetchBtn.click();
    await waitForChunkCount(page, 13);
    await waitForStreamDone(page);
    await captureBtn.click();

    // Snapshot B: variant=b (12 chunks; chunk 10 changed, chunk 12 removed)
    await urlInput.fill('/__rsc/products/walnut-table?v=b');
    await fetchBtn.click();
    await waitForChunkCount(page, 12);
    await waitForStreamDone(page);
    await captureBtn.click();

    // Move to Snapshots tab — both rows should be present.
    await page.getByRole('button', { name: /^Snapshots/ }).click();
    await expect(page.getByText('?v=a', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('?v=b', { exact: false }).first()).toBeVisible();

    // Open Diff tab.
    await page.getByRole('button', { name: 'Diff', exact: true }).first().click();

    // Diff summary chips: +0 added, −1 removed, ~1 changed, =11 unchanged.
    // (the minus sign is U+2212, not ASCII dash — DiffView uses formatDelta)
    await expect(page.getByText('+0', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('−1', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('~1', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('=11', { exact: true }).first()).toBeVisible();

    // Per-row status chips for the changed/removed entries.
    await expect(page.getByText('removed', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('changed', { exact: true }).first()).toBeVisible();
  });

  test('waterfall view renders chunk-arrival lanes', async ({ page }) => {
    await openRscOverlay(page);
    await waitForStreamDone(page);

    await page.getByRole('button', { name: 'Waterfall', exact: true }).click();
    await expect(page.getByText('chunk').first()).toBeVisible();
    // X-axis tick (0ms) is always rendered.
    await expect(page.getByText(/^0ms$/).first()).toBeVisible();
    // At least one chunk lane label.
    await expect(page.getByText('MainLayout').first()).toBeVisible();
  });

  test('export trace produces a JSON download', async ({ page }) => {
    await openRscOverlay(page);
    await waitForStreamDone(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.rsc-trace\.json$/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    const text = Buffer.concat(chunks).toString('utf-8');
    const parsed = JSON.parse(text) as { version: number; chunks: unknown[] };
    expect(parsed.version).toBe(1);
    expect(parsed.chunks.length).toBeGreaterThan(0);
  });

  test('native bridge: data-platform attr is set on documentElement', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const platform = await page.evaluate(() => document.documentElement.dataset.platform);
    // In a regular browser this should be 'web' (or one of the OS hints).
    expect(['web', 'macos', 'windows', 'linux']).toContain(platform);
  });

  test('native bridge: UpdateBanner does not render on web', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // The banner is only mounted when the updater reports an available
    // update, which never happens in the web (non-Tauri) environment.
    await expect(page.getByText(/Install \+ relaunch/)).toHaveCount(0);
  });

  test('error state when backend rejects', async ({ page }) => {
    await openRscOverlay(page);
    await page.getByRole('button', { name: 'Live', exact: true }).first().click();

    // /__rsc/__health is the readiness probe — server returns 200 OK with 'ok' body
    // which our parser cannot turn into chunks, so it produces 0 chunks but no error.
    // Use a path that triggers proxy ECONNREFUSED-like behaviour by hitting a port we
    // know the proxy can't reach via a bogus host header.
    // Simpler: just point at a non-existent localhost port.
    await page.locator('input[placeholder*="__rsc"]').fill('http://127.0.0.1:1/nope');
    await page.getByRole('button', { name: /Fetch/ }).click();

    // Status chip should turn 'error' within timeout.
    await expect(page.locator('text=/^error$/')).toBeVisible({ timeout: 10_000 });
  });
});
