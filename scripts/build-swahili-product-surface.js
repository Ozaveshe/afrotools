#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeReleaseOwnedHtml } = require('./lib/release-owned-html-normalizer');
const { buildCanonicalRegistry, getSelector } = require('./lib/canonical-registry');
const {
  repairPdfTranslatorConsent,
  repairPidginTranslatorConsent
} = require('./lib/swahili-translation-consent-repairs');
const {
  renderAbout,
  renderContact,
  renderFaq,
  renderCookies,
  enhanceLegalSurface
} = require('./lib/localized-institutional-pages');
const { renderAll: renderSecondaryPages } = require('./lib/localized-secondary-pages');
const { SWAHILI_CATEGORIES } = require('./lib/swahili-category-directory');
const { enhanceCategory, ROUTES: LOCALIZED_CATEGORY_ROUTES } = require('./lib/localized-category-standard');
const { countryRows: localizedCountryRows, enhanceCountry } = require('./lib/localized-country-standard');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim()).filter(Boolean)) : null;
const changed = [];
const failures = [];
const GENERATED_HTML = new Set([
  'sw/index.html',
  'sw/faragha/index.html',
  'sw/masharti/index.html',
  'sw/msaada/index.html',
  'sw/bei/index.html',
  'sw/auth/index.html',
  'sw/dashboard/index.html',
  'sw/vault/index.html'
  ,'sw/kuhusu/index.html'
  ,'sw/wasiliana/index.html'
  ,'sw/maswali-ya-mara-kwa-mara/index.html'
  ,'sw/vidakuzi/index.html'
  ,'sw/tangaza/index.html'
  ,'sw/tafuta/index.html'
  ,'sw/pendekeza-zana/index.html'
  ,'sw/makundi/index.html'
  ,'sw/mabadiliko/index.html'
]);
const GENERATED_ALTERNATES = {
  'sw/faragha/index.html': [
    '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/privacy/">'
  ],
  'sw/masharti/index.html': [
    '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/terms-of-use/">'
  ],
  'sw/msaada/index.html': [
    '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/msaada/">',
    '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/sw/msaada/">'
  ],
  'sw/bei/index.html': [
    '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/bei/">',
    '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/pricing/">'
  ]
};

function filePath(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(filePath(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function normalize(value) { return String(value).normalize('NFC').replace(/\r\n/g, '\n'); }
function routeToHtml(route) {
  return `${String(route).replace(/^\//, '').replace(/\/?$/, '/')}index.html`;
}
const acceptedParityHtml = new Set(
  readJson('data/audits/swahili-free-app-acceptance.json').entries
    .filter((entry) => entry.status === 'accepted')
    .map((entry) => routeToHtml(entry.swahiliRoute))
);
const sportsTravelParityHtml = new Set(
  readJson('data/localization/sw-sports-travel-parity-manifest.json').rows
    .map((row) => routeToHtml(row.swahiliRoute))
    .concat([
      'sw/michezo/index.html',
      'sw/usafiri-utalii/index.html'
    ])
);
function ownedByScopedParity(rel) {
  if (acceptedParityHtml.has(rel) || sportsTravelParityHtml.has(rel)) return true;
  if (!rel.startsWith('sw/') || !fs.existsSync(filePath(rel))) return false;
  const html = read(rel);
  return [
    'scripts/build-sw-legal-government-insurance-parity.js',
    'scripts/build-sw-small-business-parity.js',
    'scripts/build-sw-web-text-codecs-family.js',
    'scripts/build-swahili-hr-payroll-six.js',
    'scripts/build-localized-discovery-pages.js',
    'scripts/build-localized-ai-api-pages.js'
  ].some((owner) => html.includes(owner));
}
function withAnalyticsLoader(html) {
  if (html.includes('/assets/js/lazy-analytics.js')) return html;
  return html.replace(/<\/body>(\s*<\/html>\s*)$/i, '<script defer src="/assets/js/lazy-analytics.js"></script>\n</body>$1');
}
function withAnalyticsDisclosure(html) {
  return html
    .replace(
      'Metadata ndogo ya matumizi baada ya idhini.',
      'Kwenye kurasa zinazopimwa, GA4 inaweza kupokea ishara chache zisizo na vidakuzi wakati hifadhi ya uchanganuzi imekataliwa. Vitambulishi vya kudumu na matukio ya bidhaa huhitaji idhini.'
    )
    .replace(
      'Thamani za hesabu na maudhui ya hati hayapaswi kutumwa kama analytics.',
      'Thamani za hesabu, maudhui ya hati na vigezo vya URL havitumwi. Metadata ya kiufundi ya ombi bado inaweza kuwepo.'
    )
    .replace(
      'na Google Analytics au Microsoft Clarity baada ya idhini ya uchanganuzi.',
      'Google Analytics kwa ishara chache zisizo na vidakuzi kabla ya idhini na uchanganuzi kamili baada ya idhini, na Microsoft Clarity baada tu ya idhini ya uchanganuzi.'
    );
}
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sourceHash(value) { return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16); }

function output(rel, value) {
  if (ONLY && !ONLY.has(rel)) return;
  let normalized = normalize(value);
  for (const alternate of GENERATED_ALTERNATES[rel] || []) {
    if (!normalized.includes(alternate)) normalized = normalized.replace('</head>', `${alternate}</head>`);
  }
  if (GENERATED_HTML.has(rel)) {
    normalized = normalized
      .replace('/assets/css/design-system.css', '/assets/css/design-system.min.css')
      .replace('/assets/js/components/navbar.js', '/assets/js/components/navbar.min.js')
      .replace('/assets/js/components/footer.js', '/assets/js/components/footer.min.js');
    if (!normalized.includes('/assets/js/lib/sw-accessibility.js')) {
      normalized = normalized.replace(/<\/body>(\s*<\/html>\s*)$/i, '<script src="/assets/js/lib/sw-accessibility.js" defer></script></body>$1');
    }
    if (!/<meta\b[^>]*\bproperty=["']og:url["']/i.test(normalized)) {
      normalized = normalized.replace(
        /(<link\s+rel="canonical"\s+href="([^"]+)">)/i,
        '$1<meta property="og:url" content="$2">'
      );
    }
  }
  const file = filePath(rel);
  const current = fs.existsSync(file) ? normalize(fs.readFileSync(file, 'utf8')) : '';
  if (GENERATED_HTML.has(rel)) {
    const hash = sourceHash(normalized);
    const contentId = `sw-surface:${rel.replace(/\/index\.html$|\.html$/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
    normalized = normalized.replace('<head>', `<head><meta name="afrotools-sw-source-hash" content="${hash}"><meta name="afrotools-content-id" content="${contentId}"><meta name="afrotools-source-owner" content="scripts/build-swahili-product-surface.js">`);
    // A full build adds hashed assets, route metadata and analytics after this
    // source generator runs. Preserve that valid post-processing whenever the
    // source hash still matches, including in --write mode.
    if (current.includes(`name="afrotools-sw-source-hash" content="${hash}"`)) return;
  }
  if (current === normalized) return;
  const hasAccessibilityRuntime = (html) => /\/assets\/js\/lib\/sw-accessibility\.js(?:\?v=[a-f0-9]{8})?/i.test(html);
  if (
    ownedByScopedParity(rel) &&
    hasAccessibilityRuntime(current) === hasAccessibilityRuntime(normalized) &&
    normalizeReleaseOwnedHtml(current, { stripReleaseMetadata: true }) === normalizeReleaseOwnedHtml(normalized, { stripReleaseMetadata: true })
  ) return;
  if (!WRITE) {
    failures.push(`${rel}: generated Swahili product surface is stale`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, 'utf8');
  changed.push(rel);
}

function repair(rel, transforms) {
  if (new Set(['sw/wasiliana/index.html', 'sw/kuhusu/index.html']).has(rel)) return;
  let html = read(rel);
  for (const [from, to] of transforms) {
    html = from instanceof RegExp ? html.replace(from, to) : html.split(from).join(to);
  }
  output(rel, html);
}

function repairVisibleLanguage(rel, transforms) {
  const source = read(rel);
  let cursor = 0;
  let html = '';
  const protectedBlock = /<(script|style|noscript|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi;
  const applyTransforms = (text) => transforms.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text
  );
  const translate = (fragment) => fragment
    .replace(/(^|>)([^<]+)(?=<|$)/g, (whole, boundary, text) => `${boundary}${applyTransforms(text)}`)
    .replace(/\b(placeholder|aria-label|title|alt|value)=(['"])(.*?)\2/gi, (whole, attribute, quote, text) => (
      `${attribute}=${quote}${applyTransforms(text)}${quote}`
    ));

  for (const match of source.matchAll(protectedBlock)) {
    html += translate(source.slice(cursor, match.index));
    html += match[0];
    cursor = match.index + match[0].length;
  }
  html += translate(source.slice(cursor));
  output(rel, html);
}

function repairScriptLanguage(rel, transforms) {
  const source = read(rel);
  const html = source.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attributes, body) => {
    if (/\bsrc\s*=/i.test(attributes) || /application\/(?:ld\+json|json)/i.test(attributes) || /speculationrules/i.test(attributes)) return whole;
    const repaired = transforms.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), body);
    return `<script${attributes}>${repaired}</script>`;
  });
  output(rel, html);
}

function repairScriptBoundaries(rel) {
  let html = read(rel);
  // Restore ordinary analytics script tags that an older translation pass escaped.
  html = html.replace(
    /(<script\s+defer\s+src="\/assets\/js\/lazy-analytics\.js[^">]*"\s*>)<\\\/script>/gi,
    '$1</script>'
  );
  // PAYE print templates embed script tags inside an outer template literal. Their
  // closing tag must stay escaped or the browser terminates the calculator script.
  html = html.replace(
    /(<script\s+src="\/assets\/js\/components\/salary-benchmark-widget\.js[^">]*"\s+defer><\\\/script>\s*<script\s+defer\s+src="\/assets\/js\/lazy-analytics\.js[^">]*"\s*>)<\/script>/gi,
    '$1<\\/script>'
  );
  html = html.replace(
    /(<script\s+defer\s+src="\/assets\/js\/lazy-analytics\.js[^">]*"\s*>)<\/script>(\s*<\/body><\/html>\s*`)/gi,
    '$1<\\/script>$2'
  );
  output(rel, html);
}

function repairHomeLandmarks() {
  const rel = 'sw/index.html';
  let html = read(rel);
  const assistantScript = '<script src="/assets/js/components/site-assistant.js" defer></script>';
  const discoveryPattern = /\s*<!-- sw-religious-cultural:start -->[\s\S]*?<!-- sw-religious-cultural:end -->\s*/i;
  const discovery = (html.match(discoveryPattern) || [''])[0].trim();
  html = html.replace(discoveryPattern, '\n');

  if (!html.includes('class="sw-skip-link"')) {
    html = html.replace('</head>', '<style>.sw-skip-link{position:absolute;top:-100%;left:50%;transform:translateX(-50%);z-index:10000;padding:12px 18px;border-radius:0 0 10px 10px;background:#0f172a;color:#fff;font-weight:800;text-decoration:none}.sw-skip-link:focus{top:0}</style></head>');
    html = html.replace('<body class="top-level-page-ui-refresh">', '<body class="top-level-page-ui-refresh">\n<a class="sw-skip-link" href="#main-content">Ruka hadi maudhui makuu</a>');
  }
  if (!html.includes('/assets/js/components/site-assistant')) {
    html = html.replace('</head>', `${assistantScript}</head>`);
  }
  if (!/<main\b[^>]*id="main-content"/i.test(html)) {
    html = html.replace('<afro-navbar theme="dark"></afro-navbar>', '<afro-navbar theme="dark"></afro-navbar>\n<main id="main-content">');
  }

  const discoveryMarkup = discovery ? `${discovery}\n` : '';
  if (/<\/main>\s*<afro-footer>/i.test(html)) {
    html = html.replace(/\s*<\/main>\s*(<afro-footer>)/i, `\n${discoveryMarkup}</main>\n$1`);
  } else {
    html = html.replace('<afro-footer></afro-footer>', `${discoveryMarkup}</main>\n<afro-footer></afro-footer>`);
  }
  output(rel, html);
}

function ensureAccessibilityRuntime(rel) {
  const canonicalScript = '<script src="/assets/js/lib/sw-accessibility.js" defer></script>';
  const runtimePattern = /[ \t]*<script\b[^>]*\bsrc=["']\/assets\/js\/lib\/sw-accessibility\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>[ \t]*\r?\n?/gi;
  let html = read(rel);
  const existingScripts = html.match(runtimePattern) || [];
  // SEO and analytics post-processing may place another deferred script after
  // this runtime. A single valid runtime is already correct; moving it on every
  // surface check would make the pre-SEO generator and final build disagree.
  if (existingScripts.length === 1) return;
  const versionedScript = existingScripts.find((tag) => /\?v=[a-f0-9]{8}/i.test(tag));
  const script = versionedScript ? versionedScript.trim() : canonicalScript;
  html = html.replace(runtimePattern, '');
  html = html.replace(/[ \t]+\r?\n(?=\s*<\/body>)/, '');
  if (!/<\/body>\s*<\/html>\s*$/i.test(html)) {
    failures.push(`${rel}: missing final body close for Swahili accessibility runtime`);
    return;
  }
  html = html.replace(/<\/body>(\s*<\/html>\s*)$/i, `  ${script}\n</body>$1`);
  output(rel, html);
}

function repairTransliterationLandmarks() {
  const rel = 'sw/zana/transliteration-ya-maandishi/index.html';
  let html = read(rel);
  if (!/<main\b[^>]*\bid=["']main["']/i.test(html)) {
    const verificationMatch = html.match(
      /<section class="localized-verification-panel"[\s\S]*?<\/section>\s*/i
    );
    const verification = verificationMatch ? verificationMatch[0].trim() : '';
    if (verification) html = html.replace(verificationMatch[0], '');
    html = html.replace(
      /(<afro-navbar\b[^>]*><\/afro-navbar>)/i,
      '$1\n<main id="main">'
    );
    if (verification) {
      html = html.replace(
        /(<section class="hero"[\s\S]*?<\/section>)/i,
        `$1\n${verification}`
      );
    }
    html = html.replace(
      /(<afro-related-tools\b)/i,
      '</main>\n$1'
    );
  }
  html = html
    .replace(
      /<title>[^<]*<\/title>/i,
      '<title>Ubadilishaji wa mifumo ya uandishi ya Afrika | AfroTools</title>'
    )
    .replace(
      /<section class="hero"><h1>[\s\S]*?<\/h1>/i,
      '<section class="hero"><h1>Ubadilishaji wa mifumo ya uandishi ya Afrika</h1>'
    );
  if (!html.includes('data-sw-language-parity-reflow')) {
    html = html.replace(
      '</head>',
      '<style data-sw-language-parity-reflow>main,.container,.card,.form-group,.output-box,.script-info,.script-card{min-width:0;max-width:100%}.card p,.card td,.card th,.script-card,.output-box{overflow-wrap:anywhere}@media(max-width:640px){.container{padding:1rem}.card{padding:1rem}[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:minmax(0,1fr)!important}.char-grid{grid-template-columns:repeat(auto-fill,minmax(42px,1fr))}}</style>\n</head>'
    );
  }
  output(rel, html);
}

function allHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allHtml(absolute));
    else if (entry.name.endsWith('.html')) out.push(absolute);
  }
  return out;
}

