'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ROOT = process.env.AFROTOOLS_FR_IGBO_TEST_ROOT || path.resolve(__dirname, '..');
const REFERENCES = process.env.AFROTOOLS_FR_IGBO_REFERENCE_ROOT || ROOT;
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const reference = file => fs.readFileSync(path.join(REFERENCES, file), 'utf8');
const french = read('fr/blog/igbo-market-days/index.html');
const english = read('blog/igbo-market-days/index.html');
const frUrl = 'https://afrotools.com/fr/blog/igbo-market-days/';
const enUrl = 'https://afrotools.com/blog/igbo-market-days/';
function tags(html, tag) {
  return [...html.matchAll(new RegExp('<' + tag + '\\b[^>]*>', 'gi'))].map(match => Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(attr => [attr[1], attr[2]])));
}

test('French reader receives a complete native article instead of an English iframe', () => {
  assert.match(french, /<html lang="fr">/);
  assert.match(french, /<main id="article"/);
  assert.doesNotMatch(french, /<iframe\b|traduction à venir|english-fallback-noindex|http-equiv="refresh"|window\.location\.replace/);
  const visible = french.split('<main')[1].split('</main>')[0].replace(/<[^>]+>/g, ' ');
  assert.ok(visible.trim().split(/\s+/).length > 1100, 'Article should explain the cycle, practical use and cultural context');
  for (const topic of ['Les quatre jours', 'Trouver le jour', 'Quelques repères', 'Le cycle, le marché', 'calendrier traditionnel', 'Sources et repère', 'Questions fréquentes']) assert.ok(french.includes(topic), topic);
});

test('indexability follows complete French content and reciprocal canonical language links', () => {
  for (const [html, canonical] of [[french, frUrl], [english, enUrl]]) {
    assert.deepEqual(tags(html, 'link').filter(t => t.rel === 'canonical').map(t => t.href), [canonical]);
    const alternates = tags(html, 'link').filter(t => t.rel === 'alternate' && t.hreflang);
    assert.deepEqual(alternates.filter(t => t.hreflang === 'fr').map(t => t.href), [frUrl]);
    assert.deepEqual(alternates.filter(t => t.hreflang === 'en').map(t => t.href), [enUrl]);
    assert.deepEqual(alternates.filter(t => t.hreflang === 'x-default').map(t => t.href), [enUrl]);
  }
  assert.equal(tags(french, 'meta').find(t => t.name === 'robots').content, 'index, follow');
  assert.equal(tags(french, 'meta').find(t => t.property === 'og:url').content, frUrl);
  assert.equal(tags(french, 'meta').find(t => t.property === 'og:locale').content, 'fr_FR');
});

