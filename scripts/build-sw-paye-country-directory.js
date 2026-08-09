'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const directory = require(path.join(root, 'assets/js/pages/paye-country-directory.js'));

const routes = {
  en: path.join(root, 'tools/paye-calculator/index.html'),
  fr: path.join(root, 'fr/tools/calculateur-paye/index.html'),
  sw: path.join(root, 'sw/mshahara-na-kodi/paye/index.html'),
  enHub: path.join(root, 'salary-tax/paye/index.html'),
  frHub: path.join(root, 'fr/salary-tax/paye/index.html')
};

const swCountries = directory.countries.map(function (country) {
  const resolved = directory.resolveCountry(country.code, 'sw');
  if (!resolved || !resolved.supported || !resolved.localized) {
    throw new Error('Missing native Swahili PAYE destination for ' + country.code);
  }
  return {
    code: country.code,
    name: directory.swahiliNames[country.code] || country.name,
    route: resolved.route
  };
});

function page() {
  const list = swCountries.map(function (country) {
    return `          <li><a href="${country.route}" data-country-code="${country.code}">${country.name}</a></li>`;
  }).join('\n');
  const itemList = swCountries.map(function (country, index) {
    return {'@type': 'ListItem', position: index + 1, name: country.name, url: 'https://afrotools.com' + country.route};
  });
  const collectionSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Orodha ya Vikokotoo vya PAYE kwa Nchi',
    description: 'Chagua nchi moja kati ya 54 na ufungue kikokotoo cha PAYE au kodi ya mshahara kwa Kiswahili.',
    url: 'https://afrotools.com/sw/mshahara-na-kodi/paye/',
    inLanguage: 'sw',
    image: 'https://afrotools.com/assets/img/tools/paye-calculator.webp',
    mainEntity: {'@type': 'ItemList', numberOfItems: 54, itemListElement: itemList}
  });
  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'AfroTools', item: 'https://afrotools.com/'},
      {'@type': 'ListItem', position: 2, name: 'Kiswahili', item: 'https://afrotools.com/sw/'},
      {'@type': 'ListItem', position: 3, name: 'Mshahara na Kodi', item: 'https://afrotools.com/sw/mshahara-na-kodi/'},
      {'@type': 'ListItem', position: 4, name: 'Orodha ya PAYE', item: 'https://afrotools.com/sw/mshahara-na-kodi/paye/'}
    ]
  });
  const faq = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {'@type': 'Question', name: 'Je, fomula moja ya PAYE inafanya kazi Afrika nzima?', acceptedAnswer: {'@type': 'Answer', text: 'Hapana. Mabanda ya kodi, relief, michango ya lazima na tarehe za sheria hutofautiana kwa nchi.'}},
      {'@type': 'Question', name: 'Je, ukurasa huu unakusanya mshahara wangu?', acceptedAnswer: {'@type': 'Answer', text: 'Hapana. Orodha hii huomba nchi pekee na hufungua kikokotoo cha nchi hiyo.'}},
      {'@type': 'Question', name: 'Je, orodha hii hukokotoa au kutoa PDF?', acceptedAnswer: {'@type': 'Answer', text: 'Hapana. Orodha huchagua njia tu; hesabu na exports zinamilikiwa na kikokotoo cha nchi.'}},
      {'@type': 'Question', name: 'Je, nchi zote 54 zina njia?', acceptedAnswer: {'@type': 'Answer', text: 'Ndiyo. Kila nchi ina njia ya PAYE au kodi ya mshahara kwa Kiswahili; kagua chanzo, tarehe na assumptions kwenye ukurasa wa nchi.'}}
    ]
  });

  return `<!DOCTYPE html>
<html lang="sw" data-afrotools-source-owner="scripts/build-sw-paye-country-directory.js" data-chat-bundle="/assets/js/bundles/chat.6886c889.min.js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orodha ya Vikokotoo vya PAYE kwa Nchi | AfroTools</title>
  <meta name="description" content="Chagua nchi moja kati ya 54 na ufungue kikokotoo chake cha PAYE au kodi ya mshahara kwa Kiswahili. Hakuna fomula ya jumla ya Afrika au salary data inayokusanywa hapa.">
  <meta name="robots" content="index, follow">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta property="og:title" content="Orodha ya Vikokotoo vya PAYE kwa Nchi | AfroTools">
  <meta property="og:description" content="Fungua kikokotoo cha PAYE kinachomilikiwa na nchi husika, pamoja na chanzo, assumptions na tarehe yake.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://afrotools.com/sw/mshahara-na-kodi/paye/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/paye-calculator.webp">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:locale" content="sw">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Orodha ya Vikokotoo vya PAYE kwa Nchi | AfroTools">
  <meta name="twitter:description" content="Chagua nchi na ufungue kikokotoo chake cha PAYE kwa Kiswahili.">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/paye-calculator.webp">
  <script type="application/ld+json">${collectionSchema}</script>
  <script type="application/ld+json">${breadcrumb}</script>
  <script type="application/ld+json">${faq}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=23d6ef69">
  <link rel="stylesheet" href="/assets/css/paye-country-directory.css?v=68e5bb91">
  <script src="/assets/js/components/navbar.min.js?v=f1fd60f9" defer></script>
  <script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script>
  <script src="/assets/js/pages/paye-country-directory.js?v=553e1247" defer></script>
  <script src="/assets/js/lib/source-confidence.js?v=e7c3ebe4" defer></script>
  <link rel="canonical" href="https://afrotools.com/sw/mshahara-na-kodi/paye/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/paye-calculator/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/calculateur-paye/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/mshahara-na-kodi/paye/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/paye-calculator/">
</head>
<body>
  <afro-navbar active="tools"></afro-navbar>
  <main class="paye-directory">
    <header class="paye-hero">
      <div class="paye-hero__inner">
        <p class="paye-breadcrumb"><a href="/sw/">Mwanzo</a> / <a href="/sw/mshahara-na-kodi/">Mshahara na kodi</a> / Orodha ya PAYE</p>
        <h1>Tafuta kikokotoo cha PAYE cha nchi yako</h1>
        <p>Sheria za payroll ni za nchi moja moja. Chagua nchi ili kufungua kikokotoo kinachomiliki mabanda yake ya kodi, michango ya lazima, assumptions, exports na tarehe za chanzo.</p>
        <div class="paye-trust" aria-label="Ukweli kuhusu orodha">
          <span>Njia 54 za nchi</span>
          <span>Hakuna fomula ya jumla</span>
          <span>Hakuna salary data hapa</span>
        </div>
      </div>
    </header>

    <div class="paye-directory__inner">
      <section class="paye-resolver" aria-labelledby="country-title">
        <h2 id="country-title">Chagua nchi ya payroll</h2>
        <p>Kikokotoo kinachofuata ndicho kinachofanya hesabu. Kagua tax year, tarehe ya chanzo, assumptions na mipaka yake kabla ya kutumia estimate kwa payroll, offer au bajeti.</p>
        <div class="paye-field">
          <label for="paye-country">Nchi</label>
          <select id="paye-country" name="country" autocomplete="country">
            <option value="">Chagua nchi</option>
          </select>
        </div>
        <p id="paye-country-result" class="paye-result" role="status" aria-live="polite">Chagua nchi ili kufungua kikokotoo chake cha kodi ya mshahara.</p>
        <a id="paye-country-open" class="paye-open" hidden>Fungua kikokotoo kwa Kiswahili</a>
        <noscript><p class="paye-result">JavaScript inahitajika kwa selector. Tumia orodha ya nchi iliyo hapa chini.</p></noscript>
      </section>

      <aside class="paye-limit" aria-label="Hali ya chanzo">
        <strong>Chanzo cha directory kilikaguliwa 14 Juni 2026</strong>
        <p>Registry ya country packs ina review cadence ya siku 90 na hali yake ni reviewed. Hii inathibitisha njia na mipaka ya dataset, si kwamba kila estimate ni official assessment. Kila ukurasa wa nchi una chanzo na assumptions zake.</p>
      </aside>

      <details class="paye-browse">
        <summary>Vinjari vikokotoo vyote 54 vya nchi</summary>
        <ul>
${list}
        </ul>
      </details>

      <section class="paye-content">
        <h2>Kwa nini hii ni directory, si kikokotoo kimoja cha Afrika</h2>
        <p>PAYE ni njia ya kukata kodi ya mapato ya ajira, lakini kila jurisdiction ina mabanda yake, relief, pension au social-security deductions, filing periods na effective dates. Fomula moja ya bara zima ingeweza kutoa jibu la uongo. Ukurasa huu huchagua route pekee na haufanyi payroll arithmetic.</p>

        <h2>Kabla ya kutegemea matokeo ya nchi</h2>
        <ul>
          <li>Kagua tax year, tarehe ya mwisho ya review na source owner iliyoandikwa kwenye kikokotoo.</li>
          <li>Thibitisha kama mshahara ni wa mwezi au mwaka na kama taxable benefits zimejumuishwa.</li>
          <li>Tenganisha voluntary deductions na statutory deductions.</li>
          <li>Tumia matokeo kama planning estimate, si official assessment, payslip au filing.</li>
          <li>Ikiwa chanzo ni stale, changed au unavailable, fuata fail-closed warning ya kikokotoo badala ya kudhani rate ni current.</li>
        </ul>

        <h2>Faragha, AI na exports</h2>
        <p>Directory huomba nchi pekee. Haiombi mshahara, jina, barua pepe au employer data; haifanyi AI request wala network calculation. Ask AfroTools inaweza kuchagua kikokotoo cha nchi na kuweka prefill kwa muda kwenye browser session, bila kuweka salary kwenye URL. Kikokotoo cha nchi ndicho kinachomiliki calculation, consent boundary na exports zake.</p>
        <p>PDF, CSV au JSON haitolewi hapa kwa sababu hakuna report inayozalishwa. Fungua country calculator ili kuona formats halisi zinazotolewa bila kutunga export ya directory. Kwa browsing ya category nzima, tembelea <a href="/sw/mshahara-na-kodi/">Mshahara na kodi</a>.</p>

        <div class="paye-faq">
          <h2>Maswali kuhusu directory ya PAYE</h2>
          <details><summary>Je, fomula moja ya PAYE inafanya kazi Afrika nzima?</summary><p>Hapana. Mabanda ya kodi, relief, michango ya lazima na tax year hutofautiana. Chagua payroll country kwanza.</p></details>
          <details><summary>Je, ukurasa huu unahifadhi mshahara wangu?</summary><p>Hapana. Directory haiombi salary. Inabadilisha nchi uliyochagua kuwa route ya kikokotoo tu.</p></details>
          <details><summary>Je, directory yenyewe inatoa PDF?</summary><p>Hapana. Haina calculation au report. Country calculator inaonyesha exports zake halisi.</p></details>
          <details><summary>Je, nchi zote 54 zina njia?</summary><p>Ndiyo. Kila nchi ina njia ya PAYE au salary-tax kwa Kiswahili. Uwepo wa route hauondoi wajibu wa kukagua source date na assumptions za nchi hiyo.</p></details>
        </div>
      </section>
    </div>

    <div class="container afro-source-meta" data-source-meta-id="paye-tax-engine-country-packs" data-source-meta-compact="true"></div>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js?v=c732ef57" defer></script>
</body>
</html>
`;
}

