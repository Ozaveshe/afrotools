'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'language/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');

function englishLanguageRows() {
  return registry.split(/\r?\n/)
    .filter((line) => line.includes("category: 'language'") && !/\blang:\s*'/.test(line))
    .map((line) => {
      const id = line.match(/\{\s*id:\s*'([^']+)'/);
      const name = line.match(/\bname:\s*'([^']+)'/);
      const href = line.match(/\bhref:\s*'([^']+)'/);
      const status = line.match(/\bstatus:\s*'([^']+)'/);
      assert.ok(id && name && href && status, `could not parse registry row: ${line}`);
      return { id: id[1], name: name[1], href: href[1], status: status[1] };
    });
}

test('static inventory exactly matches the 11 English language registry apps', () => {
  const rows = englishLanguageRows();
  assert.equal(rows.length, 11);
  assert.ok(rows.every((row) => row.status === 'live'));

  const cardIds = [...html.matchAll(/<article class="lh-card" data-tool-id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(cardIds.length, 11);
  assert.deepEqual(new Set(cardIds), new Set(rows.map((row) => row.id)));

  for (const row of rows) {
    const cardPattern = new RegExp(
      `<article class="lh-card" data-tool-id="${row.id}"[\\s\\S]*?<a href="${row.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">${row.name.replace(/&/g, '&amp;')}</a>[\\s\\S]*?</article>`,
      'i'
    );
    assert.match(html, cardPattern, `${row.id} needs its exact registry name and route as a static anchor`);
    const localRoute = path.join(root, row.href.replace(/^\/|\/$/g, ''), 'index.html');
    assert.equal(fs.existsSync(localRoute), true, `${row.href} must exist locally`);
  }
  assert.doesNotMatch(html, /AFRO_TOOLS|tool-grid|innerHTML|onRegistryReady|category-hub-card-images/i);
});

test('hub has one semantic main, one h1 and local typography', () => {
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((html.match(/<\/main>/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<a class="lh-skip" href="#main-content">/);
  assert.match(html, /<main id="main-content">/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|@import\s+url/i);
});

test('unsupported scale, authority and accuracy claims are absent', () => {
  const forbidden = [
    /2,?500\+?/i,
    /50,?000\+?/i,
    /5,?000\+?/i,
    /\b11 African languages\b/i,
    /\b100M\+|\b80M\+|\b75M\+|\b45M\+|\b35M\+|\b27M\+/i,
    /native speaker input|verified by native speakers/i,
    /most widely spoken|most spoken African language/i,
    /completely free|no sign-up required/i,
    /covers every angle|most competitors/i
  ];
  forbidden.forEach((pattern) => assert.doesNotMatch(html, pattern));
  assert.match(html, /Eleven published app routes/);
  assert.match(html, /not a count of distinct languages/i);
  assert.match(html, /no combined phrase, word-pair, culture or name-record total claim/i);
});

test('privacy and fail-closed boundaries match the shared translation foundation', () => {
  assert.match(html, /Local phrasebook first/i);
  assert.match(html, /exact text entered is sent to AfroTools and the named translation provider/i);
  assert.match(html, /explicit opt-in for that page session/i);
  assert.match(html, /Fail-closed/i);
  assert.match(html, /consent is not remembered for a new page session/i);
  assert.match(html, /Do not enter private, confidential/i);
  assert.match(html, /qualified translator/i);
  assert.equal((html.match(/Cloud requires opt-in/g) || []).length, 8);
});

test('CollectionPage and FAQ structured data are valid and inventory-complete', () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  assert.equal(blocks.length, 2);
  const collection = blocks.find((block) => block['@type'] === 'CollectionPage');
  const faq = blocks.find((block) => block['@type'] === 'FAQPage');
  assert.ok(collection);
  assert.ok(faq);
  assert.equal(collection.mainEntity['@type'], 'ItemList');
  assert.equal(collection.mainEntity.numberOfItems, 11);
  assert.equal(collection.mainEntity.itemListElement.length, 11);
  assert.equal(new Set(collection.mainEntity.itemListElement.map((item) => item.url)).size, 11);
  assert.ok(faq.mainEntity.some((item) => /cloud translation/i.test(item.name)));
});

test('SEO title and description are concise and route-aligned', () => {
  const title = html.match(/<title>([^<]+)/)[1];
  const description = html.match(/<meta name="description" content="([^"]+)/)[1];
  assert.ok(title.length >= 35 && title.length <= 65, `title length ${title.length}`);
  assert.ok(description.length >= 120 && description.length <= 160, `description length ${description.length}`);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/language\/">/);
  assert.match(html, /"dateModified":"2026-07-26"/);
});