function visibleText(html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const glossary = readJson('data/localization/sw-product-glossary.json');
const claims = readJson('data/audits/public-claim-registry.json');
const registry = buildCanonicalRegistry();
const swTools = getSelector(registry, 'tools.locale.sw.published').value;
const liveTools = getSelector(registry, 'tools.live_experiences').value;
const countries = getSelector(registry, 'countries.published').value;
const categories = getSelector(registry, 'categories.published').value;
const languages = getSelector(registry, 'languages.site_published').value;

function claim(key) {
  const record = claims.claims.find((entry) => entry.key === key);
  const value = record && record.translations && record.translations.sw && record.translations.sw.summary;
  if (!value) throw new Error(`Missing Swahili claim translation for ${key}`);
  return value;
}

function shellHead({ title, description, canonical, robots = 'index,follow' }) {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="https://afrotools.com${canonical}"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css"><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script><style>.sw-contract-main{max-width:900px;margin:auto;padding:56px 20px 80px}.sw-contract-main h1{font-size:clamp(2rem,6vw,3.4rem);line-height:1.05}.sw-contract-main h2{margin-top:2rem}.sw-contract-main p,.sw-contract-main li{line-height:1.75}.sw-contract-note{padding:1rem 1.2rem;border-left:4px solid #0062cc;background:#eef6ff;border-radius:8px}.sw-contract-warning{padding:1rem 1.2rem;border:1px solid #f0c36d;background:#fff8e7;border-radius:12px}.sw-contract-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:1.25rem 0}.sw-contract-card{padding:18px;border:1px solid #dce5ef;border-radius:14px;background:#fff}.sw-contract-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:1.25rem}.sw-contract-actions a{display:inline-flex;min-height:44px;align-items:center;padding:10px 16px;border-radius:10px;background:#0062cc;color:#fff;font-weight:800;text-decoration:none}.sw-contract-actions a.alt{background:#fff;color:#075fb8;border:1px solid #9dc4ec}.sw-contract-table{width:100%;border-collapse:collapse;margin:1rem 0}.sw-contract-table th,.sw-contract-table td{padding:10px;border:1px solid #dce5ef;text-align:left;vertical-align:top}@media(max-width:680px){.sw-contract-grid{grid-template-columns:1fr}.sw-contract-table,.sw-contract-table tbody,.sw-contract-table tr,.sw-contract-table th,.sw-contract-table td{display:block}.sw-contract-table th{background:#f4f8fc}}</style>`;
}

function homePage() {
  const categoryCards = SWAHILI_CATEGORIES.map((category) => `<a class="fr-home-category" href="${category.href}" data-category="${category.key}"><span class="fr-home-category-mark" aria-hidden="true">${category.icon}</span><span><strong>${category.title}</strong><small>${category.description}</small></span></a>`).join('');
  const popular = [
    ['/sw/mshahara-na-kodi/paye/','Orodha ya PAYE kwa nchi'], ['/sw/zana/kikokotoo-vat/','Kikokotoo cha VAT'], ['/sw/zana/unganisha-na-gawanya-pdf/','Unganisha na gawa PDF'], ['/sw/zana/kubana-pdf/','Punguza PDF'], ['/sw/zana/kubadilisha-format-pdf/','Badilisha PDF'], ['/sw/zana/kikokotoo-cgt-kenya/','CGT ya Kenya'], ['/sw/zana/kikokotoo-wht-kenya/','WHT ya Kenya'], ['/sw/zana/kikokotoo-nssf-kenya/','NSSF ya Kenya'], ['/sw/zana/kikokotoo-ssnit-ghana/','SSNIT ya Ghana'], ['/sw/zana/kikokotoo-ushuru-wa-stampu-kenya/','Stamp Duty Kenya'], ['/sw/zana/ulinganisho-nukuu-za-kutuma-fedha/','Linganisha nukuu za remittance'], ['/sw/zana/bei-na-akili-ya-gari/','Ushahidi wa bei za magari'], ['/sw/zana/mpangaji-ramani-ya-sakafu/','Mpangaji wa sakafu'], ['/sw/zana/afrodraft-cad/','AfroDraft CAD'], ['/sw/zana/ada-za-ramani-za-usanifu/','Ada za usanifu'], ['/sw/zana/gharama-ya-uzio/','Gharama ya uzio'], ['/sw/zana/gharama-ya-dimbwi-la-kuogelea/','Gharama ya swimming pool'], ['/sw/zana/mpangaji-wa-biashara-ai/','Mpangaji wa biashara'], ['/sw/zana/mwongozo-wa-itax/','Mwongozo wa iTax'], ['/sw/zana/mwongozo-wa-etims-kra/','Mwongozo wa eTIMS'], ['/sw/zana/mwongozo-wa-sars-efiling/','Mwongozo wa SARS eFiling'], ['/sw/zana/mwongozo-wa-cnps/','Mwongozo wa CNPS'], ['/sw/zana/kirekodi-skrini/','Kirekodi skrini'], ['/sw/zana/rekodi-na-hariri-sauti/','Rekodi na hariri sauti'], ['/sw/zana/kitengeneza-flyer/','Tengeneza flyer'], ['/sw/zana/bei-za-mtayarishi/','Bei za mtayarishi'], ['/sw/zana/ratiba-ya-mtayarishi/','Ratiba ya maudhui'], ['/sw/zana/timu-ya-watayarishi/','Timu ya mtayarishi'], ['/sw/zana/boresha-linkedin/','Boresha LinkedIn'], ['/sw/zana/ukaguzi-wa-personal-brand/','Ukaguzi wa brand binafsi']
  ].map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
  const faqs = [
    ['Je, zana za msingi ni bure?','Ndiyo. Msingi wa umma unapatikana bila usajili wa kulipia. Akaunti au Pro huonyeshwa kando pale inapohitajika.'],
    ['Je, matokeo ni rasmi?','Hapana. Matokeo ni ya kupanga. Thibitisha chanzo, tarehe, mamlaka na mtaalamu kabla ya uamuzi muhimu.'],
    ['Lugha na nchi vinatofautianaje?','Lugha hubadilisha kiolesura. Nchi hubadilisha mamlaka, sarafu, chanzo au kanuni inayotumika.'],
    ['Data yangu inatumwa?','Mtiririko ulioelezwa kuwa wa ndani hubaki kwenye kivinjari. Fomu, akaunti, malipo na AI ni mitiririko tofauti yenye maelezo.'],
    ['Nifanye nini data ikionekana ya zamani?','Usitumie kama thamani ya sasa. Soma tarehe na chanzo, kisha thibitisha kwa mamlaka au mtoa huduma.'],
    ['Naweza kupakua matokeo?','Zana nyingi hutoa faili, kunakili au kuchapisha. Kila zana hutaja miundo inayotengeneza na mipaka yake.'],
    ['AfroTools AI ni lazima?','Hapana. Orodha, utafutaji na zana hufanya kazi bila AI. AI ni msaada wa hiari wa kupata au kueleza mtiririko wa kazi.'],
    ['Ninaripotije hitilafu?','Tumia ukurasa wa mawasiliano, taja njia, nchi, ingizo la mfano na chanzo rasmi bila kutuma data halisi ya mtu.']
  ];
  const faqSchema = {'@type':'FAQPage',mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
  const schema = {'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':'https://afrotools.com/sw/#website',url:'https://afrotools.com/sw/',name:'AfroTools kwa Kiswahili',inLanguage:'sw',potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:'https://afrotools.com/sw/zana-zote/?q={search_term_string}'},'query-input':'required name=search_term_string'}},{'@type':'Organization','@id':'https://afrotools.com/#organization',name:'AfroTools',url:'https://afrotools.com/',logo:{'@type':'ImageObject',url:'https://afrotools.com/assets/img/logo-mark.svg'}},{'@type':'CollectionPage','@id':'https://afrotools.com/sw/#page',url:'https://afrotools.com/sw/',name:'Zana za Afrika kwa Kiswahili',isPartOf:{'@id':'https://afrotools.com/sw/#website'},inLanguage:'sw'},faqSchema]};
  return `<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="content-language" content="sw"><title>Zana na vikokotoo vya Afrika kwa Kiswahili | AfroTools</title><meta name="description" content="Vikokotoo, hati, data na miongozo kwa nchi 54 za Afrika kwa Kiswahili, zikiwa na vyanzo, tarehe, mipaka na faili zinazoweza kuhakikiwa."><meta property="og:type" content="website"><meta property="og:locale" content="sw_KE"><meta property="og:site_name" content="AfroTools"><meta property="og:title" content="AfroTools kwa Kiswahili — zana za vitendo kwa Afrika"><meta property="og:description" content="Pata zana inayolingana na nchi na kazi yako, elewa dhana na pakua matokeo yanayoweza kutumiwa tena."><meta property="og:url" content="https://afrotools.com/sw/"><meta property="og:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><link rel="canonical" href="https://afrotools.com/sw/"><link rel="alternate" hreflang="en" href="https://afrotools.com/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/"><link rel="alternate" hreflang="yo" href="https://afrotools.com/yo/"><link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/fr-homepage.css"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><script src="/assets/js/data/registry-counts.js" defer></script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script></head><body class="fr-home-page"><a class="skip-link" href="#maudhui">Ruka hadi maudhui</a><afro-navbar></afro-navbar><main id="maudhui" class="fr-home">
<header class="fr-home-hero"><div class="fr-home-wrap fr-home-hero-grid"><div><p class="fr-home-eyebrow">AfroTools kwa Kiswahili</p><h1>Zana sahihi, kwa nchi sahihi na uamuzi sahihi.</h1><p class="fr-home-lead">Kokotoa, linganisha, andaa hati au thibitisha dhana kwa muktadha wa Afrika. Chanzo, tarehe, mamlaka, uhakika na mipaka huonyeshwa pale vinapoathiri matokeo.</p><form class="fr-home-search" action="/sw/zana-zote/" method="get"><label for="swHomeSearch">Tafuta zana kwa Kiswahili</label><input id="swHomeSearch" name="q" type="search" placeholder="Mfano: mshahara Kenya, VAT, unganisha PDF"><button class="btn btn-primary" type="submit">Tafuta</button></form><div class="fr-home-actions"><a class="btn btn-secondary" href="/sw/zana-zote/">Zana zote</a><a class="btn btn-ghost" href="/sw/nchi/">Chagua nchi</a><a class="btn btn-ghost" href="/sw/ai/">Eleza kazi kwa AfroTools AI</a></div></div><dl class="fr-home-proof"><div><dt>Zana za Kiswahili</dt><dd data-registry-count="tools.locale.sw.published">${swTools}</dd></div><div><dt>Uzoefu wa zana</dt><dd data-registry-count="tools.live_experiences" data-count-format="plus">${liveTools}+</dd></div><div><dt>Nchi</dt><dd data-registry-count="countries.published">${countries}</dd></div><div><dt>Makundi</dt><dd data-registry-count="categories.published">${categories}</dd></div><div><dt>Lugha za tovuti</dt><dd data-registry-count="languages.site_published">${languages}</dd></div></dl></div></header>
<section class="fr-home-section"><div class="fr-home-wrap"><div class="fr-home-heading"><div><p class="fr-home-eyebrow">Anza na kazi</p><h2>Fika moja kwa moja kwenye matokeo yanayofaa.</h2></div><p>Chagua kazi, nchi na kiwango cha ushahidi. Zana hubaki huru kufunguliwa bila AI, na haziwezi kugeuza dhana kuwa dai rasmi.</p></div><div class="fr-home-task-grid"><a class="fr-home-task" href="/sw/mshahara-na-kodi/"><strong>Kokotoa mshahara na kodi</strong><p>Chagua nchi, kipindi, makato na michango inayotumika.</p><span>Fungua mshahara na kodi →</span></a><a class="fr-home-task" href="/sw/biashara-na-uzingatiaji/"><strong>Panga VAT au biashara</strong><p>Tumia mamlaka, kiwango, tarehe na source boundary inayoonekana.</p><span>Fungua biashara →</span></a><a class="fr-home-task" href="/sw/hati-na-pdf/"><strong>Andaa PDF au hati</strong><p>Unganisha, punguza, badilisha, saini au tengeneza faili ndani ya kivinjari.</p><span>Fungua hati →</span></a><a class="fr-home-task" href="/sw/kilimo/"><strong>Panga shamba</strong><p>Kadiria mavuno, pembejeo, umwagiliaji, mifugo na faida.</p><span>Fungua kilimo →</span></a><a class="fr-home-task" href="/sw/nyumba-na-ardhi/"><strong>Chunguza nyumba au ardhi</strong><p>Linganisha bajeti, mkopo, ununuzi, kodi, uhamisho na ujenzi.</p><span>Fungua nyumba na ardhi →</span></a><a class="fr-home-task" href="/sw/nishati-na-huduma/"><strong>Linganisha nishati na mafuta</strong><p>Tumia dhana za ndani zenye tarehe, uhakika na mipaka.</p><span>Fungua nishati →</span></a><a class="fr-home-task" href="/sw/biashara-ya-nje/"><strong>Andaa import au export</strong><p>Panga gharama, forodha, usafiri, asili na ukaguzi rasmi.</p><span>Fungua biashara ya nje →</span></a><a class="fr-home-task" href="/sw/zana-za-developer/"><strong>Badilisha data au code</strong><p>Fanya kazi na JSON, API, maandishi na miundo ya web.</p><span>Fungua zana za developer →</span></a></div></div></section>
<section class="fr-home-section fr-home-section--muted"><div class="fr-home-wrap"><div class="fr-home-heading"><div><p class="fr-home-eyebrow">Orodha iliyopangwa</p><h2>Makundi 32 yanayofuata kazi yako.</h2></div><p>Makundi yenye hub ya Kiswahili hufungua ukurasa wake. Mengine huweka kichujio sahihi kwenye orodha bila kubadili lugha kimya kimya.</p></div><div class="fr-home-category-grid">${categoryCards}</div><div class="fr-home-actions"><a class="btn btn-primary" href="/sw/zana-zote/">Orodha ya makundi</a><a class="btn btn-secondary" href="/sw/zana-zote/">Programu zote za Kiswahili</a></div></div></section>
<section class="fr-home-section"><div class="fr-home-wrap fr-home-country-layout"><div><p class="fr-home-eyebrow">Muktadha kabla ya hesabu</p><h2>Chagua nchi inayoweka kanuni, sarafu au chanzo.</h2><p class="fr-home-lead">Lugha hubadilisha kiolesura. Nchi hubadilisha mamlaka, sarafu au source boundary. Kuzitenganisha huzuia kutumia kanuni ya soko moja katika soko jingine.</p><div class="fr-home-country-list"><a href="/sw/kenya/">Kenya</a><a href="/sw/tanzania/">Tanzania</a><a href="/sw/uganda/">Uganda</a><a href="/sw/rwanda/">Rwanda</a><a href="/sw/burundi/">Burundi</a><a href="/sw/congo/">Congo</a><a href="/sw/south-africa/">Afrika Kusini</a><a href="/sw/nigeria/">Nigeria</a><a href="/sw/ghana/">Ghana</a><a href="/sw/zambia/">Zambia</a><a href="/sw/mozambique/">Msumbiji</a><a href="/sw/nchi/">Nchi zote 54</a></div></div><form class="fr-home-country-card" action="/sw/zana-zote/" method="get"><h3>Chuja kwa nchi na ushahidi</h3><label for="swCountry">Nchi</label><select id="swCountry" name="country"><option value="">Nchi zote</option><option value="kenya">Kenya</option><option value="tanzania">Tanzania</option><option value="uganda">Uganda</option><option value="nigeria">Nigeria</option><option value="south-africa">Afrika Kusini</option></select><label for="swCategory">Aina ya kazi</label><select id="swCategory" name="category"><option value="">Makundi yote</option><option value="financial">Fedha na kodi</option><option value="document-pdf">Hati na PDF</option><option value="agriculture">Kilimo</option><option value="engineering">Uhandisi</option></select><label for="swEvidence">Ushahidi unaohitajika</label><select id="swEvidence" name="evidence"><option value="">Aina zote</option><option value="local">Data ya mtumiaji</option><option value="dated">Chanzo chenye tarehe</option><option value="official">Chanzo rasmi</option></select><button class="btn btn-primary" type="submit">Onyesha zana</button></form></div></section>
<section class="fr-home-section fr-home-section--muted"><div class="fr-home-wrap"><div class="fr-home-heading"><div><p class="fr-home-eyebrow">Zana zinazotumiwa mara kwa mara</p><h2>Njia fupi za kufikia workflow kamili.</h2></div><p>Kila kiungo hufungua owner ya Kiswahili yenye route yake. Uwepo wa kiungo si dai kwamba data inayobadilika ni ya sasa; soma source panel ya zana.</p></div><div class="fr-home-link-cloud">${popular}</div></div></section>
<section class="fr-home-section"><div class="fr-home-wrap"><div class="fr-home-heading"><div><p class="fr-home-eyebrow">Chagua kwa ushahidi</p><h2>Hatua tano kabla ya kuamini matokeo.</h2></div><p>Ubora wa ukurasa haupimwi kwa idadi ya zana pekee. Mtumiaji anahitaji kujua zana inajibu swali gani, data inatoka wapi, na ni hatua gani bado inahitaji uthibitisho.</p></div><div class="fr-home-trust-grid"><article><h3>1. Taja uamuzi</h3><p>Anza na kile unachotaka kuamua: bajeti, filing, ununuzi, usafirishaji, hati au ulinganisho. Zana mbili zinaweza kuwa na majina yanayofanana lakini zikajibu maswali tofauti. Soma maelezo ya ingizo na tokeo kabla ya kujaza fomu.</p></article><article><h3>2. Chagua mamlaka</h3><p>Nchi, jimbo, aina ya biashara au kipindi kinaweza kubadilisha kanuni. Usitumie sarafu kama uthibitisho wa mamlaka; zana inaweza kuonyesha KES huku chanzo au mkataba unaohitajika ukitoka mahali tofauti.</p></article><article><h3>3. Kagua chanzo na tarehe</h3><p>Kwa kodi, ada, ratiba na bei, fungua chanzo kilichoonyeshwa na soma tarehe ya ukaguzi. Endpoint inayofunguka leo haithibitishi kuwa thamani iliyorekodiwa miezi iliyopita bado ni ya sasa. Data iliyopitwa na wakati lazima iwe wazi au izuiwe.</p></article><article><h3>4. Badilisha dhana zako</h3><p>Makadirio ya gharama, ukuaji, contingency, fee au kiwango cha soko ni bora zaidi yanapotoka kwa mtumiaji au nukuu ya sasa. Jaribu hali ya chini, ya kawaida na ya juu; usichukulie preset ya zamani kuwa bei ya leo.</p></article><article><h3>5. Hifadhi ushahidi</h3><p>Pakua faili iliyotangazwa, nakili muhtasari au chapisha matokeo pamoja na tarehe, ingizo na chanzo. Kisha thibitisha kwa mamlaka, mtaalamu au mtoa huduma kabla ya kuwasilisha, kulipa au kusaini. AfroTools husaidia kupanga; haiwezi kufanya uamuzi huo kwa niaba yako.</p></article></div></div></section>
<section class="fr-home-section"><div class="fr-home-wrap fr-home-ai-layout"><div><p class="fr-home-eyebrow">AfroTools AI ya hiari</p><h2>Eleza kazi; usikabidhi ukweli kwa modeli.</h2><p>AI inaweza kusaidia kuchagua zana, kuuliza swali la ufafanuzi au kueleza matokeo. Fomula, viwango, mamlaka na source labels hubaki kwenye injini na registry zinazoweza kupimwa.</p><ul><li>Utafutaji na orodha hufanya kazi bila AI.</li><li>Maudhui nyeti hayatumiwi bila idhini ya wazi.</li><li>Jibu la AI halibadilishi ushahidi rasmi.</li></ul></div><form class="fr-home-ai-card" action="/sw/ai/" method="get"><label for="swAiTask">Unataka kukamilisha kazi gani?</label><textarea id="swAiTask" name="q" rows="5" placeholder="Mfano: nataka kulinganisha gharama za kuingiza gari Kenya"></textarea><input type="hidden" name="source" value="sw-home"><button class="btn btn-primary" type="submit">Fungua msaidizi</button><p>Usiweke nenosiri, namba ya kitambulisho au hati nyeti.</p></form></div></section>
<section class="fr-home-section fr-home-section--muted"><div class="fr-home-wrap"><div class="fr-home-heading"><div><p class="fr-home-eyebrow">Mbinu ya kuaminika</p><h2>Kila matokeo yana muktadha na mpaka.</h2></div><p>AfroTools hutenganisha hesabu, presentation, source evidence na export. Hii hurahisisha kugundua data iliyopitwa na wakati na kulinda mtumiaji dhidi ya dai kubwa kuliko ushahidi.</p></div><div class="fr-home-trust-grid"><article><h3>Injini inayopimwa</h3><p>Hesabu muhimu huwekwa kwenye function safi inapowezekana, kisha interface huonyesha ingizo na tokeo bila kuficha fomula.</p></article><article><h3>Chanzo na tarehe</h3><p>Data ya kodi, ada, ratiba au sheria huonyesha source boundary na tarehe ya ukaguzi. Ubadilishaji wa ukurasa wa chanzo ni ishara ya review, si ruhusa ya kubadili namba moja kwa moja.</p></article><article><h3>Faili inayofunguka tena</h3><p>PDF, JSON, CSV, picha au hati iliyotangazwa inapaswa kutengenezwa kweli na iweze kufunguliwa tena. Kitufe pekee si uthibitisho.</p></article><article><h3>Faragha ya kazi</h3><p>Rasimu na faili hubaki ndani pale inaposemwa hivyo. Akaunti, usawazishaji, fomu, malipo na AI ni njia tofauti zenye hatua ya wazi.</p></article><article><h3>Simu na kibodi</h3><p>Kurasa hupimwa kwenye upana mdogo, zoom ya maandishi, mandhari na focus ili controls zisikatike au kufichwa na navigation.</p></article><article><h3>Makadirio si uamuzi rasmi</h3><p>Zana husaidia kupanga. Mamlaka, mtaalamu au mtoa huduma ndiye anayethibitisha filing, bei, matibabu, ushauri wa sheria au huduma halisi.</p></article></div></div></section>
<section class="fr-home-section"><div class="fr-home-wrap"><div class="fr-home-heading"><div><p class="fr-home-eyebrow">Maswali ya kawaida</p><h2>Jua zana inachofanya kabla ya kuingiza data.</h2></div><p>Kwa maelezo zaidi, soma <a href="/sw/maswali-ya-mara-kwa-mara/">maswali yote</a>, <a href="/sw/faragha/">sera ya faragha</a> na <a href="/sw/masharti/">masharti</a>.</p></div><div class="fr-home-faq">${faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div><div class="fr-home-actions"><a class="btn btn-primary" href="/sw/zana-zote/">Chagua zana</a><a class="btn btn-secondary" href="/sw/wasiliana/">Wasiliana nasi</a><a class="btn btn-secondary" href="/sw/blogu/">Soma blogu</a></div></div></section>
</main><afro-footer></afro-footer><script defer src="/assets/js/lazy-analytics.js"></script></body></html>\n`;
}

