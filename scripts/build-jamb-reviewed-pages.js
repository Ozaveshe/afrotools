#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { assessQuestion, questionFingerprint } = require('./lib/jamb-content-trust');
const { stableId } = require('./lib/content-integrity');
const { analyticsVersion, bootstrapVersion, canonicalLoaderTag, earlyBootstrapTag } = require('./inject-analytics-loader');
const { writeFileSyncWithRetry, renameSyncWithRetry, unlinkSyncWithRetry } = require('./lib/safe-write');
const { nonvisual } = require('../assets/js/lib/jamb-year-practice');
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

function renderCard(q, showYear = false) {
  return `<article class="qcard" id="q-${esc(q.id)}" data-reviewed-question="${esc(q.id)}">
<h2>${showYear ? esc(q.year) + ' · ' : ''}${q.num == null ? 'Practice question' : 'Question ' + esc(q.num)}</h2>${q.source_provenance ? `\n<p class="qcard-source"><a href="${esc(q.source_provenance.url)}">${esc(q.source_provenance.publisher)} ${esc(q.year)} collection</a> · Original sitting and question number unconfirmed.</p>` : ''}
${q.passage ? `<blockquote style="white-space:pre-wrap;">${esc(q.passage).replace(/[ \t](?=\r?$)/gm, char => char === ' ' ? '&#32;' : '&#9;')}</blockquote>` : ''}
${q.image ? `<div data-reviewed-figure="${questionFingerprint(q)}" role="status">Enable JavaScript to verify this question's diagram before viewing its answer.</div>` : ''}
<p class="qcard-text">${esc(q.question)}</p>
<ol type="A">${Object.keys(q.options).sort().map(key => `<li>${esc(q.options[key])}</li>`).join('')}</ol>
<details${q.image ? ' hidden style="display:none"' : ''}><summary>Answer and explanation</summary><p><strong>${esc(q.answer)}: ${esc(q.options[q.answer])}</strong></p><p>${esc(q.explanation || q.ai_explanation)}</p>${q.verification?.method === 'ai-calculation-checked' ? '<small>AI-reviewed · calculation checked</small>' : q.verification?.method === 'ai-source-checked' ? '<small>AI-reviewed · source checked</small>' : ''}</details>
</article>`;
}

const ENGLISH_SKILL_STARTERS = [
  { id: 'english-2020-1-68923e3396b6', label: 'Reading comprehension', detail: 'Read the passage, then answer from what the writer actually says.' },
  { id: 'english-2025-myschool-74807', label: 'Grammar and agreement', detail: 'Check how the subject controls the form of the verb.' },
  { id: 'english-2025-myschool-74822', label: 'Vocabulary in context', detail: 'Use the sentence to decide which meaning fits.' },
  { id: 'english-2025-myschool-74841', label: 'Idioms and expressions', detail: 'Interpret the phrase as a whole, not word by word.' },
  { id: 'english-2025-myschool-74850', label: 'Oral English', detail: 'Compare the sound asked about with the answer choices.' }
];

function renderEnglishHub(approved, yearCounts, timedYear) {
  if (!approved.length) return '<section aria-labelledby="review-heading"><h2 id="review-heading">This subject is under review</h2><p>Questions and answer keys will appear here once their sources, wording and answers have been checked.</p></section>';
  const count = new Intl.NumberFormat('en').format(approved.length);
  const years = [...yearCounts.keys()].sort((a, b) => b - a);
  const yearLink = value => `<li><a href="/jamb/english/${value}/"><strong>${value}</strong><span>${yearCounts.get(value)} reviewed questions</span></a></li>`;
  const byId = new Map(approved.map(q => [q.id, q]));
  const starters = ENGLISH_SKILL_STARTERS.filter(item => byId.has(item.id)).map(item => {
    const q = byId.get(item.id);
    return `<li><h3>${esc(item.label)}</h3><p>${esc(item.detail)}</p><a href="/jamb/english/${q.year}/#q-${encodeURIComponent(q.id)}">Try a reviewed ${q.year} ${esc(item.label.toLowerCase())} example</a></li>`;
  });
  return `<p class="jamb-hub-lede">Choose a reviewed collection, practise a question, then open its explanation. ${count} reviewed questions are available across ${years.length} year-labelled collections.</p>
<p class="jamb-hub-caveat">A collection year does not confirm the original UTME sitting or question order. These selections have not been verified as complete papers.</p>
${timedYear ? `<section class="jamb-hub-timed" aria-labelledby="timed-heading"><h2 id="timed-heading">Try a timed English session</h2><p>Practise 40 questions from the reviewed 2025 collection in 40 minutes. This is collection practice, not a confirmed complete paper.</p><div class="jamb-reviewed-actions"><a class="jb-btn jb-btn-primary" href="/jamb/cbt/?subject=english&amp;year=2025">Start reviewed 2025 CBT</a><a href="/jamb/english/2025/">Browse the 2025 questions</a></div></section>` : ''}
${starters.length ? `<section class="jamb-hub-skills" aria-labelledby="skill-heading"><h2 id="skill-heading">Start with a skill</h2><p>Each link opens one reviewed example in its year collection. Choose a year below for more practice.</p><ul>${starters.join('')}</ul></section>` : ''}
<section class="jamb-hub-years" aria-labelledby="year-heading"><h2 id="year-heading">Browse reviewed years</h2><p>Counts show the questions available here, not the length of the original exam.</p><nav aria-label="Browse paper years"><ul>${years.slice(0, 10).map(yearLink).join('')}</ul>${years.length > 10 ? `<details><summary>Show ${years.length - 10} earlier years</summary><ul>${years.slice(10).map(yearLink).join('')}</ul></details>` : ''}</nav></section>`;
}

function renderYear(subject, year, candidates, ledger, years = []) {
  if (!SUBJECTS[subject] || (year !== null && !/^\d{4}$/.test(String(year)))) throw new Error('Unknown JAMB subject/year route');
  const ids = new Set();
  const counts = new Map();
  for (const q of candidates) counts.set(q.id, (counts.get(q.id) || 0) + 1);
  const duplicateIds = new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
  const approved = candidates.filter(q => q.subject === subject && (year === null || String(q.year) === String(year))
    && assessQuestion(q, ledger, { duplicateIds }).state === 'eligible');
  for (const q of approved) { if (ids.has(q.id)) throw new Error('Duplicate approved question ID'); ids.add(q.id); }
  approved.sort((a, b) => (year === null ? b.year - a.year : 0) || a.num - b.num || a.id.localeCompare(b.id));
  const yearCounts = new Map();
  for (const q of approved) yearCounts.set(q.year, (yearCounts.get(q.year) || 0) + 1);
  const name = SUBJECTS[subject];
  const paper = year === null ? name : name + ' ' + year;
  const englishHub = subject === 'english' && year === null;
  const rendered = englishHub ? [] : approved;
  const publisherCollection = year !== null && approved.length > 0 && approved.every(q => q.source_provenance?.year_basis === 'publisher-collection');
  const multiplePublisherCollections = publisherCollection && new Set(approved.map(q => q.source_provenance.publisher)).size > 1;
  const collectionLabel = multiplePublisherCollections ? 'collections' : 'collection';
  const collectionArticle = multiplePublisherCollections ? '' : 'a ';
  const english2024Practice = subject === 'english' && String(year) === '2024';
  const timedPracticeMinimum = english2024Practice ? 30 : 40;
  const nonvisualPracticeCount = approved.filter(q => !q.image && !q.has_diagram).length;
  const timedPracticeCollection = ((subject === 'english' && ['2024', '2025'].includes(String(year)))
    || (subject === 'mathematics' && ['2023', '2024', '2025'].includes(String(year))))
    && publisherCollection && nonvisualPracticeCount >= timedPracticeMinimum;
  const quickPracticeCollection = year !== null && ['english', 'mathematics'].includes(subject)
    && Number(year) >= 2021 && Number(year) <= 2025 && publisherCollection && approved.filter(nonvisual).length >= 10;
  const quickPractice = quickPracticeCollection ? `<section class="jamb-reviewed-practice" aria-label="10-question quick practice"><h2>Try a short practice session</h2><p>Answer 10 distinct reviewed ${esc(name)} questions from this ${esc(year)} collection in 30 minutes, then see your raw score and explanations. This is a practice selection, not a confirmed complete UTME paper.</p><a class="jb-btn jb-btn-secondary" href="/jamb/cbt/?subject=${encodeURIComponent(subject)}&amp;year=${encodeURIComponent(year)}&amp;mode=quick">Start 10-question ${esc(year)} ${esc(name)} quick practice</a></section>` : '';
  const timedPracticeQuantity = english2024Practice && nonvisualPracticeCount === approved.length
    ? `Practise ${Math.min(40, nonvisualPracticeCount)}` : 'Take up to 40';
  const englishTimedCollection = englishHub ? approved.filter(q => Number(q.year) === 2025) : [];
  const englishTimedYear = englishTimedCollection.length > 0
    && englishTimedCollection.every(q => q.source_provenance?.year_basis === 'publisher-collection')
    && englishTimedCollection.filter(q => !q.image && !q.has_diagram).length >= 40;
  const canonical = `https://afrotools.com/jamb/${subject}/${year === null ? '' : year + '/'}`;
  const title = englishHub && approved.length ? 'JAMB Use of English practice by year | AfroJAMB' : `JAMB ${paper}${publisherCollection ? ' ' + collectionLabel : ''} — ${approved.length ? 'Reviewed practice' : 'Content review'} | AfroJAMB`;
  const description = englishHub && approved.length ? `Browse reviewed JAMB Use of English questions by year, try a skill starter and ${englishTimedYear ? 'practise a timed reviewed collection' : 'plan your next study session'}. Year labels do not confirm original UTME sittings.`
    : publisherCollection ? `Practise ${approved.length} reviewed questions adapted from ${collectionArticle}publisher-labelled ${year} JAMB ${name} ${collectionLabel}. The original UTME sitting and question numbers are unconfirmed.`
    : approved.length ? `Practise ${approved.length} reviewed JAMB ${paper} questions. Check answers, open worked explanations and plan your next revision session with AfroJAMB.`
    : `The ${paper} question collection is under review. Use the study planner while sources, questions and answer keys are checked.`;
  const schemas = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical, description },
    ...rendered.slice(0, 50).map(q => ({ '@context': 'https://schema.org', '@type': 'Question', name: q.question,
      text: [q.passage, q.question].filter(Boolean).join('\n\n'), url: canonical + '#q-' + encodeURIComponent(q.id),
      acceptedAnswer: { '@type': 'Answer', text: q.options[q.answer] }, answerExplanation: q.explanation || q.ai_explanation }))];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${earlyBootstrapTag(bootstrapVersion(), analyticsVersion())}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="afrotools-source-owner" content="scripts/build-jamb-reviewed-pages.js">
