#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const acorn = require('acorn');
const { apps } = require('./build-swahili-document-pdf-parity.js');
const localizer = require('../assets/js/pages/sw-document-pdf-localizer.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_JSON = path.join(ROOT, 'data/localization/sw-document-pdf-lexicon.json');
const OUTPUT_JS = path.join(ROOT, 'assets/js/pages/sw-document-pdf-lexicon.js');
const FRENCH_LEXICON = path.join(ROOT, 'data/localization/fr-document-pdf-lexicon.json');
const WRITE = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');
const LANGUAGE_IDS = new Set([
  'pdf-workspace', 'pdf-merge-split', 'pdf-image-convert', 'pdf-watermark',
  'pdf-password', 'pdf-page-numbers', 'pdf-ocr', 'pdf-form-filler',
  'pdf-redact', 'pdf-header-footer', 'pdf-convert', 'pdf-reorder',
  'pdf-translate', 'pdf-compare', 'pdf-to-audio', 'pdf-bates',
  'html-to-pdf', 'pdf-find-replace', 'pdf-repair', 'pdf-workflow',
  'cv-builder', 'invoice-generator', 'cover-letter', 'freelance-invoice',
  'pdf-compress', 'pdf-sign', 'pdf-editor', 'pdf-chat',
  'meeting-minutes', 'receipt-generator', 'business-plan'
]);
const ROUTE_OVERRIDES = {
  'pdf-workspace': {
    'What may be sent:': 'Kinachoweza kutumwa:',
    'Nothing is sent to a model.': 'Hakuna chochote kinachotumwa kwa modeli.'
  },
  'pdf-password': {
    'Open Password': 'Nenosiri la Kufungua',
    'Password Tool': 'Zana ya Nenosiri',
    'Password to open': 'Nenosiri la kufungua'
  },
  'cv-builder': {
    'Country Format Advisor': 'Mshauri wa Muundo wa CV kwa Nchi',
    'Changing country updates field suggestions, sensitive-data warnings, language guidance, reference expectations, and recommended templates. Sensitive fields stay optional.': 'Kubadilisha nchi husasisha mapendekezo ya sehemu, maonyo ya taarifa nyeti, mwongozo wa lugha, matarajio ya waamuzi na violezo vinavyopendekezwa. Sehemu nyeti hubaki za hiari.',
    'Photo': 'Picha',
    'Date of birth': 'Tarehe ya kuzaliwa',
    'Marital status': 'Hali ya ndoa',
    'Nationality': 'Uraia',
    'Origin / region': 'Asili / eneo',
    'National ID': 'Kitambulisho cha taifa',
    'Often included': 'Huongezwa mara nyingi',
    'Discouraged': 'Haipendekezwi',
    'Avoid': 'Epuka',
    'Only if requested': 'Ikiombwa tu',
    'References': 'Waamuzi',
    'Templates': 'Violezo',
    'Include photo in this CV': 'Ongeza picha kwenye CV hii',
    'Show personal detail fields': 'Onyesha sehemu za taarifa binafsi',
    'Show state / region of origin field': 'Onyesha sehemu ya jimbo / eneo la asili',
    'Show national ID field': 'Onyesha sehemu ya kitambulisho cha taifa',
    'Hide risky fields': 'Ficha sehemu hatarishi',
    'Manual country field overrides': 'Mabadiliko ya mikono ya sehemu za nchi',
    'Kenya PAYE Tool': 'Zana ya PAYE ya Kenya',
    'Open tool': 'Fungua zana',
    '1-page': 'ukurasa 1',
    '2-page': 'kurasa 2',
    'ATS High': 'ATS: Juu',
    'ATS Medium': 'ATS: Wastani',
    'ATS Low': 'ATS: Chini',
    'Multi-page': 'Kurasa nyingi',
    'Required': 'Inahitajika',
    'City, Country': 'Jiji, Nchi',
    'Generate or write your cover letter here.': 'Tengeneza au andika barua yako ya maombi hapa.',
    'Include personal details (Nigeria format)': 'Ongeza taarifa binafsi (muundo wa Nigeria)',
    'What may be sent:': 'Kinachoweza kutumwa:',
    'Selected private content may be sent to AfroTools servers and a configured model provider.': 'Maudhui binafsi yaliyochaguliwa yanaweza kutumwa kwa seva za AfroTools na mtoa huduma wa modeli aliyesanidiwa.',
    'Fill your name, contact, and summary to open these private next steps. Readiness: 0%.': 'Jaza jina lako, anwani na muhtasari ili kufungua hatua hizi binafsi zinazofuata. Utayari: 0%.'
  },
  'pdf-sign': {
    'Draw, type, upload': 'Chora, andika, pakia',
    'PDF eSignature Tool: How It Works': 'Zana ya Saini ya PDF: Jinsi Inavyofanya Kazi'
  },
  'pdf-editor': {
    '— Add Approved, Reviewed, Confidential, Draft, Paid, or Void labels.': '— Ongeza lebo za Imeidhinishwa, Imekaguliwa, Siri, Rasimu, Imelipwa au Imebatilishwa.',
    '— Click the Download button to save your edited PDF with all changes baked in.': '— Bofya kitufe cha Pakua ili kuhifadhi PDF iliyohaririwa ikiwa na mabadiliko yote.'
  },
  'invoice-generator': {
    'Save a client to reuse billing details.': 'Hifadhi mteja ili utumie tena maelezo ya malipo.',
    'Classic': 'Kawaida',
    'Due on receipt': 'Inalipwa ankara inapopokelewa'
  },
  'freelance-invoice': {
    'City, country': 'Jiji, nchi',
    'Classic': 'Kawaida'
  }
};

function clean(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function markupStrings(html) {
  const values = new Set();
  const markup = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ');
  markup.replace(/>([^<]+)</g, (_, value) => { const text = clean(value); if (text) values.add(text); return _; });
  markup.replace(/\b(?:placeholder|title|aria-label|aria-description|data-name|data-desc|alt)=("([^"]*)"|'([^']*)')/gi,
    (_, quoted, doubleValue, singleValue) => {
      const text = clean(doubleValue == null ? singleValue : doubleValue);
      if (text) values.add(text);
      return _;
    });
  return values;
}

function javascriptStrings(source) {
  const values = new Set();
  const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Literal' && typeof node.value === 'string') values.add(clean(node.value));
    if (node.type === 'TemplateElement' && node.value && node.value.cooked) values.add(clean(node.value.cooked));
    Object.keys(node).forEach((key) => {
      if (key === 'start' || key === 'end') return;
      const value = node[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value);
    });
  };
  visit(ast);
  return values;
}

