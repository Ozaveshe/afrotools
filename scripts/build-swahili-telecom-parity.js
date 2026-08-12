#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');
const { enhanceCategory } = require('./lib/localized-category-standard');

const ROOT = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');

function normalizeTelecomGeneratorHtml(html) {
  const seoLinks = [];
  let normalized = normalizeBuildManagedHtml(html)
    // The Swahili product-surface postbuild owns this shared accessibility
    // helper. It is intentionally outside the Telecom page generator.
    .replace(/\s*<script\b[^>]*\bsrc=["']\/assets\/js\/lib\/sw-accessibility\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi, '')
    .replace(
      /\s*<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>/gi,
      (tag) => {
        seoLinks.push(tag.replace(/\s+/g, ' ').trim());
        return '';
      }
    )
    .replace(
      /<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi,
      (tag, beforeType, afterType, json) => {
        try {
          const value = JSON.parse(json);
          // The SEO postbuild may derive this from og:image. The generator
          // contract verifies artwork separately, so it is not source drift.
          delete value.image;
          return `<script${beforeType}type="application/ld+json"${afterType}>${JSON.stringify(value)}</script>`;
        } catch {
          return tag;
        }
      }
    )
    // seo:og supplies this when a source page omits a Twitter image. Product
    // artwork is asserted independently by the parity test.
    .replace(/\s*<meta\b[^>]*\bname=["']twitter:image["'][^>]*>/gi, '')
    // The release asset pass versions non-shared data scripts as well as
    // /assets references. Query hashes do not change generator ownership.
    .replace(/((?:src|href)=["'][^"'?]+)\?v=[a-f0-9]+(["'])/gi, '$1$2')
    .replace(/\r\n?/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();

  seoLinks.sort();
  normalized += `<!-- normalized-seo-links:${seoLinks.join('|')} -->`;
  return normalized;
}

const field = (name, label, input, help = '') => `
<div class="tel-field">
  <label for="${name}">${label}</label>
  ${input}
${help ? `  <small>${help}</small>\n` : ''}
</div>`;

const country = (name = 'country', label = 'Nchi', requires = '') => field(
  name,
  label,
  `<select id="${name}" name="${name}" data-country-select${requires ? ` data-country-requires="${requires}"` : ''} required><option value="">Chagua nchi</option></select>`
);

const number = (name, label, value, min = '0', step = '1', help = '', max = '') => field(
  name,
  label,
  `<input id="${name}" name="${name}" type="number" value="${value}" min="${min}"${max ? ` max="${max}"` : ''} step="${step}" inputmode="decimal" required>`,
  help
);

const range = (name, label, value, min, max, step, help = '') => field(
  name,
  label,
  `<input id="${name}" name="${name}" type="range" value="${value}" min="${min}" max="${max}" step="${step}" required>
  <output class="tel-range-value" for="${name}" data-range-output="${name}">${value}</output>`,
  help
);

const select = (name, label, options, help = '') => field(
  name,
  label,
  `<select id="${name}" name="${name}" required>${options.map(([value, text, selected]) => `<option value="${value}"${selected ? ' selected' : ''}>${text}</option>`).join('')}</select>`,
  help
);

const APPS = [
  {
    toolId: 'telecom-data-plan', kind: 'dataPlans', slug: 'kilinganisha-vifurushi-vya-data',
    english: '/telecom/data-plan-compare/', image: 'telecom-data-plan',
    title: 'Kilinganisha Vifurushi vya Data',
    description: 'Linganisha vifurushi vilivyohifadhiwa kwa bei kwa GB, muda na mtoa huduma bila kudai kuwa bei ni za sasa.',
    fields: country() + field('operator', 'Mtoa huduma', '<select id="operator" name="operator" required><option value="all">Watoa huduma wote</option></select>')
      + select('validity', 'Muda wa kifurushi', [['all', 'Yote'], ['1', 'Kila siku'], ['7', 'Kila wiki'], ['30', 'Kila mwezi']])
      + select('sort', 'Panga kwa', [['pricePerGB', 'Bei kwa GB'], ['price', 'Bei yote'], ['volumeMB', 'Kiasi']]),
    method: 'Injini hubadilisha kiasi kuwa MB, hukokotoa bei / (MB / 1,024), kisha huchuja na kupanga snapshot. Thibitisha bei ya mwisho kwa mtoa huduma.'
  },
  {
    toolId: 'telecom-ussd', kind: 'ussdDirectory', slug: 'saraka-ya-misimbo-ussd',
    english: '/telecom/ussd-directory/', image: 'telecom-ussd',
    title: 'Saraka Salama ya Misimbo ya USSD',
    description: 'Tafuta misimbo iliyohifadhiwa kwenye snapshot, kisha ithibitishe kabla ya kuipiga.',
    fields: country() + select('category', 'Matumizi', [['all', 'Matumizi yote']])
      + field('query', 'Utafutaji wa hiari', '<input id="query" name="query" type="search" autocomplete="off" placeholder="salio, data, mtoa huduma">', 'Hakuna namba ya simu inayoombwa.'),
    method: 'Utafutaji wa ndani hupitia makundi, watoa huduma na misimbo ya snapshot. Tarehe za misimbo hazitoshi na msimbo unaweza kufanya kitendo tofauti baada ya kubadilishwa na mtoa huduma.'
  },
  {
    toolId: 'telecom-roaming', kind: 'roaming', slug: 'kikokotoo-gharama-za-roaming',
    english: '/telecom/roaming-cost/', image: 'telecom-roaming',
    title: 'Kikokotoo cha Roaming au SIM ya Ndani',
    description: 'Kadiria roaming kwa snapshot na uweke sarafu tofauti bila kiwango cha ubadilishaji ulichothibitisha.',
    fields: country('country', 'Nchi ya kuanzia', 'roaming') + country('destination', 'Nchi unayoenda')
      + number('days', 'Muda wa safari (siku)', '7', '1', '1', '', '90')
      + number('minutesPerDay', 'Dakika kwa siku', '15', '0', '1', '', '300')
      + number('smsPerDay', 'SMS kwa siku', '5', '0', '1', '', '200')
      + number('dataMBPerDay', 'Data kwa siku (MB)', '200', '0', '1', '', '5000')
      + field('exchangeRate', 'Kiwango cha sarafu ya unakoenda kwenda sarafu ya nyumbani (hiari)', '<input id="exchangeRate" name="exchangeRate" type="number" min="0.000001" step="any" inputmode="decimal">', 'Weka kiwango ulichothibitisha mwenyewe. AfroTools haichukui kiwango cha moja kwa moja.'),
    method: 'Jumla ya roaming ni siku x (dakika x bei kwa dakika + SMS x bei kwa SMS + MB x bei kwa MB). SIM ya ndani hutumia kifurushi kilichohifadhiwa au makadirio ya tahadhari. Sarafu hulinganishwa tu ukiweka kiwango.'
  },
  {
    toolId: 'telecom-starlink', kind: 'starlink', slug: 'starlink-dhidi-ya-isp-za-ndani',
    english: '/telecom/starlink-compare/', image: 'telecom-starlink',
    title: 'Kilinganisha Starlink na ISP za Ndani',
    description: 'Linganisha gharama zilizohifadhiwa pekee na uthibitishe upatikanaji wa anwani husika kwenye tovuti rasmi.',
    fields: country(),
    method: 'Gharama ya miaka mitatu hujumlisha kifaa kilichohifadhiwa na malipo 36 ya mwezi. Alama ya upatikanaji wa Starlink kwenye snapshot imepitwa na wakati na si uthibitisho wa anwani.'
  },
  {
    toolId: 'telecom-tv', kind: 'tv', slug: 'kilinganisha-tv-na-streaming',
    english: '/telecom/tv-compare/', image: 'telecom-tv',
    title: 'Kilinganisha TV na Streaming',
    description: 'Linganisha vifurushi vilivyohifadhiwa bila kubuni chaneli, bei au upatikanaji wa sasa.',
    fields: country()
      + range('maxPrice', 'Bei ya juu kwa mwezi', '100000', '0', '100000', '100', 'Thamani inaonyeshwa kwa sarafu ya nchi iliyochaguliwa.')
      + select('sort', 'Panga kwa', [['price-asc', 'Bei: ndogo hadi kubwa'], ['price-desc', 'Bei: kubwa hadi ndogo', true], ['channels-desc', 'Chaneli nyingi zaidi'], ['value', 'Thamani bora kwa bei/chaneli']]),
    method: 'Gharama kwa chaneli ni bei / idadi ya chaneli pale idadi inapopatikana. Huduma za streaming zisizo na idadi hazipangwi kwa kipimo hiki.'
  },
  {
    toolId: 'telecom-data-usage', kind: 'dataUsage', slug: 'kikokotoo-matumizi-ya-data',
    english: '/telecom/data-usage-calc/', image: 'telecom-data-usage',
    title: 'Kikokotoo cha Matumizi ya Data',
    description: 'Badilisha matumizi yako kuwa makadirio ya mwezi yenye akiba ya 10%, kisha angalia vifurushi vilivyohifadhiwa vinavyokaribia hitaji.',
    fields: country()
      + range('browsing', 'Kuvinjari (saa/siku)', '1', '0', '8', '0.5')
      + range('social', 'Mitandao ya kijamii (saa/siku)', '2', '0', '8', '0.5')
      + range('youtube', 'Video (saa/siku)', '1', '0', '6', '0.5')
      + select('youtubeQuality', 'Ubora wa video', [['low', 'Chini'], ['medium', 'Wastani'], ['high', 'Juu'], ['hd', 'HD']])
      + range('music', 'Muziki (saa/siku)', '0.5', '0', '8', '0.5')
      + range('videocall', 'Simu za video (saa/siku)', '0.5', '0', '4', '0.5')
      + range('email', 'Barua pepe kwa siku', '20', '0', '100', '5')
      + range('downloads', 'Upakuaji (GB/mwezi)', '1', '0', '20', '0.5'),
    method: 'Injini hutumia viwango thabiti kwa kila shughuli, huzidisha matumizi ya siku kwa 30, huweka upakuaji kama thamani ya mwezi, kisha huongeza akiba ya 10%.'
  },
  {
    toolId: 'telecom-airtime', kind: 'airtime', slug: 'thamani-ya-vocha-ya-simu',
    english: '/telecom/airtime-value/', image: 'telecom-airtime',
    title: 'Makadirio ya Thamani ya Vocha ya Simu',
    description: 'Jaribu kiwango chako cha ubadilishaji badala ya kudhani kiwango cha sasa.',
    fields: country() + field('operator', 'Mtoa huduma', '<select id="operator" name="operator" required><option value="">Chagua mtoa huduma</option></select>')
      + field('amount', 'Kiasi cha vocha', '<input id="amount" name="amount" type="number" min="1" step="1" inputmode="decimal" required placeholder="Mf. 5,000">'),
    method: 'Mipaka ni kiasi x 70% na kiasi x 85%, sawa na kikokotoo cha Kiingereza. Asilimia hizi ni makisio thabiti ya kupanga, si viwango vya soko wala ahadi ya kubadilisha.'
  },
  {
    toolId: 'telecom-portability', kind: 'portability', slug: 'mwongozo-kuhamisha-namba',
    english: '/telecom/number-portability/', image: 'telecom-portability',
    title: 'Mwongozo wa Kuhamisha Namba',
    description: 'Angalia rekodi iliyohifadhiwa na pata orodha ya kukagua bila kudai hali ya sasa ya kanuni.',
    fields: country(),
    method: 'Hakuna hesabu ya kikanuni inayofanywa. Zana huonyesha sehemu za snapshot kama mambo ya kuthibitisha kwa mdhibiti na mtoa huduma mpya.'
  },
  {
    toolId: 'telecom-sim-reg', kind: 'simRegistration', slug: 'ukaguzi-usajili-wa-sim',
    english: '/telecom/sim-registration/', image: 'telecom-sim-reg',
    title: 'Ukaguzi wa Masharti ya Usajili wa SIM',
    description: 'Andaa ukaguzi rasmi bila kuingiza namba, hati ya utambulisho au data ya biometriki.',
    fields: country(),
    method: 'Zana huonyesha rekodi iliyohifadhiwa pekee. Usiingize wala kupakia data binafsi. Thibitisha masharti, tarehe, misimbo na adhabu kwa mdhibiti au mtoa huduma.'
  },
  {
    toolId: 'telecom-internet', kind: 'internet', slug: 'kilinganisha-intaneti',
    english: '/telecom/internet-compare/', image: 'telecom-internet',
    title: 'Kilinganisha Intaneti ya Waya na Isiyo na Waya',
    description: 'Linganisha bei kwa Mbps na teknolojia za snapshot, kisha thibitisha coverage, kasi na ada kwenye anwani husika.',
    fields: country() + select('sort', 'Panga kwa', [['value', 'Gharama kwa Mbps'], ['price', 'Bei ya mwezi'], ['speed', 'Kasi iliyotangazwa']]),
    method: 'Injini huchukua kasi ya namba iliyohifadhiwa, hukokotoa bei ya mwezi / Mbps, kisha hupanga ofa. Haipimi coverage, kasi halisi wala upatikanaji wa sasa.'
  },
  {
    toolId: 'telecom-fiber-lte-5g', kind: 'technology', slug: 'fiber-dhidi-ya-lte-na-5g',
    english: '/telecom/fiber-lte-5g/', image: 'telecom-fiber-lte-5g',
    title: 'Chagua kati ya Fiber, LTE na 5G',
    description: 'Tumia modeli wazi ya vipaumbele, kisha thibitisha coverage halisi na utendaji wa kweli.',
    fields: country()
      + select('priority', 'Kipaumbele', [['speed', 'Kasi'], ['cost', 'Gharama'], ['reliability', 'Uaminifu']])
      + select('usage', 'Matumizi makuu', [['streaming', 'Streaming'], ['work', 'Kazi'], ['basic', 'Matumizi ya kawaida']])
      + select('location', 'Eneo', [['urban', 'Mjini'], ['suburban', 'Pembezoni mwa mji'], ['rural', 'Kijijini']]),
    method: 'Modeli hujumlisha pointi thabiti kulingana na kipaumbele, matumizi na eneo. Kasi, latency na uaminifu ni makisio ya kulinganisha, si vipimo vya sasa vya mtandao.'
  },
  {
    toolId: 'telecom-business-internet', kind: 'businessInternet', slug: 'kikokotoo-intaneti-ya-biashara',
    english: '/telecom/business-internet/', image: 'telecom-business-internet',
    title: 'Kikokotoo cha Intaneti ya Biashara',
    description: 'Kadiria bandwidth na data ya mwezi kabla ya kuomba bei zilizothibitishwa kwa watoa huduma.',
    fields: country()
      + number('employees', 'Idadi ya watu', '10', '1', '1', '', '10000')
      + select('minimumSpeed', 'Kasi ya chini inayohitajika', [['10', '10 Mbps (msingi)'], ['25', '25 Mbps (timu ndogo)'], ['50', '50 Mbps (timu ya kati)', true], ['100', '100 Mbps (timu kubwa)'], ['200', '200+ Mbps (biashara)']])
      + select('usage', 'Uzito wa matumizi', [['basic', 'Msingi'], ['moderate', 'Wastani', true], ['heavy', 'Mazito']]),
    method: 'Bandwidth inayopendekezwa ni kubwa kati ya kiwango cha chini kilichoingizwa na idadi ya watu x 1, 3 au 8 Mbps. Data ya mwezi ni idadi x 30 x kizidishi x 2 GB.'
  },
  {
    toolId: 'telecom-bulk-sms', kind: 'bulkSms', slug: 'kikokotoo-bei-ya-sms-nyingi',
    english: '/telecom/bulk-sms-pricing/', image: 'telecom-bulk-sms',
    title: 'Kikokotoo cha Bei ya SMS Nyingi',
    description: 'Tumia viwango vya kihistoria kama makisio bila kuviwasilisha kama punguzo la sasa la mtoa huduma.',
    fields: country() + range('volume', 'SMS kwa mwezi', '10000', '1000', '1000000', '1000')
      + select('kind', 'Aina ya ujumbe', [['domestic', 'Ndani ya nchi'], ['international', 'Kimataifa']]),
    method: 'Kiwango cha kimataifa cha modeli ni 1.5 x kiwango cha ndani. Viwango vya punguzo ni 0%, 5%, 10%, 15% na 25% kuanzia ujumbe 0, 10,000, 50,000, 100,000 na 500,000.'
  },
  {
    toolId: 'telecom-whatsapp-vs-sms', kind: 'whatsappVsSms', slug: 'whatsapp-business-dhidi-ya-sms',
    english: '/telecom/whatsapp-vs-sms/', image: 'telecom-whatsapp-vs-sms',
    title: 'Kilinganisha WhatsApp Business na SMS',
    description: 'Linganisha gharama zilizohifadhiwa kwa aina ya mazungumzo na modeli ya viwango vya SMS.',
    fields: country()
      + number('volume', 'Ujumbe kwa mwezi', '10000', '100', '1', '', '10000000')
      + range('marketing', 'Sehemu ya marketing (%)', '40', '0', '100', '5')
      + range('utility', 'Sehemu ya utility (%)', '35', '0', '100', '5')
      + range('service', 'Sehemu ya service (%)', '25', '0', '100', '5', 'Sehemu tatu husawazishwa kiotomatiki jumla inapozidi 100%.'),
    method: 'Ujumbe hugawanywa kwa asilimia tatu. Kila sehemu huzidishwa kwa gharama yake iliyohifadhiwa; SMS hutumia kiwango sawa na kikokotoo cha SMS nyingi.'
  }
]

function alternates(app) {
  const englishHtml = fs.readFileSync(path.join(ROOT, app.english.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
  const siblingAlternates = Array.from(englishHtml.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g))
    .filter((match) => !['en', 'sw', 'x-default'].includes(match[1]))
    .map((match) => `<link rel="alternate" hreflang="${match[1]}" href="${match[2]}">`);
  return [
    `<link rel="canonical" href="https://afrotools.com/sw/zana/${app.slug}/">`,
    `<link rel="alternate" hreflang="en" href="https://afrotools.com${app.english}">`,
    `<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/${app.slug}/">`,
    ...siblingAlternates,
    `<link rel="alternate" hreflang="x-default" href="https://afrotools.com${app.english}">`
  ].join('\n');
}

function page(app) {
  const route = `/sw/zana/${app.slug}/`;
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: app.title,
    description: app.description, url: `https://afrotools.com${route}`,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'sw',
    isAccessibleForFree: true, browserRequirements: 'JavaScript'
  });
  return `<!doctype html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-telecom-parity.js">
  <title>${app.title} kwa Afrika | AfroTools</title>
  <meta name="description" content="${app.description}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${app.title} | AfroTools">
  <meta property="og:description" content="${app.description}">
  <meta property="og:url" content="https://afrotools.com${route}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${app.title} | AfroTools">
  <meta name="twitter:description" content="${app.description}">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">
  ${alternates(app)}
  <link rel="icon" href="/assets/img/logo-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/sw-telecom-parity.css">
  <script type="application/ld+json">${schema}</script>
</head>
<body class="sw-telecom-app">
  <a class="tel-skip" href="#zana">Ruka hadi kwenye zana</a>
  <afro-navbar active="telecom"></afro-navbar>
  <header class="tel-hero">
    <div class="tel-shell tel-hero-grid">
      <div>
        <p class="tel-kicker">Mawasiliano - Hesabu ya ndani - Kiswahili</p>
        <h1>${app.title}</h1>
        <p class="tel-lede">${app.description}</p>
      </div>
      <figure class="tel-app-artwork">
        <img src="/assets/img/tools/${app.image}.webp" alt="Mchoro wa zana ${app.title}" width="640" height="360">
      </figure>
    </div>
  </header>
  <main class="tel-main tel-shell" id="zana">
    <aside class="tel-source-alert" data-source-state="stale" data-source-confidence="low">
      <strong>Snapshot ya 1 Machi 2026 - imepitwa na wakati - uhakika mdogo</strong>
      <p>Data hii imezidi mzunguko wake wa siku 30. Hakuna bei, msimbo, kifurushi, kasi, coverage, hali ya kanuni, upatikanaji au mtoa huduma unaodaiwa kuwa wa sasa. Thibitisha ofa na anwani kwenye chanzo rasmi.</p>
    </aside>
    <div class="tel-layout">
      <section class="tel-tool" aria-labelledby="form-title">
        <h2 id="form-title">Hali yako</h2>
        <form id="telecom-form" novalidate>
          <div class="tel-fields">${app.fields}</div>
          <div class="tel-button-row">
            <button class="tel-button" type="submit">Kokotoa kwa snapshot</button>
            <button class="tel-button secondary" id="telecom-reset" type="reset">Anza upya</button>
          </div>
          <p class="tel-error" id="telecom-errors" role="alert" aria-live="assertive"></p>
        </form>
      </section>
      <div class="tel-aside">
        <section class="tel-results-panel" aria-labelledby="results-title">
          <h2 id="results-title">Matokeo ya kupanga</h2>
          <div id="telecom-results" tabindex="-1" aria-live="polite"><p class="tel-empty">Jaza fomu ili kupata matokeo ya ndani.</p></div>
        </section>
        <section class="tel-export-panel" aria-labelledby="export-title">
          <h2 id="export-title">Hamisha au fungua tena</h2>
          <p class="tel-empty">Exports hubaki kwenye kifaa hiki. JSON huhifadhi sehemu za hali na inaweza kufunguliwa tena kwenye zana hii.</p>
          <div class="tel-button-row">
            <button class="tel-button secondary" id="telecom-copy" type="button" hidden disabled>Nakili muhtasari</button>
            <button class="tel-button secondary" id="telecom-download-txt" type="button" hidden disabled>Pakua TXT</button>
            <button class="tel-button secondary" id="telecom-download-json" type="button" hidden disabled>Pakua JSON</button>
            <label class="tel-file-label" for="telecom-import">Fungua JSON tena<input id="telecom-import" type="file" accept="application/json,.json"></label>
          </div>
          <p class="tel-export-status" id="telecom-export-status" role="status" aria-live="polite"></p>
        </section>
      </div>
    </div>
    <section class="tel-method" aria-labelledby="method-title">
      <h2 id="method-title">Mbinu, mipaka na vyanzo</h2>
      <p>${app.method}</p>
      <ul>
        <li>Vipimo: MB, GB, Mbps, dakika, siku na sarafu ya eneo iliyoonyeshwa na snapshot.</li>
        <li>Hali batili au data inayokosekana: hesabu husimama, matokeo ya zamani huondolewa na pengo huonyeshwa wazi.</li>
        <li>Chanzo: <a href="/data/telecom/official-sources.json">rejesta ya vyanzo vya mawasiliano na mapengo yanayojulikana</a>.</li>
      </ul>
    </section>
    <section class="tel-privacy" aria-labelledby="privacy-title">
      <h2 id="privacy-title">Faragha na usaidizi</h2>
      <p>Hesabu, export na kufungua tena hufanyika kwenye kivinjari chako. Hakuna sehemu inayotumwa, hakuna AI inayoitwa na akaunti haihitajiki. Router ya ndani inaweza kufungua zana bila idhini; usaidizi wowote wa AI wa hiari lazima uonyeshe data itakayotumwa, uombe idhini ya wazi na uhifadhi njia ya ndani.</p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script>window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA = true;</script>
  <script src="/data/telecom/country-telecom-index.js"></script>
  <script src="/assets/js/engines/telecom-planning-engine.js"></script>
  <script src="/assets/js/lib/sw-telecom-localization.js"></script>
  <script id="sw-telecom-config" type="application/json">${JSON.stringify({ toolId: app.toolId, kind: app.kind, slug: app.slug, title: app.title, route })}</script>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
  <script src="/assets/js/pages/sw-telecom-app.js" defer></script>
</body>
</html>
`;
}

function hubPage() {
  const cards = APPS.map((app) => `<li><a class="tel-hub-card" href="/sw/zana/${app.slug}/"><img src="/assets/img/tools/${app.image}.webp" alt="" width="640" height="360" loading="lazy"><span><strong>${app.title}</strong><small>${app.description}</small></span></a></li>`).join('\n');
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Zana 14 za Mawasiliano kwa Kiswahili',
    description: 'Zana za kupanga mawasiliano kwa Kiswahili zinazotumia snapshot iliyohifadhiwa na hesabu za ndani.',
    url: 'https://afrotools.com/sw/mawasiliano-na-mtandao/', inLanguage: 'sw',
    mainEntity: APPS.map((app) => ({ '@type': 'SoftwareApplication', name: app.title, url: `https://afrotools.com/sw/zana/${app.slug}/` }))
  });
  return enhanceCategory(`<!doctype html>
<html lang="sw">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-telecom-parity.js">
  <title>Zana 14 za Mawasiliano kwa Kiswahili | AfroTools</title>
  <meta name="description" content="Fungua zana 14 za mawasiliano za AfroTools kwa Kiswahili: hesabu ya ndani, vyanzo wazi na mipaka ya upya inayoonekana.">
  <meta property="og:type" content="website"><meta property="og:title" content="Zana 14 za Mawasiliano kwa Kiswahili | AfroTools">
  <meta property="og:description" content="Panga data, roaming, intaneti, SMS, SIM, USSD na TV kwa makisio yaliyo wazi.">
  <meta property="og:url" content="https://afrotools.com/sw/mawasiliano-na-mtandao/"><meta property="og:image" content="https://afrotools.com/assets/img/tools/telecom-data-plan.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/telecom-data-plan.webp">
  <link rel="canonical" href="https://afrotools.com/sw/mawasiliano-na-mtandao/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/telecom/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/telecom/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/mawasiliano-na-mtandao/">
  <link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/sadarwa/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/telecom/">
  <link rel="icon" href="/assets/img/logo-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/global.css"><link rel="stylesheet" href="/assets/css/sw-telecom-parity.css">
  <style>.tel-hub-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem;padding:0;list-style:none}.tel-hub-card{display:grid;height:100%;border:1px solid var(--tel-border);border-radius:.65rem;background:var(--tel-surface);color:var(--tel-text);text-decoration:none}.tel-hub-card img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}.tel-hub-card span{display:grid;gap:.45rem;padding:1rem}.tel-hub-card strong{font-size:1.05rem}.tel-hub-card small{color:var(--tel-muted);font-size:.92rem;line-height:1.5}.tel-hub-card:focus,.tel-hub-card:focus-visible{outline:3px solid var(--tel-focus);outline-offset:3px}</style>
  <script type="application/ld+json">${schema}</script>
</head>
<body class="sw-telecom-app">
  <a class="tel-skip" href="#zana">Ruka hadi kwenye zana</a><afro-navbar active="telecom"></afro-navbar>
  <header class="tel-hero"><div class="tel-shell"><p class="tel-kicker">Mawasiliano na simu - programu 14 kwa Kiswahili</p><h1>Panga bila kuchanganya kumbukumbu na ofa ya sasa</h1><p class="tel-lede">Kila programu hukokotoa ndani, huonyesha vipimo na makisio, hukataa taarifa batili na huruhusu JSON inayoweza kufunguliwa tena.</p></div></header>
  <main class="tel-main tel-shell" id="zana">
    <aside class="tel-source-alert" data-source-state="stale" data-source-confidence="low"><strong>Snapshot ya 1 Machi 2026 - imepitwa na wakati - uhakika mdogo</strong><p>Vyanzo vina mapengo makubwa. Thibitisha bei, misimbo, coverage, kasi, upatikanaji na kanuni kwa watoa huduma au wadhibiti rasmi kabla ya uamuzi.</p></aside>
    <section aria-labelledby="apps-title"><h2 id="apps-title">Programu 14 za Mawasiliano</h2><ul class="tel-hub-list">${cards}</ul></section>
    <section class="tel-privacy" aria-labelledby="hub-privacy"><h2 id="hub-privacy">Mkataba wa ndani na tahadhari</h2><p>Hesabu, export na kufungua tena hubaki kwenye kivinjari. Programu hizi haziombi kitambulisho binafsi. Routing ya ndani inaweza kufungua programu bila idhini; usaidizi wowote wa AI hubaki wa hiari, wenye idhini na unaoweza kubadilishwa na njia ya ndani.</p><p><a href="/data/telecom/official-sources.json">Angalia rejesta ya vyanzo na mapengo</a></p></section>
  </main>
  <afro-footer></afro-footer><script>window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA = true;</script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.js" defer></script>
</body>
</html>
`, 'sw');
}

const drift = [];
for (const app of APPS) {
  const target = path.join(ROOT, 'sw', 'zana', app.slug, 'index.html');
  const expected = page(app);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (normalizeTelecomGeneratorHtml(current) !== normalizeTelecomGeneratorHtml(expected)) {
    drift.push(path.relative(ROOT, target).replace(/\\/g, '/'));
  }
  if (write) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, 'utf8');
  }

  const englishTarget = path.join(ROOT, app.english.replace(/^\/|\/$/g, ''), 'index.html');
  const swahiliAlternate = `<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/${app.slug}/">`;
  const englishCurrent = fs.readFileSync(englishTarget, 'utf8');
  if (!englishCurrent.includes(swahiliAlternate)) {
    drift.push(path.relative(ROOT, englishTarget).replace(/\\/g, '/'));
    if (write) {
      const englishMarker = /(<link rel="alternate" hreflang="en"[^>]*>\r?\n)/;
      if (!englishMarker.test(englishCurrent)) {
        throw new Error(`English hreflang marker missing in ${path.relative(ROOT, englishTarget)}`);
      }
      fs.writeFileSync(englishTarget, englishCurrent.replace(englishMarker, `$1${swahiliAlternate}\n`), 'utf8');
    }
  }
}
const hubTarget = path.join(ROOT, 'sw', 'mawasiliano-na-mtandao', 'index.html');
const expectedHub = hubPage();
const currentHub = fs.existsSync(hubTarget) ? fs.readFileSync(hubTarget, 'utf8') : '';
if (normalizeTelecomGeneratorHtml(currentHub) !== normalizeTelecomGeneratorHtml(expectedHub)) {
  drift.push('sw/mawasiliano-na-mtandao/index.html');
}
if (write) fs.writeFileSync(hubTarget, expectedHub, 'utf8');

if (check && drift.length) {
  console.error(`Swahili Telecom parity drift (${drift.length}):\n${drift.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`${write ? 'Wrote' : 'Checked'} ${APPS.length} Swahili Telecom app pages${drift.length ? ` (${drift.length} changed)` : ''}.`);
}

module.exports = { APPS, page, hubPage, normalizeTelecomGeneratorHtml };
