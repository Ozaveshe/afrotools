'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const SLUG = 'free-json-formatter-developer-tools';
const FILE = 'fr/blog/' + SLUG + '/index.html';
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const article = read(FILE);
const tool = read('fr/tools/formateur-json/index.html');
const plain = text => text.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const body = article.match(/<article class="article-body">([\s\S]*?)<\/article>/)?.[1] || '';
const schemas = [...article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const example = '{"ville":"Dakar","quantite":3,"actif":true,"etiquettes":["test","formation"]}';

function actualTool(initial = example, storage = new Map()) {
  const nodes = {}, writes = [], copies = [], downloads = [], blobs = new Map(); let requests = 0;
  for (const id of ['jsonFormatterForm', 'jsonInput', 'jsonOutput', 'jsonStatus', 'jsonValidity', 'jsonSize', 'jsonKeys', 'jsonDepth', 'jsonMinify', 'jsonRepair', 'jsonSample', 'jsonCopy', 'jsonDownload']) {
    nodes[id] = { value: id === 'jsonInput' ? initial : '', textContent: '', listeners: {}, classList: { toggle() {} }, select() { this.selected = true; }, addEventListener(type, fn) { this.listeners[type] = fn; } };
  }
  const script = [...tool.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]).find(x => x.includes("getElementById('jsonFormatterForm')"));
  assert.ok(script, 'actual native French tool implementation must exist');
  const context = { document: { getElementById: id => nodes[id], body: { appendChild() {} }, createElement(tag) {
    assert.equal(tag, 'a'); return { click() { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); }, remove() {} };
  } }, localStorage: { setItem(key, value) { writes.push([key, value]); storage.set(key, value); } }, navigator: { clipboard: { writeText(text) { copies.push(text); return Promise.resolve(); } } }, Blob,
  URL: { createObjectURL(blob) { const url = 'blob:owned-' + blobs.size; blobs.set(url, blob); return url; }, revokeObjectURL() {} },
  fetch() { requests++; throw Error('No real requests permitted in closed workflow test'); }, setTimeout() {}, Intl };
  vm.runInNewContext(script, context, { filename: 'actual-fr-formateur-json-inline.js', timeout: 1000 });
  return { nodes, writes, copies, downloads, storage, requestCount: () => requests, submit() { nodes.jsonFormatterForm.listeners.submit({ preventDefault() {} }); }, click(id) { nodes[id].listeners.click(); } };
}

test('the French route contains a complete native guide with stable identity and no English embed', () => {
  assert.match(article, /<html\b[^>]*lang="fr"/); assert.match(article, /content="blog:fr:7ffeab00047484"/);
  assert.equal((article.match(/<h1\b/g) || []).length, 1); assert.ok(plain(body).split(' ').length >= 1000);
  assert.doesNotMatch(article, /<iframe\b|noindex|english-fallback|traduction à venir|Contenu disponible en anglais/i);
  for (const id of ['avant-de-commencer', 'exemple', 'formater', 'erreurs', 'reparer', 'minifier', 'exporter', 'confidentialite', 'controle-final', 'faq']) assert.match(body, new RegExp('id="' + id + '"'));
  assert.match(body, /stockage local/); assert.match(body, /Fermer un onglet n’est pas une commande d’effacement/);
  assert.match(body, /un nouveau résultat valide remplace le précédent/); assert.match(body, /une entrée vide ou invalide bloque l’export/); assert.doesNotMatch(body, /peuvent reprendre une ancienne sortie/);
  assert.match(body, /ne garantit pas la préservation/); assert.doesNotMatch(body, /100\s*%|taille illimitée|aucune donnée n’est conservée|vue arborescente interactive/i);
});