function privacyPage() {
  return `<!doctype html><html lang="sw"><head>${shellHead({ title: 'Sera ya Faragha — AfroTools', description: 'Sera ya faragha ya AfroTools kuhusu hesabu za ndani, AI, akaunti, usawazishaji, malipo, uchanganuzi, fomu na hifadhi.', canonical: '/sw/faragha/' })}<link rel="alternate" hreflang="en" href="https://afrotools.com/privacy/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/faragha/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/privacy/"></head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="sw-contract-main"><p>Faragha · Ilisasishwa: Julai 2026</p><h1>Sera ya Faragha</h1><p class="sw-contract-note" data-claim-key="privacy.browser-local" data-claim-variant="summary">${claim('privacy.browser-local')}</p><h2>1. Aina za mtiririko wa data</h2><table class="sw-contract-table"><thead><tr><th>Kipengele</th><th>Kinachochakatwa</th><th>Mahali na udhibiti</th></tr></thead><tbody><tr><td>Kikokotoo cha ndani</td><td>Thamani ulizoingiza na matokeo ya hesabu hiyo.</td><td>Huchakatwa kwenye kivinjari. Rasimu inaweza kubaki kwenye kifaa hadi uifute.</td></tr><tr><td>AI ya hiari</td><td>Ombi na muktadha ulioonyeshwa kabla ya kutuma.</td><td>Inaweza kutumwa kwa seva za AfroTools na mtoa huduma baada ya idhini.</td></tr><tr><td>Akaunti na usawazishaji</td><td>Barua pepe, wasifu, lugha, hali ya mpango na vitu unavyochagua kuhifadhi.</td><td>Huchakatwa na huduma ya akaunti. Kutoka kwenye akaunti hakufuti data iliyosawazishwa.</td></tr><tr><td>Vault</td><td>Faili unayochagua kupakia na metadata yake.</td><td>Upakiaji ni hatua ya wazi ya mtumiaji na hutegemea huduma ya vault kupatikana.</td></tr><tr><td>Malipo</td><td>Maelezo ya malipo kwa mtoa huduma na metadata ya muamala inayohitajika kwa hali ya Pro.</td><td>Mtoa huduma wa malipo hutumia sera zake za uchakataji na uhifadhi.</td></tr><tr><td>Uchanganuzi</td><td>Metadata ndogo ya matumizi baada ya idhini.</td><td>Thamani za hesabu na maudhui ya hati hayapaswi kutumwa kama analytics.</td></tr><tr><td>Fomu na barua pepe</td><td>Jina, barua pepe na ujumbe unaochagua kutuma.</td><td>Huchakatwa na huduma ya fomu ili kujibu ombi hilo.</td></tr></tbody></table><h2>2. Vidakuzi na hifadhi ya kivinjari</h2><p>AfroTools inaweza kuhifadhi nchi, lugha, mandhari, chaguo la idhini, vipendwa, rasimu na zana za hivi karibuni kwenye kivinjari. Zifute kwa vidhibiti vya zana au mipangilio ya kivinjari.</p><h2>3. Watoa huduma</h2><p>Huduma zinazoweza kutumika ni Netlify kwa uwasilishaji na functions, Supabase kwa akaunti na data iliyosawazishwa, Paystack kwa malipo, Anthropic kwa AI ya hiari, na Google Analytics au Microsoft Clarity baada ya idhini ya uchanganuzi. Kipengele kinapaswa kueleza mtiririko wake kabla ya kutuma maudhui ya mtumiaji.</p><h2>4. Uhifadhi, kufuta na haki</h2><p>Muda wa uhifadhi hutegemea madhumuni ya mtiririko, sheria inayotumika na mtoa huduma. Kulingana na mamlaka yako, unaweza kuomba ufikiaji, marekebisho, usafirishaji au kufutwa kwa data inayostahili kupitia <a href="mailto:privacy@afrotools.com">privacy@afrotools.com</a>.</p><h2>5. Usalama na watoto</h2><p>Miunganisho ya mtandao hutumia HTTPS, lakini hakuna huduma inayoweza kuahidi usalama kamili. Tumia data ndogo inayohitajika. AfroTools haijaundwa kukusanya kwa makusudi data binafsi ya mtoto chini ya miaka 13.</p><h2>6. Wasiliana</h2><p>Kwa swali la faragha au ombi la data, andika kwa <a href="mailto:privacy@afrotools.com">privacy@afrotools.com</a>.</p></main><afro-footer></afro-footer></body></html>\n`;
}

