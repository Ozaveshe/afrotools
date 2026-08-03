#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY = path.join(ROOT, "reports", "swahili-free-app-parity-inventory.json");
const CACHE = path.join(ROOT, "data", "i18n", "sw-health-parity-translations.json");
const MANIFEST = path.join(ROOT, "data", "localization", "sw-health-parity-manifest.json");
const ARTWORK_REPORT = path.join(ROOT, "reports", "sw-health-parity-missing-artwork.json");
const RUNTIME = "/assets/js/pages/swahili-health-parity-runtime.js";
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh-translations");
const SKIP_GENERATION = new Set(["waist-hip-ratio"]);
const MISSING_ROUTE_OWNERS = {
  "pharmacy-prices": ["/sw/zana/bei-za-famasia", "sw/zana/bei-za-famasia/index.html"],
  "genotype-checker": ["/sw/zana/uthibitishaji-wa-genotype", "sw/zana/uthibitishaji-wa-genotype/index.html"],
  "maternal-mortality": ["/sw/zana/maandalizi-ya-afya-ya-uzazi", "sw/zana/maandalizi-ya-afya-ya-uzazi/index.html"],
  "traditional-vs-western": ["/sw/zana/kulinganisha-mipango-ya-matibabu", "sw/zana/kulinganisha-mipango-ya-matibabu/index.html"],
  "hiv-treatment-cost": ["/sw/zana/gharama-za-huduma-ya-vvu", "sw/zana/gharama-za-huduma-ya-vvu/index.html"],
  "tb-tracker": ["/sw/zana/ratiba-ya-huduma-ya-kifua-kikuu", "sw/zana/ratiba-ya-huduma-ya-kifua-kikuu/index.html"],
  "hep-b-screening": ["/sw/zana/uchunguzi-wa-hepatitis-b", "sw/zana/uchunguzi-wa-hepatitis-b/index.html"],
  "medical-tourism": ["/sw/zana/bajeti-ya-safari-ya-matibabu", "sw/zana/bajeti-ya-safari-ya-matibabu/index.html"],
  "eye-care-cost": ["/sw/zana/gharama-za-huduma-ya-macho", "sw/zana/gharama-za-huduma-ya-macho/index.html"],
  "mental-health-cost": ["/sw/zana/bajeti-ya-afya-ya-akili", "sw/zana/bajeti-ya-afya-ya-akili/index.html"],
  "pregnancy-nutrition": ["/sw/zana/lishe-wakati-wa-ujauzito", "sw/zana/lishe-wakati-wa-ujauzito/index.html"],
  "gym-cost-compare": ["/sw/zana/kulinganisha-gharama-za-gym", "sw/zana/kulinganisha-gharama-za-gym/index.html"],
  "home-workout": ["/sw/zana/mpango-wa-mazoezi-ya-nyumbani", "sw/zana/mpango-wa-mazoezi-ya-nyumbani/index.html"]
};

const titleById = {
  "medical-report": "Mkalimani wa ripoti ya matibabu",
  "bmi-calculator": "Karatasi ya ubora wa vipimo vya BMI",
  "due-date": "Mpangaji wa miadi ya ujauzito",
  "calorie-counter": "Shajara ya kila siku ya kalori za chakula",
  "malaria-risk": "Orodha ya uharaka wa kupima malaria",
  "ovulation-calc": "Kikadiriaji cha dirisha la mzunguko",
  "drug-dosage": "Kikokotoo cha hesabu ya dozi ya dawa",
  "water-quality": "Karatasi ya matokeo ya kipimo cha maji ya kunywa",
  "water-intake": "Kumbukumbu binafsi ya maji unayokunywa",
  "vaccine-schedule": "Mwongozo wa programu za chanjo",
  "waist-hip-ratio": "Kipimo cha uwiano wa kiuno na nyonga",
  "blood-pressure": "Ukaguzi wa kipimo cha shinikizo la damu",
  "hospital-cost": "Bajeti ya nukuu ya huduma za hospitali",
  "clinic-costs": "Bajeti ya ziara na ufuatiliaji wa kliniki",
  "pharmacy-prices": "Kilinganishi cha nukuu ya kifurushi cha dawa",
  "sickle-cell": "Kielelezo cha urithi wa selimundu",
  "diabetes-risk": "Maandalizi ya uchunguzi wa kabla ya kisukari",
  "bmi-calc-tools": "Kikokotoo cha BMI ya mtu mzima",
  "calorie-counter-tools": "Kikadiriaji cha kalori za chakula kimoja",
  "due-date-tools": "Kikadiriaji cha tarehe za ujauzito",
  "genotype-checker": "Mwongozo wa kuthibitisha matokeo ya hemoglobini",
  "blood-group": "Marejeo ya uoanifu wa vijenzi vya damu",
  "maternal-mortality": "Mwongozo wa maandalizi ya afya ya uzazi",
  "childbirth-cost": "Bajeti ya kujifungua kutoka kwenye nukuu",
  "csection-vs-natural": "Maandalizi ya maswali kuhusu njia za kujifungua",
  "dental-cost": "Bajeti ya huduma ya meno kutoka kwenye nukuu",
  "drug-price-compare": "Kilinganishi cha nukuu za dawa ileile",
  "traditional-vs-western": "Kilinganishi cha gharama na mipango miwili ya matibabu",
  "african-meal-plan": "Mpangaji wa milo na bajeti",
  "child-growth": "Marejeo ya WHO ya ukuaji wa mtoto",
  "hiv-treatment-cost": "Karatasi binafsi ya gharama za huduma ya VVU",
  "tb-tracker": "Kifuatiliaji binafsi cha tarehe za huduma ya kifua kikuu",
  "cholera-risk": "Orodha ya uharaka wa kipindupindu",
  "ebola-checklist": "Orodha ya mfiduo wa Ebola na afya ya umma",
  "hep-b-screening": "Njia ya uchunguzi na chanjo ya hepatitis B",
  "medical-tourism": "Bajeti ya safari ya matibabu",
  "eye-care-cost": "Bajeti ya huduma ya macho kutoka kwenye nukuu",
  "mental-health-cost": "Mpangaji wa gharama za msaada wa afya ya akili",
  "pregnancy-nutrition": "Mpangaji wa aina mbalimbali za chakula wakati wa ujauzito",
  "breastfeeding-tracker": "Shajara binafsi ya kunyonyesha na nepi",
  "gym-cost-compare": "Kilinganishi cha nukuu za gym",
  "home-workout": "Mpangaji wa mazoezi ya nyumbani"
};

