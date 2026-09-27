#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { allArticles, audit: auditLinks } = require('./blog-link-pass');
const { parseCsv } = require('./seo-priority-report');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_AUDIT = path.join(ROOT, 'output', 'blog-audit.json');
const EDITORIAL_AUDIT = path.join(ROOT, 'reports', 'blog-editorial-audit.json');
const OUTPUT_JSON = path.join(ROOT, 'reports', 'blog-content-improvement-queue.json');
const OUTPUT_MD = path.join(ROOT, 'reports', 'blog-content-improvement-queue.md');

function parseArgs(argv) {
  const options = { gscPages: '', bingPages: '', outputJson: OUTPUT_JSON, outputMd: OUTPUT_MD };
  const keys = {
    '--gsc-pages': 'gscPages', '--bing-pages': 'bingPages',
    '--output-json': 'outputJson', '--output-md': 'outputMd'
  };
  for (let index = 2; index < argv.length; index += 1) {
    const key = keys[argv[index]];
    if (!key || !argv[index + 1]) throw new Error(`Unknown or incomplete option: ${argv[index]}`);
    options[key] = path.resolve(ROOT, argv[++index]);
  }
  return options;
}

function pageSlug(value) {
  try {
    const url = new URL(value, 'https://afrotools.com');
    if (url.origin !== 'https://afrotools.com') return '';
    return /^\/blog\/([a-z0-9-]+)\/?$/.exec(url.pathname)?.[1] || '';
  } catch { return ''; }
}

function readPageMetrics(file, source) {
  if (!file) return new Map();
  const totals = new Map();
  for (const row of parseCsv(fs.readFileSync(file, 'utf8'))) {
    const slug = pageSlug(row.toppages || row.page || '');
    if (!slug) continue;
    const impressions = Number(String(row.impressions || '0').replace(/,/g, ''));
    const clicks = Number(String(row.clicks || '0').replace(/,/g, ''));
    const position = Number(row.position || row.avgposition || 0);
    if (!Number.isFinite(impressions) || impressions <= 0 || !Number.isFinite(position) || position <= 0) continue;
    const total = totals.get(slug) || { source, impressions: 0, clicks: 0, weightedPosition: 0 };
    total.impressions += impressions;
    total.clicks += Number.isFinite(clicks) ? clicks : 0;
    total.weightedPosition += position * impressions;
    totals.set(slug, total);
  }
  return new Map([...totals].map(([slug, value]) => [slug, {
    source, clicks: value.clicks, impressions: value.impressions,
    position: Math.round(value.weightedPosition / value.impressions * 100) / 100
  }]));
}

function measuredRefresh(metrics) {
  return Object.values(metrics).some((item) => item && item.impressions >= 100 && item.position >= 8 && item.position <= 20);
}

function measuredOpportunityScore(metrics) {
  return Math.max(0, ...Object.values(metrics).map((item) => {
    if (!item || item.impressions < 100 || item.position < 8 || item.position > 20) return 0;
    const impressionScore = Math.min(45, Math.round(Math.log10(item.impressions) * 12));
    const lowCtr = item.clicks / item.impressions < 0.01 ? 8 : 0;
    return 30 + impressionScore + lowCtr;
  }));
}

