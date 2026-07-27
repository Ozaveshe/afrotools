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

function html(id) {
  return fs.readFileSync(path.join(ROOT, 'tools', id, 'app.html'), 'utf8');
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
    assert.match(source, /day9-creative-expanded-safety\.js/);
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
  const carousel = html('creator-carousel');
  assert.match(carousel, /canvas\.width = fmt\.w/);
  assert.match(carousel, /canvas\.height = fmt\.h/);
  assert.match(carousel, /fmt\.w \+ 'x' \+ fmt\.h/);

  const clip = html('creator-clip');
  assert.match(clip, /canvas\.width = cW/);
  assert.match(clip, /canvas\.height = cH/);
  assert.match(clip, /creatorclip-export\.webm/);

  const thumb = html('creator-thumb');
  assert.match(thumb, /1280 × 720 — YouTube Thumbnail/);
  assert.match(thumb, /export-size-info/);
  assert.match(thumb, /a\.download = 'thumbnail-' \+ s\.w \+ 'x' \+ s\.h/);
  assert.match(thumb, /toBlob\(/);
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
  assert.match(kit, /PNG export — not available/);
  assert.doesNotMatch(kit, /Perfect for Instagram stories/);
  assert.match(kit, /online AI/i);

  const brand = html('creator-brand');
  assert.doesNotMatch(brand, /Download All \(concept\)/);
  assert.match(brand, /locally generated sample posts/);

  const stock = html('creator-stock');
  assert.match(stock, /Never substitute invented stock records/);
  assert.match(stock, /No sample result is presented as a real licensed asset/);
  assert.doesNotMatch(stock, /Fallback to mock/);
});

test('CreatorKit previews the exact online AI prompt and labels print behavior honestly', () => {
  const source = html('creator-kit');
  assert.match(source, /function confirmOnlineAi\(prompt\)/);
  assert.match(source, /The exact prompt below will be sent/);
  assert.match(source, /if \(!confirmOnlineAi\(prompt\)\)/);
  assert.match(source, /Open print view/);
  assert.doesNotMatch(source, /<div class="ck-share-label">Download PDF<\/div>/);
});
