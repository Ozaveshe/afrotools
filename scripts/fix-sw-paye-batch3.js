#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const swRoot = path.join(root, 'sw');
const { buildPairsDeep, assertSafePairs } = require('./lib/mojibake');
const WRITE = process.argv.includes('--write');

const toolRouteMap = new Map([
  ['/tools/remittance-compare/', '/sw/zana/ulinganisho-uhamishaji-pesa/'],
  ['/tools/mobile-money-fees/', '/sw/zana/ada-pesa-simu/'],
  ['/tools/currency-converter/', '/sw/zana/kibadilishaji-sarafu/'],
]);

const mojibakeReplacements = assertSafePairs(buildPairsDeep({
  // Whole words whose mojibake form spans several characters.
  "Pr\u00EDncipe": "Pr\u00EDncipe",
  "F\u00EDsicas": "F\u00EDsicas",
  "Contribui\u00E7\u00F5es": "Contribui\u00E7\u00F5es",
  // Normalisations.
  "\u2212": "-",   // minus sign to hyphen
  "\u00A0": " ",   // no-break space to space
  // Characters that must survive as themselves.
  "\u2014": "\u2014",
  "\u2013": "\u2013",
  "\u2026": "\u2026",
  "\u00D7": "\u00D7",
  "\u00F7": "\u00F7",
  "\u2726": "\u2726",
  "\u2715": "\u2715",
  "\u2713": "\u2713",
  "\u25BE": "\u25BE",
  "\u2192": "\u2192",
  "\u2197": "\u2197",
  "\u2190": "\u2190",
  "\u2248": "\u2248",
  "\u2B07": "\u2B07",
  "\u27A4": "\u27A4",
  "\u2728": "\u2728",
  "\u25B6": "\u25B6",
  "\u25BC": "\u25BC",
  "\u20A6": "\u20A6",
  "\u00B7": "\u00B7",
  "\u00E9": "\u00E9",
  "\u00E8": "\u00E8",
  "\u00EA": "\u00EA",
  "\u00EB": "\u00EB",
  "\u00E1": "\u00E1",
  "\u00F3": "\u00F3",
  "\u00FA": "\u00FA",
  "\u00DA": "\u00DA",
  "\u00F1": "\u00F1",
  "\u00E7": "\u00E7",
  "\u00F4": "\u00F4",
  "\u00E3": "\u00E3",
  "\u00C9": "\u00C9",
  "\u00C0": "\u00C0",
  "\u00C7": "\u00C7",
  "\u00D4": "\u00D4",
  "\u{1F4F1}": "\u{1F4F1}",
  "\u{1F4C4}": "\u{1F4C4}",
  "\u{1F4CA}": "\u{1F4CA}",
  "\u{1F4C8}": "\u{1F4C8}",
  "\u{1F517}": "\u{1F517}",
  "\u{1F9EE}": "\u{1F9EE}",
  "\u{1F916}": "\u{1F916}",
  "\u{1F4B8}": "\u{1F4B8}",
  "\u{1F4B1}": "\u{1F4B1}",
  "\u{1F4BC}": "\u{1F4BC}",
  "\u{1F522}": "\u{1F522}",
  "\u{1F1EA}\u{1F1EC}": "\u{1F1EA}\u{1F1EC}",
  "\u{1F1EC}\u{1F1ED}": "\u{1F1EC}\u{1F1ED}",
  "\u{1F1F2}\u{1F1E6}": "\u{1F1F2}\u{1F1E6}",
  "\u{1F1F8}\u{1F1F1}": "\u{1F1F8}\u{1F1F1}",
  "\u{1F1EC}\u{1F1F2}": "\u{1F1EC}\u{1F1F2}",
  "\u{1F1EC}\u{1F1F3}": "\u{1F1EC}\u{1F1F3}",
  "\u{1F1F1}\u{1F1F7}": "\u{1F1F1}\u{1F1F7}",
  "\u{1F1F2}\u{1F1F1}": "\u{1F1F2}\u{1F1F1}",
  "\u{1F1F9}\u{1F1FF}": "\u{1F1F9}\u{1F1FF}",
  "\u{1F1FA}\u{1F1EC}": "\u{1F1FA}\u{1F1EC}",
  "\u{1F1E7}\u{1F1EE}": "\u{1F1E7}\u{1F1EE}",
  "\u{1F1F7}\u{1F1FC}": "\u{1F1F7}\u{1F1FC}",
  "\u{1F1F0}\u{1F1EA}": "\u{1F1F0}\u{1F1EA}",
  "\u{1F1EA}\u{1F1F9}": "\u{1F1EA}\u{1F1F9}",
  "\u{1F1FF}\u{1F1E6}": "\u{1F1FF}\u{1F1E6}",
  "\u{1F1F3}\u{1F1EC}": "\u{1F1F3}\u{1F1EC}",
  "\u{1F1E8}\u{1F1FB}": "\u{1F1E8}\u{1F1FB}",
  "\u{1F1EC}\u{1F1FC}": "\u{1F1EC}\u{1F1FC}",
  "\u{1F1F2}\u{1F1F7}": "\u{1F1F2}\u{1F1F7}",
  "\u{1F1F8}\u{1F1F3}": "\u{1F1F8}\u{1F1F3}"
}), "fix-sw-paye-batch3");

