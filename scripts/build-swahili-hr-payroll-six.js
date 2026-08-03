#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SCOPE = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-hr-payroll-six-manifest.json"), "utf8"));
const COUNTRIES = JSON.parse(fs.readFileSync(path.join(ROOT, "data/registry/countries.json"), "utf8"));
const CHECK = process.argv.includes("--check");
const NAVBAR_VERSION = crypto.createHash("md5").update(fs.readFileSync(path.join(ROOT, "assets/js/components/navbar.min.js"))).digest("hex").slice(0, 8);

function commonFields(toolId) {
  const currencySettings = toolId === "domestic-worker"
    ? { maxlength: 6, autocomplete: "off" }
    : toolId === "maternity-leave"
      ? { maxlength: 12 }
      : { required: true, maxlength: 8, autocomplete: "off" };
  if (toolId === "retrenchment-calculator") delete currencySettings.autocomplete;
  return [
    ["jurisdiction", "Nchi au mamlaka inayotumika", "text", "", { required: true, autocomplete: "off", placeholder: "Mfano: Kenya" }],
    ["currency", "Msimbo au alama ya sarafu", toolId === "domestic-worker" ? "input" : "text", "KES", currencySettings]
  ];
}

function sourceFields(toolId) {
  return [
    ["sourceLabel", "Chanzo rasmi au cha kitaalamu ulichokagua", toolId === "contractor-vs-employee" || toolId === "domestic-worker" ? "input" : "text", "", { required: true, autocomplete: toolId === "contractor-vs-employee" || toolId === "domestic-worker" ? "off" : undefined, placeholder: "Jina la sheria, mamlaka au mtaalamu" }],
    ["sourceDate", "Tarehe ya chanzo au uthibitishaji", "date", "", { required: true }]
  ];
}

