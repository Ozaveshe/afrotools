#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const AUTHORS = path.join(ROOT, 'authors');
const WRITE = process.argv.includes('--write');
const LINKEDIN = 'https://www.linkedin.com/company/afrotools/';
const PROFILES = Object.freeze([
  { id: 'david-mensah', name: 'David Mensah', focus: 'tax, payroll and business guides', penName: false },
  { id: 'amara-moyo', name: 'Amara Moyo', focus: 'trade, vehicles and transport guides', penName: true },
  { id: 'nia-adeyemi', name: 'Nia Adeyemi', focus: 'career, documents and education guides', penName: true },
  { id: 'idris-diallo', name: 'Idris Diallo', focus: 'money, agriculture, energy and household guides', penName: true }
]);

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function plainText(value) {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
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

function assign(slug, html) {
  const authorTag = /<meta\b(?=[^>]*\bname=["']author["'])[^>]*>/i.exec(html)?.[0] || '';
  const existingName = /\bcontent=["']([^"']+)["']/i.exec(authorTag)?.[1] || '';
  const existing = PROFILES.find((person) => person.name === existingName);
  if (existing) return existing;
  if (/(?:car|vehicle|road|transport|trade|import|customs|logistics|shipping|freight|port|flight)/.test(slug)) return PROFILES[1];
  if (/(?:cv|resume|career|job|employment|interview|cover-letter|pdf|document|passport|visa|study|scholarship|school|education|exam|waec|jamb)/.test(slug)) return PROFILES[2];
  if (/(?:tax|paye|vat|salary|payroll|withholding|business|invoice|accounting|filing|compliance|payslip|pension)/.test(slug)) return PROFILES[0];
  return PROFILES[3];
}

function setMetaAuthor(html, person) {
  const tag = /<meta\b(?=[^>]*\bname=["']author["'])[^>]*>/i;
  if (tag.test(html)) return html.replace(tag, (match) => /\bcontent=["'][^"']*["']/i.test(match)
    ? match.replace(/\bcontent=["'][^"']*["']/i, `content="${person.name}"`)
    : match.replace(/\s*\/?>$/, ` content="${person.name}">`));
  return html.replace(/<\/head>/i, `<meta name="author" content="${person.name}">\n</head>`);
}

function setSchemaAuthor(html, person) {
  return html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (full, start, source, end) => {
      let data;
      try { data = JSON.parse(source); } catch { return full; }
      const nodes = Array.isArray(data) ? data : data['@graph'] || [data];
      let changed = false;
      for (const node of nodes) {
        if (!node || !['Article', 'BlogPosting'].includes(node['@type'])) continue;
        const author = { '@type': 'Person', name: person.name, url: `https://afrotools.com/authors/${person.id}/` };
        if (JSON.stringify(node.author) !== JSON.stringify(author)) {
          node.author = author;
          changed = true;
        }
      }
      return changed ? `${start}${JSON.stringify(data)}${end}` : full;
    });
}

function linkBylines(html, person) {
  const names = ['AfroTools Team', 'AfroTools Editorial Team', '&Eacute;quipe AfroTools', 'Équipe AfroTools', person.name];
  const pattern = new RegExp(`(<(span|strong|h4)\\b[^>]*>)(\\s*(?:By\\s+|Par\\s+)?(?:${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*)(<\\/\\2>)`, 'gi');
  return html.replace(pattern, (_match, start, _tag, value, end) => {
    const prefix = /^\s*Par\s+/i.test(value) ? 'Par ' : /^\s*By\s+/i.test(value) ? 'By ' : '';
    return `${start}${prefix}<a href="/authors/${person.id}/">${person.name}</a>${end}`;
  });
}

function authorNote(person, lang) {
  if (lang.startsWith('fr')) return person.penName ? 'Nom de plume éditorial' : 'Contributeur AfroTools';
  if (lang.startsWith('sw')) return person.penName ? 'Jina la uandishi la timu' : 'Mwandishi wa AfroTools';
  return person.penName ? 'Editorial pen name' : 'AfroTools contributor';
}

function authorBox(person, lang) {
  const note = authorNote(person, lang);
  const bio = lang.startsWith('fr')
    ? 'Ce nom signe des guides pratiques AfroTools. Les sources et dates de vérification figurent dans chaque guide lorsque nécessaire.'
    : lang.startsWith('sw')
      ? 'Jina hili hutumika kwa miongozo ya AfroTools. Vyanzo na tarehe za ukaguzi huonyeshwa kwenye mwongozo husika.'
      : `This byline covers AfroTools ${person.focus}. Each guide carries its own sources and review date where current rules or prices matter.`;
  const profileLabel = lang.startsWith('fr') ? "Profil de l'auteur" : lang.startsWith('sw') ? 'Wasifu wa mwandishi' : 'Author profile';
  const linkedInLabel = lang.startsWith('fr') ? 'AfroTools sur LinkedIn' : lang.startsWith('sw') ? 'AfroTools kwenye LinkedIn' : 'AfroTools on LinkedIn';
  return `<div class="author-box" data-blog-author><div class="author-box-avatar" aria-hidden="true">${person.name.split(' ').map((part) => part[0]).join('')}</div><div class="author-box-info"><h4><a href="/authors/${person.id}/">${person.name}</a></h4><p>${escapeHtml(note)}. ${escapeHtml(bio)}</p><p class="author-profile-links"><a href="/authors/${person.id}/">${profileLabel}</a> · <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">${linkedInLabel}</a></p></div></div>`;
}

function setAuthorBox(html, person, lang) {
  const open = /<div\b[^>]*class=["'][^"']*\bauthor-box\b[^"']*["'][^>]*>/i.exec(html);
  if (open) {
    const close = matchingClose(html, open.index, 'div');
    if (close < 0) throw new Error('Unclosed author box');
    const end = close + '</div>'.length;
    return `${html.slice(0, open.index)}${authorBox(person, lang)}${html.slice(end)}`;
  }
  const body = /<(?:article|div)\b[^>]*class=["'][^"']*\barticle-body\b[^"']*["'][^>]*>/i.exec(html);
  if (body) {
    const close = matchingClose(html, body.index, body[0].match(/^<(\w+)/)[1]);
    if (close < 0) throw new Error('Unclosed article body');
    const related = /<section\b[^>]*class=["'][^"']*\brelated-articles\b[^"']*["'][^>]*>/i.exec(html.slice(body.index, close));
    const at = related ? body.index + related.index : close;
    return `${html.slice(0, at)}${authorBox(person, lang)}\n${html.slice(at)}`;
  }
  const at = html.lastIndexOf('</main>');
  if (at < 0) throw new Error('No main article container');
  return `${html.slice(0, at)}${authorBox(person, lang)}\n${html.slice(at)}`;
}

function improveArticle(html, slug) {
  if (/http-equiv=["']refresh["']/i.test(html)) return { html, person: null };
  const person = assign(slug, html);
  const lang = /<html\b[^>]*\blang=["']([^"']+)/i.exec(html)?.[1] || 'en';
  let output = setMetaAuthor(html, person);
  output = setSchemaAuthor(output, person);
  output = linkBylines(output, person);
  output = setAuthorBox(output, person, lang);
  return { html: output, person };
}

function improveHub(html, assignments) {
  return html.replace(/<article\b[^>]*class=["'][^"']*\barticle-card\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi, (card) => {
    const slug = /href=["']\/blog\/([a-z0-9-]+)\/["']/i.exec(card)?.[1];
    const person = assignments.get(slug);
    if (!person) return card;
    return card.replace(/(<div\b[^>]*class=["'][^"']*\barticle-card-meta\b[^"']*["'][^>]*>[\s\S]*?<span\b[^>]*>)[\s\S]*?(<\/span>)/i,
      (_match, start, end) => `${start}${person.name}${end}`);
  });
}

function pageShell(title, description, route, body, schema) {
  return `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} | AfroTools</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="https://afrotools.com${route}"><meta property="og:type" content="profile"><meta property="og:title" content="${escapeHtml(title)} | AfroTools"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="https://afrotools.com${route}"><meta property="og:image" content="https://afrotools.com/assets/img/og-home.png"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/authors/assets/css/authors.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><a class="skip-link" href="#content">Skip to content</a><afro-navbar></afro-navbar><main class="author-page" id="content">${body}</main><afro-footer></afro-footer><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script></body></html>\n`;
}

function profilePage(person, articles) {
  const route = `/authors/${person.id}/`;
  const label = person.penName ? 'Editorial pen name' : 'AfroTools contributor';
  const description = `${person.name} is an AfroTools ${person.penName ? 'editorial pen name' : 'contributor'} credited on ${person.focus}. Read the guides and their source notes.`;
  const list = articles.slice(0, 12).map((article) => `<li><a href="/blog/${article.slug}/">${escapeHtml(article.title)}</a>${article.date ? ` <time datetime="${article.date}">${article.date}</time>` : ''}</li>`).join('\n');
  const body = `<nav class="author-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/authors/">Authors</a> / ${person.name}</nav><p class="author-kicker">${label}</p><h1>${person.name}</h1><p class="author-lead">${description}</p><p>These bylines identify the credited author of each guide. The three pen names are disclosed on their profiles. Article source and review dates belong to the individual guide; a publication date alone is not a source check.</p><h2>Recent guides</h2><ul class="author-articles">${list}</ul><p><a href="/blog/">Browse the blog</a> · <a href="/about/">About AfroTools</a> · <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">AfroTools company profile on LinkedIn</a></p>`;
  return pageShell(person.name, description, route, body, { '@context': 'https://schema.org', '@type': 'Person', name: person.name, url: `https://afrotools.com${route}`, description: label });
}

function indexPage() {
  const route = '/authors/';
  const description = 'Meet the credited authors of AfroTools guides and see how our editorial bylines and pen names are presented.';
  const cards = PROFILES.map((person) => `<li><a href="/authors/${person.id}/"><strong>${person.name}</strong><span>${person.penName ? 'Editorial pen name' : 'AfroTools contributor'} · ${person.focus}</span></a></li>`).join('\n');
  const body = `<nav class="author-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog/">Blog</a> / Authors</nav><p class="author-kicker">AfroTools editorial</p><h1>Guide authors</h1><p class="author-lead">AfroTools credits each guide to a named contributor or disclosed editorial pen name. The author page connects a byline to its guides. It does not imply a professional qualification or a current source review.</p><ul class="author-list">${cards}</ul><h2>How guides are maintained</h2><p>Guides connect practical questions to working AfroTools tools. When a claim depends on changing rules, prices or deadlines, editors check primary sources and state the review date in the guide. Existing articles can receive a new byline without changing their original publication date or implying that every fact was rechecked.</p><p><a href="/about/">Learn about AfroTools</a> · <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">AfroTools on LinkedIn</a></p>`;
  return pageShell('AfroTools guide authors', description, route, body, { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'AfroTools guide authors', url: `https://afrotools.com${route}` });
}

function put(file, content, changed) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current === content) return;
  // The site build adds analytics, hreflang, OG fallbacks and asset hashes to
  // generated author pages. Compare their owned content in check mode so those
  // later build passes do not appear as authorship drift.
  if (!WRITE && file.startsWith(`${AUTHORS}${path.sep}`) && profileOutputMatches(current, content)) return;
  changed.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  if (WRITE) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }
}

function profileOutputMatches(actual, expected) {
  const main = (html) => /<main\b[^>]*class="author-page"[^>]*>[\s\S]*?<\/main>/i.exec(html)?.[0] || '';
  const title = (html) => /<title>[^<]*<\/title>/i.exec(html)?.[0] || '';
  const canonical = (html) => /<link\b[^>]*rel="canonical"[^>]*>/i.exec(html)?.[0] || '';
  const schema = (html) => /<script type="application\/ld\+json">[\s\S]*?<\/script>/i.exec(html)?.[0] || '';
  return Boolean(main(actual)) && main(actual) === main(expected)
    && title(actual) === title(expected)
    && canonical(actual) === canonical(expected)
    && schema(actual) === schema(expected)
    && actual.includes('/authors/assets/css/authors.css');
}

function main() {
  const changed = [];
  const assignments = new Map();
  const byAuthor = new Map(PROFILES.map((person) => [person.id, []]));
  for (const entry of fs.readdirSync(BLOG, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'assets') continue;
    const file = path.join(BLOG, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, 'utf8');
    const { html, person } = improveArticle(before, entry.name);
    if (!person) continue;
    put(file, html, changed);
    assignments.set(entry.name, person);
    const title = plainText(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || entry.name);
    const date = /<meta\b(?=[^>]*\bproperty=["']article:published_time["'])(?=[^>]*\bcontent=["'](\d{4}-\d{2}-\d{2})[^"']*["'])[^>]*>/i.exec(html)?.[1] || '';
    byAuthor.get(person.id).push({ slug: entry.name, title, date });
  }
  const hub = path.join(BLOG, 'index.html');
  put(hub, improveHub(fs.readFileSync(hub, 'utf8'), assignments), changed);
  put(path.join(AUTHORS, 'index.html'), indexPage(), changed);
  for (const person of PROFILES) {
    const articles = byAuthor.get(person.id).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
    put(path.join(AUTHORS, person.id, 'index.html'), profilePage(person, articles), changed);
  }
  console.log(`${WRITE ? 'Updated' : 'Checked'} blog authorship: ${assignments.size} articles, ${changed.length} changed files.`);
  if (!WRITE && changed.length) {
    console.error(changed.slice(0, 25).join('\n'));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { PROFILES, assign, improveArticle, improveHub, matchingClose, profileOutputMatches };
