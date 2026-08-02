'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OWNER = 'scripts/build-sw-fintech-savings-family.js';

const countries = [
  ['NG', 'Nigeria', 'NGN'], ['KE', 'Kenya', 'KES'], ['ZA', 'Afrika Kusini', 'ZAR'],
  ['GH', 'Ghana', 'GHS'], ['EG', 'Misri', 'EGP'], ['TZ', 'Tanzania', 'TZS'],
  ['UG', 'Uganda', 'UGX'], ['ZM', 'Zambia', 'ZMW'], ['MZ', 'Msumbiji', 'MZN'],
  ['RW', 'Rwanda', 'RWF'], ['MA', 'Moroko', 'MAD'], ['ET', 'Ethiopia', 'ETB'],
  ['SN', 'Senegal', 'XOF'], ['CI', "Cote d'Ivoire", 'XOF'], ['CM', 'Kamerun', 'XAF'],
  ['AO', 'Angola', 'AOA'], ['MW', 'Malawi', 'MWK'], ['BW', 'Botswana', 'BWP'],
  ['NA', 'Namibia', 'NAD'], ['ZW', 'Zimbabwe', 'USD']
];

function options(limit) {
  return countries.slice(0, limit).map(([code, name, currency]) =>
    `<option value="${code}" data-currency="${currency}" data-sym="${currency} ">${name} (${currency})</option>`
  ).join('');
}

