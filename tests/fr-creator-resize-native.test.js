const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { normalizeBuildManagedHtml } = require('../scripts/lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

const englishLauncher = read('tools/creator-resize/index.html');
const englishApp = read('tools/creator-resize/app.html');
const frenchLauncher = read('fr/tools/redimensionnement-pour-createur/index.html');
const frenchApp = read('fr/tools/redimensionnement-pour-createur/app.html');
const engine = read('engines/src/creator-resize-engine.js');
const generator = read('scripts/build-fr-creator-resize-native.js');

test('CreatorResize French surfaces are native and use the shared local engine', () => {
  assert.match(frenchLauncher, /<html\b[^>]*\blang="fr"/);
  assert.match(frenchLauncher, /Une image, douze formats sociaux/);
  assert.match(frenchApp, /<html\b[^>]*\blang="fr"/);
  assert.match(frenchApp, /Déposez votre image ici/);
  assert.doesNotMatch(frenchLauncher + frenchApp, /<iframe\b/i);
  assert.doesNotMatch(frenchLauncher + frenchApp, /Ouvrir le calculateur complet|complete English|English calculator/i);

  for (const app of [englishApp, frenchApp]) {
    assert.match(app, /\/engines\/creator-resize-engine\.js/);
    assert.match(app, /\/assets\/vendor\/jszip\/jszip\.min\.js/);
    const productHtml = normalizeBuildManagedHtml(app);
    assert.doesNotMatch(productHtml, /supabase|afro-auth|creator-profile|https:\/\/(?:cdn|cdnjs|fonts)/i);
    assert.doesNotMatch(productHtml, /lazy-analytics|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/i);
    assert.doesNotMatch(productHtml, /<script\b[^>]*\bsrc=["']https?:\/\//i);
  }
});

test('CreatorResize engine exposes all 12 dimensions and French runtime messages', () => {
  assert.equal((engine.match(/\bnameFr:/g) || []).length, 12);
  assert.match(engine, /Point focal/);
  assert.match(engine, /Création du ZIP/);
  assert.match(engine, /Image trop volumineuse/);
  assert.match(engine, /Sélection|Inclure|Retirer/);
  assert.match(engine, /aria-pressed/);
  assert.match(engine, /closeModal/);
  assert.match(engine, /\^image\\\/\(\?:png\|jpeg\|webp\)/);
});

test('CreatorResize SEO, artwork, route ownership and generator scope are reciprocal', () => {
  assert.match(englishLauncher, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/redimensionnement-pour-createur\/"/);
  assert.match(frenchLauncher, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-resize\/"/);
  for (const app of [englishApp, frenchApp]) {
    assert.match(app, /<meta name="robots" content="noindex, follow">/);
    assert.doesNotMatch(app, /<link rel="alternate" hreflang=/);
  }
  assert.match(frenchLauncher, /creator-resize\.webp/);
  assert.ok(fs.existsSync(path.join(ROOT, 'assets/img/tools/creator-resize.webp')));

  assert.match(read('assets/js/components/tool-registry.js'), /sourceId:\s*"creator-resize"[\s\S]{0,240}imageId:\s*"creator-resize"/);
  assert.match(read('scripts/lib/french-tool-route-map.js'), /"redimensionnement-pour-createur":\s*"creator-resize"/);
  assert.match(read('assets/js/ai/french-route-map.generated.js'), /"\/tools\/creator-resize\/":\s*"\/fr\/tools\/redimensionnement-pour-createur\/"/);

  const writes = [...generator.matchAll(/write\('([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(writes, [
    'tools/creator-resize/app.html',
    'fr/tools/redimensionnement-pour-createur/app.html',
    'fr/tools/redimensionnement-pour-createur/index.html'
  ]);
});

test('English CreatorResize claims match the implemented manual local workflow', () => {
  assert.match(englishLauncher, /manual focal point/i);
  assert.match(englishLauncher, /Processing time depends on the source image/);
  assert.doesNotMatch(englishLauncher, /focal point detection|never get cut off|under 2 seconds|no tracking|no compression artifacts|maintains full quality/i);
  assert.doesNotMatch(englishLauncher, /data-df-upgrade="creator-resize"/);
});
