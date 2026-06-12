#!/usr/bin/env node
/**
 * Verifies static main-blog publishing invariants.
 *
 * This is intentionally stricter than a generic link check and narrower than a
 * full editorial audit: it catches backend drift between article files, the
 * blog hub, canonical metadata, JSON-LD, and RSS.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_INDEX = path.join(BLOG_DIR, 'index.html');
const FEED_PATH = path.join(BLOG_DIR, 'feed.xml');
const BASE_URL = 'https://afrotools.com';
const LATEST_FEED_COVERAGE = 20;

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
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
    if (key && attrs.content !== undefined) meta.set(key.toLowerCase(), attrs.content);
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
  return '';
}

function hasNoindex(meta) {
  return /\bnoindex\b/i.test(meta.get('robots') || '');
}

function isRedirectLike(html) {
  return /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    /location\.(?:href|replace)\s*[=(]/i.test(html);
}

function parsePubDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T08:00:00Z`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function listArticleFiles() {
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'assets')
    .map((entry) => ({
      slug: entry.name,
      filePath: path.join(BLOG_DIR, entry.name, 'index.html'),
    }))
    .filter((entry) => fs.existsSync(entry.filePath));
}

function readBlogIndexOrder() {
  const html = read(BLOG_INDEX);
  const order = new Map();
  const hrefRe = /href=["']\/blog\/([^/"'#?]+)\/?["']/g;
  let match;
  let index = 0;
  while ((match = hrefRe.exec(html)) !== null) {
    if (!order.has(match[1])) order.set(match[1], index++);
  }
  return order;
}

function getArticles() {
  const order = readBlogIndexOrder();
  return listArticleFiles().map((article) => {
    const html = read(article.filePath);
    const meta = readMeta(html);
    const pubDate = parsePubDate(
      meta.get('article:published_time') ||
      (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1]
    );
    const publishable = !hasNoindex(meta) && !isRedirectLike(html);
    return {
      ...article,
      html,
      meta,
      canonical: extractCanonical(html),
      pubDate,
      publishable,
      order: order.has(article.slug) ? order.get(article.slug) : Number.MAX_SAFE_INTEGER,
    };
  });
}

function extractJsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]);
}

function validateJsonLd(articles, failures) {
  for (const article of articles) {
    const blocks = extractJsonLdBlocks(article.html);
    blocks.forEach((block, index) => {
      try {
        JSON.parse(block);
      } catch (error) {
        failures.push(`${rel(article.filePath)} has invalid JSON-LD block ${index + 1}: ${error.message}`);
      }
    });
  }
}

function validateCanonicals(articles, failures) {
  for (const article of articles) {
    if (!article.publishable || !article.canonical) continue;
    const expected = `${BASE_URL}/blog/${article.slug}/`;
    if (article.canonical !== expected) {
      failures.push(`${rel(article.filePath)} canonical is ${article.canonical}, expected ${expected}`);
    }
  }
}

function validateHub(articles, failures) {
  const html = read(BLOG_INDEX);
  const cards = [...html.matchAll(/<article class="article-card"[\s\S]*?<h3>\s*<a href="([^"]+)"/g)]
    .map((match) => match[1]);
  const stat = Number((html.match(/<strong id="statArticles">(\d+)<\/strong>/) || [])[1]);
  const duplicates = [...new Set(cards.filter((href, index) => cards.indexOf(href) !== index))];
  const articleSlugs = new Set(articles.map((article) => article.slug));
  const publishableSlugs = new Set(articles.filter((article) => article.publishable).map((article) => article.slug));
  const missingTargets = cards
    .filter((href) => href.startsWith('/blog/'))
    .map((href) => href.replace(/^\/blog\//, '').replace(/\/$/, ''))
    .filter((slug) => slug && !articleSlugs.has(slug));
  const nonPublishableTargets = cards
    .filter((href) => href.startsWith('/blog/'))
    .map((href) => href.replace(/^\/blog\//, '').replace(/\/$/, ''))
    .filter((slug) => slug && articleSlugs.has(slug) && !publishableSlugs.has(slug));

  if (Number.isFinite(stat) && stat !== cards.length) {
    failures.push(`blog/index.html statArticles is ${stat}, but ${cards.length} article cards were found`);
  }
  if (duplicates.length) {
    failures.push(`blog/index.html has duplicate article card links: ${duplicates.slice(0, 10).join(', ')}`);
  }
  if (missingTargets.length) {
    failures.push(`blog/index.html links to missing article folders: ${[...new Set(missingTargets)].slice(0, 10).join(', ')}`);
  }
  if (nonPublishableTargets.length) {
    failures.push(`blog/index.html links article cards to non-publishable routes: ${[...new Set(nonPublishableTargets)].slice(0, 10).join(', ')}`);
  }

  return { cards: cards.length, stat };
}

function parseFeed() {
  const xml = read(FEED_PATH);
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const block = match[1];
    return {
      link: (block.match(/<link>([^<]+)<\/link>/) || [])[1] || '',
      title: (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '',
      pubDate: (block.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1] || '',
    };
  });
  return { xml, items };
}

function validateFeed(articles, failures) {
  const { xml, items } = parseFeed();
  if (!/<rss\b/i.test(xml) || !/<channel\b/i.test(xml)) {
    failures.push('blog/feed.xml does not look like an RSS channel');
  }
  if (!items.length) {
    failures.push('blog/feed.xml has no RSS items');
    return { items: 0 };
  }

  const links = items.map((item) => item.link).filter(Boolean);
  const duplicateLinks = [...new Set(links.filter((link, index) => links.indexOf(link) !== index))];
  if (duplicateLinks.length) {
    failures.push(`blog/feed.xml has duplicate item links: ${duplicateLinks.slice(0, 10).join(', ')}`);
  }

  const articlesByUrl = new Map(
    articles
      .filter((article) => article.publishable)
      .map((article) => [`${BASE_URL}/blog/${article.slug}/`, article])
  );

  const unknownLinks = links.filter((link) => !articlesByUrl.has(link));
  if (unknownLinks.length) {
    failures.push(`blog/feed.xml links to unknown or non-publishable articles: ${unknownLinks.slice(0, 10).join(', ')}`);
  }

  const latest = articles
    .filter((article) => article.publishable && article.pubDate)
    .sort((a, b) => {
      const dateDiff = b.pubDate.getTime() - a.pubDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      if (a.order !== b.order) return a.order - b.order;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, LATEST_FEED_COVERAGE);

  const feedLinks = new Set(links);
  const missingLatest = latest
    .filter((article) => !feedLinks.has(`${BASE_URL}/blog/${article.slug}/`))
    .map((article) => article.slug);
  if (missingLatest.length) {
    failures.push(`blog/feed.xml is missing latest blog articles: ${missingLatest.join(', ')}`);
  }

  return { items: items.length, latestChecked: latest.length };
}

function main() {
  const failures = [];
  const articles = getArticles();
  validateJsonLd(articles, failures);
  validateCanonicals(articles, failures);
  const hub = validateHub(articles, failures);
  const feed = validateFeed(articles, failures);

  if (failures.length) {
    console.error(`Blog backend verification failed with ${failures.length} issue(s):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  const publishableCount = articles.filter((article) => article.publishable).length;
  console.log(
    `Blog backend verified: ${publishableCount} publishable articles, ${hub.cards} hub cards, ${feed.items} RSS items.`
  );
}

main();
