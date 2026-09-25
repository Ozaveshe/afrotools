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
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)} | AfroTools">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta property="article:modified_time" content="2026-09-25">
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
  { title: 'Practise for an exam', href: '/jamb/', desc: 'Start JAMB practice, or choose WAEC/NECO and KCSE from the directory.', label: 'Start practice' },
  { title: 'Check results and admissions', href: '/tools/waec-calculator/', desc: 'Count credits, calculate a supported score, then check official entry rules.', label: 'Check results' },
  { title: 'Pay for education', href: '/education/fees/', desc: 'Compare fee quotes, monthly costs, savings and repayment.', label: 'Compare costs' },
  { title: 'Plan study abroad', href: '/education/study-abroad/', desc: 'Start with a destination budget and identify the evidence still missing.', label: 'Plan a destination' },
  { title: 'Study and coursework', href: '/tools/study-planner/', desc: 'Make a weekly plan, then use writing and calculation tools as needed.', label: 'Make a study plan' }
];
const primary = ['waec-calculator', 'jamb-aggregate', 'school-fees', 'scholarship-finder', 'study-planner', 'citation-generator'];
const toolMap = Object.fromEntries(taxonomy.getRegistryTools(registry).map((tool) => [tool.id, tool]));
const hub = `${head('Education Tools', 'Find exam practice, results and admissions checks, fee planning, study abroad tools and coursework help for African students and families.', '/education/')}
<body class="education-discovery">
<afro-navbar active="education"></afro-navbar>
<main id="main-content" class="edu-shell">
${breadcrumb([{ label: 'Education Tools' }])}
<header class="edu-intro">
  <p class="edu-eyebrow">Education Tools</p>
  <h1>What do you need to do for your studies?</h1>
  <p>Find a practical starting point, complete the task, and keep your plan moving.</p>
</header>
<nav class="edu-task-grid" aria-label="Choose an education task">
${taskCards.map((task) => `<a class="edu-task" href="${task.href}"><strong>${esc(task.title)}</strong><span>${esc(task.desc)}</span><b>${esc(task.label)} <span aria-hidden="true">→</span></b></a>`).join('\n')}
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
    <p id="education-search-status" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="edu-section" aria-labelledby="start-heading">
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
${groups.map((group) => `<section class="edu-directory-group"><h3>${esc(group.title)}</h3><div class="edu-directory-links">${group.allTools.map((tool) => toolLink(tool)).join('')}</div></section>`).join('\n')}
  </div>
  <p id="education-no-results" class="edu-empty" hidden>No tools match these filters. Clear a filter or try another term.</p>
</section>
<nav class="edu-secondary" aria-label="More education paths">
  <a href="/education/fees/">Parents and guardians <span aria-hidden="true">→</span></a>
  <a href="/tools/teacher-salary/">Teaching and school operations <span aria-hidden="true">→</span></a>
  <a href="/tools/cert-roi/">After graduation <span aria-hidden="true">→</span></a>
</nav>
<nav class="edu-context" aria-label="Focused education routes">
  <a href="/education/loans/">Student loans</a><a href="/education/scholarships/">Scholarships</a><a href="/education/study-abroad/">Study abroad</a><a href="/education/afrostudy/">AfroStudy</a>
</nav>
</main>${pageEnd()}`;

function subhub(slug) {
  const data = taxonomy.getSubhub(slug, registry);
  const title = data.title;
  const route = '/education/' + slug + '/';
  const first = data.tools[0];
  return `${head(title, data.description, route)}
<body class="education-discovery">
<afro-navbar active="education"></afro-navbar>
<main id="main-content" class="edu-shell">
${breadcrumb([{ href: '/education/', label: 'Education Tools' }, { label: title }])}
<header class="edu-intro">
  <p class="edu-eyebrow">Education Tools</p>
  <h1>${esc(title)}</h1>
  <p>${esc(data.description)}</p>
  <a class="btn btn-primary" href="${esc(first.href)}">Start with ${esc(first.name)}</a>
</header>
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
