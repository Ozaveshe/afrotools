const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const routes = {
  pidgin: fs.readFileSync(path.join(root, 'tools/pidgin-translator/index.html'), 'utf8'),
  french: fs.readFileSync(path.join(root, 'tools/french-african/index.html'), 'utf8'),
  names: fs.readFileSync(path.join(root, 'tools/african-name-meaning/index.html'), 'utf8')
};

function arrayBody(html, variable) {
  const match = html.match(new RegExp(`(?:var|const)\\s+${variable}\\s*=\\s*\\[(.*?)\\n\\];`, 's'));
  assert.ok(match, `${variable} dataset exists`);
  return match[1];
}

function visibleMarkup(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function structuredData(html) {
  return [...visibleMarkup(html).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
}

const pidginRows = arrayBody(routes.pidgin, 'PHRASES');
assert.equal((pidginRows.match(/^\s*\{en:/gm) || []).length, 109);
assert.equal(new Set([...pidginRows.matchAll(/cat:'([^']+)'/g)].map(match => match[1])).size, 9);

const frenchRows = arrayBody(routes.french, 'PHRASES');
assert.equal((frenchRows.match(/^\s*\{en:/gm) || []).length, 95);
assert.equal((frenchRows.match(/cat:'African French'/g) || []).length, 20);

const nameRows = arrayBody(routes.names, 'NAMES');
assert.equal((nameRows.match(/^\s*\{name:/gm) || []).length, 308);
assert.equal(new Set([...nameRows.matchAll(/listedLanguage:'([^']+)'/g)].map(match => match[1])).size, 20);
assert.doesNotMatch(nameRows, /\b(?:meaning|gender|pop|themes):/);

for (const [route, html] of Object.entries(routes)) {
  const publicHtml = visibleMarkup(html);
  assert.doesNotMatch(publicHtml, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare/i, `${route} has no route-level remote font or CDN`);
  assert.doesNotMatch(publicHtml, /\b(?:400|500|5,000|50,000)\+\b/, `${route} exposes no inflated dataset claim`);
  structuredData(html);
}

assert.match(routes.pidgin, /109 locally available entries/);
assert.match(routes.pidgin, /not an authoritative form of Nigerian or African Pidgin/);
assert.match(routes.pidgin, /requireConsent\('pidgin-translator'/);
assert.match(routes.pidgin, /cache:\s*'no-store'/);
assert.doesNotMatch(routes.pidgin, /(?:localStorage|sessionStorage)\.(?:getItem|setItem)/i);
assert.match(routes.pidgin, /Choose a study direction/);
assert.match(routes.pidgin, /function getFilteredPhrases/);
assert.match(routes.pidgin, /not verified pronunciation/);
assert.match(routes.pidgin, /role="tablist"/);

assert.match(routes.french, /75 general-French learning rows and 20 rows labelled/);
assert.match(routes.french, /Country and register: unknown \/ unverified/);
assert.match(routes.french, /external-translation-consent\.js/);
assert.match(routes.french, /live-translate\.js/);
assert.doesNotMatch(routes.french, /(?:localStorage|sessionStorage)\.setItem/);
assert.match(routes.french, /p\.cat!==['"]African French['"]/);
assert.match(routes.french, /function getFilteredPhrases/);
assert.match(routes.french, /not verified country-specific pronunciation/);
assert.match(routes.french, /General French practice/);

assert.match(routes.names, /Meaning, country, community, gender and pronunciation: unknown \/ unverified/);
assert.doesNotMatch(visibleMarkup(routes.names), /Baby Name Suggester|Find the Perfect Baby Name|500\+/);
assert.doesNotMatch(routes.names, /(?:localStorage|sessionStorage|indexedDB|fetch\()/);
assert.match(routes.names, /Session shortlist/);
assert.match(routes.names, /function downloadShortlist/);
assert.match(routes.names, /role="tablist"/);

for (const [tool, count] of [['pidgin-translator', 109], ['french-african', 95], ['african-name-meaning', 308]]) {
  const context = JSON.parse(fs.readFileSync(path.join(root, `data/ai/tool-context/${tool}.json`), 'utf8'));
  assert.equal(context.inventoryCount, count);
  assert.ok(context.boundaries.some(boundary => /Never place raw|Never place searched/.test(boundary)));
}

console.log('day5-language-lane-c: deterministic assertions passed');
