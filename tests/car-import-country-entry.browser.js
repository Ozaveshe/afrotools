// Tests the real controller against a local static server implementing the exact
// country aliases only. This is not an emulation of all Netlify routing features.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const sourceRoot = path.resolve(__dirname, '..');
const root = process.argv.includes('--dist') ? path.join(sourceRoot, 'dist') : sourceRoot;
const countryData = require('../data/cars/price-intelligence.json');
const base = '/tools/car-import-cost/';
const rules = fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/)
  .map(line => line.trim().split(/\s+/)).filter(row => row[0].startsWith(base) && row[1]?.startsWith(base + '#requested-country='));
assert.ok(rules.every(row => !/[*:]/.test(row[0]) && row[2] === '301'));
const normalize = value => value.replace(/\/$/, '');
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.webp':'image/webp', '.woff2':'font/woff2'};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const candidates = [rel, `${rel}.html`, path.join(rel, 'index.html')].map(file => path.resolve(root, file));
  const file = candidates.find(file => file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile());
  // Non-forced aliases yield to real files; slash normalization and query
  // pass-through follow https://docs.netlify.com/manage/routing/redirects/redirect-options/.
  const rule = rules.find(row => normalize(row[0]) === normalize(url.pathname));
  if (!file && rule) {
    const destination = new URL(rule[1], url);
    destination.search = url.search;
    res.writeHead(301, {Location: destination.pathname + destination.search + destination.hash}); return res.end();
  }
  if (!file) {res.writeHead(404); return res.end('Not found');}
  res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = process.env.NETLIFY_TEST_ORIGIN || `http://127.0.0.1:${server.address().port}`;
  assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin), 'browser proof must stay local');
  const browser = await chromium.launch();
  const results = [];
  try {
    const countryList = Object.values(countryData.countries).filter(country => country.directory_enabled !== false);
    for (const country of countryList) {
      const real = fs.existsSync(path.join(root, base, country.slug, 'index.html'));
      for (const slash of ['', '/']) {
        const query = `?country=${country.code}&source=japan&make=Toyota&model=Hilux&year=2020&price=28500&engineCc=2600`;
        const response = await fetch(`${origin}${base}${country.slug}${slash}${query}`, {redirect:'manual'});
        await response.arrayBuffer();
        assert.equal(response.status, real ? 200 : 301, country.slug);
        if (!real) assert.equal(response.headers.get('location'), base + query + '#requested-country=' + country.code);
      }
    }
    for (const route of [`${base}not-a-country/`, `${base}mozambique/deeper/`]) {
      assert.equal((await fetch(origin + route, {redirect:'manual'})).status, 404);
    }
    assert.equal((await fetch(origin + base, {redirect:'manual'})).status, 200);

    // All 14 unsupported markets must block the actual engine's NG fallback.
    const cases = countryList.filter(country => !fs.existsSync(path.join(root, base, country.slug, 'index.html')))
      .flatMap(country => [
        {country:country.code, route:base + country.slug + '/', blocked:true},
        {country:null, route:base + country.slug + '/', blocked:true, noQuery:true},
        {country:null, route:base + country.slug + '/', blocked:true},
        {country:'KE', route:base + country.slug + '/', blocked:true},
        {country:'ZZ', route:base + country.slug + '/', blocked:true}
      ]);
    cases.push({country:'ZZ', route:base, blocked:true}, {country:'', route:base, blocked:true},
      {country:'not-a-country', route:base, blocked:true}, {country:'KE', route:base, blocked:false},
      {country:null, route:base, blocked:false}, {country:null, route:base + 'ghana/', blocked:false},
      {country:'KE', route:base, blocked:true, fragment:'#requested-country=%3Cscript%3E'},
      {country:'KE', route:base, blocked:true, fragment:'#requested-country=KE'},
      {country:'MZ', route:'/fr/tools/cout-importation-voiture/', privacyAdapter:true, locale:'fr'},
      {country:'MZ', route:'/sw/zana/gharama-kuagiza-gari/', privacyAdapter:true, locale:'sw'});
    async function checkCase(item) {
      console.error(`Checking ${item.route} country=${item.country}`);
      const context = await browser.newContext({viewport:{width:390,height:844}, reducedMotion:'reduce', serviceWorkers:'block'});
      const page = await context.newPage();
      const errors = [];
      const navigationWarnings = [];
      let checkingHistory = false;
      page.on('pageerror', error => {
        // The unchanged global CSS enables cross-document View Transitions.
        // Chromium reports skipped transitions on Back/reload; retain that
        // browser warning separately, never suppress controller exceptions.
        if (checkingHistory && error.message === 'Transition was skipped') navigationWarnings.push(error.message);
        else errors.push(error.message);
      });
      await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
      const params = new URLSearchParams(item.noQuery ? {} : {source:'japan',make:'Toyota',model:'Hilux',year:'2020',price:'28500',engineCc:'2600'});
      if (item.country !== null) params.set('country', item.country);
      await page.goto(origin + item.route + (params.size ? '?' + params : '') + (item.fragment || ''));
      await page.waitForFunction(() => document.querySelector('#carImportCountry')?.options.length > 0);
      const selector = page.locator('#carImportCountry');
      if (item.privacyAdapter) {
        // This existing localized adapter deliberately discards all incoming
        // query/hash state and requires a fresh, local form submission.
        assert.equal(new URL(page.url()).search, '');
        assert.equal(new URL(page.url()).hash, '');
        assert.equal(await selector.inputValue(), item.locale === 'sw' ? 'KE' : '');
        if (item.locale === 'sw') {
          assert.equal(await page.locator('#carImportResults').isVisible(), false);
        } else {
          // The French adapter requires an explicit country before displaying
          // an estimate, while retaining its local-only privacy boundary.
          assert.equal(await page.locator('#carImportResults').isVisible(), false);
          assert.equal(await page.locator('#carImportPdf').isDisabled(), true);
        }
        assert.equal(await page.evaluate(() => localStorage.getItem('carImportCostLastInput')), null);
        await page.locator('#carImportMake').fill('Toyota');
        await page.locator('#carImportModel').fill('Hilux');
        await selector.selectOption('KE');
        await page.locator('#carImportForm button[type=submit]').click();
        await page.waitForFunction(() => document.querySelector('#carImportSummaryLine')?.textContent.includes('Kenya'));
        assert.ok(await page.locator('#carImportResults').isVisible());
        assert.equal(await page.locator('#carImportMake').inputValue(), 'Toyota');
        assert.equal(await page.locator('#carImportModel').inputValue(), 'Hilux');
        assert.equal(new URL(page.url()).search, '');
        assert.equal(await page.evaluate(() => localStorage.getItem('carImportCostLastInput')), null);
      } else if (item.blocked) {
        assert.equal(await selector.inputValue(), '');
        assert.equal(await page.locator('#carImportResults').isVisible(), false);
        assert.ok(await page.locator('#carImportCountryAvailability').isVisible());
        assert.equal(await page.locator('#carImportCountryAvailability').getAttribute('role'), 'status');
        assert.equal(await selector.getAttribute('aria-invalid'), 'true');
        if (item.locale) {
          const notice = await page.locator('#carImportCountryAvailability').innerText();
          assert.ok(notice.includes(item.locale === 'fr' ? 'n’est pas pris en charge' : 'haitumiki katika kikokotoo hiki'));
          assert.ok(!notice.includes('not supported'));
        }
        assert.equal(new URL(page.url()).search, params.size ? '?' + params.toString() : '', 'blocked entry retains every query parameter');
        assert.equal(await page.evaluate(() => localStorage.getItem('carImportCostLastInput')), null);
        // No initial or attempted submit is allowed to calculate another country.
        await page.locator('#carImportForm button[type=submit]').click();
        assert.equal(await page.locator('#carImportResults').isVisible(), false);
        await selector.selectOption('KE');
        assert.equal(new URL(page.url()).hash.includes('requested-country'), false);
        await page.locator('#carImportForm button[type=submit]').click();
        await page.waitForFunction(() => document.querySelector('#carImportSummaryLine')?.textContent.includes('Kenya'));
        if (!item.noQuery) {
          assert.equal(new URL(page.url()).searchParams.get('engineCc'), '2600');
          assert.equal(await page.locator('#carImportMake').inputValue(), 'Toyota');
          assert.equal(await page.locator('#carImportModel').inputValue(), 'Hilux');
        }
        if (item.country === 'MZ' && !item.locale) {
          checkingHistory = true;
          await page.reload();
          await page.waitForFunction(() => document.querySelector('#carImportSummaryLine')?.textContent.includes('Kenya'));
          assert.equal(await page.locator('#carImportCountryAvailability').count(), 0);
          await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
          await page.goto(origin + '/tools/car-import-cost/ghana/');
          await page.waitForFunction(() => document.querySelector('#carImportCountry')?.options.length > 0);
          await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
          await page.goBack();
          await page.waitForFunction(() => document.querySelector('#carImportSummaryLine')?.textContent.includes('Kenya'));
          await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
        }
      } else {
        assert.equal(await selector.inputValue(), item.route.includes('/ghana/') ? 'GH' : item.country || 'NG');
        assert.equal(await page.locator('#carImportCountryAvailability').count(), 0);
        assert.ok(await page.locator('#carImportResults').isVisible());
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      results.push({...item, width:390, pass:true, navigationWarnings});
      await context.close();
    }
    const selectedCases = process.argv.includes('--reload-only') ? cases.filter(item => item.country === 'MZ') : cases;
    for (let offset = 0; offset < selectedCases.length; offset += 4) {
      await Promise.all(selectedCases.slice(offset, offset + 4).map(checkCase));
    }
    console.log(JSON.stringify({surface:process.argv.includes('--dist') ? 'dist' : 'source', routing:process.env.NETLIFY_TEST_ORIGIN ? 'installed Netlify CLI local fixture' : 'exact-alias test server', httpCountries:20, browserCases:results.length, results}, null, 2));
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