const TOOLS = {
  "contractor-vs-employee": {
    title: "Linganisha gharama ya mkandarasi na mfanyakazi",
    shortTitle: "Mkandarasi au mfanyakazi",
    description: "Linganisha bajeti za mwezi na mwaka bila kuamua hadhi ya kisheria ya mtu anayefanya kazi.",
    image: "/assets/img/tools/contractor-vs-employee.webp",
    fields: [
      ["employeeBase", "Mshahara wa msingi kwa mwezi", "number", "1000", { required: true, min: 0, step: "any", inputmode: "decimal" }],
      ["employeeAddons", "Michango na marupurupu ya mwajiri", "number", "200", { min: 0, step: "any", inputmode: "decimal" }],
      ["employeeOther", "Gharama nyingine za mfanyakazi", "number", "50", { min: 0, step: "any", inputmode: "decimal" }],
      ["contractorQuote", "Ada ya mkandarasi kwa mwezi", "number", "1400", { required: true, min: 0, step: "any", inputmode: "decimal" }],
      ["contractorOther", "Gharama nyingine za mkandarasi", "number", "0", { min: 0, step: "any", inputmode: "decimal" }]
    ]
  },
  "domestic-worker": {
    title: "Panga gharama ya kumwajiri mfanyakazi wa nyumbani",
    shortTitle: "Mfanyakazi wa nyumbani",
    description: "Geuza malipo yaliyokubaliwa kuwa bajeti ya mwajiri ya mwezi na mwaka huku kila dhana ikionekana.",
    image: "/assets/img/tools/domestic-worker.webp",
    fields: [
      ["country", "Nchi ya mpango wa ajira", "select", "nigeria", {}, [["nigeria", "Nigeria"], ["kenya", "Kenya"], ["south-africa", "Afrika Kusini"], ["ghana", "Ghana"], ["egypt", "Misri"], ["ethiopia", "Ethiopia"], ["tanzania", "Tanzania"], ["uganda", "Uganda"], ["rwanda", "Rwanda"], ["cote-divoire", "Côte d’Ivoire"], ["cameroon", "Kameruni"], ["senegal", "Senegali"], ["morocco", "Moroko"], ["tunisia", "Tunisia"], ["angola", "Angola"]]],
      ["role", "Aina ya kazi", "select", "live-out-housekeeper", {}, [["live-out-housekeeper", "Mfanyakazi wa usafi asiyeishi nyumbani"], ["live-in-helper", "Msaidizi anayeishi nyumbani"], ["nanny", "Mlezi wa watoto"], ["elder-care", "Mlezi wa mzee"], ["cook", "Mpishi"], ["gardener", "Mtunza bustani"]]],
      ["basePay", "Malipo yaliyokubaliwa", "number", "1000", { required: true, min: 0, step: "any" }],
      ["payPeriod", "Kipindi cha malipo", "select", "monthly", {}, [["monthly", "Kwa mwezi"], ["weekly", "Kwa wiki"], ["daily", "Kwa siku"], ["hourly", "Kwa saa"]]],
      ["legalFloor", "Kiwango cha chini ulichothibitisha", "number", "0", { required: true, min: 0, step: "any" }],
      ["floorPeriod", "Kipindi cha kiwango cha chini", "select", "monthly", {}, [["monthly", "Kwa mwezi"], ["weekly", "Kwa wiki"], ["daily", "Kwa siku"], ["hourly", "Kwa saa"]]],
      ["hoursPerWeek", "Saa za kazi kwa wiki", "number", "40", { required: true, min: 1, max: 84, step: 0.5 }],
      ["daysPerWeek", "Siku za kazi kwa wiki", "number", "5", { required: true, min: 1, max: 7, step: 0.5 }],
      ["overtimeHours", "Saa za ziada kwa mwezi", "number", "0", { min: 0, max: 160, step: 0.5 }],
      ["overtimeMultiplier", "Kizidishi cha muda wa ziada", "number", "1.5", { min: 1, max: 3, step: 0.05 }],
      ["allowances", "Posho za fedha", "number", "100", { min: 0, step: "any" }],
      ["inKind", "Marupurupu yasiyo ya fedha kwa mwezi", "number", "50", { min: 0, step: "any" }],
      ["employerPct", "Michango ya mwajiri (%)", "number", "5", { min: 0, max: 40, step: 0.1 }],
      ["leavePct", "Akiba ya likizo (%)", "number", "4", { min: 0, max: 30, step: 0.1 }],
      ["adminCost", "Gharama za usimamizi kwa mwezi", "number", "20", { min: 0, step: "any" }],
      ["annualBonus", "Bonasi ya mwaka", "number", "600", { min: 0, step: "any" }],
      ["setupCost", "Gharama za kuanza", "number", "0", { min: 0, step: "any" }],
      ["retentionBuffer", "Akiba ya kubakiza mfanyakazi (%)", "number", "10", { min: 0, max: 50, step: 0.5 }],
      ["contractStatus", "Mkataba wa maandishi", "select", "no", {}, [["no", "Hapana"], ["draft", "Rasimu"], ["yes", "Ndiyo"]]],
      ["payRecord", "Payslip au risiti ya malipo", "select", "no", {}, [["no", "Hapana"], ["partial", "Sehemu"], ["yes", "Ndiyo"]]],
      ["restDays", "Mapumziko na sikukuu zimeandikwa", "select", "no", {}, [["no", "Hapana"], ["partial", "Sehemu"], ["yes", "Ndiyo"]]],
      ["notes", "Maelezo ya kupanga bila taarifa binafsi", "textarea", "", { placeholder: "Mfano: kazi, saa, siku ya malipo au dhana za kuthibitisha." }]
    ]
  },
  "employee-cost": {
    title: "Kokotoa jumla ya gharama ya mfanyakazi",
    shortTitle: "Gharama ya mfanyakazi",
    description: "Jumlisha mshahara, wajibu, marupurupu, posho na gharama za mara moja bila kuweka viwango vya kisheria kiotomatiki.",
    image: "/assets/img/tools/employee-cost.webp",
    fields: [
      ["salary", "Mshahara wa mwezi", "number", "1000", { required: true, min: 0, step: "any", inputmode: "decimal" }],
      ["obligations", "Wajibu wa mwajiri kwa mwezi", "number", "100", { min: 0, step: "any", inputmode: "decimal" }],
      ["benefits", "Marupurupu ya mwezi", "number", "50", { min: 0, step: "any", inputmode: "decimal" }],
      ["allowances", "Posho za mwezi", "number", "100", { min: 0, step: "any", inputmode: "decimal" }],
      ["other", "Gharama nyingine za kawaida", "number", "50", { min: 0, step: "any", inputmode: "decimal" }],
      ["oneOff", "Gharama za mara moja", "number", "0", { min: 0, step: "any", inputmode: "decimal" }],
      ["allocationMonths", "Miezi ya kugawa gharama za mara moja", "number", "12", { required: true, min: 1, max: 60, step: 1, inputmode: "numeric" }]
    ]
  },
  "gratuity-calculator": {
    title: "Kadiria kiinua mgongo",
    shortTitle: "Kiinua mgongo",
    description: "Tumia kanuni uliyothibitisha na utenganishe kiasi cha msingi, nyongeza na makato.",
    image: "/assets/img/tools/gratuity-calculator.webp",
    fields: [
      ["monthlyPay", "Malipo rejea ya mwezi", "number", "3000", { required: true, min: 0, step: "any", inputmode: "decimal" }],
      ["years", "Miaka ya huduma", "number", "5", { required: true, min: 0, step: 1, inputmode: "numeric" }],
      ["months", "Miezi ya ziada ya huduma", "number", "6", { min: 0, max: 11, step: 1, inputmode: "numeric" }],
      ["daysPerYear", "Siku za malipo kwa kila mwaka wa huduma", "number", "15", { required: true, min: 0, step: "any", inputmode: "decimal" }],
      ["divisor", "Kigawanyo cha mwezi kwa malipo ya siku", "number", "30", { required: true, min: 0, step: "any", inputmode: "decimal" }],
      ["additions", "Nyongeza", "number", "500", { min: 0, step: "any", inputmode: "decimal" }],
      ["deductions", "Makato", "number", "250", { min: 0, step: "any", inputmode: "decimal" }]
    ]
  },
  "maternity-leave": {
    title: "Panga likizo ya uzazi au ya mzazi",
    shortTitle: "Likizo ya uzazi",
    description: "Linganisha muda wa rejea, ombi na sera ya mwajiri kwa viwango unavyoingiza mwenyewe.",
    image: "/assets/img/tools/maternity-leave.webp",
    fields: [
      ["country", "Nchi ya likizo", "country-select", "/tools/maternity-leave/nigeria/", { required: true }],
      ["leaveType", "Aina ya likizo", "select", "maternity", {}, [["maternity", "Likizo ya aliyejifungua"], ["paternity", "Likizo ya baba au mwenza"], ["both", "Linganisha zote mbili"]]],
      ["monthlySalary", "Mshahara wa mwezi", "number", "3043.75", { min: 0, step: 0.01, inputmode: "decimal" }],
      ["startDate", "Tarehe ya kuanza likizo", "date", "2026-08-01", {}],
      ["officialDays", "Muda wa rejea uliothibitisha (siku)", "number", "90", { min: 1, max: 365, step: 1, inputmode: "numeric" }],
      ["requestedDays", "Muda ulioombwa (siku)", "number", "100", { min: 1, max: 365, step: 1, inputmode: "numeric" }],
      ["officialRate", "Asilimia ya malipo ya rejea", "number", "80", { min: 0, max: 100, step: "any", inputmode: "decimal" }],
      ["companyDays", "Muda wa sera ya mwajiri (siku)", "number", "112", { min: 0, max: 365, step: 1, inputmode: "numeric" }],
      ["companyRate", "Asilimia ya malipo ya mwajiri", "number", "100", { min: 0, max: 100, step: "any", inputmode: "decimal" }],
      ["compareCountry", "Nchi ya kulinganisha", "country-select", "/tools/maternity-leave/nigeria/", {}],
      ["leaveNotes", "Dhana na maelezo ya HR bila taarifa binafsi", "textarea", "", { rows: 3, placeholder: "Mfano: muda wa huduma au malipo ya ziada ya mwajiri ya kuthibitisha." }]
    ]
  },
  "retrenchment-calculator": {
    title: "Kadiria malipo ya kuachishwa kazi",
    shortTitle: "Malipo ya kuachishwa kazi",
    description: "Jenga makadirio yanayokaguliwa kutoka muda wa huduma, notisi, likizo, kiasi kingine na makato halali.",
    image: "/assets/img/tools/retrenchment-calculator.webp",
    fields: [
      ["monthlyPay", "Malipo rejea ya mwezi", "number", "7800", { required: true, min: 0, step: "any" }],
      ["years", "Miaka ya huduma", "number", "7", { required: true, min: 0, step: 1 }],
      ["months", "Miezi ya ziada ya huduma", "number", "4", { min: 0, max: 11, step: 1 }],
      ["weeksPerYear", "Wiki za malipo kwa kila mwaka wa huduma", "number", "1", { required: true, min: 0, step: "any" }],
      ["noticeMonths", "Miezi ya notisi inayolipwa", "number", "1", { min: 0, step: "any" }],
      ["leaveDays", "Siku za likizo ambazo hazikutumika", "number", "10", { min: 0, step: "any" }],
      ["divisor", "Kigawanyo cha mwezi kwa likizo", "number", "39", { required: true, min: 0, step: "any" }],
      ["other", "Kiasi kingine", "number", "1000", { min: 0, step: "any" }],
      ["deductions", "Makato", "number", "500", { min: 0, step: "any" }]
    ]
  }
};

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function attrs(settings) {
  const keys = ["min", "max", "step", "maxlength", "inputmode", "autocomplete", "rows"];
  return keys.filter((key) => Object.prototype.hasOwnProperty.call(settings, key) && settings[key] !== undefined).map((key) => ` ${key}="${escapeHtml(settings[key])}"`).join("") + (settings.required ? " required" : "");
}