const manual = {
  "AfroTools": "AfroTools",
  "Health & Wellness": "Afya na Ustawi",
  "Home": "Nyumbani",
  "Tools": "Zana",
  "All tools": "Zana zote",
  "All Tools": "Zana zote",
  "Health": "Afya",
  "Health tools": "Zana za afya",
  "Dark mode": "Hali ya giza",
  "Download PDF": "Pakua PDF",
  "Download TXT": "Pakua TXT",
  "Upload image": "Pakia picha",
  "Upload PDF": "Pakia PDF",
  "Upload and privacy boundaries": "Mipaka ya upakiaji na faragha",
  "No upload by default": "Hakuna upakiaji kwa chaguo-msingi",
  "Can I upload a photo of my lab report?": "Je, ninaweza kupakia picha ya ripoti yangu ya maabara?",
  "&#x1FA78; CBC": "&#x1FA78; CBC",
  "Clear": "Futa",
  "Reset": "Weka upya",
  "Calculate": "Kokotoa",
  "Privacy": "Faragha",
  "Sources": "Vyanzo",
  "Related tools": "Zana zinazohusiana",
  "Related AfroTools": "Zana nyingine za AfroTools",
  "Frequently Asked Questions": "Maswali yanayoulizwa mara kwa mara",
  "Do not wait for this tool.": "Usisubiri zana hii.",
  "Do not wait for this checklist.": "Usisubiri orodha hii.",
  "Educational use only \u2014 not a diagnosis or medical advice.": "Kwa elimu pekee — si utambuzi wala ushauri wa matibabu.",
  "This tool does not diagnose, treat, confirm health, or replace professional medical advice.": "Zana hii haitambui ugonjwa, haitibu, haithibitishi afya, wala haichukui nafasi ya ushauri wa mtaalamu wa afya.",
  "No diagnosis": "Hakuna utambuzi",
  "No upload": "Hakuna upakiaji",
  "No account": "Hakuna akaunti",
  "Runs in this browser": "Hufanya kazi kwenye kivinjari hiki",
  "Save on this device": "Hifadhi kwenye kifaa hiki",
  "Print / save PDF": "Chapisha / hifadhi PDF",
  "Print or save as PDF": "Chapisha au hifadhi kama PDF",
  "Light mode": "Hali ya mwanga",
  "Quoted gross": "Jumla ya nukuu",
  "Buffer": "Akiba ya bajeti",
  "Why:": "Kwa nini:",
  "Warning:": "Onyo:",
  "Complete the checklist. A negative or low-concern result cannot rule out malaria.": "Kamilisha orodha. Jibu hasi au la wasiwasi mdogo haliwezi kuondoa uwezekano wa malaria.",
  "Clinic Visit & Follow-up Cost Planner | AfroTools": "Bajeti ya ziara na ufuatiliaji wa kliniki | AfroTools",
  "Medicine quote compare": "Linganisha bei za dawa ileile",
  "Both exports are created locally without an account, email, or upload.": "Faili zote mbili huundwa kwenye kifaa bila akaunti, barua pepe au upakiaji.",
  "All entries remain in this browser page. Nothing is stored, uploaded, placed in the URL, sent to analytics or transmitted to a server. TXT and print/PDF are direct local exports.": "Maingizo yote hubaki kwenye ukurasa huu wa kivinjari. Hakuna kinachohifadhiwa, kupakiwa, kuwekwa kwenye URL, kutumwa kwa analytics au kutumwa kwa seva. Faili za TXT na chapisho/PDF huundwa moja kwa moja kwenye kifaa.",
  "this page processes selections in memory only. It does not save health inputs, add them to URLs, sync them to an account, email them, or send them to analytics. TXT and print-to-PDF exports are local and ungated.": "ukurasa huu huchakata chaguo kwenye kumbukumbu pekee. Hauhifadhi maingizo ya afya, kuyaweka kwenye URL, kuyasawazisha na akaunti, kuyatuma kwa barua pepe au kuyatuma kwa analytics. Faili za TXT na chapisho-kwa-PDF huundwa kwenye kifaa na hazihitaji akaunti."
};

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeRoute(route) {
  const clean = String(route || "").split(/[?#]/)[0].replace(/\/+/g, "/");
  return clean === "/" ? "/" : "/" + clean.replace(/^\/+|\/+$/g, "");
}

function englishFile(route) {
  const clean = normalizeRoute(route).replace(/^\//, "");
  const index = path.join(ROOT, clean, "index.html");
  if (fs.existsSync(index)) return index;
  return path.join(ROOT, clean + ".html");
}

function absoluteAppScript(src, englishRoute) {
  if (!src || /^(?:https?:)?\/\//i.test(src) || src.startsWith("/assets/")) return src;
  if (src.startsWith("/")) return src;
  return normalizeRoute(englishRoute) + "/" + src.replace(/^\.\//, "");
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function clipWords(value, limit) {
  const text = cleanText(value);
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit + 1).replace(/\s+\S*$/, "").replace(/[,:;–—-]\s*$/, "").trim();
  return (clipped || text.slice(0, limit).trim()).replace(/[.!?]?$/, "…");
}

function isTranslatable(value) {
  const text = cleanText(value);
  if (text.length < 2 || text.length > 900 || !/[A-Za-z]{2}/.test(text)) return false;
  if (/___SW_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(text)) return false;
  if (/^(?:https?:|\/|#|\.|[A-Z0-9_-]{2,})/.test(text) && !/\s/.test(text)) return false;
  if (/^(?:GET|POST|PUT|PATCH|DELETE|application\/|text\/|image\/|[a-z]+_[a-z_]+)$/i.test(text)) return false;
  return true;
}

function protectedBlocks(html, callback) {
  const blocks = [];
  const protectedHtml = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, (block) => {
    const token = `___SW_HEALTH_PROTECTED_${blocks.length}___`;
    blocks.push(block);
    return token;
  });
  const changed = callback(protectedHtml);
  return changed.replace(/___SW_HEALTH_PROTECTED_(\d+)___/g, (_all, index) => blocks[Number(index)]);
}

function collectVisibleStrings(html) {
  const strings = new Set();
  protectedBlocks(html, (body) => {
    body.split(/(<[^>]+>)/g).forEach((part) => {
      if (!part || part.startsWith("<")) return;
      const value = cleanText(part);
      if (/___SW_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(value)) return;
      if (isTranslatable(value)) strings.add(value);
    });
    body.replace(/\b(?:aria-label|placeholder|title|alt|content)=("([^"]*)"|'([^']*)')/gi, (_all, _quoted, double, single) => {
      const value = cleanText(double == null ? single : double);
      if (isTranslatable(value) && !/^(?:width=device|index,|summary_|website$)/i.test(value)) strings.add(value);
      return _all;
    });
    return body;
  });
  return strings;
}

function collectScriptStrings(html, englishRoute) {
  const strings = new Set();
  const sources = [];
  html.replace(/<script\b[^>]*\bsrc=("([^"]+)"|'([^']+)')[^>]*>/gi, (_all, _q, double, single) => {
    const src = absoluteAppScript(double == null ? single : double, englishRoute).split("?")[0];
    if (src.startsWith("/assets/") || /^(?:https?:)?\/\//.test(src)) return _all;
    const file = path.join(ROOT, src.replace(/^\//, ""));
    if (fs.existsSync(file)) sources.push(fs.readFileSync(file, "utf8"));
    return _all;
  });
  html.replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi, (_all, source) => {
    if (source.trim()) sources.push(source);
    return _all;
  });
  sources.forEach((source) => {
    source.replace(/(["'`])((?:\\.|(?!\1)[\s\S]){3,600})\1/g, (_all, _quote, raw) => {
      const value = cleanText(raw.replace(/\\n/g, " ").replace(/\\(["'`])/g, "$1"));
      if (!isTranslatable(value) || !/\s/.test(value)) return _all;
      if (/^(?:[#.\[]|data-|aria-|health-|afro|application\/|text\/|image\/)/i.test(value)) return _all;
      if (/[{}();]|=>|===|querySelector|localStorage|addEventListener|classList|innerHTML/.test(value)) return _all;
      strings.add(value);
      return _all;
    });
  });
  return strings;
}

function marker(index) {
  return `___AFROSEG_${String(index).padStart(4, "0")}___`;
}

async function translateChunk(items) {
  const joined = items.map((item, index) => marker(index) + "\n" + item).join("\n");
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sw&dt=t&q="
    + encodeURIComponent(joined);
  const response = await fetch(url, { headers: { "User-Agent": "AfroTools-Swahili-Health-Parity/1.0" } });
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const data = await response.json();
  const translated = (data[0] || []).map((row) => row[0] || "").join("");
  const parts = translated.split(/___AFROSEG_(\d{4})___\s*/g);
  const result = new Array(items.length);
  for (let index = 1; index < parts.length; index += 2) {
    result[Number(parts[index])] = String(parts[index + 1] || "").trim();
  }
  if (result.some((value) => !value)) throw new Error("Translation batch markers were not preserved.");
  return result;
}

async function populateCache(strings, cache) {
  const pending = [...strings].filter((value) => !cache[value]).sort((a, b) => a.localeCompare(b));
  let chunk = [];
  let length = 0;
  const chunks = [];
  pending.forEach((value) => {
    if (chunk.length && (length + value.length > 2800 || chunk.length >= 24)) {
      chunks.push(chunk);
      chunk = [];
      length = 0;
    }
    chunk.push(value);
    length += value.length + 24;
  });
  if (chunk.length) chunks.push(chunk);
  for (let index = 0; index < chunks.length; index += 1) {
    const items = chunks[index];
    let translations;
    try {
      translations = await translateChunk(items);
    } catch (error) {
      translations = [];
      for (const item of items) {
        const single = await translateChunk([item]);
        translations.push(single[0]);
      }
    }
    items.forEach((item, itemIndex) => {
      cache[item] = translations[itemIndex];
    });
    process.stdout.write(`Translated ${Math.min(pending.length, (index + 1) * 24)}/${pending.length}\r`);
  }
  if (pending.length) process.stdout.write("\n");
}

function postCorrectSwahili(value) {
  return String(value || "")
    .replace(/\bAfro(?:Zana|Tools tools)\b/gi, "AfroTools")
    .replace(/\bBMI\s+ya\s+mwili\b/gi, "BMI");
}

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value, quote) {
  let result = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  result = quote === '"' ? result.replace(/"/g, "&quot;") : result.replace(/'/g, "&#39;");
  return result;
}

function translateStatic(html, cache) {
  return protectedBlocks(html, (body) => {
    let result = body.split(/(<[^>]+>)/g).map((part) => {
      if (!part || part.startsWith("<")) return part;
      const clean = cleanText(part);
      if (/___SW_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(clean)) return part;
      if (!clean || !cache[clean]) return part;
      const leading = part.match(/^\s*/)[0];
      const trailing = part.match(/\s*$/)[0];
      return leading + escapeText(cache[clean]) + trailing;
    }).join("");
    result = result.replace(/\b(aria-label|placeholder|title|alt|data-name|data-desc)=("([^"]*)"|'([^']*)')/gi, (all, name, quoted, double, single) => {
      const quote = quoted[0];
      const value = double == null ? single : double;
      const clean = cleanText(value);
      return cache[clean] ? `${name}=${quote}${escapeAttribute(cache[clean], quote)}${quote}` : all;
    });
    return result;
  });
}

function removeJsonLd(html) {
  return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

function replaceHeadMetadata(html, row, title, description) {
  const canonical = "https://afrotools.com" + normalizeRoute(row.primarySwahiliRoute) + "/";
  const english = "https://afrotools.com" + normalizeRoute(row.englishRoute) + "/";
  const seoTitle = `${clipWords(title, 51)} | AfroTools`;
  const inheritedLanguageLinks = [];
  html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel=["'][^"']*\balternate\b[^"']*["']/i.test(tag)) return tag;
    const language = (tag.match(/\bhreflang=["']([^"']+)["']/i) || [])[1];
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (!language || !href || /^(?:en|sw|x-default)$/i.test(language)) return tag;
    inheritedLanguageLinks.push(`<link rel="alternate" hreflang="${escapeAttribute(language, '"')}" href="${escapeAttribute(href, '"')}">`);
    return tag;
  });
  let result = html
    .replace(/<html\b([^>]*)\blang=["'][^"']*["']([^>]*)>/i, `<html$1lang="sw"$2 data-sw-health-source="${row.englishId}">`)
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeText(seoTitle)}</title>`)
    .replace(/<meta\b[^>]*\bname=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttribute(description, '"')}">`)
    .replace(/<meta\b[^>]*\bproperty=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttribute(seoTitle, '"')}">`)
    .replace(/<meta\b[^>]*\bproperty=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttribute(description, '"')}">`)
    .replace(/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta\b[^>]*\bname=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttribute(seoTitle, '"')}">`)
    .replace(/<meta\b[^>]*\bname=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttribute(description, '"')}">`)
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*\brel=["']alternate["'][^>]*>\s*/gi, "");
  const languageLinks = [
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="en" href="${english}">`,
    `<link rel="alternate" hreflang="sw" href="${canonical}">`,
    ...new Set(inheritedLanguageLinks),
    `<link rel="alternate" hreflang="x-default" href="${english}">`
  ].join("\n");
  return result.replace("</head>", `${languageLinks}\n</head>`);
}

function rewriteAppScripts(html, englishRoute) {
  const placeholders = [];
  let protectedHtml = html.replace(/<script\b[^>]*\bsrc=("([^"]+)"|'([^']+)')[^>]*><\/script>/gi, (tag, _quoted, double, single) => {
    const src = double == null ? single : double;
    const absolute = absoluteAppScript(src, englishRoute);
    const changed = tag.replace(src, absolute);
    const token = `___SW_HEALTH_SCRIPT_TAG_${placeholders.length}___`;
    placeholders.push(changed);
    return token;
  });
  protectedHtml = protectedHtml.replace(/<link\b(?=[^>]*\brel=["'][^"']*\bstylesheet\b[^"']*["'])[^>]*\bhref=("([^"]+)"|'([^']+)')[^>]*>/gi, (tag, _quoted, double, single) => {
    const href = double == null ? single : double;
    const absolute = absoluteAppScript(href, englishRoute);
    const changed = tag.replace(href, absolute);
    const token = `___SW_HEALTH_SCRIPT_TAG_${placeholders.length}___`;
    placeholders.push(changed);
    return token;
  });
  return {
    html: protectedHtml,
    restore(value) {
      return value.replace(/___SW_HEALTH_SCRIPT_TAG_(\d+)___/g, (_all, index) => placeholders[Number(index)]);
    }
  };
}

function mapInternalRoutes(html, routeMap) {
  let result = html;
  [...routeMap.entries()].sort((a, b) => b[0].length - a[0].length).forEach(([english, swahili]) => {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`https://afrotools\\.com${escaped}(?=[/'"?#<])`, "g"), `https://afrotools.com${swahili}`);
    result = result.replace(new RegExp(`(["'])${escaped}(?=[/'"?#])`, "g"), `$1${swahili}`);
  });
  return result;
}

function schema(title, description, route) {
  const url = "https://afrotools.com" + normalizeRoute(route) + "/";
  const data = [
    { "@context": "https://schema.org", "@type": "WebApplication", name: title, description, url, inLanguage: "sw", applicationCategory: "HealthApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, provider: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" } },
    { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "sw", mainEntity: [
      { "@type": "Question", name: "Je, zana hii hutambua ugonjwa au kupendekeza matibabu?", acceptedAnswer: { "@type": "Answer", text: "Hapana. Hupanga taarifa au kufanya hesabu yenye mipaka. Mtaalamu wa afya, maabara, famasia au huduma ya dharura ndiyo yenye mamlaka ya uamuzi wa matibabu." } },
      { "@type": "Question", name: "Nifanye nini hali ikiwa ya dharura au matokeo yananitia wasiwasi?", acceptedAnswer: { "@type": "Answer", text: "Usisubiri matokeo ya zana hii. Wasiliana na huduma ya dharura, kliniki, kituo cha uzazi, kituo cha sumu au mamlaka ya afya ya umma inayopatikana nchini kwako kulingana na hali." } }
    ] }
  ];
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function safetySection(title, englishRoute) {
  return [
    `<section class="sw-health-safety" data-sw-health-safety data-tool-verification-panel aria-labelledby="sw-health-safety-title">`,
    `<h2 id="sw-health-safety-title">Mbinu, usalama na faragha</h2>`,
    `<p><strong>Upeo:</strong> ${escapeText(title)} hutumia injini ileile iliyothibitishwa kwenye ukurasa wa Kiingereza, ikiwa na kiolesura na matokeo ya Kiswahili. Haitambui ugonjwa, haiagizi matibabu, wala haichukui nafasi ya mtaalamu wa afya au huduma ya dharura.</p>`,
    `<p><strong>Faragha:</strong> taarifa za afya unazoingiza hubaki kwenye kivinjari hiki katika njia kuu ya matumizi. Ripoti huundwa kwenye kifaa. Huduma yoyote ya hiari ya mtandao lazima iombe ridhaa ya wazi na ionyeshe taarifa zitakazotumwa.</p>`,
    `<p><strong>Uthibitishaji:</strong> thibitisha matokeo, tarehe, dozi, vipimo, gharama na maelekezo na mtaalamu, maabara, mfamasia, kituo au programu rasmi ya kitaifa. Angalia pia <a href="https://www.who.int/health-topics" rel="noopener">mada rasmi za afya za WHO</a>.</p>`,
    `<p class="sw-health-source-note">Injini ya marejeo: <a href="${englishRoute}/" hreflang="en">${englishRoute}/</a>. Vyanzo na mipaka maalumu ya programu hii vimeonyeshwa kwenye ukurasa.</p>`,
    `</section>`
  ].join("");
}

function style(row) {
  const reflowOverflowGuard = ["calorie-counter", "due-date-tools", "pharmacy-prices", "drug-price-compare", "traditional-vs-western", "gym-cost-compare"].includes(row.englishId)
    ? `html[data-sw-health-source="${row.englishId}"]{overflow-x:clip}`
    : "";
  return `<style data-sw-health-parity-style>
.sw-health-safety{max-width:1080px;margin:24px auto;padding:18px;border:1px solid #cbd5e1;border-radius:14px;background:#f8fafc;color:#334155;line-height:1.65}.sw-health-safety h2{margin:0 0 10px;color:#0f172a;font-size:1.25rem}.sw-health-safety p{margin:.55rem 0}.sw-health-safety a{color:#0057b8;font-weight:700}[data-theme="dark"] .sw-health-safety{background:#111c2d;border-color:#40516a;color:#d7e1ec}[data-theme="dark"] .sw-health-safety h2{color:#f8fafc}${reflowOverflowGuard}@media(max-width:640px){.sw-health-safety{margin:18px 12px;padding:15px}.sw-health-safety p{overflow-wrap:anywhere}}@media(prefers-reduced-motion:reduce){.sw-health-safety *{transition:none!important;animation:none!important}}
</style>`;
}

function pageDictionary(strings, cache) {
  const result = {};
  strings.forEach((key) => {
    if (cache[key] && cache[key] !== key) result[key] = postCorrectSwahili(cache[key]);
  });
  Object.assign(result, manual);
  return result;
}

function localizeMedicalReportRuntime(html, englishId) {
  return html;
}

function buildPage(row, cache, routeMap) {
  const source = fs.readFileSync(englishFile(row.englishRoute), "utf8");
  const strings = new Set([...collectVisibleStrings(source), ...collectScriptStrings(source, row.englishRoute)]);
  const title = titleById[row.englishId] || cache[row.englishName] || row.englishName;
  const englishDescription = (source.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || []);
  const descriptionSource = cleanText(englishDescription[2] == null ? englishDescription[3] : englishDescription[2]);
  const description = clipWords(cache[descriptionSource] || `Zana ya afya ya Kiswahili ya ${title.toLowerCase()}, yenye hesabu ya ndani, mipaka iliyo wazi na vyanzo vya kuthibitisha.`, 165);
  const scripts = rewriteAppScripts(source, row.englishRoute);
  let html = removeJsonLd(scripts.html);
  html = mapInternalRoutes(html, routeMap);
  html = scripts.restore(html);
  html = localizeMedicalReportRuntime(html, row.englishId);
  html = translateStatic(html, cache);
  html = html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${escapeText(title)}</h1>`);
  html = replaceHeadMetadata(html, row, title, description);
  html = html
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "")
    .replace(/<noscript>\s*<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>\s*<\/noscript>\s*/gi, "");
  if (!/\/assets\/fonts\/typography\.css/.test(html)) {
    html = html.replace("</head>", `<link rel="stylesheet" href="/assets/fonts/typography.css?v=2f0aa84f">\n</head>`);
  }
  const dictionary = pageDictionary(strings, cache);
  const payload = `<script type="application/json" id="sw-health-translations">${JSON.stringify(dictionary).replace(/</g, "\\u003c")}</script><script src="${RUNTIME}" defer></script>`;
  const additions = `${schema(title, description, row.primarySwahiliRoute)}\n${style(row)}\n${payload}`;
  html = html.replace("</head>", `${additions}\n</head>`);
  const safety = safetySection(title, normalizeRoute(row.englishRoute));
  html = html.includes("</main>") ? html.replace("</main>", `${safety}</main>`) : html.replace("</body>", `${safety}</body>`);
  return `<!-- Swahili Health parity owner: scripts/build-swahili-health-parity.js; English engine preserved. -->\n${html}`;
}

function buildHub(rows, cache) {
  const groups = [
    { title: "Vipimo, kinga na ufuatiliaji", description: "Panga vipimo, elewa mipaka ya matokeo na andaa maswali ya kumuuliza mtaalamu wa afya.", ids: ["bmi-calculator", "bmi-calc-tools", "waist-hip-ratio", "blood-pressure", "diabetes-risk", "water-intake", "water-quality", "malaria-risk"] },
    { title: "Ujauzito, kujifungua na afya ya mtoto", description: "Kalenda na maandalizi ambayo hayachukui nafasi ya kituo cha uzazi, mkunga au huduma ya watoto.", ids: ["due-date", "due-date-tools", "ovulation-calc", "maternal-mortality", "childbirth-cost", "csection-vs-natural", "pregnancy-nutrition", "child-growth", "breastfeeding-tracker", "vaccine-schedule"] },
    { title: "Vipimo vya maabara, dawa na maambukizi", description: "Njia za tahadhari za kupanga uthibitishaji na kutambua wakati wa kwenda moja kwa moja kwa huduma ya afya.", ids: ["medical-report", "genotype-checker", "blood-group", "sickle-cell", "drug-dosage", "hiv-treatment-cost", "tb-tracker", "cholera-risk", "ebola-checklist", "hep-b-screening"] },
    { title: "Gharama, nukuu na upatikanaji wa huduma", description: "Bajeti zinazotumia nukuu na makadirio unayoingiza, bila bei bandia za moja kwa moja wala ahadi ya bima.", ids: ["hospital-cost", "clinic-costs", "pharmacy-prices", "drug-price-compare", "dental-cost", "eye-care-cost", "mental-health-cost", "traditional-vs-western", "medical-tourism"] },
    { title: "Lishe na shughuli za mwili", description: "Shajara na mipango ya ndani kwa chaguo zako, bila kuagiza lishe au kuweka lengo la matibabu.", ids: ["calorie-counter", "calorie-counter-tools", "african-meal-plan", "gym-cost-compare", "home-workout"] }
  ];
  const rowById = new Map(rows.map((row) => [row.englishId, row]));
  const seen = [];
  const sections = groups.map((group) => {
    const cards = group.ids.map((id) => {
      const row = rowById.get(id); if (!row) throw new Error(`Unknown Health id: ${id}`); seen.push(id);
      const title = titleById[id]; const english = fs.readFileSync(englishFile(row.englishRoute), "utf8");
      const descriptionMatch = english.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || [];
      const descriptionSource = cleanText(descriptionMatch[2] == null ? descriptionMatch[3] : descriptionMatch[2]);
      const description = cache[descriptionSource] || "Zana ya bure inayofanya kazi kwenye kifaa, yenye mipaka wazi na uthibitishaji wa kitaalamu.";
      const imageMatch = english.match(/<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || [];
      const image = imageMatch[2] == null ? imageMatch[3] : imageMatch[2];
      return `<article class="swh-card"><a href="${normalizeRoute(row.primarySwahiliRoute)}/"><img src="${escapeAttribute(image || "https://afrotools.com/assets/img/og-default.png", '"')}" alt="" width="800" height="450" loading="lazy"><span class="swh-card-body"><strong>${escapeText(title)}</strong><span>${escapeText(description)}</span><em>Fungua zana</em></span></a></article>`;
    }).join("");
    return `<section class="swh-group" aria-labelledby="swh-${group.ids[0]}"><div class="swh-group-head"><p>Njia ya afya</p><h2 id="swh-${group.ids[0]}">${group.title}</h2><span>${group.description}</span></div><div class="swh-grid">${cards}</div></section>`;
  }).join("");
  if (new Set(seen).size !== 42 || seen.length !== 42) throw new Error(`Swahili Health hub must list 42 unique apps; found ${new Set(seen).size}/${seen.length}.`);
  const itemList = rows.map((row,index)=>({"@type":"ListItem",position:index+1,name:titleById[row.englishId],url:"https://afrotools.com"+normalizeRoute(row.primarySwahiliRoute)+"/"}));
  const structured=[{"@context":"https://schema.org","@type":"CollectionPage",name:"Zana za afya na ustawi kwa Kiswahili",description:"Programu 42 za bure za Kiswahili za kupanga vipimo, tarehe, maswali na bajeti za afya bila utambuzi au maagizo ya matibabu.",url:"https://afrotools.com/sw/afya/",inLanguage:"sw",isPartOf:{"@type":"WebSite",name:"AfroTools",url:"https://afrotools.com/"},mainEntity:{"@type":"ItemList",numberOfItems:42,itemListElement:itemList}},{"@context":"https://schema.org","@type":"FAQPage",inLanguage:"sw",mainEntity:[{"@type":"Question",name:"Je, zana za afya za AfroTools hutambua ugonjwa?",acceptedAnswer:{"@type":"Answer",text:"Hapana. Hupanga kipimo, kalenda, nukuu au maswali. Mtaalamu wa afya, maabara, mfamasia au huduma ya dharura ndiyo yenye mamlaka."}},{"@type":"Question",name:"Je, taarifa za afya hutumwa kwa seva?",acceptedAnswer:{"@type":"Answer",text:"Njia kuu hufanya kazi ndani ya kivinjari. Huduma ya hiari ya mtandao lazima iombe ridhaa ya wazi na kueleza taarifa zitakazotumwa."}}]}];
  return `<!doctype html>
<html lang="sw" data-chat-bundle="/assets/js/bundles/chat.88bd45ff.min.js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zana 42 za afya kwa Kiswahili | AfroTools</title><meta name="description" content="Tumia programu 42 za afya kwa Kiswahili kwa vipimo, ujauzito, maabara, kinga, gharama, lishe na shughuli, zikiwa na mipaka iliyo wazi."><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools"><meta property="og:locale" content="sw_KE"><meta property="og:title" content="Zana 42 za afya kwa Kiswahili | AfroTools"><meta property="og:description" content="Programu kamili za afya kwa Kiswahili, zinazofanya kazi kwenye kifaa na kusaidia maandalizi bila utambuzi au maagizo ya matibabu."><meta property="og:url" content="https://afrotools.com/sw/afya/"><meta property="og:image" content="https://afrotools.com/assets/img/tools/medical-report.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Zana 42 za afya kwa Kiswahili | AfroTools"><meta name="twitter:description" content="Vipimo, ujauzito, maabara, kinga, gharama, lishe na shughuli zenye mipaka ya matibabu iliyo wazi."><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/medical-report.webp"><link rel="stylesheet" href="/assets/fonts/typography.css?v=2f0aa84f"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5"><link rel="canonical" href="https://afrotools.com/sw/afya/"><link rel="alternate" hreflang="en" href="https://afrotools.com/health/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/health/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/afya/"><link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/lafiya/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/health/"><script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script><script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script><script type="application/ld+json">${JSON.stringify(structured)}</script><style>:root{--swh-bg:#f5f8fc;--swh-card:#fff;--swh-text:#0f172a;--swh-muted:#526174;--swh-border:#dbe4ee;--swh-soft:#eaf3ff}[data-theme=dark]{--swh-bg:#0b1220;--swh-card:#111c2d;--swh-text:#f8fafc;--swh-muted:#bdc8d5;--swh-border:#40516a;--swh-soft:#102744}body{margin:0;background:var(--swh-bg);color:var(--swh-text);overflow-x:hidden}.swh-shell{max-width:1180px;margin:auto;padding:0 20px}.swh-hero{background:#071b33;color:#fff;padding:clamp(42px,8vw,86px) 0}.swh-kicker{display:inline-block;color:#8fd3ff;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.swh-hero h1{max-width:900px;margin:12px 0 16px;font-size:clamp(2.3rem,6vw,4.6rem);line-height:1.02}.swh-hero p{max-width:800px;color:#cfdef0;font-size:clamp(1rem,2vw,1.2rem);line-height:1.7}.swh-badges{display:flex;flex-wrap:wrap;gap:9px;margin-top:22px}.swh-badges span{padding:8px 12px;border:1px solid #315273;border-radius:999px;background:#102b49;font-weight:700}.swh-alert{margin:-22px auto 34px;position:relative;padding:18px 20px;border:1px solid #eab308;border-radius:14px;background:#fff9df;color:#713f12}.swh-main{padding:42px 0 72px}.swh-group{margin:0 0 48px}.swh-group-head{max-width:760px;margin-bottom:18px}.swh-group-head p{margin:0 0 6px;color:#08786f;font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}.swh-group-head h2{margin:0 0 8px;font-size:clamp(1.55rem,3vw,2.2rem)}.swh-group-head span{color:var(--swh-muted);line-height:1.65}.swh-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.swh-card{min-width:0;border:1px solid var(--swh-border);border-radius:16px;overflow:hidden;background:var(--swh-card)}.swh-card a{display:block;height:100%;color:inherit;text-decoration:none}.swh-card img{display:block;width:100%;height:142px;object-fit:cover;background:var(--swh-soft)}.swh-card-body{display:flex;flex-direction:column;gap:8px;padding:16px}.swh-card strong{font-size:1.03rem;line-height:1.3}.swh-card span span{color:var(--swh-muted);line-height:1.55;font-size:.91rem}.swh-card em{margin-top:auto;color:#005fbe;font-style:normal;font-weight:800}.swh-card a:focus-visible{outline:3px solid #f59e0b;outline-offset:-3px}.swh-proof{padding:24px;border:1px solid var(--swh-border);border-radius:18px;background:var(--swh-card)}.swh-proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.swh-proof-grid div{padding:14px;border-left:4px solid #0f766e;background:var(--swh-soft);border-radius:8px}.swh-proof p{color:var(--swh-muted);line-height:1.65}@media(max-width:860px){.swh-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.swh-proof-grid{grid-template-columns:1fr}}@media(max-width:560px){.swh-shell{padding:0 14px}.swh-grid{grid-template-columns:1fr}.swh-card img{height:128px}.swh-hero{padding:44px 0 58px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}</style></head><body><afro-navbar active="health"></afro-navbar><header class="swh-hero"><div class="swh-shell"><span class="swh-kicker">Afya na ustawi - Kiswahili</span><h1>Zana 42 zenye kiwango sawa na programu za Kiingereza</h1><p>Pima, panga, linganisha na andaa maswali yako kwa Kiswahili. Kurasa hutumia injini zilezile zilizothibitishwa za Kiingereza, huku kiolesura, matokeo, mipaka, vyanzo na ripoti zikiwa za Kiswahili.</p><div class="swh-badges"><span>Programu 42 za bure</span><span>Hufanya kazi kwenye kifaa</span><span>Hakuna utambuzi</span><span>Simu na hali ya giza</span></div></div></header><main class="swh-main"><div class="swh-shell"><aside class="swh-alert" role="note"><strong>Dharura ya matibabu inatangulia hesabu yoyote.</strong> Usisubiri zana ikiwa kuna shida ya kupumua, maumivu ya kifua, kuchanganyikiwa, degedege, damu nyingi, upungufu mkubwa wa maji, mzio mkali, tatizo la ujauzito au hali inayozidi haraka. Wasiliana na huduma ya dharura inayopatikana.</aside>${sections}<section class="swh-proof" data-tool-verification-panel><h2>Mpaka wazi kwa kila programu</h2><div class="swh-proof-grid"><div><strong>Injini zilezile</strong><p>Kurasa za Kiswahili hutumia injini zilezile zilizothibitishwa. Vipimo na kanuni hazitafsiriwi upya wala kubuniwa upya.</p></div><div><strong>Faragha</strong><p>Taarifa za afya hubaki kwenye kivinjari katika njia kuu. Ripoti huundwa kwenye kifaa na huduma ya hiari ya mtandao haiwezi kutuma taarifa bila ridhaa ya wazi.</p></div><div><strong>Mamlaka</strong><p>Matokeo husaidia kuandaa mazungumzo. Mtaalamu wa afya, maabara, mfamasia, kituo, programu ya kitaifa au huduma ya dharura ndiyo yenye mamlaka.</p></div></div></section></div></main><afro-footer></afro-footer><script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script></body></html>`;
}

function addSwahiliOwner(row) {
  const owner = MISSING_ROUTE_OWNERS[row.englishId];
  if (!owner) return row;
  return Object.assign({}, row, { primarySwahiliRoute: owner[0], primarySwahiliFile: owner[1], state: "native-candidate" });
}

function syncEnglishHreflang(row) {
  const file = englishFile(row.englishRoute); const current = fs.readFileSync(file, "utf8");
  const canonical = "https://afrotools.com" + normalizeRoute(row.primarySwahiliRoute) + "/";
  if (current.includes(`hreflang="sw" href="${canonical}"`)) return false;
  const link = `<link rel="alternate" hreflang="sw" href="${canonical}">
`;
  let next = current.replace(/(<link\b[^>]*\brel=["']alternate["'][^>]*\bhreflang=["']x-default["'][^>]*>)/i, link + "$1");
  if (next === current) next = current.replace("</head>", link + "</head>");
  if (next === current) throw new Error(`${row.englishId}: English owner has no head insertion point`);
  if (WRITE) fs.writeFileSync(file, next); return true;
}

function localRouteFile(route) {
  const clean = normalizeRoute(route).replace(/^\//, "");
  const index = path.join(ROOT, clean, "index.html");
  return fs.existsSync(index) ? index : path.join(ROOT, clean + ".html");
}

function syncSiblingHreflangs(row) {
  const english = fs.readFileSync(englishFile(row.englishRoute), "utf8");
  const swUrl = "https://afrotools.com" + normalizeRoute(row.primarySwahiliRoute) + "/";
  const targets = [];
  english.replace(/<link\b[^>]*\brel=["']alternate["'][^>]*>/gi, (tag) => {
    const language = (tag.match(/\bhreflang=["']([^"']+)["']/i) || [])[1];
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (!language || !href || /^(?:en|sw|x-default)$/i.test(language)) return tag;
    if (!href.startsWith("https://afrotools.com/")) return tag;
    targets.push({ language, route: new URL(href).pathname });
    return tag;
  });
  const changed = [];
  for (const target of targets) {
    const file = localRouteFile(target.route);
    if (!fs.existsSync(file)) throw new Error(`${row.englishId}: missing ${target.language} sibling ${target.route}`);
    const current = fs.readFileSync(file, "utf8");
    if (current.includes(`hreflang="sw" href="${swUrl}"`) || current.includes(`hreflang='sw' href='${swUrl}'`)) continue;
    const link = `<link rel="alternate" hreflang="sw" href="${swUrl}">\n`;
    let next = current.replace(/(<link\b[^>]*\brel=["']alternate["'][^>]*\bhreflang=["']x-default["'][^>]*>)/i, link + "$1");
    if (next === current) next = current.replace("</head>", link + "</head>");
    if (next === current) throw new Error(`${row.englishId}: ${target.language} sibling has no head insertion point`);
    if (WRITE) fs.writeFileSync(file, next);
    changed.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  }
  return changed;
}

async function main() {
  const inventory = readJson(INVENTORY, null); if (!inventory) throw new Error("Swahili parity inventory is missing.");
  const rows = inventory.rows.filter((row) => row.categoryKey === "health").map(addSwahiliOwner);
  if (rows.length !== 42) throw new Error(`Expected 42 Health rows; found ${rows.length}.`);
  if (rows.some((row) => !row.primarySwahiliFile || !row.primarySwahiliRoute)) throw new Error("Every Health row must have one Swahili owner route before generation.");
  const manifest = {
    schemaVersion: 1,
    programmeBase: "0f6990118d9ac8b9dcde446a6ede10a017b9a2db",
    category: "Health & Wellness",
    categoryKey: "health",
    denominator: 42,
    previouslyAccepted: ["waist-hip-ratio"],
    candidateApps: 41,
    owner: "scripts/build-swahili-health-parity.js",
    rows: rows.map((row) => ({
      id: row.englishId,
      englishRoute: normalizeRoute(row.englishRoute),
      swahiliRoute: normalizeRoute(row.primarySwahiliRoute),
      swahiliFile: row.primarySwahiliFile,
      generation: SKIP_GENERATION.has(row.englishId) ? "preserved-accepted-owner" : "generated-native-owner"
    }))
  };
  const manifestNext = JSON.stringify(manifest, null, 2) + "\n";
  const manifestCurrent = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
  if (WRITE) { fs.mkdirSync(path.dirname(MANIFEST), { recursive: true }); fs.writeFileSync(MANIFEST, manifestNext); }
  const routeMap = new Map(rows.map((row) => [normalizeRoute(row.englishRoute), normalizeRoute(row.primarySwahiliRoute)]));
  const cache = Object.assign({}, readJson(CACHE, {}), manual);
  Object.keys(cache).forEach((key) => { if (/___SW_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(key)) delete cache[key]; else cache[key] = postCorrectSwahili(cache[key]); });
  const strings = new Set(); rows.forEach((row) => { const html=fs.readFileSync(englishFile(row.englishRoute),"utf8"); collectVisibleStrings(html).forEach((value)=>strings.add(value)); collectScriptStrings(html,row.englishRoute).forEach((value)=>strings.add(value)); strings.add(row.englishName); });
  if (REFRESH) await populateCache(strings, cache);
  const missing=[...strings].filter((value)=>!cache[value]); if (missing.length) throw new Error(`${missing.length} Swahili Health strings are not translated. Run with --refresh-translations --write.`);
  const sortedCache=Object.fromEntries(Object.entries(cache).sort((a,b)=>a[0].localeCompare(b[0]))); const changes=[]; const englishReciprocals=[]; const siblingReciprocals=[];
  if (manifestCurrent !== manifestNext) changes.push("data/localization/sw-health-parity-manifest.json");
  rows.forEach((row)=>{ if (SKIP_GENERATION.has(row.englishId)) return; const output=path.join(ROOT,row.primarySwahiliFile); const next=buildPage(row,sortedCache,routeMap); const current=fs.existsSync(output)?fs.readFileSync(output,"utf8"):""; if(current!==next)changes.push(row.primarySwahiliFile); if(WRITE){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,next);} if(syncEnglishHreflang(row)) englishReciprocals.push(path.relative(ROOT,englishFile(row.englishRoute)).replace(/\\/g,"/")); siblingReciprocals.push(...syncSiblingHreflangs(row)); });
  const hubOutput=path.join(ROOT,"sw","afya","index.html"); const hubNext=buildHub(rows,sortedCache); const hubCurrent=fs.existsSync(hubOutput)?fs.readFileSync(hubOutput,"utf8"):""; if(hubCurrent!==hubNext)changes.push("sw/afya/index.html"); if(WRITE)fs.writeFileSync(hubOutput,hubNext);
  const missingArtwork = rows.flatMap((row) => {
    const html = fs.readFileSync(englishFile(row.englishRoute), "utf8");
    const match = html.match(/<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || [];
    const url = match[2] == null ? match[3] : match[2];
    if (!url || !url.startsWith("https://afrotools.com/")) return [{ id: row.englishId, reason: "missing-local-og-url" }];
    const file = path.join(ROOT, url.replace("https://afrotools.com/", ""));
    return fs.existsSync(file) ? [] : [{ id: row.englishId, reason: "missing-file", expected: path.relative(ROOT, file).replace(/\\/g, "/") }];
  });
  const artworkNext = JSON.stringify({ schemaVersion: 1, category: "Health & Wellness", denominator: 42, missingCount: missingArtwork.length, missing: missingArtwork }, null, 2) + "\n";
  const artworkCurrent = fs.existsSync(ARTWORK_REPORT) ? fs.readFileSync(ARTWORK_REPORT, "utf8") : "";
  if (artworkCurrent !== artworkNext) changes.push("reports/sw-health-parity-missing-artwork.json");
  if (WRITE) { fs.mkdirSync(path.dirname(ARTWORK_REPORT), { recursive: true }); fs.writeFileSync(ARTWORK_REPORT, artworkNext); }
  if(WRITE){fs.mkdirSync(path.dirname(CACHE),{recursive:true});fs.writeFileSync(CACHE,JSON.stringify(sortedCache,null,2)+"\n");}
  console.log(JSON.stringify({healthApps:rows.length,preservedAccepted:[...SKIP_GENERATION],generatedApps:41,translatedStrings:Object.keys(sortedCache).length,missingStrings:missing.length,changedPages:changes.filter((f)=>f!=="sw/afya/index.html").length,hubChanged:changes.includes("sw/afya/index.html"),englishReciprocals:englishReciprocals.length,siblingReciprocals:siblingReciprocals.length,mode:WRITE?"write":"check"},null,2));
  if(!WRITE&&(changes.length||englishReciprocals.length||siblingReciprocals.length))process.exitCode=1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