function cvRuntimeStrings() {
  const values = new Set();
  const directory = path.join(ROOT, 'tools/cv-builder/js');
  fs.readdirSync(directory).filter((file) => file.endsWith('.js')).forEach((file) => {
    javascriptStrings(fs.readFileSync(path.join(directory, file), 'utf8')).forEach((value) => {
      if (value.includes('<')) markupStrings(value).forEach((text) => values.add(text));
      else if (looksDynamicUserFacing(value)) values.add(value);
    });
  });
  return values;
}

function addJavascriptCandidates(source, values) {
  try {
    javascriptStrings(source).forEach((value) => {
      if (value.includes('<')) markupStrings(value).forEach((text) => values.add(text));
      else if (looksDynamicUserFacing(value)) values.add(value);
    });
  } catch (_) {
    // Some legacy inline snippets are intentionally partial; the page markup
    // and maintained external runtime still remain covered.
  }
}

function appRuntimeStrings(html, app) {
  const values = new Set();
  html.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (_, source) => {
    addJavascriptCandidates(source, values);
    return _;
  });
  const routeFolder = path.basename(path.dirname(app.englishFile));
  html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi, (_, source) => {
    const pathname = source.split('?')[0];
    if (!pathname.includes(app.id) && !pathname.includes(routeFolder)) return _;
    const file = path.join(ROOT, pathname.replace(/^\//, ''));
    if (fs.existsSync(file)) addJavascriptCandidates(fs.readFileSync(file, 'utf8'), values);
    return _;
  });
  return values;
}

