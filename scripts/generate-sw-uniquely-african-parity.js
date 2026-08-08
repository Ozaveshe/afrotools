#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");
const { getPresentation, COPY } = require("./lib/sw-uniquely-african-presentations");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const FRENCH_MANIFEST = path.join(ROOT, "data", "localization", "fr-uniquely-african-parity-manifest.json");
const MANIFEST_PATH = path.join(ROOT, "data", "localization", "sw-uniquely-african-parity-manifest.json");
const HUB_FILE = path.join(ROOT, "sw", "zana-za-kipekee-afrika", "index.html");
const SHARED_CSS_SOURCE = path.join(ROOT, "assets", "css", "fr-uniquely-african.css");
const SW_CSS_FILE = path.join(ROOT, "assets", "css", "sw-uniquely-african.css");
const LANE_IDS = new Set(["naira-to-words", "amount-words-ke", "amount-words-gh", "susu-tracker", "whatsapp-link", "ajo-interest", "market-days", "ajo-chama-calc"]);
const FULL = process.argv.includes("--full");

const ROUTES = Object.freeze({
  "japa-calculator": ["/sw/zana/kikokotoo-uhamishaji/", "native-blocked-handoff"],
  "mobile-money-fees": ["/sw/zana/ada-pesa-simu/", "native-existing"],
  "fintech-fee-watch": ["/sw/zana/ufuatiliaji-ada-fintech/", "shared-engine"],
  "ajo-chama": ["/sw/zana/kifuatiliaji-ajo-chama/", "shared-engine"],
  "electricity-estimator": ["/sw/zana/makisio-ya-bili-ya-umeme/", "shared-engine"],
  "fuel-cost": ["/sw/zana/gharama-za-mafuta/", "shared-engine"],
  "hawala-tracker": ["/sw/zana/ufuatiliaji-hawala/", "shared-engine"],
  "burial-cost": ["/sw/zana/gharama-za-mazishi/", "native-blocked-runtime-wrapper"],
  "staple-basket": ["/sw/zana/kikapu-cha-bidhaa-msingi/", "shared-engine"],
  "wholesale-retail-spread": ["/sw/zana/tofauti-bei-jumla-rejareja/", "shared-engine"],
  "land-size": ["/sw/zana/ukubwa-wa-ardhi/", "shared-engine"],
  "naira-to-words": ["/sw/zana/naira-kwa-maneno/", "shared-engine"],
  "amount-words-ke": ["/sw/zana/kiasi-kwa-maneno-kenya/", "shared-engine"],
  "amount-words-gh": ["/sw/zana/kiasi-kwa-maneno-ghana/", "shared-engine"],
  "susu-tracker": ["/sw/zana/kifuatiliaji-susu/", "shared-engine"],
  "whatsapp-link": ["/sw/zana/kiungo-cha-whatsapp/", "shared-engine"],
  "remittance-compare": ["/sw/zana/ulinganisho-uhamishaji-pesa/", "native-existing"],
  "informal-fx-watch": ["/sw/zana/ufuatiliaji-soko-la-fedha/", "shared-engine"],
  "remittance-v2": ["/sw/zana/ulinganisho-uhamishaji-pesa-kina/", "native-existing"],
  "cost-of-living": ["/sw/zana/gharama-za-maisha/", "shared-engine"],
  "afroatlas": ["/sw/zana/afroatlas/", "shared-engine"],
  "afropoints": ["/sw/zana/afropoints/", "shared-engine"],
  "afrokitchen": ["/sw/zana/jikoni/", "shared-engine"],
  "africa-conflict": ["/sw/zana/migogoro-ya-afrika/", "shared-engine"],
  "brideprice-advisor": ["/sw/zana/mshauri-wa-mahari/", "native-blocked-shell"],
  "ajo-interest": ["/sw/zana/riba-ya-ajo-esusu-stokvel/", "shared-engine"],
  "diaspora-guide": ["/sw/zana/mwongozo-wa-diaspora/", "shared-engine"],
  "nollywood-pitch": ["/sw/zana/bajeti-ya-filamu-afrika/", "shared-engine"],
  "okada-income": ["/sw/zana/mapato-ya-okada-boda/", "shared-engine"],
  "market-days": ["/sw/zana/kalenda-ya-siku-za-soko/", "shared-engine"],
  "ajo-chama-calc": ["/sw/zana/kikokotoo-ajo-chama-tontine/", "shared-engine"],
  "afroprices": ["/sw/zana/afroprices/", "shared-engine"],
  "ankara-kente-cost": ["/sw/zana/gharama-ya-ankara-na-kente/", "shared-engine"],
  "fabric-cost": ["/sw/zana/gharama-ya-kitambaa/", "shared-engine"]
});

