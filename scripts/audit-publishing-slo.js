#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POLICY_PATH = path.join(ROOT, 'data', 'automation', 'control-plane-policy.json');

function parseArgs(argv) {
  const options = {
    live: false,
    write: false,
    json: false,
    now: new Date(),
    root: ROOT,
    policyPath: POLICY_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--live') options.live = true;
    else if (value === '--write') options.write = true;
    else if (value === '--json') options.json = true;
    else if (value === '--now') options.now = new Date(argv[++index]);
    else if (value === '--root') options.root = path.resolve(argv[++index]);
    else if (value === '--policy') options.policyPath = path.resolve(argv[++index]);
    else throw new Error('Unknown argument: ' + value);
  }
  if (Number.isNaN(options.now.getTime())) throw new Error('--now must be an ISO date-time');
  return options;
}

function extractPublishedAt(html) {
  const jsonLd = html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
  if (jsonLd) return jsonLd[1];
  const meta = html.match(/property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["'][^>]*property=["']article:published_time["']/i);
  return meta ? meta[1] : null;
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

function publicationInstant(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value + 'T12:00:00.000Z');
  return new Date(value);
}

function localParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date)
    .filter((item) => item.type !== 'literal')
    .map((item) => [item.type, item.value]));
  return {
    date: parts.year + '-' + parts.month + '-' + parts.day,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function parseCutoff(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('deployment_cutoff_local must be HH:MM');
  return Number(match[1]) * 60 + Number(match[2]);
}

function scanArticles(root) {
  const blogRoot = path.join(root, 'blog');
  const hubPath = path.join(blogRoot, 'index.html');
  const hubHtml = fs.existsSync(hubPath) ? fs.readFileSync(hubPath, 'utf8') : '';
  const articles = [];
  for (const entry of fs.readdirSync(blogRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(blogRoot, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const publishedAt = extractPublishedAt(html);
    if (!publishedAt) continue;
    const instant = publicationInstant(publishedAt);
    if (Number.isNaN(instant.getTime())) continue;
    articles.push({
      slug: entry.name,
      file: path.relative(root, file).replace(/\\/g, '/'),
      published_at: publishedAt,
      instant: instant.toISOString(),
      title: extractTitle(html),
      hub_position: hubHtml.indexOf('/blog/' + entry.name + '/'),
    });
  }
  return articles.sort((left, right) => {
    const dateOrder = Date.parse(right.instant) - Date.parse(left.instant);
    if (dateOrder) return dateOrder;
    const leftPosition = left.hub_position < 0 ? Number.MAX_SAFE_INTEGER : left.hub_position;
    const rightPosition = right.hub_position < 0 ? Number.MAX_SAFE_INTEGER : right.hub_position;
    return leftPosition - rightPosition || left.slug.localeCompare(right.slug);
  });
}

function evaluateSource(articles, policy, now) {
  const issues = [];
  const local = localParts(now, policy.timezone);
  const cutoff = parseCutoff(policy.publishing.deployment_cutoff_local);
  const afterCutoff = local.minutes >= cutoff;
  const today = articles.filter((item) => item.published_at.slice(0, 10) === local.date);
  const latest = articles[0] || null;
  const ageHours = latest ? Math.max(0, (now.getTime() - Date.parse(latest.instant)) / 3600000) : null;

  if (!latest) {
    issues.push({ severity: 'error', code: 'no_publishable_articles', detail: 'No dated root-blog articles were found.' });
  } else if (ageHours > policy.publishing.max_latest_article_age_hours) {
    issues.push({
      severity: 'error',
      code: 'latest_article_stale',
      detail: latest.slug + ' is approximately ' + Math.floor(ageHours) + 'h old; SLO is ' + policy.publishing.max_latest_article_age_hours + 'h.',
    });
  }
  if (afterCutoff && today.length < policy.publishing.daily_expected_articles) {
    issues.push({
      severity: 'error',
      code: 'daily_article_cadence_missed',
      detail: today.length + ' article(s) dated ' + local.date + ' after the ' + policy.publishing.deployment_cutoff_local + ' cutoff; expected ' + policy.publishing.daily_expected_articles + '.',
    });
  }

  const requiredLive = afterCutoff
    ? today.slice(0, policy.publishing.daily_expected_articles)
    : (latest ? [latest] : []);
  return {
    local_date: local.date,
    after_cutoff: afterCutoff,
    latest,
    latest_age_hours: ageHours,
    today_count: today.length,
    required_live_articles: requiredLive,
    issues,
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'AfroTools-Publishing-SLO/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

async function verifyLive(source, policy) {
  const checks = [];
  const issues = [];
  const hub = await fetchText(policy.publishing.hub_url);
  const feed = await fetchText(policy.publishing.feed_url);
  checks.push({ url: policy.publishing.hub_url, status: hub.status, ok: hub.ok });
  checks.push({ url: policy.publishing.feed_url, status: feed.status, ok: feed.ok });
  if (!hub.ok) issues.push({ severity: 'error', code: 'live_blog_hub_unavailable', detail: 'Blog hub returned HTTP ' + hub.status + '.' });
  if (!feed.ok) issues.push({ severity: 'error', code: 'live_blog_feed_unavailable', detail: 'Blog feed returned HTTP ' + feed.status + '.' });

  for (const article of source.required_live_articles) {
    const route = 'https://afrotools.com/blog/' + article.slug + '/';
    const page = await fetchText(route);
    const hubHasSlug = hub.text.includes('/blog/' + article.slug + '/');
    const feedHasSlug = feed.text.includes('/blog/' + article.slug + '/');
    const pageHasTitle = !article.title || page.text.includes(article.title.replace(/\s*\|\s*AfroTools.*$/i, ''));
    checks.push({
      slug: article.slug,
      url: route,
      status: page.status,
      ok: page.ok && hubHasSlug && feedHasSlug && pageHasTitle,
      hub: hubHasSlug,
      feed: feedHasSlug,
      title: pageHasTitle,
    });
    if (!page.ok || !hubHasSlug || !feedHasSlug || !pageHasTitle) {
      issues.push({
        severity: 'error',
        code: 'article_not_fully_live',
        slug: article.slug,
        detail: 'route=' + page.status + ', hub=' + hubHasSlug + ', feed=' + feedHasSlug + ', title=' + pageHasTitle + '.',
      });
    }
  }
  return { checks, issues };
}

function toMarkdown(report) {
  const lines = [
    '# Publishing SLO',
    '',
    'Generated: ' + report.generated_at,
    '',
    '- Local date: ' + report.source.local_date,
    '- After cutoff: ' + report.source.after_cutoff,
    '- Latest article: ' + (report.source.latest ? report.source.latest.slug : 'none'),
    '- Articles dated today: ' + report.source.today_count,
    '- Live verification: ' + (report.live ? 'run' : 'not run'),
    '- Errors: ' + report.counts.errors,
    '',
    '## Issues',
    '',
  ];
  if (!report.issues.length) lines.push('- None.');
  else report.issues.forEach((item) => lines.push('- [' + item.severity.toUpperCase() + '] ' + item.code + ': ' + item.detail));
  lines.push('');
  return lines.join('\n');
}

async function buildReport(options) {
  const policy = JSON.parse(fs.readFileSync(options.policyPath, 'utf8'));
  const articles = scanArticles(options.root);
  const source = evaluateSource(articles, policy, options.now);
  let live = null;
  const issues = source.issues.slice();
  if (options.live) {
    try {
      live = await verifyLive(source, policy);
      issues.push(...live.issues);
    } catch (error) {
      issues.push({ severity: 'error', code: 'live_verification_failed', detail: error.message });
      live = { checks: [], issues: [] };
    }
  }
  return {
    schema_version: 1,
    generated_at: options.now.toISOString(),
    source: {
      local_date: source.local_date,
      after_cutoff: source.after_cutoff,
      latest: source.latest,
      latest_age_hours: source.latest_age_hours,
      today_count: source.today_count,
      required_live_slugs: source.required_live_articles.map((item) => item.slug),
    },
    live,
    issues,
    counts: { errors: issues.filter((item) => item.severity === 'error').length },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildReport(options);
  if (options.write) {
    const reportDir = path.join(options.root, 'reports');
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, 'publishing-slo-latest.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(reportDir, 'publishing-slo-latest.md'), toMarkdown(report) + '\n');
  }
  if (options.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else {
    console.log('AfroTools publishing SLO');
    console.log('- Local date: ' + report.source.local_date + ' after cutoff=' + report.source.after_cutoff);
    console.log('- Latest: ' + (report.source.latest ? report.source.latest.slug : 'none'));
    console.log('- Today: ' + report.source.today_count);
    console.log('- Live: ' + (report.live ? 'verified' : 'not requested'));
    console.log('- Errors: ' + report.counts.errors);
    report.issues.forEach((item) => console.log('  - [' + item.severity.toUpperCase() + '] ' + item.code + ': ' + item.detail));
  }
  if (report.counts.errors) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArgs,
  extractPublishedAt,
  extractTitle,
  publicationInstant,
  localParts,
  parseCutoff,
  scanArticles,
  evaluateSource,
  buildReport,
};
