#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildCanonicalRegistry, getSelector } = require('./lib/canonical-registry');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const changed = [];
const failures = [];
const GENERATED_HTML = new Set([
  'sw/faragha/index.html',
  'sw/masharti/index.html',
  'sw/msaada/index.html',
  'sw/bei/index.html',
  'sw/auth/index.html',
  'sw/dashboard/index.html',
  'sw/vault/index.html'
]);

function filePath(rel) { return path.join(ROOT, rel); }
function read(rel) { return fs.readFileSync(filePath(rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }
function normalize(value) { return String(value).normalize('NFC').replace(/\r\n/g, '\n'); }
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sourceHash(value) { return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16); }

function output(rel, value) {
  let normalized = normalize(value);
  const file = filePath(rel);
  const current = fs.existsSync(file) ? normalize(fs.readFileSync(file, 'utf8')) : '';
  if (GENERATED_HTML.has(rel)) {
    const hash = sourceHash(normalized);
    const contentId = `sw-surface:${rel.replace(/\/index\.html$|\.html$/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
    normalized = normalized.replace('<head>', `<head><meta name="afrotools-sw-source-hash" content="${hash}"><meta name="afrotools-content-id" content="${contentId}"><meta name="afrotools-source-owner" content="scripts/build-swahili-product-surface.js">`);
    if (!WRITE && current.includes(`name="afrotools-sw-source-hash" content="${hash}"`)) return;
  }
  if (current === normalized) return;
  if (!WRITE) {
    failures.push(`${rel}: generated Swahili product surface is stale`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, 'utf8');
  changed.push(rel);
}

function repair(rel, transforms) {
  let html = read(rel);
  for (const [from, to] of transforms) {
    html = from instanceof RegExp ? html.replace(from, to) : html.split(from).join(to);
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
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="https://afrotools.com${canonical}"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css"><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script><style>.sw-contract-main{max-width:900px;margin:auto;padding:56px 20px 80px}.sw-contract-main h1{font-size:clamp(2rem,6vw,3.4rem);line-height:1.05}.sw-contract-main h2{margin-top:2rem}.sw-contract-main p,.sw-contract-main li{line-height:1.75}.sw-contract-note{padding:1rem 1.2rem;border-left:4px solid #0062cc;background:#eef6ff;border-radius:8px}.sw-contract-warning{padding:1rem 1.2rem;border:1px solid #f0c36d;background:#fff8e7;border-radius:12px}.sw-contract-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:1.25rem 0}.sw-contract-card{padding:18px;border:1px solid #dce5ef;border-radius:14px;background:#fff}.sw-contract-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:1.25rem}.sw-contract-actions a{display:inline-flex;min-height:44px;align-items:center;padding:10px 16px;border-radius:10px;background:#0062cc;color:#fff;font-weight:800;text-decoration:none}.sw-contract-actions a.alt{background:#fff;color:#075fb8;border:1px solid #9dc4ec}.sw-contract-table{width:100%;border-collapse:collapse;margin:1rem 0}.sw-contract-table th,.sw-contract-table td{padding:10px;border:1px solid #dce5ef;text-align:left;vertical-align:top}@media(max-width:680px){.sw-contract-grid{grid-template-columns:1fr}.sw-contract-table,.sw-contract-table tbody,.sw-contract-table tr,.sw-contract-table th,.sw-contract-table td{display:block}.sw-contract-table th{background:#f4f8fc}}</style>`;
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

repair('sw/index.html', homeTransforms);
repair('sw/zana-zote/index.html', [
  [/Vikokotoo 2,606\+ bure vya/g, `${swTools} rekodi zilizochapishwa za`],
  [/zana nyingine 2,606\+ za Afrika kwa Kiswahili/g, `rekodi ${swTools} zilizochapishwa kwa Kiswahili`],
  [`PAYE, mishahara na zana 2,606+ za Afrika`, `PAYE, mishahara na rekodi <span data-registry-count="tools.locale.sw.published">${swTools}</span> za Kiswahili`],
  ['Anza na PAYE, kisha tafuta kima cha chini cha mshahara, muda wa ziada, likizo, hifadhi ya jamii, VAT, sarafu, biashara na zana nyingine za kila siku kwa muktadha wa Afrika.', 'Tafuta ndani ya rekodi za Kiswahili. Matokeo ya Kiingereza huwekwa alama kabla ya kufunguliwa, na nchi ya zana haibadilishi lugha ya ukurasa.'],
  ['Tengeneza ankara za kitaalamu kwa sekunde. Pakua PDF mara moja bila usajili wowote.', 'Tengeneza ankara na ufuate hatua ya PDF iliyoelezwa kwenye zana.'],
  ['Mapishi ya vyakula 2,606+ vya Afrika kutoka nchi zote 54.', 'Mapishi ya Afrika yaliyoorodheshwa kwenye AfroKitchen.']
]);
repair('sw/nchi/index.html', [
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
  ['window.location.href="/auth/?mode=login&next=/dashboard/";', 'window.location.href="/sw/auth/?mode=login&next=%2Fsw%2Fdashboard%2F";']
];
for (const file of allHtml(path.join(ROOT, 'sw'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (GENERATED_HTML.has(rel)) continue;
  repair(rel, staticUiTransforms.concat(runtimeTransforms));
}

repair('sw/zana/kibadilishaji-sarafu/index.html', [
  ['<p>Inapopatikana, zana hutumia /data/forex/latest.json kama chanzo cha kiwango cha ubadilishaji. Ikishindikana, hutumia kiwango cha akiba cha makadirio kama ukurasa wa Kiingereza.</p>', '<p>Inapopatikana, zana hutumia <code>/data/forex/latest.json</code> kama snapshot yenye chanzo na muda. Ikishindikana au ikiwa rekodi ni tupu, hutumia viwango vya akiba vya makadirio na kuonyesha hali hiyo wazi.</p><p id="fxDataStatus" role="status" aria-live="polite">Inapakia hali ya kiwango…</p><button id="fxRetry" type="button" hidden>Jaribu tena</button>'],
  ["let fxRates=Object.assign({},FX_FALLBACK),fxStamp=null,fxSource='fallback ya makadirio';", "let fxRates=Object.assign({},FX_FALLBACK),fxStamp=null,fxSource='viwango vya akiba vya makadirio';"],
  [/async function fetchFx\(\)\{try\{var res=await fetch\('\/data\/forex\/latest\.json',\{cache:'no-cache'\}\);if\(!res\.ok\)throw new Error\('HTTP '\+res\.status\);var data=await res\.json\(\);if\(data&&data\.rates\)\{fxRates=Object\.assign\(\{\},FX_FALLBACK,data\.rates\);fxStamp=data\.timestamp\|\|data\.updatedAt\|\|null;fxSource='snapshot ya AfroTools';\}\}catch\(e\)\{console\.warn\('FX data fallback',e\);\}renderPairs\(\);convertCurrency\(\);\}/, "async function fetchFx(){var status=document.getElementById('fxDataStatus'),retry=document.getElementById('fxRetry');status.textContent='Inapakia hali ya kiwango…';retry.hidden=true;try{var res=await fetch('/data/forex/latest.json',{cache:'no-cache'});if(!res.ok)throw new Error('HTTP '+res.status);var data=await res.json();if(!data||!data.rates||!Object.keys(data.rates).length)throw new Error('empty rates');fxRates=Object.assign({},FX_FALLBACK,data.rates);fxStamp=data.timestamp||data.updatedAt||null;fxSource='snapshot ya AfroTools';status.textContent='Snapshot imepatikana. Kagua chanzo na muda unaoonyeshwa kwenye matokeo.';}catch(e){fxRates=Object.assign({},FX_FALLBACK);fxStamp=null;fxSource='viwango vya akiba vya makadirio';status.textContent='Chanzo cha mtandao hakipatikani. Tunatumia viwango vya akiba vya makadirio; si viwango vya moja kwa moja.';retry.hidden=false;}renderPairs();convertCurrency();}"],
  ["document.getElementById('fxUpdated').textContent=fxSource+(fxStamp?' - '+new Date(fxStamp).toLocaleString('en'):'');", "document.getElementById('fxUpdated').textContent=fxSource+(fxStamp?' - '+new Intl.DateTimeFormat('sw-KE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(fxStamp)):'');"],
  ["document.getElementById('fxRetry').addEventListener('click',fetchFx);document.getElementById('fxRetry').addEventListener('click',fetchFx);", "document.getElementById('fxRetry').addEventListener('click',fetchFx);"],
  ['fillCurrencySelects();renderPairs();fetchFx();', "fillCurrencySelects();renderPairs();document.getElementById('fxRetry').addEventListener('click',fetchFx);fetchFx();"]
]);

output('sw/faragha/index.html', privacyPage());
output('sw/masharti/index.html', termsPage());
output('sw/msaada/index.html', helpPage());
output('sw/bei/index.html', pricingPage());
output('sw/auth/index.html', bridgePage('auth'));
output('sw/dashboard/index.html', bridgePage('dashboard'));
output('sw/vault/index.html', bridgePage('vault'));

const criticalFiles = [
  'sw/index.html', 'sw/zana-zote/index.html', 'sw/nchi/index.html',
  'sw/kenya/kikokotoo-kodi-mshahara/index.html', 'sw/zana/kibadilishaji-sarafu/index.html',
  'sw/zana/kikokotoo-vat/index.html', 'sw/faragha/index.html', 'sw/masharti/index.html',
  'sw/wasiliana/index.html', 'sw/msaada/index.html', 'sw/bei/index.html',
  'sw/kuhusu/index.html',
  'sw/auth/index.html', 'sw/dashboard/index.html', 'sw/vault/index.html'
];
const prohibitedVisible = /\b(?:Save Tool|Share as Image|Open Ask AfroTools AI|Privacy Policy|Terms of Use|Sign in|Try again|No results|Loading tools)\b/i;
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
  ['sw/zana/kibadilishaji-sarafu/index.html', /fxDataStatus/],
  ['sw/zana/kibadilishaji-sarafu/index.html', /si viwango vya moja kwa moja/],
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