<meta name="afrotools-content-id" content="${stableId(new URL(canonical).pathname)}">
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
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/jamb.css">
<link rel="stylesheet" href="/assets/css/jamb-reviewed-pages.css">
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>${rendered.some(q => q.image) ? '\n<script src="/assets/js/lib/jamb-question-trust.js" defer></script>\n<script src="/assets/js/lib/jamb-reviewed-figure.js" defer></script>\n<script src="/assets/js/pages/jamb-reviewed-page-figures.js" defer></script>' : ''}
${schemas.map(schema => `<script type="application/ld+json">${jsonScript(schema)}</script>`).join('\n')}
</head>
<body class="jamb-page">
<afro-navbar active="education"></afro-navbar>
<main class="jb-wrap jamb-reviewed-paper${englishHub ? ' jamb-english-hub' : ''}">
<nav aria-label="Breadcrumb"><a href="/education/">Education</a> / <a href="/jamb/">AfroJAMB</a> / ${englishHub ? esc(name) : `<a href="/jamb/${subject}/">${esc(name)}</a> ${year === null ? '' : '/ ' + year}`}</nav>
<h1>${englishHub && approved.length ? 'JAMB Use of English practice by year' : `JAMB ${esc(paper)}${publisherCollection ? ' practice collection' : ''}`}</h1>
${subject === 'mathematics' && year === null ? '<p><a href="/jamb/mathematics/recent-practice/">Practise five Mathematics tasks from a source-labelled 2023 collection</a></p>' : ''}
${englishHub ? renderEnglishHub(approved, yearCounts, englishTimedYear) : year === null && approved.length ? `<nav aria-label="Browse paper years"><h2>Browse by year</h2><p>${[...yearCounts.keys()].sort((a,b) => b-a).map(value => `<a href="/jamb/${subject}/${value}/">${value} (${yearCounts.get(value)})</a>`).join(' · ')}</p></nav>` : ''}
${englishHub ? '' : approved.length ? `<p>${approved.length} reviewed questions with answers and explanations.</p><p>${publisherCollection ? `These adapted questions come from ${collectionArticle}publisher-labelled ${esc(year)} ${collectionLabel}. The original UTME sitting and question numbers are unconfirmed. ` : ''}Practice selection: full-paper coverage has not been confirmed.</p>${timedPracticeCollection ? `<section class="jamb-reviewed-practice" aria-label="Timed CBT practice"><h2>Test yourself before reading answers</h2><p>${timedPracticeQuantity} reviewed ${esc(name)} questions from ${collectionArticle}publisher-labelled ${esc(year)} ${collectionLabel}${english2024Practice ? ' in 40 minutes' : ' in a timed CBT session'}. See your raw score and explanations afterward. This is not a confirmed complete UTME paper.</p><a class="jb-btn jb-btn-primary" href="/jamb/cbt/?subject=${encodeURIComponent(subject)}&amp;year=${encodeURIComponent(year)}">Start ${esc(year)} ${esc(name)} CBT practice</a></section>` : ''}${quickPractice}<div class="qcard-list">${approved.map(q => renderCard(q, year === null)).join('\n')}</div>`
    : `<section aria-labelledby="review-heading"><h2 id="review-heading">This ${year === null ? 'subject' : 'paper'} is under review</h2><p>Questions and answer keys will appear here once their sources, wording and answers have been checked.</p><p>You can continue organising your revision with the study planner.</p></section>`}
