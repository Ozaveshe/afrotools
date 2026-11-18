#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const apps = [
  ["hs-code-lookup","utafutaji-msimbo-hs","/tools/hs-code-lookup/","Utafutaji wa msimbo HS","Tafuta bidhaa kwa jina au msimbo, kisha linganisha viwango elekezi vya nchi bila kudai uamuzi rasmi wa forodha.",["/data/trade/hs-codes-database.js","/data/trade/country-duty-rates.js","/engines/hs-lookup-engine.js"],{query:"coffee",countries:["KE","TZ","UG"]},"data/trade/hs-codes-database.js + data/trade/country-duty-rates.js"],
  ["afcfta-tracker","ufuatiliaji-ushuru-afcfta","/tools/afcfta-tracker/","Kifuatiliaji cha ushuru wa AfCFTA","Kagua ratiba ya jumla ya nchi inayoagiza na utafute mstari wa ushuru wa bidhaa katika kitabu rasmi cha AfCFTA.",["/data/trade/afcfta-schedule.js","/data/trade/hs-codes-database.js"],{origin:"KE",destination:"GH",hsCode:"0901",year:2026},"data/trade/afcfta-schedule.js + data/trade/hs-codes-database.js"],
  ["shipping-estimator","makisio-ya-usafirishaji-wa-biashara","/tools/shipping-estimator/","Makisio ya usafirishaji wa biashara","Linganisha makisio ya bahari na anga kwa njia, kontena, ujazo na uzito uleule wa injini ya Kiingereza.",["/data/trade/shipping-routes.js","/engines/shipping-engine.js"],{originCode:"CNSHA",destCode:"KEMBA",containerType:"20ft",cbm:5,weightKg:100},"data/trade/shipping-routes.js"],
  ["fx-import-impact","athari-forex-kuagiza","/tools/fx-import-impact/","Athari ya FX kwa gharama ya kuagiza","Pima gharama ya sarafu ya ndani, hali za mabadiliko na kiwango cha kuvunja hasara kwa data iliyowekwa tarehe.",["/data/trade/fx-history.js","/engines/fx-impact-engine.js"],{usdAmount:10000,countryCode:"KE",scenarioPercent:10,maxSellingPrice:2000000,otherCosts:100000},"data/forex/latest.json + data/trade/fx-history.js"],
  ["lc-calculator","ada-lc","/tools/lc-calculator/","Kikokotoo cha ada za LC","Kokotoa ada za Letter of Credit, margin deposit, tenor na mahitaji ya fedha taslimu.",["/engines/lc-fee-engine.js"],{lcValue:50000,countryCode:"KE",lcType:"sight",confirmed:true,amendments:0,includeMargin:true},"engines/src/lc-fee-engine.js"],
  ["export-docs-trade","orodha-nyaraka-usafirishaji","/tools/export-docs/","Orodha ya nyaraka za kuuza nje","Panga nyaraka za kuuza nje kulingana na nchi, aina ya bidhaa na soko la kwenda.",["/data/trade/export-docs-data.js","/engines/export-docs-engine.js"],{countryCode:"KE",productCategory:"coffee_tea",destination:"EAC"},"data/trade/export-docs-data.js"],
  ["coo-generator","cheti-asili","/tools/coo-generator/","Rasimu ya cheti cha asili","Tengeneza rasimu ya COO na ukague kigezo cha asili; zana haitoi wala kuwasilisha cheti rasmi.",["/data/trade/coo-templates.js","/engines/coo-engine.js"],{templateId:"afcfta",fields:{},originCheck:{}},"data/trade/coo-templates.js"],
  ["demurrage-calculator","gharama-za-demurrage","/tools/demurrage-calculator/","Kikokotoo cha demurrage","Kokotoa siku za bure, viwango vya hatua, storage na gharama nyingine kwa bandari iliyochaguliwa.",["/data/trade/port-demurrage.js","/engines/demurrage-engine.js"],{portCode:"NGAPP",containerType:"20ft",daysAtPort:12,fxRateLocalPerUsd:1},"data/trade/port-demurrage.js"],
  ["incoterms-calculator","kikokotoo-incoterms","/tools/incoterms-calculator/","Kikokotoo cha Incoterms","Gawa gharama kati ya muuzaji na mnunuzi kwa matrix ileile ya Incoterms 2020.",["/data/trade/incoterms-data.js","/engines/incoterms-engine.js"],{termCode:"CIF",costs:{packaging:500,loading_origin:300,export_customs:200,inland_origin:1500,loading_vessel:500,freight:8000,insurance:500,unloading_dest:500,import_customs:1000,duties_taxes:15000,inland_dest:3000,delivery:1000}},"data/trade/incoterms-data.js"],
  ["trade-finance-comparator","kilinganisha-fedha-za-biashara","/tools/trade-finance-comparator/","Kilinganisha fedha za biashara","Linganisha LC, T/T, CAD, open account na SBLC kwa thamani na nchi ileile.",["/data/trade/trade-finance-data.js","/engines/trade-finance-engine.js"],{instrumentId:"lc_sight",tradeValue:50000,countryCode:"KE",tenorDays:90,confirmed:true},"data/trade/trade-finance-data.js"],
  ["payment-comparator","kilinganisha-ada-za-malipo-b2b","/tools/payment-comparator/","Kilinganisha ada za malipo ya B2B","Linganisha ada elekezi za watoa huduma na hali ya malipo ya mara kwa mara.",["/data/trade/b2b-payments-data.js","/engines/payment-comparator-engine.js"],{amountUsd:5000,frequency:"monthly",providerId:"papss"},"data/trade/b2b-payments-data.js"]
].map(([id,slug,en,name,description,scripts,input,source]) => ({id,slug,en,name,description,scripts,input,source}));

