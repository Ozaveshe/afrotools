// Focused, synthetic local evidence. Run from the repository root with the static server on 4173.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const { chromium } = require('@playwright/test');
const root = process.cwd();
const slugs = ['construction-material-prices-nigeria', 'nysc-allowance-financial-guide-2026', 'ghana-cedi-words', 'waec-result-guide-2026'];
const routes = slugs.map(s => '/blog/' + s + '/');
const files = slugs.map(s => 'blog/' + s + '/index.html');
const targetRoutes = routes.slice(2);
const ownerPath = 'data/seo/priority-pages.json';
const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
const originalOwner = JSON.parse(execFileSync('git', ['show', '9b29eab0408eedd9442c98c2cabf567098da80ab:' + ownerPath], { encoding: 'utf8', maxBuffer: 2e6 }));
for (const key of Object.keys(owner)) {
  if (key !== 'pages') assert.deepEqual(owner[key], originalOwner[key], 'Unowned owner field: ' + key);
}
for (const route of Object.keys(owner.pages)) {
  if (!targetRoutes.includes(route)) assert.deepEqual(owner.pages[route], originalOwner.pages[route], 'Unowned page record: ' + route);
}
// Exercise the actual owner generator in memory, restricting its input to the approved records.
const generatorPath = path.join(root, 'scripts/build-seo-system.js');
const ctx = { require: require('module').createRequire(generatorPath), __dirname: path.dirname(generatorPath), console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(generatorPath, 'utf8').replace(/main\(\);\s*$/, ''), ctx);
const output = new Map();
ctx.writeFile = (file, content) => output.set(path.relative(root, file).replace(/\\/g, '/'), content);
ctx.applyPageConfig({ ...owner, pages: Object.fromEntries(targetRoutes.map(r => [r, owner.pages[r]])) });
for (const [file, content] of output) assert.equal(content, fs.readFileSync(file, 'utf8'), 'Generator drift: ' + file);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const result = { checkedAt: new Date().toISOString(), mode: 'local static server; service workers blocked; external requests aborted; analytics consent declined', ownerRecordsIsolated: true, generatorRoundtrip: true, pages: [], handoffs: [] };
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  for (const width of [360, 390, 1280]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    for (let i = 0; i < routes.length; i++) {
      const errors = [];
      const consoleErrors = [];
      const failedLocalResponses = [];
      const capture = error => errors.push(error.message);
      const captureConsole = message => { if (message.type() === 'error' && !message.text().includes('net::ERR_FAILED')) consoleErrors.push(message.text()); };
      const captureResponse = response => { if (new URL(response.url()).hostname === '127.0.0.1' && response.status() >= 400) failedLocalResponses.push({ url: response.url(), status: response.status() }); };
      page.on('pageerror', capture);
      page.on('console', captureConsole);
      page.on('response', captureResponse);
      const response = await page.goto('http://127.0.0.1:4173' + routes[i], { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      const proof = await page.evaluate(() => {
        const clean = s => s.replace(/\s+/g, ' ').trim();
        const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
        const article = schemas.find(s => ['Article', 'BlogPosting'].includes(s['@type']));
        const faq = schemas.find(s => s['@type'] === 'FAQPage');
        return {
          title: document.title, h1Count: document.querySelectorAll('h1').length,
          canonical: document.querySelector('link[rel="canonical"]').href,
          description: document.querySelector('meta[name="description"]').content,
          ogDescription: document.querySelector('meta[property="og:description"]').content,
          schemaDescription: article.description, modified: article.dateModified,
          modifiedMeta: document.querySelector('meta[property="article:modified_time"]').content,
          missingFaqAnswers: (faq?.mainEntity || []).filter(q => !clean(document.body.textContent).includes(clean(q.acceptedAnswer.text))).map(q => q.name),
          missingAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => a.hash.length > 1 && !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a => a.hash),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          bodyWidth: document.querySelector('.article-body').getBoundingClientRect().width
        };
      });
      assert.equal(proof.h1Count, 1);
      assert.equal(proof.canonical, 'https://afrotools.com' + routes[i]);
      assert.equal(proof.description, proof.ogDescription);
      assert.equal(proof.description, proof.schemaDescription);
      assert.equal(proof.modified, '2026-09-08');
      assert.equal(proof.modifiedMeta, proof.modified);
      assert.deepEqual(proof.missingFaqAnswers, []);
      assert.deepEqual(proof.missingAnchors, []);
      assert.equal(proof.overflow, false, routes[i] + ' page overflow at ' + width);
      assert.ok(proof.bodyWidth > Math.min(250, width - 40), 'Article body too narrow');
      assert.deepEqual(errors, []);
      assert.deepEqual(consoleErrors, []);
      assert.deepEqual(failedLocalResponses, []);
      if (width === 390 && process.env.SEARCH_INTENT_SCREENSHOTS) {
        const selector = ['#price-checklist', '#allowance-breakdown', '#pesewas', '#check-result'][i];
        await page.locator(selector).evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'instant' }));
        await page.screenshot({ path: path.join(process.env.SEARCH_INTENT_SCREENSHOTS, slugs[i] + '.png') });
      }
      result.pages.push({ route: routes[i], width, status: response.status(), ...proof, pageErrors: errors, consoleErrors, failedLocalResponses });
      page.off('pageerror', capture);
      page.off('console', captureConsole);
      page.off('response', captureResponse);
    }
    await page.close();
  }
  const destinations = ['/tools/building-materials/', '/tools/budget-planner/', '/tools/amount-words-gh/', '/tools/waec-calculator/'];
  for (let i = 0; i < routes.length; i++) {
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:4173' + routes[i]);
    const link = page.locator('.article-body a[href="' + destinations[i] + '"]').first();
    await link.focus();
    assert.equal(await link.evaluate(a => a === document.activeElement), true);
    await page.keyboard.press('Enter');
    await page.waitForURL('**' + destinations[i]);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('h1').count(), 1);
    if (i === 0) {
      for (const [name, value] of Object.entries({ currency: 'NGN', quantity: '2', unitCost: '100', fixed: '20', contingency: '10' })) await page.locator('[name="' + name + '"]').fill(value);
      await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
      assert.match(await page.locator('[data-result]').innerText(), /242/);
    }
    if (i === 1) {
      await page.locator('#currency').selectOption('NGN');
      await page.locator('.inc-amt').first().fill('77000');
      await page.locator('.inc-amt').first().dispatchEvent('input');
      assert.match(await page.locator('#sIncome').innerText(), /77,000/);
    }
    if (i === 2) {
      await page.locator('#amount').fill('3500.05');
      assert.match(await page.locator('body').innerText(), /PESEWAS FIVE ONLY/i);
      await page.locator('#amount').fill('3500.50');
      assert.match(await page.locator('body').innerText(), /PESEWAS FIFTY ONLY/i);
    }
    if (i === 3) {
      await page.getByRole('button', { name: 'Load sample grades' }).click();
      assert.ok(await page.locator('select').count() > 2);
    }
    result.handoffs.push({ article: routes[i], destination: destinations[i], keyboardNavigation: true, syntheticControlSmoke: true });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'local-proof.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('PASS: isolated owner records, generator roundtrip, 12 article viewport checks, schema/FAQ/anchors, four keyboard tool handoffs and synthetic control smokes.');
})().catch(error => { console.error(error); process.exit(1); });