function termsPage() {
  return `<!doctype html><html lang="sw"><head>${shellHead({ title: 'Masharti ya Matumizi — AfroTools', description: 'Masharti ya kutumia AfroTools, mipaka ya makadirio, akaunti, Pro, AI na vyanzo vya kisheria.', canonical: '/sw/masharti/' })}<link rel="alternate" hreflang="en" href="https://afrotools.com/terms/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/masharti/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/terms/"></head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="sw-contract-main"><p>Masharti · Ilisasishwa: Julai 2026</p><h1>Masharti ya Matumizi</h1><p class="sw-contract-warning"><strong>Muhimu:</strong> vikokotoo na miongozo ya AfroTools hutoa makadirio ya kupanga. Thibitisha uamuzi muhimu kwa mamlaka husika au mtaalamu aliyehitimu.</p><h2>1. Kukubali masharti</h2><p>Kwa kutumia AfroTools unakubali masharti haya. Usitumie huduma ikiwa hukubaliani nayo.</p><h2>2. Hesabu, mamlaka na vyanzo</h2><p data-claim-key="statutory.jurisdiction-period" data-claim-variant="summary">${claim('statutory.jurisdiction-period')}</p><p>Matokeo hutegemea data ulizoingiza, nchi au mamlaka iliyotajwa, kipindi, toleo la kanuni na namna ya kuzungusha namba.</p><h2>3. Msingi wa umma na Pro</h2><p data-claim-key="free.public-core" data-claim-variant="summary">${claim('free.public-core')}</p><p data-claim-key="pro.current-capabilities" data-claim-variant="summary">${claim('pro.current-capabilities')}</p><p>Bei na kipengele husika huonyeshwa kabla ya hatua ya malipo. Payroll ndiyo programu ya Pro iliyoainishwa kuwa hai na yenye akaunti; programu nyingine zinaweza kuwa majaribio ya kifaa, shell au pakiti ya ukaguzi.</p><h2>4. AI ya hiari</h2><p data-claim-key="ai.optional-provider" data-claim-variant="summary">${claim('ai.optional-provider')}</p><p>Maandishi ya modeli yanaweza kuwa na makosa na hayabadilishi injini ya hesabu yenye chanzo.</p><h2>5. Akaunti na data</h2><p data-claim-key="account.optional-sync" data-claim-variant="summary">${claim('account.optional-sync')}</p><p>Wewe unawajibika kulinda njia zako za kuingia na kuchagua kwa uangalifu data ya kuhifadhi au kupakia.</p><h2>6. Matumizi yasiyoruhusiwa</h2><ul><li>Kujaribu kufikia data au akaunti ya mtu mwingine;</li><li>Kuvuruga huduma, kupita vidhibiti vya ufikiaji au kutumia huduma kinyume cha sheria;</li><li>Kuwasilisha matokeo kama uthibitisho rasmi bila ukaguzi unaofaa.</li></ul><h2>7. Uwajibikaji</h2><p>Kwa kiwango kinachoruhusiwa na sheria, AfroTools haihakikishi kuwa makadirio yanafaa kwa hali yako binafsi. Tumia chanzo, tarehe, mamlaka na tahadhari zinazoonyeshwa.</p><h2>8. Mabadiliko na mawasiliano</h2><p>Tarehe ya juu inaonyesha toleo lililochapishwa. Maswali yanaweza kutumwa kwa <a href="mailto:hello@afrotools.com">hello@afrotools.com</a>.</p></main><afro-footer></afro-footer></body></html>\n`;
}

