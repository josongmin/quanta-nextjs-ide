/**
 * Real Next.js corpus tests.
 *
 * Boots a tiny real Next.js 15 app at e2e/fixtures/next-app/ on port 3001 and
 * verifies the IDE's RSC payload step overlay can fetch + parse + diff actual
 * Flight payloads (not the synthesised fake server).
 *
 * Gated behind RUN_REAL_NEXTJS=1 because:
 *   - It boots a real Next dev server (~10s startup, several MB of disk).
 *   - It requires `npm install` inside e2e/fixtures/next-app/ before first run.
 *
 * Run with:  RUN_REAL_NEXTJS=1 npm run test:e2e:real
 */

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

async function openLiveMode(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__quanta?.ui?.getState), null, {
    timeout: 15_000,
  });
  await page.evaluate(() =>
    window.__quanta!.ui.getState().openOverlay('rscPayloadStep', { open: true }),
  );
  await expect(page.getByText('RSC payload step-through')).toBeVisible();
  await page.getByRole('button', { name: 'Live', exact: true }).first().click();
}

async function fetchRoute(page: Page, path: string) {
  const urlInput = page.locator('input[placeholder*="__rsc"]');
  await urlInput.fill(`/__rsc${path}`);
  await page.getByRole('button', { name: 'Fetch', exact: true }).click();
  await expect(page.locator('text=/^done$/').first()).toBeVisible({ timeout: 15_000 });
}

async function readChunkCount(page: Page): Promise<number> {
  const text = await page.evaluate(() => {
    for (const span of Array.from(document.querySelectorAll('span'))) {
      const t = (span.textContent ?? '').trim();
      if (t.startsWith('chunks:') && !t.includes('visible:') && !t.includes('size:')) {
        return t.replace('chunks:', '').trim();
      }
    }
    return '';
  });
  return Number(text);
}

