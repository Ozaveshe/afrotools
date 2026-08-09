#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const currencies = '<option>NGN</option><option>KES</option><option>GHS</option><option>ZAR</option><option>UGX</option><option>TZS</option><option>RWF</option><option>ZMW</option><option>XOF</option><option>XAF</option><option>USD</option><option>EUR</option><option>GBP</option>';
const countries = '<option value="KE">Kenya</option><option value="TZ">Tanzania</option><option value="UG">Uganda</option><option value="RW">Rwanda</option><option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="ZA">Afrika Kusini</option><option value="ZM">Zambia</option><option value="OTHER">Nchi nyingine</option>';

function contextFields() {
  return `<div class="form-group"><label for="context-country">Nchi au soko la masharti</label><select id="context-country">${countries}</select></div>
  <div class="form-group"><label for="context-provider">Mtoa huduma au mkopeshaji</label><input id="context-provider" type="text" maxlength="120" placeholder="Jina kwenye ofa au taarifa"></div>`;
}

function emergencyBody() {
  return `<h2>Weka lengo la mfuko wako wa dharura</h2>
  <div class="form-grid">${contextFields()}
    <div class="form-group"><label for="ef-currency">Sarafu</label><select id="ef-currency">${currencies}</select></div>
    <div class="form-group"><label for="ef-monthly">Gharama muhimu kwa mwezi</label><input type="number" id="ef-monthly" value="150000" min="0.01" step="0.01" required></div>
    <div class="form-group"><label for="ef-months">Miezi ya kufunika</label><input type="number" id="ef-months" value="6" min="1" max="24" step="1" required><span class="field-help">Chagua kulingana na hatari, majukumu na muda wako wa kurejea kwenye mapato.</span></div>
    <div class="form-group"><label for="ef-current">Akiba ya dharura uliyonayo</label><input type="number" id="ef-current" value="0" min="0" step="0.01" required></div>
    <div class="form-group"><label for="ef-monthly-save">Uwezo wa kuweka akiba kwa mwezi</label><input type="number" id="ef-monthly-save" value="30000" min="0" step="0.01" required></div>
    <div class="form-group"><label for="ef-inflation">Mfumuko wa bei wa kupanga (%)</label><input type="number" id="ef-inflation" value="10" min="0" max="100" step="0.01" required></div>
    <div class="form-group"><label for="ef-inflation-years">Miaka ya kupanga mfumuko wa bei</label><input type="number" id="ef-inflation-years" value="3" min="0" max="10" step="1" required></div>
  </div>
  <button type="button" class="btn-calc" onclick="calcEF()">Kokotoa mfuko wa dharura</button>
  <p class="form-error" id="ef-error" role="alert"></p>
  <div class="results" id="ef-results" role="region" aria-live="polite" tabindex="-1">
    <div class="res-hero"><div class="res-label">Lengo la mfuko wa dharura</div><div class="res-val" id="ef-target"></div><div class="res-sub" id="ef-sub"></div></div>
    <div class="metrics"><div class="metric"><div class="metric-val" id="ef-gap"></div><div class="metric-label">Pengo la sasa</div></div><div class="metric"><div class="metric-val" id="ef-months-to-goal"></div><div class="metric-label">Muda wa kufikia lengo</div></div><div class="metric"><div class="metric-val" id="ef-monthly-need"></div><div class="metric-label">Akiba ya mwezi kwa lengo la miezi 12</div></div><div class="metric"><div class="metric-val" id="ef-inflation-adj"></div><div class="metric-label" id="ef-inflation-label">Lengo baada ya mfumuko wa bei</div></div></div>
    <div class="progress-wrap"><div class="progress-label"><span>Maendeleo kuelekea lengo</span><span id="ef-progress-pct">0%</span></div><div class="progress-bar"><div class="progress-fill" id="ef-progress-fill" style="width:0%"></div></div></div>
  </div>`;
}

function debtRow(number, balance, payment, rate) {
  return `<tr><td><label class="sr-only" for="debt-name-${number}">Jina la deni ${number}</label><input id="debt-name-${number}" type="text" value="Deni ${number}" aria-label="Jina la deni ${number}"></td><td><label class="sr-only" for="debt-balance-${number}">Salio la deni ${number}</label><input id="debt-balance-${number}" type="number" value="${balance}" min="0.01" step="0.01" aria-label="Salio la deni ${number}"></td><td><label class="sr-only" for="debt-payment-${number}">Malipo ya chini ya deni ${number}</label><input id="debt-payment-${number}" type="number" value="${payment}" min="0.01" step="0.01" aria-label="Malipo ya chini ya deni ${number}"></td><td><label class="sr-only" for="debt-rate-${number}">Riba ya mwaka ya deni ${number}</label><input id="debt-rate-${number}" type="number" value="${rate}" min="0" max="1000" step="0.01" aria-label="Riba ya mwaka ya deni ${number}"></td><td><button type="button" class="btn-del" aria-label="Ondoa deni ${number}" onclick="this.closest('tr').remove()">&#x2715;</button></td></tr>`;
}