function helpPage() {
  return `<!doctype html><html lang="sw"><head>${shellHead({ title: 'Msaada wa AfroTools kwa Kiswahili', description: 'Msaada wa kutafuta zana, kuchagua nchi, kuelewa vyanzo, kuhifadhi, kupakua na kutumia kurasa mbadala za Kiingereza.', canonical: '/sw/msaada/' })}</head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="sw-contract-main"><p>Msaada wa bidhaa</p><h1>Tumia AfroTools kwa Kiswahili</h1><div class="sw-contract-grid"><section class="sw-contract-card"><h2>Tafuta zana</h2><p>Tumia <a href="/sw/zana-zote/">orodha ya zana za Kiswahili</a>. Matokeo ya Kiingereza huwekwa alama kabla ya kuyafungua.</p></section><section class="sw-contract-card"><h2>Chagua nchi</h2><p>Lugha ya ukurasa na nchi ya hesabu ni vitu tofauti. Chagua mamlaka kwenye <a href="/sw/nchi/">orodha ya nchi</a> na uthibitishe sarafu, chanzo na kipindi kwenye zana.</p></section><section class="sw-contract-card"><h2>Hifadhi au pakua</h2><p>Kitufe cha kuhifadhi kinaweza kutumia kifaa chako. Usawazishaji huanza baada ya kuingia tu ikiwa zana na huduma hiyo vinauunga mkono.</p></section><section class="sw-contract-card"><h2>Hitilafu au data ya akiba</h2><p>Ujumbe wa hitilafu unapaswa kutofautisha jaribio lililoshindikana, data ya akiba na kutopatikana kwa rekodi. Usichukulie kiwango cha akiba kuwa cha moja kwa moja.</p></section></div><h2>Kurasa za Kiingereza</h2><p>Dashibodi, vault na baadhi ya hatua za akaunti au Pro bado zinaweza kuwa za Kiingereza. AfroTools huonyesha daraja la Kiswahili kabla ya kubadili lugha na huacha njia ya kurudi.</p><div class="sw-contract-actions"><a href="/sw/wasiliana/">Wasiliana nasi</a><a class="alt" href="/sw/faragha/">Soma sera ya faragha</a><a class="alt" href="/sw/masharti/">Soma masharti</a></div></main><afro-footer></afro-footer></body></html>\n`;
}

function pricingPage() {
  const monthly = registry.productPlans.find((plan) => plan.id === 'product:monthly_kes');
  const annual = registry.productPlans.find((plan) => plan.id === 'product:annual_kes');
  return `<!doctype html><html lang="sw"><head>${shellHead({ title: 'Bei na AfroTools Pro kwa Kiswahili', description: 'Maelezo ya Kiswahili kuhusu msingi wa umma, bei za KES na hali ya sasa ya programu za AfroTools Pro.', canonical: '/sw/bei/' })}</head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="sw-contract-main"><p>Bei na mipango</p><h1>Msingi wa umma na AfroTools Pro</h1><p class="sw-contract-note" data-claim-key="free.public-core" data-claim-variant="summary">${claim('free.public-core')}</p><div class="sw-contract-grid"><section class="sw-contract-card"><h2>Kwa mwezi</h2><p><strong>${escapeHtml(monthly.title)}</strong> kwa mwezi</p><p>Hulipwa kila mwezi kwa KES.</p></section><section class="sw-contract-card"><h2>Kwa mwaka</h2><p><strong>${escapeHtml(annual.title)}</strong> kwa mwaka</p><p>Takribani KSh350 kwa mwezi kulingana na mpango wa mwaka uliosajiliwa.</p></section></div><h2>Kinachopatikana sasa</h2><p data-claim-key="pro.current-capabilities" data-claim-variant="summary">${claim('pro.current-capabilities')}</p><ul><li>Vikokotoo vya msingi vya umma havihitaji usajili wa kulipia.</li><li>Payroll ndiyo programu ya Pro iliyoainishwa kuwa hai na yenye data ya akaunti.</li><li>Programu nyingine zinapaswa kuonyesha wazi ikiwa ni majaribio ya kifaa, shell, pakiti ya ukaguzi au usawazishaji unaosubiri.</li></ul><p class="sw-contract-warning"><strong>Daraja la lugha:</strong> hatua ya sasa ya malipo na baadhi ya kurasa za Pro ni za Kiingereza. Chagua kuendelea tu baada ya onyo hili; unaweza kurudi kwenye ukurasa huu wa Kiswahili.</p><div class="sw-contract-actions"><a href="/sw/auth/?mode=signup&amp;intent=pro-checkout&amp;next=%2Fsw%2Fbei%2F">Fungua akaunti kupitia daraja la Kiswahili</a><a class="alt" href="/pro/?locale=sw&amp;return_to=%2Fsw%2Fbei%2F">Endelea kwenye Pro kwa Kiingereza</a></div></main><afro-footer></afro-footer></body></html>\n`;
}

function bridgePage(kind) {
  const config = {
    auth: { title: 'Kuingia kwenye akaunti', destination: '/auth/?mode=login&next=%2Fsw%2Fdashboard%2F', destinationName: 'ukurasa wa kuingia', back: '/sw/', backLabel: 'Rudi AfroTools kwa Kiswahili' },
    dashboard: { title: 'Dashibodi ya akaunti', destination: '/dashboard/?locale=sw&return_to=%2Fsw%2Fdashboard%2F', destinationName: 'dashibodi', back: '/sw/', backLabel: 'Rudi kwenye zana za Kiswahili' },
    vault: { title: 'Hifadhi ya akaunti', destination: '/pro/vault/?locale=sw&return_to=%2Fsw%2Fvault%2F', destinationName: 'vault', back: '/sw/hati-na-pdf/', backLabel: 'Rudi kwenye hati na PDF za Kiswahili' }
  }[kind];
  return `<!doctype html><html lang="sw"><head>${shellHead({ title: `${config.title} — daraja la Kiswahili`, description: `Onyo la Kiswahili kabla ya kufungua ${config.destinationName} ya Kiingereza.`, canonical: `/sw/${kind}/`, robots: 'noindex,follow' })}</head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="sw-contract-main"><p>Daraja la lugha</p><h1>${config.title}</h1><p class="sw-contract-warning"><strong>Ukurasa unaofuata ni wa Kiingereza.</strong> ${config.destinationName.charAt(0).toUpperCase() + config.destinationName.slice(1)} bado haijakamilika kwa Kiswahili. Kiungo kinaweka <code>locale=sw</code> au njia ya kurudi inapowezekana, lakini vidhibiti vya ukurasa unaofuata vitakuwa vya Kiingereza.</p><p>Data ya kifaa haijasawazishwa kwa sababu ya kufungua daraja hili. Usawazishaji hutokea tu baada ya kuingia na ikiwa hatua husika inafanikiwa.</p><div class="sw-contract-actions"><a href="${config.destination}">Endelea kwa Kiingereza</a><a class="alt" href="${config.back}">${config.backLabel}</a></div></main><afro-footer></afro-footer></body></html>\n`;
}

const homeTransforms = [
  [/data-registry-count="tools\.locale\.sw\.published">\d+</g, `data-registry-count="tools.locale.sw.published">${swTools}<`],
  ['Inatumiwa na wataalamu kote Afrika &middot; matumizi ya msingi bila usajili wa kulipia', 'Zana za vitendo kwa masoko ya Afrika · matumizi ya msingi bila usajili wa kulipia'],
  [`Kuna <span data-registry-count="tools.live_experiences">${liveTools}</span> matukio ya zana hai yaliyoundwa kwa muktadha wa Afrika.`, `Sajili ina <span data-registry-count="tools.locale.sw.published">${swTools}</span> rekodi zilizochapishwa kwa Kiswahili; kila zana inaonyesha nchi na chanzo chake.`],
  [/Kuna 2606 matukio ya zana hai yaliyoundwa kwa muktadha wa Afrika\./g, `Sajili ina <span data-registry-count="tools.locale.sw.published">${swTools}</span> rekodi zilizochapishwa kwa Kiswahili; kila zana inaonyesha nchi na chanzo chake.`],
  ['TZS/USD Moja kwa Moja', 'TZS/USD — hali ya chanzo'],
  ['Viwango vya leo', 'Angalia muda na chanzo'],
  ['Viwango vya Fedha za Kigeni vya Moja kwa Moja', 'Viwango vya fedha zenye hali iliyoelezwa'],
  ['Viwango vya kila siku vya ubadilishaji kwa sarafu zote za Afrika. Viwango vya benki dhidi ya soko. Arifa zinakuja hivi karibuni.', 'Kagua kiwango, chanzo na muda wa rekodi kabla ya kulinganisha na bei ya benki au mtoa huduma. Data ya akiba huwekwa alama kama makadirio.'],
  ['Nchi 54 Zimefunikwa', 'Nchi na lugha ni vitu tofauti'],
  ['Kila nchi ya Afrika ina vikokotoo vya kodi, zana za sarafu na data ya fedha iliyoboreshwa kwa sheria yake.', 'AfroTools ina vitovu vya nchi 54. Zana ya Kiswahili inapatikana tu inapoorodheshwa; hesabu inatumika kwa nchi iliyoandikwa na chanzo kilichotajwa.'],
  ['Kodi sahihi ya mapato kwa kila nchi ya Afrika, kisha uendelee na kima cha chini cha mshahara, muda wa ziada, likizo, hifadhi ya jamii na mipango ya kazi kwa njia ya Kiswahili iliyo wazi.', 'Chagua nchi kwanza, kisha kagua PAYE, makato, kipindi na chanzo. Upatikanaji wa Kiswahili hautoi uthibitisho kwamba kanuni za nchi nyingine zinatumika.'],
  ['PAYE na zana za mishahara — Nchi 54', 'PAYE na zana za mishahara — chagua mamlaka'],
  ['Zana Mpya.<br>Kila Wiki.<br>Bure.', 'Sasisho za zana<br>na vyanzo'],
  ['Pata taarifa tunapozindua zana kwa nchi yako. Barua pepe moja kwa kila sasisho kubwa. Hakuna taka. Unaweza kujiondoa wakati wowote.', 'Chagua kupokea sasisho za bidhaa. Barua pepe huchakatwa na huduma ya fomu iliyosanidiwa; kujiondoa hutegemea mtiririko huo.'],
  ['VAT nchi 54<span style="display:block;background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:16px;color:#075985;font-weight:900;">', 'VAT kwa nchi zilizoorodheshwa<span style="display:block;background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:16px;color:#075985;font-weight:900;">'],
  ['Kikokotoo cha VAT kwa kila nchi', 'Chagua nchi na uthibitishe kiwango na tarehe'],
  ['Mapishi ya vyakula 2,606+ vya Afrika kutoka nchi zote 54.', 'Mapishi ya Afrika yaliyoorodheshwa kwenye AfroKitchen.']
  ,[`<div class="hero-stat rv"><div class="hero-stat-num c1" id="hp-stat-tools" data-registry-count="tools.live_experiences">${liveTools}</div><div class="hero-stat-lbl">Matukio ya zana hai</div></div>`, `<div class="hero-stat rv"><div class="hero-stat-num c1" id="hp-stat-tools" data-registry-count="tools.locale.sw.published">${swTools}</div><div class="hero-stat-lbl">Rekodi za Kiswahili</div></div>`]
];

