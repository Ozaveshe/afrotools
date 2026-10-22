const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const recipePolicy = require('../../engines/src/afrokitchen-engine');
const { inspectPendingMethodPage } = require('../../scripts/audit-afrokitchen-indexability');
const { LEGACY_RECIPE_ALIASES } = require('../../scripts/generate-afrokitchen-static-pages');
const manifest = JSON.parse(fs.readFileSync('tools/afrokitchen/seo-manifest.json', 'utf8'));

// All nine cases use the real static server and its HTTP policy. Never reach a
// provider, local function, API or external host from an automation context.
const path = require('node:path');
const crypto = require('node:crypto');
const { readSecurityHeaders } = require('../support/netlify-security-headers');
const staticRoot = path.resolve(process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1' ? 'dist' : '.');
const policyFor = readSecurityHeaders(path.join(staticRoot, '_headers'));
const expectedKitchenOrigin = 'http://127.0.0.1:' + (process.env.PORT || 4173);
if (process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_BASE_URL !== expectedKitchenOrigin) throw new Error('Kitchen coverage refuses a configurable remote or alternate base URL');
const contextProofs = new WeakMap();
const testProofs = new Map();
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
test.use({ serviceWorkers: 'block', bypassCSP: false, launchOptions: { args: [
  '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost'
] } });
async function installClosedKitchenContext(context, origin, testInfo) {
  if (origin !== expectedKitchenOrigin) throw new Error('Kitchen context requires literal expected127 loopback origin');
  if (contextProofs.has(context)) return contextProofs.get(context);
  const proof = { origin, blocked: [], missingStatic: [], synthetic: [], legacy: null, indexFailure: null, indexRequests: 0, configuredIndexBoundaries: [] };
  contextProofs.set(context, proof);
  const all = testProofs.get(testInfo.testId) || []; all.push(proof); testProofs.set(testInfo.testId, all);
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method()) || /^\/(?:api|\.netlify|rest|auth)\//.test(url.pathname)) {
      let classification='unexpected-network-attempt';
      // Exact inherited font/SDK boot and telemetry endpoints remain BLOCKED.
      // They are documented omissions of this closed proof, never fulfilled.
      if (url.origin !== origin && ['GET','HEAD'].includes(request.method())) {
        if (url.hostname==='www.googletagmanager.com' && url.pathname==='/gtag/js') classification='expected-blocked-telemetry-boot';
        else if (/^(?:www\.|region1\.)?google-analytics\.com$/.test(url.hostname) && /^\/(?:g\/)?collect$/.test(url.pathname)) classification='expected-blocked-telemetry';
        else if (url.hostname==='fonts.googleapis.com' && /^\/css2?$/.test(url.pathname)) classification='expected-blocked-font-boot';
        else if (url.hostname==='fonts.gstatic.com' && url.pathname.startsWith('/s/')) classification='expected-blocked-font-boot';
        else if (url.hostname==='cdn.jsdelivr.net' && url.pathname==='/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js') classification='expected-blocked-sdk-boot';
      } else if (url.origin===origin && request.method()==='GET' && ['/api/auth/session','/api/auth/health'].includes(url.pathname)) classification='expected-blocked-auth-boot';
      proof.blocked.push({ classification, method: request.method(), url: request.url() }); return route.abort('blockedbyclient');
    }
    if (url.pathname === '/tools/afrokitchen/recipe-index.json') proof.indexRequests++;
    if (proof.legacy && url.pathname === proof.legacy.route && request.isNavigationRequest()) {
      proof.synthetic.push({ kind: 'historical-document', path: url.pathname, sha256: digest(Buffer.from(proof.legacy.html)) });
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': policyFor(url.pathname) }, body: proof.legacy.html });
    }
    if (proof.indexFailure && url.pathname === '/tools/afrokitchen/recipe-index.json') {
      proof.synthetic.push({ kind: 'index-unavailable', mode: proof.indexFailure });
      return route.fulfill({ status: proof.indexFailure === '503' ? 503 : 200, contentType: 'application/json', body: proof.indexFailure === '503' ? '{"synthetic":"unavailable"}' : '{invalid synthetic index' });
    }
    let relative;
    try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, ''); } catch { return route.abort('blockedbyclient'); }
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(staticRoot, relative);
    const safe = file.startsWith(staticRoot + path.sep) && !relative.split(/[\\/]/).includes('..')
      && !/^(?:tests|scripts|netlify|node_modules|data|engines\/src|\.)[\\/]/.test(relative)
      && /\.(?:html|js|css|json|webmanifest|webp|png|jpe?g|svg|ico|avif|woff2?|ttf|mp3|mp4|pdf)$/i.test(relative)
      && fs.existsSync(file) && fs.statSync(file).isFile() && fs.realpathSync(file).startsWith(staticRoot + path.sep);
    if (!safe) { proof.missingStatic.push(url.pathname); return route.abort('blockedbyclient'); }
    return route.continue();
  });
  return proof;
}
test.beforeEach(async ({ context, baseURL }, testInfo) => {
  if (process.env.AFROTOOLS_TEST_DISABLE_ANALYTICS === '1') throw new Error('Kitchen coverage requires real consent UI, not substituted analytics/storage');
  if (baseURL !== expectedKitchenOrigin) throw new Error('Kitchen coverage requires its exact127 base URL');
  await installClosedKitchenContext(context, baseURL, testInfo);
});
test.afterEach(async ({}, testInfo) => {
  const proofs = testProofs.get(testInfo.testId) || [];
  await testInfo.attach('closed-network-boundaries', { body: JSON.stringify(proofs, (key, value) => key === 'legacy' && value ? { route: value.route, sha256: value.htmlSha256 } : value, 2), contentType: 'application/json' });
  expect(proofs.flatMap(proof => proof.missingStatic)).toEqual([]);
  expect(proofs.flatMap(proof => proof.blocked).filter(row => row.classification.startsWith('unexpected-'))).toEqual([]);
  testProofs.delete(testInfo.testId);
});
test('old query recipe links reach the published canvas and retain planned servings', async ({ page }) => {
  await page.goto('/tools/afrokitchen/recipe.html?slug=jollof-rice-ng&plan_servings=4');
  await expect(page).toHaveURL(/\/recipes\/jollof-rice-ng\/\?plan_servings=4$/);
  await expect(page.locator('.ak-visual-recipe')).toBeVisible();
  await expect(page.locator('#ak-static-servings')).toHaveText('4');
});

