const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP_IDS = [
  'creator-analytics', 'creator-bios', 'creator-brand', 'creator-calendar',
  'creator-canvas', 'creator-captions', 'creator-carousel', 'creator-clip',
  'creator-club', 'creator-course', 'creator-desk', 'creator-hashtags',
  'creator-hooks', 'creator-invoice', 'creator-kit', 'creator-mail',
  'creator-mind', 'creator-money', 'creator-page', 'creator-polish',
  'creator-pricing', 'creator-record', 'creator-repurpose', 'creator-research',
  'creator-resize', 'creator-schedule', 'creator-scripts', 'creator-split',
  'creator-stock', 'creator-team', 'creator-thumb', 'creator-titles',
  'creator-voice'
];
const NATIVE_APP_IDS = new Set([
  'creator-analytics', 'creator-calendar', 'creator-carousel', 'creator-club',
  'creator-course', 'creator-desk', 'creator-hooks', 'creator-invoice',
  'creator-kit', 'creator-mail', 'creator-mind', 'creator-page',
  'creator-polish', 'creator-repurpose', 'creator-research', 'creator-resize',
  'creator-schedule', 'creator-scripts', 'creator-split', 'creator-stock',
  'creator-team', 'creator-thumb', 'creator-titles'
]);

function html(id) {
  let source = fs.readFileSync(path.join(ROOT, 'tools', id, 'app.html'), 'utf8');
  for (const name of [`${id}-app-controller.js`, `${id}-controller.js`]) {
    const controller = path.join(ROOT, 'assets/js/pages/creative', name);
    if (fs.existsSync(controller)) source += `\n${fs.readFileSync(controller, 'utf8')}`;
  }
  return source;
}

test('expanded Creative inventory is exactly 33 canonical app experiences', () => {
  const actual = fs.readdirSync(path.join(ROOT, 'tools'))
    .filter((id) => id.startsWith('creator-') && fs.existsSync(path.join(ROOT, 'tools', id, 'app.html')))
    .sort();

  assert.deepEqual(actual, APP_IDS);
});

for (const id of APP_IDS) {
  test(`${id} preserves app-route search and safety boundaries`, () => {
    const source = html(id);
    assert.match(source, new RegExp(`<title>[^<]+</title>`, 'i'));
    assert.match(source, new RegExp(`<link rel="canonical" href="https://afrotools\\.com/tools/${id}/app">`, 'i'));
    assert.match(source, /<meta name="robots" content="noindex,\s*follow">/i);
    if (NATIVE_APP_IDS.has(id)) {
      assert.match(source, /\/engines\/|data-[a-z0-9-]+-native/i);
      assert.doesNotMatch(source, /supabase-auth|creator-profile/i);
      assert.doesNotMatch(source, /<form\b[^>]*\baction=["'][^"']+["']/i);
    } else {
      assert.match(source, /day9-creative-expanded-safety\.js/);
    }
    assert.match(source, /<(?:a|button|input|textarea|select|canvas|video)\b/i);
  });
}

test('file-capable apps have route-specific local validation limits', () => {
  const helper = fs.readFileSync(
    path.join(ROOT, 'assets/js/pages/day9-creative-expanded-safety.js'),
    'utf8'
  );
  for (const id of [
    'creator-carousel', 'creator-clip', 'creator-kit', 'creator-mail',
    'creator-record', 'creator-resize', 'creator-stock', 'creator-thumb',
    'creator-voice'
  ]) {
    assert.match(helper, new RegExp(`'${id}'\\s*:`));
  }
  assert.match(helper, /stopImmediatePropagation\(\)/);
  assert.match(helper, /input\.value = ''/);
  assert.doesNotMatch(helper, /\bfetch\s*\(/);
  assert.doesNotMatch(helper, /\blocalStorage\b/);
});

test('visual editors construct exports at the selected output dimensions', () => {
  const finalEngine = fs.readFileSync(
    path.join(ROOT, 'engines', 'src', 'creator-final-wave-engine.js'),
    'utf8'
  );
  const finalController = fs.readFileSync(
    path.join(ROOT, 'assets', 'js', 'pages', 'creative', 'creator-final-wave-controller.js'),
    'utf8'
  );
  assert.match(finalEngine, /dimensions:\s*\{\s*width:\s*1080,\s*height:\s*1350\s*\}/);
  assert.match(finalController, /canvas\.width = result\.dimensions\.width/);
  assert.match(finalController, /canvas\.height = result\.dimensions\.height/);
  assert.match(finalController, /canvas\.width = result\.width/);
  assert.match(finalController, /canvas\.height = result\.height/);

  const clip = html('creator-clip');
  assert.match(clip, /canvas\.width = cW/);
  assert.match(clip, /canvas\.height = cH/);
  assert.match(clip, /creatorclip-export\.webm/);

  const thumb = html('creator-thumb');
  assert.match(thumb, /creator-final-wave-engine\.js/);
  assert.match(finalController, /creator-thumbnail-" \+ result\.width \+ "x" \+ result\.height \+ "\.png"/);
  assert.match(finalController, /toBlob\(/);
});

test('audio and recording tools expose real browser media output paths', () => {
  const voice = html('creator-voice');
  assert.match(voice, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(voice, /new MediaRecorder/);
  assert.match(voice, /new Blob/);

  const record = html('creator-record');
  assert.match(record, /getDisplayMedia/);
  assert.match(record, /getUserMedia/);
  assert.match(record, /new MediaRecorder/);
  assert.match(record, /return 'CreatorRecord-' \+ d\.getFullYear\(\)/);
});

test('unsupported and synthetic output is not presented as completed functionality', () => {
  const kit = html('creator-kit');
  assert.match(kit, /Download JSON/);
  assert.match(kit, /Download TXT/);
  assert.doesNotMatch(kit, /PNG export|Perfect for Instagram stories|online AI/i);

  const brand = html('creator-brand');
  assert.doesNotMatch(brand, /Download All \(concept\)/);
  assert.match(brand, /locally generated sample posts/);

  const stock = html('creator-stock');
  assert.match(stock, /Verification ledger, not legal clearance/);
  assert.match(stock, /does not fetch, host, license, or approve media/);
  assert.match(stock, /recheck current terms/);
  assert.doesNotMatch(stock, /Fallback to mock|invented stock records/i);
});

test('CreatorKit keeps its accepted local export boundary', () => {
  const source = html('creator-kit');
  assert.match(source, /Private local workflow/);
  assert.match(source, /Download JSON/);
  assert.match(source, /Download TXT/);
  assert.doesNotMatch(source, /confirmOnlineAi|exact prompt below will be sent|Download PDF/i);
});
