#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { normalizeReleaseOwnedHtml } = require('./lib/release-owned-html-normalizer.js');
const root = path.join(__dirname, '..');
const taxonomy = require(path.join(root, 'assets/js/components/education-taxonomy.js'));
const registrySource = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const registry = vm.runInNewContext(registrySource + ';AFRO_TOOLS', { console });
const audit = taxonomy.auditTaxonomy(registry);
if (audit.duplicateIds.length || audit.missingIds.length || audit.assignedCount !== audit.registryCount) {
  throw new Error('Education directory does not match registry: ' + JSON.stringify(audit));
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
const iconPaths = {
  practice: '<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z"/><path d="M8 3v5h8V3M8 13h8m-8 4h5"/>',
  admissions: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  finance: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18m-6 5h3"/>',
  abroad: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/>',
  coursework: '<path d="M12 7c-2-2-5-2-9-1v13c4-1 7-1 9 1 2-2 5-2 9-1V6c-4-1-7-1-9 1Zm0 0v13"/>',
  teaching: '<path d="M3 5h18v12H3zM8 21h8m-4-4v4M7 9h10m-10 4h6"/>',
  after: '<path d="M12 3 3 7l9 4 9-4-9-4Zm-6 6v6c0 2 3 4 6 4s6-2 6-4V9M21 7v7"/>',
  saved: '<path d="M5 4h14v17l-7-4-7 4V4Z"/>'
};
function icon(key) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconPaths[key] || iconPaths.coursework}</svg>`;
}
function head(title, description, route, type = 'CollectionPage') {
  const url = 'https://afrotools.com' + route;
  const json = JSON.stringify({
    '@context': 'https://schema.org', '@type': type, name: title,
    description, url,
    isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com/' }
  });
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'AfroTools', item: 'https://afrotools.com/' }];
  if (route !== '/education/') crumbs.push({ '@type': 'ListItem', position: 2, name: 'Education Tools', item: 'https://afrotools.com/education/' });
  crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: title, item: url });
  const breadcrumbJson = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | AfroTools</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
${route === '/education/' ? '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/education/">\n<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/elimu/">\n<link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/ilimi/">' : ''}
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)} | AfroTools">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${json}</script>
<script type="application/ld+json">${breadcrumbJson}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/education-discovery.css">
<script src="/assets/js/components/navbar.js" defer></script>
<script src="/assets/js/components/footer.js" defer></script>
<script src="/assets/js/pages/education-discovery.js" defer></script>
</head>`;
}
function pageEnd() {
  return `<afro-footer></afro-footer>
<script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>\n`;
}
function toolLink(tool, card = false) {
  const aliases = (tool.educationAliases || []).join(' ');
  const exams = (tool.educationExams || []).join(' ');
  const attrs = `data-education-tool data-country="${esc((tool.countries || []).join(' '))}" data-exam="${esc(exams)}" data-search="${esc([tool.name, tool.desc, aliases, tool.id].join(' ').toLowerCase())}"`;
  if (card) return `<a class="edu-tool-card" href="${esc(tool.href)}" ${attrs}><strong>${esc(tool.name)}</strong><span>${esc(tool.desc)}</span><b>Open tool <span aria-hidden="true">→</span></b></a>`;
  return `<a href="${esc(tool.href)}" ${attrs}>${esc(tool.name)}</a>`;
}
function breadcrumb(items) {
  return `<nav class="edu-breadcrumb" aria-label="Breadcrumb"><a href="/">AfroTools</a>${items.map((item) => `<span aria-hidden="true">/</span>${item.href ? `<a href="${item.href}">${esc(item.label)}</a>` : `<span aria-current="page">${esc(item.label)}</span>`}`).join('')}</nav>`;
}