function patchDirectoryPeer(file, locale) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replaceAll('53 source-backed', '54 source-backed').replaceAll('all 53 source-backed', 'all 54 source-backed');
  html = html.replaceAll('Annuaire de 53 calculateurs', 'Annuaire de 54 calculateurs').replaceAll('53 destinations avec sources', '54 destinations avec sources');
  html = html.replaceAll('"numberOfItems": 53', '"numberOfItems": 54');
  if (locale === 'en') {
    html = html.replace('<aside class="paye-limit" aria-label="Coverage limitation">\n        <strong>Known coverage gap: Guinea-Bissau</strong>\n        <p>AfroTools does not currently publish a source-backed Guinea-Bissau PAYE calculator. We show an explicit unsupported state instead of producing an unverified estimate.</p>\n      </aside>', '<aside class="paye-limit" aria-label="Source review status">\n        <strong>Directory source pack reviewed 14 June 2026</strong>\n        <p>All 54 countries now resolve to a country owner. Route availability is not an official assessment: check the destination\'s tax year, source date, assumptions, and fail-closed status.</p>\n      </aside>');
    html = html.replace('<li><span class="paye-unsupported">Guinea-Bissau — unsupported</span></li>', '<li><a href="/guinea-bissau/gw-paye">Guinea-Bissau</a></li>');
    html = html.replaceAll('Why is Guinea-Bissau unsupported?', 'Is every African country listed?').replaceAll('We have not published a country calculator with a verified source owner for that route. The directory will not substitute another country’s rules or invent a result.', 'Yes. All 54 countries resolve to a country calculator. Check that destination’s source date and assumptions before relying on its estimate.');
  } else {
    html = html.replace('<aside class="paye-limit" aria-label="Limite de couverture">\n        <strong>Couverture manquante : Guinée-Bissau</strong>\n        <p>AfroTools ne publie pas encore de calculateur PAYE pour la Guinée-Bissau avec une source vérifiée. Nous affichons un état non pris en charge au lieu d’inventer une estimation.</p>\n      </aside>', '<aside class="paye-limit" aria-label="État de révision des sources">\n        <strong>Pack de routes revu le 14 juin 2026</strong>\n        <p>Les 54 pays renvoient maintenant vers un propriétaire national. Vérifiez l’année fiscale, la date de source, les hypothèses et l’état fail-closed de la page de destination.</p>\n      </aside>');
    html = html.replaceAll('Pourquoi la Guinée-Bissau n’est-elle pas prise en charge ?', 'Les 54 pays sont-ils répertoriés ?').replaceAll('Nous n’avons pas publié de calculateur national avec une source vérifiée pour cette route. L’annuaire ne remplace pas les règles d’un pays par celles d’un autre.', 'Oui. Les 54 pays renvoient vers un calculateur national. Vérifiez sa date de source et ses hypothèses avant d’utiliser l’estimation.');
  }
  if (!html.includes('hreflang="sw"')) {
    html = html.replace('<link rel="alternate" hreflang="x-default"', '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/mshahara-na-kodi/paye/">\n<link rel="alternate" hreflang="x-default"');
  }
  fs.writeFileSync(file, html, 'utf8');
}

function removeFalseHubAlternate(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<link rel="alternate" hreflang="sw" href="https:\/\/afrotools\.com\/sw\/mshahara-na-kodi\/paye\/">\r?\n/, '');
  fs.writeFileSync(file, html, 'utf8');
}

fs.writeFileSync(routes.sw, page(), 'utf8');
patchDirectoryPeer(routes.en, 'en');
patchDirectoryPeer(routes.fr, 'fr');
removeFalseHubAlternate(routes.enHub);
removeFalseHubAlternate(routes.frHub);
console.log('Built exact 54-country Swahili PAYE directory and reciprocal route ownership.');
