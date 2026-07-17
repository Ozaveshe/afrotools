"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataset = require(path.join(ROOT, "data", "energy", "solar-roi-country-dataset.js"));
const forex = require(path.join(ROOT, "data", "forex", "latest.json"));

function readPage(slug) {
  const file = path.join(ROOT, "tools", "solar-roi", slug, "index.html");
  assert.ok(fs.existsSync(file), `Missing country page: ${file}`);
  return { file, html: fs.readFileSync(file, "utf8") };
}

function readRootPage() {
  const file = path.join(ROOT, "tools", "solar-roi", "index.html");
  assert.ok(fs.existsSync(file), `Missing root page: ${file}`);
  return { file, html: fs.readFileSync(file, "utf8") };
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function assertIncludes(html, needle, label, file) {
  assert.ok(html.includes(needle), `${label} missing in ${file}`);
}

function getTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].trim()) : "";
}

function getMetaContent(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = selector.startsWith("og:")
    ? new RegExp(`<meta\\s+property="${escaped}"\\s+content="([^"]*)"`, "i")
    : new RegExp(`<meta\\s+name="${escaped}"\\s+content="([^"]*)"`, "i");
  const match = html.match(pattern);
  return match ? decodeHtml(match[1]) : "";
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function jsonLdByType(html, type, file) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const block of blocks) {
    let parsed;
    assert.doesNotThrow(() => {
      parsed = JSON.parse(block[1]);
    }, `Invalid JSON-LD in ${file}`);
    if (parsed && parsed["@type"] === type) return parsed;
  }
  return null;
}

function visibleFaqItems(html, sectionId, file) {
  const sectionPattern = new RegExp(`<section[^>]+aria-labelledby="${sectionId}"[\\s\\S]*?<\\/section>`, "i");
  const sectionMatch = html.match(sectionPattern);
  assert.ok(sectionMatch, `FAQ section ${sectionId} missing in ${file}`);
  const details = [...sectionMatch[0].matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)];
  assert.ok(details.length > 0, `Visible FAQ details missing in ${file}`);
  return details.map(match => ({
    question: stripTags(match[1]),
    answer: stripTags(match[2])
  }));
}

function assertFaqSchemaMatchesVisible(html, sectionId, file) {
  const faqLd = jsonLdByType(html, "FAQPage", file);
  assert.ok(faqLd, `FAQPage JSON-LD missing in ${file}`);
  const visible = visibleFaqItems(html, sectionId, file);
  const schemaItems = (faqLd.mainEntity || []).map(item => ({
    question: item.name,
    answer: item.acceptedAnswer && item.acceptedAnswer.text
  }));
  assert.deepStrictEqual(schemaItems, visible, `FAQPage JSON-LD does not match visible FAQs in ${file}`);
}

function forexCurrencyCode(currency) {
  if (currency === "SLL") return "SLE";
  if (currency === "MRO") return "MRU";
  return currency;
}

function hasUsdEquivalent(country) {
  const currency = forexCurrencyCode(country.currency);
  return currency !== "USD" && Boolean(forex.rates && forex.rates[currency]);
}

