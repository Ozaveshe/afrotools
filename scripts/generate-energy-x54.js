#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const COUNTRIES = [
  {code:"NG",name:"Nigeria",slug:"nigeria",flag:"🇳🇬",currency:"NGN"},
  {code:"KE",name:"Kenya",slug:"kenya",flag:"🇰🇪",currency:"KES"},
  {code:"ZA",name:"South Africa",slug:"south-africa",flag:"🇿🇦",currency:"ZAR"},
  {code:"GH",name:"Ghana",slug:"ghana",flag:"🇬🇭",currency:"GHS"},
  {code:"EG",name:"Egypt",slug:"egypt",flag:"🇪🇬",currency:"EGP"},
  {code:"ET",name:"Ethiopia",slug:"ethiopia",flag:"🇪🇹",currency:"ETB"},
  {code:"TZ",name:"Tanzania",slug:"tanzania",flag:"🇹🇿",currency:"TZS"},
  {code:"UG",name:"Uganda",slug:"uganda",flag:"🇺🇬",currency:"UGX"},
  {code:"RW",name:"Rwanda",slug:"rwanda",flag:"🇷🇼",currency:"RWF"},
  {code:"CI",name:"Côte d'Ivoire",slug:"cote-divoire",flag:"🇨🇮",currency:"XOF"},
  {code:"CM",name:"Cameroon",slug:"cameroon",flag:"🇨🇲",currency:"XAF"},
  {code:"SN",name:"Senegal",slug:"senegal",flag:"🇸🇳",currency:"XOF"},
  {code:"MA",name:"Morocco",slug:"morocco",flag:"🇲🇦",currency:"MAD"},
  {code:"TN",name:"Tunisia",slug:"tunisia",flag:"🇹🇳",currency:"TND"},
  {code:"AO",name:"Angola",slug:"angola",flag:"🇦🇴",currency:"AOA"},
  {code:"ZM",name:"Zambia",slug:"zambia",flag:"🇿🇲",currency:"ZMW"},
  {code:"ZW",name:"Zimbabwe",slug:"zimbabwe",flag:"🇿🇼",currency:"USD"},
  {code:"MZ",name:"Mozambique",slug:"mozambique",flag:"🇲🇿",currency:"MZN"},
  {code:"MW",name:"Malawi",slug:"malawi",flag:"🇲🇼",currency:"MWK"},
  {code:"MG",name:"Madagascar",slug:"madagascar",flag:"🇲🇬",currency:"MGA"},
  {code:"BW",name:"Botswana",slug:"botswana",flag:"🇧🇼",currency:"BWP"},
  {code:"NA",name:"Namibia",slug:"namibia",flag:"🇳🇦",currency:"NAD"},
  {code:"LS",name:"Lesotho",slug:"lesotho",flag:"🇱🇸",currency:"LSL"},
  {code:"SZ",name:"Eswatini",slug:"eswatini",flag:"🇸🇿",currency:"SZL"},
  {code:"MU",name:"Mauritius",slug:"mauritius",flag:"🇲🇺",currency:"MUR"},
  {code:"SC",name:"Seychelles",slug:"seychelles",flag:"🇸🇨",currency:"SCR"},
  {code:"DJ",name:"Djibouti",slug:"djibouti",flag:"🇩🇯",currency:"DJF"},
  {code:"ER",name:"Eritrea",slug:"eritrea",flag:"🇪🇷",currency:"ERN"},
  {code:"SO",name:"Somalia",slug:"somalia",flag:"🇸🇴",currency:"USD"},
  {code:"SS",name:"South Sudan",slug:"south-sudan",flag:"🇸🇸",currency:"SSP"},
  {code:"SD",name:"Sudan",slug:"sudan",flag:"🇸🇩",currency:"SDG"},
  {code:"LY",name:"Libya",slug:"libya",flag:"🇱🇾",currency:"LYD"},
  {code:"DZ",name:"Algeria",slug:"algeria",flag:"🇩🇿",currency:"DZD"},
  {code:"CD",name:"DR Congo",slug:"dr-congo",flag:"🇨🇩",currency:"CDF"},
  {code:"CG",name:"Republic of Congo",slug:"republic-of-congo",flag:"🇨🇬",currency:"XAF"},
  {code:"TD",name:"Chad",slug:"chad",flag:"🇹🇩",currency:"XAF"},
  {code:"CF",name:"Central African Republic",slug:"central-african-republic",flag:"🇨🇫",currency:"XAF"},
  {code:"GA",name:"Gabon",slug:"gabon",flag:"🇬🇦",currency:"XAF"},
  {code:"GQ",name:"Equatorial Guinea",slug:"equatorial-guinea",flag:"🇬🇶",currency:"XAF"},
  {code:"ST",name:"São Tomé & Príncipe",slug:"sao-tome",flag:"🇸🇹",currency:"STN"},
  {code:"KM",name:"Comoros",slug:"comoros",flag:"🇰🇲",currency:"KMF"},
  {code:"BI",name:"Burundi",slug:"burundi",flag:"🇧🇮",currency:"BIF"},
  {code:"BJ",name:"Benin",slug:"benin",flag:"🇧🇯",currency:"XOF"},
  {code:"BF",name:"Burkina Faso",slug:"burkina-faso",flag:"🇧🇫",currency:"XOF"},
  {code:"CV",name:"Cape Verde",slug:"cape-verde",flag:"🇨🇻",currency:"CVE"},
  {code:"GM",name:"Gambia",slug:"gambia",flag:"🇬🇲",currency:"GMD"},
  {code:"GN",name:"Guinea",slug:"guinea",flag:"🇬🇳",currency:"GNF"},
  {code:"GW",name:"Guinea-Bissau",slug:"guinea-bissau",flag:"🇬🇼",currency:"XOF"},
  {code:"LR",name:"Liberia",slug:"liberia",flag:"🇱🇷",currency:"LRD"},
  {code:"ML",name:"Mali",slug:"mali",flag:"🇲🇱",currency:"XOF"},
  {code:"NE",name:"Niger",slug:"niger",flag:"🇳🇪",currency:"XOF"},
  {code:"SL",name:"Sierra Leone",slug:"sierra-leone",flag:"🇸🇱",currency:"SLL"},
  {code:"TG",name:"Togo",slug:"togo",flag:"🇹🇬",currency:"XOF"},
  {code:"MR",name:"Mauritania",slug:"mauritania",flag:"🇲🇷",currency:"MRO"}
];