const groups = taxonomy.getBuckets(registry);
const byGroup = Object.fromEntries(groups.map((group) => [group.key, group]));
const taskCards = [
  { icon: 'practice', title: 'Practise for an exam', href: '/jamb/', desc: 'Start JAMB practice, or choose WAEC/NECO and KCSE from the directory.', label: 'Start practice' },
  { icon: 'admissions', title: 'Check results and admissions', href: '/tools/waec-calculator/', desc: 'Count credits, calculate a supported score, then check official entry rules.', label: 'Check results' },
  { icon: 'finance', title: 'Pay for education', href: '/education/fees/', desc: 'Compare fee quotes, monthly costs, savings and repayment.', label: 'Compare costs' },
  { icon: 'abroad', title: 'Plan study abroad', href: '/education/study-abroad/', desc: 'Start with a destination budget and identify the evidence still missing.', label: 'Plan a destination' },
  { icon: 'coursework', title: 'Study and coursework', href: '/tools/study-planner/', desc: 'Make a weekly plan, then use writing and calculation tools as needed.', label: 'Make a study plan' }
];
const focusSteps = {
  fees: [
    { id: 'school-fees', title: 'Compare written fee quotes', detail: 'Check the same cost period and list what each quote includes.' },
    { id: 'student-budget', title: 'Test the monthly budget', detail: 'Add living, travel and school costs using amounts you know.' },
    { id: 'edu-savings', title: 'Plan the funding gap', detail: 'Set a target and timeline based on the remaining cost.' }
  ],
  loans: [
    { id: 'student-loan-repay', title: 'Use your loan terms', detail: 'Model a statement-based repayment scenario.' },
    { id: 'ke-helb', title: 'Check HELB separately', detail: 'If relevant, work from your own HELB balance and deduction.' },
    { id: 'student-budget', title: 'Check affordability', detail: 'See how the planned payment fits your monthly budget.' }
  ],
  scholarships: [
    { id: 'scholarship-finder', title: 'Find source-linked options', detail: 'Open current requirements and deadlines at the source.' },
    { id: 'study-abroad-cost', title: 'Estimate the uncovered cost', detail: 'Use a single currency and verified cost figures.' },
    { id: 'university-ranking', title: 'Compare your shortlist', detail: 'Put programme evidence and missing checks side by side.' }
  ],
  'study-abroad': [
    { id: 'study-abroad-cost', title: 'Build the destination budget', detail: 'Start with tuition and living costs you can verify.' },
    { id: 'degree-checker', title: 'Check recognition', detail: 'Find the authority responsible for the qualification route.' },
    { id: 'university-ranking', title: 'Compare programmes', detail: 'Review official links, deadlines and evidence gaps.' }
  ]
};
const primary = ['waec-calculator', 'jamb-aggregate', 'school-fees', 'scholarship-finder', 'study-planner', 'citation-generator'];
const toolMap = Object.fromEntries(taxonomy.getRegistryTools(registry).map((tool) => [tool.id, tool]));
const hub = `${head('Education Tools for African Students', 'Find exam practice, admissions checks, school fee planning, scholarships, study abroad worksheets and coursework tools for African students and families.', '/education/')}
<body class="education-discovery">
<afro-navbar active="education"></afro-navbar>
<main id="main-content" class="edu-shell">
${breadcrumb([{ label: 'Education Tools' }])}
<header class="edu-intro">
  <p class="edu-eyebrow">Education Tools</p>
  <h1>What do you need to do for your studies?</h1>
  <p>Find a practical starting point, complete the task, and keep your plan moving.</p>
  <a class="edu-browse-link" href="#directory">Browse all ${audit.registryCount} Education tools <span aria-hidden="true">↓</span></a>
</header>
<nav class="edu-task-grid" aria-label="Choose an education task">
${taskCards.map((task) => `<a class="edu-task" href="${task.href}"><span class="edu-task-icon">${icon(task.icon)}</span><strong>${esc(task.title)}</strong><span class="edu-task-desc">${esc(task.desc)}</span><b>${esc(task.label)} <span aria-hidden="true">→</span></b></a>`).join('\n')}
</nav>
<section class="edu-section" aria-labelledby="search-heading">
  <h2 id="search-heading">Find an education tool</h2>
  <div class="edu-search">
    <label for="education-search">Search by task or tool name</label>
    <input id="education-search" type="search" placeholder="Try JAMB aggregate, WASSCE, GPA or citations" autocomplete="off">
    <div class="edu-filters">
      <div><label for="education-country">Country (optional)</label><select id="education-country"><option value="">All countries</option><option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="KE">Kenya</option><option value="ZA">South Africa</option></select></div>
      <div><label for="education-exam">Exam (optional)</label><select id="education-exam"><option value="">All exams</option><option value="jamb">JAMB</option><option value="waec">WAEC / NECO</option><option value="wassce">WASSCE</option><option value="kcse">KCSE</option><option value="nsc">NSC</option><option value="ielts">IELTS</option></select></div>
    </div>
    <button class="edu-clear" id="education-clear" type="button" hidden>Clear search and filters</button>
    <p id="education-search-status" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="edu-section" id="education-starting-tools" aria-labelledby="start-heading">
  <h2 id="start-heading">Useful starting tools</h2>
  <div class="edu-tool-grid">${primary.map((id) => toolLink(toolMap[id], true)).join('\n')}</div>
</section>
<section class="edu-return" aria-labelledby="return-heading">
  <div><h2 id="return-heading">Continue your study work</h2><p>Open your locally saved plans, shortlists and deadlines on this device.</p></div>
  <a class="btn btn-primary" href="/tools/education-hub/">Open My Study Space</a>
</section>
<section class="edu-section" id="directory" aria-labelledby="directory-heading">
  <h2 id="directory-heading">All Education tools</h2>
  <p class="edu-muted">Browse the complete ${audit.registryCount}-tool directory. Each link opens the specific tool.</p>
  <div class="edu-directory">
${groups.map((group, index) => `<details class="edu-directory-group" data-default-open="${index === 0 ? 'true' : 'false'}"${index === 0 ? ' open' : ''}><summary><h3><span class="edu-directory-icon">${icon(group.key)}</span><span class="edu-directory-heading"><strong>${esc(group.title)}</strong><small>${group.allTools.length} ${group.allTools.length === 1 ? 'tool' : 'tools'}</small></span><svg class="edu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></h3></summary><div class="edu-directory-links">${group.allTools.map((tool) => toolLink(tool)).join('')}</div></details>`).join('\n')}
  </div>
  <p id="education-no-results" class="edu-empty" hidden>No tools match these filters. Clear a filter or try another term.</p>