function assertPublishedRecipeInventory(value, readHtml, aliases = LEGACY_RECIPE_ALIASES) {
  const generated = value.recipes.filter(recipe => recipe.generated_in_wave);
  const declared = value.routes.generated_recipe_slugs;
  assert.equal(new Set(declared).size, declared.length, 'duplicate declared generated slug');
  assert.deepEqual(generated.map(recipe => recipe.slug).sort(), [...declared].sort(), 'every declared generated recipe is classified exactly once');
  const ids = new Set(), slugs = new Set(), counts = { total: 0, canvas: 0, pending: 0, aliases: 0 };
  function exactCanonical(html, expected) {
    const canonical = [];
    for (const match of html.matchAll(/<link\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)) {
      const attributes = new Map();
      let rest = match[0].replace(/^<link\b/i, '').replace(/\/?>(?:\s*)$/, '');
      while (rest.trim()) {
        const attribute = /^\s+([^\s=<>"'\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>"'=]+)))?/.exec(rest);
        assert(attribute, 'malformed link attributes');
        const name = attribute[1].toLowerCase();
        assert(!attributes.has(name), 'duplicate link attribute');
        attributes.set(name, attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
        rest = rest.slice(attribute[0].length);
      }
      if ((attributes.get('rel') || '').toLowerCase().split(/\s+/).includes('canonical')) canonical.push(attributes);
    }
    assert.equal(canonical.length, 1, 'one canonical link');
    assert.equal(canonical[0].get('href'), expected, 'canonical target');
  }
  for (const recipe of generated) {
    assert.equal(recipe.is_published, true); assert.equal(recipe.is_verified, true);
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(recipe.slug), 'safe canonical slug');
    assert(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(recipe.id), 'canonical UUID');
    assert(!ids.has(recipe.id) && !slugs.has(recipe.slug), 'duplicate recipe identity'); ids.add(recipe.id); slugs.add(recipe.slug);
    const html = readHtml(recipe.slug);
    const payloads = [...html.matchAll(/window\.__AK_STATIC_RECIPE\s*=\s*([\s\S]*?);\s*<\/script>/g)];
    assert.equal(payloads.length, 1, 'one recipe payload: ' + recipe.slug);
    const payload = JSON.parse(payloads[0][1]);
    assert.equal(payload.id, recipe.id); assert.equal(payload.slug, recipe.slug);
    assert.equal(recipe.route_url, 'https://afrotools.com/tools/afrokitchen/recipes/' + recipe.slug + '/');
    exactCanonical(html, recipe.route_url);
    if (recipePolicy.isPendingRecipeMethod(recipe)) {
      const inspected = inspectPendingMethodPage(recipe, html);
      assert.deepEqual(inspected, { state: 'pending-source-method', errors: [] }, recipe.slug);
      const projected = recipePolicy.projectPendingRecipeMethod(recipe);
      for (const key of ['method_review_status','yield_status','default_servings','prep_time_minutes','cook_time_minutes','total_time_minutes','calories','protein_g','carbs_g','fat_g','fiber_g','ingredients','steps']) assert.deepEqual(recipe[key], projected[key], 'pending manifest field: ' + key);
      const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      assert(!/data-ak-(?:cook-mode|copy-recipe|download-recipe|print-recipe|add-meal-plan)|ak-static-serving-bar|class=["'][^"']*\bak-(?:step|ing-item)\b/.test(markup), 'pending method exposes cooking/planning/export controls');
      assert(!html.includes('ak-visual-recipe'), 'pending page must not claim a cooking canvas');
      counts.pending++;
    } else {
      // Unknown person-yield does not mean a missing preparation method.
      assert(Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0, 'missing maintained ingredients');
      assert(Array.isArray(recipe.steps) && recipe.steps.length > 0, 'missing maintained method');
      assert(html.includes('ak-visual-recipe'));
      assert(html.includes('/tools/afrokitchen/visual-recipe.js'));
      assert(!html.includes('<section class="ak-hero" style="background-image:'));
      assert(Array.isArray(payload.ingredients) && Array.isArray(payload.steps));
      assert.equal((html.match(/class="ak-ing-art"/g) || []).length, payload.ingredients.length);
      assert.equal((html.match(/class="ak-step"/g) || []).length, payload.steps.length);
      assert(payload.ingredients.length > 0 && payload.steps.length > 0, 'empty rendered method');
      counts.canvas++;
    }
    counts.total++;
  }
  const aliasSlugs = new Set();
  for (const alias of aliases) {
    assert(!slugs.has(alias.legacySlug) && !aliasSlugs.has(alias.legacySlug), 'duplicate/canonical legacy alias');
    assert(slugs.has(alias.targetRecipeSlug), 'legacy alias target missing from classified inventory');
    aliasSlugs.add(alias.legacySlug);
    const html = readHtml(alias.legacySlug), target = 'https://afrotools.com/tools/afrokitchen/recipes/' + alias.targetRecipeSlug + '/';
    assert(/<meta\b[^>]*name="robots"[^>]*content="noindex,\s*follow"/.test(html), 'legacy alias must remain noindex');
    exactCanonical(html, target);
    assert(html.includes('<meta http-equiv="refresh" content="0;url=' + target.replace('https://afrotools.com', '') + '">'), 'legacy refresh target');
    counts.aliases++;
  }
  return counts;
}
async function kitchenMain(page) {
  const content = page.getByRole('main');
  await expect(content).toHaveCount(1);
  await expect(content).toBeVisible();
  return content;
}
test('all generated public recipe pages retain classified method and recipe-data boundaries', async () => {
  assertPublishedRecipeInventory(manifest, slug => fs.readFileSync(path.join(staticRoot, 'tools/afrokitchen/recipes', slug, 'index.html'), 'utf8'));
});

for (const variant of [{width:320,theme:'light'},{width:390,theme:'dark'},{width:1280,theme:'light'}]) {
  test.describe(`${variant.width} ${variant.theme}`, () => {
    test.use({ viewport:{width:variant.width,height:900},colorScheme:variant.theme });
    test('ingredient cards, serving changes, independent timers and full method', async ({ page }) => {
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(theme=>{localStorage.setItem('aft_theme',theme);localStorage.setItem('afrotools_cookie_consent','declined');},variant.theme);
      await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
      await expect(page.locator('.ak-ing-art')).toHaveCount(14);
      const checkbox=page.locator('#ak-static-ingredients input').first();
      await checkbox.check();
      await page.getByRole('button',{name:'Increase servings',exact:true}).click();
      await expect(page.locator('#ak-static-servings')).toHaveText('7');
      await expect(page.locator('.ak-ing-art')).toHaveCount(14);
      await expect(checkbox).toBeChecked();
      await expect(page.locator('#ak-static-ingredients .ak-ing-item').nth(1)).toContainText('7 medium');
      await page.clock.install();
      await page.locator('#ak-timer-toggle-1').click();
      await page.locator('[data-ak-visual-next]').click();
      await expect(page.locator('#step-1')).toBeHidden();
      await expect(page.locator('#step-2')).toBeVisible();
      await page.clock.runFor(2000);
      await expect(page.locator('.ak-running-timers')).toContainText('29:58');
      await page.locator('.ak-running-timers button').click();
      await expect(page.locator('#step-1')).toBeVisible();
      await page.locator('#ak-timer-toggle-1').click();
      const pausedTime = await page.locator('#ak-timer-display-1').textContent();
      await page.clock.runFor(2000);
      await expect(page.locator('#ak-timer-display-1')).toHaveText(pausedTime);
      await page.locator('[data-ak-full-method]').click();
      await expect(page.locator('.ak-step:visible')).toHaveCount(6);
      await expect(page.locator('.ak-visual-pager')).toBeHidden();
      await page.locator('[data-ak-cook-mode]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.ak-step:visible')).toHaveCount(6);
      const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,background:getComputedStyle(document.querySelector('.ak-hero')).backgroundImage}));
      expect(geometry.overflow).toBeLessThanOrEqual(1);expect(geometry.background).toBe('none');expect(errors).toEqual([]);
    });
  });
}
test('no JavaScript still exposes ingredients and every cooking step', async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block',bypassCSP:false});
  await installClosedKitchenContext(context, 'http://127.0.0.1:'+(process.env.PORT||4173), test.info());
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:'+(process.env.PORT||4173)+'/tools/afrokitchen/recipes/jollof-rice-ng/');
  await expect(page.locator('.ak-ing-art')).toHaveCount(14);await expect(page.locator('.ak-step:visible')).toHaveCount(6);await context.close();
});