const NATIVE_COPY = Object.freeze({
  "japa-calculator": ["Kikokotoo cha gharama za Japa", "Panga gharama za kuhama kutoka nchi ya Afrika kwenda ughaibuni kwa sarafu na dhana zinazoonekana."],
  "mobile-money-fees": ["Kilinganishi cha ada za Mobile Money", "Linganisha ada kwa nchi, mtandao, kiasi na aina ya muamala."],
  "burial-cost": ["Kikokotoo cha gharama za mazishi", "Panga bajeti ya mazishi kwa heshima ya chaguo za familia, dini, jamii na usafiri."],
  "naira-to-words": ["Naira kwa maneno", "Andika kiasi cha naira na kobo kwa maandalizi ya hundi na nyaraka."],
  "amount-words-ke": ["Shilingi za Kenya kwa maneno", "Andika kiasi cha KES kwa maneno kwa maandalizi ya nyaraka."],
  "amount-words-gh": ["Cedi za Ghana kwa maneno", "Andika kiasi cha GHS kwa maneno kwa maandalizi ya nyaraka."],
  "susu-tracker": ["Kifuatiliaji cha Susu, Esusu na Chama", "Fuatilia michango, zamu na malipo huku kanuni za kikundi zikibaki wazi."],
  "whatsapp-link": ["Kizalishaji cha kiungo cha WhatsApp", "Tengeneza kiungo cha WhatsApp kwa namba yenye msimbo wa nchi bila kutuma namba kwa AfroTools."],
  "remittance-compare": ["Kilinganishi cha kutuma fedha Afrika", "Linganisha ada, kiwango cha ubadilishaji na kiasi atakachopokea mlengwa."],
  "remittance-v2": ["Kilinganishi cha kina cha kutuma fedha", "Linganisha watoa huduma kwa kiasi kinachopokelewa, ada, kiwango na muda."],
  "brideprice-advisor": ["Mshauri wa maandalizi ya mahari", "Andaa majadiliano ya mahari kwa heshima, ridhaa na mipaka ya kifedha."],
  "ajo-interest": ["Kikokotoo cha thamani ya zamu ya Ajo", "Linganisha thamani ya muda wa zamu bila kugeuza msaada wa kikundi kuwa ahadi ya mkopo."],
  "market-days": ["Kalenda ya siku za soko Igbo", "Kokotoa mzunguko wa Eke, Orie, Afo na Nkwo kwa muktadha wa kalenda ya Igbo."],
  "ajo-chama-calc": ["Kikokotoo cha Ajo, Chama na Tontine", "Tengeneza ratiba ya michango, zamu na kiasi cha kikundi." ]
});

