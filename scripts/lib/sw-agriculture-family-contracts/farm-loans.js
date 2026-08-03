'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml } = require('../fr-agriculture-page-shell');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');
const PROGRAM_TYPES = Object.freeze({
  'BDEAC Regional': 'Mpango wa kikanda wa BDEAC',
  'BOAD Regional': 'Mpango wa kikanda wa BOAD',
  'CBN Scheme': 'Mpango wa CBN',
  Commercial: 'Benki ya biashara',
  'Community MFI': 'Taasisi ya fedha ndogo ya jamii',
  'Coop Bank': 'Benki ya ushirika',
  'Coop Finance': 'Fedha za ushirika',
  'Credit Union': 'Chama cha kuweka na kukopa',
  'Dev Bank': 'Benki ya maendeleo',
  Fintech: 'Teknolojia ya fedha',
  'Gov Agri Bank': 'Benki ya kilimo ya serikali',
  'Gov Bank': 'Benki ya serikali',
  'Gov Fund': 'Mfuko wa serikali',
  'Gov Grant': 'Ruzuku ya serikali',
  'Gov Programme': 'Mpango wa serikali',
  'Gov SACCO': 'SACCO ya serikali',
  'Gov Scheme': 'Mpango wa serikali',
  'Gov Subsidy': 'Ruzuku ya serikali',
  Guarantee: 'Dhamana',
  'Islamic Finance': 'Fedha za Kiislamu',
  Microfinance: 'Fedha ndogo',
  NGO: 'Asasi isiyo ya serikali',
  'Rural Bank': 'Benki ya vijijini',
  SACCO: 'SACCO',
  'Youth Scheme': 'Mpango wa vijana',
});
const COUNTRY_NAMES = Object.freeze({ MA: 'Moroko' });
const FRESHNESS_LABEL = 'Kila rekodi ina kiungo rasmi na tarehe ya ukaguzi; ukaguzi wa hazina ulifanywa 2 Agosti 2026. Masharti yanaweza kubadilika baada ya tarehe hiyo.';
const CONFIDENCE_LABEL = 'Ulinganishaji wa vigezo, muda na marejesho ni wa uthabiti wa juu kwa rekodi za mkopo. Rekodi za orodha, ruzuku, dhamana, pembejeo au bima zinaonyeshwa bila kudai kuwa ni mkopo.';

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function attribute(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}="([^"]+)"`, 'i'));
  if (!match) throw new Error(`English Farm Loans input is missing ${name}.`);
  return match[1];
}

function inputTag(html, id) {
  const match = html.match(new RegExp(`<input\\b[^>]*\\bid="${id}"[^>]*>`, 'i'));
  if (!match) throw new Error(`English Farm Loans page is missing #${id}.`);
  return match[0];
}