test.describe('FINAL4 reviewed artwork and recipe boundaries', () => {
  test.beforeAll(() => {
    expect(process.env.CI).toBeTruthy();
    expect(process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT).toBe('1');
    expect(process.env.AFROTOOLS_TEST_SECURITY_HEADERS).toBe('1');
  });
  test.beforeEach(async ({ context }) => { await context.addInitScript(() => { window.__AK_TEST_INITIAL_CONSENT = localStorage.getItem('afrotools_cookie_consent'); }); });
  const artwork = [
    { slug:'mchemsho-tz', source:'https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf', primary:'/assets/img/kitchen/mchemsho-tz.webp', width:1200, height:800, hash:'b2ec5ce348680aa0fa54216ac60c0d44afcc5a40bec9550a5e35fdff44b9a26a', smallHash:'f1cf3b741d44c8e64ae26797bf5c75d0f725194470a760bebf53cef42d02aa9a' },
    { slug:'octopus-curry-sc', source:'https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles', primary:'/assets/img/kitchen/responsive/octopus-curry-sc-1280.webp', width:1280, height:853, hash:'e34b9e31285fe6467bf1ddc1d9e0b673cb657bf92b297615a45cc2d38246031e', smallHash:'9bb8004a5022e9c5c4b34a15e7c50506c2c2202a65357260c1fa8686aef16849' },
    { slug:'kisra-south-sudan-ss', source:'https://www.sudanese.kitchen/recipe/kisra', primary:'/assets/img/kitchen/responsive/kisra-south-sudan-ss-1280.webp', width:1280, height:853, hash:'2c30c6b981b17c7973f1fc2aa59a4d8f128d23f7be9d9b1602e1a107cbad0f15', smallHash:'51f74361031aad696816f17e098f0bd784c0f57b6d0017d62d3360918b02ab78', id:'c0aced74-68d6-437d-b00b-abd1895605f0', attributed:true },
    { slug:'maheu-zm', primary:'/assets/img/kitchen/responsive/maheu-zm-1280.webp', width:1280, height:853, hash:'e6c2738ac7bdb8852317906576815d24888cb685c0bf1433b64a5eb616991f8a', smallHash:'a78433b2ac2f6e15ae365a374b3997f4395165eda870f3221cab5ededb5aebfb', id:'626fd465-87e1-4f93-bca7-747decbf63d0', pending:true }
  ];
  async function rejectAnalyticsWhenShown(page) {
    const reject = page.getByRole('button', { name:'Reject analytics', exact:true });
    if (await reject.isVisible()) { await reject.click(); await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined'); }
    // The inherited legacy banner uses a labelled Dismiss button whose real
    // handler records declined. Exercise that control if it is the visible UI.
    const dismiss = page.locator('#afro-cookie-consent #afro-cc-close');
    if (await dismiss.isVisible()) { await dismiss.click(); await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined'); }
  }
  async function visitCurrent(page, slug) {
    const response = await page.goto('/tools/afrokitchen/recipes/' + slug + '/');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-security-policy']).toBe(policyFor(new URL(response.url()).pathname));
    expect(response.headers()['content-security-policy']).toBeTruthy();
    const proof = contextProofs.get(page.context());
    if (!proof.sawDocument) { expect(await page.evaluate(() => window.__AK_TEST_INITIAL_CONSENT)).toBeNull(); proof.sawDocument = true; }
    await rejectAnalyticsWhenShown(page);
    return response;
  }
  async function pendingBoundary(page, item) {
    const content = await kitchenMain(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect.poll(() => page.evaluate(() => ({
      id:window.__AK_STATIC_RECIPE.id, slug:window.__AK_STATIC_RECIPE.slug, ingredients: window.__AK_STATIC_RECIPE.ingredients.length, steps: window.__AK_STATIC_RECIPE.steps.length,
      servings: window.__AK_STATIC_RECIPE.default_servings, yield: window.__AK_STATIC_RECIPE.yield_status,
      method: window.__AK_STATIC_RECIPE.method_review_status,
      schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(node => {
        const value = JSON.parse(node.textContent); return [value, ...(value['@graph'] || [])].flatMap(item => [].concat(item['@type'] || []));
      }).filter(type => type === 'Recipe' || type === 'HowTo')
    }))).toEqual({ id:item.id, slug:item.slug, ingredients:0, steps:0, servings:null, yield:'not-recorded', method:'pending-source-method', schemas:[] });
    await expect(content.locator('.ak-step, .ak-ing-item, [data-ak-cook-mode], [data-ak-print-recipe], [data-ak-add-meal-plan], .ak-static-serving-bar')).toHaveCount(0);
  }
  async function keyboardSave(page) {
    const save = page.locator('[data-ak-save-recipe]');
    await expect(save).toBeVisible();
    for (let count=0; count<90 && !await save.evaluate(node => node === document.activeElement); count++) await page.keyboard.press('Tab');
    await expect(save).toBeFocused();
    const focus = await save.evaluate(node => { const style=getComputedStyle(node); return { visible:node.matches(':focus-visible'), outline:style.outlineStyle !== 'none' && parseFloat(style.outlineWidth)>0, shadow:style.boxShadow !== 'none' }; });
    expect(focus.visible).toBe(true); expect(focus.outline || focus.shadow).toBe(true);
    await page.keyboard.press('Enter');
    await expect(save).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('[data-ak-cookbook-status]')).toContainText('saved on this device');
  }
  test('FINAL4 literal image identities decode with captions at390 and1280', async ({ page }, testInfo) => {
    const decoded=[];
    for (const width of [390,1280]) {
      await page.setViewportSize({width,height:900});
      for (const item of artwork) {
        const small='/assets/img/kitchen/responsive/'+item.slug+'-640.webp';
        expect(digest(fs.readFileSync(path.join(staticRoot,item.primary)))).toBe(item.hash);
        expect(digest(fs.readFileSync(path.join(staticRoot,small)))).toBe(item.smallHash);
        const imageResponses=new Map(); page.on('response', response => { const pathname=new URL(response.url()).pathname; if (pathname===item.primary || pathname===small) imageResponses.set(pathname,response); });
        await visitCurrent(page,item.slug);
        const hero=item.pending ? (await kitchenMain(page)).locator('figure img').first() : page.locator('.ak-cookbook-cover-photo');
        await hero.scrollIntoViewIfNeeded(); await expect(hero).toBeVisible();
        await expect(hero).toHaveAttribute('src',item.primary); await expect(hero).toHaveAttribute('alt',/AI-generated.*illustration/);
        await expect.poll(() => hero.evaluate(node => node.complete && node.naturalWidth>0 && node.naturalHeight>0)).toBe(true);
        const actual=await hero.evaluate(node => ({path:new URL(node.currentSrc).pathname,width:node.naturalWidth,height:node.naturalHeight}));
        expect([item.primary,small]).toContain(actual.path);
        // naturalWidth is density-corrected for w-descriptor srcsets. Prove
        // encoded dimensions independently using the actual selected response.
        expect(actual.width).toBeGreaterThan(0); expect(actual.height).toBeGreaterThan(0);
        const emitted=imageResponses.get(actual.path); expect(emitted).toBeTruthy(); expect(emitted.status()).toBe(200);
        const encoded=await emitted.body(); expect(digest(encoded)).toBe(actual.path===small?item.smallHash:item.hash);
        const raw=await page.evaluate(async bytes => { const bitmap=await createImageBitmap(new Blob([Uint8Array.from(bytes)],{type:'image/webp'})); const dimensions={width:bitmap.width,height:bitmap.height}; bitmap.close(); return dimensions; },Array.from(encoded));
        expect(raw).toEqual({width:actual.path===small?640:item.width,height:actual.path===small?427:item.height});
        const caption=item.pending ? (await kitchenMain(page)).locator('figcaption').first() : page.locator('.ak-static-credit').first();
        await expect(caption).toBeVisible(); await expect(caption).toContainText('AI-generated'); await expect(caption).toContainText('not a');
        await expect(page.locator('nav').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
        if(item.pending) await pendingBoundary(page,item);
        else {
          expect(manifest.recipes.find(recipe => recipe.slug === item.slug).source).toBe(item.source);
          const reference = (await kitchenMain(page)).locator('[data-ak-method-source]');
          await expect(reference).toHaveCount(1); await expect(reference).toBeVisible();
          await expect(reference).toHaveAttribute('href', item.source);
          await expect(reference).toHaveAttribute('target', '_blank');
          await expect(reference).toHaveAttribute('rel', 'noopener noreferrer');
          await expect(reference).toHaveText('Source reference (opens in a new tab)');
        }
        decoded.push({slug:item.slug,viewport:width,densityCorrectedNatural:actual,encodedResponse:raw});
        await page.screenshot({path:testInfo.outputPath(item.slug+'-'+width+'.png'),fullPage:false});
      }
    }
    await testInfo.attach('actual-selected-image-decodes',{body:JSON.stringify(decoded,null,2),contentType:'application/json'});
  });
  test('FINAL4 pending keyboard saves survive reload and exact stale documents fail closed', async ({ page, context }, testInfo) => {
    const fixture=JSON.parse(fs.readFileSync('tests/fixtures/afrokitchen/final-four-legacy-source-html.json','utf8'));
    const proof=contextProofs.get(context);
    for (const item of artwork.filter(row => row.pending || row.attributed)) {
      await visitCurrent(page,item.slug); if(item.pending) await pendingBoundary(page,item); await keyboardSave(page);
      const saved=await page.evaluate(() => localStorage.getItem('ak_cookbook_v1')); expect(JSON.parse(saved)).toContain(item.slug);
      await page.reload(); await expect(page.locator('[data-ak-save-recipe]')).toHaveAttribute('aria-pressed','true'); if(item.pending) await pendingBoundary(page,item);
      // The genuine old payload has no UUID. Current code denies identity
      // before publication lookup. Both configured modes are UNREACHED; this
      // is not a test of503 status handling or invalid-JSON parsing.
      const mode=item.slug==='kisra-south-sudan-ss'?'503':'invalid';
      const cached=fixture.records.find(row => row.slug===item.slug); expect(cached.sourceCommit).toBe('853cfcd88d1c9ad36cffe31b34a8fe28c22c51be');
      expect(digest(Buffer.from(cached.html))).toBe(cached.htmlSha256); expect(Buffer.byteLength(cached.html)).toBe(cached.htmlBytes);
      proof.legacy=cached; proof.indexFailure=mode; const beforeIndex=proof.indexRequests;
      const runtime=page.waitForResponse(response => new URL(response.url()).pathname==='/tools/afrokitchen/static-recipe-runtime.js');
      const document=await page.goto(cached.route);
      expect(digest(await document.body())).toBe(cached.htmlSha256);
      expect(document.headers()['content-security-policy']).toBe(policyFor(cached.route));
      const currentRuntime=await runtime; expect(currentRuntime.status()).toBe(200);
      expect(digest(await currentRuntime.body())).toBe(digest(fs.readFileSync(path.join(staticRoot,'tools/afrokitchen/static-recipe-runtime.js'))));
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
      await expect.poll(() => page.evaluate(() => { const recipe=window.__AK_STATIC_RECIPE; return {
        idPresent:Object.prototype.hasOwnProperty.call(recipe,'id'),
        servingsPresent:Object.prototype.hasOwnProperty.call(recipe,'default_servings'),
        yieldPresent:Object.prototype.hasOwnProperty.call(recipe,'yield_status'),
        unavailable:recipe.publicationUnavailable,method:recipe.method_review_status,ingredients:recipe.ingredients,steps:recipe.steps
      }; })).toEqual({idPresent:false,servingsPresent:false,yieldPresent:false,unavailable:true,method:'pending-source-method',ingredients:[],steps:[]});
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
      await expect((await kitchenMain(page)).locator('.ak-step, .ak-ing-item, input, select, [data-ak-save-recipe], [data-ak-cook-mode], [data-ak-print-recipe], [data-ak-add-meal-plan], .ak-static-serving-bar')).toHaveCount(0);
      await expect((await kitchenMain(page))).toContainText('no verifiable recipe identity');
      await expect(page.getByRole('link',{name:'Open the current dish page'})).toBeVisible();
      await expect(page.getByRole('button',{name:'Retry recipe availability'})).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('ak_cookbook_v1'))).toBe(saved);
      expect(proof.synthetic.some(row => row.kind==='historical-document' && row.sha256===cached.htmlSha256)).toBe(true);
      expect(proof.indexRequests-beforeIndex).toBe(0);
      expect(proof.synthetic.some(row => row.kind==='index-unavailable')).toBe(false);
      proof.configuredIndexBoundaries.push({slug:item.slug,mode,actualRequests:0,state:'CONFIGURED_BUT_UNREACHED_IDENTITY_DENIED'});
      await page.screenshot({path:testInfo.outputPath(item.slug+'-cached-identity-denied.png')});
      proof.legacy=null; proof.indexFailure=null;
    }
  });
  test('FINAL4 Kisra attributed batch cooks, saves and exports without inventing portions', async ({ page }) => {
    await visitCurrent(page,'kisra-south-sudan-ss');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','index, follow');
    const main=await kitchenMain(page); await expect(main).toContainText('250 g sorghum flour'); await expect(main).toContainText('Overnight'); await expect(main).toContainText('Contains milk');
    await expect(page.locator('#ak-static-ingredients .ak-ing-item')).toHaveCount(4); await expect(page.locator('#ak-static-servings')).toHaveText('Not recorded'); await expect(page.getByRole('button',{name:'Increase servings',exact:true})).toHaveCount(0);
    const save=page.locator('[data-ak-save-recipe]'); await save.click(); await expect(save).toHaveAttribute('aria-pressed','true'); await page.reload(); await expect(save).toHaveAttribute('aria-pressed','true');
    await page.locator('[data-ak-cook-mode]').click(); await expect(page.locator('dialog.ak-cook-dialog')).toBeVisible(); await expect(page.locator('dialog.ak-cook-dialog')).toContainText('Mix the batter'); await page.keyboard.press('Escape'); await expect(page.locator('dialog.ak-cook-dialog')).not.toBeVisible();
    await page.getByText('Copy, print & more',{exact:true}).click(); const waiting=page.waitForEvent('download'); await page.locator('[data-ak-download-recipe]').click(); const download=await waiting; const file=await download.path(); const text=fs.readFileSync(file,'utf8');
    expect(text).toContain('Batch: 250 g sorghum flour'); expect(text).toContain('Ferment: Overnight'); expect(text).toContain('Cook: 1–2 min per sheet'); expect(text).toContain('Contains milk'); expect(text).toContain('https://www.sudanese.kitchen/recipe/kisra'); expect(text).not.toContain('Yield: Not recorded');
  });
  test('FINAL4 unknown yield preserves source quantities and stale planner choices; Octopus scales', async ({ page, context }) => {
    const proof=contextProofs.get(context);
    await visitCurrent(page,'mchemsho-tz');
    await expect(page.locator('#ak-static-servings')).toHaveText('Not recorded');
    await expect(page.locator('#ak-static-ingredients .ak-ing-item')).toHaveCount(8);
    await expect(page.locator('#ak-static-ingredients')).toContainText('1 kg'); await expect(page.locator('#ak-static-ingredients')).toContainText('8 cups');
    await expect(page.getByRole('button',{name:'Increase servings',exact:true})).toHaveCount(0);
    await page.getByText('Copy, print & more',{exact:true}).click();
    await expect(page.locator('[data-ak-add-meal-plan]')).toBeVisible();
    await expect(page.locator('[data-ak-add-meal-plan]')).toBeDisabled();
    await expect(page.locator('[data-ak-add-meal-plan]:enabled')).toHaveCount(0);
    await expect(page.locator('#cost-panel, #cost-per-serving')).toHaveCount(0);
    expect(await (await kitchenMain(page)).innerText()).not.toMatch(/(?:cost|price)[^\n]*per serving|per serving[^\n]*(?:cost|price)/i);
    await expect(page.locator('.ak-nutrition-card')).toHaveCount(0);
    expect(await page.evaluate(() => ['calories','protein_g','carbs_g','fat_g','fiber_g'].map(key=>window.__AK_STATIC_RECIPE[key]))).toEqual([null,null,null,null,null]);
    const quantities=await page.locator('#ak-static-ingredients .ak-ing-amount').allTextContents();
    const check=page.locator('#ak-static-ingredients input').first(); await check.check();
    await page.locator('[data-ak-cook-mode]').click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
    await expect(check).toBeChecked(); expect(await page.locator('#ak-static-ingredients .ak-ing-amount').allTextContents()).toEqual(quantities);
    const plan={version:1,slugs:['mchemsho-tz'],inputs:{days:3,maxTime:75,servings:4,diet:'',country:'TZ',occasion:''},lockedSlugs:['mchemsho-tz'],checked:{'retained-synthetic-check':true},savedAt:'2026-10-18T00:00:00.000Z'};
    const rawPlan=JSON.stringify(plan), rawPicks=JSON.stringify([{slug:'mchemsho-tz'}]);
    // Explicit synthetic stale local plan; no provider records or consent seed.
    await page.evaluate(({rawPlan,rawPicks}) => {localStorage.setItem('ak_saved_plan_v1',rawPlan);localStorage.setItem('ak_meal_plan_v1',rawPicks);},{rawPlan,rawPicks});
    await page.goto('/tools/afrokitchen/#cook-this-week'); await rejectAnalyticsWhenShown(page);
    await expect(page.locator('#ak-plan-status')).toContainText('no recorded person-yield');
    await page.locator('#ak-plan-days').selectOption('7'); await page.locator('#ak-plan-time').selectOption('30'); await page.locator('#ak-plan-servings').fill('6');
    await page.locator('#ak-plan-country').selectOption('TZ');
    const fields=['#ak-plan-days','#ak-plan-time','#ak-plan-servings','#ak-plan-country'];
    const typed=await Promise.all(fields.map(selector=>page.locator(selector).inputValue()));
    await page.getByRole('button',{name:'Open saved plan',exact:true}).click();
    await expect(page.locator('#ak-plan-status')).toContainText('Your saved plan remains saved');
    expect(await Promise.all(fields.map(selector=>page.locator(selector).inputValue()))).toEqual(typed);
    expect(await page.evaluate(() => localStorage.getItem('ak_saved_plan_v1'))).toBe(rawPlan);
    expect(await page.evaluate(() => localStorage.getItem('ak_meal_plan_v1'))).toBe(rawPicks);
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('ak_saved_plan_v1'))).lockedSlugs).toEqual(['mchemsho-tz']);
    await expect(page.locator('.ak-plan-day')).toHaveCount(0);
    await visitCurrent(page,'octopus-curry-sc'); await expect(page.locator('#ak-static-servings')).toHaveText('4');
    const octopusCheck=page.locator('#ak-static-ingredients input').first(); await octopusCheck.check();
    await expect(page.locator('#ak-static-ingredients')).toContainText('1 large');
    await page.getByRole('button',{name:'Increase servings',exact:true}).click(); await expect(page.locator('#ak-static-servings')).toHaveText('5');
    await expect(page.locator('#ak-static-ingredients')).toContainText('1\u00bc large'); await expect(octopusCheck).toBeChecked();
    expect(proof.blocked.filter(row=>/\/(?:api|\.netlify\/functions)\/[^?]*(?:cost|price)|\/rest\/v1\/ingredient/i.test(row.url))).toEqual([]);
  });
});

// Pure inventory contract shared with maintained source regressions; no browser launch.
module.exports = { assertPublishedRecipeInventory };
