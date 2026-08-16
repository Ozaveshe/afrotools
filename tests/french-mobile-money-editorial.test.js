'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGE_REL = 'fr/blog/mobile-money-fees-africa-compared/index.html';
const PAGE = path.join(ROOT, PAGE_REL);
const BODY = path.join(ROOT, 'lang/pages/blog/mobile-money-fees-africa-compared/fr.body.html');
const FALLBACKS = path.join(ROOT, 'data/localization/explicit-language-fallbacks.json');

const result = spawnSync(process.execPath, ['scripts/build-french-mobile-money-editorial.js'], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.strictEqual(result.status, 0, result.stderr || result.stdout);

const html = fs.readFileSync(PAGE, 'utf8');
const body = fs.readFileSync(BODY, 'utf8').trim();
const fallbacks = fs.readFileSync(FALLBACKS, 'utf8');

assert.match(html, /<html\b[^>]*\blang="fr"/i);
assert.match(html, /<meta name="content-language" content="fr">/i);
assert.match(html, /<meta name="afrotools-content-id" content="blog:fr:706924defe7edd">/i);
assert.match(html, /<meta name="afrotools-source-owner" content="scripts\/build-french-mobile-money-editorial\.js">/i);
assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/blog\/mobile-money-fees-africa-compared\/">/i);
assert.match(html, /<link rel="alternate" hreflang="fr" href="https:\/\/afrotools\.com\/fr\/blog\/mobile-money-fees-africa-compared\/"/i);
assert.ok(html.includes(body), 'generated page must contain the full source-owned French article body');

const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || '';
assert.ok(title.length > 30 && title.length <= 60, `title length ${title.length}`);
assert.ok(description.length >= 120 && description.length <= 165, `description length ${description.length}`);

for (const url of [
  'https://orangemoney.orange.cm/fr/tarification-orange-money.html',
  'https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0',
  'https://www.mtn.co.ug/tariffs/mobile-money-tariffs/',
  'https://www.airtel.co.ug/airtelmoney/transaction_fees',
  'https://newsroom.safaricom.co.ke/innovation/how-zero-rating-most-m-pesa-transactions-quadrupled-usage/'
]) {
  assert.ok(html.includes(url), `missing official source ${url}`);
}

const scripts = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  .map((match) => JSON.parse(match[1]));
const article = scripts.find((value) => value['@type'] === 'BlogPosting');
const faq = scripts.find((value) => value['@type'] === 'FAQPage');
const breadcrumb = scripts.find((value) => value['@type'] === 'BreadcrumbList');
assert.strictEqual(article.inLanguage, 'fr');
assert.strictEqual(article.dateModified, '2026-08-16');
assert.strictEqual(faq.mainEntity.length, 4);
assert.strictEqual(breadcrumb.itemListElement[0].name, 'Accueil');

assert.strictEqual((html.match(/<details class="faq-item">/g) || []).length, 4);
assert.doesNotMatch(html, /data-explicit-language-fallback|data-language-fallback-notice|afrotools-language-fallback/i);
assert.doesNotMatch(html, /(?:href|src)="\/fr\/blog\/assets\//i);
assert.doesNotMatch(html, /By Equipe|Published Mar|13 min read|Is M-Pesa|Which mobile money platform|Compare transfer cost|We build free/i);
assert.doesNotMatch(html, /200 millions de comptes|50 millions d'utilisateurs|60 millions d'utilisateurs|30 milliards de dollars par mois/i);
assert.doesNotMatch(fallbacks, /fr\/blog\/mobile-money-fees-africa-compared\/index\.html/);
assert.doesNotMatch(fallbacks, /fr\/tools\/suivi-carburant\/\*\*\/\*\.html/);

console.log('French mobile-money editorial source, schema, snippets, sources and fallback retirement passed');
