#!/usr/bin/env node
'use strict';

// Run after an article is published. Editorially choose older guides that the
// new article already cites, then give those guides a crawlable return link.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const LEDGER = path.join(ROOT, 'data', 'content', 'blog-backlinks');
const ORIGIN = 'https://afrotools.com';
const MAX_RELATED = 4;

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function plainText(value) {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function articleBody(html) {
  const start = /<(?:article|div)\b[^>]*class=["'][^"']*\barticle-body\b[^"']*["'][^>]*>/i.exec(html);
  if (!start) return html;
  const tag = start[0].match(/^<(\w+)/)[1];
  const close = matchingClose(html, start.index, tag);
  return close < 0 ? html : html.slice(start.index, close);
}

function matchingClose(html, openAt, tag) {
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  tokens.lastIndex = openAt;
  let depth = 0;
  let match;
  while ((match = tokens.exec(html))) {
    depth += /^<\//.test(match[0]) ? -1 : 1;
    if (depth === 0) return match.index;
  }
  return -1;
}

function blogSlug(href) {
  try {
    const url = new URL(href, ORIGIN);
    if (url.origin !== ORIGIN) return '';
    return /^\/blog\/([a-z0-9-]+)\/?$/.exec(url.pathname)?.[1] || '';
  } catch { return ''; }
}

function linksIn(html) {
  const links = new Set();
  for (const match of html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]+)"|'([^']+)')[^>]*>/gi)) {
    const slug = blogSlug(match[1] || match[2]);
    if (slug) links.add(slug);
  }
  return links;
}