function countryOptions() {
  return COUNTRIES.map((country) => [`/tools/maternity-leave/${country.routeSlug === "congo-brazzaville" ? "republic-of-congo" : country.routeSlug}/`, country.displayNames.sw || country.displayNames.en]);
}

function fieldHtml(field) {
  const [name, label, type, value, settings = {}, suppliedOptions] = field;
  const id = "sw-hr-" + name.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
  const placeholder = settings.placeholder ? ` placeholder="${escapeHtml(settings.placeholder)}"` : "";
  if (type === "select" || type === "country-select") {
    const options = type === "country-select" ? countryOptions() : suppliedOptions;
    return `<div class="sw-hr-field"><label for="${id}">${escapeHtml(label)}</label><select id="${id}" name="${name}"${attrs(settings)}>${options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${optionValue === value ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></div>`;
  }
  if (type === "textarea") return `<div class="sw-hr-field sw-hr-field-wide"><label for="${id}">${escapeHtml(label)}</label><textarea id="${id}" name="${name}"${attrs(settings)}${placeholder}>${escapeHtml(value)}</textarea></div>`;
  return `<div class="sw-hr-field"><label for="${id}">${escapeHtml(label)}</label><input id="${id}" name="${name}"${type === "input" ? "" : ` type="${type}"`} value="${escapeHtml(value)}"${attrs(settings)}${placeholder}></div>`;
}

