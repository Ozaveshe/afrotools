#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { assessQuestion } = require('./lib/jamb-content-trust');
const { writeFileSyncWithRetry, renameSyncWithRetry, unlinkSyncWithRetry } = require('./lib/safe-write');
const ROOT = path.resolve(__dirname, '..');
const SUBJECTS = { english: 'Use of English', mathematics: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry',
  biology: 'Biology', government: 'Government', economics: 'Economics', literature: 'Literature in English',
  crk: 'Christian Religious Knowledge', commerce: 'Commerce', accounts: 'Principles of Accounts' };
function existingRoutes(root = ROOT) {
  const routes = [];
  for (const subject of Object.keys(SUBJECTS)) {
    const dir = path.join(root, 'jamb', subject);
    if (!fs.existsSync(dir)) continue;
    if (fs.existsSync(path.join(dir, 'index.html'))) routes.push(subject);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && /^\d{4}$/.test(entry.name) && fs.existsSync(path.join(dir, entry.name, 'index.html'))) routes.push(subject + '/' + entry.name);
    }
  }
  return routes.sort();
}
const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const jsonScript = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

function renderCard(q) {
  return `<article class="qcard" id="q-${esc(q.id)}" data-reviewed-question="${esc(q.id)}">
<h2>Question ${esc(q.num)}</h2>
${q.passage ? `<blockquote>${esc(q.passage)}</blockquote>` : ''}
${q.image ? `<img src="${esc(q.image)}" alt="${esc(q.image_alt)}" loading="lazy">` : ''}
<p class="qcard-text">${esc(q.question)}</p>
<ol type="A">${Object.keys(q.options).sort().map(key => `<li>${esc(q.options[key])}</li>`).join('')}</ol>
<details><summary>Answer and explanation</summary><p><strong>${esc(q.answer)}: ${esc(q.options[q.answer])}</strong></p><p>${esc(q.explanation || q.ai_explanation)}</p></details>
</article>`;
}

function renderYear(subject, year, candidates, ledger, years = []) {
  if (!SUBJECTS[subject] || (year !== null && !/^\d{4}$/.test(String(year)))) throw new Error('Unknown JAMB subject/year route');
  const ids = new Set();
  const approved = candidates.filter(q => q.subject === subject && (year === null || String(q.year) === String(year))
    && assessQuestion(q, ledger).state === 'eligible');
  for (const q of approved) { if (ids.has(q.id)) throw new Error('Duplicate approved question ID'); ids.add(q.id); }
  approved.sort((a, b) => a.num - b.num || a.id.localeCompare(b.id));
  const name = SUBJECTS[subject];
  const paper = year === null ? name : name + ' ' + year;
  const canonical = `https://afrotools.com/jamb/${subject}/${year === null ? '' : year + '/'}`;
  const title = `JAMB ${paper} — ${approved.length ? 'Reviewed practice' : 'Content review'} | AfroJAMB`;
  const description = approved.length ? `${approved.length} reviewed ${paper} questions, with answers and explanations.`
    : `The ${paper} question collection is under review. Use the study planner while sources, questions and answer keys are checked.`;
  const schemas = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description },
    ...approved.slice(0, 50).map(q => ({ '@context': 'https://schema.org', '@type': 'Question', name: q.question,
      text: q.question, url: canonical + '#q-' + encodeURIComponent(q.id),
      acceptedAnswer: { '@type': 'Answer', text: q.options[q.answer] }, answerExplanation: q.explanation || q.ai_explanation }))];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="afrotools-source-owner" content="scripts/build-jamb-reviewed-pages.js">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${approved.length ? 'index' : 'noindex'}, follow">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/jamb.css">