function snowballBody() {
  return `<h2>Weka madeni yako</h2>
  <div class="form-grid">${contextFields()}</div>
  <div class="table-wrap"><table class="debt-table"><thead><tr><th>Jina la deni</th><th>Salio</th><th>Malipo ya chini</th><th>Riba kwa mwaka (%)</th><th>Ondoa</th></tr></thead><tbody id="debt-list">${debtRow(1, 50000, 15000, 24)}${debtRow(2, 300000, 18000, 18)}${debtRow(3, 150000, 14000, 14)}</tbody></table></div>
  <button type="button" class="btn-add" onclick="addDebtRow()">+ Ongeza deni</button>
  <div class="extra-payment"><div class="form-group"><label for="ds-currency">Sarafu</label><select id="ds-currency">${currencies}</select></div><div class="form-group"><label for="ds-extra">Malipo ya ziada kwa mwezi juu ya viwango vya chini</label><input type="number" id="ds-extra" value="10000" min="0" step="0.01"></div></div>
  <button type="button" class="btn-calc" onclick="calcDebtPayoff()">Linganisha mipango ya kulipa</button>
  <p class="form-error" id="ds-error" role="alert"></p>
  <div class="results" id="ds-results" role="region" aria-live="polite" tabindex="-1">
    <div class="compare-methods"><div class="comp-method method-snowball" id="ds-snowball-card"><div class="method-title">Snowball: salio dogo kwanza</div><div class="method-val" id="ds-snowball-months"></div><div class="method-sub" id="ds-snowball-interest"></div><div class="method-sub" id="ds-snowball-total"></div></div><div class="comp-method method-avalanche" id="ds-avalanche-card"><div class="method-title">Avalanche: riba kubwa kwanza</div><div class="method-val" id="ds-avalanche-months"></div><div class="method-sub" id="ds-avalanche-interest"></div><div class="method-sub" id="ds-avalanche-total"></div></div></div>
    <div id="ds-recommendation"></div>
    <h3>Mpangilio wa Snowball</h3><div class="table-wrap"><table class="payoff-table"><thead><tr><th>Kipaumbele</th><th>Deni</th><th>Salio</th><th>Riba</th><th>Muda wa makadirio</th></tr></thead><tbody id="ds-order"></tbody></table></div>
  </div>`;
}

function loanEntry(number, balance, payment, rate) {
  return `<div class="loan-entry"><h3>Mkopo ${number}</h3><div class="loan-entry-grid"><div class="form-group"><label for="loan-balance-${number}">Salio</label><input id="loan-balance-${number}" aria-label="Salio la mkopo ${number}" type="number" class="lc-balance" value="${balance}" min="0.01" step="0.01"></div><div class="form-group"><label for="loan-payment-${number}">Malipo kwa mwezi</label><input id="loan-payment-${number}" aria-label="Malipo ya mkopo ${number} kwa mwezi" type="number" class="lc-payment" value="${payment}" min="0.01" step="0.01"></div><div class="form-group"><label for="loan-rate-${number}">Riba kwa mwaka (%)</label><input id="loan-rate-${number}" aria-label="Riba ya mkopo ${number} kwa mwaka" type="number" class="lc-rate" value="${rate}" min="0" max="1000" step="0.01"></div></div><button type="button" aria-label="Ondoa mkopo ${number}" class="btn-del" onclick="this.closest('.loan-entry').remove()">&#x2715;</button></div>`;
}