function pageHtml(row) {
  const tool = TOOLS[row.englishId];
  const config = JSON.stringify({ id: row.englishId, route: row.swahiliRoute, title: tool.title }).replace(/</g, "\\u003c");
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: tool.title, description: tool.description, url: "https://afrotools.com" + row.swahiliRoute, image: "https://afrotools.com" + tool.image, applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: "sw", isBasedOn: "https://afrotools.com" + row.englishRoute, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, featureList: ["Hesabu ya ndani ya kivinjari", "Chanzo na tarehe vinahitajika", "Faili za TXT, JSON na PDF", "Kufungua tena JSON ndani ya kivinjari"] }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="sw" data-theme-choice="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="sw-hr-payroll-six:${row.englishId}">
  <meta name="afrotools-source-owner" content="scripts/build-swahili-hr-payroll-six.js">
  <meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-hr-payroll-six.js">
  <title>${escapeHtml(tool.title)} — AfroTools</title>
  <meta name="description" content="${escapeHtml(tool.description)} Hesabu ya ndani, chanzo chenye tarehe na faili binafsi.">
  <link rel="canonical" href="https://afrotools.com${row.swahiliRoute}">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com${row.swahiliRoute}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com${row.englishRoute}">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com${row.frenchRoute}">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com${row.englishRoute}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sw_KE">
  <meta property="og:title" content="${escapeHtml(tool.title)} — AfroTools">
  <meta property="og:description" content="${escapeHtml(tool.description)}">
  <meta property="og:url" content="https://afrotools.com${row.swahiliRoute}">
  <meta property="og:image" content="https://afrotools.com${tool.image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://afrotools.com${tool.image}">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/sw-hr-payroll-six.css">
  <script type="application/ld+json">${schema}</script>
  <script>window.AfroLocalOnly = true; window.AfroDisableAssistant = true;</script>
  <script src="/assets/js/components/tool-registry.js"></script>
  <script src="/assets/js/components/navbar.min.js?v=${NAVBAR_VERSION}" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/vendor/jspdf/jspdf.umd.min.js" defer></script>
  <script src="/assets/js/engines/sw-hr-payroll-six.js" defer></script>
  <script src="/assets/js/pages/sw-hr-payroll-six.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script>