test.describe('Real Next.js 15 corpus', () => {
  test('home route streams Flight payload with module + element + text chunks', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/');

    const count = await readChunkCount(page);
    // A tiny Next.js home page emits ~30+ chunks (layout-router, error-boundary,
    // metadata-boundary, segment trees, payload data). Loose bound — we just
    // want to know real Flight gets parsed at all.
    expect(count).toBeGreaterThan(10);

    // Reconstructed tree must show at least one real Next internal module.
    await expect(page.getByText('layout-router').first()).toBeVisible();
  });

  test('client island shows Counter as a client module', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');

    // Our parser labels modules by file basename (without extension).
    await expect(page.getByText('Counter').first()).toBeVisible();
    // Counter is a 'use client' component → environment="client" chip.
    await expect(page.getByText('client', { exact: true }).first()).toBeVisible();
  });

  test('suspense route includes follow-up streaming chunks', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/suspense');

    // The /suspense route awaits 200ms in a Suspense boundary, so the stream
    // total should be measurably longer than the static routes (>150ms).
    const totalText = await page.evaluate(() => {
      for (const span of Array.from(document.querySelectorAll('span'))) {
        const t = (span.textContent ?? '').trim();
        if (t.startsWith('total:') && !t.includes('chunks:') && !t.includes('size:')) {
          return t.replace('total:', '').replace('ms', '').trim();
        }
      }
      return '';
    });
    expect(Number(totalText)).toBeGreaterThan(150);

    // After parser improvements, "$Sreact.suspense" is detected as a reference
    // and labelled as <Suspense/> instead of dumped as raw text.
    await expect(page.getByText('<Suspense/>').first()).toBeVisible();
  });

  test('chunk-id repeat occurrences are counted and surfaced', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');

    // Real Next.js Flight emits some chunk ids 2+ times for follow-ups. The
    // chunk list shows a "×N" chip on the first occurrence row when N > 1.
    // We don't pin the exact count (it varies by Next version) — just assert
    // at least one such chip exists.
    await expect(page.locator('text=/^×[2-9]\\d*$/').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('server action descriptor is labelled action <name>()', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/action');

    // The Action page exposes submitAction as a 'use server' function, which
    // emits a descriptor with `"name":"submitAction","env":"Server"`. After
    // parser improvements the chunk row shows "action submitAction()".
    await expect(page.getByText(/action submitAction\(\)/).first()).toBeVisible();
  });

  test('batch capture across multiple routes prefixes chunk ids', async ({ page }) => {
    await openLiveMode(page);
    // Stub window.prompt to return our batch list (no UI prompt in headless).
    await page.evaluate(() => {
      window.prompt = () => '/island, /suspense';
    });
    await page.getByRole('button', { name: 'Batch', exact: true }).click();
    // Wait for the batch stream to complete.
    await expect(page.locator('text=/^done$/').first()).toBeVisible({
      timeout: 15_000,
    });
    // Batch source prefixes ids with the route slug, e.g. "island/3:".
    await expect(page.locator('text=/^island\\//').first()).toBeVisible();
    await expect(page.locator('text=/^suspense\\//').first()).toBeVisible();
  });

  test('export → import roundtrip preserves chunks', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Re-open overlay, switch to a different route, then import the trace.
    await fetchRoute(page, '/suspense');

    await page
      .locator('input[type="file"]')
      .setInputFiles(downloadPath!);

    // After import, source switches to recorded; status should reach done.
    await expect(page.locator('text=/^done$/').first()).toBeVisible({
      timeout: 10_000,
    });
    // Imported trace replays /island content — Counter (a user client module)
    // should be visible as an Element row, since /suspense doesn't have it.
    await expect(page.getByText('Counter').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('islands tab shows user client modules from last RSC trace', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');

    // Close the overlay.
    await page.keyboard.press('Escape');
    // Open the Islands tab in the left panel.
    await page.getByRole('button', { name: /^Islands$/ }).click();
    // The "From last RSC trace" section should be visible with our user module.
    await expect(page.getByText('From last RSC trace')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText('Counter').first()).toBeVisible();
  });

  test('boundary view shows Suspense boundaries with timing', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/multi-suspense');
    await page.getByRole('button', { name: 'Boundaries', exact: true }).click();
    // Header shows the boundary count.
    await expect(page.getByText('Suspense boundaries')).toBeVisible();
    // At least one row with a "Suspense" chip.
    await expect(page.getByText('Suspense', { exact: true }).first()).toBeVisible();
  });

  test('bundle tab RSC view shows real metrics from last trace', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');

    // Open Bundle bottom-panel tab + RSC sub-view.
    await page.getByRole('button', { name: /Bundle.*Vitals|^Bundle$/ }).first().click();
    await page.getByRole('button', { name: 'RSC', exact: true }).click();

    // Tiles should include client bundle bytes and follow-up count.
    await expect(page.getByText('client bundle')).toBeVisible();
    await expect(page.getByText('follow-ups')).toBeVisible();
    // The captured URL should be visible somewhere.
    await expect(page.getByText('/__rsc/island', { exact: false }).first()).toBeVisible();
  });

  test('cache lineage tab shows last RSC trace banner', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /Cache Lineage/ }).click();
    await expect(page.getByText('Last RSC trace')).toBeVisible();
    await expect(page.getByText('/__rsc/island', { exact: false }).first()).toBeVisible();
  });

  test('probe chip in status bar reflects last trace count', async ({ page }) => {
    // After fetching the /island route the chip shows the chunk count and is
    // no longer idle. (We don't assert on the initial state because the mock
    // source can auto-populate the trace store on first overlay open.)
    // Force English for stable assertions (i18n adds locale switching).
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('quanta.locale', 'en'));
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    // After i18n: probe chip aria-label is the localized "PROBE" token.
    const chip = page.getByRole('button', { name: 'PROBE', exact: true });
    await expect(chip).toBeVisible();
    await expect(chip).not.toContainText(/idle/);
  });

  test('routes tab shows probe trace banner', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Routes$/ }).first().click();
    await expect(page.getByText('probe').first()).toBeVisible();
    await expect(page.getByText('/__rsc/island', { exact: false }).first()).toBeVisible();
  });

  test('problems tab surfaces client-leak diagnostic from probe', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island'); // ships Counter as a client component
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Problems\b/ }).first().click();
    await expect(page.getByText('probe · client component leaked').first()).toBeVisible();
    await expect(page.getByText('Counter').first()).toBeVisible();
  });

  test('streaming visualizer shows probe live banner', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/suspense');
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      window.__quanta!.ui.getState().openOverlay('streamingVisualizer', { open: true });
    });
    await expect(page.getByText(/probe live/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('bundle RSC view shows real client modules bars', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Bundle.*Vitals|^Bundle$/ }).first().click();
    await page.getByRole('button', { name: 'RSC', exact: true }).click();
    await expect(page.getByText('Client modules (real, from RSC stream)')).toBeVisible();
    await expect(page.getByText('Counter').first()).toBeVisible();
  });

  test('Probe Info overlay opens and explains the system', async ({ page }) => {
    await openLiveMode(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /What is Quanta Probe/ }).click();
    await expect(page.getByText('What is Probe?')).toBeVisible();
    await expect(page.getByText('Where Probe data appears')).toBeVisible();
    await expect(page.getByText("What's next (roadmap)")).toBeVisible();
  });

  test('layouts tab surfaces probe layout-router chunks', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Layouts$/ }).first().click();
    await expect(page.getByText('layout-router').first()).toBeVisible();
  });

  test('metadata tab surfaces probe metadata-boundary chunks', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Meta$/ }).first().click();
    await expect(page.getByText('metadata-boundary').first()).toBeVisible();
  });

  test('actions tab surfaces server-action descriptors from probe', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/action');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Actions$/ }).first().click();
    await expect(page.getByText('submitAction()').first()).toBeVisible();
  });

  test('quality tab surfaces probe client-leak rows', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Quality$/ }).first().click();
    // RscTraceSection mode="leak" shows "leak" chip rows for user modules.
    await expect(page.getByText('Counter').first()).toBeVisible();
  });

  test('Ground-truth section combines Probe + AST in islands tab', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Islands$/ }).click();
    await expect(page.getByText('Ground truth (Probe + AST)')).toBeVisible();
    // The Counter component should be confirmed by both runtime + AST.
    await expect(page.getByText(/✓ AST/).first()).toBeVisible();
  });

  test('AI panel opens with Probe + AST context', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.keyboard.press('Escape');
    // Open AI panel via status bar AI button.
    await page.getByRole('button', { name: 'Open Quanta AI' }).click();
    await expect(page.getByText('Quanta AI')).toBeVisible();
    await expect(page.getByText('Context preview')).toBeVisible();
    // Stub provider should produce a deterministic response.
    await page.locator('input[placeholder*="Ask anything"]').fill('why is /island heavy?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(page.getByText(/Stub AI/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('Plugin findings overlay runs builtin plugins against Probe + AST', async ({ page }) => {
    await openLiveMode(page);
    await fetchRoute(page, '/island');
    await page.evaluate(() => {
      window.__quanta!.ui.getState().openOverlay('pluginFindings', { open: true });
    });
    await expect(page.getByText('Plugin findings').first()).toBeVisible();
    await expect(page.getByText(/@quanta\//).first()).toBeVisible();
  });

  test('Git status overlay reports shell-unavailable in browser', async ({ page }) => {
    await openLiveMode(page);
    await page.evaluate(() => {
      window.__quanta!.ui.getState().openOverlay('gitStatus', { open: true });
    });
    await expect(page.getByRole('heading', { name: 'Git status' })).toBeVisible();
    await expect(page.getByText(/shell unavailable|Tauri build/i).first()).toBeVisible();
  });

  test('diff between two routes highlights different content', async ({ page }) => {
    await openLiveMode(page);

    await fetchRoute(page, '/island');
    await page.getByRole('button', { name: /^Capture/ }).click();
    // Wait until the capture toast clears so we don't double-click.
    await page.waitForTimeout(300);

    await fetchRoute(page, '/suspense');
    await page.getByRole('button', { name: /^Capture/ }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /^Snapshots/ }).click();
    await page.getByRole('button', { name: 'Diff', exact: true }).first().click();

    // Diff summary chips: at least one must be non-zero (routes differ).
    // The summary bar shows "+N −N ~N =N" — assert that ~N is > 0.
    const summaryText = await page.evaluate(() => {
      // Pull all small chips' text content; one of them is "~<N>".
      return Array.from(document.querySelectorAll('span'))
        .map((s) => (s.textContent ?? '').trim())
        .filter((t) => /^[+\-−~=]\d+$/.test(t));
    });
    expect(summaryText.length).toBeGreaterThan(0);
    const changedChip = summaryText.find((t) => t.startsWith('~')) ?? '';
    const changedCount = Number(changedChip.replace('~', ''));
    expect(changedCount).toBeGreaterThan(0);
  });
});