function walk(dir, matcher, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matcher, acc);
      continue;
    }
    if (matcher(fullPath)) acc.push(fullPath);
  }
  return acc;
}

function normalizeUrl(url) {
  if (!url) return url;
  return /\.[a-z0-9]+$/i.test(url) ? url : url.replace(/\/?$/, '/');
}

function resolveRepoFileFromUrl(url) {
  if (!url || !url.startsWith('https://afrotools.com/')) return null;
  const repoPath = url.replace(/^https:\/\/afrotools\.com\//, '').replace(/\/$/, '');
  const htmlCandidate = path.join(root, `${repoPath}.html`);
  if (fs.existsSync(htmlCandidate)) return htmlCandidate;
  const indexCandidate = path.join(root, repoPath, 'index.html');
  if (fs.existsSync(indexCandidate)) return indexCandidate;
  return null;
}

function extractHref(html, hreflang) {
  const match = html.match(new RegExp(`<link rel="alternate" hreflang="${hreflang}" href="([^"]+)"\\s*/?>`, 'i'));
  return match ? match[1] : null;
}

function extractMetaContent(html, attr, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta\\s+${attr}="${escaped}"\\s+content="([^"]+)"\\s*/?>`, 'i'));
  return match ? match[1] : null;
}

function extractCanonical(html) {
  const match = html.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/i);
  return match ? match[1] : null;
}

function replaceOrInsertMeta(html, attr, value, content) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+${attr}="${escaped}"\\s+content="[^"]*"\\s*/?>`, 'i');
  const replacement = `<meta ${attr}="${value}" content="${content}">`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  const ogSiteName = /<meta property="og:site_name" content="AfroTools"\s*\/?>/i;
  if (ogSiteName.test(html)) {
    return html.replace(ogSiteName, `${replacement}\n<meta property="og:site_name" content="AfroTools">`);
  }
  return html;
}

