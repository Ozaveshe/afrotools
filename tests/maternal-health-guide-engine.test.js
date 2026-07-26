const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require('../tools/maternal-mortality/maternal-health-guide-engine.js');

test('maternal guide validates week without inventing a score', () => {
  assert.deepEqual(engine.normalizeWeek(0), {
    ok: false,
    error: 'Enter a whole pregnancy week from 1 to 42.'
  });
  assert.deepEqual(engine.normalizeWeek(20.5), {
    ok: false,
    error: 'Enter a whole pregnancy week from 1 to 42.'
  });

  const guide = engine.buildGuide({ country: 'NG', week: 20, factorIds: [] });
  assert.equal(guide.ok, true);
  assert.equal(guide.countryName, 'Nigeria');
  assert.equal(guide.conversationTiming, 'next-contact');
  assert.equal(guide.selectedFactors.length, 0);
  assert.equal(Object.hasOwn(guide, 'score'), false);
  assert.equal(Object.hasOwn(guide, 'riskLevel'), false);
  assert.match(guide.limit, /does not calculate maternal mortality/i);
  assert.doesNotMatch(JSON.stringify(guide), /\b(low|medium|high|very high) risk\b/i);
});

test('known clinical topics prompt contact without becoming a diagnosis or mortality prediction', () => {
  const guide = engine.buildGuide({
    country: 'GH',
    week: 34,
    factorIds: ['hypertension', 'hypertension', 'unknown-factor', 'distance-to-care']
  });

  assert.equal(guide.ok, true);
  assert.equal(guide.countryName, 'Ghana');
  assert.equal(guide.conversationTiming, 'prompt-contact');
  assert.match(guide.headline, /contact your maternity team promptly/i);
  assert.deepEqual(
    guide.selectedFactors.map((factor) => factor.id),
    ['hypertension', 'distance-to-care']
  );
  assert.match(guide.selectedFactors[0].prompt, /confirm monitoring/i);
  assert.doesNotMatch(engine.toText(guide), /chance|probability|score:|low risk|high risk/i);
});

test('ANC output is a bounded reference and late pregnancy does not imply completed care', () => {
  const guide = engine.buildGuide({ country: 'OTHER', week: 42, factorIds: [] });

  assert.equal(guide.ok, true);
  assert.equal(guide.countryName, 'your country');
  assert.equal(guide.nextContacts.length, 1);
  assert.match(guide.nextContacts[0].label, /late-pregnancy review/i);
  assert.match(guide.scheduleLimit, /national programme.*may use different timing/i);
  assert.doesNotMatch(JSON.stringify(guide), /completed|past|done/i);
});

test('page contract is local, source-dated, accessible and free of the retired score', () => {
  const html = fs.readFileSync(
    path.join(ROOT, 'tools', 'maternal-mortality', 'index.html'),
    'utf8'
  );
  const ui = fs.readFileSync(
    path.join(ROOT, 'tools', 'maternal-mortality', 'maternal-health-guide-vip.js'),
    'utf8'
  );

  assert.equal((html.match(/<main(?:\s|>)/g) || []).length, 1);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(html, /Seek immediate local emergency maternity care/);
  assert.match(html, /Sources reviewed 26 July 2026/);
  assert.match(html, /9789241549356/);
  assert.match(html, /9789241549912/);
  assert.match(html, /9789240108462/);
  assert.match(html, /Inputs stay in this browser/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|health-workflow\.js/i);
  assert.doesNotMatch(html, /Assess My Risk|Risk Level|Score:|LOW \(Score|VERY HIGH/i);
  assert.doesNotMatch(ui, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|capture-lead/i);
  assert.match(ui, /new Blob/);
  assert.match(ui, /window\.print/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /<fieldset>[\s\S]*?<legend>Topics to discuss<\/legend>/);
});

test('AI context blocks diagnosis, personal mortality prediction and health-data transmission', () => {
  const context = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data', 'ai', 'tool-context', 'maternal-mortality.json'),
    'utf8'
  ));

  assert.equal(context.schemaVersion, 1);
  assert.equal(context.toolKey, 'maternal-mortality');
  assert.equal(context.status, 'unverified-static');
  assert.match(context.staticText, /Never estimate maternal mortality probability/);
  assert.match(context.staticText, /immediate local emergency maternity care/);
  assert.match(context.staticText, /Inputs and exports stay local/);
  assert.match(context.staticText, /do not send health details.*AI/);
});