const apps = [
  {
    id: 'fixed-deposit',
    slug: 'kikokotoo-amana-ya-muda',
    title: 'Kikokotoo cha amana ya muda na riba halisi',
    description: 'Kokotoa riba ghafi, kodi ya zuio, riba halisi na thamani ya mwisho kwa masharti ya sasa ya amana ya muda.',
    og: '/assets/img/tools/fixed-deposit.webp',
    english: '/tools/fixed-deposit/',
    french: '/fr/tools/depot-terme/',
    controller: '/assets/js/pages/fintech-shared-controllers/fixed-deposit.js',
    calculate: 'calcFD',
    hero: 'Kokotoa mapato ya amana ya muda',
    intro: 'Ingiza riba ya mwaka, muda na kodi ya zuio iliyo kwenye ofa ya sasa ya benki. Linganisha riba rahisi na riba inayojumlishwa kila mwezi bila kupakia data yako.',
    badges: ['Sarafu 20 za Afrika', 'Wewe unaingiza kiwango cha ofa', 'Hesabu ya ndani ya kivinjari'],
    formTitle: 'Masharti ya amana',
    fields: `<div class="form-group"><label for="fd-country">Nchi na sarafu</label><select id="fd-country" onchange="fillFDRate()">${options(20)}</select></div>
      <div class="form-group"><label for="fd-tenor">Muda wa amana</label><select id="fd-tenor"><option value="1">Mwezi 1</option><option value="3">Miezi 3</option><option value="6">Miezi 6</option><option value="9">Miezi 9</option><option value="12" selected>Miezi 12</option><option value="24">Miezi 24</option></select></div>
      <div class="form-group"><label for="fd-amount">Mtaji unaowekwa</label><input type="number" id="fd-amount" value="500000" min="0.01" step="0.01" required></div>
      <div class="form-group"><label for="fd-rate">Riba ya mwaka (%)</label><input type="number" id="fd-rate" placeholder="Kwa mfano 12" min="0" max="100" step="0.01" required></div>
      <div class="form-group"><label for="fd-tax">Kodi ya zuio kwenye riba (%)</label><input type="number" id="fd-tax" value="0" min="0" max="100" step="0.01" required></div>
      <div class="form-group"><label for="fd-compound">Njia ya kukokotoa riba</label><select id="fd-compound"><option value="simple">Riba rahisi</option><option value="compound">Riba inayojumlishwa kila mwezi</option></select></div>`,
    button: 'Kokotoa mapato ya ofa',
    errorId: 'fd-error',
    resultsId: 'fd-results',
    results: `<div class="res-hero"><div class="res-label">Thamani halisi mwisho wa muda</div><div class="res-val" id="fd-total"></div><div class="res-sub" id="fd-total-sub"></div></div>
      <div class="metrics"><div class="metric"><div class="metric-val" id="fd-interest"></div><div class="metric-label">Riba ghafi</div></div><div class="metric"><div class="metric-val" id="fd-tax-amt"></div><div class="metric-label">Kodi ya zuio</div></div><div class="metric"><div class="metric-val" id="fd-net-interest"></div><div class="metric-label">Riba halisi</div></div><div class="metric"><div class="metric-val" id="fd-monthly"></div><div class="metric-label">Wastani kwa mwezi</div></div><div class="metric"><div class="metric-val" id="fd-ear"></div><div class="metric-label">Kiwango halisi cha mwaka</div></div><div class="metric"><div class="metric-val" id="fd-net-ear"></div><div class="metric-label">Kiwango halisi baada ya kodi</div></div></div>
      <div class="table-wrap"><table><thead><tr><th>Kipindi</th><th>Salio la mwanzo</th><th>Riba</th><th>Salio la mwisho</th></tr></thead><tbody id="fd-schedule"></tbody></table></div>
      <div class="info-box">Haya ni makadirio ya kupanga, si pendekezo wala dhamana. Thibitisha ulinzi wa amana, adhabu ya kutoa mapema, kodi, ada, muda wa malipo na njia ya kukokotoa riba kabla ya kuweka fedha.</div>`,
    source: 'Tumia karatasi ya masharti ya sasa ya benki: riba ya kawaida, njia ya kukokotoa, muda, kodi ya zuio na masharti ya kutoa mapema. Kiwango cha sera cha benki kuu si ofa ya amana.',
    faqs: [
      ['Je, kuchagua nchi kunapakia riba ya soko?', 'Hapana. Nchi hubadilisha lebo ya sarafu pekee. Ingiza riba iliyo kwenye ofa unayokagua.'],
      ['Ni kodi gani ya zuio niingize?', 'Ingiza kiwango kinachotumika kwa akaunti na mamlaka yako, au sifuri kwa makadirio ya riba ghafi. Thibitisha na benki au mamlaka ya kodi.'],
      ['Wastani wa mwezi unamaanisha nini?', 'Ni riba halisi iliyogawanywa kwa idadi ya miezi. Haimaanishi benki italipa kila mwezi.']
    ]
  },
  {
    id: 'tbill-calc',
    slug: 'kikokotoo-hati-za-hazina',
    title: 'Kikokotoo cha T-bill na mavuno ya hati za hazina',
    description: 'Kokotoa bei ya ununuzi, mapato ghafi, kodi ya zuio na mavuno halisi ya mwaka kwa kiwango cha sasa cha T-bill.',
    og: '/assets/img/tools/tbill-calc.webp',
    english: '/tools/tbill-calc/',
    french: '/fr/tools/rendement-bons-tresor/',
    controller: '/assets/js/pages/fintech-shared-controllers/tbill-calc.js',
    calculate: 'calcTBill',
    hero: 'Kokotoa mavuno ya T-bill',
    intro: 'Ingiza aina ya kiwango kilicho kwenye tangazo la mnada au quotation ya sasa. Geuza discount rate au investment yield kuwa bei ya ununuzi, mapato na mavuno halisi.',
    badges: ['Sarafu 10 za Afrika', 'Wewe unaingiza kiwango cha sasa', 'Hesabu ya ndani ya kivinjari'],
    formTitle: 'Masharti ya hati ya hazina',
    fields: `<div class="form-group"><label for="tb-country">Nchi na sarafu</label><select id="tb-country" onchange="fillTBRates()">${options(10)}</select></div>
      <div class="form-group"><label for="tb-tenor">Muda wa hati</label><select id="tb-tenor" onchange="fillTBRates()"><option value="91">Siku 91 (miezi 3)</option><option value="182">Siku 182 (miezi 6)</option><option value="364" selected>Siku 364 (mwaka 1)</option></select></div>
      <div class="form-group"><label for="tb-amount">Thamani inayolipwa wakati wa ukomavu</label><input type="number" id="tb-amount" value="1000000" min="0.01" step="0.01" required></div>
      <div class="form-group"><label for="tb-rate">Kiwango kilichotajwa (%)</label><input type="number" id="tb-rate" placeholder="Kwa mfano 12" min="0" max="100" step="0.01" required></div>
      <div class="form-group"><label for="tb-ratetype">Aina ya kiwango</label><select id="tb-ratetype"><option value="yield" selected>Investment yield</option><option value="discount">Discount rate ya mnada</option></select></div>
      <div class="form-group"><label for="tb-tax">Kodi ya zuio (%)</label><input type="number" id="tb-tax" value="0" min="0" max="100" step="0.01" required></div>`,
    button: 'Kokotoa mavuno ya ofa',
    errorId: 'tb-error',
    resultsId: 'tb-results',
    results: `<div class="res-hero"><div class="res-label">Kiasi halisi wakati wa ukomavu</div><div class="res-val" id="tb-maturity"></div><div class="res-sub" id="tb-sub"></div></div>
      <div class="metrics"><div class="metric"><div class="metric-val" id="tb-price"></div><div class="metric-label">Bei ya ununuzi</div></div><div class="metric"><div class="metric-val" id="tb-return"></div><div class="metric-label">Mapato ghafi</div></div><div class="metric"><div class="metric-val" id="tb-tax-amt"></div><div class="metric-label">Kodi ya zuio</div></div><div class="metric"><div class="metric-val" id="tb-net"></div><div class="metric-label">Mapato halisi</div></div><div class="metric"><div class="metric-val" id="tb-actual-yield"></div><div class="metric-label">Mavuno halisi ya mwaka</div></div><div class="metric"><div class="metric-val" id="tb-annualized"></div><div class="metric-label">Mavuno baada ya kodi</div></div></div>
      <div class="info-box">Makadirio yanadhani hati inalipwa kwa thamani yake kamili kwa msingi wa siku 365. Hayajumuishi ada, siku za settlement, kuuza kabla ya ukomavu, default, mfumuko wa bei wala hatari ya FX.</div>`,
    source: 'Tumia matokeo rasmi ya mnada, tangazo la ofisi ya deni, contract note ya broker au quotation ya sasa ya benki. Hakuna riba, kodi au kiwango cha chini kinachopakuliwa moja kwa moja.',
    faqs: [
      ['Je, kuchagua nchi kunapakia kiwango cha mnada?', 'Hapana. Nchi hubadilisha sarafu pekee. Ingiza kiwango halisi kutoka tangazo rasmi au quotation ya intermediary.'],
      ['Tofauti ya yield na discount rate ni ipi?', 'Discount rate hutumika kwenye thamani ya ukomavu ili kupata bei. Yield huhesabiwa dhidi ya bei uliyolipa.'],
      ['Je, mtu binafsi anaweza kununua hati hii?', 'Njia za kununua, sifa, kiwango cha chini na settlement hutofautiana. Kagua tangazo rasmi au intermediary aliyeidhinishwa.']
    ]
  },
  {
    id: 'real-return',
    slug: 'faida-halisi-baada-ya-mfumuko',
    title: 'Kikokotoo cha faida halisi baada ya mfumuko wa bei',
    description: 'Kokotoa faida halisi na uwezo wa kununua kwa fomula kamili ya Fisher ukitumia viwango unavyoingiza.',
    og: '/assets/img/tools/real-return.webp',
    english: '/tools/real-return/',
    french: '/fr/tools/rendement-reel-inflation/',
    controller: '/assets/js/pages/fintech-shared-controllers/real-return.js',
    calculate: 'calcRealReturn',
    hero: 'Kokotoa faida halisi baada ya mfumuko',
    intro: 'Tumia fomula kamili ya Fisher kuona jinsi faida ya kawaida na mfumuko wa bei vinavyobadilisha uwezo wa kununua. Wewe ndiye unaingiza viwango vyote.',
    badges: ['Sarafu 15 za Afrika', 'Fomula kamili ya Fisher', 'Hesabu ya ndani ya kivinjari'],
    formTitle: 'Makadirio ya faida na mfumuko',
    fields: `<div class="form-group"><label for="rr-country">Nchi na sarafu</label><select id="rr-country" onchange="fillRRInflation()">${options(15)}</select></div>
      <div class="form-group"><label for="rr-nominal">Faida ya kawaida (%)</label><input type="number" id="rr-nominal" placeholder="Kwa mfano 12" min="-99.99" max="10000" step="0.01" required></div>
      <div class="form-group"><label for="rr-inflation">Mfumuko wa bei (%)</label><input type="number" id="rr-inflation" placeholder="Kwa mfano 8" min="-99.99" max="10000" step="0.01" required></div>
      <div class="form-group"><label for="rr-amount">Kiasi kinachowekezwa</label><input type="number" id="rr-amount" value="1000000" min="0.01" step="0.01" required></div>
      <div class="form-group"><label for="rr-years">Muda</label><select id="rr-years"><option value="1" selected>Mwaka 1</option><option value="3">Miaka 3</option><option value="5">Miaka 5</option><option value="10">Miaka 10</option></select></div>`,
    button: 'Kokotoa faida halisi',
    errorId: 'rr-error',
    resultsId: 'rr-results',
    results: `<div class="res-hero" id="rr-hero"><div class="res-label">Faida halisi ya mwaka baada ya mfumuko</div><div class="res-val" id="rr-real"></div><div class="res-sub" id="rr-sub"></div></div>
      <div class="metrics"><div class="metric"><div class="metric-val" id="rr-nominal-val"></div><div class="metric-label">Faida ya kawaida</div></div><div class="metric"><div class="metric-val" id="rr-inflation-val"></div><div class="metric-label">Mfumuko wa bei</div></div><div class="metric"><div class="metric-val" id="rr-real-val"></div><div class="metric-label">Faida halisi ya Fisher</div></div><div class="metric"><div class="metric-val" id="rr-purchasing-power"></div><div class="metric-label">Uwezo wa kununua baada ya <span id="rr-yrs-label">mwaka 1</span></div></div><div class="metric"><div class="metric-val" id="rr-approx"></div><div class="metric-label">Makadirio ya kutoa tu</div></div></div><div id="rr-verdict"></div>`,
    source: 'Tumia faida ya kawaida na kipimo cha mfumuko vinavyohusu kipindi kimoja. Fomula inadhani viwango havibadiliki na haijumuishi kodi, ada, mabadiliko ya kiwango wala hatari ya FX.',
    faqs: [
      ['Kwa nini kutoa mfumuko tu ni makadirio?', 'Fomula ya Fisher hugawanya 1 pamoja na faida ya kawaida kwa 1 pamoja na mfumuko. Kutoa tu kunapoteza usahihi viwango vinapokuwa vikubwa.'],
      ['Ni kipimo gani cha mfumuko nitumie?', 'Tumia kipimo rasmi cha kipindi sawa na, inapowezekana, kikapu kinachofanana na matumizi yako. Takwimu za nyuma hazihakikishi mfumuko wa baadaye.'],
      ['Faida halisi chanya inahakikisha uwekezaji mzuri?', 'Hapana. Kagua pia hatari, ukwasi, ada, kodi na uaminifu wa mtoa bidhaa.']
    ]
  }
];