<link rel="stylesheet" href="/assets/css/jamb-reviewed-pages.css">
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
${schemas.map(schema => `<script type="application/ld+json">${jsonScript(schema)}</script>`).join('\n')}
</head>
<body class="jamb-page">
<afro-navbar active="education"></afro-navbar>
<main class="jb-wrap jamb-reviewed-paper">
<nav aria-label="Breadcrumb"><a href="/education/">Education</a> / <a href="/jamb/">AfroJAMB</a> / <a href="/jamb/${subject}/">${esc(name)}</a> ${year === null ? '' : '/ ' + year}</nav>
<h1>JAMB ${esc(paper)}</h1>
${year === null ? `<nav aria-label="Browse paper years"><h2>Browse by year</h2><p>${years.map(value => `<a href="/jamb/${subject}/${value}/">${value}</a>`).join(' · ')}</p></nav>` : ''}
${approved.length ? `<p>${approved.length} reviewed questions with answers and explanations.</p><div class="qcard-list">${approved.map(renderCard).join('\n')}</div>`
    : `<section aria-labelledby="review-heading"><h2 id="review-heading">This ${year === null ? 'subject' : 'paper'} is under review</h2><p>Questions and answer keys will appear here once their sources, wording and answers have been checked.</p><p>You can continue organising your revision with the study planner.</p></section>`}
<p class="jamb-reviewed-actions"><a class="jb-btn jb-btn-primary" href="/tools/study-planner/">Plan your study week</a><a href="/jamb/${subject}/">All ${esc(name)} years</a></p>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
  validatePage(html, approved.map(q => q.id), canonical);
  return { html, approvedIds: approved.map(q => q.id), canonical };
}

function validatePage(html, expectedIds, canonical) {
  for (const tag of ['html', 'head', 'body', 'main']) {
    if ((html.match(new RegExp('<' + tag + '(?:\\s|>)', 'gi')) || []).length !== 1
        || (html.match(new RegExp('</' + tag + '\\s*>', 'gi')) || []).length !== 1) throw new Error('Incomplete document: ' + tag);
  }
  if (!/<\/html>\s*$/.test(html)) throw new Error('Truncated document end');
  const actualIds = [...html.matchAll(/data-reviewed-question="([^"]+)"/g)].map(match => match[1]);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds.map(esc))) throw new Error('Question set differs from approval ledger');
  if ((html.match(/<article\b/g) || []).length !== (html.match(/<\/article>/g) || []).length) throw new Error('Incomplete question card');
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) throw new Error('Canonical mismatch');
  let questionSchemas = 0;
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const schema = JSON.parse(match[1]); if (schema['@type'] === 'Question') questionSchemas++;
  }
  if (questionSchemas !== Math.min(50, expectedIds.length)) throw new Error('Answer schema differs from approved content');
  if (!expectedIds.length && !html.includes('content="noindex, follow"')) throw new Error('Empty review page must be noindex');
}

function atomicWrite(file, html, validate) {
  validate(html);
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === html) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + `.jamb-${process.pid}.tmp`;
  try {
    writeFileSyncWithRetry(temporary, html, 'utf8');
    validate(fs.readFileSync(temporary, 'utf8'));
    renameSyncWithRetry(temporary, file);
  } finally { unlinkSyncWithRetry(temporary); }
  return true;
}

function main(args = process.argv.slice(2)) {
  const privatePool = path.join(ROOT, 'ops/jamb/source-pool.json');
  const pool = JSON.parse(fs.readFileSync(fs.existsSync(privatePool) ? privatePool : path.join(ROOT, 'data/jamb/pools/practice-pool.json'), 'utf8'));
  const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/jamb/review-ledger.json'), 'utf8'));
  const routes = existingRoutes();
  let written = 0;
  for (const route of routes) {
    const [subject, year] = route.split('/');
    const years = routes.filter(value => value.startsWith(subject + '/')).map(value => value.split('/')[1]);
    const page = renderYear(subject, year || null, pool.questions, ledger, years);
    const file = path.join(ROOT, 'jamb', route, 'index.html');
    if (args.includes('--write')) written += Number(atomicWrite(file, page.html, html => validatePage(html, page.approvedIds, page.canonical)));
    else validatePage(fs.readFileSync(file, 'utf8'), page.approvedIds, page.canonical);
  }
  console.log(JSON.stringify({ routes: routes.length, written, policy: 'Only ledger-approved questions and answer schemas; all other source records preserved for review.' }));
}

if (require.main === module) main();
module.exports = { existingRoutes, SUBJECTS, esc, jsonScript, renderYear, validatePage, atomicWrite, main };