output('sw/index.html', withAnalyticsLoader(homePage()
  .replace('class="skip-link" href="#maudhui"', 'class="sw-skip-link" href="#main-content"')
  .replace('main id="maudhui"', 'main id="main-content"')
  .replaceAll('workflow', 'mtiririko wa kazi')
  .replaceAll('Fungua zana za developer', 'Fungua zana za wasanidi programu')
  .replaceAll('Lugha hubadilisha kiolesura. Nchi hubadilisha mamlaka', 'Nchi na lugha ni vitu tofauti. Lugha hubadilisha kiolesura. Nchi hubadilisha mamlaka')));
repair('sw/zana-zote/index.html', [
  [/data-registry-count="tools\.locale\.sw\.published">\d+</g, `data-registry-count="tools.locale.sw.published">${swTools}<`],
  [/Vikokotoo 2,606\+ bure vya/g, `${swTools} rekodi zilizochapishwa za`],
  [/zana nyingine 2,606\+ za Afrika kwa Kiswahili/g, `rekodi ${swTools} zilizochapishwa kwa Kiswahili`],
  [`PAYE, mishahara na zana 2,606+ za Afrika`, `PAYE, mishahara na rekodi <span data-registry-count="tools.locale.sw.published">${swTools}</span> za Kiswahili`],
  ['Anza na PAYE, kisha tafuta kima cha chini cha mshahara, muda wa ziada, likizo, hifadhi ya jamii, VAT, sarafu, biashara na zana nyingine za kila siku kwa muktadha wa Afrika.', 'Tafuta ndani ya rekodi za Kiswahili. Matokeo ya Kiingereza huwekwa alama kabla ya kufunguliwa, na nchi ya zana haibadilishi lugha ya ukurasa.'],
  ['Tengeneza ankara za kitaalamu kwa sekunde. Pakua PDF mara moja bila usajili wowote.', 'Tengeneza ankara na ufuate hatua ya PDF iliyoelezwa kwenye zana.'],
  ['Mapishi ya vyakula 2,606+ vya Afrika kutoka nchi zote 54.', 'Mapishi ya Afrika yaliyoorodheshwa kwenye AfroKitchen.']
]);
const countrySearchTransforms = read('sw/nchi/index.html').includes('id="swCountrySearch"') ? [] : [
  [/(<link rel="stylesheet" href="\/assets\/css\/top-level-page-ui-refresh\.css(?:\?v=[a-f0-9]+)?">)/, '$1\n<link rel="stylesheet" href="/assets/css/localized-institutional.css">'],
  ['</section>\n\n<section class="sec sec--white">', `</section>\n<section class="sec sec--white"><div class="wrap"><form class="li-form" role="search" onsubmit="return false"><label for="swCountrySearch">Tafuta nchi</label><input id="swCountrySearch" type="search" autocomplete="off" placeholder="Mfano: Kenya"><button type="button" class="btn btn-secondary" id="swCountryReset">Futa</button><p id="swCountryStatus" role="status" aria-live="polite"></p></form></div></section>\n<section class="sec sec--white">`],
  ['</body>', `<script>(function(){var q=document.getElementById('swCountrySearch'),cards=[].slice.call(document.querySelectorAll('.country-card')),status=document.getElementById('swCountryStatus');if(!q)return;function draw(){var value=q.value.trim().toLocaleLowerCase('sw'),shown=0;cards.forEach(function(card){var visible=!value||card.textContent.toLocaleLowerCase('sw').indexOf(value)>=0;card.hidden=!visible;if(visible)shown++;});status.textContent=shown+' nchi zimeonyeshwa';}q.addEventListener('input',draw);document.getElementById('swCountryReset').addEventListener('click',function(){q.value='';draw();q.focus();});draw();})();</script></body>`]
];
repair('sw/nchi/index.html', [
  ...countrySearchTransforms,
  ['PAYE, kima cha chini cha mshahara, overtime, likizo, hifadhi ya jamii, sarafu na zana za fedha kwa kila nchi ya Afrika. Chagua nchi yako kupata kitovu chake.', 'Chagua nchi ili kuona zana zinazohusu mamlaka hiyo. Lugha ya Kiswahili, upatikanaji wa zana, sarafu na uthibitishaji wa chanzo ni vipimo tofauti.'],
  [`<div class="stat-num">2606</div><div class="stat-label">Matukio ya Zana Hai</div>`, `<div class="stat-num" data-registry-count="tools.locale.sw.published">${swTools}</div><div class="stat-label">Rekodi za Kiswahili</div>`],
  ['Nchi zenye alama ya ✓ zina kurasa za Kiswahili zenye vikokotoo vya mshahara. Tunaendelea kuboresha tafsiri na viungo vya ndani.', 'Alama ya ✓ inaonyesha njia ya Kiswahili iliyoainishwa. Thibitisha kwenye zana ikiwa hesabu, sarafu, kipindi na chanzo vinatumika kwa nchi hiyo.']
]);
repair('sw/wasiliana/index.html', [
  ['Tunajibu ndani ya masaa 24.', 'Tutatumia maelezo uliyotuma kujibu ombi lako.'],
  ['Asante — tutajibu ndani ya masaa 24.', 'Asante — ujumbe wako umepokelewa kwa ukaguzi.'],
  ['Kawaida tunajibu ndani ya masaa 24', 'Majibu hutegemea aina ya ombi'],
  ['Kawaida tunarekebisha hitilafu zilizoripotiwa ndani ya masaa 48.', 'Toa nchi, kipindi, chanzo na mfano wa matokeo ili timu iweze kukagua hitilafu.'],
  ['Tunarekebisha hitilafu zilizoripotiwa ndani ya masaa 48.', 'Toa nchi, kipindi, chanzo na mfano wa matokeo ili timu iweze kukagua hitilafu.'],
  ['Fikia wataalamu wa Afrika wanaofanya maamuzi ya kweli ya fedha.', 'Uliza kuhusu nafasi za biashara na udhamini zilizo na lebo wazi.'],
  ['Tunafanya kazi na makampuni ya fintech ya Afrika, mashirika yasiyo ya faida, mashirika ya serikali, na taasisi za elimu kujenga zana na ujumuishaji wa kipekee.', 'Tunaweza kukagua maombi ya ushirikiano wa zana, data au elimu bila kuahidi uhusiano au utekelezaji.']
]);
repair('sw/kuhusu/index.html', [
  ['AfroTools ni jukwaa bure la zana za fedha na biashara kwa Afrika.', 'AfroTools ni jukwaa la zana za vitendo kwa maamuzi katika masoko ya Afrika.'],
  ['Jukwaa bure la zana za fedha na biashara kwa Afrika', 'Jukwaa la zana za vitendo kwa masoko ya Afrika'],
  ['Kila zana ni bure, inafanya kazi kwenye kifaa chochote, na haihitaji akaunti kutumia. Takwimu zako za mshahara na fedha zinabaki kwenye kivinjari chako — hazitumiwi kwenye seva zetu kamwe.', claim('free.public-core') + ' ' + claim('privacy.browser-local')],
  ['AfroTools imejengwa kabisa kwa HTML, CSS, na JavaScript ya kawaida — bila miundo, bila mzigo. Hii inahakikisha zana zinapakuliwa haraka kwenye kifaa chochote, ikiwa ni pamoja na simu za bei nafuu kwenye mitandao ya polepole ya simu barani. Faragha ni msingi: mahesabu yote yanafanyika kwenye kivinjari na hakuna data ya kibinafsi inayopelekwa kwenye seva za nje.', 'Kurasa nyingi za zana zimejengwa kwa HTML, CSS na JavaScript ili maudhui muhimu yaanze bila kusubiri programu nzito. Kasi na upatikanaji hutegemea ukurasa, kifaa na mtandao. ' + claim('privacy.browser-local')]
]);

const staticUiTransforms = [
  [/>\s*Copy Link\s*</gi, '>Nakili kiungo<'], [/>\s*Print\s*</gi, '>Chapisha<'],
  ['>Copy<', '>Nakili<'], ['>Copy All Hashes<', '>Nakili hashi zote<'], ['>Copy cURL<', '>Nakili cURL<'], ['>Copy Link<', '>Nakili kiungo<'],
  ['>Download TXT<', '>Pakua TXT<'], ['>Download checklist TXT<', '>Pakua orodha ya ukaguzi (TXT)<'],
  ['>Export CSV<', '>Pakua CSV<'], ['>Export JSON<', '>Pakua JSON<'], ['>Export SQLite DB<', '>Pakua hifadhidata ya SQLite<'],
  ['>Print<', '>Chapisha<'], ['>Reset<', '>Weka upya<'], ['>Result<', '>Matokeo<'], ['>Share as Image<', '>Shiriki kama picha<']
  ,['>Privacy policy<', '>Sera ya faragha<']
];
const runtimeTransforms = [
  ["'Share as Image'", "'Shiriki kama picha'"], ['"Share as Image"', '"Shiriki kama picha"'],
  ["window.location.href='/auth/?mode=login&next=/dashboard/';", "window.location.href='/sw/auth/?mode=login&next=%2Fsw%2Fdashboard%2F';"],
  ['window.location.href="/auth/?mode=login&next=/dashboard/";', 'window.location.href="/sw/auth/?mode=login&next=%2Fsw%2Fdashboard%2F";'],
  [/(\b(?:e|event)\.key\s*={2,3}\s*)'ingiza'/g, "$1'Enter'"],
  [/(\b(?:e|event)\.key\s*={2,3}\s*)"ingiza"/g, '$1"Enter"'],
  [/\bkokotoa\(\)/g, 'calculate()'],
  [/\.chapisha\(\)/g, '.print()']
];
const visibleLanguageTransforms = [
  [/\bterms of use\b/gi, 'masharti ya matumizi'],
  [/\bprivacy policy\b/gi, 'sera ya faragha'],
  [/\bcookie consent\b/gi, 'idhini ya vidakuzi'],
  [/\bbreach notification\b/gi, 'taarifa ya uvujaji wa data'],
  [/\bclient-side\b/gi, 'upande wa kivinjari'],
  [/\bdeveloper tools\b/gi, 'zana za wasanidi programu'],
  [/\bdevelopers\b/gi, 'wasanidi programu'],
  [/\bdeveloper\b/gi, 'msanidi programu'],
  [/\bworkflows\b/gi, 'michakato ya kazi'],
  [/\bworkflow\b/gi, 'mchakato wa kazi'],
  [/\bcategories\b/gi, 'kategoria'],
  [/\bcategory\b/gi, 'kategoria'],
  [/\bbrowsers\b/gi, 'vivinjari'],
  [/\bbrowser\b/gi, 'kivinjari'],
  [/\bdownloads\b/gi, 'vipakuliwa'],
  [/\bdownload ya\b/gi, 'upakuaji wa'],
  [/\bdownload\b/gi, 'pakua'],
  [/\buploads\b/gi, 'upakiaji'],
  [/\bupload\b/gi, 'upakiaji'],
  [/\bcreators\b/gi, 'watayarishi'],
  [/\bcreator\b/gi, 'mtayarishi'],
  [/\bapps\b/gi, 'programu'],
  [/\bapp\b/gi, 'programu'],
  [/\baccounts\b/gi, 'akaunti'],
  [/\baccount\b/gi, 'akaunti'],
  [/\bresults\b/gi, 'matokeo'],
  [/\bpreview\b/gi, 'mwonekano wa awali'],
  [/\boutputs\b/gi, 'matokeo'],
  [/\boutput\b/gi, 'matokeo'],
  [/\binputs\b/gi, 'maingizo'],
  [/\binput\b/gi, 'ingizo'],
  [/\bsignup\b/gi, 'usajili'],
  [/\bonline\b/gi, 'mtandaoni'],
  [/\bservers\b/gi, 'seva'],
  [/\bserver\b/gi, 'seva'],
  [/\bcalculators\b/gi, 'vikokotoo'],
  [/\bcalculator\b/gi, 'kikokotoo'],
  [/\bcalculate\b/gi, 'kokotoa'],
  [/\benter\b/gi, 'ingiza'],
  [/\bresult\b/gi, 'matokeo'],
  [/\breset\b/gi, 'weka upya'],
  [/\bsave\b/gi, 'hifadhi'],
  [/\bsearch\b/gi, 'tafuta'],
  [/\bselect\b/gi, 'chagua'],
  [/\bamount\b/gi, 'kiasi'],
  [/\bmonthly\b/gi, 'kila mwezi'],
  [/\bannual\b/gi, 'kila mwaka'],
  [/\btotal\b/gi, 'jumla'],
  [/\bsubmit\b/gi, 'wasilisha'],
  [/\bloading\b/gi, 'inapakia'],
  [/\berror\b/gi, 'hitilafu'],
  [/\brequired\b/gi, 'inahitajika'],
  [/\bnext\b/gi, 'inayofuata'],
  [/\bprevious\b/gi, 'iliyotangulia'],
  [/\bprint\b/gi, 'chapisha'],
  [/\bshare\b/gi, 'shiriki'],
  [/\bcopy\b/gi, 'nakili']
];
const scriptLanguageRepairs = [
  [/\bif\s*\(\s*!matokeo\s*\)/g, 'if (!RESULT)'],
  [/\bconst R(\s*)=(\s*)matokeo\b/g, 'const R$1=$2RESULT'],
  [/\bmatokeo\./g, 'RESULT.'],
  // The property repair above also sees sentence text inside inline script
  // strings. Restore the Swahili noun there instead of leaking the RESULT
  // identifier into the interface.
  [/(kupata )RESULT\./g, '$1matokeo.'],
  [/\b([A-Za-z_$][\w$]*)\.kila mwaka\b/g, '$1.annual'],
  [/\b([A-Za-z_$][\w$]*)\.kila mwezi\b/g, '$1.monthly'],
  [/\bnavigator\.shiriki\b/g, 'navigator.share']
];

