'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const analyticsOwner = require('../scripts/inject-analytics-loader');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const scopedIds = ['savings-goal', 'car-loan', 'bank-charges'];
const manifest = JSON.parse(read('data/localization/sw-finance-remainder-native-owners.json'));
const owners = manifest.rows.filter((row) => scopedIds.includes(row.englishId));

test('scope manifest names exactly one native owner for each bounded family row', () => {
  assert.deepEqual(owners.map((row) => row.englishId).sort(), [...scopedIds].sort());
  for (const owner of owners) {
    assert.equal(owner.sharedAiRoutingOwner, 'coordinator');
    assert.deepEqual(owner.advertisedNativeFormats, ['clipboard-text', 'csv', 'json', 'pdf']);
    assert.equal(fs.existsSync(path.join(root, owner.sourceOwner)), true);
    assert.equal(fs.existsSync(path.join(root, owner.engineOwner)), true);
    assert.equal(fs.existsSync(path.join(root, owner.controllerOwner)), true);
  }
});

test('each locale owner loads the exact shared engine and controller', () => {
  for (const owner of owners) {
    const engineName = path.basename(owner.engineOwner);
    const controllerName = path.basename(owner.controllerOwner);
    const controllerHash = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(root, owner.controllerOwner)))
      .digest('hex')
      .slice(0, 8);
    for (const file of Object.values(owner.localeOwners)) {
      const html = read(file);
      assert.match(html, new RegExp(`/assets/js/engines/${escapeRegex(engineName)}\\?v=`), file);
      assert.match(
        html,
        new RegExp(`/assets/js/pages/${escapeRegex(controllerName)}\\?v=${controllerHash}`),
        file
      );
    }
  }
});

test('Swahili pages preserve English input contracts and localize product states', () => {
  for (const owner of owners) {
    const english = read(owner.localeOwners.en);
    const swahili = read(owner.localeOwners.sw);
    const inputContract = (html) => [...html.matchAll(/<input\b[^>]*\bid="([^"]+)"[^>]*>/gi)]
      .map((match) => {
        const tag = match[0];
        const attribute = (name) => {
          const found = tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
          return found ? found[1] : null;
        };
        return {
          id: match[1],
          type: attribute('type') || 'text',
          min: attribute('min'),
          max: attribute('max'),
          step: attribute('step'),
          maxlength: attribute('maxlength'),
          required: /\brequired\b/i.test(tag)
        };
      });
    assert.deepEqual(inputContract(swahili), inputContract(english), owner.englishId);
    assert.match(swahili, /\bdata-locale="sw"/);
    assert.match(swahili, />Nakili</);
    assert.match(swahili, />Futa</);
    assert.doesNotMatch(
      swahili,
      /intent-router|swahili-route-map|swahili-finance-remainder-parity|<iframe/i
    );
    assert.doesNotMatch(swahili, /Ãƒ|Ã‚|Ã¢(?:â‚¬|â‚¬â„¢|â‚¬Â¦)|ï¿½/);
    assert.equal((swahili.match(/sw-accessibility\.js/g) || []).length, 1);
    assert.equal(analyticsOwner.loaderMatches(swahili).length, 1);
    assert.equal(
      analyticsOwner.loaderSource(analyticsOwner.loaderMatches(swahili)[0][0]),
      analyticsOwner.loaderSource(analyticsOwner.canonicalLoaderTag())
    );
  }
});

test('analytics owner is idempotent for each bounded Swahili route', () => {
  const tag = analyticsOwner.canonicalLoaderTag();
  for (const owner of owners) {
    const html = read(owner.localeOwners.sw);
    const first = analyticsOwner.normalizeLoaderInHtml(html, tag);
    const second = analyticsOwner.normalizeLoaderInHtml(first.html, tag);
    assert.equal(first.html, html, `${owner.englishId}: canonical input changes on first pass`);
    assert.equal(second.html, first.html, `${owner.englishId}: second owner pass is not idempotent`);
    assert.equal(analyticsOwner.loaderMatches(second.html).length, 1);
  }
});

