const { test, expect } = require('@playwright/test');
const fs = require('fs');
const routes = ['/fr/tools/croissance-carriere/', '/fr/tools/changement-carriere/', '/fr/tools/preparation-retraite/', '/fr/tools/negociation-salaire/'];
const storageKey = 'afrotools-fr-career-hub-v1';

for (const width of [320, 390, 1365]) {
  test(`French career discovery and keyboard checklist at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/fr/');
    await page.locator('.fr-home-category[data-category="career"]').click();
    await expect(page).toHaveURL(/\/fr\/jobs\/$/);
    await page.locator('main>nav a[href="/fr/categories/"]').click();
    await page.locator('main a[href="/fr/jobs/"]').first().click();
    await expect(page).toHaveURL(/\/fr\/jobs\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    for (const route of routes) await expect(page.locator(`main a[href="${route}"]`).first()).toBeVisible();
    const choose = page.locator('[data-career-select="negotiate"]');
    await choose.focus();
    await page.keyboard.press('Enter');
    await expect(choose).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-career-checklist]')).toBeVisible();
    await page.locator('[data-career-checks] input').first().focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-career-checks] input').first()).toBeChecked();
    await page.reload();
    await expect(page.locator('[data-career-checks] input').first()).toBeChecked();
    await expect(page.locator('[data-career-continue]')).toHaveAttribute('href', '/fr/tools/negociation-salaire/');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger ma liste TXT' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('afrotools-parcours-negotiate.txt');
    expect(fs.readFileSync(await download.path(), 'utf8')).toContain('[x] Noter le salaire');
    await page.getByRole('button', { name: 'Effacer ma liste locale' }).click();
    expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
    await page.reload();
    await expect(page.locator('[data-career-checklist]')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('shared career link excludes unrelated query data and checklist values', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/fr/jobs/?path=switch&private_fixture=synthetic-career-marker#private-fragment');
  await page.locator('[data-career-checks] input').first().check();
  await page.getByRole('button', { name: 'Copier le lien du parcours' }).click();
  await expect(page.locator('[data-career-status]')).toContainText('copié');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(new URL('/fr/jobs/?path=switch', page.url()).href);
  await page.getByRole('button', { name: 'Effacer ma liste locale' }).click();
  await page.reload();
  await expect(page.locator('[data-career-checklist]')).toBeHidden();
});

test('career checklist stays usable when persistence is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'afrotools-fr-career-hub-v1') throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/fr/jobs/');
  await page.locator('[data-career-select="growth"]').click();
  await expect(page.locator('[data-career-status]')).toContainText('Enregistrement local impossible');
  await expect(page.locator('[data-career-checklist]')).toBeVisible();
  await expect(page.locator('[data-career-continue]')).toHaveAttribute('href', '/fr/tools/croissance-carriere/');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger ma liste TXT' }).click();
  expect((await downloadPromise).suggestedFilename()).toContain('growth');
});

test('career search handles accents, empty results and reset without sharing a query', async ({ page }) => {
  await page.goto('/fr/jobs/');
  const original = page.url();
  await page.getByLabel('Rechercher un parcours').fill('negocier');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.locator('[data-career-path]:visible')).toHaveCount(1);
  await expect(page.locator('[data-career-search-status]')).toContainText('1 parcours disponible');
  await page.getByLabel('Rechercher un parcours').fill('synthetic-private-query-marker');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.locator('[data-career-search-status]')).toContainText('Aucun parcours trouvé');
  await page.getByRole('button', { name: 'Afficher les quatre parcours' }).click();
  await expect(page.locator('[data-career-path]:visible')).toHaveCount(4);
  expect(page.url()).toBe(original);
});

test('career paths reject unknown query values and normalize stored fields', async ({ page }) => {
  await page.goto('/fr/jobs/');
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ path: 'retire', private: 'synthetic-career-marker', checks: { retire: [true, 'private', { unsafe: true }, false] } })), storageKey);
  await page.goto('/fr/jobs/?path=unknown');
  await expect(page.locator('[data-career-checks] input').first()).toBeChecked();
  await expect(page.locator('[data-career-checks] input').nth(1)).not.toBeChecked();
  await page.getByRole('button', { name: 'Enregistrer ma liste' }).click();
  expect(await page.evaluate(key => Object.keys(JSON.parse(localStorage.getItem(key))), storageKey)).toEqual(['path', 'checks']);
});

for (const route of routes) {
  test(`${route} saved report can be reopened, exported and deleted after reload`, async ({ page }) => {
    await page.goto(route);
    await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
    const report = await page.locator('[data-report]').textContent();
    await page.getByRole('button', { name: 'Enregistrer sur cet appareil' }).click();
    await page.reload();
    await expect(page.locator('[data-results]')).toBeHidden();
    await page.getByRole('button', { name: 'Rouvrir le rapport enregistré' }).click();
    await expect(page.locator('[data-report]')).toHaveText(report);
    await expect(page.locator('[data-status]')).toContainText('champs du formulaire ne sont pas restaurés');
    await expect(page.locator('[data-metrics] .fr-metric')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger TXT' }).click();
    expect(fs.readFileSync(await (await downloadPromise).path(), 'utf8')).toBe(report);
    await page.getByRole('button', { name: 'Effacer le rapport enregistré' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Rouvrir le rapport enregistré' }).click();
    await expect(page.locator('[data-status]')).toContainText('Aucun rapport enregistré');
    await expect(page.locator('[data-results]')).toBeHidden();
    await expect(page.locator('main a[href="/fr/jobs/"]')).toBeVisible();
  });
}

test('invalid recalculation cannot leave an old career report available', async ({ page }) => {
  await page.goto(routes[1]);
  await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
  await expect(page.locator('[data-results]')).toBeVisible();
  await page.locator('[name=currentSalary]').fill('-1');
  await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
  await expect(page.locator('[data-results]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Vérifiez les valeurs');
});

test('saved career content stays inert and malformed saves can be cleared', async ({ page }) => {
  await page.goto(routes[1]);
  await page.evaluate(() => localStorage.setItem('afrotools-fr-career-switch', JSON.stringify({ savedAt: Date.now(), report: '<img src="unsafe-fixture" onerror="window.unsafeFixture=true">' })));
  await page.getByRole('button', { name: 'Rouvrir le rapport enregistré' }).click();
  await expect(page.locator('[data-report] img')).toHaveCount(0);
  expect(await page.evaluate(() => window.unsafeFixture)).toBeUndefined();
  await page.evaluate(() => localStorage.setItem('afrotools-fr-career-switch', '{invalid-json'));
  await page.getByRole('button', { name: 'Rouvrir le rapport enregistré' }).click();
  await expect(page.locator('[data-status]')).toContainText('rapport illisible');
  await page.getByRole('button', { name: 'Effacer le rapport enregistré' }).click();
  expect(await page.evaluate(() => localStorage.getItem('afrotools-fr-career-switch'))).toBeNull();
});

test('retirement report uses the visible French country label', async ({ page }) => {
  await page.goto(routes[2]);
  await page.getByLabel('Pays et devise d’affichage').selectOption('ZA');
  await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
  await expect(page.locator('[data-report]')).toContainText('Pays : Afrique du Sud');
  await expect(page.locator('[data-report]')).not.toContainText('South Africa');
});

test('blocked clipboard reports failure and leaves the primary local export usable', async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.clipboard) Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) });
    document.execCommand = () => false;
  });
  await page.goto(routes[1]);
  await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
  await page.getByRole('button', { name: 'Copier', exact: true }).click();
  await expect(page.locator('[data-status]')).toContainText('Copie indisponible');
  await expect(page.locator('[data-status]')).not.toContainText('Rapport copié');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger TXT' }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.txt$/);
});

test('career UI reflows at 200% and has readable contrast in both themes', async ({ page }) => {
  for (const route of ['/fr/jobs/', ...routes]) {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto(route);
    if (route === '/fr/jobs/') await page.locator('[data-career-select="retire"]').click();
    else await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
    for (const details of await page.locator('main details').all()) await details.locator('summary').click();
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
      await page.waitForFunction(() => typeof window.AfroTools?.darkMode?.set === 'function');
      await page.evaluate(theme => window.AfroTools.darkMode.set(theme), theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme-choice', theme);
      await page.evaluate(async () => {
        const deadline = performance.now() + 7000;
        let emptyFrames = 0;
        while (emptyFrames < 2) {
          if (performance.now() > deadline) throw new Error('Career theme did not settle within the existing 7-second boundary');
          await new Promise(resolve => requestAnimationFrame(resolve));
          const animations = document.getAnimations();
          if (animations.length) { emptyFrames = 0; await Promise.all(animations.map(animation => animation.finished.catch(() => {}))); }
          else emptyFrames++;
        }
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      const failures = await page.locator('main').evaluate(main => {
        const rgb = color => {
          const values = color.match(/[\d.]+/g);
          if (!values || values.length < 3) throw new Error('Unreadable computed color');
          return values.slice(0, 3).map(Number);
        };
        const light = c => c.map(v => { const n = v / 255; return n <= .04045 ? n / 12.92 : Math.pow((n + .055) / 1.055, 2.4); }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
        return [...main.querySelectorAll('p,li,label,legend,a,button,.fr-metric span,.fr-metric strong,pre')].filter(el => el.getClientRects().length && !el.disabled).map(el => {
          const style = getComputedStyle(el);
          let parent = el, bg;
          while (parent) { bg = getComputedStyle(parent).backgroundColor; if (bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') break; parent = parent.parentElement; }
          const foreground = light(rgb(style.color)), background = light(rgb(bg || 'rgb(255, 255, 255)'));
          const contrast = (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          return { element: el.tagName + '.' + el.className, contrast, minimum: large ? 3 : 4.5, foreground: style.color, background: bg, theme: document.documentElement.getAttribute('data-theme'), mainColor: getComputedStyle(main).color, darkAncestors: [...document.querySelectorAll('[data-theme="dark"]')].map(el => el.tagName), mainInline: main.getAttribute('style') };
        }).filter(row => row.contrast < row.minimum);
      });
      expect.soft(failures, `${route} ${theme}`).toEqual([]);
    }
  }
});
