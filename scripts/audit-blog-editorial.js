#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const REPORT_PATH = path.join(ROOT, 'reports', 'blog-editorial-audit.json');
const WRITE_REPORT = process.argv.includes('--write-report');
const BASE_URL = 'https://afrotools.com';

const CONSUMER_COPY_PATTERNS = [
  { id: 'internal-review', pattern: /\binternal review\b/i },
  { id: 'review-memo', pattern: /\breview memo\b/i },
  { id: 'to-be-reviewed', pattern: /\bto be reviewed\b/i },
  { id: 'blog-audit', pattern: /\bblog audit\b/i },
  { id: 'ai-slop', pattern: /\bai slop\b/i },
  { id: 'todo', pattern: /\bTODO\b|\bFIXME\b|\bTBD\b/i },
  { id: 'placeholder-comment', pattern: /<!--[\s\S]*?\bplaceholder\b[\s\S]*?-->/i },
  { id: 'mojibake', pattern: /Ã|â€|â€™|â€œ|â€�|â€“|â€”|â€¦/ },
];

const COMMON_TYPOS = [
  { id: 'recieve', pattern: /\brecieve\b/i },
  { id: 'seperate', pattern: /\bseperate\b/i },
  { id: 'occured', pattern: /\boccured\b/i },
  { id: 'untill', pattern: /\buntill\b/i },
  { id: 'finanxcial', pattern: /\bfinanxcial\b/i },
  { id: 'calclator', pattern: /\bcalclator\b/i },
  { id: 'workfows', pattern: /\bworkfows\b/i },
];

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAttrs(tag) {
  const attrs = {};
  const pattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;
  while ((match = pattern.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[2] || match[3] || match[4] || '';
  }
  return attrs;
}

function getMeta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = parseAttrs(tag);
    if ((attrs.name || '').toLowerCase() === name.toLowerCase()) return attrs.content || '';
    if ((attrs.property || '').toLowerCase() === name.toLowerCase()) return attrs.content || '';
  }
  return '';
}

function getCanonical(html) {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of links) {
    const attrs = parseAttrs(tag);
    if ((attrs.rel || '').toLowerCase() === 'canonical') return attrs.href || '';
  }
  return '';
}

function getTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : '';
}

function countMatches(html, regex) {
  return (html.match(regex) || []).length;
}

function hasReplacementCharacter(value) {
  return Array.from(value).some((char) => char.charCodeAt(0) === 0xfffd);
}

function getJsonLdBlocks(html) {
  return Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((match) => match[1].trim());
}

function addIssue(article, severity, id, message) {
  article.issues.push({ severity, id, message });
}

function expectedCanonical(slug) {
  return `${BASE_URL}/blog/${slug}/`;
}

function classifyFreshness(title, slug, text) {
  const haystack = `${title} ${slug} ${text.slice(0, 1000)}`.toLowerCase();
  const sourceSensitive = /\b(2025|2026|today|rate|rates|tariff|tax|vat|paye|deadline|fee|fees|price|prices|cost|salary|allowance|import duty|withholding|filing|compliance)\b/.test(haystack);
  const officialSourceLikelyNeeded = /\b(tax|vat|paye|tariff|import duty|deadline|filing|compliance|health insurance|social security|pension|levy|withholding)\b/.test(haystack);
  if (!sourceSensitive) return null;
  return {
    sourceSensitive,
    officialSourceLikelyNeeded,
    reason: officialSourceLikelyNeeded
      ? 'Rates, filing, or statutory claims need official-source refresh before factual edits.'
      : 'Time-sensitive market or price claims should be refreshed before factual edits.',
  };
}

