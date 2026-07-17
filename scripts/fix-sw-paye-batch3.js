#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const swRoot = path.join(root, 'sw');

const toolRouteMap = new Map([
  ['/tools/remittance-compare/', '/sw/zana/ulinganisho-uhamishaji-pesa/'],
  ['/tools/mobile-money-fees/', '/sw/zana/ada-pesa-simu/'],
  ['/tools/currency-converter/', '/sw/zana/kibadilishaji-sarafu/'],
]);

const mojibakeReplacements = [
  ['PrÃ­ncipe', 'Príncipe'],
  ['FÃ­sicas', 'Físicas'],
  ['ContribuiçÃµes', 'Contribuições'],
  ['-', '—'],
  ['-', '–'],
  ['Ÿ‡¬', '🇪🇬'],
  ['Ÿ‡­', '🇬🇭'],
  ['Ÿ‡¦', '🇲🇦'],
  ['Ÿ‡±', '🇸🇱'],
  ['Ÿ‡²', '🇬🇲'],
  ['Ÿ‡³', '🇬🇳'],
  ['Ÿ‡·', '🇱🇷'],
  ['Ÿ‡±', '🇲🇱'],
  ['Ãƒ©', 'é'],
  ['Ãƒ¨', 'è'],
  ['Ãƒª', 'ê'],
  ['Ãƒ«', 'ë'],
  ['Ãƒ¡', 'á'],
  ['Ãƒ³', 'ó'],
  ['Ãƒº', 'ú'],
  ['ÃƒÂš', 'Ú'],
  ['Ãƒ±', 'ñ'],
  ['Ãƒ-', '×'],
  ['Ãƒ-', '÷'],
  ['a-"', '—'],
  ['a-"', '–'],
  ['a-¦', '…'],
  ['aâ€ '', '→'],
  ['aË†'', '-'],
  ['aoe¦', '✦'],
  ['aoeâ€¢', '✕'],
  ['aoeâ€¦', '✓'],
  ['a-¾', '▾'],
  ['Ã°Å¸'¸', '💸'],
  ['Ã°Å¸"±', '📱'],
  ['Ã°Å¸'±', '💱'],
  ['Ã°Å¸"â€ž', '📄'],
  ['Ã°Å¸â€¡¹Ã°Å¸â€¡¿', '🇹🇿'],
  ['Ã°Å¸â€¡ºÃ°Å¸â€¡¬', '🇺🇬'],
  ['Ã°Å¸â€¡§Ã°Å¸â€¡®', '🇧🇮'],
  ['Ã°Å¸â€¡-Ã°Å¸â€¡¼', '🇷🇼'],
  ['Ã°Å¸â€¡°Ã°Å¸â€¡ª', '🇰🇪'],
  ['Ÿ‡¹', '🇪🇹'],
  [', '💼'],
  [', '🔢'],
  [', '📄'],
  [', '🔗'],
  [', '🧮'],
  [', '📊'],
  [', '🤖'],
  ['Ÿ‡¦', '🇿🇦'],
  ['Ÿ‡¬', '🇳🇬'],
  ['Ÿ‡»', '🇨🇻'],
  ['Ÿ‡¼', '🇬🇼'],
  ['Ÿ‡·', '🇲🇷'],
  ['Ÿ‡³', '🇸🇳'],
  ['-', '—'],
  ['-', '–'],
  ['â€¦', '…'],
  ['->', '→'],
  ['-', '↗'],
  ['<-', '←'],
  ['âˆ’', '-'],
  ['-ˆ', '≈'],
  ['-', '⬇'],
  ['-', '➤'],
  ['-', '✨'],
  ['-', '▶'],
  ['-', '▼'],
  ['-', '₦'],
  ['e', 'é'],
  ['e', 'è'],
  ['e', 'ê'],
  ['e', 'ë'],
  ['Ã¡', 'á'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ãš', 'Ú'],
  ['Ã±', 'ñ'],
  ['c', 'ç'],
  ['o', 'ô'],
  ['Ã£', 'ã'],
  ['Ã‰', 'É'],
  ['Ã€', 'À'],
  ['Ã‡', 'Ç'],
  ['Ã”', 'Ô'],
  ['Ã—', '×'],
  ['Ã‚-', '·'],
  ['-', '·'],
  ['Ã‚Â', ''],
  ['Â ', ' '],
  ['Â', ''],
];

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
  const enLocale = enHtml ? extractMetaContent(enHtml, 'property', 'og:locale') : null;
  const swLocale = enLocale && /^en_|^fr_/i.test(enLocale) ? enLocale.replace(/^(en|fr)_/i, 'sw_') : null;

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
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

const files = walk(swRoot, (fullPath) => fullPath.endsWith(`${path.sep}kikokotoo-kodi-mshahara${path.sep}index.html`));
let changed = 0;
for (const filePath of files) {
  if (normalizePage(filePath)) changed += 1;
}

console.log(`Batch 3 fixer updated ${changed} Swahili PAYE pages.`);