test('article metadata and existing editorial image agree with the visible French article', () => {
  const schemas = [...french.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const article = schemas.find(s => s['@type'] === 'Article');
  assert.equal(article.inLanguage, 'fr');
  assert.equal(article.mainEntityOfPage, frUrl);
  assert.equal(article.isBasedOn, enUrl);
  assert.equal(article.image, 'https://afrotools.com/assets/img/blog/igbo-market-days.webp');
  assert.match(french, /src="\/assets\/img\/blog\/igbo-market-days\.webp" alt="Produits de marché/);
  assert.match(french, /<figcaption>Illustration éditoriale\.<\/figcaption>/);
  for (const key of ['twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) assert.ok(tags(french, 'meta').some(t => t.name === key && t.content));
});

test('French discovery adds this article once and reuses its own social artwork', () => {
  const rows = JSON.parse(read('data/localization/fr-blog-manifest.json')).articles.filter(r => r.slug === 'igbo-market-days');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].category, 'Culture et calendriers');
  assert.ok(!rows[0].image, 'No unrelated tool-image override; maintained hub reads the article OG image');
  assert.match(rows[0].description, /Eke, Orie, Afor et Nkwo/);
});

test('page-local hero styles provide readable category, breadcrumb and byline in either theme', () => {
  const css = french.match(/<style id="fr-igbo-guide-hero-contrast">([\s\S]*?)<\/style>/)[1];
  assert.match(french, /<header id="fr-igbo-guide-hero" class="article-hero">/);
  assert.match(css, /\.category-badge \{ color: #f8fafc !important; background: #1e293b/);
  assert.match(css, /\.article-meta-hero span \{ color: #e2e8f0 !important;/);
  assert.match(css, /\.breadcrumb a \{ color: #bfdbfe !important; text-decoration: underline/);
  assert.match(css, /a:focus-visible \{ outline: 3px solid #bfdbfe/);
  assert.doesNotMatch(css, /data-theme|prefers-color-scheme/);
  for (const selector of css.split('}').map(rule=>rule.split('{')[0]).filter(s=>s.trim()).flatMap(s=>s.split(','))) assert.ok(selector.trim().startsWith('#fr-igbo-guide-hero '), selector);
  function luminance(hex) { const rgb=hex.match(/\w\w/g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
  for(const [fg,bg] of [['f8fafc','1e293b'],['e2e8f0','111827'],['bfdbfe','111827']]) assert.ok((luminance(fg)+.05)/(luminance(bg)+.05)>4.5);
});

test('date examples agree with the actual shared engine and independent four-day expectations', () => {
  const sandbox = { window: {} }; vm.createContext(sandbox);
  vm.runInContext(reference('assets/js/engines/igbo-market-days.js'), sandbox);
  const api = sandbox.window.AfroTools.engines.igboMarketDays;
  for (const [date, day] of [['2026-01-01','Orie'],['2026-01-02','Afor'],['2026-01-03','Nkwo'],['2026-01-04','Eke'],['2026-01-05','Orie'],['2026-10-01','Afor'],['2026-12-25','Nkwo']]) assert.equal(api.getMarketDay(date).name, day, date);
  assert.match(french, /1er octobre 2026[^<]*<\/strong> Afor/);
  assert.match(french, /25 décembre 2026[^<]*<\/strong> Nkwo/);
});

test('the actual French tool computes the advertised date and four-day recurrences', () => {
  const values = { 'market-name':'Marché de démonstration',country:'Nigeria','known-date':'2026-01-01',cycle:'4',role:'buyer',count:'3',route:'' };
  const elements = new Map();
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id,{ value:values[id] || '',textContent:'',classList:{remove(){},add(){}},addEventListener(){},click(){},remove(){},style:{} }); return elements.get(id); } };
  const sandbox = { window:{},document,localStorage:{setItem(){}},navigator:{},console }; vm.createContext(sandbox);
  vm.runInContext(reference('assets/js/engines/igbo-market-days.js'), sandbox);
  const html = reference('fr/tools/jours-marche/index.html');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const actual = scripts.find(s => s.includes("const STORAGE_KEY = 'afrotools_jours_marche_fr_v1'"));
  assert.ok(actual, 'Execute the maintained actual French inline calculator');
  vm.runInContext(actual, sandbox);
  const result = document.getElementById('summary-output').textContent;
  assert.match(result, /Jour de marche: Orie/);
  for (const day of ['01','05','09']) assert.match(result,new RegExp(day+' janv\\. 2026'));
  assert.equal(document.getElementById('cycle-output').textContent,'4j');
  assert.equal(document.getElementById('count-output').textContent,'3');
});

test('the article distinguishes the French workflow from English-only directory and today shortcuts', () => {
  assert.match(french, /href="\/fr\/tools\/jours-marche\/">calendrier/);
  assert.match(french, /Date connue de marché/);
  assert.match(french, /page française fournit le calcul d’une date et ses récurrences/);
  assert.match(french, /ne reprend pas encore ce répertoire ni tous ces raccourcis/);
  assert.match(french, /href="\/tools\/market-days\/" hreflang="en"/);
  for (const href of ['https://mkomigbo.com/igbo-calendar/?y=2026','https://igbozuru.com/events/orie-ukwu-2026-01-05/','https://igbocalendar.com/']) assert.ok(french.includes('href="'+href+'"'));
  assert.match(french, /confirmez|Confirmez/);
});
