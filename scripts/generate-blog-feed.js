#!/usr/bin/env node
/**
 * Generate the static main blog RSS feed from article metadata.
 *
 * Usage:
 *   node scripts/generate-blog-feed.js
 *   node scripts/generate-blog-feed.js --check
 */
const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_INDEX = path.join(BLOG_DIR, 'index.html');
const FEED_PATH = path.join(BLOG_DIR, 'feed.xml');
const BASE_URL = 'https://afrotools.com';
const DEFAULT_LIMIT = 40;

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : DEFAULT_LIMIT;

function decodeHtml(value) {
  if (!value) return '';
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function collapseText(value) {
  return decodeHtml(String(value || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function parseAttributes(tag) {
  const attrs = {};
  const attrRe = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attrRe.exec(tag)) !== null) {
    attrs[match[1].toLowerCase()] = match[2] !== undefined ? match[2] : match[3];
  }
  return attrs;
}

function readMeta(html) {
  const meta = new Map();
  const metaRe = /<meta\b[^>]*>/gi;
  let match;
  while ((match = metaRe.exec(html)) !== null) {
    const attrs = parseAttributes(match[0]);
    const key = attrs.property || attrs.name;
    if (key && attrs.content !== undefined) meta.set(key.toLowerCase(), decodeHtml(attrs.content));
  }
  return meta;
}

function extractCanonical(html) {
  const linkRe = /<link\b[^>]*>/gi;
  let match;
  while ((match = linkRe.exec(html)) !== null) {
    const attrs = parseAttributes(match[0]);
    if ((attrs.rel || '').toLowerCase() === 'canonical' && attrs.href) return attrs.href;
  }
  return null;
}

function hasNoindex(meta) {
  return /\bnoindex\b/i.test(meta.get('robots') || '');
}

function isRedirectLike(html) {
  return /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    /location\.(?:href|replace)\s*[=(]/i.test(html);
}

function extractJsonLdArticle(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        const type = Array.isArray(candidate['@type']) ? candidate['@type'] : [candidate['@type']];
        if (type.some((item) => /^(Article|BlogPosting|NewsArticle)$/i.test(String(item || '')))) {
          return candidate;
        }
      }
    } catch {
      // Invalid JSON-LD is caught elsewhere; feed generation simply falls back to meta tags.
    }
  }
  return {};
}

function parsePubDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T08:00:00Z`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRfc822(date) {
  return date.toUTCString();
}

function stripSiteSuffix(title) {
  return title
    .replace(/\s+\|\s+AfroTools\s*$/i, '')
    .replace(/\s+-\s+AfroTools\s*$/i, '')
    .trim();
}

function readBlogIndexOrder() {
  if (!fs.existsSync(BLOG_INDEX)) return new Map();
  const html = readFile(BLOG_INDEX);
  const order = new Map();
  const hrefRe = /href=["']\/blog\/([^/"'#?]+)\/?["']/g;
  let match;
  let index = 0;
  while ((match = hrefRe.exec(html)) !== null) {
    if (!order.has(match[1])) order.set(match[1], index++);
  }
  return order;
}

function getBlogArticles() {
  const indexOrder = readBlogIndexOrder();
  const articles = [];

  for (const entry of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'assets') continue;

    const articlePath = path.join(BLOG_DIR, entry.name, 'index.html');
    if (!fs.existsSync(articlePath)) continue;

    const html = readFile(articlePath);
    const meta = readMeta(html);
    if (hasNoindex(meta) || isRedirectLike(html)) continue;

    const jsonLd = extractJsonLdArticle(html);
    const pubDate = parsePubDate(
      meta.get('article:published_time') ||
      jsonLd.datePublished
    );
    if (!pubDate) continue;

    const canonical = extractCanonical(html) || `${BASE_URL}/blog/${entry.name}/`;
    let url;
    try {
      url = new URL(canonical, BASE_URL).toString();
    } catch {
      url = `${BASE_URL}/blog/${entry.name}/`;
    }

    if (!url.startsWith(`${BASE_URL}/blog/`)) continue;

    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = stripSiteSuffix(collapseText(
      jsonLd.headline ||
      meta.get('og:title') ||
      (titleMatch ? titleMatch[1] : entry.name)
    ));

    const description = collapseText(
      jsonLd.description ||
      meta.get('description') ||
      meta.get('og:description') ||
      title
    );

    const category = collapseText(
      meta.get('article:section') ||
      (html.match(/<span[^>]*class=["'][^"']*category-badge[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] ||
      'Tools & Guides'
    );

    articles.push({
      slug: entry.name,
      title,
      description,
      category,
      url,
      pubDate,
      order: indexOrder.has(entry.name) ? indexOrder.get(entry.name) : Number.MAX_SAFE_INTEGER,
    });
  }

  articles.sort((a, b) => {
    const dateDiff = b.pubDate.getTime() - a.pubDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    if (a.order !== b.order) return a.order - b.order;
    return a.slug.localeCompare(b.slug);
  });

  return articles.slice(0, Number.isFinite(LIMIT) && LIMIT > 0 ? LIMIT : DEFAULT_LIMIT);
}

function renderFeed(articles) {
  const lastBuildDate = articles.length ? articles[0].pubDate : new Date();
  const items = articles.map((article) => `  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${escapeXml(article.url)}</link>
    <guid isPermaLink="true">${escapeXml(article.url)}</guid>
    <description>${escapeXml(article.description)}</description>
    <pubDate>${escapeXml(formatRfc822(article.pubDate))}</pubDate>
    <category>${escapeXml(article.category)}</category>
  </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AfroTools Blog</title>
    <link>${BASE_URL}/blog/</link>
    <description>Expert guides on African tax, PAYE, currency, business, and finance. Practical articles for professionals across Nigeria, Kenya, South Africa, Ghana and more.</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(formatRfc822(lastBuildDate))}</lastBuildDate>
    <managingEditor>hello@afrotools.com (AfroTools)</managingEditor>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items ? `\n${items}` : ''}
  </channel>
</rss>
`;
}

function main() {
  const articles = getBlogArticles();
  if (!articles.length) {
    console.error('No blog articles with published metadata were found.');
    process.exit(1);
  }

  const expected = renderFeed(articles);

  if (CHECK_ONLY) {
    const current = fs.existsSync(FEED_PATH) ? readFile(FEED_PATH) : '';
    if (current !== expected) {
      console.error('blog/feed.xml is stale. Run `npm run blog:feed`.');
      console.error(`Expected latest RSS item: ${articles[0].slug}`);
      process.exit(1);
    }
    console.log(`blog/feed.xml is current (${articles.length} items, latest: ${articles[0].slug}).`);
    return;
  }

  writeFileSyncWithRetry(FEED_PATH, expected, 'utf8');
  console.log(`Generated blog/feed.xml with ${articles.length} items. Latest: ${articles[0].slug}`);
}

main();
