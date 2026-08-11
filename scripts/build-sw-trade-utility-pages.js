"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const PAGES = [
  {
    id: "proforma-invoice",
    route: "/sw/zana/ankara-proforma/",
    englishRoute: "/tools/proforma-invoice/",
    frenchRoute: "/fr/tools/facture-proforma/",
    title: "Kizalishaji Ankara Proforma",
    description: "Andaa ankara proforma ya biashara ya kimataifa yenye muuzaji, mnunuzi, HS code, Incoterm, FOB, CFR, CIF na nyaraka za kupakua.",
    intro: "Andaa rasimu kamili ya bei ya biashara kwa ukaguzi wa mnunuzi, benki, wakala wa forodha au msafirishaji.",
    exportLabel: "Vipakuliwa vya ndani",
    guide: `    <section class="swtu-privacy" aria-labelledby="mwongozo-ankara-proforma">
      <h2 id="mwongozo-ankara-proforma">Kagua rasimu kabla ya kuituma</h2>
      <p>Ankara proforma ni rasimu ya bei na masharti, si ombi la mwisho la malipo. Linganisha majina ya muuzaji na mnunuzi, maelezo ya bidhaa, idadi, sarafu, muda wa uhalali na masharti ya malipo na nyaraka zako za biashara.</p>
      <p>Thibitisha HS code, Incoterm, vibali, ushuru, bima na maneno yanayohitajika na mamlaka ya forodha, benki au wakala mwenye sifa. Jumla za FOB, CFR na CIF ni makadirio yanayotokana na thamani unazoingiza; zana haitoi kiwango rasmi cha ushuru, usafirishaji au ubadilishaji fedha.</p>
      <p>Kwa ukaguzi unaofuata, tumia <a href="/sw/zana/kikokotoo-gharama-iliyofika/">kikokotoo cha gharama iliyofika</a>, <a href="/sw/zana/muda-wa-kupitisha-forodha/">mpangilio wa muda wa forodha</a> au rudi kwenye <a href="/sw/biashara-ya-nje/">zana za biashara ya nje</a>.</p>
      <p><strong>Chanzo na hali ya sasa:</strong> maelezo haya yamehakikiwa dhidi ya mkataba wa zana ya Kiingereza na injini ya biashara ya AfroTools tarehe 11 Agosti 2026. Hakuna kiwango cha moja kwa moja au uamuzi rasmi wa forodha unaodaiwa.</p>
    </section>`
  },
  {
    id: "packing-list",
    route: "/sw/zana/orodha-ya-kupakia/",
    englishRoute: "/tools/packing-list/",
    frenchRoute: "/fr/tools/liste-colisage/",
    title: "Kizalishaji Orodha ya Kupakia",
    description: "Andaa packing list yenye wahusika, safari, alama, aina za vifurushi, uzito, CBM na matumizi ya kontena.",
    intro: "Kokotoa vifurushi, uzito, CBM, volumetric weight na matumizi ya kontena katika hati ya usafirishaji."
  },
  {
    id: "bol-generator",
    route: "/sw/zana/bill-of-lading/",
    englishRoute: "/tools/bol-generator/",
    frenchRoute: "/fr/tools/generateur-connaissement/",
    title: "Rasimu ya Bill of Lading",
    description: "Andaa rasimu isiyo rasmi ya Bill of Lading yenye aina ya B/L, wahusika, safari, tarehe on-board, mizigo, freight na sheria inayotumika.",
    intro: "Tayarisha rasimu ya marejeo kwa carrier, freight forwarder au benki; si Bill of Lading halali."
  },
  {
    id: "customs-time",
    route: "/sw/zana/muda-wa-kupitisha-forodha/",
    englishRoute: "/tools/customs-time/",
    frenchRoute: "/fr/tools/delai-dedouanement/",
    title: "Makisio ya Muda wa Forodha",
    description: "Kadiria muda wa clearance, nyaraka halisi kwa aina ya bidhaa, ada za wakala, storage, inspection na port handling.",
    intro: "Panga mazungumzo ya clearance kwa bandari kumi za Afrika ukitumia makisio yanayohitaji uthibitisho rasmi."
  },
  {
    id: "shipping-weight",
    route: "/sw/zana/uzito-wa-usafirishaji/",
    englishRoute: "/tools/shipping-weight/",
    frenchRoute: "/fr/tools/calculateur-de-poids-d-expedition/",
    title: "Kikokotoo cha Uzito wa Usafirishaji",
    description: "Linganisha uzito halisi na volumetric kwa air freight, express courier, road na sea pamoja na divisor na mapendekezo.",
    intro: "Jua chargeable weight kwa kanuni ya njia uliyochagua, kisha thibitisha divisor na carrier kabla ya booking."
  },
  {
    id: "cross-border-data",
    route: "/sw/zana/uhamishaji-data-mpaka/",
    englishRoute: "/tools/cross-border-data/",
    frenchRoute: "/fr/tools/checklist-transfert-donnees/",
    title: "Ukaguzi wa Uhamishaji Data Mpakani",
    description: "Andaa transfer risk map yenye matter, nchi, evidence, risk flags, private notes, regulator sources na hifadhi ya ndani.",
    intro: "Panga ushahidi na tahadhari kabla ya kuhamisha data binafsi nje ya nchi; huu si ushauri wa kisheria."
  }
];