function publicAssetExists(publicPath) {
  return fs.existsSync(path.join(ROOT, publicPath.replace(/^\//, "")));
}

function routeExists(route) {
  const clean = String(route || "").split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  const file = clean ? path.join(ROOT, clean, "index.html") : path.join(ROOT, "index.html");
  return fs.existsSync(file);
}

function expectedCountryOgImage(country) {
  const candidates = [
    `/assets/img/og/solar-roi-${country.slug}.webp`,
    `/assets/img/og/solar-roi-${String(country.code || "").toLowerCase()}.webp`,
    `/assets/img/tools/solar-roi-${country.slug}.webp`
  ];
  const found = candidates.find(publicAssetExists) || "/assets/img/tools/solar-roi.webp";
  return `https://afrotools.com${found}`;
}

function visibleWordCount(html) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const start = withoutScripts.indexOf('aria-labelledby="payback-country"');
  const end = withoutScripts.indexOf('aria-labelledby="related-tools"');
  const main = start >= 0 && end > start
    ? withoutScripts.slice(start, end)
    : (withoutScripts.match(/<main[\s\S]*?<\/main>/i) || [""])[0];
  const copyOnly = main
    .replace(/<div class="solar-data-update-panel"[\s\S]*?<label class="solar-field solar-span-2" for="sourceNote">/i, '<label class="solar-field solar-span-2" for="sourceNote">')
    .replace(/<button\b[\s\S]*?<\/button>/gi, " ");
  const text = copyOnly
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, " and ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

const countries = Object.values(dataset.countries);
assert.strictEqual(countries.length, 54, "Solar ROI dataset should contain 54 countries");

const rootTitle = "Solar Panel ROI Calculator for Africa — Payback, Battery & Generator Savings";
const rootDesc = "Choose a country solar ROI page, compare generator savings, battery backup, monthly bill impact, system cost, and cash or financing assumptions.";
const rootPage = readRootPage();
assert.strictEqual(getTitle(rootPage.html), rootTitle, `Unexpected root title in ${rootPage.file}`);
assert.strictEqual(getMetaContent(rootPage.html, "description"), rootDesc, `Unexpected root description in ${rootPage.file}`);
assertIncludes(rootPage.html, '<link rel="canonical" href="https://afrotools.com/tools/solar-roi/">', "root canonical", rootPage.file);
assert.strictEqual(getMetaContent(rootPage.html, "og:title"), rootTitle, `Unexpected root OG title in ${rootPage.file}`);
assert.strictEqual(getMetaContent(rootPage.html, "og:description"), rootDesc, `Unexpected root OG description in ${rootPage.file}`);
assertIncludes(rootPage.html, '<meta property="og:image" content="https://afrotools.com/assets/img/tools/solar-roi.webp">', "root OG image", rootPage.file);
assert.strictEqual(getMetaContent(rootPage.html, "twitter:title"), rootTitle, `Unexpected root Twitter title in ${rootPage.file}`);
assert.strictEqual(getMetaContent(rootPage.html, "twitter:description"), rootDesc, `Unexpected root Twitter description in ${rootPage.file}`);
assertIncludes(rootPage.html, 'aria-label="Breadcrumb"', "root visible breadcrumb", rootPage.file);
assertIncludes(rootPage.html, '"@type":"BreadcrumbList"', "root breadcrumb schema", rootPage.file);
const rootJsonLdBlocks = [...rootPage.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.ok(rootJsonLdBlocks.length >= 2, `Expected root JSON-LD blocks in ${rootPage.file}`);
const rootJsonTypes = new Set();
for (const block of rootJsonLdBlocks) {
  let parsed;
  assert.doesNotThrow(() => {
    parsed = JSON.parse(block[1]);
  }, `Invalid root JSON-LD in ${rootPage.file}`);
  if (parsed && parsed["@type"]) rootJsonTypes.add(parsed["@type"]);
}
assert.ok(rootJsonTypes.has("WebApplication"), `Expected root WebApplication JSON-LD in ${rootPage.file}`);
assert.ok(rootJsonTypes.has("BreadcrumbList"), `Expected root BreadcrumbList JSON-LD in ${rootPage.file}`);
assert.ok(rootJsonTypes.has("FAQPage"), `Expected root FAQPage JSON-LD in ${rootPage.file}`);
assert.ok(!rootJsonTypes.has("HowTo"), `Root HowTo JSON-LD should not render without visible HowTo steps in ${rootPage.file}`);
assertFaqSchemaMatchesVisible(rootPage.html, "root-faq", rootPage.file);
assertIncludes(rootPage.html, "/tools/generator-fuel/", "root generator fuel link", rootPage.file);
assertIncludes(rootPage.html, "/tools/electricity-estimator/", "root electricity estimator link", rootPage.file);
assertIncludes(rootPage.html, "/tools/battery-sizing/", "root battery and inverter link", rootPage.file);
assertIncludes(rootPage.html, "/tools/backup-duration/", "root battery backup duration link", rootPage.file);
assertIncludes(rootPage.html, "/tools/solar-vs-generator/", "root solar vs generator link", rootPage.file);
assertIncludes(rootPage.html, "/tools/fuel-tracker/", "root fuel tracker link", rootPage.file);
assertIncludes(rootPage.html, "/business-roi/", "root business ROI link", rootPage.file);
assertIncludes(rootPage.html, "/blog/generator-vs-solar/", "root solar article link", rootPage.file);
assertIncludes(rootPage.html, 'id="solarRootCountrySearch"', "root searchable country input", rootPage.file);
assertIncludes(rootPage.html, 'id="solarRootCountrySelect"', "root searchable country dropdown", rootPage.file);
assertIncludes(rootPage.html, 'id="solarRootCountryOpen"', "root open country CTA", rootPage.file);
assertIncludes(rootPage.html, '<optgroup label="Popular countries">', "root popular countries group", rootPage.file);
assertIncludes(rootPage.html, '<optgroup label="All countries">', "root all countries group", rootPage.file);
assertIncludes(rootPage.html, 'id="solarCountryGrid"', "root searchable country grid", rootPage.file);
assertIncludes(rootPage.html, "Showing available country pages.", "root search status copy", rootPage.file);
assertIncludes(rootPage.html, '"Showing all "+cards.length+" countries."', "root dynamic country count", rootPage.file);
assertIncludes(rootPage.html, 'data-country="nigeria ngn ng"', "root country search data", rootPage.file);
assertIncludes(rootPage.html, "solarCountrySearchStatus", "root country search live status", rootPage.file);
assertIncludes(rootPage.html, "No country matches that search", "root country search empty state", rootPage.file);
assertIncludes(rootPage.html, "font-size:16px", "root mobile number/search input sizing", rootPage.file);
assertIncludes(rootPage.html, "@media(max-width:760px)", "root mobile layout CSS", rootPage.file);
assertIncludes(rootPage.html, "@media(prefers-color-scheme:dark)", "root dark mode CSS", rootPage.file);

const titles = new Map();
const descriptions = new Map();

for (const country of countries) {
  const { file, html } = readPage(country.slug);
  const name = country.countryName;
  const expectedTitle = `${name} Solar Panel ROI Calculator — Payback, Battery & Generator Savings`;
  const expectedDesc = `Use the ${name} Solar Panel ROI Calculator in ${country.currency} to estimate payback from monthly bill, generator fuel savings, battery backup, system cost, and cash or financing assumptions.`;
  const canonical = `https://afrotools.com/tools/solar-roi/${country.slug}/`;

  assert.strictEqual(getTitle(html), expectedTitle, `Unexpected country title in ${file}`);
  assert.strictEqual(getMetaContent(html, "description"), expectedDesc, `Unexpected country description in ${file}`);
  assert.ok(!titles.has(expectedTitle), `Duplicate title across ${file} and ${titles.get(expectedTitle)}`);
  assert.ok(!descriptions.has(expectedDesc), `Duplicate description across ${file} and ${descriptions.get(expectedDesc)}`);
  titles.set(expectedTitle, file);
  descriptions.set(expectedDesc, file);
  assertIncludes(html, `<link rel="canonical" href="${canonical}">`, "country canonical", file);
  assertIncludes(html, `<link rel="alternate" hreflang="en" href="${canonical}">`, "country hreflang en", file);
  assertIncludes(html, `<link rel="alternate" hreflang="x-default" href="${canonical}">`, "country hreflang x-default", file);
  assert.strictEqual(getMetaContent(html, "og:title"), expectedTitle, `Unexpected country OG title in ${file}`);
  assert.strictEqual(getMetaContent(html, "og:description"), expectedDesc, `Unexpected country OG description in ${file}`);
  assertIncludes(html, `<meta property="og:image" content="${expectedCountryOgImage(country)}">`, "country OG image", file);
  assert.strictEqual(getMetaContent(html, "twitter:title"), expectedTitle, `Unexpected country Twitter title in ${file}`);
  assert.strictEqual(getMetaContent(html, "twitter:description"), expectedDesc, `Unexpected country Twitter description in ${file}`);
  assertIncludes(html, `<meta name="twitter:image" content="${expectedCountryOgImage(country)}">`, "country Twitter image", file);

  assertIncludes(html, `<h1>Estimate solar payback in ${name}</h1>`, "country-specific h1", file);
  assertIncludes(html, `Currency: ${country.currency}`, "preselected currency badge", file);
  assertIncludes(html, "Monthly generator spend", "generator input", file);
  assertIncludes(html, 'id="outageHours"', "outage input", file);
  assertIncludes(html, 'id="batteryOption"', "battery input", file);
  assertIncludes(html, 'id="financeEnabled"', "finance input", file);
  assertIncludes(html, 'id="panelWatt"', "panel wattage validation input", file);
  assertIncludes(html, 'id="batteryDodPct"', "battery DoD validation input", file);
  assertIncludes(html, "Advanced assumptions", "advanced assumptions drawer", file);
  assertIncludes(html, 'id="calcErrorSummary" role="alert" aria-live="assertive"', "announced calculator error summary", file);
  assertIncludes(html, 'aria-describedby="monthlyBillHelp monthlyBillError"', "monthly bill helper/error association", file);
  assertIncludes(html, 'aria-describedby="generatorSpendHelp generatorSpendError"', "generator spend helper/error association", file);
  assertIncludes(html, 'aria-describedby="outageHoursHelp outageHoursError"', "outage helper/error association", file);
  assertIncludes(html, 'aria-describedby="systemKWHelp systemKWError"', "system size helper/error association", file);
  assertIncludes(html, 'aria-describedby="sourceNoteHelp sourceNoteError"', "source note helper/error association", file);
  assertIncludes(html, 'aria-invalid', "scripted aria-invalid validation", file);
  assertIncludes(html, 'validateInputs', "accessible validation function", file);
  assertIncludes(html, 'role="status" aria-live="polite"', "polite result status", file);
  assertIncludes(html, 'id="chartTextEquivalent"', "chart text equivalent", file);
  assertIncludes(html, 'class="solar-card-label"', "result card accessible labels", file);
  assertIncludes(html, '<h2 id="compare-sizes-title">Compare system sizes</h2>', "compare system sizes section", file);
  assertIncludes(html, 'id="systemSizeComparisonBody"', "compare system sizes table body", file);
  assertIncludes(html, "Estimated cost", "compare system sizes cost column", file);
  assertIncludes(html, "Monthly generation", "compare system sizes generation column", file);
  assertIncludes(html, "Battery fit", "compare system sizes battery fit column", file);
  assertIncludes(html, "Best for", "compare system sizes best-for column", file);
  assertIncludes(html, "renderSystemSizeComparison", "compare system sizes live renderer", file);
  assertIncludes(html, "moneyAccessible", "screen-reader currency labels", file);
  assertIncludes(html, 'id="solarMobileSummary"', "mobile sticky summary", file);
  assertIncludes(html, 'id="mPayback"', "mobile summary payback value", file);
  assertIncludes(html, 'id="mSavings"', "mobile summary savings value", file);
  assertIncludes(html, 'id="mobileResultsBtn"', "mobile summary results button", file);
  assertIncludes(html, "Calculate / view results", "mobile summary button copy", file);
  assertIncludes(html, "min-height:48px", "mobile-friendly input/button target size", file);
  assertIncludes(html, "font-size:16px", "mobile number input usability", file);
  assertIncludes(html, ".solar-source-table-wrap{max-width:100%;overflow-x:auto", "source table overflow containment", file);
  assertIncludes(html, "body{padding-bottom:92px}", "mobile sticky summary body padding", file);
  assertIncludes(html, ".solar-country-cta{display:grid;grid-template-columns:1fr}", "mobile CTA stacking", file);
  assertIncludes(html, ".solar-result-grid{grid-template-columns:1fr", "mobile result card stacking", file);
  assertIncludes(html, "@media(prefers-color-scheme:dark)", "country dark mode CSS", file);
  assertIncludes(html, "/assets/js/engines/solar-roi-engine.js", "shared Solar ROI engine", file);
  assertIncludes(html, "dailyLoadKwh", "load-aware engine input", file);
  assertIncludes(html, `Estimate solar payback in ${name}`, "local CTA", file);
  assertIncludes(html, `Solar payback in ${name}`, "payback content section", file);
  assertIncludes(html, "Typical inputs to check before buying", "inputs content section", file);
  assertIncludes(html, "How electricity bills affect payback", "bill content section", file);
  assertIncludes(html, "How generator fuel changes ROI", "fuel content section", file);
  assertIncludes(html, "Battery backup planning", "battery content section", file);
  assertIncludes(html, "Example scenarios: small home, family home, shop/business", "scenario content section", file);
  assertIncludes(html, "Small home", "small home scenario", file);
  assertIncludes(html, "Family home", "family home scenario", file);
  assertIncludes(html, "Shop / small business", "shop scenario", file);
  assertIncludes(html, 'data-scenario="small-home"', "small home load CTA", file);
  assertIncludes(html, 'data-scenario="family-home"', "family home load CTA", file);
  assertIncludes(html, 'data-scenario="shop-business"', "shop scenario load CTA", file);
  assertIncludes(html, "System size", "scenario system size", file);
  assertIncludes(html, "Bill and generator input", "scenario bill and generator assumption", file);
  assertIncludes(html, "Estimated monthly saving", "scenario estimated saving", file);
  assertIncludes(html, "Payback range", "scenario payback range", file);
  assertIncludes(html, "Load this scenario", "scenario CTA copy", file);
  if (hasUsdEquivalent(country)) {
    assertIncludes(html, "gen USD", "scenario USD spend equivalent", file);
  }
  assertIncludes(html, "Assumptions and source freshness", "source content section", file);
  assertIncludes(html, "<h2 id=\"faq-country\">FAQs</h2>", "FAQ content section", file);
  assertIncludes(html, "Dataset freshness", "freshness summary", file);
  assertIncludes(html, "This is a planning estimate, not a quote", "planning disclaimer", file);
  assertIncludes(html, "/tools/generator-fuel/", "generator fuel cross-link", file);
  assertIncludes(html, "/tools/electricity-estimator/", "electricity estimator cross-link", file);
  assertIncludes(html, "/tools/battery-sizing/", "battery sizing cross-link", file);
  assertIncludes(html, "/tools/backup-duration/", "battery backup duration cross-link", file);
  assertIncludes(html, "/tools/solar-sizing/", "solar sizing cross-link", file);
  assertIncludes(html, "/tools/solar-vs-generator/", "solar vs generator cross-link", file);
  assertIncludes(html, "/tools/fuel-tracker/", "fuel tracker cross-link", file);
  assertIncludes(html, "/business-roi/", "business ROI cross-link", file);
  assertIncludes(html, "/blog/generator-vs-solar/", "solar article cross-link", file);
  assertIncludes(html, "/tools/solar-roi/", "full Africa calculator link", file);
  assertIncludes(html, "Download/share estimate", "download/share CTA", file);
  assertIncludes(html, "Next quote steps", "soft conversion CTA section", file);
  assertIncludes(html, "No account is required", "soft conversion no-account copy", file);
  assertIncludes(html, "nothing is sent unless you choose", "soft conversion privacy copy", file);
  assertIncludes(html, "Request quote checklist", "request quote checklist CTA", file);
  assertIncludes(html, "Compare installer quotes", "compare installer quotes CTA", file);
  assertIncludes(html, "Send this estimate to an installer", "send estimate CTA", file);
  assertIncludes(html, "Save this estimate", "save estimate CTA", file);
  assertIncludes(html, "quote_cta_impression", "quote CTA impression analytics", file);
  assertIncludes(html, "quote_cta_clicked", "quote CTA click analytics", file);
  assertIncludes(html, "system_size_band", "quote CTA system size analytics parameter", file);
  assertIncludes(html, "payback_band", "quote CTA payback analytics parameter", file);
  assertIncludes(html, "afrotools-solar-roi-saved-estimates-v1", "browser-local estimate save key", file);
  assert.ok(html.includes("/assets/js/lib/analytics.js") || html.includes("/assets/js/bundles/core."), `analytics library missing in ${file}`);
  assertIncludes(html, 'data-sponsor-slot="solar-roi-intro"', "below-intro sponsor slot", file);
  assertIncludes(html, 'data-sponsor-slot="solar-roi-after-results"', "after-results sponsor slot", file);
  assertIncludes(html, 'data-sponsor-slot="solar-roi-country-midpage"', "country mid-page sponsor slot", file);
  assertIncludes(html, 'data-sponsor-slot="solar-roi-installer-checklist"', "installer checklist sponsor slot", file);
  assertIncludes(html, "AfroToolsSolarRoiSponsors", "Solar ROI sponsor config hook", file);
  assertIncludes(html, "sponsor_slot_impression", "sponsor impression analytics event", file);
  assertIncludes(html, "sponsor_slot_clicked", "sponsor click analytics event", file);
  assert.strictEqual(countMatches(html, /class="solar-sponsor-slot"/g), 4, `Expected 4 sponsor slots in ${file}`);
  assert.strictEqual(countMatches(html, /data-sponsor-slot="solar-roi-[^"]+" aria-label="[^"]+ sponsor slot" hidden/g), 4, `Expected 4 hidden-by-default sponsor slots in ${file}`);
  assertIncludes(html, "Installer quote checklist", "installer quote checklist section", file);
  assertIncludes(html, "Use this before paying a deposit or comparing installer quotes.", "installer checklist helper copy", file);
  assertIncludes(html, "Confirm roof condition and shading.", "installer roof checklist item", file);
  assertIncludes(html, "Confirm panel wattage and warranty.", "installer panel checklist item", file);
  assertIncludes(html, "Confirm inverter type and surge capacity.", "installer inverter checklist item", file);
  assertIncludes(html, "Confirm battery chemistry, usable kWh, depth of discharge, and warranty.", "installer battery checklist item", file);
  assertIncludes(html, "Confirm protection devices, earthing, and isolators.", "installer protection checklist item", file);
  assertIncludes(html, "Confirm installation price includes mounting, wiring, labour, and permits.", "installer install-scope checklist item", file);
  assertIncludes(html, "Confirm maintenance and after-sales support.", "installer maintenance checklist item", file);
  assertIncludes(html, "Confirm real energy consumption from bill or load profile.", "installer consumption checklist item", file);
  assertIncludes(html, "Confirm financing total repayment.", "installer finance checklist item", file);
  assertIncludes(html, "Confirm payback assumptions.", "installer payback checklist item", file);
  assertIncludes(html, 'id="copyInstallerChecklistBtn"', "installer checklist copy action", file);
  assertIncludes(html, 'id="downloadInstallerChecklistBtn"', "installer checklist download action", file);
  assertIncludes(html, "Copy/share estimate", "copy/share action", file);
  assertIncludes(html, "Print estimate", "print estimate action", file);
  assertIncludes(html, "Printable solar estimate report", "printable report section", file);
  assertIncludes(html, "Copy WhatsApp summary", "WhatsApp summary export action", file);
  assertIncludes(html, "Download TXT report", "TXT report export action", file);
  assertIncludes(html, "Print / PDF", "print PDF export action", file);
  assertIncludes(html, "Questions to ask installer", "installer checklist report content", file);
  assertIncludes(html, "Executive summary", "executive summary report content", file);
  assertIncludes(html, "Payback timeline", "payback timeline report content", file);
  assertIncludes(html, "Roof and panels", "roof and panels report content", file);
  assertIncludes(html, "Source freshness", "source freshness report content", file);
  if (routeExists(`/${country.slug}/`)) {
    assertIncludes(html, `href="/${country.slug}/"`, "country hub cross-link", file);
  } else {
    assertIncludes(html, "/energy/", "energy hub fallback link", file);
  }
  assertIncludes(html, "Compare nearby countries", "nearby country links", file);
  assert.strictEqual(countMatches(html, /class="solar-result-card"/g), 8, `Expected 8 result cards in ${file}`);
  assert.strictEqual(countMatches(html, /class="solar-scenario-card"/g), 3, `Expected 3 scenario cards in ${file}`);
  assert.ok(countMatches(html, /<details/g) >= 5, `Expected source details plus FAQs in ${file}`);
  const words = visibleWordCount(html);
  assert.ok(words >= 700 && words <= 1200, `Expected 700-1200 useful words in ${file}, saw ${words}`);
  assert.ok(!html.includes("one of Africa's key markets"), `Generic country slop phrase found in ${file}`);
  assert.ok(!html.includes("one of Africa’s key markets"), `Generic country slop phrase found in ${file}`);
  assert.ok(!html.includes("This country page is a quick bill-and-system check"), `Thin quick-page bridge found in ${file}`);

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(jsonLdBlocks.length >= 2, `Expected JSON-LD blocks in ${file}`);
  let sawBreadcrumb = false;
  let sawFaq = false;
  for (const block of jsonLdBlocks) {
    let parsed;
    assert.doesNotThrow(() => {
      parsed = JSON.parse(block[1]);
    }, `Invalid JSON-LD in ${file}`);
    if (parsed && parsed["@type"] === "BreadcrumbList") sawBreadcrumb = true;
    if (parsed && parsed["@type"] === "FAQPage") sawFaq = true;
  }
  assert.ok(sawBreadcrumb, `Expected BreadcrumbList JSON-LD in ${file}`);
  assert.ok(sawFaq, `Expected FAQPage JSON-LD in ${file}`);
  assertFaqSchemaMatchesVisible(html, "faq-country", file);
}

console.log(`Solar ROI country pages verified: ${countries.length}`);
