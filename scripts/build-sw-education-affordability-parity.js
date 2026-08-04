const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data/localization/sw-education-affordability-parity.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const check = process.argv.includes('--check');

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function comparableHtml(value) {
  return value
    .replace(/ data-chat-bundle="\/assets\/js\/bundles\/chat\.[0-9a-f]+\.min\.js"/g, '')
    .replace(/\?v=[0-9a-f]{8}(?=["'])/g, '')
    .replace(/\s*<script src="\/assets\/js\/lib\/sw-accessibility\.js" defer><\/script>\r?\n?/g, '')
    .replace(/\s*<script src="\/assets\/js\/lazy-analytics\.js" defer><\/script>\r?\n?/g, '');
}

function page(app) {
  const route = `/sw/zana/${app.slug}/`;
  const englishFile = path.join(root, app.english.replace(/^\//, ''), 'index.html');
  const englishHtml = fs.readFileSync(englishFile, 'utf8');
  const alternates = new Map();
  for (const tag of englishHtml.match(/<link\b[^>]*rel=["']?alternate["']?[^>]*>/gi) || []) {
    const language = tag.match(/hreflang=["']?([^"'\s>]+)/i);
    const href = tag.match(/href=["']([^"']+)/i);
    if (language && href) alternates.set(language[1], href[1]);
  }
  alternates.set('en', `https://afrotools.com${app.english}`);
  alternates.set('sw', `https://afrotools.com${route}`);
  alternates.set('x-default', `https://afrotools.com${app.english}`);
  const alternateLinks = Array.from(alternates.entries())
    .sort(([left], [right]) => {
      if (left === 'x-default') return 1;
      if (right === 'x-default') return -1;
      return 0;
    })
    .map(([language, href]) => `<link rel="alternate" hreflang="${esc(language)}" href="${esc(href)}">`)
    .join('\n');
  const fields = app.fields.map(field => `<div class="field"><label for="f-${esc(field[0])}">${esc(field[1])}</label><input id="f-${esc(field[0])}" name="${esc(field[0])}" type="${esc(field[2])}" value="${esc(field[3])}" ${field[2] === 'number' ? 'min="0" step="any" inputmode="decimal"' : 'maxlength="40"'}></div>`).join('');
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: app.title, description: app.summary, inLanguage: 'sw', applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true, url: `https://afrotools.com${route}`, image: `https://afrotools.com/assets/img/tools/${app.image}`, isBasedOn: `https://afrotools.com${app.english}` }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(app.title)} | AfroTools</title><meta name="description" content="${esc(app.summary)}">
<meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ"><meta property="og:title" content="${esc(app.title)}"><meta property="og:description" content="${esc(app.summary)}"><meta property="og:url" content="https://afrotools.com${route}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${esc(app.image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(app.title)} | AfroTools">
<meta name="twitter:description" content="${esc(app.summary)}">
<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${esc(app.image)}"><script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/assets/css/sw-education-affordability-parity.css"><link rel="canonical" href="https://afrotools.com${route}">
${alternateLinks}
</head><body>
<a class="skip" href="#kikokotoo">Ruka hadi kikokotoo</a><header class="top"><div class="wrap"><a class="brand" href="/sw/">AFROTOOLS</a><nav class="nav" aria-label="Urambazaji mkuu"><a href="/sw/elimu/">Elimu</a><a href="/sw/zana-za-elimu/">Zana za elimu</a><button class="theme" id="swTheme" type="button" aria-pressed="false">Mandhari nyeusi</button></nav></div></header>
<section class="hero"><div class="wrap"><div class="crumb"><a href="/sw/">Mwanzo</a> / <a href="/sw/elimu/">Elimu</a> / ${esc(app.title)}</div><h1>${esc(app.title)}</h1><p class="lead">${esc(app.summary)}</p><div class="chips"><span>Hufanya kazi ndani ya kivinjari</span><span>Hakuna akaunti</span><span>Data haitumwi kwa AI</span></div></div></section>
<main class="main" id="kikokotoo"><div class="wrap layout"><section class="card" aria-labelledby="formTitle"><h2 id="formTitle">Weka taarifa zako</h2><p class="intro">Tumia sarafu moja na kiasi kutoka chanzo unachoweza kuthibitisha. Sehemu hazitumwi kwenye seva.</p><form id="swEduForm" novalidate><div class="grid">${fields}</div><div class="actions"><button class="btn primary" type="submit">Kokotoa</button><button class="btn" id="swEduReset" type="button">Futa</button></div><p class="error" id="swEduError" role="alert" aria-live="assertive"></p></form>
<section class="result" id="swEduResult" tabindex="-1" hidden aria-labelledby="resultTitle"><h2 id="resultTitle">Matokeo ya kupanga</h2><div class="metrics" id="swEduMetrics"></div><div class="actions"><button class="btn" id="swEduCopy" type="button">Nakili</button><button class="btn" id="swEduJson" type="button">Pakua JSON</button><button class="btn" id="swEduTxt" type="button">Pakua TXT</button><button class="btn" id="swEduPdf" type="button">Pakua PDF</button></div><p class="status" id="swEduStatus" role="status" aria-live="polite"></p></section></section>
<aside class="card side"><div class="note"><strong>Mpaka wa hesabu:</strong> Matokeo ni makadirio ya kupanga, si taarifa rasmi, bei ya soko, ushauri wa kifedha, uamuzi wa mkopo, visa au udahili.</div><h2>Kabla ya kutenda</h2><ul><li>Thibitisha kiasi, sarafu, tarehe na masharti kwenye chanzo rasmi.</li><li>Jaribu hali zaidi ya moja ili kuona mabadiliko ya gharama.</li><li>Pakua nakala yako kabla ya kufunga ukurasa; hakuna hifadhi ya kiotomatiki.</li></ul><p><a href="${esc(app.english)}" lang="en">English version</a></p></aside></div></main>
<script>window.SwEducationApp=${JSON.stringify(app).replace(/</g, '\\u003c')};</script><script src="${esc(app.engine)}"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-education-affordability-parity.js"></script></body></html>\n`;
}

let failed = false;
for (const app of manifest.apps) {
  const target = path.join(root, 'sw/zana', app.slug, 'index.html');
  const expected = page(app);
  if (check) {
    if (!fs.existsSync(target) || comparableHtml(fs.readFileSync(target, 'utf8')) !== expected) { console.error(`STALE ${path.relative(root, target)}`); failed = true; }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected);
    console.log(`WROTE ${path.relative(root, target)}`);
  }
}

function reconcileHub(relative, before, block) {
  const target = path.join(root, relative);
  const start = '<!-- sw-education-affordability:start -->';
  const end = '<!-- sw-education-affordability:end -->';
  let source = fs.readFileSync(target, 'utf8');
  const expression = new RegExp(`${start}[\\s\\S]*?${end}\\r?\\n?`, 'g');
  const insertion = `${start}\n${block}\n${end}\n`;
  const expected = expression.test(source)
    ? source.replace(expression, insertion)
    : source.replace(before, `${insertion}${before}`);
  if (expected === source && !source.includes(start)) throw new Error(`Hub insertion point missing: ${relative}`);
  if (check) {
    if (source !== expected || !source.includes(start)) { console.error(`STALE ${relative}`); failed = true; }
  } else if (source !== expected) {
    fs.writeFileSync(target, expected, 'utf8');
    console.log(`WROTE ${relative}`);
  }
}

const educationLinks = manifest.apps.map(app => `<a class="edu-link" href="/sw/zana/${esc(app.slug)}/"><strong>${esc(app.title)}</strong><span>${esc(app.summary)}</span></a>`).join('\n        ');
reconcileHub('sw/elimu/index.html', '    <section class="edu-note">', `    <section class="edu-card" aria-labelledby="affordabilityTitle">
      <div class="edu-eyebrow">Bajeti na uwezo wa kumudu</div>
      <h2 id="affordabilityTitle">Zana nane za gharama, akiba na marejesho</h2>
      <div class="edu-link-grid">
        ${educationLinks}
      </div>
    </section>`);

const directoryLinks = manifest.apps.map(app => `<a href="/sw/zana/${esc(app.slug)}/" class="tool-card"><span class="badge-live">Inapatikana</span><div class="tool-card-icon">Hesabu</div><div class="tool-card-name">${esc(app.title)}</div><div class="tool-card-desc">${esc(app.summary)}</div><span class="tool-card-cta">Fungua -&gt;</span></a>`).join('\n      ');
reconcileHub('sw/zana-za-elimu/index.html', '<section data-tool-verification-panel', `<section class="sec"><div class="wrap"><div class="eyebrow">Bajeti na uwezo wa kumudu</div><h2 class="sec-title">Zana za gharama, akiba na marejesho</h2><div class="tool-grid">
      ${directoryLinks}
    </div></div></section>\n\n`);

if (failed) process.exit(1);
console.log(`${check ? 'CURRENT' : 'BUILT'} ${manifest.apps.length} Swahili education affordability apps`);