function html(page) {
  const url = `https://afrotools.com${page.route}`;
  const englishUrl = `https://afrotools.com${page.englishRoute}`;
  const frenchUrl = `https://afrotools.com${page.frenchRoute}`;
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.title,
    description: page.description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "sw",
    isAccessibleForFree: true,
    image: `https://afrotools.com/assets/img/tools/${page.id}.webp`
  });
  return `<!doctype html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${page.title} | AfroTools</title>
  <meta name="description" content="${page.description}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en" href="${englishUrl}">
  <link rel="alternate" hreflang="fr" href="${frenchUrl}">
  <link rel="alternate" hreflang="sw" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${englishUrl}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${page.title} | AfroTools">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${page.id}.webp">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
  <link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
  <link rel="stylesheet" href="/assets/css/sw-trade-utility.css">
  <script src="/assets/js/components/navbar.min.js?v=b9df7b05" defer></script>
  <script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script>
  <script src="/assets/js/lib/dark-mode.js?v=1e97021c" defer></script>
</head>
<body>
  <afro-navbar active="trade"></afro-navbar>
  <main class="swtu-main">
    <nav class="swtu-crumb" aria-label="Njia ya ukurasa"><a href="/sw/">Nyumbani</a><span aria-hidden="true">/</span><a href="/sw/biashara-ya-nje/">Biashara ya nje</a></nav>
    <header class="swtu-hero">
      <div>
        <p class="swtu-kicker">Zana ya biashara · Inafanya kazi ndani ya kivinjari</p>
        <h1>${page.title}</h1>
        <p>${page.intro}</p>
        <div class="swtu-badges"><span>Hakuna usajili</span><span>Hakuna data inayotumwa</span><span>${page.exportLabel || "Exports za ndani"}</span></div>
      </div>
      <img src="/assets/img/tools/${page.id}.webp" alt="" width="320" height="200">
    </header>
    <section class="swtu-privacy" aria-label="Faragha">
      <strong>Faragha ya ndani:</strong> maelezo unayoandika hubaki kwenye kifaa hiki. Hifadhi, pakua au shiriki tu kwa kitendo chako mwenyewe. Hakuna simu ya AI au mtandao inayotuma maudhui ya fomu.
    </section>
    <div data-sw-trade-app="${page.id}"></div>${page.guide ? `\n${page.guide}` : ""}
    <section class="swtu-ai">
      <div><h2>Unahitaji kuchagua hatua inayofuata?</h2><p>Tumia mlango wa pamoja wa AfroTools AI kwa Kiswahili. Hautatuma maelezo ya fomu hii bila ruhusa yako.</p></div>
      <a href="/sw/ai/" data-shared-ai-handoff>Fungua AfroTools AI</a>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script src="/engines/trade-utility-engine.js?v=2e42429d"></script>
  <script src="/assets/vendor/jspdf/jspdf.umd.min.js?v=c4b6303c"></script>
  <script src="/assets/js/pages/sw-trade-utility.js"></script>
</body>
</html>
`;
}

function main() {
  const check = process.argv.includes("--check");
  for (const page of PAGES) {
    const file = path.join(ROOT, ...page.route.split("/").filter(Boolean), "index.html");
    const output = html(page);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== output) {
        throw new Error(`${path.relative(ROOT, file)} is stale`);
      }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, output, "utf8");
    }
  }
  console.log(`Swahili Trade Utility pages ${check ? "verified" : "built"}: ${PAGES.length}`);
}

if (require.main === module) main();

module.exports = { PAGES, html };