test('controllers clear stale DOM and guard every advertised portable action', () => {
  for (const owner of owners) {
    const js = read(owner.controllerOwner);
    assert.doesNotMatch(
      js,
      /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|insertAdjacentHTML/
    );
    assert.match(js, /function clearResultDom\(\)/);
    assert.match(js, /function usableCurrent\(\)/);
    assert.match(js, /currentSignature !== signature\(\)/);
    assert.match(js, /form\.addEventListener\('input', markStale\)/);
    assert.match(js, /form\.addEventListener\('change', markStale\)/);
    assert.match(js, /form\.addEventListener\('invalid'/);
    assert.equal((js.match(/if \(!usableCurrent\(\)\) return;/g) || []).length, 4);
    assert.match(js, /navigator\.clipboard\.writeText/);
    assert.match(js, /new Blob/);
    assert.match(js, /JSON\.stringify/);
    assert.match(js, /window\.AfroTools\.pdf\.generate/);
    assert.doesNotMatch(js, /window\.print|navigator\.share/);
  }
});

test('reciprocal canonical and hreflang metadata is exact on EN, FR and SW owners', () => {
  for (const owner of owners) {
    for (const [locale, file] of Object.entries(owner.localeOwners)) {
      const html = read(file);
      assert.match(
        html,
        new RegExp(`<link\\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']https://afrotools\\.com${escapeRegex(owner.reciprocalRoutes[locale])}["']`, 'i')
      );
      for (const [hreflang, route] of Object.entries(owner.reciprocalRoutes)) {
        assert.match(
          html,
          new RegExp(`<link\\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=["']${escapeRegex(hreflang)}["'])[^>]*href=["']https://afrotools\\.com${escapeRegex(route)}["']`, 'i'),
          `${owner.englishId} ${locale} ${hreflang}`
        );
      }
    }
  }
});

test('each route has one source-owned Swahili discovery row and present artwork', () => {
  const registry = read('assets/js/components/tool-registry.js');
  for (const owner of owners) {
    const row = registry.split(/\r?\n/).find((line) =>
      line.includes(`id: "${owner.discoveryOwner.id}"`) ||
      line.includes(`id: '${owner.discoveryOwner.id}'`)
    );
    assert(row, owner.englishId);
    assert.equal(
      [...registry.matchAll(new RegExp(`id:\\s*['"]${escapeRegex(owner.discoveryOwner.id)}['"]`, 'g'))].length,
      1
    );
    assert.match(row, new RegExp(`href:\\s*['"]${escapeRegex(owner.reciprocalRoutes.sw)}['"]`));
    assert.match(row, /category:\s*["']financial["']/);
    assert.match(row, new RegExp(`sourceId:\\s*['"]${escapeRegex(owner.discoveryOwner.sourceId)}['"]`));
    const sw = read(owner.localeOwners.sw);
    const artwork = sw.match(/property="og:image"\s+content="https:\/\/afrotools\.com\/([^"]+)"/);
    assert(artwork, owner.englishId);
    assert.equal(fs.existsSync(path.join(root, artwork[1])), true, artwork[1]);
  }
});

test('every bank-charge consumer uses current controller and contrast-safe stylesheet owners', () => {
  const expected = [
    'fr/tools/frais-bancaires/index.html',
    'ha/kayan-aiki/cajin-banki/index.html',
    'sw/zana/ada-za-benki/index.html',
    'tools/bank-charges/index.html'
  ];
  const consumers = execFileSync(
    'git',
    ['grep', '-l', '/assets/js/pages/bank-charge-offer-vip.js?v=', '--', '*.html'],
    { cwd: root, encoding: 'utf8' }
  )
    .trim()
    .split(/\r?\n/)
    .map((file) => file.replace(/\\/g, '/'))
    .sort();
  assert.deepEqual(consumers, expected);
  for (const file of consumers) {
    assert.match(read(file), /\/assets\/js\/pages\/bank-charge-offer-vip\.js\?v=5b979c57/);
  }
  const stylesheet = read('assets/css/bank-charge-offer-vip.css');
  const stylesheetHash = crypto.createHash('md5').update(stylesheet).digest('hex').slice(0, 8);
  assert.equal(stylesheetHash, '3e493436');
  assert.match(stylesheet, /\.bco-hero h1\{[^}]*color:var\(--bco-text,#172033\)/);
  assert.match(stylesheet, /\.bco-hero \.bco-lead\{[^}]*color:var\(--bco-muted,#526176\)/);
  assert.match(stylesheet, /\.bco-hero \.bco-badge\{[^}]*color:var\(--bco-text,#172033\)/);
  assert.match(stylesheet, /\.bco-hero \.bco-langs\{[^}]*color:var\(--bco-muted,#526176\)/);
  const styleConsumers = execFileSync(
    'git',
    ['grep', '-l', '/assets/css/bank-charge-offer-vip.css?v=', '--', '*.html'],
    { cwd: root, encoding: 'utf8' }
  )
    .trim()
    .split(/\r?\n/)
    .map((file) => file.replace(/\\/g, '/'))
    .sort();
  assert.deepEqual(styleConsumers, expected);
  for (const file of styleConsumers) {
    assert.match(
      read(file),
      new RegExp(`/assets/css/bank-charge-offer-vip\\.css\\?v=${stylesheetHash}`)
    );
  }
  for (const owner of [
    {
      file: 'assets/css/savings-goal-vip.css',
      expectedHash: '0f15613b',
      ownedRule: /\.sgv-hero \.sgv-langs\{color:#d3e4d8\}/,
      consumers: [
        'fr/tools/objectif-epargne/index.html',
        'sw/zana/lengo-la-akiba/index.html',
        'tools/savings-goal/index.html'
      ]
    },
    {
      file: 'assets/css/car-loan-vip.css',
      expectedHash: '70a6c131',
      ownedRule: /\.cl-hero \.cl-langs\{color:#d3e4d8\}/,
      consumers: [
        'fr/tools/pret-automobile/index.html',
        'sw/zana/mkopo-wa-gari/index.html',
        'tools/car-loan/index.html'
      ]
    }
  ]) {
    const source = read(owner.file);
    const hash = crypto.createHash('md5').update(source).digest('hex').slice(0, 8);
    assert.equal(hash, owner.expectedHash);
    assert.match(source, owner.ownedRule);
    const basename = path.basename(owner.file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const localeConsumers = execFileSync(
      'git',
      ['grep', '-l', `/assets/css/${path.basename(owner.file)}?v=`, '--', '*.html'],
      { cwd: root, encoding: 'utf8' }
    )
      .trim()
      .split(/\r?\n/)
      .map((file) => file.replace(/\\/g, '/'))
      .sort();
    assert.deepEqual(localeConsumers, owner.consumers);
    for (const file of localeConsumers) {
      assert.match(read(file), new RegExp(`/assets/css/${basename}\\?v=${hash}`));
    }
  }
});

test('family receipt contains only the three actually accepted rows', () => {
  const receipt = JSON.parse(read('reports/swahili-finance-savings-credit-fees-receipt.json'));
  const browser = read('tests/e2e/swahili-finance-savings-credit-fees.spec.js');
  assert.deepEqual(receipt.totals, { scoped: 3, accepted: 3, blocked: 0 });
  assert.deepEqual(receipt.partitions.financial, { scoped: 3, accepted: 3, blocked: 0 });
  assert.deepEqual(receipt.acceptedRows.map((row) => row.englishId).sort(), [...scopedIds].sort());
  assert.equal(Object.hasOwn(receipt, 'blockedEnglishIds'), false);
  for (const row of receipt.acceptedRows) {
    assert.equal(row.proof.visibleInputBoundaryContrast31, true, row.englishId);
    assert.equal(row.proof.focusIndicatorContrast31, true, row.englishId);
  }
  assert.match(browser, /function assertControlAndFocusContrast\(/);
  assert.match(browser, /boundary\.ratio[\s\S]*toBeGreaterThanOrEqual\(3\)/);
  assert.match(browser, /focus\.width[\s\S]*toBeGreaterThanOrEqual\(2\)/);
  assert.match(browser, /focus\.ratio[\s\S]*toBeGreaterThanOrEqual\(3\)/);
  assert.equal((browser.match(/await assertControlAndFocusContrast\(page,/g) || []).length, 5);
});
