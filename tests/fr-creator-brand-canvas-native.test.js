const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function loadEngine(relative, key) {
  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox.window;
  vm.runInNewContext(read(relative), sandbox, { filename: relative });
  return sandbox.window.AfroTools.engines[key];
}

test('CreatorBrand engine produces deterministic contrast and reopenable exports', () => {
  const engine = loadEngine('engines/src/creator-brand-engine.js', 'creatorBrand');
  const kit = engine.buildKit({
    name: 'Studio Nia',
    tagline: 'Des histoires utiles',
    audience: 'Créateurs africains',
    mission: 'Rendre la création plus claire.',
    primaryColor: '#000000',
    secondaryColor: '#F59E0B',
    textColor: '#FFFFFF',
    headingFont: 'Sora',
    bodyFont: 'DM Sans',
    tone: 'friendly',
    keywords: 'clair, utile, humain',
  });

  assert.equal(kit.profile.name, 'Studio Nia');
  assert.equal(kit.colors.primaryTextContrast, 21);
  assert.equal(kit.colors.primaryTextWcagAA, true);
  assert.equal(kit.voice.samplePosts.length, 3);
  assert.match(engine.toText(kit, 'fr'), /KIT DE MARQUE/);
  assert.match(engine.toGuideHtml(kit, 'fr'), /<!doctype html>/i);
  assert.match(engine.toGuideHtml(kit, 'fr'), /Studio Nia/);
  assert.equal(JSON.parse(JSON.stringify(kit)).tool, 'creator-brand');
});

test('CreatorCanvas engine uses exact platform dimensions and deterministic text handoff', () => {
  const engine = loadEngine('engines/src/creator-canvas-engine.js', 'creatorCanvas');
  const design = engine.buildDesign({
    format: 'yt-thumb',
    title: 'Créer local',
    subtitle: 'Un résultat vérifiable',
    cta: 'COMMENCER',
    primaryColor: '#0F766E',
    secondaryColor: '#F59E0B',
    textColor: '#FFFFFF',
    align: 'left',
  });

  assert.equal(design.width, 1280);
  assert.equal(design.height, 720);
  assert.equal(design.canvas_data.elements[0].content, 'Créer local');
  assert.match(design.safeZone, /bottom-right/i);
  assert.match(engine.toText(design, 'fr'), /1280×720/);
  assert.equal(JSON.parse(JSON.stringify(design)).tool, 'creator-canvas');
});

test('English and French page pairs have reciprocal metadata, artwork and local-only contracts', () => {
  const pairs = [
    {
      en: 'tools/creator-brand/index.html',
      fr: 'fr/tools/kit-de-marque-pour-createur/index.html',
      enApp: 'tools/creator-brand/app.html',
      frApp: 'fr/tools/kit-de-marque-pour-createur/app.html',
      image: 'assets/img/tools/creator-brand.webp',
      enUrl: 'https://afrotools.com/tools/creator-brand/',
      frUrl: 'https://afrotools.com/fr/tools/kit-de-marque-pour-createur/',
    },
    {
      en: 'tools/creator-canvas/index.html',
      fr: 'fr/tools/canevas-de-projet-pour-createur/index.html',
      enApp: 'tools/creator-canvas/app.html',
      frApp: 'fr/tools/canevas-de-projet-pour-createur/app.html',
      image: 'assets/img/tools/creator-canvas.webp',
      enUrl: 'https://afrotools.com/tools/creator-canvas/',
      frUrl: 'https://afrotools.com/fr/tools/canevas-de-projet-pour-createur/',
    },
  ];

  for (const pair of pairs) {
    const en = read(pair.en);
    const fr = read(pair.fr);
    const apps = read(pair.enApp) + read(pair.frApp);
    assert.match(en, new RegExp(`hreflang="fr" href="${pair.frUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(fr, new RegExp(`hreflang="en" href="${pair.enUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(en, /"@type":"WebApplication"/);
    assert.match(fr, /"@type":"WebApplication"/);
    assert.match(apps, /day9-creative-expanded-safety\.js/);
    assert.doesNotMatch(apps, /supabase-auth|afro-auth|ai-advisor|fetch\s*\(/i);
    assert.ok(fs.existsSync(path.join(ROOT, pair.image)));
  }
});

test('French route-only AI discovery evals resolve to registry and generated locale map', () => {
  const evals = JSON.parse(read('data/ai/fr-creative-brand-canvas-evals.json'));
  const registry = read('assets/js/components/tool-registry.js');
  const routeMap = read('assets/js/ai/french-route-map.generated.js');
  assert.equal(evals.cases.length, 2);
  for (const entry of evals.cases) {
    assert.match(registry, new RegExp(`sourceId:\\s*"${entry.expectedSourceId}"`));
    assert.ok(registry.includes(`href: "${entry.expectedRoute}"`));
    const englishRoute = `/tools/${entry.expectedSourceId}/`;
    assert.ok(routeMap.includes(`"${englishRoute}":"${entry.expectedRoute}"`));
  }
});
