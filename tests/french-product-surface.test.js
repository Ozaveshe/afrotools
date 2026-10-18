'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const routeApi = require('../scripts/lib/route-contract');
const routeGraph = routeApi.buildRouteGraph();
const escapeCardTitle = value => String(value).replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
function cardQuotedAttribute(tag, name) {
  const values = [...tag.matchAll(/\s+([^\s=/>]+)\s*=\s*(["'])([\s\S]*?)\2/g)].filter(match => match[1].toLowerCase() === name);
  assert.ok(values.length <= 1, 'Duplicate actual article-card attribute: ' + name);
  return values.length ? values[0][3] : null;
}
function cardOpeningTag(card) {
  const match = card.match(/^<article(?=\s|>)(?:[^"'<>]|"[^"]*"|'[^']*')*>/i);
  assert(match, 'Actual article opening tag required');
  return match[0];
}
function cardHasMarker(opening) {
  if (cardQuotedAttribute(opening, 'data-blog-card') !== null) return true;
  const withoutQuotedAttributes = opening.replace(/\s+([^\s=/>]+)\s*=\s*(["'])([\s\S]*?)\2/g, '');
  return /\sdata-blog-card(?=\s|>)/i.test(withoutQuotedAttributes);
}
function assertCanonicalManifestCards(html, entries, graph) {
  const cards = [...html.matchAll(/<article(?=\s|>)(?:[^"'<>]|"[^"]*"|'[^']*')*>[\s\S]*?<\/article\s*>/gi)].map(match => match[0]).filter(card => cardHasMarker(cardOpeningTag(card)));
  assert.strictEqual(cards.length, entries.length, 'French manifest and article-card counts must match');
  const identities = new Set();
  for (const item of entries) {
    const href = routeApi.rewriteInternalHref(graph, '/fr/blog/' + item.slug + '/');
    assert(!identities.has(href), 'French manifest must not duplicate a canonical card identity');
    identities.add(href);
    const destination = routeApi.getRouteRecord(graph, new URL(href, 'https://afrotools.com').pathname);
    assert(destination && destination.state === 'page' && destination.locale === 'fr', 'French card must reach its genuine native French page');
    const matching = cards.filter(card => {
      const mainLink = [...card.matchAll(/<a(?=\s|>)(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)].map(match => match[0]).find(tag => {
        const classes = cardQuotedAttribute(tag, 'class');
        return classes !== null && classes.split(/\s+/).includes('localized-blog-card__link');
      });
      return mainLink && cardQuotedAttribute(mainLink, 'href') === href;
    });
    assert.strictEqual(matching.length, 1, 'Exactly one French card must own canonical destination ' + href);
    const card = matching[0], opening = cardOpeningTag(card);
    assert.strictEqual(cardQuotedAttribute(opening, 'data-locale'), 'fr', 'French card locale must be explicit');
    assert(card.includes('<h3>' + escapeCardTitle(item.title) + '</h3>'), 'French card must retain the manifest/source title identity');
  }
}
const cardFixtureGraph = { routes: [
  { route: '/fr/blog/old/', state: 'redirect', statusCode: 301, redirectTarget: '/blog/native/' },
  { route: '/blog/native/', state: 'page', locale: 'fr' },
  { route: '/fr/blog/other/', state: 'page', locale: 'fr' }
] };
const cardFixtureEntries = [{ slug: 'old', title: 'Premier & guide' }, { slug: 'other', title: 'Second guide' }];
const fixtureCard = (href, title, locale = 'fr') => '<article data-blog-card data-locale="' + locale + '"><a class="localized-blog-card__link" href="' + href + '"><h3>' + escapeCardTitle(title) + '</h3></a></article>';
const firstCard = fixtureCard('/blog/native/', cardFixtureEntries[0].title), secondCard = fixtureCard('/fr/blog/other/', cardFixtureEntries[1].title);
assertCanonicalManifestCards(firstCard + secondCard, cardFixtureEntries, cardFixtureGraph);
assertCanonicalManifestCards(secondCard, [cardFixtureEntries[1]], cardFixtureGraph);
assert.throws(() => assertCanonicalManifestCards(fixtureCard('/fr/blog/old/', cardFixtureEntries[0].title) + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(fixtureCard('/blog/native-extra/', cardFixtureEntries[0].title) + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard + firstCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards('<aside>/blog/native/</aside>' + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(fixtureCard('/blog/native/', cardFixtureEntries[0].title, 'en') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(fixtureCard('/blog/native/', 'Wrong title') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('localized-blog-card__link', 'unrelated-link') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard + secondCard, cardFixtureEntries, { routes: cardFixtureGraph.routes.map(row => row.route === '/blog/native/' ? { ...row, locale: 'en' } : row) }));
assert.throws(() => assertCanonicalManifestCards(firstCard + secondCard, [{ slug: 'missing', title: 'Missing' }, cardFixtureEntries[1]], cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard + secondCard, [cardFixtureEntries[0], cardFixtureEntries[0]], cardFixtureGraph));
assertCanonicalManifestCards(firstCard.replace('localized-blog-card__link', 'leading localized-blog-card__link trailing') + secondCard, cardFixtureEntries, cardFixtureGraph);
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('localized-blog-card__link', 'fake-localized-blog-card__link') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('localized-blog-card__link', 'localized-blog-card__link-extra') + secondCard, cardFixtureEntries, cardFixtureGraph));
assertCanonicalManifestCards(firstCard.replace('class="localized-blog-card__link"', 'class = "localized-blog-card__link"').replace('href="/blog/native/"', 'href = "/blog/native/"') + secondCard, cardFixtureEntries, cardFixtureGraph);
assertCanonicalManifestCards(firstCard.replace('class="localized-blog-card__link"', 'data-class="wrong" class="localized-blog-card__link"') + secondCard, cardFixtureEntries, cardFixtureGraph);
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('class="localized-blog-card__link"', 'data-class="localized-blog-card__link"') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('href="/blog/native/"', 'data-href="/blog/native/" href="/blog/wrong/"') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('href="/blog/native/"', 'data-href="/blog/native/"') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('data-locale="fr"', 'data-data-locale="fr"') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('data-blog-card', 'fake-data-blog-card') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('data-blog-card', 'data-blog-card-extra') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('data-blog-card', 'data-note=" data-blog-card "') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('class="localized-blog-card__link"', "data-note=' class=\"localized-blog-card__link\"' class=\"wrong\"") + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('href="/blog/native/"', 'href="/blog/native/" href="/blog/wrong/"') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('class="localized-blog-card__link"', 'class="localized-blog-card__link" class="wrong"') + secondCard, cardFixtureEntries, cardFixtureGraph));
assert.throws(() => assertCanonicalManifestCards(firstCard.replace('<article ', '<article-extra ').replace('</article>', '</article-extra>') + secondCard, cardFixtureEntries, cardFixtureGraph));
console.log('Canonical manifest-card controls: 5 positive and 24 negative passed.');

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const allHtml = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(dir, entry.name);
  if (entry.isDirectory()) return allHtml(target);
  return entry.isFile() && entry.name.endsWith('.html') ? [target] : [];
});

for (const file of allHtml(path.join(ROOT, 'fr'))) {
  const html = fs.readFileSync(file, 'utf8');
  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i);
  const ogUrl = html.match(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i);
  if (canonical && ogUrl) {
    assert.strictEqual(ogUrl[1], canonical[1], `${path.relative(ROOT, file)} og:url must match its canonical URL`);
  }
}

const gh = read('fr/tools/gh-wht/index.html');
assert(!/<\/style>\s*\.gh-seo/.test(gh), 'Ghana WHT must not expose CSS after a prematurely closed style element');
assert(!/premium|canonical, hreflang|SEO francophone/i.test(gh), 'Ghana WHT must not expose implementation commentary');

const pension = read('fr/tools/ng-pension/index.html');
assert(!/localisation DOM|moteur source|SEO local/i.test(pension), 'Nigeria pension must use product language, not localization implementation notes');
assert(!/<iframe/i.test(pension) && /NgPensionEngine\.calculateCPS/.test(pension), 'Nigeria pension must use the deterministic engine through a native French form');

for (const rel of ['fr/salary-tax/index.html', 'fr/salary-tax/francophone/index.html', 'fr/salary-tax/paye/index.html']) {
  assert(!/SEO plus propre|structure SEO|architecture produit et SEO/i.test(read(rel)), `${rel} must not expose SEO planning copy`);
}

const terms = read('fr/terms-of-use/index.html');
assert(/<html\b[^>]*\blang="fr"/.test(terms) && /<h1>Conditions d’utilisation<\/h1>/.test(terms), 'French terms must be a native French page');
assert(/rel="canonical" href="https:\/\/afrotools.com\/fr\/terms-of-use\/"/.test(terms), 'French terms canonical must be self-referencing');
assert(/hreflang="sw" href="https:\/\/afrotools.com\/sw\/masharti\/"/.test(terms), 'French terms must reciprocate the native Swahili terms page');
const legacyTerms = read('fr/terms/index.html');
assert(/noindex,follow/.test(legacyTerms) && /url=\/fr\/terms-of-use\//.test(legacyTerms), 'Legacy French terms page must be a non-indexable direct handoff');

const privacy = read('fr/privacy/index.html');
assert(/<h1>Politique de confidentialité<\/h1>/.test(privacy), 'French privacy policy must be native French content');
assert(!/<iframe/i.test(privacy), 'French privacy policy must not wrap the English policy in an iframe');
assert(/hreflang="sw" href="https:\/\/afrotools.com\/sw\/faragha\/"/.test(privacy), 'French privacy must reciprocate the native Swahili privacy page');
assert(/Calculateur local/.test(privacy) && /Assistant IA/.test(privacy) && /Compte et synchronisation/.test(privacy), 'French privacy policy must distinguish feature data flows');

const policy = JSON.parse(read('data/registry/route-policy.json'));
const redirect = policy.canonicalDecisions.find((item) => item.source === '/fr/terms/');
assert(redirect && redirect.destination === '/fr/terms-of-use/' && redirect.statusCode === 301, 'Route policy must permanently redirect French terms in one hop');

const manifest = JSON.parse(read('data/localization/fr-blog-manifest.json'));
const blog = read('fr/blog/index.html');
assert(manifest.articles.length > 0, 'French manifest must contain published article identities');
const manifestCardEntries = manifest.articles.map(item => {
  const source = read('fr/blog/' + item.slug + '/index.html');
  const title = item.title || (source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert(title, 'French card source title must be present: ' + item.slug);
  return { slug: item.slug, title };
});
assertCanonicalManifestCards(blog, manifestCardEntries, routeGraph);
assert(!/Published guides|Tool-led articles|All Articles|Read article|Loading articles/i.test(blog), 'French blog controls and status copy must be French');
assert(fs.existsSync(path.join(ROOT, 'fr/blog/feed.xml')), 'French blog must publish a locale-specific feed');

const home = read('fr/index.html');
assert(/data-registry-count="tools.live_experiences"/.test(home), 'French homepage tool total must consume the canonical registry selector');
for (const selector of ['countries.published', 'categories.published', 'languages.site_published']) {
  assert(home.includes(`data-registry-count="${selector}"`), `French homepage must consume ${selector}`);
}
assert(!/Nigeria PAYE Calculator|Suggestions, examples|Calculate →|Feature catégories|Chaque outil sous 100 Ko|Fonctionne en 2G/i.test(home), 'French homepage must not retain mixed-language legacy showcase or unsupported performance claims');
assert(/Le pays change la juridiction/.test(home) && /La langue change l’interface/.test(home), 'French homepage must keep country and language as separate dimensions');

assert(/\/assets\/css\/fr-homepage\.css/.test(home), 'French homepage must load its product-surface stylesheet');
assert.strictEqual((home.match(/class="fr-home-category"/g) || []).length, 32, 'French homepage must expose all 32 canonical category choices');
for (const schemaType of ['WebSite', 'SearchAction', 'Organization', 'CollectionPage']) {
  assert(home.includes(`"@type":"${schemaType}"`), `French homepage must expose ${schemaType} structured data`);
}
assert(!/"@type":"FAQPage"/.test(home), 'French homepage must not publish FAQ rich-result markup');
assert(/action="\/fr\/all-tools\/"[^>]*method="get"/.test(home) && /name="q"/.test(home), 'French homepage search must use the crawlable French directory query contract');

const directory = read('fr/all-tools/index.html');
assert(/data-registry-count="tools.locale.fr.published"/.test(directory), 'French directory headline count must use the named French registry selector');
assert(/t\.lang === 'fr'/.test(directory) && /startsWith\('\/fr\/'\)/.test(directory), 'French directory must render only records with genuine French routes');
assert(/<div class="tools-grid" id="toolsGrid">[\s\S]*?PROGRESSIVE_DIRECTORY_FALLBACK_START[\s\S]*?<a href="\/fr\/[^"]+"[^>]*data-directory-record/.test(directory), 'French directory must provide useful no-JavaScript navigation before hydration');
assert(!/>All <|>Live <|>Sort:|>Health<|>Engineering<|>Trade<|>Legal<|>Language<|>Energy<|>Career</i.test(directory), 'French directory controls and category labels must not expose English UI');
assert(/params\.get\('q'\)/.test(directory) && /input\.value\s*=\s*initialQuery/.test(directory), 'French directory must hydrate the homepage q search without dropping the user query');

const prepaid = read('fr/tools/compteur-prepaye/central-african-republic/index.html');
assert(/République centrafricaine/.test(prepaid), 'Central African Republic prepaid page must use the French country name');
assert(!/>Recharge Amount<|>Units Received<|>Estimated Days<|What You Need to Know|<strong>Disclaimer:<\/strong>/i.test(prepaid), 'Representative prepaid page must not expose English calculator UI');

const solar = read('fr/tools/roi-solaire/madagascar/index.html');
assert(!/Installationationation|peak sun (?:hrs|hours)\/day|>Save<|starts with grid bills/i.test(solar), 'Madagascar solar page must not expose malformed or English planning copy');

const pdfHub = read('fr/document-pdf/index.html');
assert(/hreflang="fr" href="https:\/\/afrotools.com\/fr\/document-pdf\/"/.test(pdfHub), 'French PDF hub hreflang must target the real French hub');
assert(!/fr\/docs\/pdf-tools-hub/.test(pdfHub), 'French PDF hub must not advertise a blocked legacy destination');

const footer = read('assets/js/components/footer.js');
assert(/fr: 'Adresse e-mail'/.test(footer), 'French footer email label must be localized');
assert(/hrefFr: '\/fr\/terms-of-use\/'/.test(footer), 'French footer must link to canonical French terms');

const assistant = read('assets/js/components/site-assistant.js');
assert(/const UI_COPY_FR/.test(assistant) && /const QUICK_LINKS_FR/.test(assistant), 'Site assistant must provide French controls and French canonical links');
assert(/son texte peut être transmis au fournisseur d’IA/.test(assistant), 'French AI entry must disclose possible provider transmission before input');

const registrySource = read('assets/js/components/tool-registry.js');
const frenchRows = registrySource.split(/\r?\n/).filter((line) => /lang:\s*['"]fr['"]/.test(line));
for (const line of frenchRows) {
  assert(!/Version française premium|SEO propre|routes? wrapper|localisation DOM|moteur source/i.test(line), `French registry row exposes implementation commentary: ${line.slice(0, 120)}`);
}

console.log('French product surface tests passed.');