function esc(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function alternates(app){const file=path.join(ROOT,app.en.replace(/^\//,""),"index.html");if(!fs.existsSync(file))return[{lang:"en",route:app.en}];const html=fs.readFileSync(file,"utf8"),rows=[];for(const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="https:\/\/afrotools\.com([^\"]+)">/g)){if(m[1]!=="sw")rows.push({lang:m[1],route:m[2]});}if(!rows.some(row=>row.lang==="en"))rows.unshift({lang:"en",route:app.en});return rows;}
const forms = {
  "payment-comparator": { script: "sw-b2b-fees-form", title: "Makadirio ya ada za malipo" },
  "lc-calculator": { script: "sw-trade-finance-form", title: "Makadirio ya ada na amana ya LC" },
  "trade-finance-comparator": { script: "sw-trade-finance-form", title: "Makadirio ya fedha za biashara" },
  "afcfta-tracker": { script: "sw-afcfta-schedule", title: "Ratiba ya nchi inayoagiza", action: "Kagua ratiba" },
  "coo-generator": { script: "sw-trade-documents", title: "Rasimu ya cheti cha asili", action: "Tengeneza rasimu" },
  "export-docs-trade": { script: "sw-trade-documents", title: "Nyaraka za kukagua", action: "Onyesha orodha" },
  "demurrage-calculator": { script: "sw-demurrage-form", title: "Makadirio ya gharama" },
  "fx-import-impact": { script: "sw-import-fx-form", title: "Gharama ya kuagiza kwa kiwango cha kubadilisha fedha" },
  "shipping-estimator": { script: "sw-shipping-form", title: "Makadirio ya gharama na muda wa safari" },
  "hs-code-lookup": { script: "sw-hs-lookup-form", title: "Rejea za sura ya HS" }
};

const importControl = '<label class="swa-file">Fungua JSON<input type="file" accept="application/json,.json" data-import></label>';

function scenarioFields(app) {
  if (app.id === "payment-comparator") return `<p>Weka kiasi cha malipo moja, ratiba na mtoa huduma. Wastani wa mwezi ni jumla ya mwaka iliyogawanywa kwa 12.</p>
<form data-trade-form data-credit-form data-b2b-fees>
<label>Kiasi kwa kila malipo (USD)<input name="amountUsd" type="number" min="0.01" step="0.01" required></label>
<label>Mtoa huduma<select name="providerId" required></select></label>
<label>Ratiba ya malipo<select name="frequency" required>
<option value="monthly">Mara moja kwa mwezi (12 kwa mwaka)</option><option value="four_per_month">Mara nne kwa mwezi (48 kwa mwaka)</option>
<option value="weekly_52">Mara moja kwa wiki (52 kwa mwaka)</option><option value="operating_days_20">Siku 20 za kazi kwa mwezi (240 kwa mwaka)</option></select></label>`;

  if (app.id === "lc-calculator" || app.id === "trade-finance-comparator") {
    const lc = app.id === "lc-calculator";
    return `<p>${lc ? "Weka thamani ya LC ili kuona ada, amana na fedha zinazohitajika." : "Linganisha ada za njia sita za malipo kwa thamani na nchi utakazochagua. Muda unahusu LC ya malipo yaliyoahirishwa; uthibitisho unahusu LC."}</p>
<form data-trade-form data-credit-form>
<label>Thamani ya biashara (USD)<input type="number" min="0.01" step="0.01" required name="${lc ? "lcValue" : "tradeValue"}"></label>
<label>Nchi ya benki<select name="countryCode" required></select></label>
<label>${lc ? "Aina ya LC" : "Njia ya malipo ya kuchambua"}<select name="${lc ? "lcType" : "instrumentId"}" required></select></label>
${lc ? '<label>Idadi ya marekebisho<input type="number" min="0" step="1" name="amendments" required></label>' : '<label>Muda wa LC iliyoahirishwa (siku 30–180)<input type="number" min="30" max="180" step="1" name="tenorDays" required></label>'}
<label><input type="checkbox" name="confirmed"> Jumuisha uthibitisho wa benki kwa LC</label>
${lc ? '<label><input type="checkbox" name="includeMargin"> Jumuisha amana inayohitajika</label>' : ''}`;
  }
  if (app.id === "fx-import-impact") return `<p>Weka kiasi unachomlipa msambazaji kwa USD. Linganisha kiwango cha rejea na nukuu ya benki au msambazaji wako. Ongezeko la kiwango humaanisha unahitaji fedha zaidi za nchi kwa dola moja.</p>
<form data-trade-form data-fx-form>
<label>Nchi ya kuagiza<select required name="countryCode"></select></label>
<label>Malipo kwa msambazaji (USD)<input name="usdAmount" type="number" min="0" step="any" required></label>
<label>Kiwango cha kubadilisha fedha (<span data-currency></span> kwa USD 1)<input name="fxRate" type="number" min="0" step="any" required></label>
<p data-rate-basis aria-live="polite"></p><button type="button" data-use-rate>Tumia kiwango cha rejea</button>
<label>Mabadiliko ya kiwango unayotaka kujaribu<select name="scenarioPercent" required></select></label>
<label>Bei ya kuuza mzigo wote (<span data-currency></span>, si lazima)<input name="maxSellingPrice" type="number" min="0" step="any"></label>
<label>Gharama nyingine za mzigo (<span data-currency></span>, si lazima)<input name="otherCosts" type="number" min="0" step="any"></label>`;
  if (app.id === "shipping-estimator") return `<p>Chagua bandari na aina ya mzigo. Kwa kontena zima, bei ya baharini ni ya kontena moja. Kwa mzigo wa pamoja (LCL), bei inategemea ujazo. Bei ya anga, ikipatikana, inategemea uzito.</p>
<form data-trade-form data-shipping-form>
<label>Bandari ya kuondokea<select name="originCode" required></select></label>
<label>Bandari ya kuwasili<select name="destCode" required></select></label>
<label>Aina ya mzigo wa baharini<select name="containerType" required></select></label>
<label>Ujazo wa mzigo wa pamoja (m³)<input type="number" name="cbm" min="0" step="any" required></label>
<label>Uzito wa mzigo kwa makisio ya anga (kg)<input type="number" name="weightKg" min="0" step="any" required></label>`;
  if (app.id === "afcfta-tracker") return require("../assets/js/pages/sw-afcfta-schedule").formMarkup(require("../data/trade/afcfta-schedule").AFCFTA_DATA);
  if (app.id === "export-docs-trade" || app.id === "coo-generator") return require("../assets/js/pages/sw-trade-documents").formMarkup(app);
  if (app.id === "hs-code-lookup") return `<p>Tafuta kwa jina la bidhaa au msimbo wa HS. Chagua aina halisi ya bidhaa unayotaka kulinganisha.</p>
<form data-trade-form data-hs-form>
<label>Bidhaa au msimbo wa HS<input type="search" name="query" placeholder="Mfano: kahawa au 0901" required></label>
<p data-match-count role="status"></p>
<label>Bidhaa inayolingana<select name="code" required></select></label>
<details><summary>Nchi za kulinganisha</summary><fieldset data-countries><legend>Chagua nchi moja au zaidi</legend></fieldset></details>`;
  if (app.id !== "demurrage-calculator") return `<p>Badilisha thamani za JSON bila kubadili majina ya sehemu. Majina haya yanaingia moja kwa moja kwenye injini ya ukurasa wa Kiingereza.</p><form data-trade-form><label for="scenario">Ingizo la hali (JSON)</label><textarea id="scenario" name="scenario" rows="18" spellcheck="false">${esc(JSON.stringify(app.input,null,2))}</textarea>`;
  return `<p>Chagua bandari, ukubwa wa kontena na siku zote bandarini, pamoja na siku zisizotozwa.</p>
<form data-trade-form data-demurrage-form>
<label>Bandari<select name="portCode" required></select></label>
<label>Ukubwa wa kontena<select name="containerType" required></select></label>
<label>Siku bandarini<input type="number" name="daysAtPort" min="1" step="1" required></label>
<label hidden><span data-fx-label></span><input type="number" name="fxRateLocalPerUsd" min="0" step="any" required></label>`;
}
function render(app){const route=`/sw/zana/${app.slug}/`,canonical=`https://afrotools.com${route}`,alts=alternates(app).map(row=>`<link rel="alternate" hreflang="${row.lang}" href="https://afrotools.com${row.route}">`).join("");return `<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(app.name)} | AfroTools</title><meta name="description" content="${esc(app.description)}"><meta name="afrotools-source-owner" content="scripts/build-sw-trade-core-parity.js"><link rel="canonical" href="${canonical}">${alts}<link rel="alternate" hreflang="sw" href="${canonical}"><meta property="og:title" content="${esc(app.name)}"><meta property="og:description" content="${esc(app.description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="sw_TZ"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.id}.webp"><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:app.name,inLanguage:"sw",url:canonical,applicationCategory:"BusinessApplication",isAccessibleForFree:true})}</script><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/sw-agriculture-assigned-parity.css"><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>${app.id === "demurrage-calculator" ? '<style>[data-demurrage-form] label{display:block;margin:.8rem 0}[data-demurrage-form] label[hidden]{display:none}[data-demurrage-form] :is(select,input){display:block;box-sizing:border-box;width:100%;max-width:100%;min-height:44px;padding:.5rem;font:inherit;color:inherit;background:var(--color-bg-card,Canvas);border:1px solid #89968f;border-radius:.4rem}</style>' : ""}${app.id === "hs-code-lookup" ? '<style>[data-hs-form] label{display:block;margin:.7rem 0}[data-hs-form] :is(select,input[type=search]){width:100%;min-height:44px;font:inherit;color:inherit;background:Canvas;border:1px solid #89968f;border-radius:.4rem}[data-hs-form] summary{padding:.65rem 0;cursor:pointer}[data-hs-form] fieldset{min-width:0}</style>' : ""}${(forms[app.id]?.script === "sw-trade-documents" || app.id === "afcfta-tracker") ? '<link rel="stylesheet" href="/assets/css/sw-trade-documents.css">' : ""}${app.id === "shipping-estimator" ? '<style>[data-shipping-form] label{display:block;margin:.75rem 0}[data-shipping-form] label[hidden]{display:none}[data-shipping-form] :is(select,input){box-sizing:border-box;width:100%;min-height:44px;padding:.5rem;font:inherit;color:inherit;background:Canvas;border:1px solid #89968f;border-radius:.4rem}</style>' : ""}${(forms[app.id]?.script === "sw-trade-finance-form" || app.id === "payment-comparator") ? '<style>[data-credit-form] label{display:block;margin:.8rem 0}[data-credit-form] :is(select,input[type=number]){display:block;min-height:44px;width:100%;max-width:100%;box-sizing:border-box;padding:.5rem;font:inherit;color:CanvasText;background:Canvas;border:1px solid #89968f;border-radius:.4rem}</style>' : ""}${app.id === "fx-import-impact" ? '<style>[data-fx-form] label{display:block;margin:.75rem 0}[data-fx-form] :is(select,input){box-sizing:border-box;width:100%;min-height:44px;padding:.5rem;font:inherit;color:inherit;background:Canvas;border:1px solid #89968f;border-radius:.4rem}</style>' : ""}</head><body><a class="skip-link" href="#main-content">Ruka hadi maudhui</a><afro-navbar active="tools"></afro-navbar><main id="main-content" class="swa-shell" data-sw-trade-core data-tool="${app.id}"><nav aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a> / <a href="/sw/biashara-ya-nje/">Biashara ya nje</a> / ${esc(app.name)}</nav><header><p class="swa-kicker">Biashara ya nje · injini ya pamoja</p><h1>${esc(app.name)}</h1><p>${esc(app.description)}</p></header><div class="swa-grid"><section class="swa-card"><h2>Hali ya kupanga</h2>${scenarioFields(app)}<div class="swa-actions"><button type="submit">${forms[app.id]?.action || "Kokotoa ndani"}</button><button type="reset">Weka upya</button></div><p data-status role="status" aria-live="polite">Hakuna taarifa iliyotumwa.</p></form>${forms[app.id] ? importControl : ""}<section data-result hidden tabindex="-1">${forms[app.id] ? `<h2>${forms[app.id].title}</h2><dl data-output></dl>` : '<h2>Matokeo ya injini</h2><pre data-output></pre>'}<div class="swa-actions"><button type="button" data-export="pdf">PDF</button><button type="button" data-export="csv">CSV</button><button type="button" data-export="json">JSON</button><button type="button" data-export="txt">TXT</button>${forms[app.id] ? "" : importControl}</div></section></section><aside class="swa-card"><h2>Chanzo, ukomo na faragha</h2><dl><dt>Injini</dt><dd>Injini au dataset ileile inayomiliki hesabu ya ukurasa wa Kiingereza.</dd><dt>Chanzo cha ndani</dt><dd>${esc(app.source)}</dd><dt>Uhakika</dt><dd>Makadirio ya kupanga. Data za HS, ushuru, FX, usafirishaji, bandari, benki na watoa malipo zinaweza kuwa zimepitwa na wakati; thibitisha nukuu na mamlaka husika.</dd><dt>Faragha</dt><dd>Hesabu na export hufanyika kwenye kivinjari; hakuna fetch, AI, akaunti au upload.</dd></dl><p><strong>Si uamuzi rasmi wala ofa.</strong> Usitumie matokeo kama customs ruling, cheti, bei ya sasa au masharti ya benki.</p></aside></div></main><afro-footer></afro-footer>${app.scripts.map(src=>`<script src="${src}"></script>`).join("")}<script>window.__SW_TRADE_CORE_CONFIG__=${JSON.stringify(app)};</script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>${forms[app.id] ? `<script src="/assets/js/pages/${forms[app.id].script}.js"></script>` : ""}<script src="/assets/js/pages/sw-trade-core-parity.js"></script></body></html>\n`;}

function main() {
  const check = process.argv.includes("--check");
  const changed=[];for(const app of apps){const file=path.join(ROOT,"sw","zana",app.slug,"index.html"),next=render(app),current=fs.existsSync(file)?fs.readFileSync(file,"utf8"):"";if(current!==next){changed.push(path.relative(ROOT,file));if(!check){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,next);}}}if(check&&changed.length){console.error(`Swahili Trade core output is stale (${changed.length}):\n${changed.join("\n")}`);process.exitCode=1;}else console.log(`${check?"Checked":"Built"} ${apps.length} core Trade apps; ${changed.length} ${check?"stale":"updated"}.`);
}

if (require.main === module) main();
module.exports={apps,render};