<p class="jamb-reviewed-actions"><a class="jb-btn${englishHub ? '' : ' jb-btn-primary'}" href="/tools/study-planner/">Plan your study week</a>${englishHub ? '<a href="/jamb/">Explore AfroJAMB</a>' : `<a href="/jamb/${subject}/">All ${esc(name)} years</a>`}</p>
</main>
<afro-footer></afro-footer>
${canonicalLoaderTag(analyticsVersion())}
</body>
</html>
`;
  const renderedIds = rendered.map(q => q.id);
  const allowEmptyIndex = englishHub && approved.length > 0;
  validatePage(html, renderedIds, canonical, { allowEmptyIndex });
  return { html, approvedIds: approved.map(q => q.id), renderedIds, allowEmptyIndex, canonical };
}

function validatePage(html, expectedIds, canonical, { allowEmptyIndex = false } = {}) {
  for (const tag of ['html', 'head', 'body', 'main']) {
    if ((html.match(new RegExp('<' + tag + '(?:\\s|>)', 'gi')) || []).length !== 1
        || (html.match(new RegExp('</' + tag + '\\s*>', 'gi')) || []).length !== 1) throw new Error('Incomplete document: ' + tag);
  }
  if (!/<\/html>\s*$/.test(html)) throw new Error('Truncated document end');
  const actualIds = [...html.matchAll(/data-reviewed-question="([^"]+)"/g)].map(match => match[1]);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds.map(esc))) throw new Error('Question set differs from approval ledger');
  if ((html.match(/<article\b/g) || []).length !== (html.match(/<\/article>/g) || []).length) throw new Error('Incomplete question card');
  for (const card of html.matchAll(/<article\b[^>]*data-reviewed-question="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)) {
    const stem = card[2].match(/<p\b[^>]*class="[^"]*\bqcard-text\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (!stem || !stem[1].replace(/<[^>]*>/g, '').trim()) throw new Error('Missing question text: ' + card[1]);
    const answer = card[2].match(/<details\b[^>]*>([\s\S]*?)<\/details>/);
    if (!answer || !/<summary\b/.test(answer[1]) || (answer[1].match(/<p\b/g) || []).length < 2) throw new Error('Missing answer explanation: ' + card[1]);
  }
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) throw new Error('Canonical mismatch');
  let questionSchemas = 0;
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const schema = JSON.parse(match[1]); if (schema['@type'] === 'Question') questionSchemas++;
  }
  if (questionSchemas !== Math.min(50, expectedIds.length)) throw new Error('Answer schema differs from approved content');
  if (!expectedIds.length && !allowEmptyIndex && !html.includes('content="noindex, follow"')) throw new Error('Empty review page must be noindex');
  if (allowEmptyIndex && !html.includes('content="index, follow"')) throw new Error('Reviewed directory must be indexable');
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
  const routeSet = new Set(existingRoutes());
  for (const q of pool.questions) {
    if (SUBJECTS[q.subject] && Number.isInteger(q.year) && q.year >= 1978 && q.year <= 2100
        && assessQuestion(q, ledger).state === 'eligible') {
      routeSet.add(q.subject);
      routeSet.add(q.subject + '/' + q.year);
    }
  }
  const routes = [...routeSet].sort();
  let written = 0;
  for (const route of routes) {
    const [subject, year] = route.split('/');
    const years = routes.filter(value => value.startsWith(subject + '/')).map(value => value.split('/')[1]);
    const page = renderYear(subject, year || null, pool.questions, ledger, years);
    const file = path.join(ROOT, 'jamb', route, 'index.html');
    if (args.includes('--write')) written += Number(atomicWrite(file, page.html, html => validatePage(html, page.renderedIds, page.canonical, { allowEmptyIndex: page.allowEmptyIndex })));
    else validatePage(fs.readFileSync(file, 'utf8'), page.renderedIds, page.canonical, { allowEmptyIndex: page.allowEmptyIndex });
  }
  console.log(JSON.stringify({ routes: routes.length, written, policy: 'Only ledger-approved questions and answer schemas; all other source records preserved for review.' }));
}

if (require.main === module) main();
module.exports = { existingRoutes, SUBJECTS, esc, jsonScript, renderYear, validatePage, atomicWrite, main };