function recentSubstantiveUpdate(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const date = /<meta\s+property="article:modified_time"\s+content="(\d{4}-\d{2}-\d{2})"/i.exec(html)?.[1]
    || /"dateModified":"(\d{4}-\d{2}-\d{2})"/.exec(html)?.[1];
  if (!date) return false;
  const age = Math.floor((Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86400000);
  return age >= 0 && age < 14;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function issueKey(issue) {
  return `${issue.slug}:${issue.id}`;
}

function priorityFor(article, contentPost, issues, inboundCount, searchMetrics, recentlyUpdated) {
  let score = 0;
  const currentSourceReview = contentPost && contentPost.sourceReviewState === 'dated-source-review';
  if (contentPost && contentPost.defaultImage) score += 30;
  if (contentPost && contentPost.missingSources) score += 35;
  if (article.freshness && article.freshness.officialSourceLikelyNeeded && !currentSourceReview) score += 25;
  if (article.freshness && !article.freshness.officialSourceLikelyNeeded && !currentSourceReview) score += 10;
  if (issues.some((issue) => issue.severity === 'error')) score += 50;
  if (issues.some((issue) => issue.severity === 'warn')) score += 20;
  if (contentPost && contentPost.qualityScore < 85) score += 15;
  if (contentPost && contentPost.thinContent) score += 30;
  if (contentPost && contentPost.weakToolHandoff) score += 20;
  if (contentPost && contentPost.weakRelatedLinks) score += 10;
  if (contentPost && contentPost.punctuationSpacingHits) score += 10;
  if (inboundCount === 0) score += 12;
  if (!recentlyUpdated) score += measuredOpportunityScore(searchMetrics);
  return score;
}

function actionsFor(article, contentPost, issues, inboundCount, searchMetrics, recentlyUpdated) {
  const actions = [];
  if (measuredRefresh(searchMetrics) && !recentlyUpdated) actions.push('Review measured page/query intent; refresh section and intro');
  if (inboundCount === 0) actions.push('Editorially review relevant inbound article links');
  const currentSourceReview = contentPost && contentPost.sourceReviewState === 'dated-source-review';
  if (issues.some((issue) => issue.id === 'long-title')) actions.push('Shorten title metadata');
  if (contentPost && contentPost.defaultImage) actions.push('Replace default article/social image');
  if (contentPost && contentPost.missingSources) actions.push('Add source path or noindex redirect handling');
  if (article.freshness && article.freshness.officialSourceLikelyNeeded && !currentSourceReview) actions.push('Official-source refresh');
  else if (article.freshness && !currentSourceReview) actions.push('Freshness review');
  if (contentPost && contentPost.qualityScore < 85) actions.push('Content-depth and internal-link review');
  if (contentPost && contentPost.thinContent) actions.push('Expand article body to satisfy search intent');
  if (contentPost && contentPost.weakToolHandoff) actions.push('Add primary tool handoff');
  if (contentPost && contentPost.weakRelatedLinks) actions.push('Add two useful related guides');
  if (contentPost && contentPost.punctuationSpacingHits) actions.push('Fix punctuation spacing');
  if (!actions.length) actions.push('Monitor');
  return actions;
}

function bucketFor(queueItem) {
  if (queueItem.actions.includes('Add source path or noindex redirect handling')) return 'source-gap';
  if (queueItem.actions.includes('Shorten title metadata')) return 'metadata';
  if (queueItem.actions.includes('Replace default article/social image')) return 'image';
  if (queueItem.actions.includes('Official-source refresh')) return 'official-refresh';
  if (queueItem.actions.includes('Review measured page/query intent; refresh section and intro')) return 'measured-refresh';
  if (queueItem.actions.includes('Freshness review')) return 'freshness';
  if (queueItem.actions.includes('Content-depth and internal-link review')) return 'content-depth';
  return 'monitor';
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Blog Content Improvement Queue');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Articles classified: ${report.summary.totalArticles}`);
  lines.push(`- Needs official-source refresh: ${report.summary.officialRefresh}`);
  lines.push(`- Needs freshness review: ${report.summary.freshnessReview}`);
  lines.push(`- Needs image cleanup: ${report.summary.imageCleanup}`);
  lines.push(`- Needs metadata cleanup: ${report.summary.metadataCleanup}`);
  lines.push(`- Needs source-gap handling: ${report.summary.sourceGap}`);
  lines.push(`- No inbound link from another article: ${report.summary.noArticleInbound}`);
  lines.push(`- Measured page-two refresh candidates (when exports supplied): ${report.summary.measuredRefresh}`);
  lines.push('');
  lines.push('## Next 30');
  report.next30.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.slug} - ${item.bucket} - ${item.actions.join('; ')}`);
  });
  lines.push('');
  lines.push('## Buckets');
  Object.entries(report.summary.buckets).forEach(([bucket, count]) => {
    lines.push(`- ${bucket}: ${count}`);
  });
  lines.push('');
  lines.push('## Operating Notes');
  lines.push('- Treat this as a queue, not proof that every article is already complete.');
  lines.push('- Source-sensitive articles need current official-source review before factual rewrites.');
  lines.push('- Optional GSC and Bing page exports are scored separately; their windows and click counts are not combined. Use private output paths for non-public traffic data.');
  lines.push('- A zero inbound count asks for editorial review, not an automatic reciprocal link.');
  lines.push('- Static blog work stays under `/blog/`; AfroStream news stays on the live Supabase-backed path.');
  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const contentAudit = readJson(CONTENT_AUDIT);
  const editorialAudit = readJson(EDITORIAL_AUDIT);
  const links = auditLinks(allArticles());
  const gsc = readPageMetrics(args.gscPages, 'gsc');
  const bing = readPageMetrics(args.bingPages, 'bing');
  const contentBySlug = new Map(contentAudit.posts.map((post) => [post.slug, post]));
  const issuesBySlug = new Map();
  editorialAudit.issues.forEach((issue) => {
    if (!issuesBySlug.has(issue.slug)) issuesBySlug.set(issue.slug, []);
    issuesBySlug.get(issue.slug).push(issue);
  });

  const queue = editorialAudit.articles
    .filter((article) => !article.isRedirect)
    .map((article) => {
      const contentPost = contentBySlug.get(article.slug);
      const issues = issuesBySlug.get(article.slug) || [];
      const inboundCount = links.inboundArticleCounts[article.slug] || 0;
      const searchMetrics = { gsc: gsc.get(article.slug) || null, bing: bing.get(article.slug) || null };
      const recentlyUpdated = recentSubstantiveUpdate(article.file);
      const actions = actionsFor(article, contentPost, issues, inboundCount, searchMetrics, recentlyUpdated);
      const item = {
        slug: article.slug,
        file: article.file,
        title: article.title,
        wordCount: article.wordCount,
        qualityScore: contentPost ? contentPost.qualityScore : null,
        bodyWordCount: contentPost ? contentPost.wordCount : null,
        toolLinks: contentPost ? contentPost.toolLinks : null,
        blogLinks: contentPost ? contentPost.blogLinks : null,
        inboundArticleLinks: inboundCount,
        searchMetrics,
        recentlyUpdated,
        sourceReviewState: contentPost ? contentPost.sourceReviewState : null,
        priority: priorityFor(article, contentPost, issues, inboundCount, searchMetrics, recentlyUpdated),
        actions,
        issueIds: issues.map(issueKey)
      };
      item.bucket = bucketFor(item);
      return item;
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.slug.localeCompare(b.slug);
    });

  const buckets = queue.reduce((acc, item) => {
    acc[item.bucket] = (acc[item.bucket] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    totalArticles: queue.length,
    officialRefresh: queue.filter((item) => item.actions.includes('Official-source refresh')).length,
    freshnessReview: queue.filter((item) => item.actions.includes('Freshness review')).length,
    imageCleanup: queue.filter((item) => item.actions.includes('Replace default article/social image')).length,
    metadataCleanup: queue.filter((item) => item.actions.includes('Shorten title metadata')).length,
    sourceGap: queue.filter((item) => item.actions.includes('Add source path or noindex redirect handling')).length,
    noArticleInbound: queue.filter((item) => item.inboundArticleLinks === 0).length,
    measuredRefresh: queue.filter((item) => item.actions.includes('Review measured page/query intent; refresh section and intro')).length,
    buckets
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    next30: queue.slice(0, 30),
    queue
  };

  fs.mkdirSync(path.dirname(args.outputJson), { recursive: true });
  fs.mkdirSync(path.dirname(args.outputMd), { recursive: true });
  fs.writeFileSync(args.outputJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.outputMd, buildMarkdown(report));

  console.log(`Classified ${summary.totalArticles} blog articles.`);
  console.log(`Next queue: ${path.relative(ROOT, args.outputMd).replace(/\\/g, '/')}`);
}

main();