const CULTURAL_SCOPE_SW = Object.freeze({
  "naira-to-words": "Maneno ya nyaraka za NGN na kobo; output ya Kiingereza imehifadhiwa kwa ulinganifu wa mmiliki wa Nigeria huku UI ikiwa Kiswahili.",
  "amount-words-ke": "Maneno ya nyaraka za KES na senti; output ya Kiingereza imehifadhiwa kwa ulinganifu wa mmiliki wa Kenya huku UI ikiwa Kiswahili.",
  "amount-words-gh": "Maneno ya nyaraka za GHS na pesewa; output ya Kiingereza imehifadhiwa kwa ulinganifu wa mmiliki wa Ghana huku UI ikiwa Kiswahili.",
  "susu-tracker": "Mipango ya Susu, Esusu na Chama inayohifadhi majina ya eneo, michango, ada, akiba na malipo yaliyokosekana bila kuahidi payout.",
  "whatsapp-link": "Uundaji wa kiungo cha wa.me kwa namba ya kimataifa; namba na ujumbe hubaki kwenye kivinjari na hazithibitishwi kuwa mali ya mtu fulani.",
  "ajo-interest": "Ulinganisho wa nafasi ya zamu ya Ajo au Esusu kwa mfuko, ada, akiba na wanachama waliochelewa; si mkopo wala ahadi ya riba.",
  "market-days": "Mzunguko wa siku nne wa Igbo kwa Eke, Orie, Afor na Nkwo; marejeo ya 2026 na matumizi ya soko la eneo hubaki wazi.",
  "ajo-chama-calc": "Ratiba ya Ajo, Chama na Tontine kwa zamu, payout, adhabu na akiba bila kufuta kanuni za kikundi cha eneo.",
  "fintech-fee-watch": "Ada za uhamisho, utoaji, kadi, wafanyabiashara na ubadilishaji wa fedha barani Afrika; usidai kuwa bei ni za moja kwa moja wakati chanzo hakipatikani.",
  "ajo-chama": "Ufuatiliaji wa akiba ya mzunguko kwa istilahi za Ajo, Esusu, Chama, Stokvel na Tontine bila kufuta tofauti za taratibu za eneo.",
  "electricity-estimator": "Mipango ya matumizi ya umeme kwa kaya na biashara ndogo; ushuru huwekwa na mtumiaji kama makisio, si viwango rasmi vya moja kwa moja.",
  "fuel-cost": "Mipango ya mafuta ya safari na jenereta kwa sarafu za Afrika, ikihifadhi umbali, ufanisi, aina ya mafuta na bei ya eneo kama dhana zinazoonekana.",
  "hawala-tracker": "Ulinganisho wa kutuma fedha rasmi na zisizo rasmi; Hawala huonyeshwa kama makisio yenye mipaka ya uzingatiaji na uthibitishaji.",
  "staple-basket": "Vikapu vya vyakula vya msingi kwa nchi na soko, vikihifadhi majina ya bidhaa, vipimo, soko, tarehe ya uchunguzi na hali ya nakala ya ndani.",
  "wholesale-retail-spread": "Tofauti ya bei ya jumla na rejareja katika masoko ya Afrika, ikihifadhi soko, bidhaa, kipimo, sarafu, tarehe na mipaka ya taarifa iliyowasilishwa.",
  "land-size": "Ubadilishaji wa eneo la kiwanja na shamba barani Afrika; dhana za vipimo vya eneo hubaki makisio yanayoweza kubadilishwa.",
  "informal-fx-watch": "Tofauti kati ya viwango rasmi na vilivyoonekana kwenye soko lisilo rasmi; kila uchunguzi una tarehe na haujathibitishwa bila chanzo kilichotajwa.",
  "cost-of-living": "Ulinganisho wa gharama za miji ya Afrika, ukihifadhi mji, ukubwa wa kaya, sarafu, dhana za kikapu na mwaka wa taarifa.",
  "afroatlas": "Mwongozo wa uchumi na rasilimali za nchi za Afrika, ukihifadhi utambulisho wa nchi, vipimo, nafasi, vyanzo na mwaka wa taarifa.",
  "afropoints": "Zawadi za kuchangia taarifa za Afrika, zikihifadhi kazi, ushahidi, pointi na sheria za ukaguzi bila kuahidi thamani ya fedha taslimu.",
  "afrokitchen": "Ramani ya mapishi na mpango wa milo ya Afrika, ikihifadhi asili ya chakula, majina ya eneo, viambato, tahadhari za lishe na vipimo vya mgao.",
  "africa-conflict": "Muhtasari wa migogoro unaohifadhi nchi, ukali, tarehe, vyanzo na kutokuwa na uhakika, bila kuonyesha taarifa za zamani kama ushauri wa sasa wa usalama.",
  "diaspora-guide": "Mipango ya kodi na ukaazi kwa diaspora, ikihifadhi nchi ya asili, unakoishi, hali ya ukaazi na chaguo za kutuma fedha huku ikikanusha ushauri wa kisheria au kodi.",
  "nollywood-pitch": "Bajeti ya uzalishaji wa Nollywood inayohifadhi sehemu za uzalishaji za Nigeria, sarafu ya naira, akiba ya dharura na dhana za usambazaji.",
  "okada-income": "Mipango ya mapato ya Okada, boda-boda na teksi za pikipiki, ikihifadhi istilahi za eneo, sarafu, ratiba ya kazi, mafuta na matengenezo.",
  "afroprices": "Ulinganisho wa bei kati ya nchi za Afrika, ukihifadhi nchi, mji, bidhaa, kipimo, sarafu, chanzo na tarehe ya uchunguzi.",
  "ankara-kente-cost": "Gharama ya vazi la Ankara na Kente, ikihifadhi aina ya kitambaa, yadi, ulinganishaji wa muundo, ushonaji, vifaa, upotevu na sarafu ya eneo.",
  "fabric-cost": "Gharama ya vifaa vya ushonaji wa Afrika, ikihifadhi aina ya kitambaa, kipimo, kiasi, upotevu, vifaa vidogo, kazi na sarafu kama maingizo wazi."
});

