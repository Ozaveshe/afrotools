'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apps = [
  ['swahili-translator', 'traducteur-swahili', '/tools/swahili-translator/'],
  ['yoruba-translator', 'traducteur-yoruba', '/tools/yoruba-translator/'],
  ['hausa-translator', 'traducteur-haoussa', '/tools/hausa-translator/'],
  ['igbo-translator', 'traducteur-igbo', '/tools/igbo-translator/'],
  ['amharic-translator', 'traducteur-amharique', '/tools/amharic-translator/'],
  ['zulu-translator', 'traducteur-zoulou', '/tools/zulu-translator/'],
  ['arabic-calc', 'chiffres-arabes', '/tools/arabic-numerals/'],
  ['transliterate', 'translitteration', '/tools/transliterate/'],
  ['pidgin-translator', 'traducteur-pidgin', '/tools/pidgin-translator/'],
  ['french-african', 'francais-africain', '/tools/french-african/'],
  ['african-name-meaning', 'signification-prenoms-africains', '/tools/african-name-meaning/']
];
const frenchAiRouteMap = read('assets/js/ai/french-route-map.generated.js');
const aiCatalog = read('data/ai/tool-catalog-pack.json');
const forbiddenVisibleEnglish = /\b(?:Related tools|Methodology|Disclaimer|Sources reviewed|Cross-check|Phrasebook|Shortlist|Baby names|African tools|official authority|language references|Not official|chart Unicode)\b/i;

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

for (const [id, slug, englishRoute] of apps) {
  const relative = `fr/tools/${slug}/index.html`;
  const html = read(relative);
  const frenchRoute = `/fr/tools/${slug}/`;
  assert.match(html, /<html\b[^>]*\blang="fr"/i, `${slug}: page language`);
  assert.match(html, /<title>[^<]{12,}<\/title>/i, `${slug}: useful title`);
  assert.match(html, /<meta name="description" content="[^"]{80,}"/i, `${slug}: useful description`);
  assert.strictEqual((html.match(/<h1\b/gi) || []).length, 1, `${slug}: one H1`);
  assert.ok(html.includes(`rel="canonical" href="https://afrotools.com${frenchRoute}"`), `${slug}: self canonical`);
  assert.ok(html.includes(`hreflang="fr" href="https://afrotools.com${frenchRoute}"`), `${slug}: French hreflang`);
  assert.ok(html.includes(`hreflang="en" href="https://afrotools.com${englishRoute}"`), `${slug}: English hreflang`);
  assert.match(html, /"inLanguage"\s*:\s*"fr"/, `${slug}: French structured-data language`);
  assert.doesNotMatch(html, /<iframe\b/i, `${slug}: no English iframe`);
  assert.doesNotMatch(html, /<(?:section|div|form)\b[^>]*(?:data-fr-repair|data-fr-action-planner|data-language-workbench)/i, `${slug}: no handoff shell`);
  assert.ok((html.match(/href="\/fr\//g) || []).length >= 3, `${slug}: French internal links`);
  assert.match(html, /aria-live="polite"|role="status"/i, `${slug}: live status`);
  assert.doesNotMatch(html, /\bfetch\s*\(/, `${slug}: core workflow is local`);
  const visibleHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  assert.doesNotMatch(visibleHtml, forbiddenVisibleEnglish, `${slug}: no residual English UI`);
  const imageMatch = html.match(/<meta property="og:image" content="https:\/\/afrotools\.com\/([^"]+)"/i);
  assert.ok(imageMatch, `${slug}: OG artwork metadata`);
  const artworkPath = path.join(root, imageMatch[1]);
  assert.ok(fs.existsSync(artworkPath), `${slug}: OG artwork exists`);
  const artworkBytes = fs.readFileSync(artworkPath);
  assert.ok(artworkBytes.length > 10_000, `${slug}: artwork is substantive`);
  const contextPath = path.join(root, `data/ai/tool-context/${id}.json`);
  assert.ok(fs.existsSync(contextPath), `${slug}: AI tool context`);
  const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  assert.strictEqual(context.toolKey, id, `${slug}: AI context owner`);
  assert.ok(
    (Array.isArray(context.boundaries) && context.boundaries.length > 0) ||
      (context.status === 'unverified-static' && typeof context.staticText === 'string' && context.staticText.length > 160),
    `${slug}: AI safety/context behavior`
  );
  assert.ok(aiCatalog.includes(`"toolId": "${id}"`) || aiCatalog.includes(`"${id}"`), `${slug}: AI intent/catalog owner`);
  assert.ok(
    frenchAiRouteMap.includes(`"${englishRoute}":"/fr/tools/${slug}/"`),
    `${slug}: French AI route mapping`
  );
}

const yoruba = read('fr/tools/traducteur-yoruba/index.html');
assert.ok(yoruba.includes('/assets/js/pages/french-yoruba-tool.js'), 'Yoruba native runtime');
const yorubaRuntime = read('assets/js/pages/french-yoruba-tool.js');
assert.ok(yorubaRuntime.includes("'Merci', 'Ẹ ṣéun'"), 'Yoruba French oracle');
assert.ok(yorubaRuntime.includes("'Combien coûte ceci ?', 'Èló ni èyí?'"), 'Yoruba market oracle');

const frenchAfrican = read('fr/tools/francais-africain/index.html');
assert.ok(frenchAfrican.includes('/assets/js/pages/french-african-phrasebook.js'), 'African French native runtime');
const africanRuntime = read('assets/js/pages/french-african-phrasebook.js');
assert.strictEqual((africanRuntime.match(/\{ phrase:/g) || []).length, 20, 'African French exact dataset count');
assert.ok(africanRuntime.includes('Provenance pays et registre : non vérifiés.'), 'African French provenance boundary');

const swahili = read('fr/tools/traducteur-swahili/index.html');
assert.ok(swahili.includes('["merci","asante"]'), 'Swahili French oracle');
const pidgin = read('fr/tools/traducteur-pidgin/index.html');
assert.ok(pidgin.includes('["combien ça coûte","how much e be"]'), 'Pidgin French oracle');

console.log(`French Language Wave 2 static acceptance: ${apps.length}/${apps.length} routes passed.`);
