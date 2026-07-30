const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json'), 'utf8'));
const ownerFixtures = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/engineering-construction-owner-parity.json'), 'utf8'));
const fixturesById = new Map(ownerFixtures.map(row => [row.id, row]));
const missing = {
  afrodraft:'/fr/ingenierie/afrodraft/',
  'afroplan-floor-planner':'/fr/ingenierie/planificateur-etage/',
  'scaffolding-calc':'/fr/tools/calculateur-echafaudage/',
  'window-door-sizing':'/fr/tools/dimensionnement-fenetres-portes/',
  'plumbing-material':'/fr/tools/materiaux-plomberie/'
};
const rows = manifest.routes.map(row => ({ ...row, french:row.french || missing[row.id] }));

async function assertExactTwoHundredPercentReflow(page, route, state = 'initial') {
  for (const width of [320, 375]) {
    for (const requestedRoot of [16, 32]) {
      const proofLabel = `${route} [${state}] ${width}px/${requestedRoot}px root`;
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate(() => {
        document.documentElement.style.removeProperty('font-size');
      });
      const baseline = await page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      );
      expect(baseline, `${proofLabel} computed root baseline`).toBeCloseTo(16, 5);
      await page.evaluate((rootSize) => {
        document.documentElement.style.setProperty(
          'font-size',
          `${rootSize}px`,
          'important'
        );
      }, requestedRoot);
      await expect.poll(
        () => page.evaluate(() =>
          Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        ),
        { message: `${proofLabel} computed root` }
      ).toBeCloseTo(requestedRoot, 5);

      const audit = await page.evaluate(({ baselinePx, viewportWidth }) => {
        const composedParent = (element) => {
          if (element.parentElement) return element.parentElement;
          const root = element.getRootNode();
          return root instanceof ShadowRoot ? root.host : null;
        };
        const demonstrablyExcluded = (element) => {
          for (let current = element; current; current = composedParent(current)) {
            const style = getComputedStyle(current);
            if (
              current.hasAttribute('hidden') ||
              current.hasAttribute('inert') ||
              (current.tagName === 'DIALOG' && !current.hasAttribute('open'))
            ) return true;
            if (
              Number.parseFloat(style.opacity || '1') === 0 &&
              style.pointerEvents === 'none'
            ) return true;
          }
          return false;
        };
        const pathFor = (element) => {
          const root = element.getRootNode();
          const host = root instanceof ShadowRoot
            ? `${root.host.tagName.toLowerCase()}::shadow `
            : '';
          const id = element.id ? `#${element.id}` : '';
          const classes = element.classList && element.classList.length
            ? `.${Array.from(element.classList).slice(0, 3).join('.')}`
            : '';
          return `${host}${element.tagName.toLowerCase()}${id}${classes}`;
        };
        const clippedElements = [];
        const clippedTextFragments = [];
        const inspect = (root) => {
          root.querySelectorAll('*').forEach((element) => {
            if (element.shadowRoot) inspect(element.shadowRoot);
            if (demonstrablyExcluded(element)) return;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const visible = (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              Number(style.opacity || 1) > 0 &&
              rect.width > 0 &&
              rect.height > 0
            );
            if (!visible) return;
            if (rect.left < -1 || rect.right > viewportWidth + 1) {
              clippedElements.push({
                path: pathFor(element),
                left: Number(rect.left.toFixed(2)),
                right: Number(rect.right.toFixed(2)),
                width: Number(rect.width.toFixed(2))
              });
            }
            Array.from(element.childNodes)
              .filter((node) => (
                node.nodeType === Node.TEXT_NODE &&
                /\S/.test(node.data || '')
              ))
              .forEach((textNode) => {
                const value = textNode.data || '';
                const start = value.search(/\S/);
                const end = value.search(/\s*$/);
                const range = document.createRange();
                range.setStart(textNode, start);
                range.setEnd(textNode, end);
                Array.from(range.getClientRects())
                  .forEach((textRect, fragmentIndex) => {
                    if (
                      textRect.width <= 0 ||
                      textRect.height <= 0 ||
                      (
                        textRect.left >= -1 &&
                        textRect.right <= viewportWidth + 1
                      )
                    ) return;
                    clippedTextFragments.push({
                      path: `${pathFor(element)}::text(` +
                        `${JSON.stringify(value.trim().slice(0, 48))})` +
                        `[${fragmentIndex}]`,
                      left: Number(textRect.left.toFixed(2)),
                      right: Number(textRect.right.toFixed(2)),
                      width: Number(textRect.width.toFixed(2))
                    });
                  });
                range.detach();
              });
          });
        };
        inspect(document.body);
        return {
          baseline: baselinePx,
          resized: Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize
          ),
          scrollWidth: document.documentElement.scrollWidth,
          clippedElements,
          clippedTextFragments
        };
      }, { baselinePx: baseline, viewportWidth: width });
      expect(audit.resized, `${proofLabel} computed root`)
        .toBeCloseTo(requestedRoot, 5);
      expect(
        audit.resized / audit.baseline,
        `${proofLabel} exact root scale`
      ).toBeCloseTo(requestedRoot / 16, 5);
      expect(
        audit.scrollWidth - width,
        `${proofLabel} document overflow`
      ).toBeLessThanOrEqual(2);
      expect(
        audit.clippedElements,
        `${proofLabel} visible descendants clipped`
      ).toEqual([]);
      expect(
        audit.clippedTextFragments,
        `${proofLabel} direct text fragments clipped`
      ).toEqual([]);
    }
  }
}