// ─── TOOL DEFINITIONS ─────────────────────────────────────────────────────────
const TOOLS = [
  {
    slug: "electricity-tariff",
    toolNum: 126,
    shortTitle: "Electricity Tariff Calculator",
    longTitle: "{{COUNTRY_NAME}} Electricity Tariff Calculator",
    metaDesc: "Calculate your electricity bill in {{COUNTRY_NAME}}. Check current electricity tariff rates, tier pricing, and monthly cost estimates for residential, commercial, and industrial customers.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Electricity Tariff Calculator</em>",
    heroSub: "Calculate electricity bills and check current tariff rates in {{COUNTRY_NAME}}. Residential, commercial, and industrial pricing.",
    categoryLabel: "Energy & Utilities",
    categoryPath: "/energy/",
    hubTitle: "Electricity Tariff Calculator",
    formIcon: "⚡",
    formHeading: "Calculate Your Electricity Bill",
    engineVar: "ElectricityTariffEngine",
    engineFile: "electricity-tariff-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="monthlyUnits">Monthly Units Used (kWh)</label><input class="en-input" type="number" id="monthlyUnits" placeholder="e.g. 250" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="customerType">Customer Type</label><select class="en-select" id="customerType"><option value="residential">Residential (Home)</option><option value="commercial">Commercial (Business)</option><option value="industrial">Industrial</option></select></div>`,
    calcInputs: `i.units=fv("monthlyUnits");i.customerType=sv("customerType");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Monthly Bill</div><div class="en-res-amount" id="rMonthly">—</div><div class="en-res-sub" id="rDaily">Daily: —</div></div>
<table class="en-results-table"><thead><tr><th>Period</th><th>Estimated Bill</th></tr></thead><tbody>
<tr><td>Daily</td><td id="rDailyRow">—</td></tr>
<tr><td>Monthly</td><td id="rMonthlyRow">—</td></tr>
<tr><td>Annual</td><td id="rAnnual">—</td></tr>
<tr><td>Avg Rate (per kWh)</td><td id="rRate">—</td></tr>
</tbody></table>
<div class="en-tip" id="rTip"></div>`,
    bindJS: `document.getElementById("rMonthly").textContent=r.monthlyBill;
document.getElementById("rDaily").textContent="Daily: "+r.dailyBill;
document.getElementById("rDailyRow").textContent=r.dailyBill;
document.getElementById("rMonthlyRow").textContent=r.monthlyBill;
document.getElementById("rAnnual").textContent=r.annualBill;
document.getElementById("rRate").textContent=r.avgRate;
var tip=document.getElementById("rTip");if(r.savingTip){tip.textContent="💡 "+r.savingTip;tip.style.display="block";}`,
    seoTitle: "Electricity Tariff Calculator",
    seoBody: "Check current electricity tariff rates in {{COUNTRY_NAME}} and calculate your monthly bill. Our calculator covers residential, commercial, and industrial tariff bands, giving you an accurate cost estimate based on actual consumption.",
    seoFact: "electricity access rates and grid infrastructure"
  },
  {
    slug: "solar-roi",
    toolNum: 127,
    shortTitle: "Solar Panel ROI Calculator",
    longTitle: "{{COUNTRY_NAME}} Solar Panel ROI Calculator",
    metaDesc: "Calculate solar panel return on investment in {{COUNTRY_NAME}}. Find payback period, 25-year savings, and monthly electricity savings for any system size.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Solar Panel ROI Calculator</em>",
    heroSub: "Calculate solar panel payback period and return on investment in {{COUNTRY_NAME}}. See 10-year and 25-year savings projections.",
    categoryLabel: "Energy & Utilities",
    categoryPath: "/energy/",
    hubTitle: "Solar Panel ROI Calculator",
    formIcon: "☀️",
    formHeading: "Calculate Solar ROI",
    engineVar: "SolarROIEngine",
    engineFile: "solar-roi-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="systemKW">Solar System Size (kW)</label><select class="en-select" id="systemKW"><option value="1">1 kW (small home / lights only)</option><option value="2">2 kW (average home)</option><option value="3" selected>3 kW (family home)</option><option value="5">5 kW (large home / hybrid)</option><option value="10">10 kW (small business)</option><option value="20">20 kW (medium business)</option></select></div>
<div class="en-field"><label class="en-label" for="currentMonthlyBill">Current Monthly Electricity Bill</label><input class="en-input" type="number" id="currentMonthlyBill" placeholder="e.g. 25000" inputmode="numeric"></div>`,
    calcInputs: `i.systemKW=sv("systemKW");i.currentMonthlyBill=fv("currentMonthlyBill");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Payback Period</div><div class="en-res-amount" id="rPayback">—</div><div class="en-res-sub" id="rSaving">Monthly saving: —</div></div>
<table class="en-results-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
<tr><td>System Cost (est.)</td><td id="rCost">—</td></tr>
<tr><td>Monthly Generation</td><td id="rGen">—</td></tr>
<tr><td>Monthly Saving</td><td id="rMSaving">—</td></tr>
<tr><td>Annual Saving</td><td id="rASaving">—</td></tr>
<tr><td>10-Year Net Gain</td><td id="r10yr">—</td></tr>
<tr><td>25-Year Net Gain</td><td id="r25yr">—</td></tr>
<tr><td>CO₂ Saved / Year</td><td id="rCO2">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rPayback").textContent=r.paybackYears;
document.getElementById("rSaving").textContent="Monthly saving: "+r.monthlySaving;
document.getElementById("rCost").textContent=r.installCostLocal;
document.getElementById("rGen").textContent=r.monthlyGeneration;
document.getElementById("rMSaving").textContent=r.monthlySaving;
document.getElementById("rASaving").textContent=r.annualSaving;
document.getElementById("r10yr").textContent=r.roi10yr;
document.getElementById("r25yr").textContent=r.roi25yr;
document.getElementById("rCO2").textContent=r.co2SavedYr;`,
    seoTitle: "Solar Panel ROI Calculator",
    seoBody: "Find out how quickly solar panels pay back in {{COUNTRY_NAME}} with our free ROI calculator. We use local sun hours, grid tariff rates, and installation costs to give you a realistic payback period and long-term savings projection.",
    seoFact: "solar irradiance levels and electricity grid reliability"
  },
  {
    slug: "prepaid-meter",
    toolNum: 132,
    shortTitle: "Prepaid Meter Unit Calculator",
    longTitle: "{{COUNTRY_NAME}} Prepaid Meter Unit Calculator",
    metaDesc: "Calculate how many kWh units you get for your prepaid electricity token in {{COUNTRY_NAME}}. Enter your recharge amount and see exactly how much power you receive.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Prepaid Meter Calculator</em>",
    heroSub: "Find out how many electricity units (kWh) you receive for your prepaid token in {{COUNTRY_NAME}}. Calculate service charges and estimated days.",
    categoryLabel: "Energy & Utilities",
    categoryPath: "/energy/",
    hubTitle: "Prepaid Meter Unit Calculator",
    formIcon: "🔢",
    formHeading: "Calculate Prepaid Units",
    engineVar: "PrepaidMeterEngine",
    engineFile: "prepaid-meter-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="tokenAmount">Recharge Amount</label><input class="en-input" type="number" id="tokenAmount" placeholder="e.g. 5000" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="customerType">Customer Type</label><select class="en-select" id="customerType"><option value="residential">Residential (Home)</option><option value="commercial">Commercial (Business)</option></select></div>`,
    calcInputs: `i.tokenAmount=fv("tokenAmount");i.customerType=sv("customerType");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Units Received</div><div class="en-res-amount" id="rUnits">—</div><div class="en-res-sub" id="rDays">Estimated days: —</div></div>
<table class="en-results-table"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>
<tr><td>Energy Delivered</td><td id="rEnergy">—</td></tr>
<tr><td>Service Charge</td><td id="rService">—</td></tr>
<tr><td>Price per kWh</td><td id="rRate">—</td></tr>
<tr><td>Estimated Days</td><td id="rDaysRow">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rUnits").textContent=r.unitsReceived;
document.getElementById("rDays").textContent="Estimated days: "+r.estimatedDays;
document.getElementById("rEnergy").textContent=r.energyAmount;
document.getElementById("rService").textContent=r.serviceCharge;
document.getElementById("rRate").textContent=r.pricePerUnit;
document.getElementById("rDaysRow").textContent=r.estimatedDays;`,
    seoTitle: "Prepaid Meter Unit Calculator",
    seoBody: "Know exactly how many electricity units you receive when you recharge your prepaid meter in {{COUNTRY_NAME}}. Our calculator accounts for service charges and gives you the real kWh delivered per token, so you can budget smarter.",
    seoFact: "prepaid electricity access and energy affordability"
  }
];