const languageParityRoutes = [
  'sw/zana/mtafsiri-wa-kiswahili/index.html',
  'sw/zana/mtafsiri-wa-kiyoruba/index.html',
  'sw/zana/mtafsiri-wa-kihausa/index.html',
  'sw/zana/mtafsiri-wa-kiigbo/index.html',
  'sw/zana/mtafsiri-wa-kiamhari/index.html',
  'sw/zana/mtafsiri-wa-kizulu/index.html',
  'sw/zana/nambari-za-kiarabu/index.html',
  'sw/zana/transliteration-ya-maandishi/index.html',
  'sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html',
  'sw/zana/mtafsiri-wa-kifaransa-afrika/index.html',
  'sw/zana/maana-ya-majina-ya-afrika/index.html'
];

const languageParityArtwork = new Map([
  ['sw/zana/nambari-za-kiarabu/index.html', 'arabic-calc.webp'],
  ['sw/zana/transliteration-ya-maandishi/index.html', 'transliterate.webp'],
  ['sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html', 'pidgin-translator.webp'],
  ['sw/zana/mtafsiri-wa-kifaransa-afrika/index.html', 'french-african.webp'],
  ['sw/zana/kalenda-ya-mtayarishi/index.html', 'creator-calendar.webp'],
  ['sw/zana/caption-za-maudhui/index.html', 'creator-captions.webp']
]);

function repairLanguageArtwork(rel, fileName) {
  const imageUrl = `https://afrotools.com/assets/img/tools/${fileName}`;
  repair(rel, [
    [
      /(<meta property="og:image" content=")https:\/\/afrotools\.com\/assets\/img\/og-default\.png(")/i,
      `$1${imageUrl}$2`
    ],
    [
      /(<meta name="twitter:image" content=")https:\/\/afrotools\.com\/assets\/img\/og-default\.png(")/i,
      `$1${imageUrl}$2`
    ]
  ]);
}

const languageParityVisibleRepairs = [
  [/\bbrief\b/gi, 'muhtasari'],
  [/\bmobile money\b/gi, 'pesa kwa simu'],
  [/\bcertified translation\b/gi, 'tafsiri iliyoidhinishwa'],
  [/\bnative speaker\b/gi, 'mzungumzaji wa lugha hiyo'],
  [/\bsource page\b/gi, 'ukurasa wa chanzo'],
  [/\bprofessional\b/gi, 'mtaalamu'],
  [/\bimmigration\b/gi, 'uhamiaji'],
  [/\bmedical\b/gi, 'afya'],
  [/\blegal\b/gi, 'kisheria'],
  [/\btranslation\b/gi, 'tafsiri'],
  [/\btranslator\b/gi, 'mtafsiri'],
  [/\btransliteration\b/gi, 'ubadilishaji wa mfumo wa maandishi'],
  [/\bromanization\b/gi, 'uandishi kwa herufi za Kilatini'],
  [/\bpronunciation\b/gi, 'matamshi'],
  [/\bname meaning\b/gi, 'maana ya jina'],
  [/\bscript\b/gi, 'mfumo wa maandishi'],
  [/\bLatin\b/gi, 'Kilatini']
];

const pidginVisibleRepairs = [
  ['Learn Naija Like a Local', 'Jifunze Nigerian Pidgin kwa matumizi ya kila siku'],
  ['Learn Naija', 'Jifunze Nigerian Pidgin'],
  ['Like a Local', 'kwa matumizi ya kila siku'],
  [/Master Nigerian Pidgin with flashcards, live (?:translation|tafsiri), and 200\+ real misemo used by 100 million\+ speakers across West Africa\./gi, 'Jifunze Nigerian Pidgin kwa kadi za mazoezi, tafsiri ya hiari na misemo 200+ inayotumika Afrika Magharibi.'],
  ['Phrases', 'Misemo'],
  ['Speakers', 'Wazungumzaji'],
  ['Learn', 'Jifunze'],
  ['Translate', 'Tafsiri'],
  ['Phrasebook', 'Kamusi ya misemo'],
  ['Flashcard Mode', 'Mazoezi ya kadi'],
  ['How do you say this in Pidgin?', 'Unasemaje sentensi hii kwa Pidgin?'],
  ['Tap to reveal answer', 'Gusa ili kuona jibu'],
  ['Skip', 'Ruka'],
  ['I Knew It', 'Nimeijua'],
  [/\bLive (?:Translator|mtafsiri)\b/gi, 'Mtafsiri wa hiari mtandaoni'],
  ['English', 'Kiingereza'],
  ['Swap languages', 'Badilisha mwelekeo wa lugha'],
  ['Nakili translation', 'Nakili tafsiri']
];

const transliterationVisibleRepairs = [
  ['Badilisha maandishi ya Latin kwenda mifumo ya Ge\'ez, Tifinagh, N\'Ko na Vai kwa mazoezi ya mfumo wa maandishi, matamshi na elimu ya lugha.', 'Badilisha maandishi ya Kilatini kwenda mifumo ya Ge\'ez, Tifinagh, N\'Ko na Vai kwa mazoezi ya uandishi, matamshi na elimu ya lugha.'],
  ['Badilisha mfumo wa maandishi', 'Badilisha mfumo wa uandishi'],
  ['Maandishi ya Latin', 'Maandishi ya Kilatini'],
  ['Matokeo ya mfumo wa maandishi', 'Matokeo ya mfumo wa uandishi'],
  ['Character Map — Click to Insert', 'Ramani ya herufi — bofya ili kuingiza'],
  ['Mwongozo wa keyboard', 'Mwongozo wa kibodi'],
  ['Consonant mapping', 'Ulinganishaji wa konsonanti'],
  ['Key mapping', 'Ulinganishaji wa vitufe'],
  ['Syllable mapping', 'Ulinganishaji wa silabi'],
  ['Type', 'Andika'],
  ['Notes', 'Maelezo'],
  ['Add vowel:', 'Ongeza irabu:'],
  ['Type "sh" before vowel:', 'Andika "sh" kabla ya irabu:'],
  ['Standalone vowels use Ethiopic base vowel characters', 'Irabu zinazojitegemea hutumia herufi za msingi za irabu za Ethiopic'],
  ['N\'Ko maps consonant+vowel pairs:', 'N\'Ko hubadilisha jozi za konsonanti na irabu:'],
  ['Standalone vowels:', 'Irabu zinazojitegemea:'],
  ['N\'Ko is written right-to-left.', 'N\'Ko huandikwa kutoka kulia kwenda kushoto.'],
  ['African Writing Systems', 'Mifumo ya uandishi ya Afrika'],
  ['Used for Amharic, Tigrinya. 2,000+ years old. 230+ characters.', 'Hutumika kwa Kiamhari na Kitigrinya. Una historia ya zaidi ya miaka 2,000 na herufi 230+.'],
  ['Used for Amazigh/Berber. 3,000+ years old. Official in Morocco.', 'Hutumika kwa Amazigh/Berber. Una historia ya zaidi ya miaka 3,000 na ni rasmi nchini Morocco.'],
  ['Created 1949 for Manding languages. Right-to-left. Used in West Africa.', 'Ulibuniwa mwaka 1949 kwa lugha za Manding. Huandikwa kulia kwenda kushoto na hutumika Afrika Magharibi.'],
  ['Created c.1830s in Liberia. One kati ya few African-invented syllabaries.', 'Ulibuniwa karibu miaka ya 1830 nchini Liberia. Ni mojawapo ya mifumo michache ya silabi iliyobuniwa Afrika.']
];

