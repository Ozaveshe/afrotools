#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_AUDIT = path.join(ROOT, 'output', 'blog-audit.json');
const EDITORIAL_AUDIT = path.join(ROOT, 'reports', 'blog-editorial-audit.json');
const OUTPUT_JSON = path.join(ROOT, 'reports', 'blog-content-improvement-queue.json');
const OUTPUT_MD = path.join(ROOT, 'reports', 'blog-content-improvement-queue.md');
const CURRENT_REVIEW_DATE = 'June 17, 2026';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function issueKey(issue) {
  return `${issue.slug}:${issue.id}`;
}

function priorityFor(article, contentPost, issues) {
  let score = 0;
  if (contentPost && contentPost.defaultImage) score += 30;
  if (contentPost && contentPost.missingSources) score += 35;
  if (article.freshness && article.freshness.officialSourceLikelyNeeded) score += 25;
  if (article.freshness && !article.freshness.officialSourceLikelyNeeded) score += 10;
  if (issues.some((issue) => issue.severity === 'error')) score += 50;
  if (issues.some((issue) => issue.severity === 'warn')) score += 20;
  if (contentPost && contentPost.qualityScore < 85) score += 15;
  return score;
}

function hasCurrentSourceReview(article) {
  const html = fs.readFileSync(path.join(ROOT, article.file), 'utf8');
  const reviewPatterns = [
    new RegExp(`Source check,\\s*${CURRENT_REVIEW_DATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
    new RegExp(`Editorial review,\\s*${CURRENT_REVIEW_DATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
    new RegExp(`Last reviewed:\\s*${CURRENT_REVIEW_DATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
    new RegExp(`Primary sources reviewed[^<]*${CURRENT_REVIEW_DATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
  ];
  return reviewPatterns.some((pattern) => pattern.test(html));
}

function actionsFor(article, contentPost, issues) {
  const actions = [];
  const currentSourceReview = hasCurrentSourceReview(article);
  if (issues.some((issue) => issue.id === 'long-title')) actions.push('Shorten title metadata');
  if (contentPost && contentPost.defaultImage) actions.push('Replace default article/social image');
  if (contentPost && contentPost.missingSources) actions.push('Add source path or noindex redirect handling');
  if (article.freshness && article.freshness.officialSourceLikelyNeeded && !currentSourceReview) actions.push('Official-source refresh');
  else if (article.freshness && !currentSourceReview) actions.push('Freshness review');
  if (contentPost && contentPost.qualityScore < 85) actions.push('Content-depth and internal-link review');
  if (!actions.length) actions.push('Monitor');
  return actions;
}

function bucketFor(queueItem) {
  if (queueItem.actions.includes('Add source path or noindex redirect handling')) return 'source-gap';
  if (queueItem.actions.includes('Shorten title metadata')) return 'metadata';
  if (queueItem.actions.includes('Replace default article/social image')) return 'image';
  if (queueItem.actions.includes('Official-source refresh')) return 'official-refresh';
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
  lines.push('- Static blog work stays under `/blog/`; AfroStream news stays on the live Supabase-backed path.');
  return `${lines.join('\n')}\n`;
}

function main() {
  const contentAudit = readJson(CONTENT_AUDIT);
  const editorialAudit = readJson(EDITORIAL_AUDIT);
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
      const actions = actionsFor(article, contentPost, issues);
      const item = {
        slug: article.slug,
        file: article.file,
        title: article.title,
        wordCount: article.wordCount,
        qualityScore: contentPost ? contentPost.qualityScore : null,
        priority: priorityFor(article, contentPost, issues),
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
    buckets
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    next30: queue.slice(0, 30),
    queue
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(report));

  console.log(`Classified ${summary.totalArticles} blog articles.`);
  console.log(`Next queue: ${path.relative(ROOT, OUTPUT_MD).replace(/\\/g, '/')}`);
}

main();