function englishContract(row) {
  if (!row.country) return null;
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const amount = inputTag(html, 'inpAmount');
  const sourceMatch = html.match(/<p[^>]*>Data sources:\s*([\s\S]*?)<\/p>/i);
  if (!sourceMatch) throw new Error(`${row.english.file} has no named Farm Loans source footer.`);
  const sourceText = decodeEntities(sourceMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  const sourceNames = sourceText
    .replace(/\.\s+(?:Interest rates|Rates) as of 2025-2026\.$/i, '')
    .replace(/\.$/, '');
  if (!sourceNames || /Rates as of|Interest rates as of/i.test(sourceNames)) {
    throw new Error(`${row.english.file} has an incomplete Farm Loans source footer.`);
  }
  return {
    amountMin: Number(attribute(amount, 'min')),
    amountStep: Number(attribute(amount, 'step')),
    amountDefault: Number(attribute(amount, 'value')),
    sourceNames,
    sourceText,
  };
}

function countryName(row) {
  return COUNTRY_NAMES[row.country.code] || row.country.swahiliName;
}

function trustBlock(row, hub, loanContract) {
  const source = hub
    ? 'Muktadha wa fedha vijijini: <a href="https://www.ifad.org/en/rural-finance" target="_blank" rel="noopener">IFAD - fedha za vijijini</a>. Programu na viwango vya nchi hutoka kwenye hazina tuli ya AfroTools.'
    : `Hazina ya programu <code>data/agriculture/agri-loans-data.js</code> imeunganishwa na rejista ya ushahidi <code>data/agriculture/agri-loans-evidence.js</code>. Kila rekodi ya ${escapeHtml(countryName(row))} ina kiungo rasmi, tarehe ya ukaguzi na tarehe ya rekodi au uanzo; marejeo ya jumla ya ukurasa wa Kiingereza ni ${escapeHtml(loanContract.sourceNames)}.`;
  return `<section class="card"><h2>Chanzo, upya na kiwango cha uhakika</h2><div class="trust-grid farm-loans-trust"><div class="trust-item"><strong>Chanzo</strong><span>${source}</span></div><div class="trust-item"><strong>Upya</strong><span>${escapeHtml(FRESHNESS_LABEL)}</span></div><div class="trust-item"><strong>Kiwango cha uhakika</strong><span>${escapeHtml(CONFIDENCE_LABEL)}</span></div></div><p>Hakikisha programu, riba, APR, ada, dhamana, muda, nyaraka na dirisha la maombi moja kwa moja kwa mkopeshaji. Matokeo haya si ofa ya mkopo, idhini ya mkopo wala ushauri wa fedha.</p><p><strong>Faragha:</strong> ${hub ? 'ukurasa huu ni orodha ya nchi na hautumii ingizo lolote.' : 'hesabu na faili hutengenezwa kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'}</p><p><strong>AI:</strong> kitambulisho cha njia ni <code>${escapeHtml(row.english.id)}</code>. Msaidizi wa AfroTools ni wa hiari na lazima aombe idhini kabla ya kutuma maudhui kwa modeli.</p></section>`;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((first, second) => countryName(first).localeCompare(countryName(second), 'sw'));
  if (countries.length !== 15) throw new Error(`Farm Loans hub requires 15 manifest countries; found ${countries.length}.`);
  return renderSwahiliAgriculturePage({
    row,
    title: 'Mipango ya mikopo ya shamba kwa nchi | AfroTools',
    description: 'Chagua nchi ili kulinganisha vigezo vilivyohifadhiwa vya programu za mikopo ya shamba na kukadiria marejesho kwa sarafu ya nchi.',
    heading: 'Mipango ya mikopo ya shamba',
    lead: 'Chagua mojawapo ya nchi 15 ili kulinganisha vigezo vya programu vilivyohifadhiwa na kukadiria marejesho bila kutuma taarifa zako.',
    artwork: row.artwork.file,
    body: `<style>.card,.country-list a{border-color:#64748b}.country-list a:focus,.country-list a:focus-visible{outline:3px solid #075eb8;outline-offset:3px}html[data-theme="dark"] .card{border-color:#9fb0c7}html[data-theme="dark"] .country-list a:focus,html[data-theme="dark"] .country-list a:focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .card{border-color:#9fb0c7}html[data-theme="system"] .country-list a:focus,html[data-theme="system"] .country-list a:focus-visible{outline-color:#75b8ff}}</style><section class="card"><h2>Chagua nchi</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(countryName(item))}</a></li>`).join('')}</ul></section>${trustBlock(row, true, null)}`,
    scripts: '',
    pageConfig: { id: row.english.id, aiRouteId: row.english.id },
    familyLabel: 'Mikopo ya shamba',
    familyRoute: row.swahili.route,
    currentLabel: 'Chagua nchi',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const localizedCountryName = countryName(row);
  const loanContract = englishContract(row);
  const config = {
    id: row.english.id,
    aiRouteId: row.english.id,
    countryCode: row.country.code,
    countryName: localizedCountryName,
    locale: 'sw',
    programTypes: PROGRAM_TYPES,
    amountMin: loanContract.amountMin,
    amountStep: loanContract.amountStep,
    amountDefault: loanContract.amountDefault,
    sourceNames: loanContract.sourceNames,
    freshnessLabel: FRESHNESS_LABEL,
    confidenceLabel: CONFIDENCE_LABEL,
    storageKey: 'afrotools:sw-agriculture:farm-loans',
  };
  const body = `<style>.farm-loans-app .field input,.farm-loans-app .field select,.farm-loans-app .action,.farm-loans-app fieldset{border-color:#64748b}.farm-loans-app :is(a,button,input,select):focus,.farm-loans-app :is(a,button,input,select):focus-visible{outline:3px solid #075eb8;outline-offset:3px}.farm-loans-app .action.primary{background:#075eb8;color:#fff;border-color:#075eb8}.farm-loans-app .action:disabled{opacity:.58;cursor:not-allowed}.loan-program-card h3,.loan-program-card .recommendations{min-width:0;overflow-wrap:anywhere}.loan-program-card .recommendations{padding-left:1.15rem}.loan-program-card .recommendations li{max-width:100%;overflow-wrap:anywhere}.farm-loans-app fieldset{min-width:0;border-width:1px;border-style:solid;border-radius:.65rem;padding:.75rem}.farm-loans-app legend{font-weight:700;padding:0 .25rem}html[data-theme="dark"] .farm-loans-app .field input,html[data-theme="dark"] .farm-loans-app .field select,html[data-theme="dark"] .farm-loans-app .action,html[data-theme="dark"] .farm-loans-app fieldset{border-color:#9fb0c7}html[data-theme="dark"] .farm-loans-app :is(a,button,input,select):focus,html[data-theme="dark"] .farm-loans-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}@media(prefers-color-scheme:dark){html[data-theme="system"] .farm-loans-app .field input,html[data-theme="system"] .farm-loans-app .field select,html[data-theme="system"] .farm-loans-app .action,html[data-theme="system"] .farm-loans-app fieldset{border-color:#9fb0c7}html[data-theme="system"] .farm-loans-app :is(a,button,input,select):focus,html[data-theme="system"] .farm-loans-app :is(a,button,input,select):focus-visible{outline-color:#75b8ff}}@media(max-width:360px){.farm-loans-trust{grid-template-columns:minmax(0,1fr)}.farm-loans-trust>*{min-width:0;overflow-wrap:anywhere}}</style><div class="farm-loans-app">
<section class="card"><h2>Taarifa za mkulima na ombi</h2><form id="loanForm" novalidate><div class="grid"><div class="field"><label for="age">Umri (miaka)</label><input id="age" type="number" min="16" max="80" step="1" value="30" inputmode="numeric"></div><div class="field"><label for="farmSize">Ukubwa wa shamba (ha)</label><input id="farmSize" type="number" min="0.1" max="10000" step="0.1" value="1" inputmode="decimal"></div><div class="field"><label for="amount">Kiasi cha mkopo kinachohitajika</label><input id="amount" type="number" min="${loanContract.amountMin}" step="${loanContract.amountStep}" value="${loanContract.amountDefault}" inputmode="decimal"><small id="currencyHint"></small></div><div class="field"><label for="tenor">Muda wa marejesho</label><select id="tenor"><option value="6">Miezi 6</option><option value="12" selected>Miezi 12</option><option value="18">Miezi 18</option><option value="24">Miezi 24</option><option value="36">Miezi 36</option><option value="48">Miezi 48</option><option value="60">Miezi 60</option></select></div>
<fieldset><legend>Je, wewe ni mwanachama wa ushirika au kikundi cha wakulima?</legend><div><input id="coopYes" name="coop" type="radio" value="yes" checked><label for="coopYes">Ndiyo</label> <input id="coopNo" name="coop" type="radio" value="no"><label for="coopNo">Hapana</label></div></fieldset><fieldset><legend>Je, una akaunti ya benki?</legend><div><input id="bankYes" name="bank" type="radio" value="yes" checked><label for="bankYes">Ndiyo</label> <input id="bankNo" name="bank" type="radio" value="no"><label for="bankNo">Hapana</label></div></fieldset><fieldset><legend>Je, una dhamana?</legend><p><small>Kwa mfano hati ya ardhi, mali au kifaa.</small></p><div><input id="collateralYes" name="collateral" type="radio" value="yes"><label for="collateralYes">Ndiyo</label> <input id="collateralNo" name="collateral" type="radio" value="no" checked><label for="collateralNo">Hapana</label></div></fieldset><fieldset><legend>Je, umekamilisha mafunzo yanayohitajika na programu?</legend><p><small>Chagua ndiyo tu ikiwa una uthibitisho wa mafunzo ya lazima.</small></p><div><input id="trainingYes" name="training" type="radio" value="yes"><label for="trainingYes">Ndiyo</label> <input id="trainingNo" name="training" type="radio" value="no" checked><label for="trainingNo">Hapana</label></div></fieldset></div><div class="actions"><button class="action primary" type="submit">Linganisha programu</button><button class="action" type="reset">Weka upya</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Matokeo</h2><div class="empty" id="emptyState">Bado hujalinganisha programu.</div><div id="resultPanel" class="result-panel" tabindex="-1" aria-live="polite" hidden><div class="result-grid" id="summary"></div><h3 id="eligibleTitle"></h3><div id="eligibleList"></div><section id="ineligibleSection"><h3 id="ineligibleTitle"></h3><div id="ineligibleList"></div></section><div class="actions"><button class="action" type="button" data-result-action="copy" disabled>Nakili</button><button class="action" type="button" data-result-action="share" disabled>Shiriki</button><button class="action" type="button" data-result-action="save" disabled>Hifadhi kwenye kivinjari</button><button class="action" type="button" data-result-action="pdf" disabled>Pakua PDF</button><button class="action" type="button" data-result-action="csv" disabled>Pakua CSV</button><button class="action" type="button" data-result-action="json" disabled>Pakua JSON</button><button class="action" type="button" data-result-action="txt" disabled>Pakua TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>${trustBlock(row, false, loanContract)}</div>`;
  const scripts = '<script src="/data/agriculture/agri-loans-data.js"></script><script src="/data/agriculture/agri-loans-evidence.js"></script><script src="/engines/farm-loan-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-agriculture-farm-loans.js"></script>';
  return renderSwahiliAgriculturePage({
    row,
    title: `Mipango ya mikopo ya shamba - ${localizedCountryName} | AfroTools`,
    description: `Linganisha vigezo vilivyohifadhiwa vya programu za mikopo ya shamba na ukadirie marejesho kwa sarafu ya ${localizedCountryName}.`,
    heading: `Mikopo ya shamba - ${localizedCountryName}`,
    lead: `Linganisha masharti yaliyo kwenye hazina ya ${localizedCountryName} na ukadirie marejesho bila kutuma taarifa zako. Huu si uamuzi wa mkopeshaji.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    countryName: localizedCountryName,
    familyLabel: 'Mikopo ya shamba',
    familyRoute: '/sw/zana/ustahiki-wa-mkopo-wa-shamba/',
  });
}

module.exports = {
  id: 'farm-loans',
  CONFIDENCE_LABEL,
  COUNTRY_NAMES,
  FRESHNESS_LABEL,
  PROGRAM_TYPES,
  countryName,
  decodeEntities,
  englishContract,
  render,
  renderHub,
};