// ─── HTML TEMPLATE ─────────────────────────────────────────────────────────────
function makePage(tool, country) {
  const title = tool.longTitle.replace(/\{\{COUNTRY_NAME\}\}/g, country.name) + " | AfroTools";
  const desc = tool.metaDesc.replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const canonical = `https://afrotools.com/tools/${tool.slug}/${country.slug}`;
  const h1 = tool.h1.replace(/\{\{FLAG\}\}/g, country.flag).replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const heroSub = tool.heroSub.replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const seoBody = tool.seoBody.replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const seoTitle = `${country.name} ${tool.seoTitle} — What You Need to Know`;
  const breadcrumb4 = country.name;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"${title}","description":"${desc}","url":"${canonical}","applicationCategory":"FinanceApplication","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Energy & Utilities","item":"https://afrotools.com/energy/"},{"@type":"ListItem","position":3,"name":"${tool.hubTitle}","item":"https://afrotools.com/tools/${tool.slug}/"},{"@type":"ListItem","position":4,"name":"${breadcrumb4}","item":"${canonical}"}]}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="energy"></afro-navbar>
<section class="en-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>›</span> <a href="/energy/">Energy &amp; Utilities</a> <span>›</span> <a href="/tools/${tool.slug}/">${tool.hubTitle}</a> <span>›</span> ${breadcrumb4}</nav>
<h1>${h1}</h1>
<p class="en-tool-hero-sub">${heroSub}</p>
</div></section>
<main class="en-main">
<div class="en-card"><div class="en-card-head" onclick="var b=this.nextElementSibling;b.classList.toggle('collapsed');this.setAttribute('aria-expanded',b.classList.contains('collapsed')?'false':'true')" aria-expanded="true"><span>${tool.formIcon}</span><h2>${tool.formHeading}</h2><span class="en-card-toggle">&#x25BE;</span></div>
<div class="en-card-body"><div class="en-form-grid">
${tool.formHTML}
</div>
<button class="en-btn" id="calcBtn" type="button">Calculate</button></div></div>
<div class="en-results" id="results">
${tool.resultsHTML}
<div class="en-observations" id="rObs"></div>
</div>
<section class="en-seo">
<h2>${seoTitle}</h2>
<p>${seoBody}</p>
<p>${country.name} is one of Africa's key markets for ${tool.seoFact}. Use this free tool to make informed energy decisions.</p>
<p><strong>Disclaimer:</strong> These are estimates based on available market data and published tariff rates. Actual costs may vary. Always verify with your local utility provider.</p>
</section>
</main>
<afro-footer></afro-footer>
<script src="/data/energy/country-energy-index.js"></script>
<script src="/engines/${tool.engineFile}.js"></script>
<script>
!function(){
"use strict";
var CC='${country.code}';
var E=window.AfroTools.${tool.engineVar};
function fv(id){var el=document.getElementById(id);return el?parseFloat(el.value)||0:0;}
function sv(id){var el=document.getElementById(id);return el?el.value:"";}
document.getElementById("calcBtn").addEventListener("click",function(){
var i={};
${tool.calcInputs}
var r=E.calculate(i,CC);
if(r.error){alert(r.error);return;}
${tool.bindJS}
var obs=document.getElementById("rObs");
if(r.observations&&r.observations.length){
  obs.innerHTML="<h3>AI Observations</h3><ul>"+r.observations.map(function(o){return"<li>"+o+"</li>";}).join("")+"</ul>";
  obs.style.display="block";
}
document.getElementById("results").classList.add("on");
document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});
});
}();
</script>
</body>
</html>`;
}

// ─── HUB PAGE ─────────────────────────────────────────────────────────────────
function makeHub(tool) {
  const title = `${tool.hubTitle} — All 54 African Countries | AfroTools`;
  const desc = `Free ${tool.hubTitle} for all 54 African countries. Select your country to calculate with local rates and data.`;
  const canonical = `https://afrotools.com/tools/${tool.slug}/`;

  const countryCards = COUNTRIES.map(c => {
    return `<a href="/tools/${tool.slug}/${c.slug}/" class="en-country-card">
<span class="en-country-flag">${c.flag}</span>
<span class="en-country-name">${c.name}</span>
</a>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"${title}","description":"${desc}","url":"${canonical}"}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="energy"></afro-navbar>
<section class="en-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>›</span> <a href="/energy/">Energy &amp; Utilities</a> <span>›</span> ${tool.hubTitle}</nav>
<h1>${tool.formIcon} <em>${tool.hubTitle}</em></h1>
<p class="en-tool-hero-sub">${desc} Covering all 54 African nations with local rates and data.</p>
</div></section>
<main class="en-main">
<section class="en-hub">
<div class="container">
<h2>Select Your Country</h2>
<div class="en-hub-country-grid">
${countryCards}
</div>
</div>
</section>
</main>
<afro-footer></afro-footer>
</body>
</html>`;
}

// ─── GENERATE FILES ────────────────────────────────────────────────────────────
let totalFiles = 0;

for (const tool of TOOLS) {
  const toolDir = path.join(ROOT, "tools", tool.slug);

  // Create hub
  fs.mkdirSync(toolDir, { recursive: true });
  fs.writeFileSync(path.join(toolDir, "index.html"), makeHub(tool));
  totalFiles++;

  // Create 54 country pages
  for (const country of COUNTRIES) {
    const countryDir = path.join(toolDir, country.slug);
    fs.mkdirSync(countryDir, { recursive: true });
    fs.writeFileSync(path.join(countryDir, "index.html"), makePage(tool, country));
    totalFiles++;
  }

  console.log(`✓ ${tool.slug}: 1 hub + ${COUNTRIES.length} country pages`);
}

console.log(`\nTotal files generated: ${totalFiles}`);
console.log("Done!");