test('canonical/social language and Article/FAQ/Breadcrumb metadata match the actual French reader content', () => {
  const canonical = 'https://afrotools.com/fr/blog/' + SLUG + '/';
  assert.match(article, new RegExp('<link rel="canonical" href="' + canonical + '"'));
  assert.match(article, new RegExp('<meta property="og:url" content="' + canonical + '"'));
  const a = schemas.find(s => s['@type'] === 'Article'); assert.ok(a); assert.equal(a.inLanguage, 'fr'); assert.equal(a.mainEntityOfPage, canonical);
  assert.equal(a.author['@type'], 'Organization'); assert.equal(a.author.name, 'Équipe AfroTools'); assert.equal(a.wordCount, plain(body).split(' ').length);
  assert.equal(a.image, 'https://afrotools.com/assets/img/blog/' + SLUG + '.webp');
  const visible = [...body.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(m => [plain(m[1]), plain(m[2])]);
  const faq = schemas.find(s => s['@type'] === 'FAQPage'); assert.deepEqual(faq.mainEntity.map(x => [x.name, x.acceptedAnswer.text]), visible); assert.equal(visible.length, 4);
  assert.equal(schemas.find(s => s['@type'] === 'BreadcrumbList').itemListElement.at(-1).item, canonical);
  assert.match(article, /alt="Ordinateur portable affichant du code indenté, avec accolades et liste de contrôle\."/);
  const alternates = [...article.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(alternates, [['en', 'https://afrotools.com/blog/' + SLUG + '/'], ['fr', canonical], ['x-default', 'https://afrotools.com/blog/' + SLUG + '/']]);
});

test('the French editorial manifest lists this guide once and all reader handoffs point to existing French pages', () => {
  const rows = JSON.parse(read('data/localization/fr-blog-manifest.json')).articles.filter(x => x.slug === SLUG); assert.equal(rows.length, 1); assert.equal(rows[0].category, 'Développement web');
  const links = [...article.matchAll(/href="(\/fr\/[^"#]*)"/g)].map(m => m[1]); assert.ok(links.includes('/fr/tools/formateur-json/'));
  for (const link of new Set(links)) { const file = link.slice(1).replace(/\/$/, '/index.html'); assert.ok(fs.existsSync(path.join(ROOT, file)), link); assert.match(read(file), /<html\b[^>]*lang="fr"/); }
  assert.match(article, /href="https:\/\/developer\.mozilla\.org\/fr\/docs\/Web\/JavaScript\/Reference\/Global_Objects\/JSON\/parse"/);
});

test('the complete guide example formats through the actual French tool without a network call', () => {
  assert.ok(body.includes('<pre><code>' + example + '</code></pre>'));
  const f = actualTool(example); assert.deepEqual(JSON.parse(f.nodes.jsonOutput.value), JSON.parse(example)); assert.match(f.nodes.jsonStatus.textContent, /JSON valide et formaté/);
  assert.ok(f.nodes.jsonOutput.value.includes('\n  ')); assert.equal(f.requestCount(), 0);
});

test('Minifier uses the current input and preserves the example types', () => {
  const f = actualTool(); f.nodes.jsonInput.value = '{"nombre":3,"chaine":"3","actif":false}'; f.click('jsonMinify');
  assert.equal(f.nodes.jsonOutput.value, '{"nombre":3,"chaine":"3","actif":false}'); assert.match(f.nodes.jsonStatus.textContent, /minifié/); assert.equal(f.requestCount(), 0);
});

test('invalid JSON clears output and does not overwrite the stored prior valid result', () => {
  const f = actualTool(); const last = f.writes.at(-1), count = f.writes.length; f.nodes.jsonInput.value = '{"ville":"Dakar",}'; f.submit();
  assert.equal(f.nodes.jsonOutput.value, ''); assert.equal(f.nodes.jsonValidity.textContent, 'Invalide'); assert.equal(f.writes.length, count); assert.equal(f.storage.get(last[0]), last[1]);
});

test('successful formatting really saves the local copy disclosed by the guide', () => {
  const f = actualTool(); assert.equal(f.writes.at(-1)[0], 'afrotools_json_formatter_fr_v1'); assert.equal(f.storage.get(f.writes.at(-1)[0]), f.nodes.jsonOutput.value);
  f.nodes.jsonInput.value = '{"autre":true}'; f.submit(); assert.equal(f.storage.size, 1); assert.equal(f.storage.get('afrotools_json_formatter_fr_v1'), f.nodes.jsonOutput.value);
  f.nodes.jsonInput.value = ''; f.submit(); assert.ok(f.storage.get('afrotools_json_formatter_fr_v1'), 'empty input is not a storage deletion operation');
});

test('copy revalidates edited input and JSON download uses the current validated output and filename', async () => {
  const f = actualTool(); f.nodes.jsonInput.value = '{"nouveau":true}'; f.click('jsonCopy'); await Promise.resolve(); assert.equal(f.copies[0], f.nodes.jsonOutput.value); assert.deepEqual(JSON.parse(f.copies[0]), { nouveau: true });
  f.click('jsonDownload'); assert.equal(f.downloads.length, 1); assert.equal(f.downloads[0].filename, 'afrotools-json-formate.json');
  assert.deepEqual(JSON.parse(await f.downloads[0].blob.text()), { nouveau: true }); assert.equal(f.requestCount(), 0);
});

test('light repair can handle the simple trailing-comma example without becoming a schema validator', () => {
  const f = actualTool('{"ville":"Dakar",}'); assert.equal(f.nodes.jsonOutput.value, ''); f.click('jsonRepair');
  assert.deepEqual(JSON.parse(f.nodes.jsonOutput.value), { ville: 'Dakar' }); assert.equal(f.requestCount(), 0);
});