function auditArticle(slug, file) {
  const html = read(file);
  const text = stripTags(html);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const title = getTitle(html);
  const description = getMeta(html, 'description');
  const robots = getMeta(html, 'robots');
  const canonical = getCanonical(html);
  const h1Count = countMatches(html, /<h1\b/gi);
  const imageCount = countMatches(html, /<img\b/gi);
  const missingAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;
  const jsonLdBlocks = getJsonLdBlocks(html);
  const isRedirect = /http-equiv=["']refresh["']/i.test(html) || /window\.location\.(?:replace|href)/i.test(html);
  const article = {
    slug,
    file: rel(file),
    isRedirect,
    title,
    titleLength: title.length,
    descriptionLength: description.length,
    canonical,
    wordCount: words,
    h1Count,
    imageCount,
    missingAlt,
    jsonLdCount: jsonLdBlocks.length,
    emDashCount: countMatches(html, /\u2014|&mdash;/g),
    enDashCount: countMatches(html, /\u2013|&ndash;/g),
    consumerCopyHits: [],
    typoHits: [],
    freshness: classifyFreshness(title, slug, text),
    issues: [],
  };

  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block);
    } catch (error) {
      addIssue(article, 'error', 'invalid-jsonld', `Invalid JSON-LD: ${error.message}`);
    }
  }

  const scanText = `${html}\n${text}`;
  for (const item of CONSUMER_COPY_PATTERNS) {
    if (item.pattern.test(scanText)) article.consumerCopyHits.push(item.id);
  }
  if (hasReplacementCharacter(scanText) && !article.consumerCopyHits.includes('mojibake')) {
    article.consumerCopyHits.push('mojibake');
  }
  for (const item of COMMON_TYPOS) {
    if (item.pattern.test(scanText)) article.typoHits.push(item.id);
  }

  if (isRedirect) {
    if (!/noindex/i.test(robots)) addIssue(article, 'warn', 'redirect-indexable', 'Redirect route should be noindex, follow.');
    if (!canonical) addIssue(article, 'warn', 'redirect-missing-canonical', 'Redirect route should point to its canonical destination.');
    return article;
  }

  if (!title) addIssue(article, 'error', 'missing-title', 'Missing title tag.');
  if (title.length > 70) addIssue(article, 'warn', 'long-title', `Title is ${title.length} characters.`);
  if (title.length < 30) addIssue(article, 'warn', 'short-title', `Title is ${title.length} characters.`);
  if (!description) addIssue(article, 'error', 'missing-description', 'Missing meta description.');
  if (description && description.length < 90) addIssue(article, 'warn', 'short-description', `Description is ${description.length} characters.`);
  if (description.length > 170) addIssue(article, 'warn', 'long-description', `Description is ${description.length} characters.`);
  if (!canonical) addIssue(article, 'error', 'missing-canonical', 'Missing canonical URL.');
  if (canonical && canonical !== expectedCanonical(slug)) addIssue(article, 'warn', 'canonical-mismatch', `Expected ${expectedCanonical(slug)}.`);
  if (/noindex/i.test(robots)) addIssue(article, 'warn', 'article-noindex', 'Article page is marked noindex.');
  if (h1Count !== 1) addIssue(article, 'warn', 'h1-count', `Expected one H1, found ${h1Count}.`);
  if (words < 800) addIssue(article, 'warn', 'thin-content', `Article has ${words} visible words.`);
  if (!jsonLdBlocks.length) addIssue(article, 'error', 'missing-jsonld', 'Missing Article JSON-LD.');
  if (missingAlt > 0) addIssue(article, 'error', 'missing-image-alt', `${missingAlt} image(s) missing alt text.`);
  if (article.consumerCopyHits.length) addIssue(article, 'warn', 'consumer-copy-risk', `Consumer-facing copy risk: ${article.consumerCopyHits.join(', ')}.`);
  if (article.typoHits.length) addIssue(article, 'warn', 'common-typo', `Possible typo(s): ${article.typoHits.join(', ')}.`);
  if (article.emDashCount || article.enDashCount) addIssue(article, 'info', 'dash-style', `${article.emDashCount} em dash and ${article.enDashCount} en dash instances.`);

  return article;
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.error('Missing blog directory.');
    process.exitCode = 1;
    return;
  }

  const articleDirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'assets')
    .map((entry) => entry.name)
    .sort();

  const articles = articleDirs
    .map((slug) => ({ slug, file: path.join(BLOG_DIR, slug, 'index.html') }))
    .filter((entry) => fs.existsSync(entry.file))
    .map((entry) => auditArticle(entry.slug, entry.file));

  const nonRedirectArticles = articles.filter((article) => !article.isRedirect);
  const allIssues = articles.flatMap((article) => article.issues.map((issue) => ({ slug: article.slug, file: article.file, ...issue })));
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRoutes: articles.length,
    articlePages: nonRedirectArticles.length,
    redirects: articles.length - nonRedirectArticles.length,
    errors: allIssues.filter((issue) => issue.severity === 'error').length,
    warnings: allIssues.filter((issue) => issue.severity === 'warn').length,
    info: allIssues.filter((issue) => issue.severity === 'info').length,
    needsFreshnessReview: nonRedirectArticles.filter((article) => article.freshness).length,
    needsOfficialSourceReview: nonRedirectArticles.filter((article) => article.freshness && article.freshness.officialSourceLikelyNeeded).length,
  };

  const report = { summary, issues: allIssues, articles };

  if (WRITE_REPORT) {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(`Blog editorial audit scanned ${summary.totalRoutes} blog routes (${summary.articlePages} articles, ${summary.redirects} redirects).`);
  console.log(`Issues: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.info} info notes.`);
  console.log(`Freshness queue: ${summary.needsFreshnessReview} time-sensitive articles; ${summary.needsOfficialSourceReview} likely need official-source review.`);
  if (WRITE_REPORT) console.log(`Report: ${rel(REPORT_PATH)}`);

  const highest = allIssues.filter((issue) => issue.severity !== 'info').slice(0, 25);
  if (highest.length) {
    console.log('\nTop editorial/SEO issues:');
    highest.forEach((issue) => {
      console.log(`- [${issue.severity}] ${issue.file}: ${issue.id} - ${issue.message}`);
    });
  }
}

main();