</head>
<body>
  <!-- Generated by scripts/build-swahili-hr-payroll-six.js. -->
  <a class="skip-link" href="#maudhui">Ruka hadi maudhui</a>
  <afro-navbar></afro-navbar>
  <main id="maudhui" class="sw-hr-shell">
    <nav class="sw-hr-breadcrumb" aria-label="Mfuatano wa ukurasa"><a href="/sw/">Mwanzo</a> · <a href="/sw/mshahara-na-kodi/payroll/">Mishahara na HR</a> · <span aria-current="page">${escapeHtml(tool.shortTitle)}</span></nav>
    <header class="sw-hr-hero"><div><h1>${escapeHtml(tool.title)}</h1><p>${escapeHtml(tool.description)}</p><div class="sw-hr-badges" aria-label="Sifa"><span class="sw-hr-badge">Hesabu ya ndani</span><span class="sw-hr-badge">Hakuna taarifa binafsi</span><span class="sw-hr-badge">Chanzo chenye tarehe</span></div></div><img src="${tool.image}" width="640" height="360" alt="" loading="eager"></header>
    <section class="sw-hr-notice" data-ai-consent-notice data-consent-mode="browser_local_only" data-tool-id="${row.englishId}"><h2>Faragha kwa chaguo-msingi, bila AI</h2><p>Kiasi na dhana zako hubaki kwenye kivinjari hiki. Ukurasa hautumi taarifa kwa AI, seva au akaunti. Usaidizi wowote wa AI wa baadaye utahitaji idhini ya wazi na hesabu hii ya ndani itaendelea kupatikana.</p></section>
    <section class="sw-hr-source" aria-labelledby="source-guide"><h2 id="source-guide">Kabla ya kukokotoa: thibitisha kanuni inayotumika</h2><p>Zana haitoi kiwango cha kisheria. Kagua mamlaka ya kazi, maandishi rasmi au mtaalamu wa mamlaka yako. <a href="https://natlex.ilo.org/" rel="noopener noreferrer">NATLEX ya ILO</a> inaweza kusaidia kupata maandishi, lakini haithibitishi kuwa yanatumika kwa hali yako. Mbinu imekaguliwa tarehe ${SCOPE.createdAt}.</p></section>
    <div class="sw-hr-workspace">
      <section class="sw-hr-card" aria-labelledby="form-title"><h2 id="form-title">Dhana za makadirio</h2><p>Tumia kiasi cha jumla pekee. Usiandike jina, anwani, namba ya kitambulisho au taarifa nyingine binafsi.</p><div id="sw-hr-errors" class="sw-hr-errors" role="alert" tabindex="-1" hidden></div><form id="sw-hr-form" novalidate><div class="sw-hr-grid">${[...commonFields(row.englishId), ...tool.fields, ...sourceFields(row.englishId)].map(fieldHtml).join("")}</div><div class="sw-hr-actions"><button class="btn btn-primary" type="submit">Kokotoa makadirio</button><button class="btn btn-secondary" id="sw-hr-reset" type="button">Weka upya</button></div></form><p id="sw-hr-status" class="sw-hr-status" role="status" aria-live="polite">Hakuna taarifa iliyohifadhiwa.</p></section>
      <section id="sw-hr-result" class="sw-hr-card sw-hr-result" tabindex="-1" aria-labelledby="result-title" hidden><h2 id="result-title">Makadirio ya kupanga</h2><table><tbody id="sw-hr-result-body"></tbody></table><div id="sw-hr-workflow" class="sw-hr-workflow" hidden></div><dl class="sw-hr-evidence"><dt>Chanzo kilichotumika</dt><dd id="sw-hr-source-used"></dd><dt>Upya wa chanzo</dt><dd id="sw-hr-freshness"></dd><dt>Kiwango cha uhakika</dt><dd id="sw-hr-confidence"></dd></dl><p><strong>Kikomo:</strong> haya ni makadirio ya hesabu yanayotumia dhana zako. Si hesabu rasmi, uwasilishaji rasmi, uamuzi wa hadhi, wala ushauri wa kisheria, kodi au ajira.</p><div class="sw-hr-actions" aria-label="Faili za matokeo ya sasa"><button class="btn btn-secondary" type="button" data-sw-export="copy" disabled>Nakili</button><button class="btn btn-secondary" type="button" data-sw-export="txt" disabled>Pakua TXT</button><button class="btn btn-secondary" type="button" data-sw-export="json" disabled>Hifadhi JSON</button><button class="btn btn-secondary" type="button" data-sw-export="pdf" disabled>Pakua PDF</button><button class="btn btn-secondary" id="sw-hr-open" type="button">Fungua JSON tena</button><input id="sw-hr-import" type="file" accept="application/json,.json" hidden></div></section>
    </div>
    <section class="sw-hr-source" aria-labelledby="method-title"><h2 id="method-title">Mbinu, upya wa chanzo na uhakika</h2><p>Fomula inahifadhi mkataba wa hesabu wa ukurasa wa Kiingereza. Uhakika hauzidi “wastani”: unaonyesha umri wa chanzo ulichoingiza, si uhalali wake. Chanzo cha zaidi ya siku 90 huwekwa wazi kuwa kimepitwa na wakati.</p></section>
  </main>
  <afro-footer></afro-footer>
  <script id="sw-hr-config" type="application/json">${config}</script>
</body>
</html>
`;
}

function fileFor(row) { return path.join(ROOT, row.swahiliFile); }
function reciprocalPresent(row) {
  const english = fs.readFileSync(path.join(ROOT, row.englishRoute.replace(/^\//, ""), "index.html"), "utf8");
  return english.includes(`hreflang="sw" href="https://afrotools.com${row.swahiliRoute}"`);
}

let failed = false;
for (const row of SCOPE.rows) {
  if (!TOOLS[row.englishId]) throw new Error("Missing Swahili owner config for " + row.englishId);
  const target = fileFor(row);
  const content = pageHtml(row);
  if (CHECK) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) { console.error("OUT OF DATE " + row.swahiliFile); failed = true; }
    if (!reciprocalPresent(row)) { console.error("MISSING RECIPROCAL SW HREFLANG " + row.englishRoute); failed = true; }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
    console.log("WROTE " + row.swahiliFile);
  }
}

if (failed) process.exitCode = 1;
else console.log(`Swahili HR & Payroll native parity ${CHECK ? "verified" : "built"}: ${SCOPE.rows.length}/6 apps.`);