function looksUserFacing(value) {
  if (!/[A-Za-z]/.test(value) || value.length < 3 || value.length > 2500) return false;
  if (/[{}]|=>|(?:^|\s)(?:const|let|var|return|querySelector|addEventListener)\b/.test(value)) return false;
  if (/^(?:[#.][\w-]+|[\w-]+(?:\s*[,>+~]\s*[#.\w-]+)+)$/.test(value)) return false;
  if (/^(?:https?:|\/|\.\/|\.\.\/|data:|blob:)/i.test(value)) return false;
  if (/^[\w.-]+\.(?:js|css|json|png|jpe?g|webp|svg|woff2?|pdf|zip)$/i.test(value)) return false;
  if (/^[A-Z0-9_:-]+$/.test(value) && value.length > 4) return false;
  if (/^[a-z][a-zA-Z0-9]*(?:[A-Z][a-zA-Z0-9]*)+$/.test(value)) return false;
  if (/^(?:PDF|PNG|JPG|JPEG|DOC|DOCX|TXT|CSV|JSON|ZIP|OCR|HTML|XLSX?|Afro|AfroTools|Pro|QR|ID)$/i.test(value)) return false;
  return true;
}

function translatedLocally(source) {
  const translated = localizer.translate(source);
  if (translated === source) return null;
  if (/\b(?:the|and|with|before|after|your|this|from|into|does|what|how|can|every|should|review|download|upload|customer|payment|draft|ready|details|items|total|year|profit|revenue|costs|generated|prepared|limitations|check|works|best|select|use|files|text|page|document)\b/i.test(translated)) return null;
  return translated;
}

function normalizeTranslation(value) {
  return clean(value)
    .replace(/ndani ya nchi/gi, 'ndani ya kifaa')
    .replace(/akaunti ya bure/gi, 'akaunti isiyolipishwa')
    .replace(/Pakua chini/gi, 'Pakua')
    .replace(/PDFs\b/g, 'PDF')
    .replace(/\bWatermark\b/gi, 'Alama ya maji')
    .replace(/\bcompress\b/gi, 'bana')
    .replace(/\bworkspace\b/gi, 'nafasi ya kazi')
    .replace(/\bedited\b/gi, 'iliyohaririwa')
    .replace(/\bClose\b/gi, 'Funga')
    .replace(/\breturn\b/gi, 'rudi')
    .replace(/\bupload\b/gi, 'kupakia')
    .replace(/\bdownload\b/gi, 'kupakua')
    .replace(/\bdrag\b/gi, 'dondosha')
    .replace(/\bthem\b/gi, 'hizo')
    .replace(/\bhere\b/gi, 'hapa')
    .replace(/\bpreview\b/gi, 'hakiki')
    .replace(/\bfirst\b/gi, 'kwanza')
    .replace(/\bselected\b/gi, 'uliochaguliwa')
    .replace(/\bscreen\b/gi, 'skrini')
    .replace(/\bFit\b/gi, 'Patanisha')
    .replace(/\bwidth\b/gi, 'upana')
    .replace(/\band\b/gi, 'na')
    .replace(/\bor\b/gi, 'au')
    .replace(/\bthe\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksDynamicUserFacing(value) {
  if (!looksUserFacing(value) || value.length > 300 || /[<>{}=;]/.test(value)) return false;
  if (!/\s/.test(value)) return false;
  return /^[A-Z]/.test(value) || /\b(?:the|and|with|before|after|your|this|from|into|does|what|how|can|every|should|review|download|upload|customer|payment|draft|ready|details|items|total|year|profit|revenue|costs|generated|prepared|source|limitations|check|works|best|select|use|files|text|page|document)\b/i.test(value);
}

function fallbackTranslation(value) {
  const exact = {
    'Compress/export': 'Bana/hamisha',
    'PDF Tools': 'Zana za PDF',
    'OCR PDF': 'OCR ya PDF',
    'HTML to PDF': 'HTML kwenda PDF'
  };
  if (exact[value]) return exact[value];
  return value
    .replace(/\bDownload\b/gi, 'Pakua')
    .replace(/\bUpload\b/gi, 'Pakia')
    .replace(/\bExport\b/gi, 'Hamisha')
    .replace(/\bCompress\b/gi, 'Bana')
    .replace(/\bFile(s)?\b/gi, 'Faili')
    .replace(/\bPage(s)?\b/gi, 'Kurasa')
    .replace(/\bDocument(s)?\b/gi, 'Hati')
    .replace(/\bImage(s)?\b/gi, 'Picha')
    .replace(/\bSettings\b/gi, 'Mipangilio')
    .replace(/\bPreview\b/gi, 'Hakiki')
    .replace(/\bReady\b/gi, 'Tayari');
}

const BATCH_SEPARATOR = '[[[AFROTOOLS_SPLIT_9F3A]]]';

function translateRemote(values) {
  const query = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'sw', dt: 't', q: values.join(`\n${BATCH_SEPARATOR}\n`) });
  const url = `https://translate.googleapis.com/translate_a/single?${query}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AfroTools-localization-build/1.0' } }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`Translation service returned ${response.statusCode}`));
        try {
          const parsed = JSON.parse(body);
          const joined = (parsed[0] || []).map((part) => part[0] || '').join('');
          const results = joined.split(BATCH_SEPARATOR).map(normalizeTranslation);
          if (results.length !== values.length) return reject(new Error(`Translation batch returned ${results.length}/${values.length} entries`));
          resolve(results);
        } catch (error) {
          reject(new Error(`Invalid translation response: ${error.message}`));
        }
      });
    }).on('error', reject).setTimeout(20_000, function () { this.destroy(new Error('Translation request timed out')); });
  });
}

async function mapConcurrent(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

async function main() {
  const french = JSON.parse(fs.readFileSync(FRENCH_LEXICON, 'utf8'));
  const previous = fs.existsSync(OUTPUT_JSON) ? JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8')) : { routes: {} };
  const routeSources = new Map();
  const missing = new Set();

  for (const app of apps.filter((row) => LANGUAGE_IDS.has(row.id))) {
    const englishPath = path.join(ROOT, app.englishFile);
    const appPath = path.join(path.dirname(englishPath), 'app.html');
    const sourceFiles = [englishPath];
    if (appPath !== englishPath && fs.existsSync(appPath)) sourceFiles.push(appPath);
    const sources = sourceFiles.map((file) => fs.readFileSync(file, 'utf8'));
    const source = sources.join('\n');
    const candidates = new Set();
    sources.forEach((value) => markupStrings(value).forEach((phrase) => candidates.add(phrase)));
    sources.forEach((value) => appRuntimeStrings(value, app).forEach((phrase) => candidates.add(phrase)));
    for (const phrase of Object.keys(french.routes?.[app.id] || {})) {
      if (source.includes(phrase) && looksDynamicUserFacing(phrase)) candidates.add(clean(phrase));
    }
    if (app.id === 'cv-builder') cvRuntimeStrings().forEach((phrase) => candidates.add(phrase));
    Object.keys(ROUTE_OVERRIDES[app.id] || {}).forEach((phrase) => candidates.add(phrase));
    const route = new Set([...candidates].filter((phrase) => (
      looksUserFacing(phrase)
      || Object.prototype.hasOwnProperty.call(ROUTE_OVERRIDES[app.id] || {}, phrase)
    )));
    routeSources.set(app.id, route);
    for (const phrase of route) {
      if (!REFRESH && previous.routes?.[app.id]?.[phrase]) continue;
      if (translatedLocally(phrase)) continue;
      missing.add(phrase);
    }
  }

  if (missing.size && !WRITE) {
    throw new Error(`Swahili Document/PDF lexicon is missing ${missing.size} strings. Run with --write --refresh.`);
  }
  const missingList = [...missing];
  console.log(`${missingList.length} unique route-owned strings require Swahili translation.`);
  const batches = [];
  for (const phrase of missingList) {
    const current = batches.at(-1);
    if (!current || current.join('').length + phrase.length > 3000 || current.length >= 25) batches.push([phrase]);
    else current.push(phrase);
  }
  const translatedBatches = await mapConcurrent(batches, 4, async (batch, index) => {
    if (index && index % 10 === 0) console.log(`Translated ${index}/${batches.length} batches`);
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try { return await translateRemote(batch); } catch (error) { lastError = error; }
    }
    throw new Error(`Could not translate batch beginning ${JSON.stringify(batch[0].slice(0, 80))}: ${lastError?.message}`);
  });
  const translated = translatedBatches.flat();
  const remote = new Map(missingList.map((phrase, index) => [phrase, translated[index]]));
  const routes = {};
  const combined = {};
  for (const [id, sources] of routeSources) {
    const entries = [];
    for (const phrase of sources) {
      const rawValue = ROUTE_OVERRIDES[id]?.[phrase]
        || (!REFRESH && previous.routes?.[id]?.[phrase]) || translatedLocally(phrase) || remote.get(phrase);
      const value = rawValue === phrase ? fallbackTranslation(rawValue) : rawValue;
      if (!value) throw new Error(`${id}: untranslated phrase ${JSON.stringify(phrase)}`);
      entries.push([phrase, normalizeTranslation(value)]);
      if (!combined[phrase]) combined[phrase] = normalizeTranslation(value);
    }
    routes[id] = Object.fromEntries(entries.sort((a, b) => a[0].localeCompare(b[0], 'en')));
  }
  const output = {
    schemaVersion: 1,
    locale: 'sw',
    category: 'document-pdf',
    generatedBy: 'scripts/build-swahili-document-pdf-lexicon.js',
    routes
  };
  const json = `${JSON.stringify(output, null, 2)}\n`;
  const js = `(function(root){'use strict';root.AfroTools=root.AfroTools||{};root.AfroTools.SwahiliDocumentPdfPhrases=Object.freeze(${JSON.stringify(combined)});})(typeof globalThis!=='undefined'?globalThis:this);\n`;
  if (WRITE) {
    fs.writeFileSync(OUTPUT_JSON, json, 'utf8');
    fs.writeFileSync(OUTPUT_JS, js, 'utf8');
    console.log(`Wrote ${Object.keys(combined).length} exact Swahili phrases across ${Object.keys(routes).length} routes.`);
    return;
  }
  if (!fs.existsSync(OUTPUT_JS) || fs.readFileSync(OUTPUT_JSON, 'utf8') !== json || fs.readFileSync(OUTPUT_JS, 'utf8') !== js) {
    throw new Error('Swahili Document/PDF lexicon outputs are stale. Run with --write.');
  }
  console.log('Swahili Document/PDF lexicon outputs are current.');
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
