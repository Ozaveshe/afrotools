'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'blog-content-explosion-fr-wave1-2026-08.json'), 'utf8'));
const payrollExpansion = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'french-payroll-expansion-2026-08.json'), 'utf8'));
const registry = fs.readFileSync(path.join(root, 'assets', 'js', 'components', 'tool-registry.js'), 'utf8');
const frenchManifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'localization', 'fr-blog-manifest.json'), 'utf8'));
const contentManifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'blog-article-manifest.json'), 'utf8'));
const hub = fs.readFileSync(path.join(root, 'fr', 'blog', 'index.html'), 'utf8');
const feed = fs.readFileSync(path.join(root, 'fr', 'blog', 'feed.xml'), 'utf8');
const report = fs.readFileSync(path.join(root, 'reports', 'blog-seo-opportunities-fr-wave1-2026-08.md'), 'utf8');

const routeApi = require('../scripts/lib/route-contract');
const routeGraph = routeApi.buildRouteGraph();
function relatedQuotedAttribute(tag, name) {
  const values = [...tag.matchAll(/\s+([^\s=/>]+)\s*=\s*(["'])([\s\S]*?)\2/g)].filter(match => match[1].toLowerCase() === name);
  assert.ok(values.length <= 1, 'Duplicate actual related-link attribute: ' + name);
  return values.length ? values[0][3] : null;
}
function assertCanonicalRelatedLinks(html, related, graph, label) {
  assert.ok(related.length >= 2, label + ': au moins deux liens associés requis');
  const actual = [...html.matchAll(/<a(?=\s|>)(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)].map(match => relatedQuotedAttribute(match[0], 'href')).filter(value => value !== null);
  const expected = related.map(([href]) => routeApi.rewriteInternalHref(graph, href));
  assert.ok(new Set(expected).size >= 2, label + ': liens associés distincts requis');
  for (let index = 0; index < expected.length; index += 1) {
    const href = expected[index];
    const record = routeApi.getRouteRecord(graph, new URL(href, 'https://afrotools.com').pathname);
    assert.ok(record && record.state === 'page', label + ': destination associée inconnue');
    assert.ok(actual.includes(href), label + ': lien associé canonique manquant ' + href);
    if (href !== related[index][0]) assert.ok(!actual.includes(related[index][0]), label + ': ancien alias associé encore présent');
  }
}
// Closed controls call the genuine resolver with a declared synthetic route graph.
const relatedFixtureGraph = { routes: [
  { route: '/fr/blog/old/', state: 'redirect', statusCode: 301, redirectTarget: '/blog/native/' },
  { route: '/blog/native/', state: 'page', locale: 'fr' },
  { route: '/fr/blog/other/', state: 'page', locale: 'fr' }
] };
const relatedFixture = [['/fr/blog/old/', 'Premier'], ['/fr/blog/other/', 'Second']];
const relatedLinks = (first, second = '/fr/blog/other/') => '<a href="' + first + '">Premier</a><a href="' + second + '">Second</a>';
assertCanonicalRelatedLinks(relatedLinks('/blog/native/'), relatedFixture, relatedFixtureGraph, 'canonical-only');
assertCanonicalRelatedLinks(relatedLinks('/blog/native/'), [['/blog/native/', 'Premier'], relatedFixture[1]], relatedFixtureGraph, 'unchanged-page');
assertCanonicalRelatedLinks(relatedLinks('/blog/native/?q=1#proof'), [['/fr/blog/old/?q=1#proof', 'Premier'], relatedFixture[1]], relatedFixtureGraph, 'suffix-preserved');
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/fr/blog/old/'), relatedFixture, relatedFixtureGraph, 'stale-alias'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native-extra/'), relatedFixture, relatedFixtureGraph, 'wrong-target'));
assert.throws(() => assertCanonicalRelatedLinks('/blog/native/ /fr/blog/other/', relatedFixture, relatedFixtureGraph, 'text-is-not-link'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/'), [relatedFixture[0], relatedFixture[0]], relatedFixtureGraph, 'duplicate-declared-target'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/missing/'), [['/blog/missing/', 'Premier'], relatedFixture[1]], relatedFixtureGraph, 'unknown-declared-target'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/'), [['/fr/blog/old/?q=1#proof', 'Premier'], relatedFixture[1]], relatedFixtureGraph, 'suffix-lost'));
assertCanonicalRelatedLinks(relatedLinks('/blog/native/').replace('href="/blog/native/"', 'data-href="/blog/wrong/" href = "/blog/native/"'), relatedFixture, relatedFixtureGraph, 'actual-attribute-with-spacing');
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/').replace('href="/blog/native/"', 'data-href="/blog/native/"'), relatedFixture, relatedFixtureGraph, 'data-href-is-not-href'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/').replace('href="/blog/native/"', 'data-href="/blog/native/" href="/blog/wrong/"'), relatedFixture, relatedFixtureGraph, 'data-href-cannot-mask-wrong-href'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/').replace('href="/blog/native/"', "data-note=' href=\"/blog/native/\"' href=\"/blog/wrong/\""), relatedFixture, relatedFixtureGraph, 'quoted-value-is-not-attribute'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/').replace('href="/blog/native/"', 'href="/blog/native/" href="/blog/wrong/"'), relatedFixture, relatedFixtureGraph, 'duplicate-href-is-ambiguous'));
assert.throws(() => assertCanonicalRelatedLinks(relatedLinks('/blog/native/').replace('<a href=', '<a-extra href=').replace('</a>', '</a-extra>'), relatedFixture, relatedFixtureGraph, 'custom-tag-is-not-anchor'));
console.log('Canonical related-link controls: 4 positive and 11 negative passed.');


function routeExists(href) {
  const rel = href.replace(/^\//, '').replace(/\/$/, '');
  return fs.existsSync(path.join(root, rel, 'index.html')) || fs.existsSync(path.join(root, `${rel}.html`));
}

assert.strictEqual(data.articles.length + payrollExpansion.articles.length, 15, 'le portefeuille français doit contenir les 10 articles initiaux et 5 extensions paie');
assert.match(data.method.scoreType, /qualitatif/i, 'le score doit rester explicitement qualitatif');
assert.match(data.method.dataGap, /Search Console/i, 'la limite des données de mots-clés doit rester visible');
assert.strictEqual(new Set(data.articles.map((article) => article.slug)).size, 10, 'les slugs doivent être uniques');
assert.strictEqual(new Set(data.articles.map((article) => article.keyword.toLocaleLowerCase('fr'))).size, 10, 'les mots-clés principaux doivent être uniques');
assert.strictEqual(new Set(data.articles.map((article) => article.tool[0])).size, 10, 'chaque article doit transmettre vers une app française distincte');

for (const article of data.articles) {
  const file = path.join(root, 'fr', 'blog', article.slug, 'index.html');
  assert.ok(fs.existsSync(file), `${article.slug}: article généré manquant`);
  const html = fs.readFileSync(file, 'utf8');
  const bodyMatch = html.match(/<article class="article-body">([\s\S]*?)<\/article>/);
  assert.ok(bodyMatch, `${article.slug}: corps d’article manquant`);
  const text = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  assert.ok(words >= 1400, `${article.slug}: ${words} mots, sous le seuil éditorial de 1 400 mots`);
  assert.ok(article.title.length <= 68, `${article.slug}: titre de plus de 68 caractères`);
  assert.ok(article.description.length >= 120 && article.description.length <= 165, `${article.slug}: description hors de la plage 120-165 caractères`);
  assert.ok(article.opportunityScore >= 75 && article.opportunityScore <= 100, `${article.slug}: score hors échelle qualitative`);
  assert.ok(['élevée', 'moyenne-élevée'].includes(article.opportunityConfidence), `${article.slug}: confiance manquante`);
  assert.match(article.cannibalization, /faible/i, `${article.slug}: garde contre la cannibalisation manquante`);
  assert.strictEqual((html.match(/<h1>/g) || []).length, 1, `${article.slug}: un seul H1 est requis`);
  assert.ok(html.includes(`<h1>${article.title.replace(/&/g, '&amp;')}</h1>`), `${article.slug}: H1 différent du brief`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com/fr/blog/${article.slug}/">`), `${article.slug}: canonical incorrecte`);
  assert.ok(html.includes(`<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/blog/${article.slug}/">`), `${article.slug}: hreflang français manquant`);
  assert.ok(html.includes(article.tool[0]), `${article.slug}: lien vers l’app manquant`);
  assert.ok(registry.includes(`href: '${article.tool[0]}'`), `${article.slug}: app absente du registre`);
  assert.ok(routeExists(article.tool[0]), `${article.slug}: route de l’app introuvable`);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'img', 'tools', `${article.image}.webp`)), `${article.slug}: image sociale manquante`);
  assert.ok(article.sources.length >= 3 && article.sources.every(([href]) => href.startsWith('https://') && html.includes(href)), `${article.slug}: couverture des sources insuffisante`);
  assertCanonicalRelatedLinks(html, article.related, routeGraph, article.slug);
  assert.ok(html.includes(`<strong>Sources relues le ${data.reviewedLabel}.</strong>`), `${article.slug}: date de revue des sources manquante`);
  assert.ok(html.includes('"@type":"Article"'), `${article.slug}: schéma Article manquant`);
  assert.ok(html.includes('"@type":"BreadcrumbList"'), `${article.slug}: schéma Breadcrumb manquant`);
  assert.ok(html.includes('"@type":"FAQPage"'), `${article.slug}: schéma FAQ manquant`);
  assert.ok(html.includes('"inLanguage":"fr"'), `${article.slug}: langue du schéma incorrecte`);
  assert.strictEqual((html.match(/class="faq-item"/g) || []).length, 5, `${article.slug}: cinq FAQ sont requises`);
  assert.ok(!/[—�]/.test(html), `${article.slug}: tiret cadratin ou caractère de remplacement détecté`);
  assert.ok(!/(?:Ã.|Â.|â€)/.test(html), `${article.slug}: mojibake détecté`);
  assert.ok(!/révolutionnaire|changer la donne|dans le monde numérique actuel/i.test(text), `${article.slug}: cliché marketing détecté`);
  assert.ok(frenchManifest.articles.some((row) => row.slug === article.slug && row.image === article.image), `${article.slug}: manifeste français incomplet`);
  assert.ok(contentManifest.articles.some((row) => row.file === `fr/blog/${article.slug}/index.html` && row.locale === 'fr' && row.publicationStatus === 'published'), `${article.slug}: manifeste de contenu incomplet`);
  assert.ok(hub.includes(`/fr/blog/${article.slug}/`), `${article.slug}: carte absente du hub français`);
  assert.ok(feed.includes(`https://afrotools.com/fr/blog/${article.slug}/`), `${article.slug}: article absent du flux français`);
  assert.ok(report.includes(`| ${article.keyword} |`), `${article.slug}: ligne absente du rapport d’opportunités`);
}

