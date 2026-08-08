"use strict";

const fs = require("fs");
const path = require("path");
const { normalizeBuildManagedHtml } = require("./lib/shared-asset-references");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");

function field(label, name, options = {}) {
  const help = options.help ? `<small>${options.help}</small>` : "";
  if (options.type === "select") {
    const optionsHtml = (options.choices || []).map(([value, text]) => `<option value="${value}">${text}</option>`).join("");
    return `<div class="sw-trade-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.blank === false ? "" : '<option value="">Chagua…</option>'}${optionsHtml}</select>${help}</div>`;
  }
  if (options.type === "checkbox") {
    return `<label class="sw-trade-check"><input type="checkbox" name="${name}"><span><strong>${label}</strong>${help}</span></label>`;
  }
  const type = options.type || "text";
  const min = options.min === undefined ? "" : ` min="${options.min}"`;
  const max = options.max === undefined ? "" : ` max="${options.max}"`;
  const step = options.step === undefined ? "" : ` step="${options.step}"`;
  const value = options.value === undefined ? "" : ` value="${options.value}"`;
  const required = options.required ? " required" : "";
  return `<div class="sw-trade-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}"${min}${max}${step}${value}${required}>${help}</div>`;
}

const pages = [
  {
    id: "landed-cost", slug: "gharama-bidhaa", en: "/tools/landed-cost/", fr: "/fr/tools/cout-rendu/", image: "landed-cost.webp",
    name: "Kikokotoo cha gharama iliyofika", title: "Kikokotoo cha gharama iliyofika ya bidhaa | AfroTools",
    description: "Kadiria gharama ya bidhaa ilipofika kwa FOB, usafirishaji, bima, ushuru, VAT na ada za ndani ulizothibitisha.",
    lead: "Tenganisha CIF, ushuru, VAT na gharama za ndani kwa kutumia viwango vya muamala wako, bila kudai tathmini rasmi ya forodha.",
    fields: [
      field("Nchi ya kuingiza", "destCountry", { type: "select", blank: false, choices: [] }),
      field("Bandari ya kuwasili", "port", { type: "select", blank: false, choices: [] }),
      field("Thamani ya FOB (USD)", "fobUSD", { type: "number", min: 0.01, step: 0.01, value: 10000, required: true }),
      field("Usafirishaji wa kimataifa (USD)", "freightUSD", { type: "number", min: 0, step: 0.01, value: 1200 }),
      field("Bima (USD)", "insuranceUSD", { type: "number", min: 0, step: 0.01, value: 200 }),
      field("Kiwango cha ushuru (%)", "dutyRate", { type: "number", min: 0, step: 0.01, value: 0, help: "Thibitisha kwa msimbo HS na ratiba ya nchi husika." }),
      field("Sarafu ya ndani kwa USD 1", "fxRate", { type: "number", min: 0.000001, step: 0.000001, value: 1, required: true }),
      field("Idadi ya vipande", "quantity", { type: "number", min: 1, step: 1, value: 1 }),
      field("Ada ya wakala katika sarafu ya ndani", "brokerFeeLocal", { type: "number", min: 0, step: 0.01, value: 0 }),
      field("Ada ya ushughulikiaji ya ndani", "handlingLocal", { type: "number", min: 0, step: 0.01, value: 0 }),
      field("Usafiri wa ndani", "haulageLocal", { type: "number", min: 0, step: 0.01, value: 0 }),
      field("Bei ya kuuza kwa kipande", "sellPriceLocal", { type: "number", min: 0, step: 0.01, value: 0 })
    ],
    scripts: ["/data/trade/country-duty-rates.js", "/data/trade/landed-cost-data.js", "/data/trade/fx-history.js", "/engines/landed-cost-engine.js"],
    warning: "Haya ni makadirio ya kupanga. Thibitisha msimbo HS, msingi wa VAT, msamaha, tozo, kiwango cha fedha na ada zote na mamlaka au wakala aliyeidhinishwa.",
    sources: [["Rejesta ya vyanzo vya forodha AfroTools", "/data/trade/official-sources.json"], ["Shirika la Forodha Duniani", "https://www.wcoomd.org/"]]
  },
  {
    id: "commodity-tracker", slug: "ufuatiliaji-bei-za-bidhaa", en: "/tools/commodity-tracker/", fr: "/fr/tools/suivi-matieres-premieres/", image: "commodity-tracker.webp",
    name: "Kichunguzi cha bidhaa za biashara", title: "Kichunguzi cha bidhaa za biashara Afrika | AfroTools",
    description: "Chunguza picha ya data ya biashara ya 2024 kwa nchi na bidhaa bila kuichanganya na bei ya soko ya sasa.",
    lead: "Tumia data ya kihistoria kuandaa swali la biashara, kisha thibitisha bei, kiwango, kipimo na tarehe kabla ya kufanya uamuzi.",
    fields: [field("Nchi", "country", { type: "select" }), field("Bidhaa au kundi la kuchuja", "commodity")],
    scripts: ["/data/trade/commodity-trade-data.js", "/engines/commodity-engine.js"],
    warning: "Data hii ni picha ya 2024, si bei ya moja kwa moja, nukuu ya mauzo au dhamana ya upatikanaji.",
    sources: [["UN Comtrade", "https://comtradeplus.un.org/"], ["Masoko ya bidhaa ya Benki ya Dunia", "https://www.worldbank.org/en/research/commodity-markets"]]
  },
  {
    id: "ecowas-levy", slug: "tozo-ya-ecowas", en: "/tools/ecowas-levy/", fr: "/fr/tools/ecowas-levy/", image: "ecowas-levy.webp",
    name: "Kikokotoo cha CET na tozo za ECOWAS", title: "Kikokotoo cha CET na tozo za ECOWAS | AfroTools",
    description: "Kadiria CET, tozo na VAT za ECOWAS kwa thamani na kiwango unachothibitisha mwenyewe.",
    lead: "Tenganisha ushuru wa CET, tozo za kikanda na ada za nchi kabla ya kuomba tathmini rasmi ya forodha.",
    fields: [
      field("Thamani ya CIF (USD)", "cifValue", { type: "number", min: 0.01, step: 0.01, value: 10000, required: true }),
      field("Thamani ya FOB (USD)", "fobValue", { type: "number", min: 0, step: 0.01, value: 9500 }),
      field("Nchi ya kuagiza", "countryCode", { type: "select" }),
      field("Bendi ya CET", "cetBand", { type: "select", blank: false, choices: [["0", "Bendi 0 — 0%"], ["1", "Bendi 1 — 5%"], ["2", "Bendi 2 — 10%"], ["3", "Bendi 3 — 20%"], ["4", "Bendi 4 — 35%"]] }),
      field("Msimbo HS wa tarakimu nne", "hsCode"),
      field("Tumia msamaha wa ETLS katika hali hii", "isEtls", { type: "checkbox", help: "Washa tu ukiwa na uthibitisho wa asili na ustahiki." }),
      field("Nchi ya asili ya ECOWAS", "originCountry", { type: "select" }),
      field("Thamani iliyoongezwa ndani (%)", "localValuePct", { type: "number", min: 0, max: 100, step: 0.1, value: 35 }),
      field("Cheti cha Asili cha ECOWAS kipo", "hasCOO", { type: "checkbox" }),
      field("Mabadiliko ya kichwa cha ushuru (CTH) yamethibitishwa", "hasCTH", { type: "checkbox" })
    ],
    scripts: ["/engines/ecowas-levy-engine.js"],
    warning: "Rejesta ya vyanzo ilipitiwa Mei 2026 na imepita dirisha la siku 45 la data yenye hatari kubwa. Matokeo ni ya kupanga tu; thibitisha kiwango, msimbo HS na ETLS na forodha.",
    sources: [["Sekretarieti ya ECOWAS", "https://www.ecowas.int/"], ["Rejesta ya vyanzo vya biashara", "/data/trade/official-sources.json"]]
  },
  {
    id: "sadc-roo", slug: "kanuni-za-asili-sadc", en: "/tools/sadc-roo/", fr: "/fr/tools/regles-origine-sadc/", image: "sadc-roo.webp",
    name: "Ukaguzi wa awali wa kanuni za asili za SADC", title: "Ukaguzi wa kanuni za asili za SADC | AfroTools",
    description: "Kagua kwa awali thamani ya kikanda, CTH na masharti ya bidhaa bila kudai uamuzi rasmi wa asili.",
    lead: "Pima hali yako dhidi ya injini ileile ya kanuni za bidhaa inayotumiwa na programu ya Kiingereza, kisha peleka ushahidi kwa mamlaka.",
    fields: [
      field("Sura ya HS", "hsChapter", { type: "number", min: 1, max: 97, step: 1, value: 9, required: true }),
      field("Nchi ya SADC inayouza nje", "exportCountry", { type: "select" }),
      field("Nchi ya SADC inayoagiza", "importCountry", { type: "select" }),
      field("Bei ya kutoka kiwandani (USD)", "exWorksPrice", { type: "number", min: 0.01, step: 0.01, value: 10000, required: true }),
      field("Gharama ya malighafi zisizo za SADC (USD)", "nonSadcCost", { type: "number", min: 0, step: 0.01, value: 5000, required: true }),
      field("Bidhaa imepatikana yote ndani ya SADC", "whollyObtained", { type: "checkbox" }),
      field("CTH imethibitishwa", "hasCTH", { type: "checkbox" }),
      field("Kanuni ya fabric-forward imetimizwa", "hasFabricFwd", { type: "checkbox" })
    ],
    scripts: ["/engines/sadc-roo-engine.js"],
    warning: "Asilimia pekee haithibitishi asili. Kanuni maalum ya bidhaa, msimbo HS, mchakato na nyaraka lazima zithibitishwe rasmi.",
    sources: [["Sekretarieti ya SADC", "https://www.sadc.int/"], ["Shirika la Forodha Duniani", "https://www.wcoomd.org/"]]
  },
  {
    id: "eac-cet", slug: "ushuru-wa-pamoja-wa-eac", en: "/tools/eac-cet/", fr: "/fr/tools/tec-eac/", image: "eac-cet.webp",
    name: "Kikokotoo cha Ushuru wa Pamoja wa EAC", title: "Kikokotoo cha CET ya EAC | AfroTools",
    description: "Tafuta bidhaa na ukadirie CET, tozo na VAT ya EAC kwa kiwango unachothibitisha.",
    lead: "Tafuta bendi ya kuanzia, linganisha athari kwa nchi, na uweke wazi kuwa kiwango na msimbo HS vinahitaji uthibitisho wa sasa.",
    fields: [
      field("Bidhaa, kundi au msimbo HS", "query", { required: true }),
      field("Thamani ya CIF (USD)", "cifValue", { type: "number", min: 0.01, step: 0.01, value: 10000, required: true }),
      field("Kiwango cha CET (%)", "cetRate", { type: "number", min: 0, max: 150, step: 0.5, value: 25, required: true }),
      field("Nchi ya EAC", "countryCode", { type: "select" })
    ],
    scripts: ["/engines/eac-cet-engine.js"],
    warning: "Rejesta ya vyanzo ilipitiwa Mei 2026 na imepita dirisha la siku 45 la data yenye hatari kubwa. Bendi nyeti, msamaha na ada za nchi lazima zithibitishwe na mamlaka husika.",
    sources: [["Jumuiya ya Afrika Mashariki", "https://www.eac.int/"], ["Rejesta ya vyanzo vya biashara", "/data/trade/official-sources.json"]]
  }
];

