'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'content', 'blog-content-explosion-2026-08.json');
const manifestPath = path.join(root, 'data', 'content', 'blog-article-manifest.json');
const hubPath = path.join(root, 'blog', 'index.html');
const write = process.argv.includes('--write');
const START = '<!-- BLOG-CONTENT-EXPLOSION-2026-08:START -->';
const END = '<!-- BLOG-CONTENT-EXPLOSION-2026-08:END -->';
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const clusterCopy = {
  property: {
    category: 'Money &amp; Business', cat: 'business',
    opening: 'Property transactions fail most painfully when a missing document is discovered after a deposit has moved. A checklist cannot certify ownership, but it can make the evidence gaps visible before the buyer commits.',
    method: 'Treat every claim as a verification task. Match names across identity documents, the sale agreement, title records and payment instructions. Inspect the site, use qualified local professionals, and obtain searches from the relevant public authority instead of accepting screenshots supplied by the seller.',
    caution: 'This guide is practical planning information, not a title opinion or legal advice. Land systems and required consents vary by state, county, tenure and transaction type.'
  },
  tenancy: {
    category: 'Money &amp; Business', cat: 'business',
    opening: 'A tenancy agreement is useful only when it describes the same property, payments and responsibilities the parties actually agreed. The safest time to resolve ambiguity is before rent, deposit or keys change hands.',
    method: 'Walk through the property together, photograph the condition, record meter readings and list every included item. Put payment channels, repair duties, notice and handover rules in writing. Both parties should keep the signed agreement and every receipt.',
    caution: 'This is a drafting and review checklist, not legal advice. Residential, commercial and controlled tenancies can follow different rules, so obtain local advice for disputes or unusual clauses.'
  },
  payments: {
    category: 'Money &amp; Business', cat: 'business',
    opening: 'The best payment reminder is short, accurate and easy to act on. It identifies the invoice, amount and due date, then asks for payment or a specific response without adding threats that were never agreed.',
    method: 'Use a measured sequence: confirm delivery, send a before-due reminder, follow up on the due date, then escalate at documented intervals. Pause automation when a customer disputes the work, reports fraud or asks for corrected account details.',
    caution: 'The wording here is business communication, not a statutory demand or legal notice. Do not add interest, collection charges or legal consequences unless the contract and applicable law support them.'
  },
  payslip: {
    category: 'Tax &amp; PAYE', cat: 'tax',
    opening: 'A payslip should explain how gross earnings became take-home pay. The fastest check is to separate employee deductions from employer-only costs, then reconcile the final net figure with the amount actually received.',
    method: 'Read the slip from top to bottom: pay period and identity, earnings, taxable pay, statutory deductions, voluntary deductions, reimbursements and net pay. Compare each unfamiliar line with the employment contract, HR explanation and current official guidance.',
    caution: 'Payroll rules and thresholds change. This guide explains the reading process and deliberately avoids treating a static example as a current official assessment.'
  },
  passport: {
    category: 'Tools &amp; Guides', cat: 'tools',
    opening: 'Passport renewal becomes much easier when the online record, original documents, copies, payment and appointment details all tell the same story. Requirements can change by application type and location, so the official portal must remain the final authority.',
    method: 'Choose the correct renewal, replacement or correction route first. Complete the application yourself, preserve the reference and receipt, and take the originals requested by the issuing authority. Check names, dates and passport details before submission and again at collection.',
    caution: 'Do not pay unofficial agents or rely on copied fee tables. Use the official immigration or passport portal and confirm requirements again shortly before the appointment.'
  },
  funeral: {
    category: 'Culture &amp; Life', cat: 'culture',
    opening: 'Funeral spending can expand quickly because decisions are emotional, distributed across relatives and made under time pressure. A shared budget helps the family protect essentials while making optional choices visible.',
    method: 'Name one coordinator and one record keeper. Log quotes, pledges, cash received, supplier deposits and unpaid balances separately. Agree who can approve a new expense and update the family after each major commitment.',
    caution: 'Costs vary by location, faith, tradition, season and family preference. Use current written quotes. The calculator is a planning aid, not a price list or instruction about how a family should mourn.'
  },
  energy: {
    category: 'Tools &amp; Guides', cat: 'tools',
    opening: 'Energy estimates become useful when they start with measured consumption. Nameplate ratings and online averages are starting points, but purchase decisions should use appliance labels, fuel receipts, runtime logs and written equipment quotes.',
    method: 'Measure a typical week, separate essential from optional loads, and show every assumption with units. Run a low, expected and high case so fuel-price changes, losses, extra runtime or a new appliance do not surprise the budget.',
    caution: 'This is a planning estimate, not an electrical design or installer quotation. Have a qualified professional verify wiring, protection, ventilation, earthing, surge capacity and equipment compatibility.'
  }
};