for (const article of payrollExpansion.articles) {
  const file = path.join(root, 'fr', 'blog', article.slug, 'index.html');
  assert.ok(fs.existsSync(file), `${article.slug}: extension paie générée manquante`);
  const html = fs.readFileSync(file, 'utf8');
  const bodyMatch = html.match(/<article class="article-body">([\s\S]*?)<\/article>/);
  assert.ok(bodyMatch, `${article.slug}: corps d’article manquant`);
  const words = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  assert.ok(words >= 1400, `${article.slug}: ${words} mots, sous le seuil éditorial de 1 400 mots`);
  assert.ok(article.title.length <= 68, `${article.slug}: titre de plus de 68 caractères`);
  assert.ok(article.description.length >= 120 && article.description.length <= 165, `${article.slug}: description hors de la plage 120-165 caractères`);
  assert.ok(routeExists(article.tool[0]), `${article.slug}: route de l’app introuvable`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com/fr/blog/${article.slug}/">`), `${article.slug}: canonical incorrecte`);
  assert.ok(html.includes(`<strong>Sources relues le ${payrollExpansion.reviewedLabel}.</strong>`), `${article.slug}: revue de sources manquante`);
  assert.ok([article.taxSource, article.socialSource, article.processSource].every(([href]) => html.includes(href)), `${article.slug}: source officielle manquante`);
  assert.ok(html.includes('"@type":"Article"') && html.includes('"@type":"FAQPage"'), `${article.slug}: schémas structurés incomplets`);
  assert.ok(frenchManifest.articles.some((row) => row.slug === article.slug), `${article.slug}: manifeste français incomplet`);
  assert.ok(contentManifest.articles.some((row) => row.file === `fr/blog/${article.slug}/index.html`), `${article.slug}: manifeste de contenu incomplet`);
  assert.ok(hub.includes(`/fr/blog/${article.slug}/`), `${article.slug}: carte absente du hub français`);
  assert.ok(feed.includes(`https://afrotools.com/fr/blog/${article.slug}/`), `${article.slug}: article absent du flux français`);
}

assert.ok(hub.includes('/blog/assets/css/blog.css'), 'le hub français doit utiliser la feuille de style blog partagée existante');
assert.ok(hub.includes('/blog/assets/css/blog-platform.css'), 'le hub français doit utiliser les améliorations de plateforme partagées');
assert.ok(!hub.includes('/fr/blog/assets/css/blog.css'), 'le hub français ne doit pas pointer vers un fichier CSS inexistant');
for (const route of ['/fr/salary-tax/', '/fr/vat-business-tax/', '/fr/fintech/', '/fr/energy/', '/fr/document-pdf/']) {
  assert.ok(hub.includes(`href="${route}"`), `${route}: dossier d’autorité absent du hub français`);
  assert.ok(routeExists(route), `${route}: route du dossier d’autorité introuvable`);
}

console.log('French blog portfolio: 15 articles and 5 authority clusters passed editorial, SEO, source, app, image, manifest, hub and feed checks.');
