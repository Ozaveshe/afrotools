#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDED_DIRS = new Set([
  '.git',
  '.claude',
  '.codex',
  '.github',
  '.playwright',
  '.tmp-codex',
  '.tmp-validation',
  'node_modules',
  'dist',
  'reports',
  'test-results',
]);

const CONTROL_RE = /<(input|select|textarea)\b([^>]*)>/gi;
const SKIP_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

let filesChanged = 0;
let labelsAssociated = 0;
let ariaLabelsAdded = 0;

main();

function main() {
  for (const file of collectHtmlFiles(ROOT)) {
    const before = fs.readFileSync(file, 'utf8');
    const after = fixHtml(before);
    if (after === before) continue;
    fs.writeFileSync(file, after, 'utf8');
    filesChanged += 1;
  }

  console.log(`Form label association repair complete.`);
  console.log(`  Files changed: ${filesChanged}`);
  console.log(`  Labels associated with for=: ${labelsAssociated}`);
  console.log(`  aria-label attributes added: ${ariaLabelsAdded}`);
}

function collectHtmlFiles(dir) {
  const files = [];
  walk(dir, (abs, rel) => {
    if (/\.html$/i.test(rel)) files.push(abs);
  });
  return files.sort();
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name !== '.well-known' && entry.name.startsWith('.')) continue;
    if (entry.name.startsWith('__')) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs);
    if (entry.isDirectory()) {
      walk(abs, onFile);
      continue;
    }
    if (entry.isFile()) onFile(abs, toPosix(rel));
  }
}

function fixHtml(source) {
  const edits = [];
  for (const match of source.matchAll(CONTROL_RE)) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const fullTag = match[0];
    const index = match.index || 0;
    const type = (attr(attrs, 'type') || '').toLowerCase();
    if (tag === 'input' && SKIP_INPUT_TYPES.has(type)) continue;
    if (/\baria-label\s*=|\baria-labelledby\s*=/i.test(attrs)) continue;
    if (isWrappedByLabel(source, index)) continue;
    const id = attr(attrs, 'id');
    if (id && hasLabelFor(source, id)) continue;

    if (id) {
      const labelEdit = findNearbyLabelEdit(source, index, id);
      if (labelEdit) {
        edits.push(labelEdit);
        labelsAssociated += 1;
        continue;
      }
    }

    const label = inferControlLabel(source, index, attrs, tag);
    if (!label) continue;
    const insertAt = index + fullTag.length - (fullTag.endsWith('/>') ? 2 : 1);
    edits.push({ start: insertAt, end: insertAt, text: ` aria-label="${escapeAttr(label)}"` });
    ariaLabelsAdded += 1;
  }

  if (!edits.length) return source;
  return applyEdits(source, edits);
}

function isWrappedByLabel(html, controlIndex) {
  const open = html.lastIndexOf('<label', controlIndex);
  if (open === -1) return false;
  const close = html.lastIndexOf('</label>', controlIndex);
  return open > close;
}

function hasLabelFor(html, id) {
  return new RegExp(`<label\\b[^>]*\\bfor=["']${escapeRegExp(id)}["']`, 'i').test(html);
}

function findNearbyLabelEdit(html, controlIndex, id) {
  const windowStart = Math.max(0, controlIndex - 900);
  const before = html.slice(windowStart, controlIndex);
  const labelMatches = [...before.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>\s*$/gi)];
  const label = labelMatches[labelMatches.length - 1];
  if (!label) return null;
  const attrs = label[1] || '';
  if (/\bfor\s*=/i.test(attrs)) return null;
  const labelText = stripTags(label[2] || '').trim();
  if (!labelText && !/&nbsp;/.test(label[2] || '')) return null;
  const labelTagStart = windowStart + label.index;
  const openingEnd = html.indexOf('>', labelTagStart);
  if (openingEnd === -1 || openingEnd > controlIndex) return null;
  const between = html.slice(openingEnd + 1, controlIndex);
  if (/<(input|select|textarea)\b/i.test(between)) return null;
  return { start: openingEnd, end: openingEnd, text: ` for="${escapeAttr(id)}"` };
}

function inferControlLabel(html, controlIndex, attrs, tag) {
  const placeholder = attr(attrs, 'placeholder');
  if (placeholder && !/^\s*(0|https?:\/\/|\+?\d*\.?\d*)\s*$/i.test(placeholder)) return cleanLabel(placeholder);
  const title = attr(attrs, 'title');
  if (title) return cleanLabel(title);
  const name = attr(attrs, 'name');
  if (name) return humanize(name);
  const id = attr(attrs, 'id');
  if (id) return humanize(id);

  const windowStart = Math.max(0, controlIndex - 500);
  const before = html.slice(windowStart, controlIndex);
  const nearby = before.match(/<(?:span|div|p)\b[^>]*class=["'][^"']*(?:label|title|heading|name)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p)>\s*$/i);
  if (nearby) return cleanLabel(stripTags(nearby[1]));
  return tag === 'textarea' ? 'Text entry' : tag === 'select' ? 'Select option' : 'Input value';
}

function applyEdits(text, edits) {
  let output = text;
  const ordered = edits.sort((a, b) => b.start - a.start);
  for (const edit of ordered) {
    output = `${output.slice(0, edit.start)}${edit.text}${output.slice(edit.end)}`;
  }
  return output;
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? decodeHtml(match[1].trim()) : '';
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanLabel(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function humanize(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim()
    .slice(0, 120);
}

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}