function absolute(route) {
  return `https://afrotools.com${route}`;
}

function render(app) {
  const route = `/sw/zana/${app.slug}/`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: app.title,
    url: absolute(route), inLanguage: 'sw', applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web', isBasedOn: absolute(app.english),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'AfroTools' }, image: absolute(app.og)
  });
  const faqLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'sw',
    mainEntity: app.faqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } }))
  });
  return `<!DOCTYPE html>
<html lang="sw" data-chat-bundle="/assets/js/bundles/chat.6886c889.min.js">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="sw-fintech-savings:${app.id}"><meta name="afrotools-source-owner" content="${OWNER}">
  <title>${app.title} | AfroTools</title><meta name="description" content="${app.description}">
  <meta property="og:title" content="${app.title} | AfroTools"><meta property="og:description" content="${app.description}">
  <meta property="og:image" content="${absolute(app.og)}"><meta property="og:image:width" content="600"><meta property="og:image:height" content="400"><meta property="og:url" content="${absolute(route)}"><meta property="og:type" content="website"><meta property="og:locale" content="sw_KE"><meta property="og:site_name" content="AfroTools">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${app.title} | AfroTools"><meta name="twitter:description" content="${app.description}"><meta name="twitter:image" content="${absolute(app.og)}">
  <link rel="canonical" href="${absolute(route)}"><link rel="alternate" hreflang="en" href="${absolute(app.english)}"><link rel="alternate" hreflang="fr" href="${absolute(app.french)}"><link rel="alternate" hreflang="sw" href="${absolute(route)}"><link rel="alternate" hreflang="x-default" href="${absolute(app.english)}">
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8"><link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5"><link rel="stylesheet" href="/assets/css/sw-fintech-savings-native.css">
  <script src="/assets/js/components/navbar.min.js?v=b9df7b05" defer></script><script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script>
  <script type="application/ld+json">${jsonLd}</script><script type="application/ld+json">${faqLd}</script>
</head>
<body data-sw-fintech-savings-app="${app.id}">
  <a class="skip-link" href="#main-content">Ruka hadi maudhui makuu</a><afro-navbar theme="dark" active="fintech"></afro-navbar>
  <header class="tool-hero"><div class="container hero-grid"><div><nav class="breadcrumb" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a><span>›</span><a href="/sw/fintech/">Fintech na benki</a><span>›</span>${app.hero}</nav><h1>${app.hero}</h1><p>${app.intro}</p><div class="hero-badges">${app.badges.map((badge) => `<span class="hero-badge">${badge}</span>`).join('')}</div></div><img class="hero-art" src="${app.og}" width="600" height="400" alt="Mchoro wa ${app.hero.toLowerCase()}"></div></header>
  <main class="container" id="main-content"><form class="card" data-sw-fintech-savings-form data-calculate="${app.calculate}" novalidate><h2>${app.formTitle}</h2><div class="form-grid">${app.fields}</div><button type="submit" class="btn-calc">${app.button}</button><p class="form-error" id="${app.errorId}" role="alert"></p><div class="source-box"><strong>Chanzo, upya na uhakika:</strong> ${app.source} Mbinu ilikaguliwa Agosti 2026; uhakika ni wa kati kwa sababu viwango na masharti yanatoka kwenye nyaraka unazoingiza. Udhamini au mtoa huduma yeyote habadilishi fomula, mpangilio wala matokeo.</div><div class="results" id="${app.resultsId}" aria-live="polite" tabindex="-1">${app.results}</div><div class="privacy-box"><strong>Faragha:</strong> hesabu inafanyika ndani ya kivinjari hiki. Hakuna jina, namba ya akaunti, portfolio wala thamani unayoingiza inayotumwa mtandaoni. Usaidizi wowote wa AI ni wa hiari na lazima uanze kwa ridhaa yako.</div><a class="ai-handoff" data-shared-ai-handoff data-ai-candidate-tool-id="${app.id}" href="/sw/ai/?tool=${app.id}">Fungua AfroTools AI kwa mwongozo wa hiari</a></form>
    <section class="card"><h2>Maswali ya kawaida</h2>${app.faqs.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}</section>
    <nav class="card" aria-label="Zana zinazohusiana"><h2>Zana zinazohusiana</h2><ul class="related-links"><li><a href="/sw/zana/kikokotoo-amana-ya-muda/">Amana ya muda</a></li><li><a href="/sw/zana/kikokotoo-hati-za-hazina/">T-bill na hati za hazina</a></li><li><a href="/sw/zana/faida-halisi-baada-ya-mfumuko/">Faida halisi baada ya mfumuko</a></li></ul></nav>
  </main><afro-footer></afro-footer>
  <script src="/assets/js/pages/fintech-shared-controller-i18n.js"></script><script src="${app.controller}"></script><script src="/assets/js/pages/sw-fintech-savings-family.js"></script><script src="/assets/js/lib/sw-accessibility.js?v=c732ef57" defer></script><script src="/assets/js/lazy-analytics.js?v=249c230c" defer></script>
</body></html>\n`;
}

function build(write) {
  for (const app of apps) {
    const target = path.join(ROOT, 'sw', 'zana', app.slug, 'index.html');
    const expected = render(app);
    if (write) fs.writeFileSync(target, expected, 'utf8');
    else if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== expected) {
      throw new Error(`${path.relative(ROOT, target)} is stale; run with --write`);
    }
  }
  return apps.length;
}

if (require.main === module) {
  const count = build(process.argv.includes('--write'));
  process.stdout.write(`Swahili Fintech savings family: ${count}/${apps.length} route owners ${process.argv.includes('--write') ? 'written' : 'current'}\n`);
}

module.exports = { apps, build, render };
