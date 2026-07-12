'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

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
const legacyTerms = read('fr/terms/index.html');
assert(/noindex,follow/.test(legacyTerms) && /url=\/fr\/terms-of-use\//.test(legacyTerms), 'Legacy French terms page must be a non-indexable direct handoff');

const privacy = read('fr/privacy/index.html');
assert(/<h1>Politique de confidentialité<\/h1>/.test(privacy), 'French privacy policy must be native French content');
assert(!/<iframe/i.test(privacy), 'French privacy policy must not wrap the English policy in an iframe');
assert(/Calculateur local/.test(privacy) && /Assistant IA/.test(privacy) && /Compte et synchronisation/.test(privacy), 'French privacy policy must distinguish feature data flows');

const policy = JSON.parse(read('data/registry/route-policy.json'));
const redirect = policy.canonicalDecisions.find((item) => item.source === '/fr/terms/');
assert(redirect && redirect.destination === '/fr/terms-of-use/' && redirect.statusCode === 301, 'Route policy must permanently redirect French terms in one hop');

const manifest = JSON.parse(read('data/localization/fr-blog-manifest.json'));
const blog = read('fr/blog/index.html');
assert(manifest.articles.length > 0 && manifest.articles.every((item) => blog.includes(`/fr/blog/${item.slug}/`)), 'French blog must be generated from the explicit French manifest');
assert(!/Published guides|Tool-led articles|All Articles|Read article|Loading articles/i.test(blog), 'French blog controls and status copy must be French');
assert(fs.existsSync(path.join(ROOT, 'fr/blog/feed.xml')), 'French blog must publish a locale-specific feed');

const home = read('fr/index.html');
assert(/data-registry-count="tools.live_experiences"/.test(home), 'French homepage tool total must consume the canonical registry selector');
for (const selector of ['countries.published', 'categories.published', 'languages.site_published']) {
  assert(home.includes(`data-registry-count="${selector}"`), `French homepage must consume ${selector}`);
}
assert(!/Nigeria PAYE Calculator|Suggestions, examples|Calculate →|Feature catégories|Chaque outil sous 100 Ko|Fonctionne en 2G/i.test(home), 'French homepage must not retain mixed-language legacy showcase or unsupported performance claims');
assert(/Le pays change la juridiction/.test(home) && /La langue change l’interface/.test(home), 'French homepage must keep country and language as separate dimensions');

const directory = read('fr/all-tools/index.html');
assert(/data-registry-count="tools.locale.fr.published"/.test(directory), 'French directory headline count must use the named French registry selector');
assert(/t\.lang === 'fr'/.test(directory) && /startsWith\('\/fr\/'\)/.test(directory), 'French directory must render only records with genuine French routes');
assert(/<div class="tools-grid" id="toolsGrid">\s*<a href="\/fr\/salary-tax\//.test(directory), 'French directory must provide useful no-JavaScript navigation before hydration');
assert(!/>All <|>Live <|>Sort:|>Health<|>Engineering<|>Trade<|>Legal<|>Language<|>Energy<|>Career</i.test(directory), 'French directory controls and category labels must not expose English UI');

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