function esc(value) {
  return String(value).replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char]));
}

function normalizeBuildOwnedArticleHtml(html) {
  let normalized = String(html)
    .replace(/\r\n/g, '\n')
    .replace(/\s+data-chat-bundle="[^"]*"/, '')
    .replace(/\?v=[a-f0-9]{8}(?=["'])/g, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/lazy-analytics\.js" defer><\/script>[ \t]*\n?/gm, '');

  const routeLinks = [];
  normalized = normalized.replace(/^[ \t]*<link rel="(?:canonical|alternate)"[^>]*>[ \t]*\n?/gm, link => {
    routeLinks.push(link.trim());
    return '';
  });

  if (routeLinks.length) {
    const routeLinkBlock = `${routeLinks.join('\n')}\n`;
    normalized = normalized.replace(
      /(<meta name="author"[^>]*>\n)/,
      `$1${routeLinkBlock}`
    );
  }

  return normalized.replace(/\n{3,}/g, '\n\n');
}

function articleId(slug) {
  return crypto.createHash('sha1').update(`blog/${slug}/index.html`).digest('hex').slice(0, 14);
}

function list(items) {
  return `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function checklistRows(record) {
  return record.specifics.map((item, index) => `<tr><td>${index + 1}</td><td>${esc(item)}</td><td>Owner named, source checked, copy saved</td></tr>`).join('');
}

function tailoredSection(record) {
  if (record.cluster === 'payments') {
    return `<h2 id="templates">Copy-ready reminder templates</h2>
<p>Replace every bracketed field and remove sentences that do not match the agreement. Never send bank details from an unverified number or email address.</p>
<h3>Friendly reminder before the due date</h3>
<blockquote><p>Hello [Name], a quick reminder that invoice [Number] for [Amount and Currency] is due on [Date]. I have attached the invoice again for convenience. Please let me know if anything needs correcting before the due date. Thank you.</p></blockquote>
<h3>Due-today reminder</h3>
<blockquote><p>Hello [Name], invoice [Number] for [Amount and Currency] is due today, [Date]. You can pay using [agreed method]. If payment has already been sent, please share the reference so I can update the record.</p></blockquote>
<h3>First overdue follow-up</h3>
<blockquote><p>Hello [Name], our records show invoice [Number] for [Amount and Currency] became due on [Date] and remains outstanding. Please confirm payment by [Response Date], or tell me today if there is a query preventing payment.</p></blockquote>
<h3>Firm escalation</h3>
<blockquote><p>Dear [Name], this is a formal business follow-up on invoice [Number]. The outstanding balance is [Amount and Currency], originally due on [Date]. Please pay or provide a written dispute by [Deadline]. If I do not hear from you, I will review the next step available under our agreement.</p></blockquote>
<p>A final reminder should remain factual. It should not claim that court action, account suspension, credit reporting or collection fees are automatic. If legal escalation is genuinely being considered, have the final letter reviewed in the relevant jurisdiction.</p>`;
  }
  if (record.cluster === 'payslip') {
    return `<h2 id="reconcile">How to reconcile the payslip</h2>
<p>Start with this identity: <strong>gross earnings plus taxable benefits, less employee deductions, plus reimbursements, equals net pay</strong>. Employer contributions may appear for transparency, but they should not reduce the employee's pay unless the official rules and payroll record classify them as an employee contribution.</p>
<ol><li>Confirm the employer, employee, pay period and payment frequency.</li><li>Add basic salary, overtime, commission, bonus and cash allowances.</li><li>Identify benefits included in taxable employment income.</li><li>Compare the PAYE line with the current official calculator or guidance.</li><li>Check pension or social-security lines and who bears each share.</li><li>Match loans, advances or voluntary deductions to written authority.</li><li>Recalculate net pay and compare it with the bank or mobile-money credit.</li></ol>
<p>If payroll cannot explain a line, ask for the line name, calculation base, rate or amount, period and source. Keep the reply with the payslip. A calculator estimate can reveal a mismatch, but payroll and the relevant authority must resolve the official amount.</p>`;
  }
  if (record.cluster === 'passport') {
    return `<h2 id="appointment">Application and appointment workflow</h2>
<ol><li>Open the official portal from the issuing authority's website, not from a forwarded payment message.</li><li>Select renewal only if it matches your situation. Loss, damage, changed details and applications for minors may need different evidence.</li><li>Enter names, dates and identity numbers exactly as supported by the documents.</li><li>Save the application reference, invoice, payment receipt and appointment confirmation.</li><li>Prepare originals and copies in the same order as the official checklist.</li><li>Attend biometrics in person where required and keep the acknowledgement.</li><li>At collection, inspect the biographical page before leaving the centre.</li></ol>
<p>Do not assume the photograph used for a previous passport will be accepted again. The issuing authority may capture biometrics at the centre or apply current photo rules. Use the linked AfroTools photo guide only as preparation, then follow the current official instruction.</p>`;
  }
  if (record.cluster === 'funeral') {
    return `<h2 id="budget">Build the budget in three lanes</h2>
<p><strong>Lane one is essential administration and care.</strong> It covers the records, permits, mortuary or body-care needs, burial or cremation arrangements and necessary transport. <strong>Lane two is the agreed programme.</strong> It covers worship, traditional observances, venue, seating, sound, food and movement of guests. <strong>Lane three is optional remembrance.</strong> It covers clothing, media, printing, souvenirs and later events.</p>
<p>For each line, record the expected amount, written quote, supplier, deposit, balance, due date and approver. Keep pledges separate from money already received. A pledge is not available cash until it arrives. Keep emergency reserve separate as well, so it is not quietly spent on optional additions.</p>
<p>After the funeral, reconcile every cash transfer and supplier receipt. A clear close-out protects the organisers and gives the family a useful record if later memorial expenses arise.</p>`;
  }
  if (record.cluster === 'energy') {
    return `<h2 id="formula">Use a formula with visible units</h2>
<p>Write the calculation in a form another person can audit. For generator planning, hourly fuel cost equals measured litres per hour multiplied by the current price per litre. Total operating cost then adds oil, scheduled service, repairs and a replacement provision. For battery planning, daily watt-hours equal appliance watts multiplied by quantity and hours of use. Required nominal storage then adjusts for usable depth of discharge, inverter losses and the desired backup period.</p>
<p>Do not mix watts, watt-hours and kilowatt-hours. Watts describe power at a moment. Watt-hours describe energy over time. Divide watt-hours by 1,000 to get kilowatt-hours. For motors, pumps and refrigerators, ask about starting surge because the inverter or generator must handle the brief peak even when average consumption is modest.</p>
<p>Run the calculation again after one week of measured use. The revised result is normally more valuable than an elaborate model based on guessed hours.</p>`;
  }
  return `<h2 id="verification">Verification before signature or payment</h2>
<p>Create a small evidence folder with one subfolder for identity, one for the property or agreement, one for official searches, and one for money. Name files with the date and document type. A clean folder makes contradictions easier to spot and gives a lawyer, agent, registrar or dispute-resolution body something coherent to review.</p>
<p>Never treat a watermark, stamp, QR code or photocopy as proof by itself. Verify through the issuing authority or an appropriately qualified professional. When a representative signs, obtain evidence of authority. When payment details change, confirm them through a previously trusted channel before sending money.</p>
<p>If a material search is pending, write that fact into the transaction timeline and avoid describing the deal as cleared. A useful checklist records both completed checks and unresolved questions.</p>`;
}

function faqItems(record) {
  const noun = record.cluster === 'payslip' ? 'deduction' : record.cluster === 'passport' ? 'requirement' : record.cluster === 'energy' ? 'estimate' : 'check';
  return [
    [`What is the first step for ${record.keyword}?`, `Start with the official or original records, then use the checklist to identify missing evidence. The practical goal is to ${record.promise}.`],
    [`Can AfroTools confirm the final ${noun}?`, `No. AfroTools organises a planning calculation or checklist. The relevant authority, employer, professional, supplier or contracting party must confirm the official or final position.`],
    [`How current is this ${record.country} guide?`, `The source links were reviewed on ${data.reviewedLabel}. Requirements, prices, rates and portal steps can change, so check the official links again before acting.`],
    [`What records should I keep?`, `Keep the application, agreement or invoice, identity and authority records, calculations, receipts, correspondence, confirmations and the final output. Use filenames with dates so the sequence remains clear.`],
    [`Which AfroTools tool supports this workflow?`, `Use the ${record.tool[1]} to build a first-pass checklist or estimate, then replace defaults with your own documents and current official information.`]
  ];
}

function renderFaq(record) {
  return faqItems(record).map(([q, a]) => `<div class="faq-item"><button class="faq-question" type="button" onclick="this.parentElement.classList.toggle('open')">${esc(q)} <span class="faq-chevron">&#9660;</span></button><div class="faq-answer"><div class="faq-answer-inner"><p>${esc(a)}</p></div></div></div>`).join('\n');
}

function articleBody(record) {
  const cluster = clusterCopy[record.cluster];
  const specifics = record.specifics;
  return `<p>${esc(cluster.opening)}</p>
<p>This guide answers the search for <strong>${esc(record.keyword)}</strong> with a working sequence, not a thin list. Its purpose is to ${esc(record.promise)}. Start with the <a href="${record.tool[0]}">${esc(record.tool[1])}</a>, then verify every important detail against current documents and the official sources below.</p>
<p><strong>Official sources reviewed:</strong> <strong>${data.reviewedLabel}</strong>. ${esc(cluster.caution)}</p>

<h2 id="quick-answer">Quick answer: what to prepare</h2>
<p>A complete first-pass file should cover these five control points. The last column is deliberately evidence-focused: a statement such as “the agent confirmed it” is not a durable record.</p>
<div class="table-wrapper"><table><thead><tr><th>#</th><th>Control point</th><th>Completion evidence</th></tr></thead><tbody>${checklistRows(record)}</tbody></table></div>
<p>Assign a person to each missing item and a date for the next check. If an item does not apply, write why. Blank cells invite assumptions; an explicit “not applicable because…” can be reviewed.</p>

<h2 id="why">Why this checklist matters</h2>
<p>${esc(cluster.method)}</p>
<p>The most expensive mistakes rarely begin with difficult arithmetic. They begin with inconsistent names, an old document, a missing page, an unsupported fee, a verbal promise or a payment sent before the other side has completed a basic obligation. A disciplined file slows the decision down just enough to expose those gaps.</p>
<p>It also improves communication. Instead of asking “is everything ready?”, ask for one named document, source, amount, owner and deadline. That makes it possible to distinguish a genuine delay from a fact that nobody has checked.</p>

<h2 id="workflow">Step-by-step workflow</h2>
<ol>
<li><strong>Define the exact task.</strong> Write the country, parties, date, transaction or pay period, and the outcome you need. Similar-looking processes can have different requirements.</li>
<li><strong>Open the primary source.</strong> Begin with the issuing authority, regulator, employer record or signed agreement. Search summaries are discovery aids, not the final instruction.</li>
<li><strong>Collect the five control points.</strong> For this guide they are ${esc(specifics.slice(0, -1).join(', '))}, and ${esc(specifics[specifics.length - 1])}.</li>
<li><strong>Match names, dates and amounts.</strong> Resolve spelling differences, expired records, unexplained balances and changed payment details before moving forward.</li>
<li><strong>Calculate separately.</strong> Keep assumptions, rates, quantities and units visible. Do not type over the original invoice, payslip, quote or official record.</li>
<li><strong>Record questions and answers.</strong> Save written clarifications with the file. If advice is important, note who gave it, their role and the date.</li>
<li><strong>Run a final stop check.</strong> Ask what fact, if wrong, would make you delay payment, signature, submission or purchase. Verify that fact once more through a trusted channel.</li>
</ol>

${tailoredSection(record)}

<h2 id="mistakes">Common mistakes to avoid</h2>
<ul>
<li><strong>Using an old screenshot as current truth.</strong> Reopen the source and note the date reviewed.</li>
<li><strong>Confusing a checklist with approval.</strong> A complete list does not certify authenticity, eligibility, title, tax or safety.</li>
<li><strong>Leaving currency, units or periods implicit.</strong> State whether an amount is monthly or annual and which currency or measurement applies.</li>
<li><strong>Accepting changed payment details without verification.</strong> Confirm through a contact method already known to be genuine.</li>
<li><strong>Editing the source record.</strong> Keep the original document and perform calculations or annotations on a copy.</li>
<li><strong>Skipping the close-out.</strong> Save the final receipt, issued document, signed agreement, corrected payslip or supplier reconciliation.</li>
</ul>

<h2 id="tool">Use the AfroTools workflow</h2>
<p>Open the <a href="${record.tool[0]}">${esc(record.tool[1])}</a> and enter only the information you can support. Treat any default as a prompt to collect a real figure, not as a recommendation. Export or copy the result, date it, and attach it to the source records. If the situation changes, create a new version instead of silently replacing the old one.</p>
<p>The result is most useful as a conversation document. It helps a family, customer, employee, landlord, buyer, adviser or installer discuss the same facts. It does not replace their confirmation or the relevant authority's decision.</p>

<h2 id="sources">Sources checked on ${data.reviewedLabel}</h2>
<p>These links were selected for primary or practical context. A link being listed does not mean AfroTools is affiliated with the publisher. Recheck the live page because forms, rates, fees, portal paths and service times can change.</p>
<ul>${record.sources.map(([href, label]) => `<li><a href="${href}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('')}</ul>

<div class="article-cta"><h3>Build your ${esc(record.country)} working checklist</h3><p>Organise the inputs, surface missing evidence and keep a dated result beside the original records.</p><a class="btn" href="${record.tool[0]}">Open ${esc(record.tool[1])} &#8594;</a></div>

<h2 id="related">Related AfroTools guides</h2>
<ul>${record.related.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul>

<section class="faq-section" id="faq"><h2 class="faq-section-title">Frequently asked questions</h2>${renderFaq(record)}</section>`;
}

function renderArticle(record) {
  const cluster = clusterCopy[record.cluster];
  const canonical = `https://afrotools.com/blog/${record.slug}/`;
  const image = `https://afrotools.com/assets/img/tools/${record.image}.webp`;
  const faqs = faqItems(record).map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } }));
  const body = articleBody(record);
  const wordCount = body.replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').trim().split(/\s+/).length;
  const readMinutes = Math.max(8, Math.ceil(wordCount / 190));
  const articleSchema = { '@context': 'https://schema.org', '@type': 'Article', headline: record.title, description: record.description, author: { '@type': 'Organization', name: 'AfroTools Team', url: 'https://afrotools.com/' }, publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/', logo: { '@type': 'ImageObject', url: 'https://afrotools.com/assets/img/logo-mark.svg' } }, datePublished: data.published, dateModified: data.published, mainEntityOfPage: canonical, image, inLanguage: 'en', wordCount };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://afrotools.com/' }, { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://afrotools.com/blog/' }, { '@type': 'ListItem', position: 3, name: record.title }] };
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="afrotools-content-id" content="blog:en:${articleId(record.slug)}">
<meta name="content-language" content="en">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(record.title)} | AfroTools</title>
<meta name="description" content="${esc(record.description)}">
<meta name="robots" content="index, follow">
<meta name="author" content="AfroTools">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${esc(record.title)}"><meta property="og:description" content="${esc(record.description)}"><meta property="og:image" content="${image}"><meta property="og:site_name" content="AfroTools"><meta property="article:published_time" content="${data.published}"><meta property="article:modified_time" content="${data.published}"><meta property="article:section" content="${cluster.category.replace('&amp;', '&')}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(record.title)}"><meta name="twitter:description" content="${esc(record.description)}"><meta name="twitter:image" content="${image}">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/blog/assets/css/blog.css"><link rel="stylesheet" href="/blog/assets/css/blog-platform.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body class="top-level-page-ui-refresh">
<div class="reading-progress" id="readingProgress"></div><afro-navbar></afro-navbar>
<section class="article-hero"><div class="article-hero-inner"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span class="sep">&#8250;</span> <a href="/blog/">Blog</a> <span class="sep">&#8250;</span> ${esc(record.country)}</nav><span class="category-badge category-badge--${cluster.cat}">${cluster.category}</span><h1>${esc(record.title)}</h1><div class="article-meta-hero"><span>By AfroTools Team</span><span class="dot"></span><time datetime="${data.published}">${data.reviewedLabel}</time><span class="dot"></span><span>${readMinutes} min read</span></div></div></section>
<div class="article-featured-img"><div class="article-featured-img-inner"><img width="600" height="400" src="/assets/img/tools/${record.image}.webp" alt="${esc(record.title)}" loading="eager"></div></div>
<main class="article-layout"><nav class="article-toc" aria-label="Table of contents"><div class="article-toc-title">In this article</div><ol><li><a href="#quick-answer">Quick answer</a></li><li><a href="#why">Why it matters</a></li><li><a href="#workflow">Workflow</a></li><li><a href="#mistakes">Mistakes</a></li><li><a href="#sources">Sources</a></li><li><a href="#faq">FAQs</a></li></ol></nav><article class="article-body">${body}</article></main>
<afro-footer></afro-footer><script src="/blog/assets/js/blog-reading.js" defer></script>
</body></html>\n`;
}

function renderCard(record) {
  const cluster = clusterCopy[record.cluster];
  return `<article data-locale="en" class="article-card" data-cat="${cluster.cat}"><div class="article-card-img"><img height="400" width="600" src="/assets/img/tools/${record.image}.webp" alt="${esc(record.title)}" loading="lazy"></div><div class="article-card-body"><span class="category-badge category-badge--${cluster.cat}">${cluster.category}</span><h3><a href="/blog/${record.slug}/">${esc(record.title)}</a></h3><p class="article-card-excerpt">${esc(record.description)}</p><div class="article-card-meta"><span>AfroTools Team</span><span class="dot"></span><span>${data.reviewedLabel}</span><span class="dot"></span><span>8 min read</span></div></div></article>`;
}

function withHubCards(hub) {
  const block = `${START}\n${data.articles.map(renderCard).join('\n')}\n${END}`;
  if (hub.includes(START)) return hub.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  return hub.replace('<div class="blog-grid" id="blogGrid">', `<div class="blog-grid" id="blogGrid">\n${block}`);
}

let mismatches = 0;
for (const record of data.articles) {
  const outputPath = path.join(root, 'blog', record.slug, 'index.html');
  const expected = renderArticle(record);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (normalizeBuildOwnedArticleHtml(current) !== normalizeBuildOwnedArticleHtml(expected)) {
    mismatches += 1;
    if (write) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, expected);
    } else console.error(`out of date: ${path.relative(root, outputPath)}`);
  }
}

const currentHub = fs.readFileSync(hubPath, 'utf8');
const expectedHub = withHubCards(currentHub);
if (currentHub !== expectedHub) {
  mismatches += 1;
  if (write) fs.writeFileSync(hubPath, expectedHub);
  else console.error('out of date: blog/index.html content explosion block');
}

const currentManifestText = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(currentManifestText);
const waveRecords = data.articles.map(record => {
  const cluster = clusterCopy[record.cluster];
  return {
    contentId: `blog:en:${articleId(record.slug)}`,
    file: `blog/${record.slug}/index.html`,
    slug: record.slug,
    locale: 'en',
    category: cluster.category.replace('&amp;', '&'),
    publicationStatus: 'published'
  };
});
const waveByFile = new Map(waveRecords.map(record => [record.file, record]));
const seenWaveFiles = new Set();
const mergedArticles = manifest.articles.map(record => {
  const replacement = waveByFile.get(record.file);
  if (!replacement) return record;
  seenWaveFiles.add(record.file);
  return replacement;
});
for (const record of waveRecords) {
  if (!seenWaveFiles.has(record.file)) mergedArticles.push(record);
}
const expectedManifestText = `${JSON.stringify({ ...manifest, articles: mergedArticles }, null, 2)}\n`;
if (currentManifestText !== expectedManifestText) {
  mismatches += 1;
  if (write) fs.writeFileSync(manifestPath, expectedManifestText);
  else console.error('out of date: data/content/blog-article-manifest.json content explosion records');
}

if (mismatches && !write) process.exitCode = 1;
console.log(`${write ? 'built' : 'checked'} ${data.articles.length} content-explosion articles; ${mismatches} file(s) ${write ? 'updated' : 'out of date'}`);