function consolidationBody() {
  return `<h2>Mikopo ya sasa</h2>
  <div class="form-grid">${contextFields()}</div>
  <div id="loans-list">${loanEntry(1, 500000, 25000, 28)}${loanEntry(2, 300000, 18000, 36)}${loanEntry(3, 200000, 12000, 18)}</div>
  <button type="button" class="btn-add" onclick="addLoan()">+ Ongeza mkopo</button>
  <h2>Masharti ya mkopo wa kuunganisha</h2><div class="form-grid"><div class="form-group"><label for="lc-currency">Sarafu</label><select id="lc-currency">${currencies}</select></div><div class="form-group"><label for="lc-new-rate">Riba ya mkopo mpya kwa mwaka (%)</label><input type="number" id="lc-new-rate" value="22" min="0" max="1000" step="0.01"></div><div class="form-group"><label for="lc-new-tenor">Muda wa mkopo mpya</label><select id="lc-new-tenor"><option value="12">Miezi 12</option><option value="24" selected>Miezi 24</option><option value="36">Miezi 36</option><option value="48">Miezi 48</option><option value="60">Miezi 60</option></select></div><div class="form-group"><label for="lc-origination">Ada ya kuanzisha inayofadhiliwa (%)</label><input type="number" id="lc-origination" value="2" min="0" max="100" step="0.1"></div></div>
  <button type="button" class="btn-calc" onclick="calcConsolidation()">Linganisha chaguo</button>
  <p class="form-error" id="lc-error" role="alert"></p>
  <div class="results" id="lc-results" role="region" aria-live="polite" tabindex="-1"><div class="verdict" id="lc-verdict-box"><div class="verdict-label">Ulinganisho wa makadirio</div><div class="verdict-val" id="lc-verdict-val"></div><div class="verdict-sub" id="lc-verdict-sub"></div></div><div class="metrics"><div class="metric"><div class="metric-val" id="lc-current-monthly"></div><div class="metric-label">Malipo ya sasa kwa mwezi</div></div><div class="metric"><div class="metric-val" id="lc-new-monthly"></div><div class="metric-label">Malipo mapya kwa mwezi</div></div><div class="metric"><div class="metric-val" id="lc-monthly-savings"></div><div class="metric-label">Tofauti ya malipo ya mwezi</div></div><div class="metric"><div class="metric-val" id="lc-total-savings"></div><div class="metric-label">Tofauti ya jumla ya malipo</div></div><div class="metric"><div class="metric-val" id="lc-breakeven"></div><div class="metric-label">Tofauti ya muda</div></div><div class="metric"><div class="metric-val" id="lc-total-balance"></div><div class="metric-label">Jumla ya salio la kuunganisha</div></div></div></div>`;
}

const apps = [
  {id:'emergency-fund', route:'/sw/zana/mfuko-wa-dharura/', file:'sw/zana/mfuko-wa-dharura/index.html', en:'/tools/emergency-fund/', fr:'/fr/tools/fonds-urgence/', title:'Kikokotoo cha mfuko wa dharura', description:'Kokotoa lengo, pengo la sasa, muda wa kuweka akiba na athari ya mfumuko wa bei kwa mfuko wako wa dharura.', image:'/assets/img/tools/emergency-fund.webp', width:600, height:400, controller:'emergency-fund.js', body:emergencyBody()},
  {id:'debt-snowball', route:'/sw/zana/mpango-wa-kulipa-madeni/', file:'sw/zana/mpango-wa-kulipa-madeni/index.html', en:'/tools/debt-snowball/', fr:'/fr/tools/boule-neige-dettes/', title:'Mpango wa kulipa madeni: Snowball na Avalanche', description:'Linganisha muda na riba ya kulipa madeni kwa salio dogo kwanza au riba kubwa kwanza chini ya bajeti ileile.', image:'/assets/img/tools/debt-snowball.webp', width:600, height:400, controller:'debt-snowball.js', body:snowballBody()},
  {id:'loan-consolidation', route:'/sw/zana/unganisha-mikopo/', file:'sw/zana/unganisha-mikopo/index.html', en:'/tools/loan-consolidation/', fr:'/fr/tools/consolidation-prets/', title:'Kikokotoo cha kuunganisha mikopo', description:'Linganisha malipo ya sasa na ofa moja ya kuunganisha mikopo, ikijumuisha riba, muda na ada inayofadhiliwa.', image:'/assets/img/tools/loan-consolidation.webp', width:800, height:450, controller:'loan-consolidation.js', body:consolidationBody()}
];