test('French Engineering hub exposes all 26 native owners with keyboard and 320px/200% reflow', async ({ page }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/fr/ingenierie/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/ingenierie/');
  await expect(page.locator('.fr-engineering-hub-card')).toHaveCount(26);
  await page.locator('.fr-engineering-hub-card').first().focus();
  await expect(page.locator('.fr-engineering-hub-card').first()).toBeFocused();
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await assertExactTwoHundredPercentReflow(page, '/fr/ingenierie/');
  expect(failures).toEqual([]);
});

test('all 26 French Engineering owners are physical, native, runnable and reflow-safe', async ({ page }) => {
  test.setTimeout(420_000);
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  for (const row of rows) {
    failures.length = 0;
    await page.setViewportSize({ width:375, height:800 });
    await page.goto(row.french, { waitUntil:'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.french}`);
    await expect(page.locator(`link[rel="alternate"][hreflang="en"]`)).toHaveAttribute('href', `https://afrotools.com${row.english}`);
    await expect(page.locator(`link[rel="alternate"][hreflang="fr"]`)).toHaveAttribute('href', `https://afrotools.com${row.french}`);
    expect(await page.locator('iframe').count(), `${row.french} contains an iframe`).toBe(0);
    expect(await page.locator('script').evaluateAll(nodes => nodes.some(node => /fetch\s*\(\s*SOURCE_URL|mountSource|source-launch/.test(node.textContent || '')))).toBe(false);
    await expect(page.locator('h1').first()).toBeVisible();

    await assertExactTwoHundredPercentReflow(page, row.french, 'initial');

    const fixture = fixturesById.get(row.id);
    const action = fixture && fixture.frenchAction
      ? page.getByRole('button', { name: new RegExp(fixture.frenchAction, 'i') }).first()
      : null;
    if (action) {
      await expect(action, `${row.french} primary result action`).toBeVisible();
      const before = await page.locator('body').innerText();
      await action.click();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const after = await page.locator('body').innerText();
      expect(after.length, `${row.french} action produced no output`).toBeGreaterThanOrEqual(before.length);
      expect(after).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    } else {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }

    await page.emulateMedia({ colorScheme:'dark', reducedMotion:'reduce' });
    await page.evaluate(() => { document.documentElement.dataset.theme='dark'; });
    await assertExactTwoHundredPercentReflow(page, row.french, action ? 'rendered-result' : 'rendered-load');
    expect(failures, `${row.french} page errors: ${failures.join(' | ')}`).toEqual([]);
  }
});
