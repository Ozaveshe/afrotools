#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REFRESH_HREF = '/assets/css/top-level-page-ui-refresh.css';
const REFRESH_CLASS = 'top-level-page-ui-refresh';
const SKIP_DIRS = new Set([
  '.git',
  '.claude',
  '.agents',
  '.codex',
  '.netlify',
  'artifacts',
  'audit-results',
  'coverage',
  'dist',
  'lang',
  'node_modules',
  'reports',
  'scripts',
  'test-results',
  'supabase',
  'vendor',
]);

function toRel(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

function shouldSkip(relPath) {
  return relPath === 'tools/lobola-gift-list' || relPath.startsWith('tools/lobola-gift-list/');
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;

    const abs = path.join(dir, entry.name);
    const rel = toRel(abs);
    if (shouldSkip(rel)) continue;

    if (entry.isDirectory()) {
      walk(abs, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(abs);
    }
  }
  return files;
}

function ensureRefreshLink(html) {
  const link = `<link rel="stylesheet" href="${REFRESH_HREF}">`;
  const linkPattern = /<link\b[^>]*href=["']\/assets\/css\/top-level-page-ui-refresh\.css["'][^>]*>\s*/gi;
  const noscriptRanges = [...html.matchAll(/<noscript\b[\s\S]*?<\/noscript>/gi)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
  const linkMatches = [...html.matchAll(linkPattern)];
  const hasActiveLink = linkMatches.some((match) => !noscriptRanges.some((range) => match.index >= range.start && match.index < range.end));

  if (hasActiveLink) {
    const withoutNoscriptDuplicates = html.replace(linkPattern, (match, offset) => {
      const inNoscript = noscriptRanges.some((range) => offset >= range.start && offset < range.end);
      return inNoscript ? '' : match;
    });
    return { html: withoutNoscriptDuplicates, changed: withoutNoscriptDuplicates !== html };
  }

  const withoutInactiveLinks = html.replace(linkPattern, '');
  const headClose = withoutInactiveLinks.search(/<\/head>/i);
  if (headClose !== -1) {
    return {
      html: `${withoutInactiveLinks.slice(0, headClose)}${link}\n${withoutInactiveLinks.slice(headClose)}`,
      changed: true,
    };
  }

  return { html: withoutInactiveLinks, changed: withoutInactiveLinks !== html };
}

function ensureBodyClass(html) {
  const bodyMatch = html.match(/<body\b([^>]*)>/i);
  if (!bodyMatch) return { html, changed: false };

  const tag = bodyMatch[0];
  if (new RegExp(`\\b${REFRESH_CLASS}\\b`).test(tag)) return { html, changed: false };

  let nextTag;
  const classMatch = tag.match(/\bclass=(["'])(.*?)\1/i);
  if (classMatch) {
    const classes = `${classMatch[2]} ${REFRESH_CLASS}`.trim().replace(/\s+/g, ' ');
    nextTag = tag.replace(classMatch[0], `class=${classMatch[1]}${classes}${classMatch[1]}`);
  } else {
    nextTag = tag.replace(/>$/, ` class="${REFRESH_CLASS}">`);
  }

  return {
    html: html.replace(tag, nextTag),
    changed: true,
  };
}

function apply(absPath) {
  const original = fs.readFileSync(absPath, 'utf8');
  if (!/<html\b/i.test(original)) return null;

  let html = original;
  const linkResult = ensureRefreshLink(html);
  html = linkResult.html;
  const bodyResult = ensureBodyClass(html);
  html = bodyResult.html;

  const changed = linkResult.changed || bodyResult.changed;
  if (changed) fs.writeFileSync(absPath, html, 'utf8');

  return {
    rel: toRel(absPath),
    linkChanged: linkResult.changed,
    bodyChanged: bodyResult.changed,
    changed,
  };
}

const rows = walk(ROOT).map(apply).filter(Boolean);
const changed = rows.filter((row) => row.changed);
const byTopDir = {};
for (const row of changed) {
  const top = row.rel.includes('/') ? row.rel.split('/')[0] : '(root)';
  byTopDir[top] = (byTopDir[top] || 0) + 1;
}

console.log(JSON.stringify({
  scanned: rows.length,
  changed: changed.length,
  linkChanged: changed.filter((row) => row.linkChanged).length,
  bodyChanged: changed.filter((row) => row.bodyChanged).length,
  byTopDir,
  samples: changed.slice(0, 40),
}, null, 2));