function render(app) {
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:app.title,url:`https://afrotools.com${app.route}`,description:app.description,inLanguage:'sw',applicationCategory:'FinanceApplication',operatingSystem:'Web',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},image:`https://afrotools.com${app.image}`});
  return `<!doctype html>
<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${app.title} | AfroTools</title><meta name="description" content="${app.description}"><meta name="robots" content="index,follow"><meta name="x-source-owner" content="scripts/build-sw-fintech-debt-resilience.js">
<link rel="canonical" href="https://afrotools.com${app.route}"><link rel="alternate" hreflang="en" href="https://afrotools.com${app.en}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${app.fr}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${app.route}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${app.en}">
<meta property="og:type" content="website"><meta property="og:title" content="${app.title}"><meta property="og:description" content="${app.description}"><meta property="og:url" content="https://afrotools.com${app.route}"><meta property="og:image" content="https://afrotools.com${app.image}"><meta property="og:image:width" content="${app.width}"><meta property="og:image:height" content="${app.height}"><meta property="og:locale" content="sw_TZ">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8"><link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5"><link rel="stylesheet" href="/assets/css/sw-fintech-debt-resilience.css">
<script>(function(){try{var t=localStorage.getItem('aft_theme'),d=matchMedia('(prefers-color-scheme:dark)').matches,a=t==='dark'||t==='light'?t:(d?'dark':'light');document.documentElement.dataset.theme=a;document.documentElement.dataset.themeChoice=t==='dark'||t==='light'?t:'auto';document.documentElement.style.colorScheme=a}catch(_){}})();</script>
<script src="/assets/js/components/navbar.min.js?v=b9df7b05" defer></script><script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script><script src="/assets/js/lib/dark-mode.js?v=1e97021c" defer></script><script type="application/ld+json">${schema}</script></head>
<body data-sw-fintech-debt-app="${app.id}"><a class="skip-link" href="#main-content">Ruka hadi maudhui</a><afro-navbar theme="dark" active="tools"></afro-navbar>
<header class="tool-hero"><div class="container hero-grid"><div><nav class="breadcrumb" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a> / <a href="/sw/fintech/">Fintech</a> / ${app.title}</nav><h1>${app.title}</h1><p>${app.description}</p><div class="badges"><span class="badge">Makadirio ya kupanga</span><span class="badge">Hesabu za ndani</span><span class="badge">Masharti yako</span></div></div><img class="hero-art" src="${app.image}" width="${app.width}" height="${app.height}" alt="Mchoro wa ${app.title}"></div></header>
<main class="container" id="main-content"><section class="card">${app.body}
<div class="source-box"><strong>Chanzo, upya na uhakika:</strong> Andika nchi, sarafu, mtoa huduma au mkopeshaji, salio, malipo, riba, muda na ada kutoka kwenye ofa, mkataba, statement au tovuti rasmi ya sasa. Mbinu ilikaguliwa Agosti 2026; uhakika ni wa kati kwa sababu viwango, ada, makato na masharti ya mtoa huduma hubadilika. Udhamini au ushirika wa kibiashara haubadilishi fomula, ulinganisho wala matokeo.</div>
<div class="privacy-box"><strong>Faragha ya ndani:</strong> Salio, matumizi, madeni, mtoa huduma na matokeo hubaki kwenye kivinjari hiki. Hakuna data inayotumwa kwa seva. Usaidizi wa AI ni wa hiari na unahitaji ridhaa ya wazi kabla ya kutuma taarifa.</div>
<a class="ai-handoff" data-shared-ai-handoff data-ai-candidate-tool-id="${app.id}" href="/sw/ai/?tool=${app.id}">Fungua usaidizi wa AI wa hiari</a></section>
<section class="card info-box"><h2>Kabla ya kufanya uamuzi</h2><p>Hili ni kadirio la kupanga, si ushauri wa kifedha, ofa ya mkopo wala ahadi ya matokeo. Hakiki ada zote, riba halisi, ratiba, adhabu, kodi, bima, namna malipo yanavyogawiwa na hali ya mtoa huduma.</p></section>
<section class="card"><h2>Zana zinazohusiana</h2><ul class="related-links"><li><a href="/sw/zana/mfuko-wa-dharura/">Mfuko wa dharura</a></li><li><a href="/sw/zana/mpango-wa-kulipa-madeni/">Mpango wa kulipa madeni</a></li><li><a href="/sw/zana/unganisha-mikopo/">Kuunganisha mikopo</a></li></ul></section></main>
<afro-footer></afro-footer><script src="/assets/js/pages/fintech-shared-controller-i18n.js"></script><script src="/assets/js/pages/fintech-shared-controllers/${app.controller}"></script><script src="/assets/js/pages/sw-fintech-debt-resilience.js"></script><script src="/assets/js/lib/sw-accessibility.js?v=c732ef57" defer></script><script src="/assets/js/lazy-analytics.js?v=249c230c" defer></script></body></html>\n`;
}

let stale = 0;
for (const app of apps) {
  const target = path.join(ROOT, app.file);
  const next = render(app);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current !== next) {
    stale += 1;
    if (WRITE) fs.writeFileSync(target, next);
  }
}
if (!WRITE && stale) {
  console.error(`Swahili Fintech debt-resilience family has ${stale} stale route owner(s). Run with --write.`);
  process.exit(1);
}
console.log(`Swahili Fintech debt-resilience family: ${apps.length - stale}/${apps.length} route owners current${WRITE && stale ? `; wrote ${stale}` : ''}`);
