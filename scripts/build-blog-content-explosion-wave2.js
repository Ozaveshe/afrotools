'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'content', 'blog-content-explosion-wave2-2026-08.json');
const manifestPath = path.join(root, 'data', 'content', 'blog-article-manifest.json');
const hubPath = path.join(root, 'blog', 'index.html');
const reportPath = path.join(root, 'reports', 'blog-seo-opportunities-wave2-2026-08.md');
const write = process.argv.includes('--write');
const START = '<!-- BLOG-CONTENT-EXPLOSION-WAVE2-2026-08:START -->';
const END = '<!-- BLOG-CONTENT-EXPLOSION-WAVE2-2026-08:END -->';
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const clusterCopy = {
  business: {
    category: 'Money &amp; Business',
    cat: 'business',
    opening: 'Small-business records work best when each document has one clear job. Quotes explain an offer, invoices request payment, receipts prove payment, forecasts expose timing gaps, and loan comparisons put competing offers on the same basis.',
    method: 'Build the record from the underlying transaction. Keep the customer or lender identity, dates, currency, tax treatment, payment reference and approval trail visible. A polished document cannot repair unsupported figures, so reconcile the numbers before exporting it.',
    scenario: 'Use three cases when money or timing can move: a base case using the written terms, a pressure case with slower receipts or higher costs, and a recovery case showing the decision that restores a safe cash position. Scenario planning is more honest than hiding uncertainty inside one precise-looking number.',
    review: 'Open the original offer, invoice, bank record, ledger or loan schedule and compare it with the calculator line by line. Mark every figure as confirmed, estimated or disputed. Confirmed means a dated record supports it. Estimated means the method and source are written down. Disputed means the figure must not be treated as settled. Reconcile totals independently, then ask the customer, lender, accountant or responsible colleague to resolve the disputed lines in writing.',
    decision: 'Before sending or signing, confirm who owns the next action, when it is due and what evidence will close it. Keep the exported result with the source records and preserve the previous version. If the decision changes price, tax, payment instructions, credit terms or a customer obligation, obtain approval through a trusted channel rather than silently editing the file.',
    caution: 'This article provides record-keeping and planning guidance. It is not accounting, tax, credit or legal advice, and it does not turn an informal record into an official tax document.'
  },
  agriculture: {
    category: 'Agriculture',
    cat: 'tools',
    opening: 'Farm budgets become more useful when biological quantities and cash prices are kept separate. The crop or animal needs a physical input first; the market price, pack size, mortality, wastage and timing then determine the budget.',
    method: 'Start with field area, flock or stock count, production stage and a locally appropriate technical recommendation. Convert the recommendation into the units actually sold, add realistic losses, and collect dated supplier quotes. Never promote a national average as a guaranteed farm result.',
    scenario: 'Run at least three farm cases. The base case uses the most likely survival, yield or intake. The stress case raises feed, fertiliser, water or veterinary cost while lowering saleable output. The upside case should change only assumptions the farmer can explain. Keep each version dated so actual performance can be compared later.',
    review: 'Create one field or production log for the cycle. Record the area or stock, input delivered, input used, timing, weather or water conditions, losses, sampled growth and saleable output. Keep supplier labels and batch details where they affect the recommendation. A dated log allows an extension officer, agronomist, veterinarian or nutritionist to review the same evidence instead of reconstructing the season from memory.',
    decision: 'Do not change an agronomic, feeding, health or irrigation programme only because the cheapest calculator scenario looks attractive. Take the draft to an appropriately qualified local adviser, show the source and assumptions, and record any adjustment they recommend. Use the approved quantity for procurement, then track actual use separately so leftover material is not applied automatically.',
    caution: 'This is a planning estimate, not a farm prescription. Soil, water quality, breed, age, climate, health and local extension advice can materially change the correct input.'
  },
  construction: {
    category: 'Construction &amp; Energy',
    cat: 'tools',
    opening: 'A material or power estimate is only as reliable as its measurements, product specification and safety assumptions. Area alone is rarely enough: thickness, overlap, openings, wastage, starting surge and usable capacity can change the purchase.',
    method: 'Keep a measurement sheet beside the estimate. Label every dimension and unit, identify the chosen product, record the manufacturer coverage or effective width, and separate measured quantity from contingency. Structural and electrical choices still require a competent professional.',
    scenario: 'Calculate a measured case, a procurement case and a contingency case. The measured case shows the theoretical quantity. The procurement case rounds to the packs, sheets or equipment sizes actually sold. The contingency case adds only an explained allowance for cutting, breakage, rework, surge or future load.',
    review: 'Walk the site with the drawing, product data and estimate. Check each dimension at the point it is used and photograph labels or conditions that affect coverage, thickness, overlap, rating or safety. Record who measured, the instrument, date and unit. If the drawing and site disagree, stop the quantity decision and obtain a resolved instruction instead of averaging the two numbers.',
    decision: 'Ask the responsible engineer, electrician, quantity surveyor, installer or manufacturer to confirm the safety-critical specification and installation assumptions. The commercial order should name the exact product, size, rating, finish and accessory scope. Keep substitutions pending until their dimensions and performance have been recalculated and approved.',
    caution: 'This is a planning estimate, not a structural design, electrical design, bill of quantities or installer quotation. A qualified professional must verify safety-critical decisions.'
  },
  logistics: {
    category: 'Trade &amp; Logistics',
    cat: 'business',
    opening: 'Logistics margins disappear when chargeable weight, waiting time, failed delivery, maintenance and paperwork are treated as someone else\'s problem. A useful estimate exposes those drivers before the shipment or route begins.',
    method: 'Separate fixed costs from costs that vary with kilometres, stops, parcels, time or shipment size. Record the carrier rule or official process used, then compare the estimate with the final waybill, customs release or route log. The variance is operational data for the next quote.',
    scenario: 'Model a normal run, a delay or low-density run, and a consolidated run. Change one driver at a time, such as chargeable weight, clearance days, failed stops, kilometres or fuel price. This shows whether the best improvement is packaging, documentation, route density, scheduling or price.',
    review: 'Close the job with an operations receipt: final dimensions or kilometres, actual route or clearance time, fuel or carrier charge, failed stops or queries, official references and customer delivery evidence. Compare the receipt with the estimate without rewriting the original. Classify each meaningful variance as volume, price, time, process, vehicle, customer or external control.',
    decision: 'Use repeated variance, not one difficult shipment, to change packaging, route design, service zones or pricing. Assign an owner and a measurable next action. Where the estimate depends on a carrier or authority rule, retain the dated rule and recheck it before the next booking instead of assuming the old divisor, fee, process or timeline still applies.',
    caution: 'Carrier divisors, customs procedures, fuel prices and service times change. Confirm the current written rule or quote before committing a customer price or delivery promise.'
  },
  events: {
    category: 'Culture &amp; Life',
    cat: 'culture',
    opening: 'An event budget needs two views at the same time: the experience promised to guests and the cash commitments made to suppliers. Mixing deposits, optional upgrades, tax, ticket capacity and hoped-for sponsorship creates a misleading total.',
    method: 'List scope before price. Ask every supplier for inclusions, exclusions, hours, crew, equipment, transport, overtime, cancellation and payment milestones. For ticketed events, separate gross sales from fees, taxes, complimentary tickets, refunds and production cost.',
    scenario: 'Use a minimum viable event, the approved plan and a stretch version. For ticketed events, also run low, expected and high paid attendance. Do not count sponsor discussions or unpaid pledges as cash. A break-even result is a planning threshold, not a promise that tickets will sell.',
    review: 'Maintain a single commitments register. For every supplier or revenue partner, record scope, contract value, deposit, balance, due date, approver, receipt and remaining obligation. Keep guest or ticket inventory in a separate control. Update the forecast when a contract is signed or a payment clears, not merely when somebody says the arrangement is likely.',
    decision: 'At each approval gate, compare committed cost and available cash with the minimum viable event. Freeze additions when the reserve or settlement schedule is no longer safe. Confirm venue, safety, rights, tax and permit responsibilities with the relevant party, and preserve the written answer beside the budget rather than hiding compliance inside a miscellaneous line.',
    caution: 'Prices vary by date, city, venue and supplier. Use current written quotes and confirm permits, safety, tax and music-rights obligations with the responsible authorities.'
  },
  government: {
    category: 'Government &amp; Records',
    cat: 'tools',
    opening: 'Civil-registration applications are easiest when names, dates, identity records and supporting evidence agree before submission. The process may look similar across countries, but the responsible authority, notice period, witnesses and late-registration rules are jurisdiction-specific.',
    method: 'Begin on the responsible government portal. Choose the exact service, distinguish first registration from a certified copy or correction, and preserve the application reference and official receipt. Do not send identity documents to an unverified agent or payment account.',
    scenario: 'Prepare a normal-path file and an exception file. The normal path contains the standard identity and event records. The exception file covers prior marriage, divorce, death of a spouse, foreign nationality, late birth registration, missing notification or correction. Confirm the exception path before paying.',
    review: 'Create a private index of the documents without copying full identity numbers into the checklist. Record document type, holder, issuing authority, issue date, expiry where relevant, filename and whether the original is available. Compare names and dates character by character. Resolve a mismatch through the authority\'s formal route rather than altering a scan or inventing an affidavit.',
    decision: 'Before payment or travel, confirm the exact service, official domain, location, appointment and exception instructions. Save the live acknowledgement and receipt. After issue, inspect the civil record immediately and store it securely. Use only the official verification, certified-copy or correction route when another institution needs proof or an error is discovered.',
    caution: 'This is an application-preparation checklist, not legal advice or confirmation of eligibility. Requirements, fees, portals and service times can change without notice.'
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
    .replace(/^[ \t]*<link rel="stylesheet" href="\/blog\/assets\/css\/blog-typography\.css(?:\?[^\"]*)?">[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<script src="\/assets\/js\/analytics-bootstrap\.js"[^>]*><\/script>[ \t]*\n?/gm, '')
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

function checklistRows(record) {
  return record.checkpoints.map((item, index) => `<tr><td>${index + 1}</td><td>${esc(item[0])}</td><td>${esc(item[1])}</td></tr>`).join('');
}

function renderSteps(record) {
  return `<ol>${record.steps.map((step, index) => `<li><strong>Step ${index + 1}.</strong> ${esc(step)}</li>`).join('')}</ol>`;
}

function renderSections(record) {
  return record.sections.map((section, index) => {
    const id = `detail-${index + 1}`;
    const paragraphs = section.paragraphs.map(paragraph => `<p>${esc(paragraph)}</p>`).join('');
    const bullets = section.bullets && section.bullets.length
      ? `<ul>${section.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
      : '';
    return `<h2 id="${id}">${esc(section.title)}</h2>${paragraphs}${bullets}`;
  }).join('\n');
}

function faqItems(record) {
  return record.faq.map(([name, answer]) => ({ name, answer }));
}

function renderAlternateLinks(record, canonical) {
  const entries = [['en', canonical], ...(record.alternates || []), ['x-default', canonical]];
  const seen = new Set();
  return entries.map(entry => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error(`${record.slug}: each alternate must be [locale, absoluteUrl]`);
    }
    const [locale, href] = entry.map(value => String(value).trim());
    if (!/^(?:[a-z]{2}(?:-[A-Z]{2})?|x-default)$/.test(locale)) {
      throw new Error(`${record.slug}: invalid alternate locale ${locale}`);
    }
    if (!href.startsWith('https://afrotools.com/')) {
      throw new Error(`${record.slug}: alternate must use an absolute AfroTools URL`);
    }
    if (seen.has(locale)) throw new Error(`${record.slug}: duplicate alternate locale ${locale}`);
    seen.add(locale);
    return `<link rel="alternate" hreflang="${esc(locale)}" href="${esc(href)}">`;
  }).join('\n');
}

function renderFaq(record) {
  return faqItems(record).map(({ name, answer }) => `<div class="faq-item"><button class="faq-question" type="button" onclick="this.parentElement.classList.toggle('open')">${esc(name)} <span class="faq-chevron">&#9660;</span></button><div class="faq-answer"><div class="faq-answer-inner"><p>${esc(answer)}</p></div></div></div>`).join('\n');
}

function articleBody(record) {
  const cluster = clusterCopy[record.cluster];
  return `<p>${esc(record.opening)}</p>
<p>${esc(cluster.opening)}</p>
<p>This guide targets <strong>${esc(record.keyword)}</strong> with a decision-ready workflow. Use the <a href="${record.tool[0]}">${esc(record.tool[1])}</a> to organise the inputs, then replace every placeholder with your measurements, records and current written terms.</p>
<p><strong>Sources reviewed:</strong> <strong>${data.reviewedLabel}</strong>. ${esc(cluster.caution)}</p>

<h2 id="quick-answer">Quick answer</h2>
<p>${esc(record.quickAnswer)}</p>
<p>The table below is the minimum evidence pack. A task is not complete merely because somebody says it has been handled. Save the document, measurement, quote, portal acknowledgement or transaction reference that supports the answer.</p>
<div class="table-wrapper"><table><thead><tr><th>#</th><th>Input or decision</th><th>Evidence to keep</th></tr></thead><tbody>${checklistRows(record)}</tbody></table></div>

<h2 id="why">Why this calculation or checklist matters</h2>
<p>${esc(cluster.method)}</p>
<p>${esc(record.whyItMatters)}</p>
<p>A good working file also makes disagreement cheaper. Instead of arguing about a total, the people involved can inspect the quantity, unit, date, source and assumption that produced it. That is the difference between a reusable estimate and a number copied into a message.</p>

<h2 id="workflow">Step-by-step workflow</h2>
${renderSteps(record)}

${renderSections(record)}

<h2 id="evidence">Build an evidence pack another person can audit</h2>
<p>${esc(cluster.review)}</p>
<p>Use short filenames that begin with the date and describe the record. Keep the original source separate from calculations and annotations. Where a file contains identity, financial, health or commercial data, share the minimum necessary information and use the official or trusted channel. A checklist should reduce exposure, not create another uncontrolled copy of sensitive material.</p>

<h2 id="decision">Set the decision gate</h2>
<p>${esc(cluster.decision)}</p>
<p>Write a clear stop condition before commitment. A stop condition might be a missing official search, an unverified payment account, an unresolved name mismatch, an unaffordable pressure case, an unapproved safety specification or a supplier quote that excludes essential scope. When it appears, pause and resolve the evidence rather than pushing the same uncertain assumption into the final output. Record who made the final decision, the date and the evidence they reviewed so a later update has an honest starting point.</p>

<h2 id="scenarios">Stress-test the result</h2>
<p>${esc(cluster.scenario)}</p>
<p>${esc(record.stressTest)}</p>
<p>Write the decision beside the scenario. Examples include delaying a purchase, collecting a larger deposit, reducing scope, changing packaging, adding route density, choosing a different loan, or asking a qualified adviser to verify an exception. A scenario without a decision is only another spreadsheet column.</p>

<h2 id="mistakes">Common mistakes to avoid</h2>
<ul>${record.mistakes.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
<p>One final check catches many errors: ask whether a different person could reproduce the answer from the saved inputs. If not, label the missing assumption before using the result in a quote, purchase, application or public promise.</p>

<h2 id="tool">Use the AfroTools workflow</h2>
<p>Open the <a href="${record.tool[0]}">${esc(record.tool[1])}</a> and enter the dated inputs from your evidence pack. Keep units and currencies consistent. Save or export the result where the tool supports it, then give the version a descriptive filename that includes the date and scenario.</p>
<p>${esc(record.toolUse)}</p>
<p>AfroTools does not submit the application, certify the document, approve the budget, select the supplier or guarantee the outcome. The output is a private planning aid that helps you ask better questions and keep a reviewable record.</p>

<h2 id="sources">Sources checked on ${data.reviewedLabel}</h2>
<p>Primary authorities and practical technical references were preferred. Reopen the live source before acting because forms, fees, product specifications, thresholds and portal steps can change.</p>
<ul>${record.sources.map(([href, label]) => `<li><a href="${href}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('')}</ul>

<div class="article-cta"><h3>${esc(record.cta)}</h3><p>Turn the evidence into a dated calculation or checklist before you commit money, time or documents.</p><a class="btn" href="${record.tool[0]}">Open ${esc(record.tool[1])} &#8594;</a></div>

<h2 id="related">Related AfroTools guides</h2>
<ul>${record.related.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul>

<section class="faq-section" id="faq"><h2 class="faq-section-title">Frequently asked questions</h2>${renderFaq(record)}</section>`;
}

function renderArticle(record) {
  const cluster = clusterCopy[record.cluster];
  const canonical = `https://afrotools.com/blog/${record.slug}/`;
  const image = `https://afrotools.com/assets/img/tools/${record.image}.webp`;
  const alternateLinks = renderAlternateLinks(record, canonical);
  const faqs = faqItems(record).map(({ name, answer }) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } }));
  const body = articleBody(record);
  const wordCount = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  const readMinutes = Math.max(8, Math.ceil(wordCount / 190));
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: record.title,
    description: record.description,
    author: { '@type': 'Organization', name: 'AfroTools Team', url: 'https://afrotools.com/' },
    publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/', logo: { '@type': 'ImageObject', url: 'https://afrotools.com/assets/img/logo-mark.svg' } },
    datePublished: data.published,
    dateModified: data.published,
    mainEntityOfPage: canonical,
    image,
    inLanguage: 'en',
    wordCount
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://afrotools.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://afrotools.com/blog/' },
      { '@type': 'ListItem', position: 3, name: record.title }
    ]
  };
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
${alternateLinks}
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
<main class="article-layout"><nav class="article-toc" aria-label="Table of contents"><div class="article-toc-title">In this article</div><ol><li><a href="#quick-answer">Quick answer</a></li><li><a href="#workflow">Workflow</a></li><li><a href="#detail-1">Detailed method</a></li><li><a href="#scenarios">Stress test</a></li><li><a href="#sources">Sources</a></li><li><a href="#faq">FAQs</a></li></ol></nav><article class="article-body">${body}</article></main>
<afro-footer></afro-footer><script src="/blog/assets/js/blog-reading.js" defer></script>
</body></html>\n`;
}

function renderCard(record) {
  const cluster = clusterCopy[record.cluster];
  return `<article data-locale="en" class="article-card" data-cat="${cluster.cat}"><div class="article-card-img"><img height="400" width="600" src="/assets/img/tools/${record.image}.webp" alt="${esc(record.title)}" loading="lazy"></div><div class="article-card-body"><span class="category-badge category-badge--${cluster.cat}">${cluster.category}</span><h3><a href="/blog/${record.slug}/">${esc(record.title)}</a></h3><p class="article-card-excerpt">${esc(record.description)}</p><div class="article-card-meta"><span>AfroTools Team</span><span class="dot"></span><span>${data.reviewedLabel}</span><span class="dot"></span><span>10 min read</span></div></div></article>`;
}

function withHubCards(hub) {
  const block = `${START}\n${data.articles.map(renderCard).join('\n')}\n${END}`;
  if (hub.includes(START)) return hub.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  return hub.replace('<div class="blog-grid" id="blogGrid">', `<div class="blog-grid" id="blogGrid">\n${block}`);
}

function renderOpportunityReport() {
  const rows = [...data.articles]
    .sort((a, b) => b.opportunityScore - a.opportunityScore || a.slug.localeCompare(b.slug))
    .map((record, index) => `| ${index + 1} | ${record.keyword.replace(/\|/g, '\\|')} | ${record.opportunityScore} | ${record.opportunityConfidence} | ${record.cluster} | ${record.cannibalization.replace(/\|/g, '\\|')} | ${record.tool[0]} |`)
    .join('\n');
  return `# AfroTools SEO Content Explosion Wave 2\n\nGenerated from \`data/content/blog-content-explosion-wave2-2026-08.json\` on ${data.reviewedLabel}.\n\n## Method and limits\n\n- Score type: ${data.method.scoreType}.\n- Data limitation: ${data.method.dataGap}\n- Selection rule: ${data.method.selectionRule}\n- The score is a prioritisation aid. It is not a promise of ranking, traffic or revenue.\n\n## Selected keyword jobs\n\n| Rank | Primary keyword | Score | Confidence | Cluster | Cannibalisation | Tool handoff |\n| ---: | --- | ---: | --- | --- | --- | --- |\n${rows}\n\n## Editorial contract\n\nEach article has a distinct task, at least three named sources, a dated review label, a live AfroTools tool handoff, internal links, Article and FAQ structured data, and a scenario or exception section. Changing facts must be rechecked at the source before the article is refreshed.\n`;
}

let mismatches = 0;
for (const record of data.articles) {
  if (!clusterCopy[record.cluster]) throw new Error(`${record.slug}: unsupported cluster ${record.cluster}`);
  const outputPath = path.join(root, 'blog', record.slug, 'index.html');
  const expected = renderArticle(record);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (normalizeBuildOwnedArticleHtml(current) !== normalizeBuildOwnedArticleHtml(expected)) {
    mismatches += 1;
    if (write) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, expected);
    } else {
      console.error(`out of date: ${path.relative(root, outputPath)}`);
    }
  }
}

const currentHub = fs.readFileSync(hubPath, 'utf8');
const expectedHub = withHubCards(currentHub);
if (currentHub !== expectedHub) {
  mismatches += 1;
  if (write) fs.writeFileSync(hubPath, expectedHub);
  else console.error('out of date: blog/index.html wave-two content explosion block');
}

const expectedReport = renderOpportunityReport();
const currentReport = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
if (currentReport !== expectedReport) {
  mismatches += 1;
  if (write) fs.writeFileSync(reportPath, expectedReport);
  else console.error('out of date: reports/blog-seo-opportunities-wave2-2026-08.md');
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
  else console.error('out of date: data/content/blog-article-manifest.json wave-two records');
}

if (mismatches && !write) process.exitCode = 1;
console.log(`${write ? 'built' : 'checked'} ${data.articles.length} wave-two articles; ${mismatches} file(s) ${write ? 'updated' : 'out of date'}`);