function culturalScopeSw(id) {
  const value = CULTURAL_SCOPE_SW[id];
  if (!value) throw new Error(`Missing Swahili cultural scope for ${id}`);
  return value;
}

function routeFile(route) {
  return path.join(ROOT, String(route).replace(/^\/+|\/+$/g, ""), "index.html");
}

function esc(value) {
  return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function json(value) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
function absolute(route) { return `https://afrotools.com${route}`; }
function contentId(id) { return `sw-uniquely-african:${id}`; }

function buildManifest() {
  const fr = JSON.parse(fs.readFileSync(FRENCH_MANIFEST, "utf8"));
  const rows = fr.rows.map((row) => {
    const target = ROUTES[row.english.id];
    if (!target) throw new Error(`Missing Swahili route for ${row.english.id}`);
    const swFile = routeFile(target[0]);
    return {
      index: row.index,
      english: row.english,
      french: row.french,
      swahili: { route: target[0], file: path.relative(ROOT, swFile).replace(/\\/g, "/"), mode: target[1] },
      culturalScope: row.english.id === "mobile-money-fees" ? "User-entered, timestamped mobile-money fee quotes; compare only matching currency, amount and transaction type without embedded operator tariffs or rankings." : row.culturalScope,
      countryCodes: row.countryCodes,
      engineOwner: row.english.id === "mobile-money-fees" ? "assets/js/engines/mobile-money-quote-engine.js" : row.engineOwner,
      dataOwner: row.english.id === "mobile-money-fees" ? "user-entered-quote-receipts + data/fintech/official-sources.json#mobileMoney.fee" : row.dataOwner,
      exports: row.exports,
      artwork: row.artwork
    };
  });
  return {
    schemaVersion: 1,
    programme: "sw-uniquely-african-parity",
    foundation: "6edacda8437e1fa9b9e5a512138cbdd3169e38be",
    coordinatorSnapshot: { head: "6edacda8437e1fa9b9e5a512138cbdd3169e38be", acceptedGlobal: 873, categoryAccepted: 20 },
    category: { key: "african", englishName: "Uniquely African", englishHub: "/uniquely-african/", swahiliHub: "/sw/zana-za-kipekee-afrika/" },
    denominator: 34,
    sourceOwner: "scripts/generate-sw-uniquely-african-parity.js",
    rows
  };
}

function fieldHtml(field) {
  const id = `ua-${field.key}`;
  const attrs = [`id="${id}"`, `name="${esc(field.key)}"`, `data-ua-field="${esc(field.key)}"`];
  let control;
  if (field.type === "select") {
    const options = (field.options || []).map((option) => `<option value="${esc(option.value)}"${String(option.value) === String(field.value) ? " selected" : ""}>${esc(option.label)}</option>`).join("");
    control = `<select ${attrs.join(" ")}>${options}</select>`;
  } else {
    if (field.min != null) attrs.push(`min="${esc(field.min)}"`);
    if (field.max != null) attrs.push(`max="${esc(field.max)}"`);
    if (field.step != null) attrs.push(`step="${esc(field.step)}"`);
    attrs.push(`value="${esc(field.value)}"`);
    control = `<input type="${field.type === "number" ? "number" : "text"}" ${attrs.join(" ")}>`;
  }
  return `<label for="${id}"><span>${esc(field.label)}</span>${control}</label>`;
}

function delegateScript(id) {
  const scripts = { afroatlas: "/engines/afroatlas-engine.js", afropoints: "/engines/afropoints-engine.js", afrokitchen: "/engines/afrokitchen-engine.js", "africa-conflict": "/engines/africa-conflict-engine.js", afroprices: "/engines/afroprices-engine.js" };
  return scripts[id] ? `<script src="${scripts[id]}"></script>` : "";
}

function alternateLinks(row) {
  const source = fs.readFileSync(path.join(ROOT, row.english.file), "utf8");
  const links = new Map();
  for (const match of source.matchAll(/<link\b[^>]*rel=["']alternate["'][^>]*>/gi)) {
    const language = match[0].match(/hreflang=["']([^"']+)["']/i);
    const href = match[0].match(/href=["']([^"']+)["']/i);
    if (language && href) links.set(language[1].toLowerCase(), href[1]);
  }
  links.set("en", absolute(row.english.route));
  links.set("fr", absolute(row.french.route));
  links.set("sw", absolute(row.swahili.route));
  links.set("x-default", absolute(row.english.route));
  const order = ["en", "fr", "sw", ...Array.from(links.keys()).filter((key) => !["en", "fr", "sw", "x-default"].includes(key)), "x-default"];
  return order.map((language) => `<link rel="alternate" hreflang="${esc(language)}" href="${esc(links.get(language))}">`).join("");
}

function generatedPage(row, presentation) {
  const title = `${presentation.title} | AfroTools`;
  const schema = { "@context":"https://schema.org", "@type":"WebApplication", name:presentation.title, description:presentation.description, url:absolute(row.swahili.route), inLanguage:"sw", applicationCategory:"UtilityApplication", operatingSystem:"Web", isBasedOn:absolute(row.english.route), offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}, image:`https://afrotools.com/${row.artwork.path}` };
  const contract = { ...presentation, englishRoute:row.english.route, swahiliRoute:row.swahili.route, countryCodes:row.countryCodes, culturalScope:culturalScopeSw(row.english.id) };
  return `<!doctype html>
<html lang="sw" data-theme="system"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="content-language" content="sw">
  <meta name="afrotools-source-owner" content="scripts/generate-sw-uniquely-african-parity.js"><meta name="afrotools-content-id" content="${esc(contentId(row.english.id))}"><title>${esc(title)}</title>
  <meta name="description" content="${esc(presentation.description)}"><meta name="robots" content="index,follow">
  <link rel="canonical" href="${absolute(row.swahili.route)}">${alternateLinks(row)}
  <meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools"><meta property="og:locale" content="sw_TZ">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(presentation.description)}"><meta property="og:url" content="${absolute(row.swahili.route)}"><meta property="og:image" content="https://afrotools.com/${row.artwork.path}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(presentation.description)}"><meta name="twitter:image" content="https://afrotools.com/${row.artwork.path}">
  <link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/sw-uniquely-african.css">
  <script type="application/ld+json">${json(schema)}</script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
</head><body data-sw-ua-app="${esc(row.english.id)}">
  <a class="ua-skip" href="#ua-main">Nenda kwenye kikokotoo</a><afro-navbar></afro-navbar>
  <main id="ua-main" class="ua-page"><nav class="ua-breadcrumb" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a><span aria-hidden="true">›</span><a href="/sw/zana-za-kipekee-afrika/">Zana za kipekee Afrika</a><span aria-hidden="true">›</span><span>${esc(presentation.title)}</span></nav>
    <header class="ua-hero"><div><p class="ua-eyebrow">${esc(presentation.eyebrow)}</p><h1>${esc(presentation.title)}</h1><p class="ua-lead">${esc(presentation.description)}</p></div><img data-sw-ua-artwork src="/${esc(row.artwork.path)}" width="320" height="180" alt="" loading="eager"></header>
    <section class="ua-context" aria-label="Muktadha wa matumizi"><strong>Muktadha umehifadhiwa</strong><p>${esc(culturalScopeSw(row.english.id))}</p></section>
    <div class="ua-layout"><form data-ua-form novalidate><h2>Ingiza taarifa</h2><fieldset class="ua-fieldset"><legend>Hesabu yako</legend><div class="ua-fields">${presentation.fields.map(fieldHtml).join("")}</div></fieldset><div class="ua-actions"><button class="ua-primary" type="submit">${esc(presentation.action)}</button><button type="button" data-ua-reset>Anza upya</button></div></form>
      <section class="ua-result" data-ua-result hidden tabindex="-1" aria-labelledby="ua-result-title"><header><p class="ua-kicker">Matokeo ya ndani</p><h2 id="ua-result-title">Matokeo ya hesabu</h2></header><div data-ua-status role="status" aria-live="polite"></div><div data-ua-metrics></div><div class="ua-table-wrap"><table data-ua-table></table></div><div class="ua-export-actions" data-ua-exports></div></section></div>
    <section class="ua-proof-grid" aria-label="Vyanzo, tarehe na mipaka"><article><h2>Chanzo na mmiliki</h2><p>${esc(presentation.source)}</p></article><article><h2>Upya wa taarifa</h2><p>${esc(presentation.freshness)}</p></article><article><h2>Kiwango cha kuamini</h2><p>${esc(presentation.confidence)}</p></article><article><h2>Mipaka</h2><p>${esc(presentation.limitations)}</p></article></section>
    <section class="ua-privacy"><h2>Faragha ya ndani</h2><p>Hesabu na mafaili hutengenezwa kwenye kivinjari chako. Maingizo hayatumiwi kwa AI wala kuhifadhiwa na AfroTools. Zana zenye data ya kusoma huonyesha hali ya chanzo au hitilafu.</p></section>
    <nav class="ua-next" aria-label="Hatua zinazofuata"><a href="/sw/ai/?tool=${encodeURIComponent(row.english.id)}&route=${encodeURIComponent(row.swahili.route)}">Andaa kazi hii katika AfroTools AI</a><a href="/sw/zana-za-kipekee-afrika/">Rudi kwenye zana za kipekee Afrika</a></nav>
  </main><afro-footer></afro-footer><script id="uaContract" type="application/json">${json(contract)}</script><script src="/assets/vendor/pdf-lib/pdf-lib.min.js"></script><script src="/assets/js/lib/swahili-local-pdf.js"></script><script src="/engines/uniquely-african-engine.js"></script>${delegateScript(row.english.id)}<script src="/assets/js/pages/sw-uniquely-african.js"></script><script src="/assets/js/lib/sw-accessibility.js" defer></script>
</body></html>\n`;
}

function upsertMeta(html, attribute, name, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${name}["'])[^>]*>`, "i");
  const tag = `<meta ${attribute}="${name}" content="${content}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function hardenNative(row, source) {
  let html = source.replace(/<body\b([^>]*)>/i, function (match, attributes) {
    return /data-sw-ua-native=/i.test(attributes) ? match : `<body${attributes} data-sw-ua-native="${row.english.id}">`;
  });
  html = upsertMeta(html, "property", "og:image", `https://afrotools.com/${row.artwork.path}`);
  html = upsertMeta(html, "name", "twitter:image", `https://afrotools.com/${row.artwork.path}`);
  html = upsertMeta(html, "name", "afrotools-content-id", contentId(row.english.id));
  if (!html.includes('/assets/js/lib/sw-accessibility.js')) {
    html = html.replace(/<\/body>/i, '<script src="/assets/js/lib/sw-accessibility.js" defer></script></body>');
  }
  return html;
}

function hubHtmlBase(manifest) {
  const cards = manifest.rows.map((row) => {
    const p = getPresentation(row.english.id);
    const native = NATIVE_COPY[row.english.id];
    const title = p ? p.title : native[0];
    const description = p ? p.description : native[1];
    const ready = row.swahili.mode === "shared-engine" || row.swahili.mode === "native-existing";
    return `<article class="ua-hub-card" data-state="${ready ? "candidate" : "blocked"}"><img src="/${row.artwork.path}" width="240" height="135" alt="" loading="lazy"><div><p>${esc(description)}</p><h2>${ready ? `<a href="${row.swahili.route}">${esc(title)}</a>` : esc(title)}</h2><span>${ready ? "Programu ya Kiswahili" : "Inasubiri injini ya pamoja"}</span></div></article>`;
  }).join("\n");
  return `<!doctype html><html lang="sw" data-theme="system"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zana 34 za kipekee Afrika kwa Kiswahili | AfroTools</title><meta name="description" content="Zana 34 za AfroTools zinazohusu maisha, masoko, vikundi, diaspora, mapishi na utamaduni wa Afrika kwa Kiswahili."><meta name="robots" content="index,follow"><link rel="canonical" href="https://afrotools.com/sw/zana-za-kipekee-afrika/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana-za-kipekee-afrika/"><meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ"><meta property="og:site_name" content="AfroTools"><meta property="og:title" content="Zana 34 za kipekee Afrika kwa Kiswahili"><meta property="og:description" content="Zana za kupanga maisha na biashara za Afrika kwa Kiswahili, zikiwa na vyanzo na mipaka inayoonekana."><meta property="og:url" content="https://afrotools.com/sw/zana-za-kipekee-afrika/"><meta property="og:image" content="https://afrotools.com/assets/img/tools/afroatlas.webp"><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/sw-uniquely-african.css"><script type="application/ld+json">${json({"@context":"https://schema.org","@type":"CollectionPage",name:"Zana 34 za kipekee Afrika kwa Kiswahili",url:"https://afrotools.com/sw/zana-za-kipekee-afrika/",inLanguage:"sw",numberOfItems:34})}</script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script></head><body data-sw-ua-hub><a class="ua-skip" href="#ua-hub">Nenda kwenye zana</a><afro-navbar></afro-navbar><main id="ua-hub" class="ua-page ua-hub"><nav class="ua-breadcrumb" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a><span aria-hidden="true">›</span><span>Zana za kipekee Afrika</span></nav><header class="ua-hub-hero"><p class="ua-eyebrow">Imeundwa kwa muktadha wa Afrika</p><h1>Zana 34 za kipekee Afrika</h1><p>Majina ya eneo, nchi, sarafu, vipimo, vyanzo na mipaka hubaki wazi. Programu 6 bado zimezuiwa kwa sababu data, fomula au uthibitisho wa chanzo haujatosha; hazihesabiwi kama zimekubaliwa.</p></header><div class="ua-hub-count"><strong>28 / 34</strong><span>programu za Kiswahili zilizo tayari kwa uthibitisho wa kivinjari</span></div><section class="ua-hub-grid" aria-label="Orodha ya programu 34">${cards}</section></main><afro-footer></afro-footer></body></html>\n`;
}

function hubHtml(manifest) {
  const html = hubHtmlBase(manifest);
  return html.includes('/assets/js/lib/sw-accessibility.js')
    ? html
    : html.replace(/<\/body>/i, '<script src="/assets/js/lib/sw-accessibility.js" defer></script></body>');
}

function writeOrCheck(file, content, changed) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current === content) return;
  changed.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  if (WRITE) {
    fs.mkdirSync(path.dirname(file), { recursive:true });
    writeFileSyncWithRetry(file, content, "utf8");
  }
}

function ensureReciprocalSwahiliAlternate(html, row) {
  const href = absolute(row.swahili.route);
  const existing = new RegExp(`<link\\b[^>]*rel=["']alternate["'][^>]*hreflang=["']sw["'][^>]*href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "i");
  if (existing.test(html)) return html;
  const link = `<link rel="alternate" hreflang="sw" href="${href}">`;
  const xDefault = /<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']x-default["'][^>]*>/i;
  if (xDefault.test(html)) return html.replace(xDefault, (match) => `${link}\n${match}`);
  const canonical = /<link\b[^>]*rel=["']canonical["'][^>]*>/i;
  if (canonical.test(html)) return html.replace(canonical, (match) => `${match}\n${link}`);
  throw new Error(`${row.english.id}: English owner has no canonical anchor for reciprocal hreflang`);
}

function reciprocalOwnerFiles(row) {
  const files = new Set([path.join(ROOT, row.english.file), path.join(ROOT, row.french.file)]);
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  for (const match of english.matchAll(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']https:\/\/afrotools\.com(\/[^"']+)["'][^>]*>/gi)) {
    const candidate = routeFile(match[1]);
    if (fs.existsSync(candidate)) files.add(candidate);
  }
  return [...files];
}

function main() {
  const manifest = buildManifest();
  if (manifest.rows.length !== 34 || new Set(manifest.rows.map((row) => row.english.id)).size !== 34) throw new Error("African denominator must be exactly 34 unique apps");
  if (Object.keys(COPY).length !== 28) throw new Error("Expected exactly 28 shared-engine presentations");
  const changed = [];
  writeOrCheck(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, changed);
  writeOrCheck(SW_CSS_FILE, fs.readFileSync(SHARED_CSS_SOURCE, "utf8").replace(/data-fr-ua/g, "data-sw-ua"), changed);
  for (const row of manifest.rows.filter((item) => item.swahili.mode === "shared-engine" && (FULL || LANE_IDS.has(item.english.id)))) {
    const presentation = getPresentation(row.english.id);
    if (!presentation) throw new Error(`Missing presentation for ${row.english.id}`);
    writeOrCheck(routeFile(row.swahili.route), generatedPage(row, presentation), changed);
    for (const ownerFile of reciprocalOwnerFiles(row)) {
      writeOrCheck(ownerFile, ensureReciprocalSwahiliAlternate(fs.readFileSync(ownerFile, "utf8"), row), changed);
    }
  }
  for (const row of manifest.rows.filter((item) => item.swahili.mode === "native-existing")) {
    const file = routeFile(row.swahili.route);
    if (!fs.existsSync(file)) throw new Error(`Missing native Swahili owner ${row.english.id}`);
    writeOrCheck(file, hardenNative(row, fs.readFileSync(file, "utf8")), changed);
  }
  const readyCount = manifest.rows.filter((row) => row.swahili.mode === "shared-engine" || row.swahili.mode === "native-existing").length;
  const blockedCount = manifest.rows.length - readyCount;
  const hub = hubHtml(manifest)
    .replace('Programu 6 bado zimezuiwa', `Programu ${blockedCount} bado zimezuiwa`)
    .replace('<strong>28 / 34</strong>', `<strong>${readyCount} / 34</strong>`)
    .replace(
      '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana-za-kipekee-afrika/">',
      '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana-za-kipekee-afrika/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/sw/zana-za-kipekee-afrika/">'
    );
  const ownedHub = upsertMeta(
    upsertMeta(hub, "name", "afrotools-source-owner", "scripts/generate-sw-uniquely-african-parity.js"),
    "name",
    "afrotools-content-id",
    contentId("hub")
  );
  writeOrCheck(HUB_FILE, ownedHub, changed);
  console.log(JSON.stringify({ mode: WRITE ? "write" : CHECK ? "check" : "plan", changedFiles: changed.length, files: changed }, null, 2));
  if (CHECK && changed.length) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { ROUTES, buildManifest, generatedPage, hubHtml };