</section>
<nav class="edu-secondary" aria-label="More education paths">
  <a href="/education/fees/">Parents and guardians <span aria-hidden="true">→</span></a>
  <a href="/tools/teacher-salary/">Teaching and school operations <span aria-hidden="true">→</span></a>
  <a href="/tools/cert-roi/">After graduation <span aria-hidden="true">→</span></a>
</nav>
<nav class="edu-context" aria-label="Focused education routes">
  <a href="/jamb/english/2025/">2025 JAMB English practice</a><a href="/education/loans/">Student loans</a><a href="/education/scholarships/">Scholarships</a><a href="/education/study-abroad/">Study abroad</a><a href="/education/afrostudy/">AfroStudy</a>
</nav>
</main>${pageEnd()}`;

function subhub(slug) {
  const data = taxonomy.getSubhub(slug, registry);
  const title = data.title;
  const route = '/education/' + slug + '/';
  const first = data.tools[0];
  const steps = focusSteps[slug].map((step) => ({ ...step, tool: toolMap[step.id] }));
  return `${head(title, data.description, route)}
<body class="education-discovery">
<afro-navbar active="education"></afro-navbar>
<main id="main-content" class="edu-shell">
${breadcrumb([{ href: '/education/', label: 'Education Tools' }, { label: title }])}
<header class="edu-intro">
  <p class="edu-eyebrow"><span class="edu-inline-icon">${icon(slug === 'fees' || slug === 'loans' ? 'finance' : 'abroad')}</span> Education Tools</p>
  <h1>${esc(title)}</h1>
  <p>${esc(data.description)}</p>
  <a class="btn btn-primary" href="${esc(first.href)}">Start with ${esc(first.name)}</a>
</header>
<section class="edu-section" aria-labelledby="path-heading">
  <h2 id="path-heading">A practical path</h2>
  <ol class="edu-path-steps">${steps.map((step, index) => `<li><span class="edu-step-number">${index + 1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.detail)}</p><a href="${esc(step.tool.href)}">${esc(step.tool.name)} <span aria-hidden="true">→</span></a></div></li>`).join('')}</ol>
</section>
<section class="edu-section" aria-labelledby="focused-heading">
  <h2 id="focused-heading">Tools for this task</h2>
  <div class="edu-tool-grid" id="edu-subhub-tools">${data.tools.map((tool) => toolLink(tool, true)).join('\n')}</div>
</section>
<nav class="edu-secondary" aria-label="Continue planning" id="edu-subhub-links">
${data.relatedLinks.map((link) => `<a href="${esc(link.href)}">${esc(link.label)} <span aria-hidden="true">→</span></a>`).join('')}
  <a href="/tools/education-hub/">Continue in My Study Space <span aria-hidden="true">→</span></a>
</nav>
</main>${pageEnd()}`;
}

const outputs = [
  ['education/index.html', hub],
  ...['fees', 'loans', 'scholarships', 'study-abroad'].map((slug) => [`education/${slug}/index.html`, subhub(slug)])
];
const check = process.argv.includes('--check');
let stale = false;
for (const [file, content] of outputs) {
  const target = path.join(root, file);
  if (check) {
    const normalized = (html) => normalizeReleaseOwnedHtml(html, { stripReleaseMetadata: true, stripRouteContractLinks: true });
    if (!fs.existsSync(target) || normalized(fs.readFileSync(target, 'utf8')) !== normalized(content)) { console.error('Stale Education page: ' + file); stale = true; }
  } else {
    fs.writeFileSync(target, content, 'utf8');
    console.log('Wrote ' + file);
  }
}
if (stale) process.exitCode = 1;