function replaceAlternate(html, hreflang, href) {
  const replacement = `<link rel="alternate" hreflang="${hreflang}" href="${href}">`;
  const pattern = new RegExp(`<link rel="alternate" hreflang="${hreflang}" href="[^"]+"\\s*/?>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, replacement);
  const enPattern = /<link rel="alternate" hreflang="en" href="[^"]+"\s*\/?>/i;
  if (hreflang === 'fr' && enPattern.test(html)) {
    return html.replace(enPattern, (match) => `${match}\n${replacement}`);
  }
  const xDefaultPattern = /<link rel="alternate" hreflang="x-default" href="[^"]+"\s*\/?>/i;
  if (xDefaultPattern.test(html)) {
    return html.replace(xDefaultPattern, `${replacement}\n<link rel="alternate" hreflang="x-default" href="${extractHref(html, 'x-default') || href}">`);
  }
  return html;
}

function localizePromptLines(html) {
  const directReplacements = [
    ['Monthly gross:', 'Mshahara ghafi wa mwezi:'],
    ['Monthly PAYE:', 'PAYE ya mwezi:'],
    ['Monthly take-home:', 'Mshahara halisi wa mwezi:'],
    ['Take-home:', 'Mshahara halisi:'],
    ['Effective tax rate:', 'Kiwango halisi cha kodi:'],
    ['Secondary employment:', 'Ajira ya pili:'],
    ['Sector:', 'Sekta:'],
    ['Taxable income after social security:', 'Mapato yanayotozwa kodi baada ya hifadhi ya jamii:'],
    ['Taxable income after NSSF:', 'Mapato yanayotozwa kodi baada ya NSSF:'],
    ['Taxable income after RSSB:', 'Mapato yanayotozwa kodi baada ya RSSB:'],
    ['Taxable income after CNSS:', 'Mapato yanayotozwa kodi baada ya CNSS:'],
    ['Taxable income after INSS:', 'Mapato yanayotozwa kodi baada ya INSS:'],
    ['Taxable income after ', 'Mapato yanayotozwa kodi baada ya '],
    ['Private (NSSF)', 'Sekta binafsi (NSSF)'],
    ['Public (PSSSF)', 'Sekta ya umma (PSSSF)'],
    ['Give a concise analysis in Kiswahili:', 'Toa uchambuzi mfupi kwa Kiswahili:'],
  ];
  for (const [from, to] of directReplacements) {
    html = html.split(from).join(to);
  }

  html = html.replace(/const prompt = '([^']+?) PAYE analysis \(/g, "const prompt = 'Uchambuzi wa PAYE $1 (");
  html = html.replace(/var prompt = '([^']+?) PAYE analysis \(/g, "var prompt = 'Uchambuzi wa PAYE $1 (");
  html = html.replace(/\? 'YES — flat 30% applied' : 'No'/g, "? 'NDIYO — 30% tambarare imetumika' : 'Hapana'");
  html = html.replace(/\? 'YES - flat 30% applied' : 'No'/g, "? 'NDIYO — 30% tambarare imetumika' : 'Hapana'");
  return html;
}

function fixCountrySpecificText(filePath, html) {
  if (filePath.includes(`${path.sep}egypt${path.sep}`)) {
    html = html
      .replace(
        'Mchango wa NOSI wa mwajiriwa (11%) unafutwa moja kwa moja kutoka kwa mshahara ghafi kabla ya kuhesabu kodi ya ETA. Hii inapunguza kipato kinachotozwa kodi.',
        'Mchango wa NOSI wa mwajiriwa (11%) pamoja na bima ya afya ya mwajiriwa (1%, inapohusika) huondolewa kutoka kwa mshahara unaohakikishwa kabla ya kodi ya ETA kuhesabiwa. Hii inapunguza kipato kinachotozwa kodi.'
      )
      .replace(
        'Mchango wa NOSI wa mwajiriwa unafutwa kutoka kwa kipato kinachotozwa kodi kabla ya kuhesabu ETA.',
        'Mchango wa NOSI wa mwajiriwa pamoja na bima ya afya ya mwajiriwa (ikiwa imewashwa) huondolewa kutoka kwa kipato kinachotozwa kodi kabla ya kuhesabu ETA.'
      )
      .replace(
        'Mchango huu unafutwa kutoka kwa kipato kinachotozwa kodi.',
        'Mchango huu, pamoja na bima ya afya ya mwajiriwa ikiwa imewashwa, huondolewa kutoka kwa kipato kinachotozwa kodi.'
      );
  }

  if (filePath.includes(`${path.sep}equatorial-guinea${path.sep}`)) {
    html = html.replace('Gabon inatumia mfumo wa kodi ya mapato unaoitwa', 'Guinea ya Ikweta inatumia mfumo wa kodi ya mapato unaoitwa');
  }

  if (filePath.includes(`${path.sep}congo${path.sep}`)) {
    html = html
      .replace(/Kikokotoo cha Kodi ya Mshahara Kongo/g, 'Kikokotoo cha Kodi ya Mshahara Jamhuri ya Kongo')
      .replace(/Kongo Brazzaville/g, 'Jamhuri ya Kongo (Brazzaville)')
      .replace(/>Kongo</g, '>Jamhuri ya Kongo<')
      .replace(/<em>Kongo 2026<\/em>/g, '<em>Jamhuri ya Kongo 2026</em>')
      .replace(/Kikokotoo cha Kodi Kongo/g, 'Kikokotoo cha Kodi Jamhuri ya Kongo')
      .replace(/Kodi Kongo:/g, 'Kodi Jamhuri ya Kongo:')
      .replace(/DGI Kongo/g, 'DGI ya Jamhuri ya Kongo');
  }

  if (filePath.includes(`${path.sep}dr-congo${path.sep}`)) {
    html = html
      .replace(/Kikokotoo cha Kodi ya Mshahara DRC/g, 'Kikokotoo cha Kodi ya Mshahara Jamhuri ya Kidemokrasia ya Kongo')
      .replace(/>DRC</g, '>Jamhuri ya Kidemokrasia ya Kongo<')
      .replace(/<em>DRC 2026<\/em>/g, '<em>Jamhuri ya Kidemokrasia ya Kongo 2026</em>')
      .replace(/Kikokotoo cha Kodi DRC/g, 'Kikokotoo cha Kodi Jamhuri ya Kidemokrasia ya Kongo')
      .replace(/Kodi DRC/g, 'Kodi Jamhuri ya Kidemokrasia ya Kongo')
      .replace(/Wafanyakazi wa kampuni za madini wanaweza kuwa na mifumo maalum ya kodi na faida za ziada\./g, 'Wafanyakazi wa kampuni za madini wanaweza kuwa na mifumo maalum ya kodi na manufaa ya ziada.');
  }

  if (filePath.includes(`${path.sep}south-sudan${path.sep}`)) {
    html = html
      .replace(
        'Kikokotoo cha Kodi ya Mshahara Sudani Kusini 2026 - PAYE SSP | AfroTools',
        'Kikokotoo cha Kodi ya Mshahara Sudani Kusini 2025/26 — PAYE SSP | AfroTools'
      )
      .replace(
        'Kokotoa mshahara wako halisi baada ya kodi ya mapato na hifadhi ya jamii Sudani Kusini. SSP. Bure, haraka.',
        'Kokotoa mshahara wako halisi baada ya kodi ya mapato na hifadhi ya jamii Sudani Kusini. PAYE ya NRA 0%–20% na NSIF 8%/17%. SSP. Bure, haraka.'
      )
      .replace(
        'Kikokotoo cha Kodi ya Mshahara Sudani Kusini - PAYE 2026',
        'Kikokotoo cha Kodi ya Mshahara Sudani Kusini — PAYE 2025/26'
      )
      .replace(/20,001-40,000/g, '20,001–40,000')
      .replace(/40,001-57,000/g, '40,001–57,000')
      .replace(/57,001-90,000/g, '57,001–90,000');
  }

  return html;
}

function normalizePage(filePath) {
  const swRelative = path.relative(root, filePath).replace(/\\/g, '/');
  const swUrl = `https://afrotools.com/${swRelative.replace(/index\.html$/, '')}`;
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  for (const [from, to] of mojibakeReplacements) {
    html = html.split(from).join(to);
  }

  for (const [from, to] of toolRouteMap.entries()) {
    html = html.split(from).join(to);
  }

  html = localizePromptLines(html);
  html = fixCountrySpecificText(filePath, html);

  const currentEnHref = extractHref(html, 'en');
  const enFile = resolveRepoFileFromUrl(currentEnHref);
  const enHtml = enFile ? fs.readFileSync(enFile, 'utf8') : null;
  const enCanonical = normalizeUrl(enHtml ? extractCanonical(enHtml) : currentEnHref);
  const frHref = enHtml ? extractHref(enHtml, 'fr') : null;
  const ogImage = enHtml ? extractMetaContent(enHtml, 'property', 'og:image') : null;
  const twitterImage = enHtml ? extractMetaContent(enHtml, 'name', 'twitter:image') : null;
  // The region belongs to the page's own country, not to the English page it
  // links to. Deriving it from the English og:locale produced "sw_US" for every
  // market, because /algeria/dz-paye and friends all carry en_US. Keep whatever
  // region this page already declares and only correct the language subtag.
  const currentLocale = extractMetaContent(html, 'property', 'og:locale');
  const swLocale = currentLocale && /^[a-z]{2}_[A-Z]{2}$/.test(currentLocale)
    ? currentLocale.replace(/^[a-z]{2}_/, 'sw_')
    : null;

  html = html.replace(/<link rel="canonical" href="[^"]+"\s*\/?>/i, `<link rel="canonical" href="${normalizeUrl(swUrl)}">`);
  html = html.replace(/<meta property="og:url" content="[^"]+"\s*\/?>/i, `<meta property="og:url" content="${normalizeUrl(swUrl)}">`);
  html = replaceAlternate(html, 'sw', normalizeUrl(swUrl));
  if (enCanonical) {
    html = replaceAlternate(html, 'en', enCanonical);
    html = replaceAlternate(html, 'x-default', enCanonical);
  }
  if (frHref) {
    html = replaceAlternate(html, 'fr', normalizeUrl(frHref));
  }
  if (ogImage) {
    html = replaceOrInsertMeta(html, 'property', 'og:image', ogImage);
  }
  if (twitterImage || ogImage) {
    html = replaceOrInsertMeta(html, 'name', 'twitter:image', twitterImage || ogImage);
  }
  if (swLocale) {
    html = replaceOrInsertMeta(html, 'property', 'og:locale', swLocale);
  }

  if (html !== original) {
    if (WRITE) fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

const files = walk(swRoot, (fullPath) => fullPath.endsWith(`${path.sep}kikokotoo-kodi-mshahara${path.sep}index.html`));
let changed = 0;
for (const filePath of files) {
  if (normalizePage(filePath)) changed += 1;
}

console.log(`Batch 3 fixer ${WRITE ? 'updated' : 'would update'} ${changed} Swahili PAYE pages.`);
if (!WRITE && changed) console.log('Dry run. Pass --write to apply.');