const languageAccessibilityRepairs = [
  ['aria-label="Lang Filter"', 'aria-label="Chuja kwa lugha"'],
  ['aria-label="Gender Filter"', 'aria-label="Chuja kwa jinsia"'],
  ['aria-label="Suggest Gender"', 'aria-label="Chagua jinsia kwa mapendekezo"'],
  ['aria-label="ingizo Format"', 'aria-label="Muundo wa kuingiza"'],
  ['aria-label="Direction"', 'aria-label="Mwelekeo wa ubadilishaji"']
];
for (const file of allHtml(path.join(ROOT, 'sw'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (GENERATED_HTML.has(rel) || ownedByScopedParity(rel) || LOCALIZED_CATEGORY_ROUTES.sw.includes(rel) || (rel === 'sw/blogu/index.html' && read(rel).includes('scripts/build-localized-blog-hubs.js'))) continue;
  repair(rel, staticUiTransforms.concat(runtimeTransforms));
  repairScriptBoundaries(rel);
}

repair('sw/zana/kitengeneza-flyer/index.html', [
  ['bidhaa za creator', 'bidhaa za mtayarishi']
]);

repair('sw/zana/kijaribu-api/index.html', [
  ['<strong>{{baseUrl}}</strong>, <strong>{{token}}</strong>', '<code>{{baseUrl}}</code>, <code>{{token}}</code>']
]);

repair('sw/kenya/kikokotoo-kodi-mshahara/index.html', [
  ['.tool-hero { background: #0A1628; }', '.tool-hero { background: #0A1628; overflow: hidden; }']
]);

repair('sw/zana/nafasi-pdf/index.html', [
  [/<img id="imgPrev"(?![^>]*\balt=)/g, '<img id="imgPrev" alt="Mwonekano wa picha iliyopakiwa"']
]);

repair('sw/zana/kikokotoo-vat/index.html', [
  ['<div class="sw-field"><label for="vatAmount" id="amountLabel">Kiasi bila VAT</label><input class="sw-input" id="vatAmount" type="number" min="0" step="any" placeholder="Ingiza kiasi"></div>', '<div class="sw-field"><label for="vatAmount" id="amountLabel">Kiasi bila VAT</label><input class="sw-input" id="vatAmount" type="number" min="0" step="any" placeholder="Ingiza kiasi" aria-describedby="vatStatus"></div><p id="vatStatus" class="sw-muted" role="status" aria-live="polite"></p>'],
  ["function calcVat(){var amt=parseFloat(document.getElementById('vatAmount').value)||0;if(!amt){alert('Tafadhali ingiza kiasi.');return;}var c=currentCountry||VAT_DB.KE;", "function calcVat(){var amountInput=document.getElementById('vatAmount'),status=document.getElementById('vatStatus'),amt=parseFloat(amountInput.value)||0;if(!amt){status.textContent='Tafadhali ingiza kiasi kikubwa kuliko sifuri.';amountInput.focus();return;}status.textContent='';var c=currentCountry||VAT_DB.KE;"]
]);

// These native Swahili routes are normalized by this builder rather than by
// page-level locale packs. Keep their external translation requests aligned
// with the explicit, non-persistent consent contract used by the English tools.
output(
  'sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html',
  repairPidginTranslatorConsent(read('sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html'))
);
output(
  'sw/zana/kutafsiri-pdf/index.html',
  repairPdfTranslatorConsent(read('sw/zana/kutafsiri-pdf/index.html'))
);

output('sw/faragha/index.html', withAnalyticsLoader(withAnalyticsDisclosure(enhanceLegalSurface(privacyPage(), 'sw'))));
output('sw/masharti/index.html', withAnalyticsLoader(enhanceLegalSurface(termsPage(), 'sw')));
output('sw/msaada/index.html', helpPage());
const secondaryPages = renderSecondaryPages('sw');
output('sw/bei/index.html', withAnalyticsLoader(secondaryPages.pricing));
output('sw/tangaza/index.html', withAnalyticsLoader(secondaryPages.advertise));
output('sw/tafuta/index.html', withAnalyticsLoader(secondaryPages.search));
output('sw/pendekeza-zana/index.html', withAnalyticsLoader(secondaryPages.suggest));
output('sw/makundi/index.html', withAnalyticsLoader(secondaryPages.categories));
output('sw/mabadiliko/index.html', withAnalyticsLoader(secondaryPages.changelog));
for (const row of localizedCountryRows()) {
  output(row.sw.ownerFile, enhanceCountry(read(row.sw.ownerFile), 'sw', row.englishRoute));
}
for (const [rel, frRoute, swRoute] of [
  ['advertise/index.html', '/fr/advertise/', '/sw/tangaza/'],
  ['pricing/index.html', '/fr/pricing/', '/sw/bei/'],
  ['search/index.html', '/fr/search/', '/sw/tafuta/'],
  ['categories/index.html', '/fr/categories/', '/sw/makundi/']
  ,['changelog/index.html', '/fr/changelog/', '/sw/mabadiliko/']
]) {
  const swAlternate = `<link rel="alternate" hreflang="sw" href="https://afrotools.com${swRoute}">`;
  const current = read(rel);
  if (!current.includes(swAlternate)) {
    repair(rel, [[
      `<link rel="alternate" hreflang="fr" href="https://afrotools.com${frRoute}">`,
      `<link rel="alternate" hreflang="fr" href="https://afrotools.com${frRoute}">\n${swAlternate}`
    ]]);
  } else if ((current.match(new RegExp(swAlternate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length > 1) {
    repair(rel, [[new RegExp(`(?:${swAlternate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*)+`, 'g'), `${swAlternate}\n`]]);
  }
}
output('sw/kuhusu/index.html', withAnalyticsLoader(renderAbout('sw')));
output('sw/wasiliana/index.html', withAnalyticsLoader(renderContact('sw')));
output('sw/maswali-ya-mara-kwa-mara/index.html', withAnalyticsLoader(renderFaq('sw')));
output('sw/vidakuzi/index.html', withAnalyticsLoader(renderCookies('sw')));
output('sw/auth/index.html', bridgePage('auth'));
output('sw/dashboard/index.html', bridgePage('dashboard'));
output('sw/vault/index.html', bridgePage('vault'));

// Run visible-copy cleanup after route-specific repairs so a single build is idempotent.
for (const file of allHtml(path.join(ROOT, 'sw'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (GENERATED_HTML.has(rel) || ownedByScopedParity(rel) || LOCALIZED_CATEGORY_ROUTES.sw.includes(rel) || (rel === 'sw/blogu/index.html' && read(rel).includes('scripts/build-localized-blog-hubs.js'))) continue;
  repairVisibleLanguage(rel, visibleLanguageTransforms);
  repairScriptLanguage(rel, scriptLanguageRepairs);
}

// The language-app parity lane is deliberately narrow. These are the exact
// eleven English free-app counterparts owned by the Swahili language category.
// Phrase data remains bilingual by design; only Swahili UI, help copy and
// accessibility labels are normalized here.
for (const rel of languageParityRoutes) {
  repairVisibleLanguage(rel, languageParityVisibleRepairs);
  repair(rel, languageAccessibilityRepairs);
}
for (const [rel, fileName] of languageParityArtwork) {
  repairLanguageArtwork(rel, fileName);
}
repairVisibleLanguage(
  'sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html',
  pidginVisibleRepairs
);
repairScriptLanguage(
  'sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html',
  [
    [/'English'/g, "'Kiingereza'"],
    [/'Tafsiri →'/g, "'Tafsiri →'"]
  ]
);
repairVisibleLanguage(
  'sw/zana/transliteration-ya-maandishi/index.html',
  transliterationVisibleRepairs
);
repairTransliterationLandmarks();

// A historic visible-copy pass translated part of this CSS token. Keep the
// stable class name in generated output; classes are implementation data, not
// user-facing copy.
for (const rel of ['sw/biashara-ndogo/index.html', 'sw/biashara-na-uzingatiaji/index.html']) {
  repair(rel, [
    [/sw-malipo ya awalid-pdf-crosslinks/g, 'sw-business-pdf-crosslinks']
  ]);
}

repair('sw/zana/kilinganisha-tv-na-streaming/index.html', [
  ['min-width:600px', 'min-width:min(600px,100%)']
]);

repair('sw/zana/kulinganisha-hosting/index.html', [
  ['min-width:980px', 'min-width:min(980px,100%)']
]);

repair('sw/zana/orodha-vifaa/index.html', [
  ['min-width: 700px', 'min-width: min(700px, 100%)']
]);

for (const file of allHtml(path.join(ROOT, 'sw'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === 'sw/blogu/index.html' && read(rel).includes('scripts/build-localized-blog-hubs.js')) continue;
  if (LOCALIZED_CATEGORY_ROUTES.sw.includes(rel)) {
    const categorySource = read(rel)
      .replace(/<meta name="afrotools-sw-source-hash" content="[^"]*">/g, '')
      .replace(/<meta name="afrotools-content-id" content="sw-surface:[^"]*">/g, '')
      .replace(/<meta name="afrotools-source-owner" content="scripts\/build-swahili-product-surface\.js">/g, '');
    output(rel, enhanceCategory(categorySource, 'sw'));
  }
  ensureAccessibilityRuntime(rel);
}

// This older hand-authored route is outside the generated page set. Add the
// analytics loader after accessibility normalization so both scripts remain
// stable and the surface check stays idempotent.
output(
  'sw/kenya/kikokotoo-kodi-mshahara/index.html',
  withAnalyticsLoader(read('sw/kenya/kikokotoo-kodi-mshahara/index.html'))
);

const criticalFiles = [
  'sw/index.html', 'sw/zana-zote/index.html', 'sw/nchi/index.html',
  'sw/kenya/kikokotoo-kodi-mshahara/index.html', 'sw/zana/kibadilishaji-sarafu/index.html',
  'sw/zana/kikokotoo-vat/index.html', 'sw/faragha/index.html', 'sw/masharti/index.html',
  'sw/wasiliana/index.html', 'sw/msaada/index.html', 'sw/bei/index.html',
  'sw/kuhusu/index.html',
  'sw/auth/index.html', 'sw/dashboard/index.html', 'sw/vault/index.html'
];
const prohibitedVisible = /\b(?:Save Tool|Share as Image|Open Ask AfroTools AI|Privacy Policy|Terms of Use|Sign in|Try again|No results|Loading tools|Calculator|Calculate|Enter|Result|Reset|Save|Search|Select|Amount|Monthly|Annual|Total|Submit|Loading|Error|Required|Next|Previous|Print|Share|Copy)\b/i;
for (const rel of criticalFiles) {
  if (!fs.existsSync(filePath(rel))) { failures.push(`${rel}: required Swahili journey route is missing`); continue; }
  const text = visibleText(read(rel));
  const match = text.match(prohibitedVisible);
  if (match) failures.push(`${rel}: unexplained English UI contains "${match[0]}"`);
}

const prohibitedClaims = [
  ['sw/index.html', /Inatumiwa na wataalamu|Viwango vya leo|Fedha za Kigeni vya Moja kwa Moja|Kila nchi ya Afrika ina vikokotoo|Kodi sahihi ya mapato kwa kila nchi/i],
  ['sw/faragha/index.html', /Mahesabu yote|hazitumiwi kwenye seva zetu kamwe|haikusanyi kamwe/i],
  ['sw/masharti/index.html', /jukwaa bure la zana|kwa nchi 54 za Afrika|kusasisha zana zetu ndani ya siku/i],
  ['sw/wasiliana/index.html', /masaa 24|masaa 48|wataalamu wa Afrika wanaofanya maamuzi/i]
  ,['sw/kuhusu/index.html', /jukwaa bure la zana|hazitumiwi kwenye seva zetu kamwe|mahesabu yote yanafanyika kwenye kivinjari|kifaa chochote/i]
];
for (const [rel, pattern] of prohibitedClaims) {
  const match = visibleText(read(rel)).match(pattern);
  if (match) failures.push(`${rel}: obsolete or unsupported claim contains "${match[0]}"`);
}

const requiredPatterns = [
  ['sw/index.html', new RegExp(`data-registry-count="tools\\.locale\\.sw\\.published">${swTools}<`)],
  ['sw/zana-zote/index.html', new RegExp(`data-registry-count="tools\\.locale\\.sw\\.published">${swTools}<`)],
  ['sw/zana/kibadilishaji-sarafu/index.html', /data-currency-locale-vip="sw"/],
  ['sw/zana/kibadilishaji-sarafu/index.html', /currency-converter-locales-vip\.js/],
  ['sw/zana/kibadilishaji-sarafu/index.html', /Snapshot husitishwa baada ya siku 7/],
  ['sw/auth/index.html', /Ukurasa unaofuata ni wa Kiingereza/],
  ['sw/dashboard/index.html', /Ukurasa unaofuata ni wa Kiingereza/],
  ['sw/vault/index.html', /Ukurasa unaofuata ni wa Kiingereza/]
];
for (const [rel, pattern] of requiredPatterns) if (!pattern.test(read(rel))) failures.push(`${rel}: missing required product-contract pattern ${pattern}`);

if (failures.length) {
  console.error(`Swahili product surface failed (${failures.length}):`);
  failures.slice(0, 100).forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`${WRITE ? 'Updated' : 'Validated'} Swahili product surface${changed.length ? ` (${changed.length} files)` : ''}.`);
  console.log(`Swahili published records: ${swTools}; live experiences overall: ${liveTools}; countries: ${countries}; categories: ${categories}; site languages: ${languages}.`);
}