function readArticle(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  const file = path.join(BLOG, slug, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Unknown blog article: ${slug}`);
  const html = fs.readFileSync(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) throw new Error(`Redirect is not an article: ${slug}`);
  const body = articleBody(html);
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const description = /<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i.exec(html);
  const date = /<meta\b(?=[^>]*\bproperty=["']article:published_time["'])(?=[^>]*\bcontent=["'](\d{4}-\d{2}-\d{2})[^"']*["'])[^>]*>/i.exec(html)?.[1] || '';
  const lang = /<html\b[^>]*\blang=["']([^"']+)/i.exec(html)?.[1] || 'en';
  return { slug, file, html, body, links: linksIn(html),
    title: plainText(h1?.[1] || slug), description: plainText(description?.[1] || ''), date, lang };
}

function allArticles() {
  return fs.readdirSync(BLOG, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'assets')
    .map((entry) => entry.name)
    .filter((slug) => fs.existsSync(path.join(BLOG, slug, 'index.html')))
    .filter((slug) => !/http-equiv=["']refresh["']/i.test(fs.readFileSync(path.join(BLOG, slug, 'index.html'), 'utf8')))
    .map((slug) => readArticle(slug));
}

function audit(articles) {
  const known = new Set(articles.map((item) => item.slug));
  const inbound = new Map(articles.map((item) => [item.slug, []]));
  for (const article of articles) {
    for (const slug of article.links) {
      if (known.has(slug) && slug !== article.slug) inbound.get(slug).push(article.slug);
    }
  }
  const hubLinks = linksIn(fs.readFileSync(path.join(BLOG, 'index.html'), 'utf8'));
  const bySlug = new Map(articles.map((item) => [item.slug, item]));
  const withoutArticleInbound = [...inbound].filter(([, sources]) => sources.length === 0).map(([slug]) => slug);
  return {
    articles: articles.length,
    withoutArticleInbound,
    suggestedBacklinkSources: withoutArticleInbound.map((slug) => {
      const newer = bySlug.get(slug);
      return { slug, sources: [...newer.links].filter((olderSlug) => {
        const older = bySlug.get(olderSlug);
        return older && older.slug !== slug && older.lang === newer.lang
          && (!newer.date || !older.date || older.date <= newer.date);
      }).slice(0, 5) };
    }),
    withoutHubLink: articles.filter((item) => !hubLinks.has(item.slug)).map((item) => item.slug)
  };
}

function linkCard(article) {
  const excerpt = article.description.length > 155 ? `${article.description.slice(0, 152).trimEnd()}...` : article.description;
  return `<a class="related-card" href="/blog/${article.slug}/"><span class="category-badge category-badge--tools">Related guide</span><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(excerpt || 'Read the related AfroTools guide.')}</p></a>`;
}

function addBacklink(older, newer) {
  if (!newer.links.has(older.slug)) throw new Error(`${newer.slug} does not link to ${older.slug}; review relevance first`);
  if (newer.date && older.date && older.date > newer.date) throw new Error(`${older.slug} is newer than ${newer.slug}`);
  if (older.links.has(newer.slug)) return { html: older.html, changed: false, reason: 'already-linked' };
  const card = linkCard(newer);
  const grid = /<div\b[^>]*class=["'][^"']*\brelated-grid\b[^"']*["'][^>]*>/i.exec(older.html);
  if (grid) {
    const close = matchingClose(older.html, grid.index, 'div');
    if (close < 0) throw new Error(`Unclosed related grid in ${older.slug}`);
    const existing = linksIn(older.html.slice(grid.index, close));
    if (existing.size >= MAX_RELATED) throw new Error(`${older.slug} already has ${MAX_RELATED} related guides`);
    return { html: `${older.html.slice(0, close)}${card}\n${older.html.slice(close)}`, changed: true };
  }
  const body = /<(?:article|div)\b[^>]*class=["'][^"']*\barticle-body\b[^"']*["'][^>]*>/i.exec(older.html);
  if (!body) throw new Error(`${older.slug} has no article body or related grid`);
  const close = matchingClose(older.html, body.index, body[0].match(/^<(\w+)/)[1]);
  if (close < 0) throw new Error(`Unclosed article body in ${older.slug}`);
  const block = `<section class="related-articles" aria-label="Related guides"><h2>Related guide</h2><div class="related-grid">${card}</div></section>`;
  return { html: `${older.html.slice(0, close)}${block}\n${older.html.slice(close)}`, changed: true };
}

function parseArgs(argv) {
  const args = { slug: '', from: [], write: false, json: false, check: false, ledger: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--slug') args.slug = argv[++i] || '';
    else if (argv[i] === '--from') args.from = (argv[++i] || '').split(',').filter(Boolean);
    else if (argv[i] === '--write') args.write = true;
    else if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--check') args.check = true;
    else if (argv[i] === '--ledger') args.ledger = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (args.write && args.check) throw new Error('Use either --write or --check');
  if (args.ledger && (args.slug || args.from.length)) throw new Error('Use --ledger or --slug/--from');
  return args;
}

function runLinkSet(slug, from, args) {
  if (!from.length || from.length > 3 || new Set(from).size !== from.length) {
    throw new Error('Select one to three distinct older slugs with --from');
  }
  const newer = readArticle(slug);
  const plans = from.map((olderSlug) => {
    const older = readArticle(olderSlug);
    return { older, result: addBacklink(older, newer) };
  });
  if (args.check) {
    const missing = plans.filter((plan) => plan.result.changed).map((plan) => plan.older.slug);
    if (missing.length) throw new Error(`Missing backlink(s) to ${newer.slug}: ${missing.join(', ')}`);
    console.log(`Backlinks to ${newer.slug} verified from ${from.join(', ')}.`);
    return;
  }
  for (const { older, result } of plans) {
    if (args.write && result.changed) fs.writeFileSync(older.file, result.html, 'utf8');
    console.log(`${args.write ? 'Updated' : 'Would update'} ${older.slug}: ${result.changed ? 'backlink added' : result.reason}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.ledger) {
    const files = fs.existsSync(LEDGER) ? fs.readdirSync(LEDGER).filter((file) => file.endsWith('.json')).sort() : [];
    for (const file of files) {
      const entry = JSON.parse(fs.readFileSync(path.join(LEDGER, file), 'utf8'));
      if (file !== `${entry.slug}.json`) throw new Error(`Backlink ledger filename mismatch: ${file}`);
      if (!Array.isArray(entry.from)) throw new Error(`Missing from list: ${file}`);
      runLinkSet(entry.slug, entry.from, args);
    }
    console.log(`${files.length} curated backlink set(s) ${args.check ? 'checked' : args.write ? 'applied' : 'planned'}.`);
    return;
  }
  if (!args.slug) {
    const report = audit(allArticles());
    if (args.json) console.log(JSON.stringify(report, null, 2));
    else console.log(`${report.articles} articles; ${report.withoutArticleInbound.length} have no inbound link from another article; ${report.withoutHubLink.length} have no blog hub link.`);
    return;
  }
  runLinkSet(args.slug, args.from, args);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { addBacklink, audit, blogSlug, linksIn, matchingClose, parseArgs };
