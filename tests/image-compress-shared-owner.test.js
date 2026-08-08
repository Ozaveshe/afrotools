const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const english = read('tools/image-compress/index.html');
const swahiliPath = path.join(ROOT, 'sw/zana/kubana-picha/index.html');
const swahili = fs.readFileSync(swahiliPath, 'utf8');
const engine = read('assets/js/lib/image-compress-studio.js');
const registry = read('assets/js/components/tool-registry.js');

const ownerHash = crypto.createHash('sha256').update(engine.trimEnd()).digest('hex');
assert.strictEqual(ownerHash, '47a6a29e4f9e61559c16525c3d73e09589400324caf1b6f65129a897e0ab6cfa', 'shared engine must remain the byte-exact extracted English owner');
assert.match(english, /src="\/assets\/js\/lib\/image-compress-studio\.js"/);
assert.match(swahili, /src="\/assets\/js\/lib\/image-compress-studio\.js"/);
assert.doesNotMatch(english, /<script>\s*\(function \(\) \{/);
assert.doesNotMatch(swahili, /const q=id=>document\.getElementById\(id\)/, 'retired single-image controller must not remain as a second owner');
assert.match(swahili, /Source owner: scripts\/build-sw-image-compress\.js; engine: assets\/js\/lib\/image-compress-studio\.js/);
assert.match(english, /\/assets\/css\/image-compress-studio\.css/);
assert.match(swahili, /\/assets\/css\/image-compress-studio\.css/);

for (const id of ['dropZone', 'fileInput', 'studioStatus', 'qualitySlider', 'formatSelect', 'targetKb', 'maxWidth', 'maxHeight', 'nameSuffix', 'backgroundColor', 'noUpscale', 'autoRun', 'stripMeta', 'compressBtn', 'downloadAllBtn', 'clearQueueBtn', 'queueList', 'compareFrame', 'beforeImage', 'afterImage', 'compareSlider', 'historyList']) {
  assert.match(english, new RegExp(`id="${id}"`), `English contract missing #${id}`);
  assert.match(swahili, new RegExp(`id="${id}"`), `Swahili contract missing #${id}`);
}
assert.match(swahili, /id="studioStatus" role="status" aria-live="polite"/);
assert.match(swahili, /id="dropZone" tabindex="0" role="button" aria-label="Pakia faili za picha"/);
assert.match(swahili, /id="compareSlider"[^>]+aria-label="Ulinganisho wa kabla na baada"/);

assert.match(engine, /const MAX_FILE_SIZE = 50 \* 1024 \* 1024/);
assert.match(engine, /if \(settings\.noUpscale\) ratio = Math\.min\(1, ratio\)/);
assert.match(engine, /for \(let i = 0; i < 7; i \+= 1\)/);
assert.match(engine, /bestUnder \|\| smallest/);
assert.match(engine, /settings\.format === 'auto' \? \['image\/webp', 'image\/jpeg', 'image\/png'\]/);
assert.match(engine, /baseName\(item\.name\) \+ settings\.suffix/);
assert.match(engine, /window\.localStorage\.setItem\(STORAGE_KEY/);
assert.doesNotMatch(engine, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|RTCPeerConnection/);

assert.match(swahili, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/kubana-picha\/"/);
assert.match(swahili, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/image-compress\/"/);
assert.match(swahili, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/compresser-image\/"/);
assert.match(swahili, /og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\/image-compress\.webp"/);
assert.match(registry, /id: "zana-kubana-picha-sw"[^\n]+sourceId: 'image-compress'[^\n]+imageId: 'image-compress'/);

const beforeBuild = crypto.createHash('sha256').update(fs.readFileSync(swahiliPath)).digest('hex');
execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-sw-image-compress.js')], { cwd: ROOT, stdio: 'pipe' });
const afterBuild = crypto.createHash('sha256').update(fs.readFileSync(swahiliPath)).digest('hex');
assert.strictEqual(afterBuild, beforeBuild, 'Swahili source-owner generator must be idempotent');

console.log('Image-compress shared owner, formula, privacy, discovery, SEO, and generator contracts verified.');