function schema(page) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "WebApplication", name: page.name,
    description: page.description, inLanguage: "sw", applicationCategory: "BusinessApplication",
    operatingSystem: "Web", url: `https://afrotools.com/sw/zana/${page.slug}/`,
    image: `https://afrotools.com/assets/img/tools/${page.image}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" }
  });
}

function html(page) {
  const scripts = page.scripts.map((src) => `<script src="${src}"></script>`).join("\n");
  const sources = page.sources.map(([label, url]) => `<li><a href="${url}"${url.startsWith("http") ? ' rel="noopener noreferrer"' : ""}>${label}</a></li>`).join("");
  return `<!doctype html>
<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow"><meta name="afrotools-source-owner" content="scripts/build-sw-trade-regional-parity.js">
<title>${page.title}</title><meta name="description" content="${page.description}">
<meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}"><meta property="og:url" content="https://afrotools.com/sw/zana/${page.slug}/"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${page.image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${page.image}">
<link rel="canonical" href="https://afrotools.com/sw/zana/${page.slug}/"><link rel="alternate" hreflang="en" href="https://afrotools.com${page.en}">${page.fr ? `<link rel="alternate" hreflang="fr" href="https://afrotools.com${page.fr}">` : ""}<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/${page.slug}/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${page.en}">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8"><link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc"><link rel="stylesheet" href="/assets/css/sw-trade-regional-parity.css"><script type="application/ld+json">${schema(page)}</script><script src="/assets/js/components/navbar.min.js?v=6ff46cac" defer></script><script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script></head>
<body><a class="skip-link" href="#main-content">Ruka hadi maudhui</a><afro-navbar active="tools"></afro-navbar>
<main class="sw-trade-shell" id="main-content" data-sw-trade-app data-tool="${page.id}"><nav class="sw-trade-breadcrumb" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a> / <a href="/sw/biashara-ya-nje/">Biashara ya nje</a> / ${page.name}</nav>
<header class="sw-trade-hero"><p class="sw-trade-eyebrow">Biashara ya nje · zana ya kupanga</p><h1>${page.name}</h1><p>${page.lead}</p><ul><li>Kiswahili asilia</li><li>Hesabu ya ndani</li><li>Export bila akaunti</li><li>Dhana zinazoonekana</li></ul></header>
<div class="sw-trade-layout"><section class="sw-trade-card"><h2>Andaa matokeo</h2><p>Weka taarifa kutoka kwenye nyaraka, nukuu au chanzo ulichokagua. Programu haitafuti kiwango kipya kwa siri.</p><form data-trade-form novalidate><div class="sw-trade-fields">${page.fields.join("\n")}</div><div class="sw-trade-actions"><button class="sw-trade-button" type="submit">Kokotoa na ukague</button><button class="sw-trade-button sw-trade-button--secondary" type="reset">Weka upya</button></div><p class="sw-trade-status" data-trade-status role="status" aria-live="polite" tabindex="-1">Jaza sehemu kisha anzisha hesabu.</p></form>
<section class="sw-trade-result" data-trade-result tabindex="-1" hidden><h2>Matokeo na ukaguzi</h2><p data-trade-summary></p><div class="sw-trade-metrics" data-trade-metrics></div><div data-trade-rows></div><ul data-trade-notes></ul><h3>Pakua matokeo ya ndani</h3><div class="sw-trade-export-actions"><button type="button" data-export="pdf">PDF</button><button type="button" data-export="csv">CSV</button><button type="button" data-export="json">JSON</button><button type="button" data-export="txt">TXT</button><label>Fungua JSON<input type="file" accept="application/json,.json" data-import-json aria-label="Fungua export ya JSON"></label></div></section></section>
<aside><section class="sw-trade-card"><h2>Faragha</h2><p><strong>Ndani kwa chaguo-msingi.</strong> Sehemu, hesabu na faili hubaki kwenye kivinjari. Hakuna akaunti, upload au AI inayohitajika.</p><p><a href="/sw/ai/?tool=${page.id}">Fungua usaidizi wa AI wa hiari</a> tu ukiamua kutuma muktadha.</p></section><section class="sw-trade-card"><h2>Kikomo muhimu</h2><p class="sw-trade-warning">${page.warning}</p></section><section class="sw-trade-card"><h2>Vyanzo vya kukagua</h2><p>Rejesta ya msingi ilipitiwa Mei 2026. Thibitisha viwango vinavyobadilika siku ya muamala.</p><ul>${sources}</ul></section></aside></div></main><afro-footer></afro-footer>
${scripts}<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-trade-regional-parity.js"></script><script src="/assets/js/lib/sw-accessibility.js?v=c732ef57" defer></script><script src="/assets/js/lazy-analytics.js?v=249c230c" defer></script></body></html>\n`;
}

const changed = [];
for (const page of pages) {
  const target = path.join(ROOT, "sw", "zana", page.slug, "index.html");
  const output = html(page);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (normalizeBuildManagedHtml(current) === normalizeBuildManagedHtml(output)) continue;
  changed.push(path.relative(ROOT, target));
  if (!CHECK) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, output, "utf8");
  }
}
if (CHECK && changed.length) {
  console.error(`Swahili Trade regional output is stale (${changed.length}):\n${changed.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`${CHECK ? "Checked" : "Built"} ${pages.length} source-owned Swahili Trade regional page(s); ${changed.length} ${CHECK ? "stale" : "updated"}.`);
}

module.exports = { pages, html };
