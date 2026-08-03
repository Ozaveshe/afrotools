#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  SW_ENERGY_REMAINING_APPS,
  PRESERVED_ACCEPTED,
  REVIEWED_AT,
} = require("./lib/sw-energy-remaining-contract");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const HUB = path.join(ROOT, "sw", "nishati-na-huduma", "index.html");
const ENERGY_SOURCE = path.join(ROOT, "data", "energy", "country-energy-index.js");
const SNAPSHOT = path.join(ROOT, "data", "energy", "sw-energy-planning-snapshot.js");

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

function json(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function snapshotSource() {
  const context = { fetch: () => Promise.resolve(null), window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(ENERGY_SOURCE, "utf8"), context, { filename: ENERGY_SOURCE });
  const data = context.ENERGY_DATA;
  if (!data || !data.countries) throw new Error("Unable to load bundled Energy source");
  const countries = JSON.parse(JSON.stringify(data.countries));
  Object.values(countries).forEach((country) => {
    if (country.lpg && !country.lpg.pricePerKg && country.lpg.perKg) country.lpg.pricePerKg = country.lpg.perKg;
  });
  const payload = {
    lastUpdated: data.lastUpdated,
    status: "planning_snapshot_stale",
    confidence: "low_until_locally_verified",
    liveData: false,
    sourceOwner: "data/energy/country-energy-index.js",
    countries,
  };
  return `(function loadSwEnergyPlanningSnapshot(root){"use strict";root.ENERGY_DATA=${JSON.stringify(payload)};})(typeof globalThis!=="undefined"?globalThis:this);\n`;
}

function fieldMarkup(field) {
  if (field.type === "select") {
    const options = field.options.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("");
    return `<label class="sw-energy-field"><span>${esc(field.label)}</span><select name="${esc(field.name)}">${options}</select></label>`;
  }
  const attrs = [
    `type="number"`, `name="${esc(field.name)}"`, `value="${esc(field.value)}"`,
    `min="${esc(field.min)}"`, `step="${esc(field.step)}"`,
    field.max != null ? `max="${esc(field.max)}"` : "",
    field.required === false ? "" : "required",
  ].filter(Boolean).join(" ");
  return `<label class="sw-energy-field"><span>${esc(field.label)}</span><input ${attrs}></label>`;
}

function page(app) {
  const config = {
    id: app.id,
    title: app.title,
    global: app.global,
    mode: app.mode || "default",
    countryInInput: Boolean(app.countryInInput),
    metrics: app.metrics,
    reviewedAt: app.reviewedAt,
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.title,
    description: app.description,
    url: `https://afrotools.com${app.swRoute}`,
    inLanguage: "sw",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isBasedOn: [
      "https://afrotools.com/data/energy/official-sources.json",
      "https://globalsolaratlas.info/map",
    ],
  };
  return `<!doctype html>
<html lang="sw">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(app.title)} | AfroTools</title>
<meta name="description" content="${esc(app.description)}">
<link rel="canonical" href="https://afrotools.com${app.swRoute}">
<link rel="alternate" hreflang="en" href="https://afrotools.com${app.enRoute}">
<link rel="alternate" hreflang="fr" href="https://afrotools.com${app.frRoute}">
<link rel="alternate" hreflang="sw" href="https://afrotools.com${app.swRoute}">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com${app.enRoute}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta property="og:title" content="${esc(app.title)} | AfroTools"><meta property="og:description" content="${esc(app.description)}">
<meta property="og:url" content="https://afrotools.com${app.swRoute}"><meta property="og:image" content="https://afrotools.com${app.image}">
<meta property="og:image:width" content="800"><meta property="og:image:height" content="450">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com${app.image}">
<script type="application/ld+json">${json(schema)}</script>
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css">
<link rel="stylesheet" href="/assets/css/sw-energy-remaining-parity.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body data-sw-energy-app="${esc(app.id)}">
<afro-navbar active="energy"></afro-navbar>
<main class="sw-energy-page">
  <nav class="sw-energy-breadcrumb" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a><span aria-hidden="true">/</span><a href="/sw/nishati-na-huduma/">Nishati na Huduma</a></nav>
  <header class="sw-energy-hero">
    <p class="sw-energy-kicker">Zana ya Kiswahili · Hufanya kazi kwenye kivinjari</p>
    <h1>${esc(app.title)}</h1><p>${esc(app.description)}</p>
  </header>
  <section class="sw-energy-layout" aria-label="Kikokotoo na mpaka wa data">
    <article class="sw-energy-card sw-energy-calculator">
      <h2>Weka taarifa zako</h2>
      <p class="sw-energy-helper">Badilisha maadili ya mfano kwa taarifa ulizohakiki. Hakuna taarifa inayotumwa kwa seva au AI.</p>
      <form id="energyForm" novalidate>
        <div class="sw-energy-grid">
          <label class="sw-energy-field"><span>Nchi</span><select name="country" id="country" required aria-describedby="countryHint"><option value="">Chagua nchi</option></select><small id="countryHint">Nchi hubadilisha sarafu na nakala ya viwango.</small></label>
          ${app.fields.map(fieldMarkup).join("\n          ")}
        </div>
        <button class="sw-energy-primary" type="submit">Kokotoa</button>
        <p id="formStatus" class="sw-energy-status" role="alert" aria-live="polite"></p>
      </form>
    </article>
    <aside class="sw-energy-card sw-energy-source" aria-labelledby="sourceTitle">
      <p class="sw-energy-kicker">Chanzo, upya na uhakika</p><h2 id="sourceTitle">Nakala ya kupanga ya Machi 2026</h2>
      <dl><div><dt>Hali</dt><dd>Imezeeka; si data ya sasa wala bei hai</dd></div><div><dt>Uhakika</dt><dd>Mdogo hadi uthibitishe viwango vya eneo lako</dd></div><div><dt>Mtandao</dt><dd>Hakuna muunganisho wa bei ya moja kwa moja</dd></div></dl>
      <p>AfroTools ina kiungo cha mdhibiti kwa masoko 12 kati ya 54. Masoko 42 bado yana pengo la chanzo cha mdhibiti. Thibitisha bili, tarifa, bei ya mafuta au nukuu kabla ya kulipa.</p>
      <p><a id="regulatorLink" href="https://www.iea.org/regions/africa" rel="noopener noreferrer">Fungua chanzo cha ukaguzi</a></p>
      <p class="sw-energy-boundary">Makadirio ya kupanga tu; si bili rasmi, bei ya muuzaji, usanifu wa umeme, ukaguzi wa usalama, ofa ya fedha au ushauri wa kitaalamu.</p>
    </aside>
  </section>
  <section id="results" class="sw-energy-card sw-energy-results" hidden aria-labelledby="resultsTitle">
    <div class="sw-energy-result-head"><div><p class="sw-energy-kicker">Matokeo ya uchunguzi</p><h2 id="resultsTitle">${esc(app.title)}</h2></div><span class="sw-energy-confidence">Uhakika mdogo · hakiki data</span></div>
    <dl id="metricGrid" class="sw-energy-metrics"></dl>
    <p id="resultBoundary" class="sw-energy-boundary"></p>
    <div class="sw-energy-actions" aria-label="Hamisha au fungua tena matokeo">
      <button type="button" data-export="json">Pakua JSON</button><button type="button" data-export="csv">Pakua CSV</button><button type="button" data-export="txt">Pakua TXT</button><button type="button" data-export="pdf">Pakua PDF</button>
      <label class="sw-energy-import">Fungua tena JSON<input id="importJson" type="file" accept="application/json,.json"></label>
    </div>
    <p id="exportStatus" class="sw-energy-status" role="status" aria-live="polite"></p>
  </section>
  <section class="sw-energy-card sw-energy-method">
    <h2>Jinsi makadirio haya yanavyofanya kazi</h2>
    <p>Ukurasa huu hutumia injini ileile ya hesabu isiyotegemea lugha kama zana ya Kiingereza. Kiswahili hubadilisha uwasilishaji, si formula. Maadili ya nchi yanatoka <code>country-energy-index.js</code>; rekodi ya vyanzo inakaguliwa kila siku 90, au siku 30 kwa data hatarishi.</p>
    <ul><li>Weka viwango vya sasa kutoka bili, risiti au nukuu yako inapowezekana.</li><li>Hifadhi JSON pamoja na tarehe ya makadirio ili uweze kufungua tena na kukagua.</li><li>Mtaalamu athibitishe usalama, ukubwa wa vifaa, sheria na gharama kabla ya uamuzi.</li></ul>
  </section>
</main>
<afro-footer></afro-footer>
<script data-sw-energy-config type="application/json">${json(config)}</script>
<script src="/data/energy/sw-energy-planning-snapshot.js"></script>
<script src="/engines/${esc(app.engine)}.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script src="/assets/js/pages/sw-energy-remaining-parity.js"></script>
</body></html>\n`;
}

function hubPage() {
  const all = [
    ...PRESERVED_ACCEPTED.map((item) => ({
      ...item,
      title: ({
        "solar-sizing": "Ukubwa wa Mfumo wa Solar",
        "battery-sizing": "Ukubwa wa Betri na Inverter",
        "backup-duration": "Muda wa Backup ya Betri",
      })[item.id],
      description: "Zana ya Kiswahili iliyokubaliwa kwa hesabu na ushahidi wa kivinjari.",
      image: `/assets/img/tools/${item.id}.webp`,
      swRoute: item.route,
      accepted: true,
    })),
    ...SW_ENERGY_REMAINING_APPS,
  ];
  const cards = all.map((app) => `<a class="sw-energy-hub-card" href="${esc(app.swRoute || app.route)}"><img src="${esc(app.image)}" width="800" height="450" loading="lazy" alt=""><span><strong>${esc(app.title)}</strong><small>${esc(app.description)}</small>${app.accepted ? '<em>Imethibitishwa</em>' : '<em>Inahitaji uthibitisho wa kivinjari</em>'}</span></a>`).join("\n");
  return `<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zana za Nishati na Huduma | AfroTools</title><meta name="description" content="Zana 20 za Kiswahili za umeme, solar, maji, LPG, generator, biogas, EV na ukaguzi wa nishati."><link rel="canonical" href="https://afrotools.com/sw/nishati-na-huduma/"><link rel="alternate" hreflang="en" href="https://afrotools.com/energy/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/energy/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/nishati-na-huduma/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/energy/"><meta property="og:title" content="Zana za Nishati na Huduma | AfroTools"><meta property="og:description" content="Zana 20 za Kiswahili za kupanga nishati na huduma."><meta property="og:image" content="https://afrotools.com/assets/img/category/energy.webp"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/sw-energy-remaining-parity.css"><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script></head><body><afro-navbar active="energy"></afro-navbar><main class="sw-energy-page"><header class="sw-energy-hero"><p class="sw-energy-kicker">Nishati na Huduma · Kiswahili</p><h1>Zana 20 za maamuzi ya nishati</h1><p>Kadiria matumizi, gharama, ukubwa na athari kwa njia ya faragha. Kila zana inaonyesha mipaka ya chanzo na upya wa data.</p></header><section class="sw-energy-hub-grid" aria-label="Zana za nishati">${cards}</section><section class="sw-energy-card sw-energy-method"><h2>Mpaka wa data</h2><p>Viwango vilivyofungwa ni nakala ya Machi 2026 na havidai kuwa vya sasa. Thibitisha tarifa, bei ya mafuta, bei ya LPG, bei ya maji, nukuu na masharti na mdhibiti au mtoa huduma wa eneo lako.</p></section></main><afro-footer></afro-footer></body></html>\n`;
}

function reconcile(file, content) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current === content) return false;
  if (!WRITE) throw new Error(`${path.relative(ROOT, file)} is stale; run with --write`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return true;
}

let changed = 0;
changed += reconcile(SNAPSHOT, snapshotSource()) ? 1 : 0;
for (const app of SW_ENERGY_REMAINING_APPS) {
  changed += reconcile(path.join(ROOT, app.file), page(app)) ? 1 : 0;
}
changed += reconcile(HUB, hubPage()) ? 1 : 0;
console.log(`${WRITE ? "wrote" : "checked"} planning snapshot + ${SW_ENERGY_REMAINING_APPS.length} Swahili Energy apps + hub; changed ${changed}`);
